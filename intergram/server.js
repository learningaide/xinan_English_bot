const request = require('request');
const compression = require('compression');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const dotenv = require("dotenv")
const WebSocket = require('ws');
dotenv.config()
let global_user_id = 0;
let global_chat_id = 0;
const found_words = {}

/*let ws = new WebSocket('ws://ai.real-impact.org:10001/websocket', {
  perMessageDeflate: false
});*/
let ws;

http.listen(3000, () => {
    console.log("started http + websocket server on port 3000");
});

/*io.on('connection', (socket) => {
    ws = socket;
    console.log("AI connected")

    ws.on('open', () => {
        ws.send(JSON.stringify({"text":'hi'}));
        ws.send(JSON.stringify({"text":'begin'}));
    });  
    
}); */

app.use(express.static('dist', {index: 'demo.html', maxage: '4h'}));
app.use(bodyParser.json());

// handle admin Telegram messages
app.post('/hook', function(req, res){
    try {
        const message = req.body.message || req.body.channel_post;
        console.log(message)
        const chatId = message.chat.id;
        const name = message.chat.first_name || message.chat.title || "admin";
        const text = message.text || "";
        const reply = message.reply_to_message;

        if (text.startsWith("/start")) {
            console.log("/start chatId " + chatId);
            sendTelegramMessage(chatId,
                "*Welcome to Intergram* \n" +
                "Your unique chat id is `" + chatId + "`\n" +
                "Use it to link between the embedded chat and this telegram chat",
                "Markdown");
        } else if (reply) {
            let replyText = reply.text || "";
            let userId = replyText.split(':')[0];
            io.to(userId).emit(chatId + "-" + userId, {name, text, from: 'admin'});
        } else if (text){
            io.emit(chatId, {name, text, from: 'admin'});
        }

    } catch (e) {
        console.error("hook error", e, req.body);
    }
    res.statusCode = 200;
    res.end();
});

// handle chat visitors websocket messages
io.on('connection', (socket) => {

    socket.on('registerAI', (registerMsg) => {
        ws = socket;
        console.log("AI registered");
        ws.on('message', (data) => {
            const parsedData = JSON.parse(data)
            console.log('received from AI: %s', parsedData);
            const text = parsedData["text"];
            const chatId = parsedData["chatId"];
            const userId = parsedData["userId"];
            console.log(text);
            console.log(chatId);
            console.log(userId)
            sendTelegramMessage(chatId, "AI said to "+userId + ": " + text);
            io.to(userId).emit(chatId + "-" + userId, {from: "admin", text, name: "AI"});

            const words = ["apple", "tree", "Eiffel", "Germany", "excellent"]
            if(words.some(el => text.includes(el))){
                console.log("bingo word "+text)
                const bingo_words = words.filter(el => text.includes(el));
                console.log(bingo_words);
                if(!found_words[chatId]){
                    found_words[chatId] = [];
                }
                found_words[chatId] = [...found_words[chatId], ...bingo_words];
                console.log(found_words[chatId]);
                if(found_words[chatId].length == 5){
                    io.emit(chatId, {name: "Admin", text: `BINGO! You win!! Please give feedback to improve the learning game.`, from: 'admin'});    
                }
                else{
                    const difference =  words.filter(x => !found_words[chatId].includes(x));
                    // we would want to use a color to show newly found words
                    io.emit(chatId, {name: "Admin", text: `You found the words:/你找到了这些词: ${found_words[chatId].join(", ")}, still missing: ${difference.join(", ")}`, from: 'admin'});    
                }
            }
    
        });
    });

    socket.on('register', (registerMsg) => {
        console.log(registerMsg);
        let userId = registerMsg.userId;
        let chatId = registerMsg.chatId;
        let messageReceived = false;
        socket.join(userId);
        console.log("useId " + userId + " connected to chatId " + chatId);
        socket.on('message', (msg) => {
            messageReceived = true;
            console.log(msg);
            io.to(userId).emit(chatId + "-" + userId, msg);
            let visitorName = msg.visitorName ? "[" + msg.visitorName + "]: " : "";
            sendTelegramMessage(chatId, userId + ":" + visitorName + " " + msg.text);
            const words = ["apple", "tree", "Eiffel", "Germany", "excellent"]
            if(words.some(el => msg.text.includes(el))){
                console.log("forbidden word "+msg.text)
                const forbidden_words = words.filter(el => msg.text.includes(el)).join(", ");
                io.emit(chatId, {name: "Admin", text: `You cannot use the forbidden words:/您不能使用禁用词: ${forbidden_words}`, from: 'admin'});
            }
            else{
                if(ws){
                    ws.send(JSON.stringify({"chatId": chatId, "userId": userId, "text":msg.text}));
                }
            }
        });

        socket.on('disconnect', function(){
            if (messageReceived) {
                sendTelegramMessage(chatId, userId + " has left");
            }
        });
    });

});

function sendTelegramMessage(chatId, text, parseMode) {
    console.log(chatId, text, process.env.TELEGRAM_TOKEN);
    request
        .post('https://api.telegram.org/bot' + process.env.TELEGRAM_TOKEN + '/sendMessage')
        .form({
            "chat_id": chatId,
            "text": text,
            "parse_mode": parseMode
        });
}

app.post('/usage-start', cors(), (req, res) => {
    console.log('usage from', req.query.host);
    res.statusCode = 200;
    res.end();
});

// left here until the cache expires
app.post('/usage-end', cors(), (req, res) => {
    res.statusCode = 200;
    res.end();
});

app.get("/.well-known/acme-challenge/:content", (req, res) => {
    res.send(process.env.CERTBOT_RESPONSE);
});
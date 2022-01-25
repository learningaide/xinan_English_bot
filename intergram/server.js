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

const ws = new WebSocket('ws://ai.real-impact.org:10001/websocket', {
  perMessageDeflate: false
});
ws.on('open', function open() {
    ws.send(JSON.stringify({"text":'hi'}));
    ws.send(JSON.stringify({"text":'begin'}));
});
ws.on('message', function message(data) {
    const parsedData = JSON.parse(data)
    console.log('received: %s', parsedData);
    console.log(global_user_id);
    console.log(global_chat_id);
    const text = parsedData["text"];
    console.log(text)
    io.to(global_user_id).emit(global_chat_id + "-" + global_user_id, {from: "admin", text, name: "AI"});
});  
  
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
io.on('connection', function(socket){

    socket.on('register', function(registerMsg){
        let userId = registerMsg.userId;
        let chatId = registerMsg.chatId;
        global_user_id = userId;
        global_chat_id = chatId;
        let messageReceived = false;
        socket.join(userId);
        console.log("useId " + userId + " connected to chatId " + chatId);

        socket.on('message', function(msg) {
            messageReceived = true;
            console.log(msg);
            io.to(userId).emit(chatId + "-" + userId, msg);
            let visitorName = msg.visitorName ? "[" + msg.visitorName + "]: " : "";
            sendTelegramMessage(chatId, userId + ":" + visitorName + " " + msg.text);
            ws.send(JSON.stringify({"text":msg.text}));
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

app.post('/usage-start', cors(), function(req, res) {
    console.log('usage from', req.query.host);
    res.statusCode = 200;
    res.end();
});

// left here until the cache expires
app.post('/usage-end', cors(), function(req, res) {
    res.statusCode = 200;
    res.end();
});

http.listen(process.env.PORT || 3000, function(){
    console.log('listening on port:' + (process.env.PORT || 3000));
});

app.get("/.well-known/acme-challenge/:content", (req, res) => {
    res.send(process.env.CERTBOT_RESPONSE);
});

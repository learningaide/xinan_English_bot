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
const score = {}

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

const topic = "University";
//const word_list = ["apple", "tree", "Eiffel", "Germany", "Paris", "pear", "forest", "France", "banana", "Berlin"]
const word_list = ["associate's degree","bachelor's degree","campus","community college","course","credit","degree","dorm","enroll","exam","faculty","fail","financial aid","fraternity","GPA","graduate","graduate","instructor","lecture","major","master's degree","matriculate","notebook","notes","pass","PhD","postgraduate","prerequisite","professor","quiz","register","research","research","room and board","roommate","semester","sorority","spring break","syllabus","textbook","transcript","trimester","tuition","undergraduate","university"];
const words = word_list.slice(0,word_list.length/2);
const hidden_words = word_list.slice(word_list.length/2);
const all_words = words.concat(hidden_words);
const forbidden_words = ["Tibet", "genocide", "Tiananmen"];

// handle chat visitors websocket messages
io.on('connection', (socket) => {

    socket.on('registerAI', (registerMsg) => {
        ws = socket;
        console.log("AI registered");
        ws.on('message', (data) => {
            const parsedData = JSON.parse(data)
            console.log('received from AI: %s', parsedData);
            const text = parsedData["text"].replace("_POTENTIALLY_UNSAFE__","");
            const chatId = parsedData["chatId"];
            const userId = parsedData["userId"];
            console.log(text);
            console.log(chatId);
            console.log(userId)
            sendTelegramMessage(chatId, "AI said to "+userId + ": " + text);
            io.to(userId).emit(chatId + "-" + userId, {from: "admin", text, name: "AI"});

            if(all_words.some(el => text.includes(el))){
                if(!found_words[userId]){
                    found_words[userId] = [];
                }
                
                console.log("bingo word "+text)
                const bingo_words = all_words.filter(el => text.includes(el)).filter(el => !found_words[userId].includes(el));
                console.log(bingo_words);
                
                const found_words_str = [...found_words[userId], ...(bingo_words.map(w=>"*"+w+"*"))];
                found_words[userId] = [...found_words[userId], ...bingo_words];
                console.log(found_words[userId]);

                const difference =  words.filter(x => !found_words[userId].includes(x));
                const num_mh = hidden_words.filter(x => !found_words[userId].includes(x)).length;
                // we would want to use a color to show newly found words
                io.emit(chatId, {name: "Admin", text: `You found the words:/你找到了这些词: ${found_words_str.join(", ")}, still missing: ${difference.join(", ")} and ${num_mh} hidden words.`, from: 'admin'});    

                if(found_words[userId].length == 5){
                    io.emit(chatId, {name: "Admin", text: `BINGO! You win!! Please give feedback to improve the learning game.`, from: 'admin'});    
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
        io.emit(chatId, {name: "Admin", text: `Your target words are about the topic "${topic}": ${words.join(", ")} and there are ${hidden_words.length} hidden target words.`, from: 'admin'});

        socket.on('message', (msg) => {
            messageReceived = true;
            console.log(msg);
            io.to(userId).emit(chatId + "-" + userId, msg);
            let visitorName = msg.visitorName ? "[" + msg.visitorName + "]: " : "";
            sendTelegramMessage(chatId, userId + ":" + visitorName + " " + msg.text);
            const num_words = msg.text.split(" ");
            const found_target_words = words.filter(el => msg.text.includes(el));
            if(forbidden_words.some(el => msg.text.toLowerCase().includes(el.toLowerCase()))){
                io.emit(chatId, {name: "Admin", text: `Your message contains inappropriate content. 您的消息包含不当内容.`, from: 'admin'});
            }
            else if(num_words.length < 5){
                console.log("You need to write at least 7 words / 你需要写至少7个字.")
                io.emit(chatId, {name: "Admin", text: `You need to write at least 5 words / 你需要写至少7个字.`, from: 'admin'});
            }
            else if(msg.text.match(/[\u3400-\u9FBF]/)){
                console.log("You cannot use any Chinese characters / 你不能使用任何汉字."+msg.text)
                io.emit(chatId, {name: "Admin", text: `You cannot use any Chinese characters / 你不能使用任何汉字.`, from: 'admin'});
            }
            else if(found_target_words.length > 0){
                console.log(`forbidden words ${found_target_words} - from ${msg.text}`);
                io.emit(chatId, {name: "Admin", text: `You cannot use the target words: ${found_target_words.join(", ")}/您不能使用禁用词: ${found_target_words}`, from: 'admin'});
            }
            else{
                // correct spelling
                var writeGood = require('write-good');
                var suggestions = writeGood(msg.text, { passive: false, whitelist: ['read-only'] });
                console.log(suggestions);
                if(suggestions.length > 0){
                    const suggestions_str = suggestions.map((el)=>el.reason).join(", ");
                    io.emit(chatId, {name: "Admin", text: `I have the following suggestions... 我有以下建议... ${suggestions_str}`, from: 'admin'});
                }
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
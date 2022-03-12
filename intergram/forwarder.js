const WebSocket = require('ws');
const io = require("socket.io-client");

chatId_map_ws = {}
chatId_map_uid = {}

console.log("starting forwarder")
const ws_chat = io('wss://server.real-impact.org', {
//const ws_chat = io('ws://localhost:3000', {
  perMessageDeflate: false,
  rejectUnauthorized: false
});

ws_chat.on('connect', () => {
    console.log("connection openend to chat server");
    ws_chat.emit('registerAI', {});
});

let ws_AI;

ws_chat.on('message', (data) => {
    const parsedData = JSON.parse(data)
    console.log('received from chatserver: %s', parsedData);
    // open a new websocket connection for each chat
    let userId = parsedData['userId'];
    let chatId = parsedData['chatId'];
    let counter = 0;
    if(typeof(chatId_map_ws[chatId]) == 'undefined'){
        console.log("opening new websocket")
        chatId_map_ws[chatId] = new WebSocket('ws://localhost:10001/websocket', {
            perMessageDeflate: false
          });
        chatId_map_uid[userId] = userId;
        chatId_map_ws[chatId].on('open', () => {
            console.log("connection openend to AI server");
            chatId_map_ws[chatId].send(JSON.stringify({"text":'hi'}));
            chatId_map_ws[chatId].send(JSON.stringify({"text":'begin'}));
        });
        const onmessage = (data) => { // do not use arrow function so context is saved
            const parsedData = JSON.parse(data)
            console.log('received from AI: %s', parsedData);
            console.log(counter)
            if(counter >= 2){
                text = JSON.stringify({...parsedData, chatId, userId});
                console.log(text);
                ws_chat.send(text);
            };
            counter++;
        }
        chatId_map_ws[chatId].on('message', onmessage);
    } else{
        //console.log(chatId_map[chatId]);
        chatId_map_ws[chatId].send(data);
    }
    
});  



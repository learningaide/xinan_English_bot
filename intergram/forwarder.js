const WebSocket = require('ws');
const io = require("socket.io-client");

// chatId is always the same
userId_map_ws = {}
userId_map_uid = {}

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
    if(typeof(userId_map_ws[userId]) == 'undefined'){
        console.log("opening new websocket")
        userId_map_ws[userId] = new WebSocket('ws://localhost:10001/websocket', {
            perMessageDeflate: false
          });
        userId_map_uid[userId] = userId;
        userId_map_ws[userId].on('open', () => {
            console.log("connection openend to AI server");
            userId_map_ws[userId].send(JSON.stringify({"text":'hi'}));
            userId_map_ws[userId].send(JSON.stringify({"text":'begin'}));
            setTimeout(()=>userId_map_ws[userId].send(data),1000); // need to wait a bit
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
        userId_map_ws[userId].on('message', onmessage); 
    } else{
        //console.log(userId_map[chatId]);
        userId_map_ws[userId].send(data);
    }
    
});  



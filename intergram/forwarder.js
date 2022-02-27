const WebSocket = require('ws');

console.log("starting forwarder")
const ws_chat = new WebSocket('ws://server.real-impact.org/websocket', {
  perMessageDeflate: false,
  rejectUnauthorized: false
});

const ws_AI = new WebSocket('ws://localhost:10001/websocket', {
  perMessageDeflate: false
});


ws_AI.on('open', function open() {
    console.log("connection openend to AI server");
});

ws_chat.on('open', function open() {
    console.log("connection openend to chat server");
});

ws_chat.on('message', function message(data) {
    const parsedData = JSON.parse(data)
    console.log('received: %s', parsedData);
    ws_AI.send(data);
    }
);  

ws_AI.on('open', () => {
    console.log("connection openend to chat server");
    ws_AI.send(JSON.stringify({"text":'hi'}));
    ws_AI.send(JSON.stringify({"text":'begin'}));
});

counter = 0;
ws_AI.on('message', function message(data) {
    const parsedData = JSON.parse(data)
    console.log('received: %s', parsedData);
    console.log(counter)
    if(counter >= 2){
        ws_chat.send(data);
    }
    counter++;
    }
);  
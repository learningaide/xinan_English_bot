import * as store from 'store2'
import io from 'socket.io-client'

import { h, Component } from 'preact';
import MessageArea from './message-area';

export default class Chat extends Component {

    autoResponseState = 'pristine'; // pristine, set or canceled
    autoResponseTimer = 0;

    
    constructor(props) {
        super(props);
        if (store.enabled) {
            this.messagesKey = 'messages' + '.' + props.chatId + '.' + props.host;
            this.state = {messages: store.get(this.messagesKey) || store.set(this.messagesKey, []),  recording: false};
        } else {
            this.state = {messages: [], recording: false};
        }
    }

    componentDidMount() {
        this.socket = io.connect();
        this.socket.on('connect', () => {
            this.socket.emit('register', {chatId: this.props.chatId, userId: this.props.userId });
        });
        this.socket.on(this.props.chatId, this.incomingMessage);
        this.socket.on(this.props.chatId+'-'+this.props.userId, this.incomingMessage);

        if (!this.state.messages.length) {
            this.writeToMessages({text: this.props.conf.introMessage, from: 'admin'});
        }

        var constraints = { audio: true };
        navigator.mediaDevices.getUserMedia(constraints).then((mediaStream) => {
            this.mediaRecorder = new MediaRecorder(mediaStream);
            this.mediaRecorder.onstart = (e) => {
                this.chunks = [];
            };
            this.mediaRecorder.ondataavailable = (e) => {
                //console.log(this.chunks)
                this.chunks.push(e.data);
            };
            this.mediaRecorder.onstop = (e) => {
                var blob = new Blob(this.chunks, { 'type' : 'audio/ogg; codecs=opus' });
                this.socket.emit('radio', blob);
                console.log("audio sent");
            };
        });

        // When the client receives a voice message it will play the sound
        console.log("registered voice handler")
        this.socket.on('voice', (arrayBuffer) => {
            var blob = new Blob([arrayBuffer], { 'type' : 'audio/ogg; codecs=opus' });
            var audio = document.createElement('audio');
            audio.src = window.URL.createObjectURL(blob);
            audio.play();
        });
    }

    render({},state) {
        return (
            <div>
                <MessageArea messages={state.messages} conf={this.props.conf}/>
                <div>
                    <input class="textarea" type="text" placeholder={"Send a message..."}
                        ref={(input) => { this.input = input }}
                        onKeyPress={this.handleKeyPress}/>
                </div>
                <div style={{position: "fixed", bottom: "50px"}}>
                    {
                    this.state.recording ? 
                        <button onClick={()=> {
                            // Stop recording and broadcast it to server
                            this.mediaRecorder.stop();
                            console.log("recording stopped");
                            this.setState({
                                recording: false
                            });
                        }}
                        >Finish recording</button> : 
                        <button onClick={()=> {
                            // Start recording
                            this.mediaRecorder.start();
                            this.setState({
                                recording: true
                            });
                        }}>Start recording</button>
                    }
                </div>
                <a class="banner" target="_blank">
                    Powered by <b>ACE</b>&nbsp;
                </a>
            </div>
        );
    }

    handleKeyPress = (e) => {
        if (e.keyCode == 13 && this.input.value) {
            let text = this.input.value;
            this.socket.send({text, from: 'visitor', visitorName: this.props.conf.visitorName});
            this.input.value = '';

            if (this.autoResponseState === 'pristine') {

                setTimeout(() => {
                    this.writeToMessages({
                        text: this.props.conf.autoResponse,
                        from: 'admin'});
                }, 500);

                this.autoResponseTimer = setTimeout(() => {
                    this.writeToMessages({
                        text: this.props.conf.autoNoResponse,
                        from: 'admin'});
                    this.autoResponseState = 'canceled';
                }, 60 * 1000);
                this.autoResponseState = 'set';
            }
        }
    };

    incomingMessage = (msg) => {
        this.writeToMessages(msg);
        if (msg.from === 'admin') {
            document.getElementById('messageSound').play();

            if (this.autoResponseState === 'pristine') {
                this.autoResponseState = 'canceled';
            } else if (this.autoResponseState === 'set') {
                this.autoResponseState = 'canceled';
                clearTimeout(this.autoResponseTimer);
            }
        }
    };

    writeToMessages = (msg) => {
        msg.time = new Date();
        this.setState({
            message: this.state.messages.push(msg)
        });

        if (store.enabled) {
            try {
                store.transact(this.messagesKey, function (messages) {
                    messages.push(msg);
                });
            } catch (e) {
                console.log('failed to add new message to local storage', e);
                store.set(this.messagesKey, [])
            }
        }
    }
}

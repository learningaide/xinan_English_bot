#!/usr/bin/env python

from nix.models.TTS import NixTTSInference
import scipy.io
from pydub import AudioSegment
import socketio
import json

# Initiate Nix-TTS
nix = NixTTSInference(model_dir = "./nix-ljspeech-stochastic-v0.1/")

# standard Python
sio = socketio.Client()

@sio.event
def connect():
    print("I'm connected!")

@sio.event
def connect_error(data):
    print("The connection failed!")

@sio.event
def disconnect():
    print("I'm disconnected!")

@sio.event
def message(data):
    print('I received a message for TTS!')
    data = json.loads(data)
    print(data)
    # Tokenize input text
    # needs phonemizer==2.2.2
    c, c_length, phoneme = nix.tokenize(data["text"])
    # Convert text to raw speech
    xw = nix.vocalize(c, c_length)
    print(xw, c_length)
    scipy.io.wavfile.write("transcript.wav", 22050, xw)
    AudioSegment.from_wav("transcript.wav").export("transcript.mp3", format="mp3")
    with open('transcript.wav', 'rb') as f:
        audio_data = f.read()
    sio.emit('message', {'chatId': data["chatId"], 'userId': data["userId"], 'audio': audio_data})

@sio.on('my message')
def on_message(data):
    print("special message TTS")
    

sio.connect('wss://server.real-impact.org')
#sio.connect('http://localhost:3000')
print('my sid is', sio.sid)

sio.emit('registerTTS', {'foo': 'bar'})



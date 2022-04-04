import socketio
import speech_recognition as sr
from os import path
from pydub import AudioSegment
import json
import scipy.io
from scipy.io.wavfile import write
import numpy as np
import io
import soundfile as sf

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
    print('I received a message for SR!')
    data = json.loads(data)
    #print(data["audio"])
    # convert mp3 file to wav                                                       
    #sound = AudioSegment.from_mp3("transcript.mp3")
    #sound.export("transcript.wav", format="wav")

    # transcribe audio file     
    # wav somehow cannot be loaded diractly 
    # ValueError: Audio file could not be read as PCM WAV, AIFF/AIFF-C, or Native FLAC; check if file is corrupted or in another
    bufferstr = data["audio"]
    list_of_bytes = bytes(bufferstr["data"])

    f = open('./transcript.mp3', 'wb')
    f.write(list_of_bytes)
    f.close()

    sound = AudioSegment.from_file("transcript.mp3")
    sound.export("transcript.wav", format="wav")

    AUDIO_FILE = "transcript.wav"

    # use the audio file as the audio source                                        
    r = sr.Recognizer()
    with sr.AudioFile(AUDIO_FILE) as source:
        audio = r.record(source)  # read the entire audio file                  

    # recognize speech using Vosk
    # need to install from source repo
    try:
        text = json.loads(r.recognize_vosk(audio))
        print("Vosk thinks you said " + str(text))
    except sr.UnknownValueError:
        text = "Please contact support"
        print("Vosk could not understand audio")
    except sr.RequestError as e:
        text = "Please contact support"
        print("Vosk error; {0}".format(e))

    sio.emit('message', {'chatId': data["chatId"], 'userId': data["userId"], 'text': text["text"]})

@sio.on('my message')
def on_message(data):
    print("special message SR")

sio.connect('wss://server.real-impact.org')
#sio.connect('http://localhost:3000')
print('my sid is', sio.sid)

sio.emit('registerSR', {'foo': 'bar'})


#sound = AudioSegment.from_mp3("transcript.wav")
#sound = AudioSegment.from_file("transcript.mp3")

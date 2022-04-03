import speech_recognition as sr
from os import path
from pydub import AudioSegment

# convert mp3 file to wav                                                       
sound = AudioSegment.from_mp3("transcript.mp3")
sound.export("transcript.wav", format="wav")

# transcribe audio file     
# wav somehow cannot be loaded diractly 
# ValueError: Audio file could not be read as PCM WAV, AIFF/AIFF-C, or Native FLAC; check if file is corrupted or in another                                                   
AUDIO_FILE = "transcript.wav"

# use the audio file as the audio source                                        
r = sr.Recognizer()
with sr.AudioFile(AUDIO_FILE) as source:
    audio = r.record(source)  # read the entire audio file                  

# recognize speech using Vosk
# need to install from source repo
try:
    print("Vosk thinks you said " + r.recognize_vosk(audio))
except sr.UnknownValueError:
    print("Vosk could not understand audio")
except sr.RequestError as e:
    print("Vosk error; {0}".format(e))
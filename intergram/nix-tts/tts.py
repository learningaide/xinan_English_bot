from nix.models.TTS import NixTTSInference
import scipy.io
from pydub import AudioSegment

# Initiate Nix-TTS
nix = NixTTSInference(model_dir = "./nix-ljspeech-stochastic-v0.1/")
# Tokenize input text
# needs phonemizer==2.2.2
c, c_length, phoneme = nix.tokenize("Born to multiply, born to gaze into night skies.")
# Convert text to raw speech
xw = nix.vocalize(c, c_length)
print(xw, c_length)
scipy.io.wavfile.write("transcript.wav", 22050, xw)
AudioSegment.from_wav("transcript.wav").export("transcript.mp3", format="mp3")

# Xinan ETH English bot

## Motivation
Conversation is a relaxing and effective way to learn English, but it can be difficult to find native speakers to talk to. Therefore we designed this chatbot. It uses several AI models in the field of NLP, in particular conversational AI ("the chatbot"), grammar correction, translation, speech-to-text, as well as speech synthesis. In order to motivate people to talk to the chatbot we gamified the experience, adding target topic words which have to be discovered during the conversation in order to receive points.

For the testing and development we are working together with students from Southwest University in Chongqing China. We are very grateful for their contribution.

# Deployment
## credentials
- For training the chatbot AI https://colab.research.google.com/drive/1N1dH_85m9NFA1fsvCAZ0n3zukuO8o7N-#scrollTo=nRJGRtMKmIWV  
- Deploy this repo to your own server.
- Set an .env variable named TELEGRAM_TOKEN 
- Make a GET request to the following url 
- https://api.telegram.org/[token]/setWebhook?url=server.real-impact.org/hook 
- Open a chat with your bot and hit /start to get your unique chat ID

## server setup
ssh root@188.166.228.198
apt update
apt install docker.io -y
## inside the intergram folder
docker build . -t jonathanlehner/xinan_english
docker push jonathanlehner/xinan_english

DOCKER_HOST="ssh://root@188.166.228.198" docker pull jonathanlehner/xinan_english
DOCKER_HOST="ssh://root@188.166.228.198" docker-compose up -d

On AWS:
- ssh ubuntu@3.234.146.51 -i ~/Downloads/rl.pem
- copy compose.yml to server
- sudo docker pull jonathanlehner/xinan_english
- sudo docker-compose up -d

## TODO
- Translation
- Spell correction: 
  - https://github.com/cfinke/Typo.js/ 
  - Node-hun
  - https://github.com/wooorm/nspell 
  - https://github.com/GitbookIO/rousseau 
- One-script deploy

# Step 2: clone ParlAI fork
git clone https://github.com/JonathanLehner/ParlAI
cd ParlAI
apt-get update 
apt install pipenv -y
pipenv shell
##apt install python3-pip -y
pip install -r requirements.txt
pip install .
nohup python parlai/chat_service/services/browser_chat/run.py --config-path parlai/chat_service/tasks/chatbot/config.yml --port 10001 &
nohup ... &

## good models
zoo:blender/blender_400Mdistill/model
zoo:blender/blender_90M/model
zoo:blenderbot2/blenderbot2_400M/model

## might need to install speech recognition from source
pip install git+https://github.com/Uberi/speech_recognition
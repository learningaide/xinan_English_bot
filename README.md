# xinan_English_bot
t.me/xinan_English_bot 
telegram token: 5152889973:AAFvHC3nbsvGyMHbmsIfglettN1joXcH0gQ
Talk to Telegram @BotFather, create a new bot and get its API Token.

Deploy this repo to your own chat server.

Clone it locally and install or if you use Heroku, fork this repository and point the new app to it.
Set an .env variable named TELEGRAM_TOKEN with the value you got from @BotFather
Point the bot webhook to your bot server by making a GET request to the following url 
https://api.telegram.org/bot5152889973:AAFvHC3nbsvGyMHbmsIfglettN1joXcH0gQ/setWebhook?url=server.real-impact.org/hook (Don't forget to replace with your token and server url)

Open a chat with your bot and hit /start to get your unique chat ID

Embed this code snippet in your website

<script> 
    window.intergramId = "Your unique chat ID"
    window.intergramServer = "Server url"
</script>
<script id="intergram" type="text/javascript" src="<Server url>/js/widget.js"></script>


# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
## inside the intergram folder
docker build . -t jonathanlehner/xinan_english
docker push jonathanlehner/xinan_english
DOCKER_HOST="ssh://root@104.248.152.16" docker pull jonathanlehner/xinan_english
DOCKER_HOST="ssh://root@104.248.152.16" docker-compose up -d

docker images
docker run -p 80:3000 -d jonathanlehner/xinan_english

# enable swap
swapon --show
free -h
df -h
fallocate -l 38G /swapfile
ls -lh /swapfile
chmod 600 /swapfile
ls -lh /swapfile
mkswap /swapfile
swapon /swapfile
swapon --show
free -h
cp /etc/fstab /etc/fstab.bak
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# clone ParlAI fork
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

zoo:blender/blender_400Mdistill/model
zoo:blender/blender_90M/model
zoo:blenderbot2/blenderbot2_400M/model




DOCKER_HOST="ssh://root@104.248.152.16" docker pull jonathanlehner/xinan_english && DOCKER_HOST="ssh://root@104.248.152.16" docker run -t -d --network host jonathanlehner/xinan_english

# https://stackoverflow.com/questions/62224447/creating-lets-encrypt-certificate-certbot-within-docker-image

# was helpful
https://sitegeist.de/blog/typo3-blog/docker-compose-setup-mit-nginx-reverse-proxy.html 

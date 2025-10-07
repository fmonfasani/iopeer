import os, requests
from dotenv import load_dotenv

load_dotenv()
VOICE_ID = os.getenv("VOICE_ID")

with open("outputs/script_01.txt", "r", encoding="utf-8") as f:
    texto = f.read()

headers = {
    "xi-api-key": os.getenv("ELEVEN_API_KEY"),
    "Content-Type": "application/json"
}
data = {
    "text": texto,
    "voice_settings": {"stability": 0.4, "similarity_boost": 0.8}
}

url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
r = requests.post(url, headers=headers, json=data)

os.makedirs("outputs", exist_ok=True)
with open("outputs/voice_01.mp3", "wb") as f:
    f.write(r.content)
print("✅ Voz generada con ElevenLabs")

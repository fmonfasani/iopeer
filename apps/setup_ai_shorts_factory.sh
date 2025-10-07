#!/bin/bash
set -e

echo "🚀 Creando estructura del proyecto AI Shorts Factory..."

# Crear carpetas base
mkdir -p ai-shorts-factory/{scripts,outputs,assets,notion}
cd ai-shorts-factory

# =============================
# Archivos base
# =============================
touch assets/logo.png assets/music_bed.mp3 notion/content_db.json .env requirements.txt README.md

# =============================
# requirements.txt
# =============================
cat << 'EOF' > requirements.txt
openai>=1.12.0
requests
python-dotenv
moviepy
notion-client
EOF

# =============================
# .env (plantilla)
# =============================
cat << 'EOF' > .env
# 🔐 API Keys
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVEN_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 🎙️ ElevenLabs voice ID (configurable)
VOICE_ID=YOUR_VOICE_ID
EOF

# =============================
# README.md
# =============================
cat << 'EOF' > README.md
# 🎬 AI Shorts Factory

Automatiza la creación de shorts con IA:
- 🧠 Guion: OpenAI GPT-4o
- 🎙️ Voz: ElevenLabs
- 🎥 Video: RunwayML
- ✂️ Edición: CapCut
- ⚙️ Automatización: Python
- 📊 Gestión: Notion

## Requisitos
- Python 3.10+
- Claves de API de OpenAI, ElevenLabs y Notion

## Instalación
\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Ejecución
\`\`\`bash
python scripts/runner.py
\`\`\`
EOF

# =============================
# scripts/generate_script.py
# =============================
cat << 'EOF' > scripts/generate_script.py
from openai import OpenAI
import os, json
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

prompt = """
Genera un guion de 60 segundos para un short de YouTube sobre 
"Cómo los agentes autónomos pueden ahorrar tiempo a emprendedores".
Incluye: Hook, desarrollo, cierre con CTA.
Devuelve formato JSON: {"titulo": "...", "texto": "..."}
"""

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": prompt}],
)

data = json.loads(response.choices[0].message.content)
os.makedirs("outputs", exist_ok=True)
with open("outputs/script_01.txt", "w", encoding="utf-8") as f:
    f.write(data["texto"])
print(f"✅ Guion generado: {data['titulo']}")
EOF

# =============================
# scripts/generate_voice.py
# =============================
cat << 'EOF' > scripts/generate_voice.py
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
EOF

# =============================
# scripts/generate_video.py
# =============================
cat << 'EOF' > scripts/generate_video.py
import moviepy.editor as mp
import os

voice = mp.AudioFileClip("outputs/voice_01.mp3")
bg = mp.ColorClip(size=(1080,1920), color=(0,0,0), duration=voice.duration)

final = bg.set_audio(voice)
final.write_videofile("outputs/video_01.mp4", fps=24)
print("🎬 Video base generado (placeholder)")
EOF

# =============================
# scripts/upload_notion.py
# =============================
cat << 'EOF' > scripts/upload_notion.py
import os, requests, json
from dotenv import load_dotenv

load_dotenv()
NOTION_API = os.getenv("NOTION_API_KEY")
DB_ID = os.getenv("NOTION_DB_ID")

payload = {
    "parent": {"database_id": DB_ID},
    "properties": {
        "Title": {"title": [{"text": {"content": "Short #01 - Agente Autónomo"}}]},
        "Tema": {"rich_text": [{"text": {"content": "IA + productividad"}}]},
    }
}

r = requests.post(
    "https://api.notion.com/v1/pages",
    headers={
        "Authorization": f"Bearer {NOTION_API}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    },
    json=payload
)

print("✅ Registro enviado a Notion")
EOF

# =============================
# scripts/runner.py
# =============================
cat << 'EOF' > scripts/runner.py
import subprocess

print("🚀 Iniciando pipeline completo de Shorts IA...")

subprocess.run(["python", "scripts/generate_script.py"])
subprocess.run(["python", "scripts/generate_voice.py"])
subprocess.run(["python", "scripts/generate_video.py"])
subprocess.run(["python", "scripts/upload_notion.py"])

print("✅ Proceso completado con éxito.")
EOF

# =============================
# Mensaje final
# =============================
echo "✅ Proyecto AI Shorts Factory generado correctamente."
echo "➡️ Ejecutá: cd ai-shorts-factory && pip install -r requirements.txt"
echo "➡️ Luego corré: python scripts/runner.py"

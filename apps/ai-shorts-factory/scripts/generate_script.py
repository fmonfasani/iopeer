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

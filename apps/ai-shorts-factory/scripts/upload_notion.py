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

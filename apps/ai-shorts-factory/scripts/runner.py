import subprocess

print("🚀 Iniciando pipeline completo de Shorts IA...")

subprocess.run(["python", "scripts/generate_script.py"])
subprocess.run(["python", "scripts/generate_voice.py"])
subprocess.run(["python", "scripts/generate_video.py"])
subprocess.run(["python", "scripts/upload_notion.py"])

print("✅ Proceso completado con éxito.")

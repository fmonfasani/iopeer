import moviepy.editor as mp
import os

voice = mp.AudioFileClip("outputs/voice_01.mp3")
bg = mp.ColorClip(size=(1080,1920), color=(0,0,0), duration=voice.duration)

final = bg.set_audio(voice)
final.write_videofile("outputs/video_01.mp4", fps=24)
print("🎬 Video base generado (placeholder)")

#!/usr/bin/env python3
"""Пережимает треки в 128 kbps MP3 (web) и складывает оригиналы в _work."""
import os
import shutil

import lameenc
import miniaudio

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(ROOT, "assets", "audio")
BACKUP = os.path.join(ROOT, "_work", "audio-orig")
os.makedirs(BACKUP, exist_ok=True)

FILES = ["andy-warhol.mp3", "dinastiya.mp3", "paris-love.mp3"]

for name in FILES:
    path = os.path.join(AUDIO, name)
    if not os.path.exists(path):
        print("skip, no file:", name)
        continue
    backup = os.path.join(BACKUP, name)
    if not os.path.exists(backup):
        shutil.copy2(path, backup)
    before = os.path.getsize(path)

    decoded = miniaudio.decode_file(
        backup,
        output_format=miniaudio.SampleFormat.SIGNED16,
        nchannels=2,
        sample_rate=44100,
    )
    pcm = decoded.samples.tobytes()

    enc = lameenc.Encoder()
    enc.set_bit_rate(128)
    enc.set_in_sample_rate(44100)
    enc.set_channels(2)
    enc.set_quality(3)
    data = enc.encode(pcm)
    data += enc.flush()
    with open(path, "wb") as fh:
        fh.write(data)
    after = os.path.getsize(path)
    print(f"{name}: {before/1024/1024:.2f} MB -> {after/1024/1024:.2f} MB ({(1-after/before)*100:.0f}% меньше)")

print("audio total:",
      round(sum(os.path.getsize(os.path.join(AUDIO, f)) for f in FILES) / 1024 / 1024, 2), "MB")

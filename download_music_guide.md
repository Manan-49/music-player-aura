
## Prerequisites — Full Guide

### What You Need Before Running

---

#### 1. 🐍 Python 3.8 or newer
**Download:** https://www.python.org/downloads/

> During installation — **check this box:**
> ✅ `Add Python to PATH`

Verify it works:
```cmd
python --version
```
Expected output: `Python 3.x.x`

---

#### 2. 📦 yt-dlp
> The script **auto-installs** this if missing.

To install manually:
```cmd
pip install yt-dlp
```

To update later:
```cmd
pip install -U yt-dlp
```

---

#### 3. 🎬 ffmpeg *(required for MP3 conversion)*
**Download:** https://www.gyan.dev/ffmpeg/builds/

| Step | Action |
|------|--------|
| 1 | Download `ffmpeg-release-essentials.zip` |
| 2 | Extract to `C:\ffmpeg` |
| 3 | Open **Start** → search `Environment Variables` |
| 4 | Under **System Variables** → click `Path` → `Edit` |
| 5 | Click `New` → type `C:\ffmpeg\bin` → OK |
| 6 | Close & reopen any CMD windows |

Verify it works:
```cmd
ffmpeg -version
```

---

#### 4. 📄 `links.txt` on your Desktop
Create a plain text file named exactly `links.txt` on your Desktop.

Put **one YouTube URL per line:**
```
https://www.youtube.com/watch?v=abc123
https://youtu.be/xyz456
https://www.youtube.com/watch?v=def789
```

> ⚠️ **Do not** paste playlist URLs unless you want the whole playlist.
> The script uses `--no-playlist` so only the single video audio is downloaded.

---

### How to Run

```
1. Save the .bat file anywhere (Desktop is fine)
2. Double-click it
3. Music appears in Desktop\Music\
```

---

### What Gets Downloaded

| Setting | Value |
|---------|-------|
| Format | MP3 |
| Quality | Best available (VBR ~320kbps) |
| Thumbnail | Embedded as album art |
| Metadata | Title, artist, embedded |
| Destination | `Desktop\Music\` |
| Filename | `Song Title.mp3` |

---

### Troubleshooting

| Error | Fix |
|-------|-----|
| `yt-dlp not found` | Script auto-installs, or run `pip install yt-dlp` |
| `ffmpeg not found` | Follow ffmpeg install steps above |
| `Python not found` | Re-install Python with "Add to PATH" checked |
| `links.txt not found` | Create the file on your Desktop |
| Download fails for some links | Those videos may be private or region-locked — script skips and continues |
| Thumbnail not embedded | Update yt-dlp: `pip install -U yt-dlp` |
# 🌱 StorySprout

StorySprout is a beautiful, kid-friendly, 100% frontend audiobook player that connects directly to a public Google Drive folder. Designed for young children (ages 4+), it features a distraction-free interface, massive navigation buttons, seamless progress saving, and automatic synchronization of audio files and cover art.

---

## ✨ Features

- **Google Drive Integration**: Zero backend required! The app connects directly to a Google Drive folder using the Google Drive v3 API. All you need is a shareable folder link and a free API Key.
- **Nested Series Support**: Organize your Google Drive with a 2-tier architecture. Put standalone books in one folder, and group related books (like "Magic Tree House") inside a Parent Series Folder. The app automatically detects this structure and groups them into Netflix-style horizontal rows!
- **Automatic Cover Art**: Drop a `cover.jpg` inside the folder, and StorySprout will use it. If a cover isn't found, it seamlessly talks to the Google Books API to download the official book cover.
- **Smart Progress Tracking**: Auto-saves playback position every 3 seconds to local storage. Books instantly show "▶ Resume" or "⭐ Finished!" badges in the library, picking up exactly where the child left off.
- **Kid-Friendly Player UI**: Full-screen immersive player, zero complex menus, giant Play/Pause buttons, and a huge "Rewind 15s" button.
- **Parent Dashboard**: A hidden admin interface to easily manually trigger library syncs.

---

## 📁 Google Drive Setup

Organize your audiobook folder exactly like this:

```text
📚 Main Audiobook Folder (Set to: "Anyone with the link can view")
 ├── 📁 Magic Tree House (A Series Folder)
 │    ├── 🖼️ cover.jpg (Optional: Series Cover Art)
 │    ├── 📁 Book 1 - Dinosaurs Before Dark
 │    │    ├── 🎵 Chapter 1.mp3
 │    │    └── 🎵 Chapter 2.mp3
 │    └── 📁 Book 2 - The Knight at Dawn
 │         └── 🎵 Chapter 1.mp3
 └── 📁 Harry Potter (A Standalone Book Folder)
      ├── 🖼️ cover.png (Optional: Specific Cover Art)
      └── 🎵 01.mp3
```

---

## 🚀 Deployment (Vercel)

StorySprout is a Vite React application designed to be deployed for free on Vercel.

1. Fork or push this repository to your GitHub account.
2. Sign in to [Vercel](https://vercel.com/) and create a **New Project**.
3. Import your `StorySprout` repository.
4. Add the following **Environment Variables** in the deployment settings:
   - `VITE_GOOGLE_DRIVE_FOLDER_ID` = `Your Google Drive Folder ID`
   - `VITE_GOOGLE_API_KEY` = `Your Google Cloud API Key`
5. Click **Deploy**. Your app is now live!

---

## 🛠️ Local Development

If you want to run or modify the app locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/storySprout.git
   cd kids-reading-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your keys:
   ```env
   VITE_GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
   VITE_GOOGLE_API_KEY=your_api_key_here
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

---
*Built with React, Zustand, localForage, and Lucide Icons.*

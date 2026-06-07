# 🌱 StorySprout

StorySprout is a 100% frontend, legacy-friendly (iOS 9.3.5 compatible) web application designed to act as a distraction-free audiobook player for kids. It sources audio directly from a shared Google Drive folder, eliminating the need for complex backend infrastructure, subscriptions, or storage limits.

## ✨ Features

- **Google Drive Integration**: Audiobooks are fetched dynamically from a public Google Drive folder. Books and chapters are automatically parsed from folders and audio files.
- **Legacy Device Support**: Built with minimal modern JavaScript and lightweight dependencies to ensure it runs smoothly on older devices like iPad minis running iOS 9.3.5.
- **Multi-Profile Support**: "Netflix-style" profile selection allows multiple children to use the same device with completely independent progression, libraries, and stats. Kids can pick their own cute avatars!
- **Smart Bookmarks**: The app remembers exact timestamps for *every* book. The library shelf displays "▶ Resume at [MM:SS]" badges so kids never lose their spot.
- **Smart Resume**: When resuming a book, the player automatically rewinds 5 seconds to provide a quick refresher.
- **Sleep Timer**: A built-in timer (10-30 mins) safely pauses playback to prevent battery drain if a child falls asleep.
- **Book Celebrations & Ratings**: When a child finishes a book, they get a confetti celebration and a 5-star rating widget!
- **Library Discovery**: A kid-friendly search bar, filter pills (Completed, Favorites, Series), and sorting (A-Z, Last Played) make browsing easy for growing libraries.
- **Accessibility Enhancements**: Includes full keyboard navigation (`Space` to play/pause, Arrows to skip) and a High-Contrast mode toggle for children with vision challenges.
- **Parental Session Limits**: Parents can set a maximum listening limit per session (defaults to 60 minutes). Once reached, the screen locks and requires a parent PIN to resume.
- **Profile Reset & Custom Access**: Parent dashboard includes settings to reset all custom book access permissions for any child profile in one click.
- **Offline Support**: Entirely local state persistence and offline capabilities using IndexedDB / localForage, ensuring the app works without an active internet connection.
- **Cloud-Based Profiles & PINs**: Profiles and listening progress sync automatically to Firebase Firestore across all family devices, secured by kid-friendly 4-digit PIN gates to prevent kids from entering other profiles.
- **Diagnostics & Error Reporting**: Features a global React Error Boundary for crash recovery and a support card in the Parent Dashboard that packages system specs, Zustand store state, and console warnings/errors into a direct `mailto:` bug report to the developer.
- **Parent Dashboard**: Secured behind a PIN (`1234`), the dashboard displays detailed listening stats, completed books, total listening time, custom book approval/restriction toggles, PIN resets, and discussion questions (synced from a live Google Sheet) for the active child profile.

## 🚀 Tech Stack

- **Framework**: React (Vite)
- **Routing**: React Router
- **State Management**: Zustand (with localForage for persistent offline storage)
- **Styling**: Vanilla CSS (Tailwind-free for maximum legacy compatibility)
- **Icons**: Lucide React
- **Deployment**: Vercel

## 🛠️ Setup & Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ankitp1/storySprout.git
   cd storySprout
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 📚 Adding Books

To add new books to the app, simply drop them into the connected Google Drive folder.
- Ensure each book is in its own subfolder (e.g., `The Hobbit`).
- Inside the book folder, place the audio files in alphabetical order or prepend numbers (e.g., `01 - Chapter 1.mp3`).
- If you want a custom cover, include a `cover.jpg` or `cover.png` in the book folder. If omitted, the app will automatically try to fetch cover art from the Google Books API!

## ❓ Discussion Questions

The app fetches discussion questions from a live, published Google Sheets CSV. Parents can update the sheet with new questions, fix typos, or add new books without ever needing to touch the code or redeploy the app!

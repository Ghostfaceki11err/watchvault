# 🍿 WatchVault

[![Netlify Status](https://api.netlify.com/api/v1/badges/watchvaults/deploy-status)](https://watchvaults.netlify.app/)

**WatchVault** is a premium, beautifully designed web application that allows users to discover, explore, and track their favorite Movies, TV Shows, and Anime. Built with React and Firebase, it features a cinematic "Netflix-style" interface, deep metadata exploration via the TMDb API, and a personal Vault to curate your watchlists.

### 🔴 [Live Demo: watchvaults.netlify.app](https://watchvaults.netlify.app/)

![WatchVault Preview](https://drive.google.com/uc?export=view&id=1XtpyVqq-uxzPPDNlVZtxb1_1iWjrjZdB)

---

## ✨ Features

- **Cinematic UI/UX:** A stunning, responsive dark-mode interface with glassmorphism effects, smooth hover animations, and a dynamic 2:3 aspect-ratio media grid.
- **Deep Discovery:** Click on any title to open a rich details modal featuring:
  - High-res posters and backdrop banners.
  - Core metadata (Release Year, Dynamic Status, Ratings, Genres).
  - YouTube Trailer integration.
  - Top Cast lists.
- **Recursive Exploration Stack:** Dive down the rabbit hole! Click on an actor to view their profile and "Known For" movies, then click a movie to see its details, and smoothly navigate back up your history stack using the integrated back button.
- **Personal Vault:** Securely log in using Google Authentication to add media to your personal Vault. The UI updates in real-time, displaying green checkmarks for items already saved to prevent duplicates.
- **Universal Search:** Instantly search the entire TMDb database for any Movie, TV Show, or Anime.

---

## 🛠️ Technology Stack

- **Frontend Framework:** React (using Hooks, Context API, and React Router)
- **Styling:** Vanilla CSS (CSS Variables, Flexbox/Grid, Micro-animations)
- **Backend / BaaS:** Firebase (Authentication, Firestore Database)
- **Data Source:** [The Movie Database (TMDb) API](https://developer.themoviedb.org/docs)
- **Icons & Media:** Lucide-React (Icons), React-YouTube (Trailers)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Clone the Repository
```bash
git clone https://github.com/Ghostfaceki11err/watchvault.git
cd watchvault
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
You need to set up your API keys to run the application. Create a `.env` file in the root directory and add the following keys:

```env
REACT_APP_TMDB_API_KEY=your_tmdb_api_key_here

REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```


### 4. Run the Application
```bash
npm start
```
The app will open in development mode at [http://localhost:3000](http://localhost:3000).

---

## 📸 Application Structure

- `src/components/`: Reusable UI elements (`MediaCard`, `MediaModal`, `Navbar`, etc.)
- `src/pages/`: Main application views (`Home`, `Vault`, `Login`)
- `src/services/`: External API integrations (`tmdbApi.js`, `firestoreService.js`, `firebase.js`)
- `src/context/`: Global state management (`AuthContext.js`)

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).

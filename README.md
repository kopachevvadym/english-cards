# English Cards - Flashcard Learning App

A beautiful flashcard learning app built with Next.js and Material-UI, inspired by Anki.

## Features

- 🃏 **Interactive Flashcards**: Click to flip cards and reveal translations
- 📥 **JSON Import**: Import word lists from JSON files
- ✅ **Progress Tracking**: Mark words as known/unknown with visual progress
- 🎨 **Material Design**: Beautiful, responsive UI with smooth animations
- 💾 **Local Storage**: Your progress is saved automatically
- 🔄 **Reset Progress**: Start over anytime

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## JSON Import Format

Import your flashcards using simple word-translation pairs:

```json
[
  {
    "hello": "hola",
    "goodbye": "adiós",
    "thank you": "gracias"
  },
  {
    "cat": "gato",
    "dog": "perro"
  }
]
```

## How to Use

1. **Import Cards**: Click the + button to import your word list via JSON
2. **Study**: Click cards to flip them and see translations
3. **Mark Progress**: Use ✓ for known words, ✗ to review again
4. **Track Progress**: See your learning progress with the progress bar
5. **Navigate**: Use arrow buttons to move between cards

## Tech Stack

- **Next.js 14** - React framework
- **Material-UI** - Component library
- **TypeScript** - Type safety
- **Local Storage** - Data persistence

## Build for Production

```bash
npm run build
npm start
```
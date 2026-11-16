import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Heart, Sparkles } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col justify-between p-6 sm:p-12">
        <header className="flex justify-between items-center max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-lavender-400 to-coral-400 flex items-center justify-center text-white shadow-soft">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <span className="font-serif text-2xl font-medium tracking-tight text-ink dark:text-white">
              TogetherSpace
            </span>
          </div>
          <span className="text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full bg-lavender-100 text-lavender-700 dark:bg-lavender-900/40 dark:text-lavender-300">
            Phase 1 Initialized
          </span>
        </header>

        <main className="max-w-2xl mx-auto my-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-space-surfaceDark border border-space-borderLight dark:border-space-borderDark text-xs text-ink-muted">
            <Sparkles className="w-4 h-4 text-lavender-500" />
            <span>Private Two-Person Media Sharing Platform</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-ink dark:text-white">
            An intimate archive for two stories intertwined.
          </h1>
          <p className="text-ink-muted text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            Architected for complete privacy, rich editorial photography presentation, and seamless shared memories.
          </p>
        </main>

        <footer className="text-center text-xs text-ink-light py-4">
          TogetherSpace &copy; {new Date().getFullYear()} &mdash; Strictly two authorized souls.
        </footer>
      </div>
    </Router>
  );
}

export default App;

import React from 'react';
import { Bookmark, Heart } from 'lucide-react';

export const FavoritesPage = () => {
  return (
    <div className="space-y-6 text-left">
      <div className="pb-4 border-b border-space-borderLight dark:border-space-borderDark">
        <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-ink dark:text-white">
          Private Favorites
        </h1>
        <p className="text-xs text-ink-muted mt-1">
          Photographs and videos bookmarked privately by you.
        </p>
      </div>

      <div className="text-center py-24 rounded-3xl bg-white dark:bg-space-surfaceDark border border-dashed border-space-borderLight dark:border-space-borderDark space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-coral-100 dark:bg-coral-900/40 text-coral-500 flex items-center justify-center mx-auto shadow-soft">
          <Bookmark className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-2xl font-medium text-ink dark:text-white">
          Private Favorites Gallery
        </h3>
        <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
          Your bookmarked items are private to your individual session.
        </p>
      </div>
    </div>
  );
};

export default FavoritesPage;

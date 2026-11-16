import React from 'react';
import { Image as ImageIcon, Sparkles, UploadCloud } from 'lucide-react';
import Button from '../components/common/Button';

export const GalleryPage = () => {
  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-space-borderLight dark:border-space-borderDark">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-ink dark:text-white">
            Shared Gallery
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Every moment captured, preserved in editorial fidelity.
          </p>
        </div>
      </div>

      <div className="text-center py-24 rounded-3xl bg-white dark:bg-space-surfaceDark border border-dashed border-space-borderLight dark:border-space-borderDark space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-lavender-100 dark:bg-lavender-900/40 text-lavender-600 flex items-center justify-center mx-auto shadow-soft">
          <ImageIcon className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-2xl font-medium text-ink dark:text-white">
          Gallery & Media Viewer Architecture
        </h3>
        <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
          Masonry grid, multi-upload drag-and-drop, full-screen playback, and private favorites are prepared for Phase 7.
        </p>
      </div>
    </div>
  );
};

export default GalleryPage;

import React, { useState } from 'react';
import { Heart, Play, User } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export const MediaCard = ({
  item,
  onClick,
  onToggleFavorite,
  className
}) => {
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      await onToggleFavorite(item.id, !item.isFavorite);
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <div
      onClick={() => onClick && onClick(item)}
      className={cn(
        'group relative rounded-2xl overflow-hidden bg-space-cardLight dark:bg-space-cardDark border border-space-borderLight dark:border-space-borderDark shadow-soft hover:shadow-medium transition-all duration-300 cursor-pointer select-none break-inside-avoid mb-4',
        className
      )}
    >
      {/* Media Image / Video Poster */}
      <div className="relative w-full overflow-hidden bg-black/5 dark:bg-black/20">
        <img
          src={item.thumbnailUrl || item.mediaUrl}
          alt={item.title || 'TogetherSpace memory'}
          className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Video Indicator */}
        {item.mediaType === 'video' && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium shadow-sm">
            <Play className="w-3 h-3 fill-current" />
            <span>Video</span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          disabled={favoriteLoading}
          className={cn(
            'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-150',
            item.isFavorite
              ? 'bg-white/90 dark:bg-space-surfaceDark/90 text-coral-500 shadow-sm scale-105'
              : 'bg-black/30 text-white/90 hover:bg-white/80 hover:text-coral-500 opacity-80 sm:opacity-0 group-hover:opacity-100'
          )}
          title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-transform active:scale-125',
              item.isFavorite && 'fill-current'
            )}
          />
        </button>

        {/* Bottom Editorial Vignette Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end text-left">
          {item.title && (
            <h4 className="font-serif text-sm font-medium tracking-tight truncate drop-shadow-sm">
              {item.title}
            </h4>
          )}
          <div className="flex items-center justify-between text-[11px] text-white/80 mt-1">
            <span className="flex items-center gap-1 truncate">
              <User className="w-3 h-3 shrink-0" />
              <span className="truncate">{item.uploader?.name || 'Partner'}</span>
            </span>
            <span className="shrink-0 text-white/60 ml-2">
              {formatDate(item.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaCard;

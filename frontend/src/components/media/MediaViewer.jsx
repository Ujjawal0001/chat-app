import React, { useEffect, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Download,
  Trash2,
  Calendar,
  User,
  AlertTriangle,
  Play
} from 'lucide-react';
import { formatDate, formatBytes } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import Button from '../common/Button';
import Modal from '../common/Modal';

export const MediaViewer = ({
  item,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  onToggleFavorite,
  onDelete
}) => {
  const { user } = useAuth();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Keyboard navigation listener (Left, Right, ESC)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (deleteConfirmOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        onPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteConfirmOpen, hasNext, hasPrev, onNext, onPrev, onClose]);

  if (!item) return null;

  const isOwner = item.uploadedById === user?.id;

  const handleFavoriteClick = async () => {
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      await onToggleFavorite(item.id, !item.isFavorite);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleDeleteClick = async () => {
    setDeleteLoading(true);
    try {
      await onDelete(item.id);
      setDeleteConfirmOpen(false);
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to delete media');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = item.mediaUrl;
    link.download = item.title || `togetherspace-${item.id}`;
    link.target = '_blank';
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl text-white select-none animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-b from-black/80 to-transparent z-20">
        {/* Uploader & Date Info */}
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-full bg-lavender-500/80 text-white flex items-center justify-center font-serif text-sm font-semibold">
            {item.uploader?.name ? item.uploader.name[0] : 'U'}
          </div>
          <div>
            <h3 className="text-sm font-medium leading-none text-white">
              {item.title || 'Untitled Memory'}
            </h3>
            <p className="text-[11px] text-white/60 mt-1 flex items-center gap-2">
              <span>Shared by {item.uploader?.name || 'Partner'}</span>
              <span>&bull;</span>
              <span>{formatDate(item.createdAt)}</span>
              {item.fileSize && (
                <>
                  <span>&bull;</span>
                  <span>{formatBytes(item.fileSize)}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Favorite Toggle */}
          <button
            onClick={handleFavoriteClick}
            disabled={favoriteLoading}
            className={cn(
              'p-2.5 rounded-full transition-colors backdrop-blur-md',
              item.isFavorite
                ? 'bg-coral-500/80 text-white hover:bg-coral-600'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-coral-400'
            )}
            title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={cn('w-4 h-4', item.isFavorite && 'fill-current')} />
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-2.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors backdrop-blur-md"
            title="Download full resolution"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Delete Option (Strictly for original uploader) */}
          {isOwner && (
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="p-2.5 rounded-full bg-white/10 text-white/80 hover:bg-coral-500/80 hover:text-white transition-colors backdrop-blur-md"
              title="Delete this media"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Close Viewer */}
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-md ml-2"
            title="Close viewer (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Full-Screen Media Presentation */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        {/* Previous Navigation Arrow */}
        {hasPrev && (
          <button
            onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-md transition-all z-20 group"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Media Player / Image */}
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          {item.mediaType === 'video' ? (
            <video
              src={item.mediaUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[82vh] max-w-full rounded-lg shadow-2xl outline-none"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={item.mediaUrl}
              alt={item.title || 'TogetherSpace memory'}
              className="max-h-[82vh] max-w-full object-contain rounded-lg shadow-2xl transition-transform"
            />
          )}
        </div>

        {/* Next Navigation Arrow */}
        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-md transition-all z-20 group"
            title="Next (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Description Footer (if present) */}
      {item.description && (
        <div className="p-4 bg-gradient-to-t from-black/80 to-transparent text-center max-w-xl mx-auto z-20">
          <p className="text-xs text-white/80 font-light leading-relaxed">
            {item.description}
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Shared Memory?"
        description="Are you sure you want to permanently delete this media? This will permanently remove the asset for both you and your partner."
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-coral-50 dark:bg-coral-950/30 border border-coral-200 dark:border-coral-800 text-coral-600 dark:text-coral-300 text-xs text-left">
            <AlertTriangle className="w-5 h-5 shrink-0 text-coral-500" />
            <span>This action is irreversible and deletes the asset from Cloudinary storage.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteClick}
              isLoading={deleteLoading}
            >
              Delete Memory
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MediaViewer;

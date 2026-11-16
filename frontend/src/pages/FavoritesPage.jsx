import React, { useState, useEffect, useCallback } from 'react';
import { Bookmark, Heart, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import MediaCard from '../components/media/MediaCard';
import MediaViewer from '../components/media/MediaViewer';
import Button from '../components/common/Button';
import api from '../services/api';

export const FavoritesPage = () => {
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);

  const fetchFavorites = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get(`/favorites?page=${page}&limit=24`);
      if (response.success && response.data) {
        setFavoriteItems(response.data.items || []);
        setPagination({
          page: response.data.pagination.page,
          totalPages: response.data.pagination.totalPages,
          total: response.data.pagination.total
        });
      }
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites(1);
  }, [fetchFavorites]);

  const handleToggleFavorite = async (mediaId, shouldFavorite) => {
    try {
      if (shouldFavorite) {
        await api.post(`/favorites/${mediaId}`);
      } else {
        await api.delete(`/favorites/${mediaId}`);
        // Remove item from favorites view smoothly
        setFavoriteItems((prev) => prev.filter((item) => item.id !== mediaId));
        setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    await api.delete(`/media/${mediaId}`);
    setFavoriteItems((prev) => prev.filter((item) => item.id !== mediaId));
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="pb-6 border-b border-space-borderLight dark:border-space-borderDark">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-coral-500 mb-1">
          <Heart className="w-3.5 h-3.5 fill-current" />
          <span>Curated by You</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-ink dark:text-white">
          Private Favorites
        </h1>
        <p className="text-xs text-ink-muted mt-1">
          {pagination.total} bookmarked memories visible exclusively in your personal collection.
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] rounded-2xl bg-space-cardLight dark:bg-space-cardDark animate-pulse border border-space-borderLight dark:border-space-borderDark"
            />
          ))}
        </div>
      ) : favoriteItems.length > 0 ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
          {favoriteItems.map((item, index) => (
            <MediaCard
              key={item.id}
              item={item}
              onClick={() => setSelectedItemIndex(index)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 px-4 rounded-3xl bg-white dark:bg-space-surfaceDark border border-dashed border-space-borderLight dark:border-space-borderDark space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-coral-50 dark:bg-coral-950/40 text-coral-500 flex items-center justify-center mx-auto shadow-soft">
            <Bookmark className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-serif text-2xl font-medium text-ink dark:text-white">
              No favorites saved yet
            </h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto mt-1">
              Tap the heart icon on any shared photograph or video in the gallery to save it to your private collection.
            </p>
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchFavorites(pagination.page - 1)}
            icon={ChevronLeft}
          >
            Previous
          </Button>
          <span className="text-xs text-ink-muted px-3">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchFavorites(pagination.page + 1)}
            icon={ChevronRight}
          >
            Next
          </Button>
        </div>
      )}

      {/* Full-Screen Media Viewer Lightbox */}
      {selectedItemIndex !== null && favoriteItems[selectedItemIndex] && (
        <MediaViewer
          item={favoriteItems[selectedItemIndex]}
          onClose={() => setSelectedItemIndex(null)}
          onNext={() =>
            selectedItemIndex < favoriteItems.length - 1 &&
            setSelectedItemIndex(selectedItemIndex + 1)
          }
          onPrev={() =>
            selectedItemIndex > 0 && setSelectedItemIndex(selectedItemIndex - 1)
          }
          hasNext={selectedItemIndex < favoriteItems.length - 1}
          hasPrev={selectedItemIndex > 0}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDeleteMedia}
        />
      )}
    </div>
  );
};

export default FavoritesPage;

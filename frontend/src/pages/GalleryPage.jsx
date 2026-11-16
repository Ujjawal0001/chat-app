import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  UploadCloud,
  Image as ImageIcon,
  Video,
  Grid,
  Filter,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Sparkles
} from 'lucide-react';
import MediaCard from '../components/media/MediaCard';
import MediaViewer from '../components/media/MediaViewer';
import UploadModal from '../components/media/UploadModal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import api from '../services/api';
import { cn } from '../utils/cn';

export const GalleryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Filters
  const [mediaType, setMediaType] = useState('all'); // 'all' | 'image' | 'video'
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  // Modals & Viewer
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);

  // Check URL query param to open upload modal or view item directly
  useEffect(() => {
    if (searchParams.get('upload') === 'true') {
      setUploadModalOpen(true);
    }
  }, [searchParams]);

  const fetchMedia = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '24'
      });

      if (mediaType !== 'all') params.append('mediaType', mediaType);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/media?${params.toString()}`);
      if (response.success && response.data) {
        setMediaItems(response.data.items || []);
        setPagination({
          page: response.data.pagination.page,
          totalPages: response.data.pagination.totalPages,
          total: response.data.pagination.total
        });

        // If URL has ?view=id, open that item
        const viewId = searchParams.get('view');
        if (viewId && response.data.items) {
          const idx = response.data.items.findIndex((item) => item.id === viewId);
          if (idx !== -1) setSelectedItemIndex(idx);
        }
      }
    } catch (err) {
      console.error('Failed to fetch media gallery:', err);
    } finally {
      setLoading(false);
    }
  }, [mediaType, searchQuery, startDate, endDate, searchParams]);

  useEffect(() => {
    fetchMedia(1);
  }, [fetchMedia]);

  const handleToggleFavorite = async (mediaId, shouldFavorite) => {
    try {
      if (shouldFavorite) {
        await api.post(`/favorites/${mediaId}`);
      } else {
        await api.delete(`/favorites/${mediaId}`);
      }

      // Update state locally
      setMediaItems((prev) =>
        prev.map((item) =>
          item.id === mediaId ? { ...item, isFavorite: shouldFavorite } : item
        )
      );
    } catch (err) {
      console.error('Favorite toggle error:', err);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    await api.delete(`/media/${mediaId}`);
    setMediaItems((prev) => prev.filter((item) => item.id !== mediaId));
  };

  const activeFilterCount = (mediaType !== 'all' ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0);

  const clearFilters = () => {
    setMediaType('all');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-space-borderLight dark:border-space-borderDark">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-ink dark:text-white">
            Shared Gallery
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            {pagination.total} memories preserved in your private collection.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
            <input
              type="text"
              placeholder="Search by title or story..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-space-borderLight dark:border-space-borderDark bg-white dark:bg-space-surfaceDark pl-10 pr-3.5 py-2 text-xs text-ink dark:text-white placeholder:text-ink-light/60 focus:outline-none focus:ring-2 focus:ring-lavender-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <Button
            variant={activeFilterCount > 0 ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setFilterMenuOpen(!filterMenuOpen)}
            icon={Filter}
          >
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-lavender-600 text-white text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Upload Button */}
          <Button
            size="sm"
            onClick={() => setUploadModalOpen(true)}
            icon={UploadCloud}
          >
            Upload Media
          </Button>
        </div>
      </div>

      {/* Expandable Filter Panel */}
      {filterMenuOpen && (
        <div className="p-4 rounded-2xl bg-white dark:bg-space-surfaceDark border border-space-borderLight dark:border-space-borderDark shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Filter By
            </span>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-lavender-600 dark:text-lavender-400 hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Media Type Filter */}
            <div className="space-y-1.5">
              <label className="text-ink-muted">Media Type</label>
              <div className="flex gap-1.5">
                {[
                  { value: 'all', label: 'All', icon: Grid },
                  { value: 'image', label: 'Photos', icon: ImageIcon },
                  { value: 'video', label: 'Videos', icon: Video },
                ].map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setMediaType(type.value)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border transition-colors',
                        mediaType === type.value
                          ? 'bg-lavender-100 dark:bg-lavender-900/40 border-lavender-300 dark:border-lavender-700 text-lavender-800 dark:text-lavender-200 font-semibold'
                          : 'border-space-borderLight dark:border-space-borderDark text-ink-muted hover:bg-space-cardLight'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-ink-muted">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-space-borderLight dark:border-space-borderDark bg-space-cardLight dark:bg-space-cardDark px-3 py-1.5 text-xs text-ink dark:text-white"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-ink-muted">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-space-borderLight dark:border-space-borderDark bg-space-cardLight dark:bg-space-cardDark px-3 py-1.5 text-xs text-ink dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Masonry / Responsive Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] rounded-2xl bg-space-cardLight dark:bg-space-cardDark animate-pulse border border-space-borderLight dark:border-space-borderDark"
            />
          ))}
        </div>
      ) : mediaItems.length > 0 ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
          {mediaItems.map((item, index) => (
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
          <div className="w-16 h-16 rounded-2xl bg-lavender-50 dark:bg-lavender-950/40 text-lavender-600 flex items-center justify-center mx-auto shadow-soft">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-serif text-2xl font-medium text-ink dark:text-white">
              {activeFilterCount > 0 ? 'No matching memories found' : 'Your private archive is empty'}
            </h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto mt-1">
              {activeFilterCount > 0
                ? 'Try adjusting your search query or clearing your filter criteria.'
                : 'Upload your first photograph or video to begin weaving your shared story.'}
            </p>
          </div>
          {activeFilterCount > 0 ? (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          ) : (
            <Button size="sm" icon={UploadCloud} onClick={() => setUploadModalOpen(true)}>
              Upload First Media
            </Button>
          )}
        </div>
      )}

      {/* Pagination Bar */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchMedia(pagination.page - 1)}
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
            onClick={() => fetchMedia(pagination.page + 1)}
            icon={ChevronRight}
          >
            Next
          </Button>
        </div>
      )}

      {/* Full-Screen Media Viewer Lightbox */}
      {selectedItemIndex !== null && mediaItems[selectedItemIndex] && (
        <MediaViewer
          item={mediaItems[selectedItemIndex]}
          onClose={() => setSelectedItemIndex(null)}
          onNext={() =>
            selectedItemIndex < mediaItems.length - 1 &&
            setSelectedItemIndex(selectedItemIndex + 1)
          }
          onPrev={() =>
            selectedItemIndex > 0 && setSelectedItemIndex(selectedItemIndex - 1)
          }
          hasNext={selectedItemIndex < mediaItems.length - 1}
          hasPrev={selectedItemIndex > 0}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDeleteMedia}
        />
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={() => {
          fetchMedia(1);
          setUploadModalOpen(false);
        }}
      />
    </div>
  );
};

export default GalleryPage;

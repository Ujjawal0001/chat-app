import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Heart,
  Image as ImageIcon,
  Video,
  UploadCloud,
  ArrowRight,
  Sparkles,
  Users,
  Clock,
  Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import api from '../services/api';
import InvitePartnerModal from '../components/auth/InvitePartnerModal';

export const DashboardPage = () => {
  const { user, systemStatus } = useAuth();
  const [spaceData, setSpaceData] = useState({
    users: [],
    stats: { totalPhotos: 0, totalVideos: 0, totalMedia: 0 }
  });
  const [recentMedia, setRecentMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersRes, mediaRes] = await Promise.all([
          api.get('/users'),
          api.get('/media?limit=6')
        ]);

        if (usersRes.success) {
          setSpaceData(usersRes.data);
        }
        if (mediaRes.success && mediaRes.data?.items) {
          setRecentMedia(mediaRes.data.items);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const partner = spaceData.users.find((u) => u.id !== user?.id);

  return (
    <div className="space-y-10 text-left">
      {/* Editorial Welcome Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-lavender-100/70 via-space-cardLight to-coral-50/50 dark:from-space-surfaceDark dark:via-space-cardDark dark:to-space-surfaceDark border border-space-borderLight dark:border-space-borderDark p-8 sm:p-12">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/80 dark:bg-space-surfaceDark/80 border border-space-borderLight dark:border-space-borderDark text-xs font-semibold text-lavender-700 dark:text-lavender-300">
            <Sparkles className="w-3.5 h-3.5 text-lavender-500" />
            <span>Our Shared Archive</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-ink dark:text-white leading-tight">
            Welcome home, {user?.name || 'Partner'}.
          </h1>

          <p className="text-ink-muted text-base sm:text-lg leading-relaxed">
            Every photograph and memory in this space is preserved exclusively for the two of you.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <NavLink to="/gallery">
              <Button icon={ImageIcon} size="lg">
                View Full Gallery
              </Button>
            </NavLink>
            <NavLink to="/gallery?upload=true">
              <Button variant="outline" icon={UploadCloud} size="lg">
                Upload New Media
              </Button>
            </NavLink>
          </div>
        </div>
      </section>

      {/* Partner Profile Bar & Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Partner Connection Card */}
        <div className="md:col-span-2 rounded-2xl bg-white dark:bg-space-surfaceDark border border-space-borderLight dark:border-space-borderDark p-6 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-space-borderLight dark:border-space-borderDark">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-lavender-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                TogetherSpace Partners
              </h3>
            </div>
            <span className="text-xs text-ink-light">
              {spaceData.users.length}/2 registered
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
            {/* User 1 (Current User) */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-space-cardLight dark:bg-space-cardDark">
              <div className="w-10 h-10 rounded-full bg-lavender-500 text-white flex items-center justify-center font-serif text-lg font-medium shadow-sm">
                {user?.name ? user.name[0] : 'U'}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-semibold text-ink dark:text-white truncate">
                  {user?.name} (You)
                </span>
                <span className="text-xs text-ink-light truncate">{user?.email}</span>
              </div>
            </div>

            {/* User 2 (Partner) */}
            {partner ? (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-space-cardLight dark:bg-space-cardDark">
                <div className="w-10 h-10 rounded-full bg-coral-400 text-white flex items-center justify-center font-serif text-lg font-medium shadow-sm">
                  {partner.name[0]}
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-sm font-semibold text-ink dark:text-white truncate">
                    {partner.name}
                  </span>
                  <span className="text-xs text-ink-light truncate">{partner.email}</span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setInviteModalOpen(true)}
                className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-lavender-300 dark:border-lavender-700 hover:bg-lavender-50/50 dark:hover:bg-lavender-950/20 text-xs font-medium text-lavender-700 dark:text-lavender-300 transition-colors"
              >
                <Heart className="w-4 h-4 text-coral-400" />
                <span>Invite your partner to join</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <Heart className="w-3.5 h-3.5 text-coral-500 fill-current" />
            <span>A private archive built strictly for two souls.</span>
          </div>
        </div>

        {/* Media Counts Overview */}
        <div className="rounded-2xl bg-white dark:bg-space-surfaceDark border border-space-borderLight dark:border-space-borderDark p-6 shadow-soft flex flex-col justify-between">
          <div className="flex items-center gap-2 pb-4 border-b border-space-borderLight dark:border-space-borderDark">
            <Clock className="w-4 h-4 text-lavender-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Archive Metrics
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="p-4 rounded-xl bg-space-cardLight dark:bg-space-cardDark text-left">
              <span className="block text-2xl sm:text-3xl font-serif font-medium text-ink dark:text-white">
                {spaceData.stats.totalPhotos}
              </span>
              <span className="text-xs text-ink-muted mt-1 flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-lavender-500" /> Photos
              </span>
            </div>

            <div className="p-4 rounded-xl bg-space-cardLight dark:bg-space-cardDark text-left">
              <span className="block text-2xl sm:text-3xl font-serif font-medium text-ink dark:text-white">
                {spaceData.stats.totalVideos}
              </span>
              <span className="text-xs text-ink-muted mt-1 flex items-center gap-1">
                <Video className="w-3 h-3 text-coral-400" /> Videos
              </span>
            </div>
          </div>

          <NavLink
            to="/favorites"
            className="text-xs text-lavender-600 dark:text-lavender-300 hover:underline flex items-center justify-between"
          >
            <span>View your private favorites</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      </section>

      {/* Recently Uploaded Photographs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-medium tracking-tight text-ink dark:text-white">
              Recently Added
            </h2>
            <p className="text-xs text-ink-muted">The latest shared memories.</p>
          </div>
          <NavLink
            to="/gallery"
            className="text-xs font-semibold text-lavender-600 dark:text-lavender-300 hover:text-lavender-700 flex items-center gap-1"
          >
            <span>Browse All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        {recentMedia.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {recentMedia.map((item) => (
              <NavLink
                key={item.id}
                to={`/gallery?view=${item.id}`}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-space-cardLight dark:bg-space-cardDark border border-space-borderLight dark:border-space-borderDark shadow-soft"
              >
                <img
                  src={item.thumbnailUrl || item.mediaUrl}
                  alt={item.title || 'TogetherSpace memory'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {item.mediaType === 'video' && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm">
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                  <span className="text-[11px] text-white truncate font-medium">
                    {item.title || item.uploader?.name || 'Shared Media'}
                  </span>
                </div>
              </NavLink>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 rounded-2xl bg-white dark:bg-space-surfaceDark border border-dashed border-space-borderLight dark:border-space-borderDark space-y-3">
            <div className="w-12 h-12 rounded-full bg-lavender-100 dark:bg-lavender-900/40 text-lavender-600 flex items-center justify-center mx-auto">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-lg font-medium text-ink dark:text-white">
              No media shared yet
            </h4>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              Begin your visual journey by uploading your favorite photographs and clips.
            </p>
            <NavLink to="/gallery?upload=true" className="inline-block pt-1">
              <Button size="sm" icon={UploadCloud}>
                Upload First Photo
              </Button>
            </NavLink>
          </div>
        )}
      </section>

      {/* Invite Modal */}
      <InvitePartnerModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;

import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Heart,
  Image as GalleryIcon,
  LayoutDashboard,
  Bookmark,
  Settings,
  Sun,
  Moon,
  LogOut,
  UserPlus,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';
import InvitePartnerModal from '../components/auth/InvitePartnerModal';

export const AppLayout = () => {
  const { user, logout, systemStatus } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Chat', path: '/chat', icon: MessageCircle },
    { label: 'Gallery', path: '/gallery', icon: GalleryIcon },
    { label: 'Favorites', path: '/favorites', icon: Bookmark },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-space-light dark:bg-space-dark text-ink dark:text-gray-100 transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-space-surfaceDark/80 backdrop-blur-md border-b border-space-borderLight dark:border-space-borderDark">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-lavender-500 to-coral-400 flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-serif text-xl font-medium tracking-tight text-ink dark:text-white leading-none">
                TogetherSpace
              </span>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-ink-light mt-0.5">
                Private Archive
              </span>
            </div>
          </NavLink>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-space-cardLight dark:bg-space-cardDark p-1 rounded-2xl border border-space-borderLight dark:border-space-borderDark">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-xl transition-all duration-150',
                      isActive
                        ? 'bg-white dark:bg-space-surfaceDark text-lavender-700 dark:text-lavender-300 shadow-soft'
                        : 'text-ink-muted hover:text-ink dark:hover:text-white hover:bg-white/40'
                    )
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Partner Status Pill */}
            {systemStatus.userCount < 2 ? (
              <button
                onClick={() => setInviteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-coral-50 dark:bg-coral-950/40 text-coral-600 dark:text-coral-300 border border-coral-200 dark:border-coral-800 hover:bg-coral-100 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Invite Partner</span>
              </button>
            ) : (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lavender-50 dark:bg-lavender-950/40 text-lavender-700 dark:text-lavender-300 border border-lavender-200 dark:border-lavender-800 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-lavender-500" />
                <span>Two Hearts Intertwined</span>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-ink-muted hover:text-ink dark:hover:text-white hover:bg-space-cardLight dark:hover:bg-space-cardDark transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-lavender-200 dark:bg-lavender-900/60 text-lavender-800 dark:text-lavender-200 flex items-center justify-center text-xs font-semibold uppercase tracking-wider shadow-sm">
                {user?.name ? user.name[0] : 'U'}
              </div>
              <button
                onClick={handleLogout}
                className="hidden sm:flex p-2 rounded-xl text-ink-muted hover:text-coral-500 hover:bg-coral-50 dark:hover:bg-coral-950/30 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile Navigation Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-space-surfaceDark/90 backdrop-blur-lg border-t border-space-borderLight dark:border-space-borderDark px-4 py-2 flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium rounded-xl transition-colors',
                  isActive
                    ? 'text-lavender-600 dark:text-lavender-300'
                    : 'text-ink-muted hover:text-ink dark:hover:text-white'
                )
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Invite Partner Modal */}
      <InvitePartnerModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </div>
  );
};

export default AppLayout;

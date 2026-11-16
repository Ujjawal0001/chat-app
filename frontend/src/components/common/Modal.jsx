import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-md',
  className
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={cn(
          'relative w-full rounded-2xl bg-white dark:bg-space-surfaceDark border border-space-borderLight dark:border-space-borderDark p-6 sm:p-8 shadow-elevated z-10 transition-all transform animate-in fade-in zoom-in-95 duration-200',
          maxWidth,
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-ink-muted hover:text-ink dark:hover:text-white hover:bg-space-cardLight dark:hover:bg-space-cardDark transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {title && (
          <div className="mb-6 space-y-1 text-left">
            <h3 className="font-serif text-2xl font-medium tracking-tight text-ink dark:text-white">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-ink-muted leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

export default Modal;

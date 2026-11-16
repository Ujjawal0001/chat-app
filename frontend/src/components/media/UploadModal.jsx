import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  UploadCloud,
  X,
  FileImage,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { formatBytes } from '../../utils/formatters';
import api from '../../services/api';

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

export const UploadModal = ({ isOpen, onClose, onUploadComplete }) => {
  const [fileQueue, setFileQueue] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(Array.from(e.target.files));
    }
  };

  const addFilesToQueue = (files) => {
    const newItems = files.map((file) => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      let error = null;

      if (!isVideo && !isImage) {
        error = 'Unsupported file format. Please upload photos or videos.';
      } else if (isImage && file.size > MAX_IMAGE_SIZE) {
        error = 'Photo exceeds 20MB limit.';
      } else if (isVideo && file.size > MAX_VIDEO_SIZE) {
        error = 'Video exceeds 100MB limit.';
      }

      const previewUrl = isImage || isVideo ? URL.createObjectURL(file) : null;

      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name.replace(/\.[^/.]+$/, ''),
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: '',
        size: file.size,
        type: isVideo ? 'video' : 'image',
        previewUrl,
        progress: 0,
        status: error ? 'error' : 'queued', // 'queued' | 'uploading' | 'completed' | 'error'
        error
      };
    });

    setFileQueue((prev) => [...prev, ...newItems]);
  };

  const removeFile = (id) => {
    setFileQueue((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const updateFileMeta = (id, field, value) => {
    setFileQueue((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const handleUploadAll = async () => {
    setUploading(true);

    for (const item of fileQueue) {
      if (item.status === 'completed' || item.status === 'error') continue;

      // Update item state to uploading
      setFileQueue((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 10 } : f))
      );

      try {
        // Strategy A: Server direct-upload fallback (streamed directly to Cloudinary)
        const formData = new FormData();
        formData.append('file', item.file);
        if (item.title) formData.append('title', item.title);
        if (item.description) formData.append('description', item.description);

        const response = await api.post('/media/direct-upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 90) / (progressEvent.total || item.size)
            );
            setFileQueue((prev) =>
              prev.map((f) => (f.id === item.id ? { ...f, progress: percentCompleted } : f))
            );
          }
        });

        if (response.success) {
          setFileQueue((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, status: 'completed', progress: 100 } : f))
          );
        } else {
          throw new Error(response.message || 'Upload failed');
        }
      } catch (err) {
        setFileQueue((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: 'error', error: err.message || 'Upload error' }
              : f
          )
        );
      }
    }

    setUploading(false);
    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  const allCompleted = fileQueue.length > 0 && fileQueue.every((f) => f.status === 'completed');
  const validQueuedCount = fileQueue.filter((f) => f.status === 'queued').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={uploading ? () => {} : onClose}
      title="Add Shared Memories"
      description="Upload high-resolution images or videos to your private archive."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 text-left">
        {/* Drag and Drop Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-lavender-500 bg-lavender-50/60 dark:bg-lavender-950/30'
              : 'border-space-borderLight dark:border-space-borderDark hover:border-lavender-400 bg-space-cardLight/50 dark:bg-space-cardDark/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-lavender-100 dark:bg-lavender-900/40 text-lavender-600 dark:text-lavender-300 flex items-center justify-center shadow-soft">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="font-serif text-base font-medium text-ink dark:text-white">
                Drag and drop your photos and videos here
              </p>
              <p className="text-xs text-ink-muted mt-1">
                or click to browse from your device
              </p>
            </div>
            <span className="text-[11px] text-ink-light">
              Images up to 20MB &bull; Videos up to 100MB
            </span>
          </div>
        </div>

        {/* Selected Files Queue */}
        {fileQueue.length > 0 && (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>Selected items ({fileQueue.length})</span>
              {!uploading && (
                <button
                  onClick={() => setFileQueue([])}
                  className="hover:text-coral-500 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {fileQueue.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-space-cardLight dark:bg-space-cardDark border border-space-borderLight dark:border-space-borderDark text-xs"
              >
                {/* Thumbnail Preview */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/10 shrink-0 relative flex items-center justify-center">
                  {item.type === 'video' ? (
                    <FileVideo className="w-5 h-5 text-coral-400" />
                  ) : item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileImage className="w-5 h-5 text-lavender-400" />
                  )}
                </div>

                {/* Info & Status */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink dark:text-white truncate">
                      {item.title || item.name}
                    </span>
                    <span className="text-ink-light shrink-0 ml-2">
                      {formatBytes(item.size)}
                    </span>
                  </div>

                  {/* Progress or Error bar */}
                  {item.status === 'uploading' && (
                    <div className="w-full h-1.5 rounded-full bg-space-borderLight dark:bg-space-borderDark overflow-hidden">
                      <div
                        className="h-full bg-lavender-500 transition-all duration-150"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}

                  {item.status === 'completed' && (
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded successfully
                    </span>
                  )}

                  {item.status === 'error' && (
                    <span className="inline-flex items-center gap-1 text-coral-500">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.error}</span>
                    </span>
                  )}
                </div>

                {/* Remove button */}
                {!uploading && item.status !== 'completed' && (
                  <button
                    onClick={() => removeFile(item.id)}
                    className="p-1 rounded-lg text-ink-muted hover:text-coral-500 hover:bg-space-borderLight transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={uploading}
          >
            {allCompleted ? 'Done' : 'Cancel'}
          </Button>

          {allCompleted ? (
            <Button onClick={onClose} icon={CheckCircle2}>
              Close & View Gallery
            </Button>
          ) : (
            <Button
              onClick={handleUploadAll}
              disabled={uploading || validQueuedCount === 0}
              isLoading={uploading}
              icon={UploadCloud}
            >
              Upload {validQueuedCount > 0 ? `${validQueuedCount} Items` : ''}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UploadModal;

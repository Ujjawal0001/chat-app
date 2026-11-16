import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import {
  Send,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Trash2,
  Smile,
  Loader2,
  Heart,
  X
} from 'lucide-react';
import api from '../services/api';

const QUICK_EMOJIS = ['❤️', '✨', '🥰', '😘', '🥂', '📸', '💌', '🌸'];

export const ChatPage = () => {
  const { user } = useAuth();
  const {
    messages,
    loading,
    isPartnerOnline,
    partnerTyping,
    sendMessage,
    deleteMessage,
    sendTypingStatus,
    markAsRead
  } = useChat();

  const [inputContent, setInputContent] = useState('');
  const [sending, setSending] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom(loading ? 'auto' : 'smooth');
  }, [messages, loading]);

  // Mark messages as read when opening chat
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  // Handle typing debounce
  const handleInputChange = (e) => {
    setInputContent(e.target.value);
    sendTypingStatus(e.target.value.trim().length > 0);
  };

  // Handle file attachment selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setMediaPreview({
      url: objectUrl,
      type: file.type.startsWith('video') ? 'video' : 'image',
      file
    });
  };

  const removeAttachment = () => {
    if (mediaPreview?.url) URL.revokeObjectURL(mediaPreview.url);
    setAttachedFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload attached file to Cloudinary / backend
  const uploadAttachment = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/media/direct-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  };

  // Send message
  const handleSend = async (e) => {
    e?.preventDefault();
    const content = inputContent.trim();
    if (!content && !attachedFile) return;

    setSending(true);
    sendTypingStatus(false);

    try {
      let mediaUrl = null;
      let mediaType = null;

      if (attachedFile) {
        setUploadingMedia(true);
        const uploaded = await uploadAttachment(attachedFile);
        mediaUrl = uploaded.mediaUrl;
        mediaType = uploaded.mediaType;
      }

      await sendMessage({ content, mediaUrl, mediaType });
      setInputContent('');
      removeAttachment();
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
      setUploadingMedia(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Handle Enter to send
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format message time
  const formatTime = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Format date headers
  const formatDateHeader = (isoString) => {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-4xl mx-auto rounded-3xl bg-white/70 dark:bg-space-surfaceDark/80 backdrop-blur-xl border border-space-borderLight dark:border-space-borderDark shadow-elevated overflow-hidden transition-colors">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-space-borderLight dark:border-space-borderDark bg-white/50 dark:bg-space-cardDark/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-lavender-500 to-coral-400 flex items-center justify-center text-white font-medium shadow-soft">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-space-surfaceDark ${
                isPartnerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
          </div>
          <div>
            <h2 className="font-serif text-lg font-medium text-ink dark:text-white">
              Private Chat
            </h2>
            <p className="text-xs text-ink-muted flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isPartnerOnline ? 'bg-emerald-500' : 'bg-gray-400'
                }`}
              />
              {isPartnerOnline ? 'Partner is active now' : 'Partner offline'}
            </p>
          </div>
        </div>

        <div className="text-xs font-serif text-lavender-600 dark:text-lavender-400 italic">
          TogetherSpace Sanctuary
        </div>
      </div>

      {/* Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-ink-muted space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-lavender-500" />
            <p className="text-xs">Opening your private conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-ink-muted space-y-3 p-8">
            <div className="w-14 h-14 rounded-3xl bg-lavender-100 dark:bg-lavender-950/40 text-lavender-600 dark:text-lavender-300 flex items-center justify-center shadow-soft">
              <Heart className="w-7 h-7 fill-current" />
            </div>
            <h3 className="font-serif text-lg font-medium text-ink dark:text-white">
              Your Sanctuary Awaits
            </h3>
            <p className="text-xs max-w-xs text-ink-light">
              Send your very first intimate message, whisper, or photo to your partner. Only you two will ever read it.
            </p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([dateStr, msgs]) => (
            <div key={dateStr} className="space-y-4">
              {/* Date Divider */}
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-space-cardLight dark:bg-space-cardDark text-ink-muted dark:text-gray-400 border border-space-borderLight dark:border-space-borderDark">
                  {formatDateHeader(msgs[0].createdAt)}
                </span>
              </div>

              {/* Message Items */}
              {msgs.map((msg) => {
                const isMine = msg.senderId === user?.id;

                return (
                  <div
                    key={msg.id}
                    className={`group flex items-end gap-2 ${
                      isMine ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {/* Delete button on hover (Mine only) */}
                    {isMine && !msg.id.startsWith('temp-') && (
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-ink-muted hover:text-coral-500 rounded-lg hover:bg-space-cardLight dark:hover:bg-space-cardDark"
                        title="Delete message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Message Bubble Container */}
                    <div
                      className={`max-w-[78%] sm:max-w-[65%] rounded-3xl p-3.5 sm:p-4 text-sm shadow-soft transition-all duration-150 ${
                        isMine
                          ? 'bg-gradient-to-tr from-lavender-600 to-lavender-500 text-white rounded-br-sm'
                          : 'bg-white dark:bg-space-cardDark text-ink dark:text-gray-100 border border-space-borderLight dark:border-space-borderDark rounded-bl-sm'
                      }`}
                    >
                      {/* Attached Media */}
                      {msg.mediaUrl && (
                        <div className="mb-2 rounded-2xl overflow-hidden max-h-72">
                          {msg.mediaType === 'video' ? (
                            <video
                              src={msg.mediaUrl}
                              controls
                              className="w-full h-auto rounded-2xl object-cover"
                            />
                          ) : (
                            <img
                              src={msg.mediaUrl}
                              alt="Shared media"
                              className="w-full h-auto rounded-2xl object-cover hover:scale-[1.02] transition-transform cursor-pointer"
                              onClick={() => window.open(msg.mediaUrl, '_blank')}
                            />
                          )}
                        </div>
                      )}

                      {/* Text content */}
                      {msg.content && (
                        <p className="whitespace-pre-wrap break-words leading-relaxed">
                          {msg.content}
                        </p>
                      )}

                      {/* Footer: Time + Read Checkmarks */}
                      <div
                        className={`flex items-center justify-end gap-1 text-[10px] mt-1.5 ${
                          isMine ? 'text-lavender-200' : 'text-ink-muted dark:text-gray-400'
                        }`}
                      >
                        <span>{formatTime(msg.createdAt)}</span>
                        {isMine && (
                          <span>
                            {msg.isRead ? (
                              <CheckCheck className="w-3.5 h-3.5 text-coral-200" title="Read" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-lavender-200" title="Sent" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Partner Typing Bubble */}
        {partnerTyping && (
          <div className="flex items-center gap-2 text-ink-muted text-xs animate-in fade-in">
            <div className="px-3.5 py-2 rounded-2xl bg-space-cardLight dark:bg-space-cardDark border border-space-borderLight dark:border-space-borderDark flex items-center gap-1.5 shadow-soft">
              <span className="w-1.5 h-1.5 bg-lavender-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-lavender-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-lavender-500 rounded-full animate-bounce" />
            </div>
            <span className="text-[11px] font-medium text-ink-light">Partner is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview Bar */}
      {mediaPreview && (
        <div className="px-6 py-2.5 bg-space-cardLight dark:bg-space-cardDark/80 border-t border-space-borderLight dark:border-space-borderDark flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-space-borderLight dark:border-space-borderDark bg-black">
              {mediaPreview.type === 'video' ? (
                <video src={mediaPreview.url} className="w-full h-full object-cover" />
              ) : (
                <img src={mediaPreview.url} alt="preview" className="w-full h-full object-cover" />
              )}
            </div>
            <span className="text-xs text-ink-muted truncate max-w-xs">
              {attachedFile?.name}
            </span>
          </div>
          <button
            onClick={removeAttachment}
            className="p-1 rounded-full text-ink-muted hover:text-coral-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Emoji Bar */}
      {showEmojiPicker && (
        <div className="px-6 py-2 bg-space-cardLight dark:bg-space-cardDark border-t border-space-borderLight dark:border-space-borderDark flex items-center gap-2 overflow-x-auto">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setInputContent((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="text-lg p-1 rounded-xl hover:bg-space-borderLight dark:hover:bg-space-borderDark transition-transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Message Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 sm:p-4 bg-white/80 dark:bg-space-surfaceDark border-t border-space-borderLight dark:border-space-borderDark flex items-center gap-2"
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Media Attach Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-2xl text-ink-muted hover:text-lavender-600 dark:hover:text-lavender-400 hover:bg-space-cardLight dark:hover:bg-space-cardDark transition-colors"
          title="Attach photo or video"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className="p-2.5 rounded-2xl text-ink-muted hover:text-lavender-600 dark:hover:text-lavender-400 hover:bg-space-cardLight dark:hover:bg-space-cardDark transition-colors"
          title="Insert emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputContent}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type an intimate message... (Enter to send)"
          className="flex-1 py-2.5 px-4 rounded-2xl bg-space-cardLight dark:bg-space-cardDark text-ink dark:text-white placeholder:text-ink-light text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400 resize-none max-h-32 transition-all"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={sending || uploadingMedia || (!inputContent.trim() && !attachedFile)}
          className="p-3 rounded-2xl bg-lavender-600 hover:bg-lavender-700 disabled:opacity-40 disabled:hover:bg-lavender-600 text-white shadow-soft transition-all active:scale-95 flex items-center justify-center shrink-0"
        >
          {sending || uploadingMedia ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatPage;

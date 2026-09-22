import React, { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, X, Loader2, Image, Film } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import useChat_Actions from '../../hooks/useChat';

const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024,   // 10 MB
  video: 100 * 1024 * 1024,  // 100 MB
};

const MessageInput = ({ emit }) => {
  const { state } = useChat();
  const { session, participant, uploadProgress } = state;

  const sessionToken     = session?.sessionToken;
  const { sendTextMessage, handleTyping, stopTyping, uploadMedia } = useChat_Actions({ emit, sessionToken });

  const [text, setText]                 = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [uploadError, setUploadError]   = useState('');

  const fileInputRef          = useRef(null);
  const textareaRef           = useRef(null);
  const lastCompositionEndRef = useRef(null);

  const handleTextChange = (e) => { setText(e.target.value); handleTyping(); };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (e.isComposing || e.keyCode === 229) return;
      if (lastCompositionEndRef.current !== null && Math.abs(e.timeStamp - lastCompositionEndRef.current) < 50) return;
      handleSend();
    }
  };

  const handleCompositionEnd = (e) => { lastCompositionEndRef.current = e.timeStamp; };

  const handleSend = useCallback(() => {
    if (!text.trim() && !selectedFile) return;
    stopTyping();
    if (selectedFile) {
      handleUpload();
    } else {
      sendTextMessage(text);
      setText('');
      textareaRef.current?.focus();
    }
  }, [text, selectedFile, sendTextMessage, stopTyping]); // eslint-disable-line

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) { setUploadError('Only images and videos are allowed.'); return; }
    const maxSize = isImage ? MAX_FILE_SIZES.image : MAX_FILE_SIZES.video;
    if (file.size > maxSize) { setUploadError(`File too large. Max: ${isImage ? '10MB' : '100MB'}.`); return; }
    setSelectedFile(file);
    setUploadError('');
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!selectedFile || uploading) return;
    setUploading(true);
    setUploadError('');
    try {
      await uploadMedia(selectedFile, sessionToken);
      setSelectedFile(null);
      textareaRef.current?.focus();
    } catch (err) {
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const uploadKeys = Object.keys(uploadProgress);
  const currentUploadProgress = uploadKeys.length > 0 ? uploadProgress[uploadKeys[0]] : null;

  return (
    <div className="glass-2 border-t border-white/[0.06] px-4 py-3 flex-shrink-0
                    shadow-[0_-2px_20px_rgba(0,0,0,0.35)]">

      {/* Upload error */}
      {uploadError && (
        <div className="flex items-center gap-2 mb-2 glass-1 border border-red-500/25 rounded-xl px-3 py-2
                        text-xs text-red-300 animate-fade-in">
          <span className="flex-1">{uploadError}</span>
          <button onClick={() => setUploadError('')} className="text-red-400/70 hover:text-red-300 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* File preview chip */}
      {selectedFile && (
        <div className="flex items-center gap-2 mb-2 glass-1 border border-violet-500/25 rounded-xl px-3 py-2 animate-slide-down">
          {selectedFile.type.startsWith('image/')
            ? <Image className="w-4 h-4 text-violet-400 flex-shrink-0" />
            : <Film  className="w-4 h-4 text-violet-400 flex-shrink-0" />
          }
          <span className="text-xs text-gray-300 truncate flex-1">{selectedFile.name}</span>
          <span className="text-xs text-gray-600 flex-shrink-0">
            {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
          </span>
          <button onClick={() => setSelectedFile(null)} className="text-gray-600 hover:text-gray-300 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Upload progress */}
      {currentUploadProgress !== null && (
        <div className="mb-2 animate-fade-in">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>Uploading…</span>
            <span className="tabular-nums">{currentUploadProgress}%</span>
          </div>
          <div className="h-1 glass-1 rounded-full overflow-hidden border border-white/[0.05]">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${currentUploadProgress}%`,
                background: 'linear-gradient(90deg, #7c3aed, #6366f1)',
                boxShadow: '0 0 8px rgba(139,92,246,0.6)',
              }}
            />
          </div>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Attach */}
        <button
          onClick={() => fileInputRef.current?.click()}
          id="attach-file-btn"
          className="p-2.5 rounded-xl glass-1 hover:glass-2 border border-white/[0.06] hover:border-violet-500/25
                     text-gray-500 hover:text-violet-400 transition-all duration-200 flex-shrink-0"
          title="Attach image or video"
          disabled={uploading}
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,video/quicktime"
          className="hidden"
          onChange={handleFileSelect}
          id="file-input"
        />

        {/* Textarea */}
        <label htmlFor="chat-input" className="sr-only">Message</label>
        <textarea
          ref={textareaRef}
          id="chat-input"
          placeholder={selectedFile ? 'Add a caption (optional)…' : 'Type a message…'}
          className="flex-1 input-field resize-none max-h-32 py-2.5 leading-relaxed"
          rows={1}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onCompositionEnd={handleCompositionEnd}
          disabled={uploading}
          style={{ minHeight: '42px' }}
        />

        {/* Send */}
        <button
          onClick={handleSend}
          id="send-message-btn"
          disabled={(!text.trim() && !selectedFile) || uploading}
          className="btn-primary py-2.5 px-3 flex-shrink-0"
        >
          {uploading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Send    className="w-4 h-4" />
          }
        </button>
      </div>
    </div>
  );
};

export default MessageInput;

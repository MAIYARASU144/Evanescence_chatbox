import React, { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, X, Loader2, Image, Film } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import useChat_Actions from '../../hooks/useChat';

const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024,  // 10 MB
  video: 100 * 1024 * 1024, // 100 MB
};

const MessageInput = ({ emit }) => {
  const { state } = useChat();
  const { session, participant, uploadProgress } = state;

  const sessionToken = session?.sessionToken;
  const participantId = participant?.participantId;
  const participantToken = participant?.participantToken;

  const { sendTextMessage, handleTyping, stopTyping, uploadMedia } = useChat_Actions({
    sessionToken,
    participantId,
    participantToken,
  });

  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Track composition for IME-safe Enter (Safari + other browsers)
  const lastCompositionEndRef = useRef(null);

  const handleTextChange = (e) => {
    setText(e.target.value);
    handleTyping();
  };

  // IME-safe Enter-to-send (per modern-web-guidance)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Standard check
      if (e.isComposing || e.keyCode === 229) return;
      // Safari fallback: compositionend fires before keydown
      if (
        lastCompositionEndRef.current !== null &&
        Math.abs(e.timeStamp - lastCompositionEndRef.current) < 50
      ) return;

      handleSend();
    }
  };

  const handleCompositionEnd = (e) => {
    lastCompositionEndRef.current = e.timeStamp;
  };

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

    if (!isImage && !isVideo) {
      setUploadError('Only images and videos are allowed.');
      return;
    }

    const maxSize = isImage ? MAX_FILE_SIZES.image : MAX_FILE_SIZES.video;
    if (file.size > maxSize) {
      setUploadError(`File too large. Max: ${isImage ? '10MB' : '100MB'}.`);
      return;
    }

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
    <div className="glass border-t border-white/5 px-4 py-3 flex-shrink-0">
      {/* Upload error */}
      {uploadError && (
        <div className="flex items-center gap-2 mb-2 bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-2 text-xs text-red-300">
          <span className="flex-1">{uploadError}</span>
          <button onClick={() => setUploadError('')} className="text-red-400 hover:text-red-200">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* File preview */}
      {selectedFile && (
        <div className="flex items-center gap-2 mb-2 bg-violet-900/20 border border-violet-700/30 rounded-lg px-3 py-2 animate-fade-in">
          {selectedFile.type.startsWith('image/') ? (
            <Image className="w-4 h-4 text-violet-400" />
          ) : (
            <Film className="w-4 h-4 text-violet-400" />
          )}
          <span className="text-xs text-gray-300 truncate flex-1">{selectedFile.name}</span>
          <span className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(1)}MB</span>
          <button onClick={() => setSelectedFile(null)} className="text-gray-500 hover:text-gray-300">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Upload progress */}
      {currentUploadProgress !== null && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Uploading...</span>
            <span>{currentUploadProgress}%</span>
          </div>
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 transition-all duration-200 rounded-full"
              style={{ width: `${currentUploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          id="attach-file-btn"
          className="p-2.5 rounded-xl glass-light hover:bg-white/10 text-gray-400 hover:text-violet-400 transition-colors flex-shrink-0"
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

        {/* Text input */}
        <label htmlFor="chat-input" className="sr-only">Message</label>
        <textarea
          ref={textareaRef}
          id="chat-input"
          placeholder={selectedFile ? 'Add a caption (optional)...' : 'Type a message...'}
          className="flex-1 input-field resize-none max-h-32 py-2.5 leading-relaxed"
          rows={1}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onCompositionEnd={handleCompositionEnd}
          disabled={uploading}
          style={{ minHeight: '42px' }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          id="send-message-btn"
          disabled={(!text.trim() && !selectedFile) || uploading}
          className="btn-primary py-2.5 px-3 flex-shrink-0"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;

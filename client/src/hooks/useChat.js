import { useCallback, useRef } from 'react';
import { getUploadUrl as apiGetUploadUrl, confirmUpload as apiConfirmUpload } from '../services/api';
import { useChat } from '../context/ChatContext';

const TYPING_DEBOUNCE_MS = 1500;

/**
 * Chat operations hook — message sending, typing, media upload.
 */
const useChat_Actions = ({ emit, sessionToken }) => {
  const { setUploadProgress, clearUploadProgress, addMessage } = useChat();

  // Typing debounce
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  /**
   * Send a text message via socket.
   */
  const sendTextMessage = useCallback(
    (content) => {
      if (!content || !content.trim()) return;
      emit('message:send', { type: 'text', content: content.trim() });
    },
    [emit]
  );

  /**
   * Emit typing:start / typing:stop with debounce.
   */
  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emit('typing:start');
    }

    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      emit('typing:stop');
    }, TYPING_DEBOUNCE_MS);
  }, [emit]);

  const stopTyping = useCallback(() => {
    clearTimeout(typingTimerRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      emit('typing:stop');
    }
  }, [emit]);

  /**
   * Upload media:
   * 1. Get presigned PUT URL from backend
   * 2. Upload directly to R2 (with progress)
   * 3. Confirm upload with backend
   * 4. Send media message via socket
   */
  const uploadMedia = useCallback(
    async (file, sessionToken_arg) => {
      const uploadId = `upload_${Date.now()}`;

      try {
        setUploadProgress(uploadId, 0);

        // Step 1: Get presigned upload URL
        const { data } = await apiGetUploadUrl({
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          sessionToken: sessionToken_arg || sessionToken,
        });

        const { uploadUrl, mediaId } = data;

        // Step 2: Upload directly to R2 with XMLHttpRequest for progress tracking
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              setUploadProgress(uploadId, percent);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed: ${xhr.statusText}`));
          };

          xhr.onerror = () => reject(new Error('Upload network error'));

          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });

        setUploadProgress(uploadId, 100);

        // Step 3: Confirm upload with backend
        await apiConfirmUpload(mediaId, sessionToken_arg || sessionToken);

        // Step 4: Send media message via socket
        const type = file.type.startsWith('image/') ? 'image' : 'video';
        emit('message:send', { type, mediaId, content: '' });

        clearUploadProgress(uploadId);
        return { success: true, mediaId };
      } catch (err) {
        clearUploadProgress(uploadId);
        throw err;
      }
    },
    [emit, sessionToken, setUploadProgress, clearUploadProgress]
  );

  return { sendTextMessage, handleTyping, stopTyping, uploadMedia };
};

export default useChat_Actions;

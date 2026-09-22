import { useEffect, useRef, useCallback } from 'react';
import { getSocket, disconnectSocket } from '../services/socket';
import { useChat } from '../context/ChatContext';
import {
  playMessageSound,
  playJoinSound,
  playLeaveSound,
} from '../utils/sounds';

/**
 * Manages the Socket.IO connection lifecycle and event handlers.
 */
const useSocket = ({ sessionToken, participantId, participantToken, enabled = false }) => {
  const socketRef = useRef(null);
  const {
    setConnectionStatus,
    setMessages,
    setParticipants,
    addMessage,
    addParticipant,
    removeParticipant,
    updateParticipantStatus,
    setTypingStart,
    setTypingStop,
    sessionEnded,
    setSession,
    markMessageSeen,
    setEvicted,
  } = useChat();

  const cleanupSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current = null;
    }
    disconnectSocket();
    setConnectionStatus('disconnected');
  }, [setConnectionStatus]);

  useEffect(() => {
    if (!enabled || !sessionToken || !participantId || !participantToken) return;

    const socket = getSocket({ sessionToken, participantId, participantToken });
    socketRef.current = socket;

    // ── Connection events ──
    socket.on('connect', () => {
      setConnectionStatus('connected');
      // Tell server we've reconnected to cancel grace period
      socket.emit('presence:reconnected');
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io client disconnect') {
        setConnectionStatus('disconnected');
      } else {
        setConnectionStatus('reconnecting');
      }
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] connect_error:', err.message);
      // Detect eviction: participant was removed after grace period
      if (err.message && err.message.startsWith('EVICTED')) {
        cleanupSocket();
        setEvicted();
        return;
      }
      setConnectionStatus('error');
    });

    socket.io.on('reconnect', () => {
      setConnectionStatus('connected');
    });

    socket.io.on('reconnect_attempt', () => {
      setConnectionStatus('reconnecting');
    });

    socket.io.on('reconnect_failed', () => {
      setConnectionStatus('error');
    });

    // ── Session events ──
    socket.on('session:state', (data) => {
      setMessages(
        data.messages.map((m) => ({
          messageId: m._id,
          seenBy: m.seenBy || [],
          ...m,
        }))
      );
      setParticipants(data.participants);
      // Use sessionToken from hook params (stable) — not state.session (stale closure)
      setSession({
        sessionToken,
        shareUrl: `${window.location.origin}/chat/${sessionToken}/join`,
        expiresAt: data.expiresAt,
        maxParticipants: data.maxParticipants,
        status: data.status,
      });
    });

    socket.on('session:destroyed', () => {
      sessionEnded();
    });

    socket.on('force:disconnect', () => {
      cleanupSocket();
    });

    // ── Message events ──
    socket.on('message:new', (message) => {
      addMessage(message);
      // Play sound for messages from others (not own messages)
      if (message.senderParticipantId !== participantId) {
        playMessageSound();
      }
    });

    // ── Read receipts ──
    socket.on('message:seen', (data) => {
      markMessageSeen(data);
    });

    // ── Participant events ──
    socket.on('participant:joined', (participant) => {
      addParticipant(participant);
      // Don't play sound for yourself rejoining
      if (participant.participantId !== participantId) {
        playJoinSound();
      }
    });

    socket.on('participant:left', (data) => {
      removeParticipant(data);
      if (data.participantId !== participantId) {
        playLeaveSound();
      }
    });

    // ── Presence events ──
    socket.on('presence:update', (data) => {
      updateParticipantStatus({ participantId: data.participantId, status: data.status });
    });

    socket.on('typing:start', (data) => {
      setTypingStart({ participantId: data.participantId, temporaryName: data.temporaryName });
    });

    socket.on('typing:stop', (data) => {
      setTypingStop({ participantId: data.participantId });
    });

    return () => {
      cleanupSocket();
    };
  }, [enabled, sessionToken, participantId, participantToken]); // eslint-disable-line

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return { emit, socket: socketRef.current };
};

export default useSocket;

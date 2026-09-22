import React, { useEffect, useRef, useCallback } from 'react';
import { useChat } from '../../context/ChatContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const MessageList = ({ emit }) => {
  const { state } = useChat();
  const { messages, typingUsers, participant } = state;
  const bottomRef = useRef(null);
  const lastSeenMsgIdRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Emit message:seen for the latest message from others when new messages arrive
  // Uses a ref to avoid spamming duplicate seen events for the same message
  const emitSeen = useCallback(() => {
    if (!emit || !participant) return;

    // Find the last message NOT sent by us
    const lastOtherMsg = [...messages]
      .reverse()
      .find((m) => m.senderParticipantId !== participant.participantId);

    if (!lastOtherMsg) return;
    const msgId = lastOtherMsg.messageId || lastOtherMsg._id;
    if (!msgId || msgId === lastSeenMsgIdRef.current) return;

    // Only mark as seen if not already seen by us
    const alreadySeen = (lastOtherMsg.seenBy || []).some(
      (s) => s.participantId === participant.participantId
    );
    if (alreadySeen) return;

    lastSeenMsgIdRef.current = msgId;
    emit('message:seen', { messageId: msgId });
  }, [messages, emit, participant]);

  // Trigger seen check when messages change or tab becomes visible
  useEffect(() => {
    emitSeen();

    const handleVisibilityChange = () => {
      if (!document.hidden) emitSeen();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [emitSeen]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" id="message-list">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center py-12">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-gray-500 text-sm">No messages yet.</p>
          <p className="text-gray-600 text-xs mt-1">Be the first to say something!</p>
        </div>
      )}

      {messages.map((message, idx) => {
        const isOwn = message.senderParticipantId === participant?.participantId;
        const prevMsg = messages[idx - 1];
        const showSender =
          !prevMsg ||
          prevMsg.senderParticipantId !== message.senderParticipantId ||
          new Date(message.createdAt) - new Date(prevMsg.createdAt) > 5 * 60 * 1000;

        // Show seen indicators only on own messages that are the last in a run
        const nextMsg = messages[idx + 1];
        const isLastInRun = !nextMsg || nextMsg.senderParticipantId !== message.senderParticipantId;
        const showSeen = isOwn && isLastInRun;

        return (
          <MessageBubble
            key={message.messageId || message._id}
            message={message}
            isOwn={isOwn}
            showSender={showSender}
            showSeen={showSeen}
            selfParticipantId={participant?.participantId}
          />
        );
      })}

      {typingUsers.length > 0 && (
        <TypingIndicator users={typingUsers} />
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;

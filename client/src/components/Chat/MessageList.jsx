import React, { useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const MessageList = () => {
  const { state } = useChat();
  const { messages, typingUsers, participant } = state;
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

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

        return (
          <MessageBubble
            key={message.messageId || message._id}
            message={message}
            isOwn={isOwn}
            showSender={showSender}
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

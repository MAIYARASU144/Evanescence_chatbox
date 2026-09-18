import React from 'react';
import MediaMessage from './MediaMessage';

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessageBubble = ({ message, isOwn, showSender }) => {
  const { type, content, senderName, createdAt, mediaId, messageId, _id } = message;

  return (
    <div className={`flex flex-col animate-slide-up ${isOwn ? 'items-end' : 'items-start'}`}>
      {showSender && (
        <span className={`text-xs text-gray-500 mb-1 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
          {isOwn ? 'You' : senderName}
        </span>
      )}

      <div
        className={`max-w-xs sm:max-w-sm lg:max-w-md rounded-2xl overflow-hidden ${
          isOwn
            ? 'bg-violet-600/80 text-white rounded-tr-sm'
            : 'glass-light text-gray-100 rounded-tl-sm'
        }`}
      >
        {/* Media content */}
        {(type === 'image' || type === 'video') && mediaId && (
          <MediaMessage mediaId={typeof mediaId === 'string' ? mediaId : mediaId._id || mediaId} type={type} />
        )}

        {/* Text content */}
        {content && (
          <p className="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>
        )}

        {/* Timestamp */}
        <p className={`text-[10px] px-3 pb-1.5 ${isOwn ? 'text-violet-200/60 text-right' : 'text-gray-600 text-left'}`}>
          {formatTime(createdAt)}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;

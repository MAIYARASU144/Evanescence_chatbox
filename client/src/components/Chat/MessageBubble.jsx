import React from 'react';
import { CheckCheck, Check } from 'lucide-react';
import MediaMessage from './MediaMessage';

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessageBubble = ({ message, isOwn, showSender, showSeen, selfParticipantId }) => {
  const { type, content, senderName, createdAt, mediaId, messageId, _id, seenBy } = message;

  // Build seen label: list of names who have seen this message (excluding self)
  const seenByOthers = (seenBy || []).filter((s) => s.participantId !== selfParticipantId);
  const hasSeen = seenByOthers.length > 0;

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

        {/* Timestamp + delivery indicator */}
        <div className={`flex items-center gap-1 px-3 pb-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <p className={`text-[10px] ${isOwn ? 'text-violet-200/60' : 'text-gray-600'}`}>
            {formatTime(createdAt)}
          </p>
          {isOwn && (
            hasSeen
              ? <CheckCheck className="w-3 h-3 text-cyan-400" title={`Seen by ${seenByOthers.map((s) => s.temporaryName).join(', ')}`} />
              : <Check className="w-3 h-3 text-violet-300/50" title="Delivered" />
          )}
        </div>
      </div>

      {/* Seen names below the last message in a run */}
      {isOwn && showSeen && hasSeen && (
        <p className="text-[10px] text-cyan-400/70 mt-0.5 px-1 flex items-center gap-0.5">
          <CheckCheck className="w-2.5 h-2.5" />
          Seen by {seenByOthers.map((s) => s.temporaryName).join(', ')}
        </p>
      )}
    </div>
  );
};

export default MessageBubble;

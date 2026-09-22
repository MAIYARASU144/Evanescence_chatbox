import React from 'react';
import { CheckCheck, Check } from 'lucide-react';
import MediaMessage from './MediaMessage';

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessageBubble = ({ message, isOwn, showSender, showSeen, selfParticipantId }) => {
  const { type, content, senderName, createdAt, mediaId, seenBy } = message;

  const seenByOthers = (seenBy || []).filter((s) => s.participantId !== selfParticipantId);
  const hasSeen = seenByOthers.length > 0;

  return (
    <div className={`flex flex-col animate-slide-up ${isOwn ? 'items-end' : 'items-start'}`}>
      {showSender && (
        <span className={`text-xs text-gray-600 mb-1 px-2 ${isOwn ? 'text-right' : 'text-left'}`}>
          {isOwn ? 'You' : senderName}
        </span>
      )}

      <div
        className={`
          max-w-xs sm:max-w-sm lg:max-w-md rounded-2xl overflow-hidden
          transition-all duration-200 hover:shadow-lg
          ${isOwn
            ? `rounded-tr-sm shadow-[0_2px_12px_rgba(109,40,217,0.35)]
               border border-violet-500/30`
            : `glass-1 rounded-tl-sm shadow-[0_2px_12px_rgba(0,0,0,0.35)]
               border-white/[0.07]`
          }
        `}
        style={isOwn ? {
          background: 'linear-gradient(135deg, rgba(124,58,237,0.70) 0%, rgba(109,40,217,0.80) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        } : {}}
      >
        {/* Media */}
        {(type === 'image' || type === 'video') && mediaId && (
          <MediaMessage
            mediaId={typeof mediaId === 'string' ? mediaId : mediaId._id || mediaId}
            type={type}
          />
        )}

        {/* Text */}
        {content && (
          <p className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words
                         ${isOwn ? 'text-white' : 'text-gray-100'}`}>
            {content}
          </p>
        )}

        {/* Timestamp row */}
        <div className={`flex items-center gap-1 px-3 pb-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <p className={`text-[10px] ${isOwn ? 'text-violet-200/50' : 'text-gray-700'}`}>
            {formatTime(createdAt)}
          </p>
          {isOwn && (
            hasSeen
              ? <CheckCheck className="w-3 h-3 text-cyan-400"
                            title={`Seen by ${seenByOthers.map((s) => s.temporaryName).join(', ')}`} />
              : <Check className="w-3 h-3 text-violet-300/40" title="Delivered" />
          )}
        </div>
      </div>

      {/* Seen label */}
      {isOwn && showSeen && hasSeen && (
        <p className="text-[10px] text-cyan-400/60 mt-0.5 px-2 flex items-center gap-0.5 animate-fade-in">
          <CheckCheck className="w-2.5 h-2.5" />
          Seen by {seenByOthers.map((s) => s.temporaryName).join(', ')}
        </p>
      )}
    </div>
  );
};

export default MessageBubble;

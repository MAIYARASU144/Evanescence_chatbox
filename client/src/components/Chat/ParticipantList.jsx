import React from 'react';
import { useChat } from '../../context/ChatContext';
import { Crown } from 'lucide-react';

const ParticipantList = () => {
  const { state } = useChat();
  const { participants, participant: self } = state;

  const online  = participants.filter((p) => p.status === 'online');
  const offline = participants.filter((p) => p.status === 'offline');

  const renderParticipant = (p) => (
    <div
      key={p.participantId}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200
                  ${p.participantId === self?.participantId
                    ? 'glass-1 border border-violet-500/15'
                    : 'hover:glass-1 hover:border hover:border-white/[0.06]'
                  }`}
    >
      {/* Status dot */}
      {p.status === 'online'
        ? <span className="online-dot" />
        : <span className="offline-dot" />
      }

      {/* Name */}
      <span className={`text-sm truncate flex-1 ${p.status === 'offline' ? 'text-gray-700' : 'text-gray-200'}`}>
        {p.temporaryName}
        {p.participantId === self?.participantId && (
          <span className="text-xs text-gray-600 ml-1">(you)</span>
        )}
      </span>

      {/* Crown */}
      {p.role === 'creator' && (
        <Crown className="w-3 h-3 text-amber-400 flex-shrink-0 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" title="Creator" />
      )}
    </div>
  );

  return (
    <div className="p-3 space-y-1">
      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-2 mb-3">
        Participants · {participants.length}
      </p>

      {online.length > 0 && (
        <div className="space-y-0.5">
          {online.map(renderParticipant)}
        </div>
      )}

      {offline.length > 0 && (
        <>
          <p className="text-[10px] text-gray-700 uppercase tracking-widest px-2 pt-3 pb-1">Away</p>
          <div className="space-y-0.5">
            {offline.map(renderParticipant)}
          </div>
        </>
      )}

      {participants.length === 0 && (
        <p className="text-xs text-gray-700 px-2">No participants yet.</p>
      )}
    </div>
  );
};

export default ParticipantList;

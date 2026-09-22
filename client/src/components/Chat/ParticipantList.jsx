import React from 'react';
import { useChat } from '../../context/ChatContext';
import { Crown } from 'lucide-react';

const ParticipantList = () => {
  const { state } = useChat();
  const { participants, participant: self } = state;

  const online = participants.filter((p) => p.status === 'online');
  const offline = participants.filter((p) => p.status === 'offline');

  const renderParticipant = (p) => (
    <div
      key={p.participantId}
      className={`flex items-center gap-2.5 px-4 py-2 rounded-lg transition-colors ${
        p.participantId === self?.participantId ? 'bg-violet-900/20' : ''
      }`}
    >
      {/* Status dot */}
      {p.status === 'online' ? (
        <span className="online-dot flex-shrink-0" />
      ) : (
        <span className="offline-dot flex-shrink-0" />
      )}

      {/* Name */}
      <span className={`text-sm truncate flex-1 ${p.status === 'offline' ? 'text-gray-600' : 'text-gray-200'}`}>
        {p.temporaryName}
        {p.participantId === self?.participantId && (
          <span className="text-xs text-gray-500 ml-1">(you)</span>
        )}
      </span>

      {/* Creator crown */}
      {p.role === 'creator' && (
        <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" title="Creator" />
      )}
    </div>
  );

  return (
    <div className="p-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">
        Participants · {participants.length}
      </p>

      {online.length > 0 && (
        <div className="space-y-0.5 mb-3">
          {online.map(renderParticipant)}
        </div>
      )}

      {offline.length > 0 && (
        <>
          <p className="text-xs text-gray-700 uppercase tracking-wider px-1 mb-1 mt-3">Away</p>
          <div className="space-y-0.5">
            {offline.map(renderParticipant)}
          </div>
        </>
      )}

      {participants.length === 0 && (
        <p className="text-xs text-gray-700 px-1">No participants yet.</p>
      )}
    </div>
  );
};

export default ParticipantList;

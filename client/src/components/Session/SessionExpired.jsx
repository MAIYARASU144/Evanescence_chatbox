import React from 'react';
import { Trash2, Home } from 'lucide-react';

const SessionExpired = () => {
  const handleGoHome = () => {
    sessionStorage.removeItem('participantId');
    sessionStorage.removeItem('participantToken');
    sessionStorage.removeItem('sessionToken');
    sessionStorage.removeItem('temporaryName');
    window.location.href = '/';
  };

  return (
    <div className="z-page min-h-screen flex flex-col items-center justify-center px-4">
      <div className="card text-center max-w-sm w-full animate-scale-in glow-violet">

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center
                        bg-gradient-to-br from-red-500/20 to-red-700/10
                        border border-red-500/25
                        shadow-[0_0_20px_rgba(239,68,68,0.20)]">
          <Trash2 className="w-8 h-8 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-100 mb-2">Chat Ended</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-5">
          This temporary chat has ended and all data has been permanently erased.
        </p>

        {/* Deletion summary */}
        <div className="glass-1 rounded-xl p-4 mb-4 text-left border border-white/[0.07]">
          <p className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">What was deleted</p>
          <ul className="space-y-2">
            {['All messages', 'All shared media (from server)', 'Session data and invite link'].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-xs text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0
                                 shadow-[0_0_5px_rgba(52,211,153,0.6)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Note */}
        <div className="glass-1 rounded-xl p-3 mb-5 border border-amber-500/20">
          <p className="text-xs text-amber-400/80 leading-relaxed">
            <strong>Note:</strong> Files downloaded to your device cannot be remotely deleted.
            Only server-side copies have been erased.
          </p>
        </div>

        <button onClick={handleGoHome} id="go-home-btn" className="btn-primary w-full">
          <Home className="w-4 h-4" />
          Create a New Chat
        </button>
      </div>
    </div>
  );
};

export default SessionExpired;

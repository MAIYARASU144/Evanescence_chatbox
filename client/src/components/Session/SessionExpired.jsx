import React from 'react';
import { Trash2, Home } from 'lucide-react';

const SessionExpired = () => {
  const handleGoHome = () => {
    // Clear session credentials
    sessionStorage.removeItem('participantId');
    sessionStorage.removeItem('participantToken');
    sessionStorage.removeItem('sessionToken');
    sessionStorage.removeItem('temporaryName');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="card text-center max-w-sm w-full animate-slide-up">
        <div className="w-14 h-14 rounded-2xl bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-400" />
        </div>

        <h1 className="text-xl font-bold text-gray-100 mb-2">Chat Ended</h1>

        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          This temporary chat has ended.
        </p>

        <div className="glass-light rounded-xl p-4 mb-5 text-left">
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">What was deleted</p>
          <ul className="space-y-1.5 text-xs text-gray-500">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              All messages
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              All shared media (from server)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              Session data and invite link
            </li>
          </ul>
        </div>

        <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-3 mb-5">
          <p className="text-xs text-amber-400/80 leading-relaxed">
            <strong>Note:</strong> Files you downloaded to your device cannot be remotely deleted.
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

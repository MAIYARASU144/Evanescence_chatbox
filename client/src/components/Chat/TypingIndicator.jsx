import React from 'react';

const TypingIndicator = ({ users }) => {
  if (!users || users.length === 0) return null;

  const names = users.map((u) => u.temporaryName);
  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing`
      : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <div className="glass-1 rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-2.5
                      border border-white/[0.07] shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
        {/* Dots */}
        <div className="flex gap-1 items-center">
          <span className="typing-dot w-1.5 h-1.5 rounded-full block
                           bg-violet-400 shadow-[0_0_4px_rgba(167,139,250,0.7)]" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full block
                           bg-violet-400 shadow-[0_0_4px_rgba(167,139,250,0.7)]" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full block
                           bg-violet-400 shadow-[0_0_4px_rgba(167,139,250,0.7)]" />
        </div>
        <span className="text-xs text-gray-400 italic">{label}</span>
      </div>
    </div>
  );
};

export default TypingIndicator;

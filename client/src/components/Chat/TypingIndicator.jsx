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
      <div className="glass-light rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-1 items-center">
          <span className="typing-dot w-1.5 h-1.5 bg-violet-400 rounded-full block" />
          <span className="typing-dot w-1.5 h-1.5 bg-violet-400 rounded-full block" />
          <span className="typing-dot w-1.5 h-1.5 bg-violet-400 rounded-full block" />
        </div>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
    </div>
  );
};

export default TypingIndicator;

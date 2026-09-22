import React from 'react';
import { WifiOff, Loader2, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
  connected:    null, // no banner
  reconnecting: {
    icon:      Loader2,
    text:      'Reconnecting…',
    bg:        'rgba(217,119,6,0.15)',
    border:    'rgba(217,119,6,0.25)',
    color:     '#fcd34d',
    animate:   true,
  },
  error: {
    icon:      AlertCircle,
    text:      'Connection failed. Please refresh.',
    bg:        'rgba(239,68,68,0.12)',
    border:    'rgba(239,68,68,0.25)',
    color:     '#fca5a5',
    animate:   false,
  },
  disconnected: {
    icon:      WifiOff,
    text:      'Disconnected.',
    bg:        'rgba(255,255,255,0.04)',
    border:    'rgba(255,255,255,0.08)',
    color:     '#6b7280',
    animate:   false,
  },
};

const ConnectionStatus = ({ status }) => {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const { icon: Icon, text, bg, border, color, animate } = config;

  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs animate-slide-down z-20"
      style={{
        background:   bg,
        borderBottom: `1px solid ${border}`,
        color,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <Icon className={`w-3.5 h-3.5 ${animate ? 'animate-spin' : ''}`} />
      <span>{text}</span>
    </div>
  );
};

export default ConnectionStatus;

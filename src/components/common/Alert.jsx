import React from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export const Alert = ({ 
  type = 'info', 
  message, 
  onClose,
  className = '' 
}) => {
  const types = {
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-500'
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-500'
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      icon: AlertTriangle,
      iconColor: 'text-yellow-500'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: Info,
      iconColor: 'text-blue-500'
    }
  };

  const config = types[type];
  const Icon = config.icon;

  return (
    <div className={`
      ${config.bg} border rounded-lg p-4 flex items-start gap-3 ${className}
    `}>
      <Icon className={config.iconColor} size={20} />
      <p className={`flex-1 text-sm ${config.text}`}>{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className={`${config.text} hover:opacity-75`}
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};
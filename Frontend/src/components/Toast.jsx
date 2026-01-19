import { useEffect } from 'react';

function Toast({ message, type = 'error', onClose, duration = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    error: 'bg-red-300',
    success: 'bg-green-300',
    info: 'bg-blue-300',
    warning: 'bg-yellow-300'
  }[type] || 'bg-gray-300';

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-slide-in">
      <div
        className={`${bgColor} border-4 border-black rounded-lg shadow-[8px_8px_0_black] p-4 max-w-md min-w-[300px]`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="font-bold text-sm leading-relaxed whitespace-pre-line">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center font-black text-lg hover:scale-110 transition-transform"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

export default Toast;

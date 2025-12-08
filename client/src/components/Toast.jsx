import { useEffect } from 'react';
import { MdCheckCircle, MdError, MdClose } from 'react-icons/md';

const Toast = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top fade-in duration-300">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-lg backdrop-blur-lg border ${
        type === 'success' 
          ? 'bg-success/20 border-success/50 text-success'
          : 'bg-error/20 border-error/50 text-error'
      } neon-glow`}>
        {type === 'success' ? (
          <MdCheckCircle className="text-2xl flex-shrink-0" />
        ) : (
          <MdError className="text-2xl flex-shrink-0" />
        )}
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 hover:opacity-70 transition-opacity flex-shrink-0"
        >
          <MdClose className="text-xl" />
        </button>
      </div>
    </div>
  );
};

export default Toast;

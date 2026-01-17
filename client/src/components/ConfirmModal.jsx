import { MdClose, MdWarning } from 'react-icons/md';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Delete', 
  cancelText = 'Cancel',
  disabled = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-card rounded-xl border border-purple-neon/30 shadow-neon-pink overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-purple-neon/20">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/20">
              <MdWarning className="text-xl sm:text-2xl text-red-500" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-text-primary">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={disabled}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-purple-neon/10 text-text-secondary hover:text-text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MdClose className="text-xl sm:text-2xl" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          <div className="text-text-secondary leading-relaxed text-sm sm:text-base">
            {message}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-purple-neon/20 bg-background/50">
          <button
            onClick={onClose}
            disabled={disabled}
            className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg bg-card border border-purple-neon/30 text-text-primary hover:bg-purple-neon/10 transition-all font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            disabled={disabled}
            className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all font-medium shadow-lg hover:shadow-red-500/50 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

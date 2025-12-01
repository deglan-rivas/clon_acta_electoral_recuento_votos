// ConfirmDialog - Custom confirmation dialog component
// Shows centered dialog with institutional JNE colors for user confirmations

import { Button } from './button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  details,
  confirmText = 'ACEPTAR',
  cancelText = 'CANCELAR',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - no onClick to prevent closing on outside click */}
      <div className="absolute inset-0" />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl w-[500px] border-4 border-red-800">
        {/* Header */}
        <div className="text-white text-center py-3 px-4 rounded-t-md font-bold text-lg bg-red-800">
          {title}
        </div>

        {/* Message */}
        <div className="p-6 text-gray-800">
          <p className="font-semibold text-base mb-2">{message}</p>
          {details && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                {details}
              </pre>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <Button
            onClick={onCancel}
            className="bg-gray-300 text-gray-800 font-semibold px-6 py-2 hover:bg-gray-400"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className="text-white font-semibold px-6 py-2 hover:bg-red-900 bg-red-800"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

// VoteAlert - Alert notification component for vote entry confirmation
// Shows centered alert with institutional JNE colors

import { useEffect, useRef } from 'react';
import { Button } from './button';

type AlertType = 'with-button' | 'auto-dismiss';
type AlertPosition = 'center' | 'top';

interface VoteAlertProps {
  isOpen: boolean;
  voteCount: number;
  alertType: AlertType;
  position?: AlertPosition;
  message?: string;
  onClose: () => void;
}

export function VoteAlert({ isOpen, voteCount, alertType, position = 'center', message = 'Voto ingresado correctamente.', onClose }: VoteAlertProps) {
  const onCloseRef = useRef(onClose);

  // Keep the ref updated
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Auto-dismiss after 2 seconds if alertType is 'auto-dismiss'
  useEffect(() => {
    if (isOpen && alertType === 'auto-dismiss') {
      const timer = setTimeout(() => {
        onCloseRef.current();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, alertType]);

  if (!isOpen) return null;

  const containerClass = position === 'top'
    ? 'fixed inset-0 z-50 flex items-start justify-center pt-8 pointer-events-none'
    : 'fixed inset-0 z-50 flex items-center justify-center pointer-events-none';

  return (
    <div className={containerClass}>
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-[400px] border-4 pointer-events-auto border-red-800"
      >
        {/* Header */}
        <div
          className="text-white text-center py-3 px-4 rounded-t-md mb-4 font-bold text-lg bg-red-800"
        >
          Recuento de Votos JNE
        </div>

        {/* Message */}
        <div className="text-center text-gray-800 mb-6 text-base">
          <p className="font-semibold">{message}</p>
          <p className="mt-2">
            <span className="font-bold text-lg">{voteCount}</span> votos registrados
          </p>
        </div>

        {/* Button (only show if alertType is 'with-button') */}
        {alertType === 'with-button' && (
          <div className="flex justify-center">
            <Button
              onClick={onClose}
              className="text-white font-semibold px-6 py-2 hover:bg-red-800 bg-red-800"
            >
              ACEPTAR
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Expiration Warning Banner Component
 *
 * Displays a warning banner when the application trial period is approaching expiration
 */

import React from 'react';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';

interface ExpirationWarningBannerProps {
  status: 'valid' | 'warning' | 'expired' | 'disabled';
  daysRemaining: number;
  expirationDate: string;
  message: string;
  onDismiss?: () => void;
}

export const ExpirationWarningBanner: React.FC<ExpirationWarningBannerProps> = ({
  status,
  daysRemaining,
  expirationDate,
  message,
  onDismiss
}) => {
  // Don't show banner if valid or disabled
  if (status === 'valid' || status === 'disabled') {
    return null;
  }

  // Format expiration date
  const formattedDate = new Date(expirationDate).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Determine banner style based on status
  const getBannerStyles = () => {
    switch (status) {
      case 'expired':
        return {
          bgColor: 'bg-red-600',
          borderColor: 'border-red-700',
          textColor: 'text-white',
          icon: <XCircle className="h-5 w-5" />
        };
      case 'warning':
        return {
          bgColor: daysRemaining <= 3 ? 'bg-orange-500' : 'bg-yellow-500',
          borderColor: daysRemaining <= 3 ? 'border-orange-600' : 'border-yellow-600',
          textColor: daysRemaining <= 3 ? 'text-white' : 'text-yellow-900',
          icon: daysRemaining <= 3 ? <AlertTriangle className="h-5 w-5" /> : <Clock className="h-5 w-5" />
        };
      default:
        return {
          bgColor: 'bg-gray-500',
          borderColor: 'border-gray-600',
          textColor: 'text-white',
          icon: <Clock className="h-5 w-5" />
        };
    }
  };

  const styles = getBannerStyles();

  return (
    <div
      className={`${styles.bgColor} ${styles.textColor} border-b-2 ${styles.borderColor} px-4 py-3 shadow-md`}
      role="alert"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {styles.icon}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">
              {status === 'expired' ? 'Aplicación Expirada' : 'Aviso de Expiración'}
            </div>
            <div className="text-xs mt-0.5">
              {status === 'expired' ? (
                <span>Esta versión de prueba ha expirado el {formattedDate}</span>
              ) : (
                <span>
                  Esta versión expirará en{' '}
                  <strong className="font-bold">
                    {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'}
                  </strong>
                  {' '}(Fecha: {formattedDate})
                </span>
              )}
            </div>
            {message && (
              <div className="text-xs mt-1 opacity-90">
                {message}
              </div>
            )}
          </div>
        </div>
        {onDismiss && status !== 'expired' && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-4 hover:opacity-75 transition-opacity"
            aria-label="Cerrar aviso"
          >
            <XCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ExpirationWarningBanner;

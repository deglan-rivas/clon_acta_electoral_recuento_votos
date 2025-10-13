import { useEffect, useState } from "react";
import { AppContainer } from "./App/AppContainer";
import { useActaRepository } from "./hooks/useActaRepository";
import { ExpirationWarningBanner } from "./components/ExpirationWarningBanner";

export default function App() {
  const repository = useActaRepository();
  const [appKey, setAppKey] = useState(Date.now());
  const [expirationStatus, setExpirationStatus] = useState<{
    status: 'valid' | 'warning' | 'expired' | 'disabled';
    daysRemaining: number;
    expirationDate: string;
    message: string;
  } | null>(null);
  const [showBanner, setShowBanner] = useState(true);

  // Check trial expiration status on mount
  useEffect(() => {
    const checkExpiration = async () => {
      try {
        const result = await window.api.checkExpiration();
        if (result.success) {
          setExpirationStatus({
            status: result.status as 'valid' | 'warning' | 'expired' | 'disabled',
            daysRemaining: result.daysRemaining || 0,
            expirationDate: result.expirationDate || '',
            message: result.message || ''
          });

          // Log expiration status
          window.api.log.info(`Trial status: ${result.status}, Days remaining: ${result.daysRemaining}`);
        }
      } catch (error) {
        console.error('Failed to check expiration:', error);
        window.api.log.error('Failed to check expiration', error);
      }
    };

    checkExpiration();

    // Recheck expiration every hour
    const interval = setInterval(checkExpiration, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Expose repository utilities to global window for developer menu
    window.clearElectoralData = async () => {
      await repository.clearAll();
      console.log('All electoral data cleared from storage');
    };
    window.debugElectoralData = async () => {
      const allData = await repository.getAllCircunscripcionOrganizations();
      console.log('Electoral Dashboard storage data:', allData);
    };

    // Listen for app reset events
    const handleAppReset = () => {
      console.log('App reset event received, forcing complete remount');

      // Force complete app remount by changing the key
      setAppKey(Date.now());

      // After remount, trigger a focus cycle to fix input events
      setTimeout(() => {
        console.log('Triggering focus cycle to restore input events');
        // Blur and refocus the window to restore input event listeners
        window.blur();
        setTimeout(() => {
          window.focus();
          // Also dispatch focus events to ensure inputs are properly initialized
          document.querySelectorAll('input[type="number"]').forEach(input => {
            input.dispatchEvent(new Event('focus', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
          });
        }, 100);
      }, 200);
    };

    window.addEventListener('app-reset', handleAppReset);

    return () => {
      window.removeEventListener('app-reset', handleAppReset);
    };
  }, [repository]);

  return (
    <div key={appKey}>
      {expirationStatus && showBanner && (
        <ExpirationWarningBanner
          status={expirationStatus.status}
          daysRemaining={expirationStatus.daysRemaining}
          expirationDate={expirationStatus.expirationDate}
          message={expirationStatus.message}
          onDismiss={() => setShowBanner(false)}
        />
      )}
      <AppContainer />
    </div>
  );
}
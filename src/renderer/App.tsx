import { useEffect, useState } from "react";
import { AppContainer } from "./App/AppContainer";
import { useActaRepository } from "./hooks/useActaRepository";

export default function App() {
  const repository = useActaRepository();
  const [appKey, setAppKey] = useState(Date.now());

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
      <AppContainer />
    </div>
  );
}
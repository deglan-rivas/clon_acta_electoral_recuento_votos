import { useEffect, useState } from "react";
import { ElectoralDashboard } from "./components/ElectoralDashboard";
import { Toaster } from "./components/ui/sonner";
import { clearElectoralData, debugElectoralData } from "./lib/localStorage";

export default function App() {
  const [appKey, setAppKey] = useState(Date.now());

  useEffect(() => {
    // Expose localStorage utilities to global window for developer menu
    (window as any).clearElectoralData = clearElectoralData;
    (window as any).debugElectoralData = debugElectoralData;

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
  }, []);

  return (
    <div key={appKey}>
      <ElectoralDashboard />
      <Toaster position="top-right" />
    </div>
  );
}
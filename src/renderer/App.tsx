import { useEffect } from "react";
import { ElectoralDashboard } from "./components/ElectoralDashboard";
import { Toaster } from "./components/ui/sonner";
import { clearElectoralData, debugElectoralData } from "./lib/localStorage";

export default function App() {
  useEffect(() => {
    // Expose localStorage utilities to global window for developer menu
    (window as any).clearElectoralData = clearElectoralData;
    (window as any).debugElectoralData = debugElectoralData;
  }, []);

  return (
    <>
      <ElectoralDashboard />
      <Toaster position="top-right" />
    </>
  );
}
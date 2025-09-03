import { ElectoralDashboard } from "./components/ElectoralDashboard";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <>
      <ElectoralDashboard />
      <Toaster position="top-right" />
    </>
  );
}
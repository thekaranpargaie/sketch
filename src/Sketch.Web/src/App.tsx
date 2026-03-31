import { ReactFlowProvider } from '@xyflow/react';
import { CanvasPage } from './pages/CanvasPage';

export default function App() {
  return (
    <ReactFlowProvider>
      <CanvasPage />
    </ReactFlowProvider>
  );
}

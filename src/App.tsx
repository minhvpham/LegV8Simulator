import React, { useState } from 'react';
import CPUDatapath from './components/CPU/CPUDatapath';
import ControlPanel from './components/ControlPanel';
import CodeEditor from './components/CodeEditor';
import RegisterMemoryViewer from './components/RegisterMemoryViewer';
import { useSimulatorStore } from './store/simulatorStore';
import './index.css';

const App: React.FC = () => {
  const [showEditor, setShowEditor] = useState(true);
  const { mode } = useSimulatorStore();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">LEGv8 CPU Simulator</h1>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                mode === 'simulation' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {mode === 'simulation' ? '🎬 Animation Mode' : '⚡ Realtime Mode'}
              </div>
            </div>
            
            <button
              onClick={() => setShowEditor(!showEditor)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {showEditor ? 'Hide Editor' : 'Show Editor'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-full mx-auto p-4 space-y-4">
        
        {/* Control Panel and Code Editor Row */}
        <div className={`grid gap-4 ${showEditor ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Control Panel */}
          <div className="bg-white rounded-lg shadow-lg">
            <ControlPanel />
          </div>

          {/* Code Editor */}
          {showEditor && (
            <div className="bg-white rounded-lg shadow-lg" style={{ minHeight: '300px' }}>
              <CodeEditor />
            </div>
          )}
        </div>

        {/* Register and Memory Viewer */}
        <RegisterMemoryViewer />

        {/* CPU Datapath */}
        <div className="bg-white rounded-lg shadow-lg" style={{ minHeight: '700px' }}>
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">
              LEGv8 Single-Cycle Processor Datapath
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Interactive visualization of the CPU architecture with real-time data flow
            </p>
          </div>
          <div className="relative" style={{ height: '700px' }}>
            <CPUDatapath />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 py-4">
          <p>LEGv8 CPU Simulator - Built with React, TypeScript, and GSAP</p>
          <p className="mt-1">
            Features: Real-time execution, step-by-step debugging, animated data flow visualization
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App; 
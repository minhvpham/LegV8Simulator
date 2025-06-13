import React, { useEffect, useState } from 'react';
import { wirePathCalculator } from '../../utils/wirePathCalculator';
import { componentRegistry } from '../../utils/componentRegistry';
import { Point } from '../../types/animationTypes';

interface WirePathVisualizerProps {
  isVisible: boolean;
  selectedConnection?: string;
  // NEW: Multi-circle support
  activeCircles?: Map<string, any>;
  showMultiplePaths?: boolean;
  debugMode?: boolean;
}

/**
 * Helper function to get a unique color for each circle path
 */
const getCirclePathColor = (circleId: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  
  // Generate a consistent color based on circleId
  let hash = 0;
  for (let i = 0; i < circleId.length; i++) {
    hash = circleId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/**
 * Enhanced debug component to visualize wire paths for multi-circle animation
 * Supports multiple simultaneous paths, shared segments, and circle tracking
 */
export const WirePathVisualizer: React.FC<WirePathVisualizerProps> = ({ 
  isVisible, 
  selectedConnection,
  activeCircles = new Map(),
  showMultiplePaths = false,
  debugMode = false
}) => {
  const [availableConnections, setAvailableConnections] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [activePaths, setActivePaths] = useState<Map<string, any>>(new Map());
  const [sharedSegments, setSharedSegments] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    if (isVisible) {
      const connections = wirePathCalculator.getAvailableConnections();
      setAvailableConnections(connections);
      
      if (selectedConnection) {
        const [from, to] = selectedConnection.split('->');
        const path = componentRegistry.calculatePath(from, to);
        setCurrentPath(path);
      }
    }
  }, [isVisible, selectedConnection]);

  // NEW: Update active paths when circles change
  useEffect(() => {
    if (showMultiplePaths && activeCircles.size > 0) {
      const paths = wirePathCalculator.getActivePaths();
      const segments = wirePathCalculator.getSharedSegments();
      setActivePaths(paths);
      setSharedSegments(segments);
    }
  }, [activeCircles, showMultiplePaths]);

  if (!isVisible) return null;

  return (
    <g className="wire-path-visualizer">
      {/* Render multiple active paths for circles */}
      {showMultiplePaths && activePaths.size > 0 && (
        <g className="active-circle-paths">
          {Array.from(activePaths.entries()).map(([circleId, pathInfo]) => (
            <g key={`circle-path-${circleId}`}>
              {/* Draw path lines with different colors per circle */}
              {pathInfo.path.map((point: Point, index: number) => {
                if (index === pathInfo.path.length - 1) return null;
                const nextPoint = pathInfo.path[index + 1];
                return (
                  <line
                    key={`circle-${circleId}-line-${index}`}
                    x1={point.x}
                    y1={point.y}
                    x2={nextPoint.x}
                    y2={nextPoint.y}
                    stroke={getCirclePathColor(circleId)}
                    strokeWidth="2"
                    strokeDasharray="3,3"
                    opacity="0.7"
                  />
                );
              })}
              
              {/* Draw circle path points */}
              {pathInfo.path.map((point: Point, index: number) => (
                <circle
                  key={`circle-${circleId}-point-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r="2"
                  fill={getCirclePathColor(circleId)}
                  opacity="0.8"
                />
              ))}
              
              {/* Mark split points */}
              {pathInfo.splitPoints?.map((point: Point, index: number) => (
                <circle
                  key={`split-${circleId}-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="orange"
                  stroke="darkorange"
                  strokeWidth="2"
                  opacity="0.9"
                />
              ))}
              
              {/* Mark merge points */}
              {pathInfo.mergePoints?.map((point: Point, index: number) => (
                <circle
                  key={`merge-${circleId}-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="purple"
                  stroke="darkpurple"
                  strokeWidth="2"
                  opacity="0.9"
                />
              ))}
            </g>
          ))}
        </g>
      )}

      {/* Highlight shared segments */}
      {showMultiplePaths && sharedSegments.size > 0 && (
        <g className="shared-segments">
          {Array.from(sharedSegments.entries()).map(([segmentKey, segmentInfo]) => (
            <g key={`shared-${segmentKey}`}>
              {segmentInfo.segment.map((point: Point, index: number) => {
                if (index === segmentInfo.segment.length - 1) return null;
                const nextPoint = segmentInfo.segment[index + 1];
                return (
                  <line
                    key={`shared-line-${segmentKey}-${index}`}
                    x1={point.x}
                    y1={point.y}
                    x2={nextPoint.x}
                    y2={nextPoint.y}
                    stroke="#FFD700"
                    strokeWidth="4"
                    opacity="0.6"
                  />
                );
              })}
            </g>
          ))}
        </g>
      )}
      
      {/* Render the current single path (debug mode) */}
      {!showMultiplePaths && currentPath.length > 1 && (
        <>
          {/* Draw path lines */}
          {currentPath.map((point, index) => {
            if (index === currentPath.length - 1) return null;
            const nextPoint = currentPath[index + 1];
            return (
              <line
                key={`path-line-${index}`}
                x1={point.x}
                y1={point.y}
                x2={nextPoint.x}
                y2={nextPoint.y}
                stroke="#00FF00"
                strokeWidth="3"
                strokeDasharray="5,5"
                opacity="0.8"
              />
            );
          })}
          
          {/* Draw path points */}
          {currentPath.map((point, index) => (
            <circle
              key={`path-point-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill={index === 0 ? "#FF0000" : index === currentPath.length - 1 ? "#0000FF" : "#00FF00"}
              opacity="0.9"
            />
          ))}
          
          {/* Draw bezier curve representation */}
          <path
            d={componentRegistry.getBezierPath(selectedConnection?.split('->')[0] || '', selectedConnection?.split('->')[1] || '')}
            stroke="#FFD700"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />
        </>
      )}
      
      {/* Connection info */}
      {selectedConnection && (
        <g>
          <rect
            x="10"
            y="10"
            width="300"
            height="100"
            fill="rgba(0,0,0,0.8)"
            rx="5"
          />
          <text
            x="20"
            y="30"
            fill="white"
            fontSize="12"
            fontWeight="bold"
          >
            Connection: {selectedConnection}
          </text>
          <text
            x="20"
            y="50"
            fill="white"
            fontSize="10"
          >
            Path Points: {currentPath.length}
          </text>
          <text
            x="20"
            y="70"
            fill="white"
            fontSize="10"
          >
            Description: {componentRegistry.getConnectionDescription(
              selectedConnection.split('->')[0], 
              selectedConnection.split('->')[1]
            )}
          </text>
          <text
            x="20"
            y="90"
            fill="white"
            fontSize="8"
          >
            Red: Start, Blue: End, Green: Path, Gold: Bezier
          </text>
        </g>
      )}
    </g>
  );
};

/**
 * Enhanced control panel for wire path debugging with multi-circle support
 */
export const WirePathDebugPanel: React.FC<{
  onConnectionSelect: (connection: string) => void;
  onToggleVisualizer: (visible: boolean) => void;
  onToggleMultiPath?: (enabled: boolean) => void;
  activeCircles?: Map<string, any>;
}> = ({ 
  onConnectionSelect, 
  onToggleVisualizer, 
  onToggleMultiPath,
  activeCircles = new Map()
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState('PC->InsMem');
  const [availableConnections, setAvailableConnections] = useState<string[]>([]);
  const [showMultiPath, setShowMultiPath] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    const connections = wirePathCalculator.getAvailableConnections();
    setAvailableConnections(connections);
  }, []);

  const handleToggle = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    onToggleVisualizer(newVisibility);
  };

  const handleConnectionChange = (connection: string) => {
    setSelectedConnection(connection);
    onConnectionSelect(connection);
  };

  const handleMultiPathToggle = () => {
    const newMultiPath = !showMultiPath;
    setShowMultiPath(newMultiPath);
    if (onToggleMultiPath) {
      onToggleMultiPath(newMultiPath);
    }
  };

  return (
    <div className="absolute top-20 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-30 min-w-[280px] max-h-[500px] overflow-y-auto">
      <h4 className="text-sm font-bold mb-2">🔧 Wire Path Debugger</h4>
      
      <button
        onClick={handleToggle}
        className={`w-full px-3 py-2 rounded mb-2 ${
          isVisible ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
        }`}
      >
        {isVisible ? 'Hide Paths' : 'Show Paths'}
      </button>
      
      {isVisible && (
        <>
          {/* Multi-Path Mode Toggle */}
          <div className="mb-3 p-2 bg-gray-700 rounded">
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={showMultiPath}
                onChange={handleMultiPathToggle}
                className="mr-2"
              />
              Multi-Circle Path Mode
            </label>
            <p className="text-xs text-gray-400 mt-1">
              Show all active circle paths simultaneously
            </p>
          </div>

          {/* Debug Mode Toggle */}
          <div className="mb-3 p-2 bg-gray-700 rounded">
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
                className="mr-2"
              />
              Enhanced Debug Mode
            </label>
            <p className="text-xs text-gray-400 mt-1">
              Show path segments, junction points, and timing
            </p>
          </div>

          {/* Active Circles Info */}
          {activeCircles.size > 0 && (
            <div className="mb-3 p-2 bg-blue-900 rounded">
              <h5 className="text-xs font-bold mb-1">🎯 Active Circles: {activeCircles.size}</h5>
              <div className="max-h-20 overflow-y-auto">
                {Array.from(activeCircles.entries()).map(([circleId, circle]) => (
                  <div key={circleId} className="text-xs text-blue-200 mb-1">
                    <span 
                      className="inline-block w-3 h-3 rounded-full mr-2" 
                      style={{backgroundColor: getCirclePathColor(circleId)}}
                    ></span>
                    {circleId}: {circle.dataValue || 'N/A'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Single Connection Selector */}
          {!showMultiPath && (
            <>
              <label className="block text-xs mb-1">Select Connection:</label>
              <select
                value={selectedConnection}
                onChange={(e) => handleConnectionChange(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded text-xs mb-2"
              >
                {availableConnections.map(connection => (
                  <option key={connection} value={connection}>
                    {connection}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* Path Statistics */}
          <div className="text-xs text-gray-300 space-y-1">
            <p>📊 Available Connections: {availableConnections.length}</p>
            {showMultiPath && (
              <>
                <p>🔄 Active Paths: {wirePathCalculator.getActivePaths().size}</p>
                <p>🔗 Shared Segments: {wirePathCalculator.getSharedSegments().size}</p>
              </>
            )}
          </div>

          {/* Legend */}
          <div className="mt-3 p-2 bg-gray-700 rounded text-xs">
            <h5 className="font-bold mb-1">🎨 Legend:</h5>
            {showMultiPath ? (
              <div className="space-y-1">
                <p><span className="text-yellow-400">■</span> Shared Segments</p>
                <p><span className="text-orange-400">●</span> Split Points</p>
                <p><span className="text-purple-400">●</span> Merge Points</p>
                <p><span className="text-blue-400">--</span> Circle Paths</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p><span className="text-red-400">●</span> Start, <span className="text-blue-400">●</span> End</p>
                <p><span className="text-green-400">--</span> Path, <span className="text-yellow-400">~</span> Bezier</p>
              </div>
            )}
          </div>

          {/* Debug Tools */}
          <div className="mt-3 space-y-2">
            <button
              onClick={() => {
                wirePathCalculator.debugAllPaths();
                console.log('Active Paths:', wirePathCalculator.getActivePaths());
                console.log('Shared Segments:', wirePathCalculator.getSharedSegments());
              }}
              className="w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
            >
              🚀 Debug All Paths
            </button>
            
            <button
              onClick={() => {
                wirePathCalculator.clearAllPaths();
                console.log('All paths cleared');
              }}
              className="w-full px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
            >
              🗑️ Clear All Paths
            </button>
          </div>

          <p className="mt-2 text-xs text-gray-400">
            Press F12 and run <code>debugWirePaths()</code> in console for detailed logs.
          </p>
        </>
      )}
    </div>
  );
};

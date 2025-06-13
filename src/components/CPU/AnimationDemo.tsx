// Example usage of AnimationCircle and ComponentHighlighter components
// This file demonstrates how to use the animation components

import React, { useState } from 'react';
import AnimationCircle from './AnimationCircle';
import { Point } from '../../types/animationTypes';
import ComponentHighlighter, { ComponentHighlight } from './ComponentHighlighter';

// Example component coordinates (these would come from your actual CPU datapath)
const exampleComponentCoordinates = {
  PC: { x: 50, y: 200, width: 60, height: 40 },
  InsMem: { x: 150, y: 180, width: 80, height: 80 },
  RegFile: { x: 300, y: 160, width: 100, height: 120 },
  ALUMain: { x: 450, y: 180, width: 80, height: 100 },
  DataMem: { x: 600, y: 180, width: 80, height: 80 }
};

// Example wire path from PC to InsMem
const examplePath: Point[] = [
  { x: 80, y: 220 },  // PC center
  { x: 110, y: 220 }, // Horizontal line
  { x: 150, y: 220 }, // To InsMem
  { x: 190, y: 220 }  // InsMem center
];

// Example component highlights
const exampleHighlights: ComponentHighlight[] = [
  {
    componentId: 'PC',
    highlightType: 'active',
    duration: 2000
  },
  {
    componentId: 'InsMem',
    highlightType: 'processing',
    duration: 1500
  }
];

const AnimationDemo: React.FC = () => {
  const [isAnimating, setIsAnimating] = useState(false);

  const startAnimation = () => {
    setIsAnimating(true);
  };

  const handleAnimationComplete = () => {
    console.log('Animation completed!');
    setIsAnimating(false);
  };

  const handleHighlightComplete = (componentId: string) => {
    console.log(`Highlight completed for component: ${componentId}`);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Animation Components Demo</h2>
      
      <button
        onClick={startAnimation}
        disabled={isAnimating}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {isAnimating ? 'Animating...' : 'Start Animation'}
      </button>

      <svg width="800" height="400" className="border border-gray-300">
        {/* Draw example components */}
        {Object.entries(exampleComponentCoordinates).map(([id, coords]) => (
          <rect
            key={id}
            x={coords.x}
            y={coords.y}
            width={coords.width}
            height={coords.height}
            fill="#E5E7EB"
            stroke="#6B7280"
            strokeWidth={2}
            rx={4}
          />
        ))}
        
        {/* Add component labels */}
        {Object.entries(exampleComponentCoordinates).map(([id, coords]) => (
          <text
            key={`${id}-label`}
            x={coords.x + coords.width / 2}
            y={coords.y + coords.height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-700 text-sm font-medium"
          >
            {id}
          </text>
        ))}

        {/* Draw example wire path */}
        <polyline
          points={examplePath.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#6B7280"
          strokeWidth={2}
        />

        {/* Component Highlighter */}
        <ComponentHighlighter
          highlights={isAnimating ? exampleHighlights : []}
          onHighlightComplete={handleHighlightComplete}
          componentCoordinates={exampleComponentCoordinates}
        />

        {/* Animation Circle */}
        <AnimationCircle
          path={examplePath}
          duration={2000}
          onComplete={handleAnimationComplete}
          size={12}
          isVisible={isAnimating}
          delay={200}
        />
      </svg>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>AnimationCircle Features:</strong></p>
        <ul className="list-disc list-inside ml-4">
          <li>Smooth GSAP animation along calculated wire paths</li>
          <li>Configurable duration, size, and delay</li>
          <li>Automatic fade in/out effects</li>
          <li>Completion callback support</li>
        </ul>
        
        <p className="mt-2"><strong>ComponentHighlighter Features:</strong></p>
        <ul className="list-disc list-inside ml-4">
          <li>Color-coded highlighting (green for active, blue for processing)</li>
          <li>Pulsing effects for active components</li>
          <li>Automatic positioning based on component coordinates</li>
          <li>Individual completion callbacks</li>
        </ul>
      </div>
    </div>
  );
};

export default AnimationDemo;

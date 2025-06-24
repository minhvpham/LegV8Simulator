import React from 'react';

interface WireSegmentProps {
  color?: string;
  strokeWidth?: number;
  isDashed?: boolean;
  hasArrow?: boolean;
  'data-wire-path'?: string;
  'data-wire'?: string;
}

interface VerticalSegmentProps extends WireSegmentProps {
  x: number;
  yStart: number;
  yEnd: number;
  joinStart?: boolean;
  joinEnd?: boolean;
}

interface HorizontalSegmentProps extends WireSegmentProps {
  xStart: number;
  y: number;
  xEnd: number;
  joinStart?: boolean;
  joinEnd?: boolean;
}

/**
 * Draws a vertical wire segment
 */
const VerticalSegment: React.FC<VerticalSegmentProps> = ({
  x,
  yStart,
  yEnd,
  color = 'black',
  joinStart = false,
  joinEnd = false,
  strokeWidth = 2,
  isDashed = false,
  hasArrow = false,
  'data-wire-path': wirePathId,
  'data-wire': wireId
}) => {
  const yTop = Math.min(yStart, yEnd);
  const yBottom = Math.max(yStart, yEnd);
  const arrowDirection = yEnd > yStart ? 'down' : 'up';
  
  return (
    <g data-wire-path={wirePathId} data-wire={wireId}>
      {/* Join circle at start */}
      {joinStart && (
        <circle
          cx={x}
          cy={yStart}
          r={3}
          fill={color}
          data-wire-path={wirePathId}
          data-wire={wireId}
        />
      )}      {/* Join circle at end */}
      {joinEnd && (
        <circle
          cx={x}
          cy={yEnd}
          r={3}
          fill={color}
          data-wire-path={wirePathId}
          data-wire={wireId}
        />
      )}
      {/* Wire line */}
      <line
        x1={x}
        y1={yStart}
        x2={x}
        y2={yEnd}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={isDashed ? "4,4" : "none"}
        markerEnd={hasArrow ? `url(#arrowhead${isDashed ? '-control' : ''})` : "none"}
        data-wire-path={wirePathId}
        data-wire={wireId}
      />
    </g>
  );
};

/**
 * Draws a horizontal wire segment
 */
const HorizontalSegment: React.FC<HorizontalSegmentProps> = ({
  xStart,
  y,
  xEnd,
  color = 'black',
  joinStart = false,
  joinEnd = false,
  strokeWidth = 2,
  isDashed = false,
  hasArrow = false,
  'data-wire-path': wirePathId,
  'data-wire': wireId
}) => {
  return (
    <g data-wire-path={wirePathId} data-wire={wireId}>
      {/* Join circle at start */}
      {joinStart && (
        <circle
          cx={xStart}
          cy={y}
          r={3}
          fill={color}
          data-wire-path={wirePathId}
          data-wire={wireId}
        />
      )}
      {/* Join circle at end */}
      {joinEnd && (
        <circle
          cx={xEnd}
          cy={y}
          r={3}
          fill={color}
          data-wire-path={wirePathId}
          data-wire={wireId}
        />
      )}      {/* Wire line */}
      <line
        x1={xStart}
        y1={y}
        x2={xEnd}
        y2={y}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={isDashed ? "4,4" : "none"}
        markerEnd={hasArrow ? `url(#arrowhead${isDashed ? '-control' : ''})` : "none"}
        data-wire-path={wirePathId}
        data-wire={wireId}
      />
    </g>
  );
};

export { VerticalSegment, HorizontalSegment };

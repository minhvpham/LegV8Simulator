import React from 'react';

interface ArrowHeadProps {
  x: number;
  y: number;
  fill?: string;
}

/**
 * Draws a right-pointing arrow head
 */
const RightArrowHead: React.FC<ArrowHeadProps> = ({
  x,
  y,
  fill = 'black',
}) => {
  const d = [
    `M ${x},${y}`,
    `L ${x - 10},${y - 4}`,
    `L ${x - 10},${y + 4}`,
    `L ${x},${y}`,
    'Z',
  ].join(' ');

  return <path d={d} fill={fill} />;
};

/**
 * Draws an up-pointing arrow head
 */
const UpArrowHead: React.FC<ArrowHeadProps> = ({
  x,
  y,
  fill = 'black',
}) => {
  const d = [
    `M ${x},${y}`,
    `L ${x - 4},${y + 10}`,
    `L ${x + 4},${y + 10}`,
    `L ${x},${y}`,
    'Z',
  ].join(' ');

  return <path d={d} fill={fill} />;
};

/**
 * Draws a left-pointing arrow head
 */
const LeftArrowHead: React.FC<ArrowHeadProps> = ({
  x,
  y,
  fill = 'black',
}) => {
  const d = [
    `M ${x},${y}`,
    `L ${x + 10},${y - 4}`,
    `L ${x + 10},${y + 4}`,
    `L ${x},${y}`,
    'Z',
  ].join(' ');

  return <path d={d} fill={fill} />;
};

export { RightArrowHead, UpArrowHead, LeftArrowHead };

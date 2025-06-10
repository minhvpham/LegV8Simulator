// Color constants used throughout the datapath graphics components
export const COLORS = {
  RED: 'rgb(255, 77, 77)',
  BLACK: 'black',
  WHITE: 'white',
  GREY: 'rgb(242, 242, 242)',
  CONTROL_BLUE: 'rgb(0, 176, 240)',
  ARM_BLUE: 'rgb(18, 140, 171)',
} as const;

// Common props interface for base shapes
export interface BaseShapeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
}

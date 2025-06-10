// Base shape components for the LEGv8 Simulator
export { default as DiagonalSlash } from './DiagonalSlash';
export { ANDGateHorizontal, ANDGateVertical } from './ANDGate';
export { ORGateHorizontal, ORGateVertical } from './ORGate';
export { default as Rectangle } from './Rectangle';
export { Ellipse, ComponentEllipse } from './Ellipse';
export { default as Multiplexor } from './Multiplexor';
export { default as ALU } from './ALUComponent';
export { VerticalSegment, HorizontalSegment } from './WireSegment';
export { UpArrow, RightArrow, LeftArrow } from './Arrows';
export { RightArrowHead, UpArrowHead, LeftArrowHead } from './ArrowHeads';
export { COLORS, type BaseShapeProps } from './constants';

// Re-export existing components
export { default as ControlUnitShape } from './ControlUnitShape';

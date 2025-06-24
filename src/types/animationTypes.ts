// Animation types for CPU instruction execution stages
export interface Point {
  x: number;
  y: number;
}

// New multi-circle animation data structures
export interface DataCircle {
  id: string;
  dataValue: string | number;
  dataType: 'pc_value' | 'instruction' | 'register_data' | 'immediate' | 'address' | 'memory_data' | 'control_signal';
  position: Point;
  parentId?: string;
  childIds?: string[];
  isActive: boolean;
  stage: string;
  color: string;
  size: number;
  opacity: number;
  createdAtStage: number;
}

export interface DataTransformation {
  id: string;
  fromData: any;
  toData: any;
  transformationType: 'split' | 'merge' | 'process' | 'transfer';
  location: string;
  timestamp: number;
  sourceCircleIds: string[];
  resultCircleIds: string[];
}

export interface SplitOperation {
  newValue: any;
  newType: string;
  targetComponent: string;
  wirePath: Point[] | { getPathPoints: (components: any, verticalLines: any) => Point[] };
  location: string;
}

export interface SplitResult {
  id: string;
  dataValue: any;
  dataType: string;
  targetComponent: string;
  wirePath?: Point[] | { getPathPoints: (components: any, verticalLines: any) => Point[] };
}

export interface DataFlowOperation {
  type: 'split' | 'transform' | 'merge' | 'move';
  timing: number;
  sourceCircleIds: string[];
  targetComponent: string;
  resultData?: any;
  targetDataValue?: any;
  targetDataType?: string;
  splitResults?: SplitOperation[];
  results?: SplitResult[];
  wirePath?: Point[] | { getPathPoints: (components: any, verticalLines: any) => Point[] };
  preserveSource?: boolean; // Optional: if true, keeps the source circle when type is 'split'
}

export interface StageDataFlow {
  stageName: string;
  initialCircles?: string[];
  operations: DataFlowOperation[];
  finalCircles?: string[];
  duration: number;
  simultaneousFlows: boolean;
}

// CPU execution stage definitions
export const EXECUTION_STAGES = {
  INSTRUCTION_FETCH: {
    name: "Instruction Fetch",
    description: "Fetch instruction from memory using PC",
    sourceComponent: "PC",
    targetComponent: "InsMem",
    activatedComponents: ["PC", "InsMem"],
    wirePath: [], // Will be calculated dynamically based on wire paths
    duration: 1000
  },
  INSTRUCTION_DECODE: {
    name: "Instruction Decode",
    description: "Decode instruction and read registers",
    sourceComponent: "InsMem",
    targetComponent: "Control",
    activatedComponents: ["InsMem", "Control", "RegFile", "MuxReg2Loc"],
    wirePath: [],
    duration: 1500
  },
  EXECUTE: {
    name: "Execute",
    description: "Perform ALU operation",
    sourceComponent: "RegFile",
    targetComponent: "ALUMain",
    activatedComponents: ["ALUMain", "ALUControl", "MuxReadReg"],
    wirePath: [],
    duration: 1000
  },
  MEMORY_ACCESS: {
    name: "Memory Access",
    description: "Access data memory if needed",
    sourceComponent: "ALUMain",
    targetComponent: "DataMem",
    activatedComponents: ["DataMem"],
    wirePath: [],
    duration: 1000
  },
  WRITE_BACK: {
    name: "Write Back",
    description: "Write result back to register",
    sourceComponent: "DataMem",
    targetComponent: "RegFile",
    activatedComponents: ["RegFile", "MuxReadMem"],
    wirePath: [],
    duration: 1000
  },
  BRANCH_EXECUTE: {
    name: "Branch Execute",
    description: "Calculate branch target and check condition",
    sourceComponent: "RegFile",
    targetComponent: "ALUBranch",
    activatedComponents: ["ALUBranch", "ShiftLeft2", "SignExtend", "Flags", "FlagAND", "ZeroAND", "BranchOR"],
    wirePath: [],
    duration: 1200
  },
  PC_UPDATE: {
    name: "PC Update",
    description: "Update program counter",
    sourceComponent: "ALUBranch",
    targetComponent: "PC",
    activatedComponents: ["PC", "MuxPC", "ALUPC"],
    wirePath: [],
    duration: 800
  }
} as const;

export type ExecutionStageName = keyof typeof EXECUTION_STAGES;

export interface ExecutionStage {  name: string;
  description: string;
  sourceComponent: string;
  targetComponent: string;
  activatedComponents: string[];
  wirePath: Point[] | { getPathPoints: (components: any, verticalLines: any) => Point[] };
  duration: number;
}
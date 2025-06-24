import { WORKFLOW } from './WorkFlow';

export const FLOW_REGISTRY: Record<string, any> = {
  // R-Format instructions using general R-Format flow
  ADD: WORKFLOW,
  SUB: WORKFLOW,
  AND: WORKFLOW,
  ORR: WORKFLOW,
  EOR: WORKFLOW,
  LSL: WORKFLOW,
  LSR: WORKFLOW,
  
  // I-Format instructions using general I-Format flow  
  ADDI: WORKFLOW,
  SUBI: WORKFLOW,
  ANDI: WORKFLOW,
  ORRI: WORKFLOW,
  EORI: WORKFLOW,
  
  // D-Format instructions using specific load/store flows
  LDUR: WORKFLOW,
  STUR: WORKFLOW,
  
  // Other instruction types (using universal flows for now)
  B: WORKFLOW,
  CBZ: WORKFLOW,
  BR: WORKFLOW,
  
  // Legacy flows for remaining instructions
  MOVZ: WORKFLOW,
  CMP: WORKFLOW,
};

export default FLOW_REGISTRY;

import { WORKFLOW } from './WorkFlow';

export const FLOW_REGISTRY: Record<string, any> = {
  // R-Format instructions using general R-Format flow
  ADD: WORKFLOW,
  ADDS: WORKFLOW,
  SUB: WORKFLOW,
  SUBS: WORKFLOW,
  AND: WORKFLOW,
  ANDS: WORKFLOW,
  ORR: WORKFLOW,
  EOR: WORKFLOW,
  LSL: WORKFLOW,
  LSR: WORKFLOW,
  BR: WORKFLOW,
  
  // I-Format instructions using general I-Format flow  
  ADDI: WORKFLOW,
  ADDIS: WORKFLOW,
  SUBI: WORKFLOW,
  SUBIS: WORKFLOW,
  ANDI: WORKFLOW,
  ANDIS: WORKFLOW,
  ORRI: WORKFLOW,
  EORI: WORKFLOW,
  
  // Compare instructions
  CMP: WORKFLOW,
  CMPI: WORKFLOW,
  
  // Special instructions
  NOP: WORKFLOW,
  
  // D-Format instructions using specific load/store flows
  LDUR: WORKFLOW,
  STUR: WORKFLOW,
  LDURB: WORKFLOW,
  STURB: WORKFLOW,
  LDURH: WORKFLOW,
  STURH: WORKFLOW,
  LDURSW: WORKFLOW,
  STURW: WORKFLOW,
  
  // IM-Format instructions
  MOVZ: WORKFLOW,
  MOVK: WORKFLOW,
  
  // B-Format instructions
  B: WORKFLOW,
  BL: WORKFLOW,
  
  // CB-Format instructions
  CBZ: WORKFLOW,
  CBNZ: WORKFLOW,
  'B.EQ': WORKFLOW,
  'B.NE': WORKFLOW,
  'B.MI': WORKFLOW,
  'B.PL': WORKFLOW,
  'B.VS': WORKFLOW,
  'B.VC': WORKFLOW,
  'B.HI': WORKFLOW,
  'B.LS': WORKFLOW,
  'B.GE': WORKFLOW,
  'B.LT': WORKFLOW,
  'B.GT': WORKFLOW,
  'B.LE': WORKFLOW,
  'B.HS': WORKFLOW,
  'B.LO': WORKFLOW,
};

export default FLOW_REGISTRY;

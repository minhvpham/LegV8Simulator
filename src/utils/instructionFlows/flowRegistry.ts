import { LDUR_FLOW } from './ldurFlow';
import { ADD_FLOW } from './addFlow';
import { ADDI_FLOW } from './addiFlow';
import { SUB_FLOW } from './subFlow';
import { STUR_FLOW } from './sturFlow';
import { AND_FLOW } from './andFlow';
import { ORR_FLOW } from './orrFlow';
import { EOR_FLOW } from './eorFlow';
import { CBZ_FLOW } from './cbzFlow';
import { LSL_FLOW } from './lslFlow';
import { LSR_FLOW } from './lsrFlow';
import { MOVZ_FLOW } from './movzFlow';
import { B_FLOW } from './bFlow';
import { CMP_FLOW } from './cmpFlow';

export const FLOW_REGISTRY: Record<string, any> = {
  LDUR: LDUR_FLOW,
  ADD: ADD_FLOW,
  ADDI: ADDI_FLOW,
  SUB: SUB_FLOW,
  STUR: STUR_FLOW,
  AND: AND_FLOW,
  ORR: ORR_FLOW,
  EOR: EOR_FLOW,
  CBZ: CBZ_FLOW,
  LSL: LSL_FLOW,
  LSR: LSR_FLOW,
  MOVZ: MOVZ_FLOW,
  B: B_FLOW,
  CMP: CMP_FLOW,
  // Add more mappings for other instructions as needed
};

export default FLOW_REGISTRY;

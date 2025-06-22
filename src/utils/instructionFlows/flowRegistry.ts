import { MOVZ_FLOW } from './movzFlow';
import { CMP_FLOW } from './cmpFlow';
// Universal flows for all instruction types
import { B_UNIVERSAL_FLOW } from './bUniversalFlow';
import { CBZ_UNIVERSAL_FLOW } from './cbzUniversalFlow';
import { BR_UNIVERSAL_FLOW } from './brUniversalFlow';

// New detailed flows following exact workflow specification
// R-Format flows
import { ADD_R_FORMAT_FLOW } from './addRFormatFlow_new';
import { SUB_R_FORMAT_FLOW } from './subRFormatFlow';
import { AND_R_FORMAT_FLOW } from './andRFormatFlow_new';
import { ORR_R_FORMAT_FLOW } from './orrRFormatFlow_new';
import { EOR_R_FORMAT_FLOW } from './eorRFormatFlow_new';
import { LSL_R_FORMAT_FLOW } from './lslRFormatFlow_new';
import { LSR_R_FORMAT_FLOW } from './lsrRFormatFlow_new';

// I-Format flows
import { ADDI_I_FORMAT_FLOW } from './addiIFormatFlow_new';
import { SUBI_I_FORMAT_FLOW } from './subiIFormatFlow';
import { ANDI_I_FORMAT_FLOW } from './andiIFormatFlow_new';
import { ORRI_I_FORMAT_FLOW } from './orriIFormatFlow_new';
import { EORI_I_FORMAT_FLOW } from './eoriIFormatFlow_new';

// D-Format flows
import { LDUR_D_FORMAT_FLOW } from './ldurDFormatFlow_new';
import { STUR_D_FORMAT_FLOW } from './sturDFormatFlow_new';

export const FLOW_REGISTRY: Record<string, any> = {
  // R-Format instructions using detailed workflow-accurate flows
  ADD: ADD_R_FORMAT_FLOW,
  SUB: SUB_R_FORMAT_FLOW,
  AND: AND_R_FORMAT_FLOW,
  ORR: ORR_R_FORMAT_FLOW,
  EOR: EOR_R_FORMAT_FLOW,
  LSL: LSL_R_FORMAT_FLOW,
  LSR: LSR_R_FORMAT_FLOW,
  
  // I-Format instructions using detailed workflow-accurate flows  
  ADDI: ADDI_I_FORMAT_FLOW,
  SUBI: SUBI_I_FORMAT_FLOW,
  ANDI: ANDI_I_FORMAT_FLOW,
  ORRI: ORRI_I_FORMAT_FLOW,
  EORI: EORI_I_FORMAT_FLOW,
  
  // D-Format instructions using detailed workflow-accurate flows
  LDUR: LDUR_D_FORMAT_FLOW,
  STUR: STUR_D_FORMAT_FLOW,
  
  // Other instruction types (using universal flows for now)
  B: B_UNIVERSAL_FLOW,
  CBZ: CBZ_UNIVERSAL_FLOW,
  BR: BR_UNIVERSAL_FLOW,
  
  // Legacy flows for remaining instructions
  MOVZ: MOVZ_FLOW,
  CMP: CMP_FLOW
};

export default FLOW_REGISTRY;

import { MOVZ_FLOW } from './movzFlow';
import { CMP_FLOW } from './cmpFlow';
// Universal flows for all instruction types
import { B_UNIVERSAL_FLOW } from './bUniversalFlow';
import { CBZ_UNIVERSAL_FLOW } from './cbzUniversalFlow';
import { BR_UNIVERSAL_FLOW } from './brUniversalFlow';

// New guideline flows following exact workflow specification
// R-Format flows
import { ADD_R_FORMAT_FLOW } from './addRFormatFlow_guideline';
import { SUB_R_FORMAT_FLOW } from './subRFormatFlow_guideline';
import { AND_R_FORMAT_FLOW } from './andRFormatFlow_guideline';
import { ORR_R_FORMAT_FLOW } from './orrRFormatFlow_guideline';
import { EOR_R_FORMAT_FLOW } from './eorRFormatFlow_guideline';
import { LSL_R_FORMAT_FLOW } from './lslRFormatFlow_guideline';
import { LSR_R_FORMAT_FLOW } from './lsrRFormatFlow_guideline';

// I-Format flows
import { ADDI_I_FORMAT_FLOW } from './addiIFormatFlow_guideline';
import { SUBI_I_FORMAT_FLOW } from './subiIFormatFlow_guideline';
import { ANDI_I_FORMAT_FLOW } from './andiIFormatFlow_guideline';
import { ORRI_I_FORMAT_FLOW } from './orriIFormatFlow_guideline';
import { EORI_I_FORMAT_FLOW } from './eoriIFormatFlow_guideline';

// D-Format flows
import { LDUR_D_FORMAT_FLOW } from './ldurDFormatFlow_guideline';
import { STUR_D_FORMAT_FLOW } from './sturDFormatFlow_guideline';

export const FLOW_REGISTRY: Record<string, any> = {
  // R-Format instructions using guideline workflow-accurate flows
  ADD: ADD_R_FORMAT_FLOW,
  SUB: SUB_R_FORMAT_FLOW,
  AND: AND_R_FORMAT_FLOW,
  ORR: ORR_R_FORMAT_FLOW,
  EOR: EOR_R_FORMAT_FLOW,
  LSL: LSL_R_FORMAT_FLOW,
  LSR: LSR_R_FORMAT_FLOW,
  
  // I-Format instructions using guideline workflow-accurate flows  
  ADDI: ADDI_I_FORMAT_FLOW,
  SUBI: SUBI_I_FORMAT_FLOW,
  ANDI: ANDI_I_FORMAT_FLOW,
  ORRI: ORRI_I_FORMAT_FLOW,
  EORI: EORI_I_FORMAT_FLOW,
  
  // D-Format instructions using guideline workflow-accurate flows
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

// Mappings of actual machine opcodes to
// labels (For convenience and readability)
export enum Opcode {
  LOAD = 1,
  LOAD_NEG = 2,
  LOAD_ABS = 3,
  LOAD_ABS_NEG = 4,

  ADD = 5,
  SUB = 6,
  ADD_ABS = 7,
  SUB_ABS = 8,

  LOAD_TO_MQ = 9,
  LOAD_FROM_MQ = 10,

  MUL = 11,
  DIV = 12,

  JUMP_LEFT = 13,
  JUMP_RIGHT = 14,
  COND_JUMP_LEFT = 15,
  COND_JUMP_RIGHT = 16,
  LEFT_ADDR_MODIFY = 18,
  RIGHT_ADDR_MODIFY = 19,

  LSH = 20,
  RSH = 21,

  STOR = 33,
  // Extra opcodes for convenience
  HLT = 50
}

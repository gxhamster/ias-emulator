// Main file
export let MEMORY_LIMIT = 1024;

// One word is equal to 20 bits. One full instruction is two words in memory
export interface Word {
  op: number;
  addr: number;
}

// Structure to keep both value in the full word
// and the individual values in the each location
export interface Accumulator {
  value: number;
  data: Instruction;
}

export class Instruction {
  public lop: number; // 8 bits
  public laddr: number; // 12 bits
  public rop: number; // 8 bits
  public raddr: number; // 12 bits

  constructor(
    rop: number = 0,
    raddr: number = 0,
    lop: number = 0,
    laddr: number = 0
  ) {
    if (rop > 255 || lop > 255) throw new Error("Exceeded opcode length!");
    if (raddr > 4095 || laddr > 4095)
      throw new Error("Exceeded address length!");
    this.rop = rop;
    this.raddr = raddr;
    this.lop = lop;
    this.laddr = laddr;
  }
}

export class Machine {
  private accumulator: Accumulator; // FullWord but to do arithmetic
  private multiplyQuotientRegister: number;
  private memoryAddressRegister: number;
  private memoryBufferRegister: Instruction;
  private programCounter: number;
  private instructionRegister: number;
  private instructionBufferRegister: Word;
  // How many clock cycles has passed. Used to increment the PC
  private clock: number;
  // Program starting address. For now we can just set to 0x0
  private baseAddress: number;

  memory: Array<Instruction>;


  constructor() {
    // this.accumulator = new FullWord();
    this.accumulator = { value: 0x0, data: new Instruction() }
    this.multiplyQuotientRegister = 0x0;
    this.memoryAddressRegister = 0x0;
    this.memoryBufferRegister = new Instruction(0,0,0,0);
    this.instructionRegister = 0x0;
    this.instructionBufferRegister = { op: 0, addr: 0 };
    this.memory = new Array(MEMORY_LIMIT);
    this.baseAddress = 0x0;
    this.programCounter = this.baseAddress; // Memory goes to 1023 therefore 10 bits PC
    this.clock = 0;
  }

  showAccumulator() {
    console.log("[Accumulator]:" + this.accumulator);
  }

  showMultiplyQuotientRegister() {
    console.log("[MQ]:" + this.multiplyQuotientRegister);
  }

  // Start reading instructions
  loadInstructionsToMemory(instructions: Array<Instruction>) {
    // Copy all the instructions to memory. Start from the base address
    for (let i = this.baseAddress; i < instructions.length; i++) {
      this.memory[i] = instructions[i];
    }
    // Start fetch/excecute cycle
    for (; this.clock < instructions.length; this.clock++)
      this.fetch();

    console.log("AC:", this.accumulator.value, "PC:",this.programCounter)
  }


  fetch() {
    if (this.instructionBufferRegister.op > 0) {
      // No need to access memory
      this.instructionRegister = this.instructionBufferRegister.op;
      this.memoryAddressRegister = this.instructionBufferRegister.addr;
      this.programCounter++;
    } else {
      // Need to retreive instruction
      this.memoryAddressRegister = this.programCounter;
      // Access memory location at MAR
      this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
      if (this.memoryBufferRegister == undefined)
        throw new Error("Memory access returned undefined")
      const { lop, laddr, raddr, rop } = this.memoryBufferRegister;
      if (lop == 0 && laddr == 0) {
        // Only right word is being used
        this.instructionRegister = rop;
        this.memoryAddressRegister = raddr;
        this.programCounter++;
      } else {
        // If two words are utilized in the instruction we need to put the second instruction too
        this.instructionBufferRegister = { op: rop, addr: raddr };
        this.instructionRegister = lop;
        this.memoryAddressRegister = laddr;
      }
    }

    this.execute();
  }

  execute() {
    // Based on the instruction code in IR execute different instructions
    switch (this.instructionRegister) {
      case 1:
        this.loadPostiveOffset();
        break;
      case 2:
        this.loadNegativeOffset();
        break;
      case 3:
        this.loadAbsolute();
        break;
      case 5:
        this.add();
        break;
      case 6:
        this.sub();
        break;
      case 9:
        this.loadToMQFromMemory();
        break;
      case 10:
        this.loadFromMQ()
        break;
      case 11:
        this.mul();
        break;
      case 12:
        this.div();
        break;
      case 13:
        this.jumpToLeftAddr();
        break;
      case 14:
        this.jumpToRightAddr();
        break;
      case 15:
        this.conditionalJumpLeftAddr();
        break;
      case 16:
        this.conditionalJumpRightAddr();
        break;
      case 18:
        this.leftAddressModify();
        break;
      case 19:
        this.rightAddressModify();
        break;
      case 20:
        this.leftShift();
        break;
      case 21:
        this.rightShift();
        break;
      case 33:
        this.store();
        break;
      default:
        throw new Error("Unidentified instruction code. Exiting!")
    }
  }

  loadPostiveOffset() {
    // LOAD M(X)
    const addrOffset = this.baseAddress + this.memoryAddressRegister;
    this.memoryBufferRegister = this.memory[addrOffset];
    this.accumulator.value = fullWordToBinary(this.memoryBufferRegister);
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  loadNegativeOffset() {
    // LOAD -M(X): This instruction means that instead of going forward from the base address.
    // which is the address the PC is intialized to we go backward. Eg: arr[-3]
    const addrOffset = this.baseAddress - this.memoryAddressRegister;
    this.memoryBufferRegister = this.memory[addrOffset];
    this.accumulator.value = fullWordToBinary(this.memoryBufferRegister);
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  // TODO: Need to check whether 2s complement
  loadAbsolute() {
    // LOAD |M(X)|
    this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
    const value = fullWordToBinary(this.memoryBufferRegister);
    this.accumulator.data = binaryToWord(this.accumulator.value);

  }

  loadToMQFromMemory() {
    this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
    this.multiplyQuotientRegister = fullWordToBinary(this.memoryBufferRegister);
  }

  // LOAD MQ: Transfer contents of register MQ to the accumulator AC
  loadFromMQ() {
    this.accumulator.value = this.multiplyQuotientRegister;
    this.accumulator.data = binaryToWord(this.multiplyQuotientRegister);
  }

  add() {
    // ADD M(X)
    this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
    this.accumulator.value += fullWordToBinary(this.memoryBufferRegister);
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  sub() {
    // SUB M(X)
    this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
    this.accumulator.value -= fullWordToBinary(this.memoryBufferRegister);
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  mul() {
    // MUL M(X): put most significant bits of
    // result in AC, put least significant bits in MQ

    this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
    this.multiplyQuotientRegister *= fullWordToBinary(this.memoryBufferRegister);
    this.accumulator.value = (0xFFFFF00000 & this.multiplyQuotientRegister) >> 20;
    this.multiplyQuotientRegister = 0x00000FFFFF & this.multiplyQuotientRegister;
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  div() {
    // Divide AC by M(X); put the quotient in MQ and the remainder in AC
    this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
    const divisor = fullWordToBinary(this.memoryBufferRegister);
    if (this.accumulator.value == 0) {
      throw new Error("Division by error!");
    }

    this.multiplyQuotientRegister /= Math.floor(this.accumulator.value / divisor);
    this.accumulator.value = this.accumulator.value % divisor;
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  leftShift() {
    // LSH shift left the value in AC by 1
    this.accumulator.value = this.accumulator.value << 1;
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  rightShift() {
    // RSH shift right the value in AC by 1
    this.accumulator.value = this.accumulator.value >> 1;
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  store() {
    // STOR M(X)
    const storingAddr = this.memoryAddressRegister;
    this.memoryBufferRegister = this.accumulator.data;
    this.memory[storingAddr] = this.memoryBufferRegister;
  }

  leftAddressModify() {
    // STOR M(X,8:19) Replace left address field at M(X) by 12 rightmost bits of AC
    const storingAddr = this.memoryAddressRegister;
    this.memory[storingAddr].laddr = this.accumulator.data.raddr; 

  }

  rightAddressModify() {
    // STOR M(X,28:39) Replace right address field at M(X) by 12 rightmost bits of AC
    const storingAddr = this.memoryAddressRegister;
    this.memory[storingAddr].raddr = this.accumulator.data.raddr; 
  }

  jumpToLeftAddr() {
    // JUMP M(X,0:19) Take next instruction from left half of M(X)
    // This means that the jump instruction address is taken from the left half of the word
    this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
    const jumpAddress = this.memoryBufferRegister.laddr;
    this.memoryAddressRegister = jumpAddress;
    this.programCounter = this.memoryAddressRegister;
  }

  jumpToRightAddr() {
    // JUMP M(X,20:39) Take next instruction from right half of M(X)
    this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
    const jumpAddress = this.memoryBufferRegister.raddr;
    this.memoryAddressRegister = jumpAddress;
    this.programCounter = this.memoryAddressRegister;
  }

  conditionalJumpLeftAddr() {
    // JUMP+ M(X,0:19) If number in the accumulator is nonnegative,
    // take next instruction from left half of M(X)
    if (this.accumulator.value > -1) {
      this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
      const jumpAddress = this.memoryBufferRegister.laddr;
      this.memoryAddressRegister = jumpAddress;
      this.programCounter = this.memoryAddressRegister;
    }
  }

  conditionalJumpRightAddr() {
    // JUMP+ M(X,0:19) If number in the accumulator is nonnegative,
    // take next instruction from right half of M(X)
    if (this.accumulator.value > -1) {
      this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
      const jumpAddress = this.memoryBufferRegister.raddr;
      this.memoryAddressRegister = jumpAddress;
      this.programCounter = this.memoryAddressRegister;
    }
  }
}


// Combine memory segments to one binary value
function fullWordToBinary(fullWord: Instruction) {
  const n1 = fullWord.lop << 32;
  const n2 = fullWord.laddr << 20;
  const n3 = fullWord.rop << 12
  const result = n1 | n2 | n3 | fullWord.raddr;

  return result;
}

// Extract individual segments from binary value
function binaryToWord(binary: number) {
  // 0x1005
  const lop = (binary & 0xFF00000000) >> 32;
  const laddr = (binary & 0x00FFF00000) >> 20;
  const rop = (binary & 0x00000FF000) >> 12;
  const raddr = binary & 0x0000000FFF;
  return new Instruction(rop, raddr, lop, laddr);
}


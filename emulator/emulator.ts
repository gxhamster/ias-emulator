// Main file
/**
 * Total amount of memory that can be used by the emulator.
 * @constant
 */
export const MEMORY_LIMIT = 1024;

/**
 * One word is equal to 20 bits. One full instruction is two words in memory
 */
export interface Word {
  op: number;
  addr: number;
}

/**
 * Structure to keep both value in the full word
 * and the individual values in the each location.
 * @param {number} value Numeric value in accumulator
 * @param {Instruction} data Full representation
 */
export interface Accumulator {
  value: number;
  data: Instruction;
}

/**
 * @param lop 8 bits
 * @param laddr 12 bits
 * @param rop 8 bits
 * @param raddr 12 bits
 */
export class Instruction {
  public lop: number;
  public laddr: number;
  public rop: number;
  public raddr: number;

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

/**
 * @classdesc Contains all the state and registers and memory blocks regarding the
 * emulator. Instructions are loaded to be executed.
 * @class
 */
export class Machine {
  private accumulator: Accumulator; // FullWord but to do arithmetic
  private multiplyQuotientRegister: number;
  private memoryAddressRegister: number;
  private memoryBufferRegister: Instruction;
  public programCounter: number;
  private instructionRegister: number;
  private instructionBufferRegister: Word;
  // How many clock cycles has passed. Used to increment the PC
  // Program starting address. For now we can just set to 0x0
  private _baseAddress: number;

  memory: Array<Instruction>;

  constructor() {
    this.accumulator = { value: 0x0, data: new Instruction() };
    this.multiplyQuotientRegister = 0x0;
    this.memoryAddressRegister = 0x0;
    this.memoryBufferRegister = new Instruction(0, 0, 0, 0);
    this.instructionRegister = 0x0;
    this.instructionBufferRegister = { op: 0, addr: 0 };
    this.memory = new Array(MEMORY_LIMIT);
    this._baseAddress = 0x0;
    this.programCounter = this._baseAddress; // Memory goes to 1023 therefore 10 bits PC

    for (let i = 0; i < this.memory.length; i++) {
      this.memory[i] = new Instruction(0, 0, 0, 0);
    }
  }

  set baseAddress(newAddress: number) {
    if (newAddress > MEMORY_LIMIT) {
      console.log(
        `Program address will exceed MEMORY_LIMIT. Address: ${newAddress}`
      );
      return;
    }
    this._baseAddress = newAddress;
    this.programCounter = this._baseAddress;
  }

  get baseAddress() {
    return this._baseAddress;
  }

  public resetRegisters() {
    this.accumulator = { value: 0x0, data: new Instruction() };
    this.multiplyQuotientRegister = 0x0;
    this.memoryAddressRegister = 0x0;
    this.memoryBufferRegister = new Instruction(0, 0, 0, 0);
    this.instructionRegister = 0x0;
    this.instructionBufferRegister = { op: 0, addr: 0 };
    this._baseAddress = 0x0;
    this.programCounter = this._baseAddress;
  }

  public resetEmulator() {
    for (let i = 0; i < this.memory.length; i++) {
      this.memory[i] = new Instruction(0, 0, 0, 0);
    }

    this.resetRegisters();
  }

  public getRegisterValues() {
    return {
      accumulator: this.accumulator.value,
      multiplyQuotientRegister: this.multiplyQuotientRegister,
      memoryAddressRegister: this.memoryAddressRegister,
      memoryBufferRegister: this.memoryBufferRegister,
      instructionRegister: this.instructionRegister,
      instructionBufferRegister: this.instructionBufferRegister,
      programCounter: this.programCounter,
    };
  }

  public getMemoryByRange(lower: number = 0, higher: number) {
    if (lower > higher) return;
    if (higher > MEMORY_LIMIT + 1) return;

    return this.memory.slice(lower, higher + 1).map((ins, idx) => {
      return {
        location: lower + idx,
        ...ins,
      };
    });
  }

  /**
   * Start reading instructions. Use this to load complete programs.
   * Can specify memory offset to load the program by setting the base
   * address.
   * @param {Array<Instruction>} instructions Instructions to load
   */
  public loadInstructionsToMemory(instructions: Array<Instruction>) {
    // Copy all the instructions to memory. Start from the base address
    for (let i = this._baseAddress, j = 0; j < instructions.length; i++, j++) {
      this.memory[i] = instructions[j];
    }
    // TODO: We cannot fetch upto number of instructions. We need to
    // repeat fetch/execute cycle until to end of memory or a HALT instruction.
    // Start fetch/excecute cycle
    // for (let i = 0; i < instructions.length; i++) {
    //   this.fetch();
    // }
    while (this.programCounter < MEMORY_LIMIT) {
      this.fetch();
    }
  }

  /**
   * Used for reading instructions from the REPL instruction
   * by instruction. The instruction is loaded into the current
   * program counter address
   * @param {Instruction} instruction Instruction to load
   */
  public loadInstructionREPL(instruction: Instruction) {
    this.memory[this.programCounter] = instruction;

    this.fetch();
  }

  /**
   * Fetch cycle of the IAS machine. Fetches instruction at PC
   * Buffers instructions that are too long to execute.
   */
  private fetch() {
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
        throw new Error("Memory access returned undefined");
      const { lop, laddr, raddr, rop } = this.memoryBufferRegister;
      if (lop == 0 && laddr == 0) {
        // Only right word is being used
        this.instructionRegister = rop;
        this.memoryAddressRegister = raddr;
        this.programCounter++;
      } else if (rop == 0 && raddr == 0) {
        // Only left word is being used
        this.instructionRegister = lop;
        this.memoryAddressRegister = laddr;
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

  /**
   * Execute instructions according to the opcode that is in the
   * IR (instruction register).
   */
  private execute() {
    // Based on the instruction code in IR execute different instructions
    switch (this.instructionRegister) {
      // case 0:
      //   // This normally means that nothing really happens.
      //   break;
      case 1:
        this.loadPostiveOffset();
        break;
      case 2:
        this.loadNegativeOffset();
        break;
      case 3:
        this.loadAbsolute();
        break;
      case 4:
        this.loadAbsoluteNegOffset();
        break;
      case 5:
        this.add();
        break;
      case 6:
        this.sub();
        break;
      case 7:
        this.addAbs();
        break;
      case 8:
        this.subAbs();
        break;
      case 9:
        this.loadToMQFromMemory();
        break;
      case 10:
        this.loadFromMQ();
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
        throw new Error(
          `Unidentified instruction code. Instruction: ${this.instructionRegister} ${this.memoryAddressRegister}`
        );
    }
  }

  /**
   * LOAD M(X): Transfer M(X) to the accumulator
   */
  loadPostiveOffset() {
    //
    const addrOffset = this._baseAddress + this.memoryAddressRegister;
    this.memoryBufferRegister = this.memory[addrOffset];
    this.accumulator.value = fullWordToBinary(this.memoryBufferRegister);
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  /**
   * LOAD -M(X): This instruction means that instead of going forward from the base address.
   * which is the address the PC is intialized to we go backward. Eg: arr[-3]
   */
  loadNegativeOffset() {
    const addrOffset = this._baseAddress - this.memoryAddressRegister;
    this.memoryBufferRegister = this.memory[addrOffset];
    this.accumulator.value = fullWordToBinary(this.memoryBufferRegister);
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  /**
   * LOAD |M(X)|: Transfer absolute value of M(X) to the accumulator
   */
  loadAbsolute() {
    this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
    this.accumulator.value = Math.abs(
      fullWordToBinary(this.memoryBufferRegister)
    );
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  /**
   * LOAD –|M(X)|: Transfer –|M(X)| to the accumulator
   */
  loadAbsoluteNegOffset() {
    const addrOffset = this._baseAddress - this.memoryAddressRegister;
    this.memoryBufferRegister = this.memory[addrOffset];
    this.accumulator.value = Math.abs(
      fullWordToBinary(this.memoryBufferRegister)
    );
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  /**
   * LOAD MQ,M(X): Transfer contents of memory location X to MQ
   */
  loadToMQFromMemory() {
    this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
    this.multiplyQuotientRegister = fullWordToBinary(this.memoryBufferRegister);
  }

  /**
   * LOAD MQ: Transfer contents of register MQ to the accumulator AC
   */
  loadFromMQ() {
    this.accumulator.value = this.multiplyQuotientRegister;
    this.accumulator.data = binaryToWord(this.multiplyQuotientRegister);
  }

  /**
   * ADD M(X): Add M(X) to AC and put the result in AC
   */
  add() {
    this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
    this.accumulator.value += fullWordToBinary(this.memoryBufferRegister);
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  /**
   * SUB M(X): Subtract M(X) from AC and put the result in AC
   */
  sub() {
    this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
    this.accumulator.value -= fullWordToBinary(this.memoryBufferRegister);
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  /**
   * ADD |M(X)|: Add the absolute value from M(X) to AC and put the result in AC
   */
  addAbs() {
    this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
    this.accumulator.value += Math.abs(
      fullWordToBinary(this.memoryBufferRegister)
    );
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  /**
   * SUB |M(X)|: Subtract the absolute value from AC and put the remainder in AC
   */
  subAbs() {
    //
    this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
    this.accumulator.value -= Math.abs(
      fullWordToBinary(this.memoryBufferRegister)
    );
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  /**
   * MUL M(X): Put most significant bits of multiplication result in AC,
   * put least significant bits in MQ
   */
  mul() {
    this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
    this.multiplyQuotientRegister *= fullWordToBinary(
      this.memoryBufferRegister
    );
    this.accumulator.value =
      (0xfffff00000 & this.multiplyQuotientRegister) >> 20;
    this.multiplyQuotientRegister =
      0x00000fffff & this.multiplyQuotientRegister;
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  /**
   * Divide AC by M(X). Put the quotient in MQ and the remainder in AC
   */
  div() {
    this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
    const divisor = fullWordToBinary(this.memoryBufferRegister);
    if (this.accumulator.value == 0) {
      throw new Error("Division by 0 error!");
    }

    this.multiplyQuotientRegister /= Math.floor(
      this.accumulator.value / divisor
    );
    this.accumulator.value = this.accumulator.value % divisor;
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  /**
   * LSH shift left the value in AC by 1
   */
  leftShift() {
    this.accumulator.value = this.accumulator.value << 1;
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  /**
   * RSH shift right the value in AC by 1
   */
  rightShift() {
    this.accumulator.value = this.accumulator.value >> 1;
    this.accumulator.data = binaryToWord(this.accumulator.value);
  }

  /**
   * STOR M(X): Transfer the contents of the accumulator in to the memory location
   * in `x`
   */
  store() {
    // TODO: Check width and size of the value to store. If cannot fit.
    const storingAddr = this.memoryAddressRegister;
    this.memoryBufferRegister = this.accumulator.data;
    this.memory[storingAddr] = this.memoryBufferRegister;
  }

  /**
   * `STOR M(X,8:19)`: Replace left address field at `M(X)` by 12 rightmost bits of AC
   */
  leftAddressModify() {
    const storingAddr = this.memoryAddressRegister;
    this.memoryBufferRegister = this.accumulator.data;
    this.memory[storingAddr].laddr = this.memoryBufferRegister.raddr;
  }

  /**
   * `STOR M(X,28:39)` Replace right address field at `M(X)` by 12 rightmost bits of AC
   */
  rightAddressModify() {
    const storingAddr = this.memoryAddressRegister;
    this.memoryBufferRegister = this.accumulator.data;
    this.memory[storingAddr].raddr = this.memoryBufferRegister.raddr;
  }

  /**
   * `JUMP M(X,0:19)` Take next instruction from left half of M(X).
   * This means that the jump instruction address is taken from the left half of the word
   */
  jumpToLeftAddr() {
    this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
    const jumpAddress = this.memoryBufferRegister.laddr;
    this.memoryAddressRegister = jumpAddress;
    this.programCounter = this.memoryAddressRegister;
  }

  /**
   * `JUMP M(X,20:39)` Take next instruction from right half of `M(X)`
   */
  jumpToRightAddr() {
    this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
    const jumpAddress = this.memoryBufferRegister.raddr;
    this.memoryAddressRegister = jumpAddress;
    this.programCounter = this.memoryAddressRegister;
  }

  /**
   * `JUMP+ M(X,0:19)` If number in the accumulator is nonnegative,
   * take next instruction from left half of `M(X)`
   */
  conditionalJumpLeftAddr() {
    if (this.accumulator.value > -1) {
      this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
      const jumpAddress = this.memoryBufferRegister.laddr;
      this.memoryAddressRegister = jumpAddress;
      this.programCounter = this.memoryAddressRegister;
    }
  }

  /**
   * `JUMP+ M(X,20:39)` If number in the accumulator is nonnegative,
   * take next instruction from right half of `M(X)`
   */
  conditionalJumpRightAddr() {
    if (this.accumulator.value > -1) {
      this.memoryBufferRegister = this.memory[this.memoryAddressRegister];
      const jumpAddress = this.memoryBufferRegister.raddr;
      this.memoryAddressRegister = jumpAddress;
      this.programCounter = this.memoryAddressRegister;
    }
  }
}

/**
 * Combine memory segments to one binary value. Used mostly
 * when for arithmetic with `AC` and `MQ` registers.
 * @example
 * new Instruction (1, 5, 0, 0)
 * // becomes 4101 in base10 or `0x1005`
 * @param fullWord {Instruction} An full width memory block
 * @returns {number}
 */
function fullWordToBinary(fullWord: Instruction) {
  const n1 = fullWord.lop << 32;
  const n2 = fullWord.laddr << 20;
  const n3 = fullWord.rop << 12;
  const result = n1 | n2 | n3 | fullWord.raddr;

  return result;
}

/**
 * Extract individual segments from binary value. Does the opposite
 * @param binary {number} A numeric value
 * @example
 * binaryToWord(0x1005)
 * // returns Instruction(1, 5, 0, 0)
 * @returns {Instruction} A full-width instruction object
 */
function binaryToWord(binary: number) {
  const lop = (binary & 0xff00000000) >> 32;
  const laddr = (binary & 0x00fff00000) >> 20;
  const rop = (binary & 0x00000ff000) >> 12;
  const raddr = binary & 0x0000000fff;
  return new Instruction(rop, raddr, lop, laddr);
}

debugger
// A way to load programs into the emulator and interact
// and view the contents in the emulator

import { Instruction, Machine } from "../emulator/emulator";
import { Scanner } from "../parser/lexer";
import { Parser } from "../parser/parser";

/*
    1. Read commands from the user
    2. Have helper commands to display details about instructions
    3. Command to load programs into machine
    7. Interactive program running. Step-by-step
*/

const DISPLAY_MEMORY_DEFAULT_MIN = 0;
const DISPLAY_MEMORY_DEFAULT_MAX = 15;

const DISPLAY_ADDRESS_HEX = false;

const machine = new Machine();
// const example_instruction = `LOAD M(5)
// SUB M(3)
// `
const example_instruction = `LOAD M(0xE3)
SUB M(229)
STOR M(231)

LOAD M(230)
ADD M(229)
STOR M(230)

LOAD M(231)
JUMP+ M(228, 20:39)
HLT
`;
// Instructions are always read from right first.
const scanner = new Scanner(example_instruction);
scanner.scanTokens();
const tokens = scanner.tokens;
const parser = new Parser(tokens);
parser.parse();
const instructions = parser.instructions;

machine.memory[227] = new Instruction(255, 4095, 0, 1000);
machine.memory[228] = new Instruction(6, 0x1);
machine.memory[229] = new Instruction(0, 1);

machine.loadInstructionsToMemory(instructions);


const prompt = ">>> ";
process.stdout.write(prompt);
for await (const line of console) {
  // console.log(`You typed: ${line}`);
  if (line == "print reg") {
    printRegisters();
  } else if (line.includes("print mem")) {
    let lineArr = line.split(" ");
    let lowerBound = DISPLAY_MEMORY_DEFAULT_MIN;
    let higherBound = DISPLAY_MEMORY_DEFAULT_MAX;
    if (lineArr.length > 2) {
      const memoryRangeStr = lineArr[2];
      const tempArr = memoryRangeStr.split(":");
      if (tempArr.length == 2) {
        lowerBound = parseInt(tempArr[0]);
        higherBound = parseInt(tempArr[1]);
      } else if (tempArr.length == 1) {
        higherBound = parseInt(tempArr[0]);
      }
    }
    lowerBound = !lowerBound ? DISPLAY_MEMORY_DEFAULT_MIN : lowerBound;
    higherBound = !higherBound ? DISPLAY_MEMORY_DEFAULT_MAX : higherBound;
    // Call to emulator to get contents of memory
    console.table(machine.getMemoryByRange(lowerBound, higherBound));
  } else if (line.startsWith("reset")) {
    // Clear memory and registers (RESET)
    if (line.includes("reg")) {
      machine.resetRegisters();
      console.log("Cleared register values");
    } else {
      machine.resetEmulator();
      console.log("Cleared register and memory");
    }
  } else if (line.startsWith("set mem")) {
    // Set memory segments to a value (set memory [index] [rop] [raddr] [lop] [laddr])
    const cmdArr = line.split(" ");
    if (cmdArr.length !== 7) {
      console.log("Not enough arguments");
      console.log("help: set mem [index] [rop] [raddr] [lop] [laddr]");
    } else {
      const index = cmdArr[2];
      let rop = parseStringToNumber(cmdArr[3]);
      let raddr = parseStringToNumber(cmdArr[4]);
      let lop = parseStringToNumber(cmdArr[5]);
      let laddr = parseStringToNumber(cmdArr[6]);

      rop = !rop ? 0 : rop;
      raddr = !raddr ? 0 : raddr;
      lop = !lop ? 0 : lop;
      laddr = !laddr ? 0 : laddr;

      const { lowerBound, higherBound } = parseRange(index);
      if (!lowerBound || !higherBound) {
        console.log("Could not parse range!");
        console.log("help: set mem [0:5] [rop] [raddr] [lop] [laddr]");
      } else if (lowerBound === -1) {
        machine.memory[higherBound] = new Instruction(rop, raddr, lop, laddr);
      } else {
        for (let i = lowerBound; i < higherBound; i++) {
          machine.memory[i] = new Instruction(rop, raddr, lop, laddr);
        }
      }
    }
  } else {
    // Parse and run instructions (Default)
    scanner.source = line;
    try {
      scanner.scanTokens();
      const tokens = scanner.tokens;
      parser.readTokens(tokens);
      parser.parse();
      const instructions = parser.instructions;
      if (instructions.length !== 1) {
        console.error("Could not read instruction from REPL");
        continue;
      }
      machine.loadInstructionREPL(instructions[0]);
    } catch (error) {
      console.error(error);
    }
  }

  process.stdout.write(prompt);
}

function parseStringToNumber(str: string) {
  const value = parseInt(str);
  if (value === undefined || Number.isNaN(value)) {
    console.log(`Cannot parse number. Value: ${str}`);
    return null;
  }
  return value;
}

// Parses arguments like 8:19. Returns -1 if cannot parse a range
function parseRange(str: string) {
  let higherBound = -1;
  let lowerBound = -1;
  const tempArr = str.split(":");
  if (tempArr.length == 2) {
    lowerBound = parseInt(tempArr[0]);
    higherBound = parseInt(tempArr[1]);
  } else if (tempArr.length == 1) {
    higherBound = parseInt(tempArr[0]);
  }

  if (lowerBound > higherBound) {
    console.log(
      `Range incorrect. lower > higher. ${lowerBound}:${higherBound}`
    );
  }

  return { lowerBound, higherBound };
}

function printRegisters() {
  // Print contents of registers
  const {
    accumulator,
    memoryAddressRegister,
    memoryBufferRegister,
    instructionRegister,
    instructionBufferRegister,
    programCounter,
    multiplyQuotientRegister,
  } = machine.getRegisterValues();

  const output = `PC  : ${programCounter}
AC  : ${accumulator}
MQ  : ${multiplyQuotientRegister}
MAR : ${memoryAddressRegister}
MBR : ${memoryBufferRegister.lop} ${memoryBufferRegister.laddr}  ${memoryBufferRegister.rop} ${memoryBufferRegister.raddr}
IR  : ${instructionRegister}
IBR : ${instructionBufferRegister.op} ${instructionBufferRegister.addr}`;

  console.log(output);
}

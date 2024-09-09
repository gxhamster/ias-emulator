// A way to load programs into the emulator and interact
// and view the contents in the emulator

import { Instruction, Machine } from "../emulator/emulator";
import { Scanner } from "../parser/lexer";
import { Parser } from "../parser/parser";

/*
    1. Read commands from the user
    2. Have helper commands to display details about instructions
    3. Command to load programs into machine
    4. View contents of register
    5. View contents of memory. Ways to see segments of memory
    6. Set values in the memory
    7. Interactive program running. Step-by-step
    8. Clear memory and registers (Reset machine)
*/

const DISPLAY_MEMORY_DEFAULT_MIN = 0;
const DISPLAY_MEMORY_DEFAULT_MAX = 15;

const DISPLAY_ADDRESS_HEX = false;

const machine = new Machine();
// const example_instruction = `LOAD M(5)
// SUB M(3)
// `
const example_instruction = `LOAD MQ, M(0xE3)
MUL M(0xE3)
LOAD MQ
STOR M(0xF3)
STOR M(0xF4)
STOR M(0xF5)
`
// Instructions are always read from right first.
const scanner = new Scanner(example_instruction);
scanner.scanTokens()
const tokens = scanner.tokens;
const parser = new Parser(tokens);
parser.parse();
const instructions = parser.instructions;

machine.memory[227] = new Instruction(0, 100);
machine.memory[5] = new Instruction(0, 100);
machine.memory[3] = new Instruction(0, 94);
machine.loadInstructionsToMemory(instructions);



const prompt = ">>> ";
process.stdout.write(prompt);
for await (const line of console) {
    // console.log(`You typed: ${line}`);
    if (line == "print registers") {
        // Print contents of registers
            const { accumulator,
                memoryAddressRegister,
                memoryBufferRegister, 
                instructionRegister, 
                instructionBufferRegister, 
                programCounter, 
                multiplyQuotientRegister 
            } = machine.getRegisterValues();

            const output = `PC  : ${programCounter}
AC  : ${accumulator}
MQ  : ${multiplyQuotientRegister}
MAR : ${memoryAddressRegister}
MBR : ${memoryBufferRegister.lop} ${memoryBufferRegister.laddr}  ${memoryBufferRegister.rop} ${memoryBufferRegister.raddr}
IR  : ${instructionRegister}
IBR : ${instructionBufferRegister.op} ${instructionBufferRegister.addr}`
            
            console.log(output) 
    } else if (line.includes("print memory")) {
        let lineArr = line.split(" ");
        let lowerBound = DISPLAY_MEMORY_DEFAULT_MIN;
        let higherBound = DISPLAY_MEMORY_DEFAULT_MAX;
        if (lineArr.length > 2) {
            const memoryRangeStr = lineArr[2];
            const tempArr = memoryRangeStr.split(":")
            if (tempArr.length == 2) {
                lowerBound = parseInt(tempArr[0]);
                higherBound = parseInt(tempArr[1]);
            } else if (tempArr.length == 1) {
                higherBound = parseInt(tempArr[0]);
            }
        }             
        lowerBound = (!lowerBound) ? DISPLAY_MEMORY_DEFAULT_MIN : lowerBound;
        higherBound = (!higherBound) ? DISPLAY_MEMORY_DEFAULT_MAX : higherBound;
        // Call to emulator to get contents of memory
        console.table(machine.getMemoryByRange(lowerBound, higherBound), );
    }

    process.stdout.write(prompt);
}

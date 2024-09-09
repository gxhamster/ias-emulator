import { Machine, Instruction } from "./emulator/emulator";
import {Scanner} from "./parser/lexer"

// Instructions are always read from right first.
const machine = new Machine();
// 00000001 000000000101
machine.memory[5] = new Instruction(0, 4);
machine.memory[3] = new Instruction(0, 2);
const instructions = [new Instruction(1, 5), new Instruction(6, 3)];
machine.loadInstructionsToMemory(instructions);


const example_instruction = `
LOAD M(5)
LOAD -M(5)
LOAD |M(5)|
LOAD -|M(0xfff)|
`
const scanner = new Scanner(example_instruction);
scanner.scanTokens()
console.log(scanner._tokens)

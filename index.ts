import { Machine, Instruction } from "./emulator/emulator";
import {Scanner} from "./parser/lexer"
import { Parser } from "./parser/parser";


const machine = new Machine();


const example_instruction = `LOAD MQ, M(0xE3)
MUL M(0xE3)
STOR M(0xF3, 8:19)
LOAD MQ
STOR M(0xF3, 28:39)`
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
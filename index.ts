import { Machine, Instruction } from "./emulator/emulator";
import {Scanner} from "./parser/lexer"
import { Parser } from "./parser/parser";

const example_instruction = `LOAD M(5)
SUB M(3)
`
// Instructions are always read from right first.
const scanner = new Scanner(example_instruction);
scanner.scanTokens()
const tokens = scanner.tokens;
const parser = new Parser(tokens);
parser.parse();
const instructions = parser.instructions;

const machine = new Machine();
machine.memory[5] = new Instruction(0, 100);
machine.memory[3] = new Instruction(0, 94);
machine.loadInstructionsToMemory(instructions);


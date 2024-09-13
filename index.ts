import { Machine } from "./emulator/emulator";
import { Interpreter } from "./interpreter/interpreter";
import {Scanner} from "./parser/lexer"
import { Parser } from "./parser/parser";
import { parseArgs } from "util";

const machine = new Machine();
const example_instruction1 = `
// hello
// hello
STORI M(5), 6
STORI M(6), 7
LOAD M(5)
ADD M(6)
HLT
`;

// Parse commandline arugments
const { values } = parseArgs({
  args: Bun.argv,
  options: {
    file: {
      type: "string",
    },
    i: {
        type: "boolean"
    }
  },
  strict: true,
  allowPositionals: true,
});

// Read the file
const path = values.file;
let sourceText = "";
if (path) {
    const file = Bun.file(path);
    const doesFileExist = await file.exists();
    if (doesFileExist) {
        sourceText =  await file.text();
    } else {
        console.error("Cannot find a file. Exiting")
        process.exit(1)
    }
} else {
    console.error("No path was provided to read from. Exiting.")
    process.exit(1)
}


// Instructions are always read from right first.
const scanner = new Scanner(sourceText);
scanner.scanTokens();
const tokens = scanner.tokens;
const parser = new Parser(tokens);
parser.parse();
const instructions = parser.instructions;
let interpreter = new Interpreter(machine, parser, scanner);

try {
    machine.loadInstructionsToMemory(instructions);
    if (values.i) {
        interpreter.startInterpreter()
    }
} catch (error) {
    console.error("An error occured during execution. Error: ", error);
    interpreter.startInterpreter()
}
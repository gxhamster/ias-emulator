import { Scanner} from "./lexer"

export const LOAD_FROM_MQ = generateReferenceTokens("LOAD MQ");
export const LOAD_TO_MQ = generateReferenceTokens("LOAD MQ,M(1)");
export const STOR_TO_MEMORY = generateReferenceTokens("STOR M(1)");
export const LOAD_FROM_MEMORY = generateReferenceTokens("LOAD M(1)");
export const LOAD_FROM_MEMORY_NEG_OFF = generateReferenceTokens("LOAD -M(1)");
export const LOAD_FROM_MEMORY_ABS = generateReferenceTokens("LOAD |M(1)|");
export const LOAD_FROM_MEMORY_ABS_NEG_OFF = generateReferenceTokens("LOAD -|M(1)|");
export const JUMP_LEFT = generateReferenceTokens("JUMP M(1, 0:19)");
export const JUMP_RIGHT = generateReferenceTokens("JUMP M(1,20:39)");
export const JUMP_COND_LEFT = generateReferenceTokens("JUMP+ M(1,0:19)");
export const JUMP_COND_RIGHT = generateReferenceTokens("JUMP+ M(1,20:39)");
export const ADD = generateReferenceTokens("ADD M(1)");
export const ADD_ABS = generateReferenceTokens("ADD |M(1)|");
export const SUB = generateReferenceTokens("SUB M(1)");
export const SUB_ABS = generateReferenceTokens("SUB |M(1)|");
export const MUL = generateReferenceTokens("MUL M(1)");
export const DIV = generateReferenceTokens("DIV M(1)");
export const LSH = generateReferenceTokens("LSH");
export const RSH = generateReferenceTokens("RSH");
export const STOR_REPLACE_LEFT = generateReferenceTokens("STOR M(1,8:19)");
export const STOR_REPLACE_RIGHT = generateReferenceTokens("STOR M(1,28:39)");

export const HLT = generateReferenceTokens("HLT");



// This function is used so convenience to generate the sample token patterns
function generateReferenceTokens(sampleInstruction: string) {
    const scanner = new Scanner(sampleInstruction);
    scanner.scanTokens();
    const tokenTypes = scanner.tokens.map(token => token.tokenType);
    return tokenTypes;
}
export enum TokenType {
  // Instruction tokens
  LOAD,
  STOR,
  JUMP,
  JUMP_COND,
  ADD,
  SUB,
  MUL,
  DIV,
  LSH,
  RSH,
  // Extra opcode tokens
  HLT,
  STORI,

  // Memory and registers
  REGISTER_MQ,
  MEMORY,
  MEMORY_ADDRESS_HEX,
  MEMORY_ADDRESS_DEC,

  // Individual tokens
  LEFT_PAREN,
  RIGHT_PAREN,
  NEG,
  POS,
  ABS,
  COMMA,
  COLON,
}

export interface Token {
  lexeme: string;
  // Lines start from 0
  line: number;
  tokenType: TokenType;
}

export class Scanner {
  private _source: string = "";
  public _tokens: Array<Token> = new Array();
  private lines: Array<string> = new Array();
  private line: number = 0;

  constructor(source?: string) {
    if (source) {
      this._source = source;
      this.splitCodeTolines();
    }
  }

  set source(newSource: string) {
    if (newSource.length <= 0) {
      console.error("Cannot set an empty source!");
      return;
    }
    // Reset Scanner state when reading a new source
    this._source = newSource;
    this._tokens = new Array();
    this.lines = new Array();
    this.line = 0;

    this.splitCodeTolines();
  }

  get tokens() {
    return this._tokens;
  }

  // Scans per line for instruction and its operands
  scanTokens() {
    if (this._source.length <= 0) {
      console.error("Cannot scan an empty source!");
      return;
    }

    // Ignore and remove the comment lines
    for (let i = 0; i < this.lines.length; i++) {
      if (this.lines[i].startsWith("//")) {
        this.lines[i] = ""
      }
    }
    this.lines = this.lines.filter((line) => line.length > 0);

    while (this.line < this.lines.length) {
      const splitStr = this.lines[this.line].split(" ");
      const instruction = splitStr[0];
      // Create tokens for instruction code
      switch (instruction) {
        case "LOAD":
          this.addToken(TokenType.LOAD, "LOAD");
          break;
        case "STOR":
          this.addToken(TokenType.STOR, "STOR");
          break;
        case "JUMP":
          this.addToken(TokenType.JUMP, "JUMP");
          break;
        case "JUMP+":
          this.addToken(TokenType.JUMP_COND, "JUMP+");
          break;
        case "ADD":
          this.addToken(TokenType.ADD, "ADD");
          break;
        case "SUB":
          this.addToken(TokenType.SUB, "SUB");
          break;
        case "MUL":
          this.addToken(TokenType.MUL, "MUL");
          break;
        case "DIV":
          this.addToken(TokenType.DIV, "DIV");
          break;
        case "LSH":
          this.addToken(TokenType.LSH, "LSH");
          break;
        case "RSH":
          this.addToken(TokenType.RSH, "RSH");
          break;
        case "HLT":
          this.addToken(TokenType.HLT, "HLT");
          break;
        case "STORI":
          this.addToken(TokenType.STORI, "STORI");
          break;
        default:
          throw new Error(
            `Unrecognized instruction opcode. Instruction: ${instruction}`
          );
      }

      // Create tokens for the extra operands (symbols, numbers, registers)
      splitStr[0] = "";
      const operandsStr = splitStr.join("").trim();
      for (let i = 0; i < operandsStr.length; i++) {
        let curr = operandsStr[i];
        // TODO: Potential bug. Out of bounds at last element
        let next = operandsStr[i + 1];
        switch (curr) {
          case "M":
            // MQ register token
            if (next == "Q") {
              this.addToken(TokenType.REGISTER_MQ, "MQ");
              i++;
            } else this.addToken(TokenType.MEMORY, "M");
            break;
          case ",":
            this.addToken(TokenType.COMMA, ",");
            break;
          case "(":
            this.addToken(TokenType.LEFT_PAREN, "(");
            break;
          case ")":
            this.addToken(TokenType.RIGHT_PAREN, ")");
            break;
          case "-":
            this.addToken(TokenType.NEG, "-");
            break;
          case "|":
            this.addToken(TokenType.ABS, "|");
            break;
          case ":":
            this.addToken(TokenType.COLON, ":");
            break;
          default:
            if (curr == "0" && next == "x") {
              // Parse hex addresses
              i += 2;
              const addrBegin = i;
              while (this.isHex(operandsStr[i])) i++;
              const addrEnd = i;
              const hexStr = operandsStr.substring(addrBegin, addrEnd);
              i--;
              this.addToken(TokenType.MEMORY_ADDRESS_HEX, hexStr);
            } else if (this.isDigit(curr)) {
              // Parse numbers addreses
              const addrBegin = i;
              while (this.isDigit(operandsStr[i])) i++;
              const addrEnd = i;
              const digitStr = operandsStr.substring(addrBegin, addrEnd);
              i--;
              this.addToken(TokenType.MEMORY_ADDRESS_DEC, digitStr);
            } else {
              throw new Error(
                `Unidentified token [${curr}] at line: ${this.line}`
              );
            }
            break;
        }
      }
      this.line++;
    }
  }

  private isAlpha(c: string) {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
  }

  private isDigit(c: string) {
    return c >= "0" && c <= "9";
  }

  private isHex(c: string) {
    c = c.toLowerCase();
    return (c >= "0" && c <= "9") || (c >= "a" && c <= "f");
  }

  private splitCodeTolines() {
    this.lines = this._source.split(/\r?\n/);
    this.lines = this.lines.filter((x) => x.trim() !== "");
  }

  private addToken(tokenType: TokenType, lexeme: string) {
    this._tokens.push({
      tokenType,
      lexeme,
      line: this.line,
    });
  }
}

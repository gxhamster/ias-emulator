
enum TokenType {
    // Instructions
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
    COLON
}

interface Token {
    lexeme: string;
    line: number;
    tokenType: TokenType
}


export class Scanner {
    public source: string = ""
    public tokens: Array<Token> = new Array();
    private lines: Array<string> = new Array();
    private line: number = 1;

    constructor(source: string) {
        this.source = source;
        this.splitCodeTolines()
    }

    /*
    LOAD MQ
    LOAD MQ, M(54)
    LOAD –M(X)
    LOAD |M(X)|
    LOAD –|M(X)| 
    */

    // Scans per line for instruction and its operands
    scanTokens() {
        
        while (this.line <= this.lines.length) {
            console.log(this.line, this.lines)
            const splitStr = this.lines[this.line - 1].split(" ");
            const instruction = splitStr[0]
            // Parse instruction code
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
                default:
                    throw new Error("Unrecognized instruction opcode. Exiting!")
            }
            
            // Parse the extra operands
            splitStr[0] = ''
            const operandsStr = splitStr.join('').trim();
            for (let i = 0; i < operandsStr.length; i++) {
                let curr = operandsStr[i];
                // TODO: Potential bug. Out of bounds at last element
                let next = operandsStr[i+1];
                switch (curr) {
                    case 'M':
                        // MQ register token
                        if (next == 'Q') {
                            this.addToken( TokenType.REGISTER_MQ, "MQ")
                            i++;
                        } else 
                            this.addToken(TokenType.MEMORY, "M")
                        break;
                    case ',':
                        this.addToken(TokenType.COMMA, ',');
                        break;
                    case '(':
                        this.addToken(TokenType.LEFT_PAREN, '(');
                        break;
                    case ')':
                        this.addToken(TokenType.RIGHT_PAREN, ')');
                        break;
                    case '-':
                        this.addToken(TokenType.NEG, '-');
                        break;
                    case '|':
                        this.addToken(TokenType.ABS, '|');
                        break;
                    case ':':
                        this.addToken(TokenType.COLON, ':');
                        break;
                    default:
                        if (curr == '0' && next == 'x' ) {
                            // Parse hex addresses
                            // LOAD MQ, M(0xFF)
                            i += 2;
                            const addrBegin = i;
                            while (this.isHex(operandsStr[i])) i++;
                            const addrEnd = i;
                            const hexStr = operandsStr.substring(addrBegin, addrEnd);
                            i--;
                            this.addToken(TokenType.MEMORY_ADDRESS_HEX, hexStr);
                        } else if (this.isDigit(curr)) {
                            // Parse numbers or addreses
                            // LOAD MQ, M(54)
                            const addrBegin = i;
                            while (this.isDigit(operandsStr[i])) i++;
                            const addrEnd = i;
                            const digitStr = operandsStr.substring(addrBegin, addrEnd);
                            i--;
                            this.addToken(TokenType.MEMORY_ADDRESS_DEC, digitStr);
                            
                        } else {
                            throw new Error(`Unidentified token [${curr}] at line: ${this.line}`)
                        }
                        break;
                }
            }
            console.log(this.tokens)
            this.line++;
        }
    }

    private isAlpha(c: string) {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
    }

    private isDigit(c: string) {
        return (c >= '0' && c <= '9');
    }

    private isHex(c: string) {
        c = c.toLowerCase();
        return (c >= '0' && c <= '9') || (c >= 'a' && c <='f');
    }


    private splitCodeTolines() {
        this.lines = this.source.split(/\r?\n/);
        this.lines = this.lines.filter((x) => x.trim() !== '');
    }

    private addToken(tokenType: TokenType, lexeme: string) {
        this.tokens.push({
            tokenType,
            lexeme,
            line: this.line
        })
    }

}



import type { StatSnapshot } from './CombatState';

type FormulaContext = {
  self?: StatSnapshot;
  target?: StatSnapshot;
  context?: Record<string, number>;
  base?: number;
};

const OPERATORS = new Set(['+', '-', '*', '/', '(', ')', '.', '<', '>', '=', '!', '&', '|']);

class SafeExpressionParser {
  private tokens: string[];
  private index: number = 0;

  constructor(tokens: string[]) {
    this.tokens = tokens;
  }

  private peek(): string | undefined {
    return this.tokens[this.index];
  }

  private consume(expected?: string): string {
    const token = this.peek();
    if (token === undefined) {
      throw new Error("Unexpected end of expression");
    }
    if (expected !== undefined && token !== expected) {
      throw new Error(`Expected '${expected}' but got '${token}'`);
    }
    this.index++;
    return token;
  }

  parse(): boolean | number {
    if (this.tokens.length === 0) return 0;
    const val = this.expression();
    if (this.index < this.tokens.length) {
      throw new Error(`Unexpected token at end: ${this.peek()}`);
    }
    return val;
  }

  private expression(): boolean | number {
    return this.logicalOr();
  }

  private logicalOr(): boolean | number {
    let val = this.logicalAnd();
    while (this.peek() === '||') {
      this.consume('||');
      const right = this.logicalAnd();
      val = Boolean(val) || Boolean(right);
    }
    return val;
  }

  private logicalAnd(): boolean | number {
    let val = this.comparison();
    while (this.peek() === '&&') {
      this.consume('&&');
      const right = this.comparison();
      val = Boolean(val) && Boolean(right);
    }
    return val;
  }

  private comparison(): boolean | number {
    let val = this.sum();
    const op = this.peek();
    if (op && ['<', '>', '<=', '>=', '==', '!='].includes(op)) {
      this.consume(op);
      const right = this.sum();
      const leftNum = Number(val);
      const rightNum = Number(right);
      switch (op) {
        case '<': return leftNum < rightNum;
        case '>': return leftNum > rightNum;
        case '<=': return leftNum <= rightNum;
        case '>=': return leftNum >= rightNum;
        case '==': return leftNum == rightNum;
        case '!=': return leftNum != rightNum;
      }
    }
    return val;
  }

  private sum(): number {
    let val = this.product();
    let op = this.peek();
    while (op === '+' || op === '-') {
      this.consume(op);
      const right = this.product();
      if (op === '+') {
        val = val + right;
      } else {
        val = val - right;
      }
      op = this.peek();
    }
    return val;
  }

  private product(): number {
    let val = Number(this.unary());
    let op = this.peek();
    while (op === '*' || op === '/') {
      this.consume(op);
      const right = Number(this.unary());
      if (op === '*') {
        val = val * right;
      } else {
        if (right === 0) {
          throw new Error("Division by zero");
        }
        val = val / right;
      }
      op = this.peek();
    }
    return val;
  }

  private unary(): number | boolean {
    const op = this.peek();
    if (op === '!') {
      this.consume('!');
      return !this.unary();
    }
    if (op === '-') {
      this.consume('-');
      const val = this.unary();
      return -Number(val);
    }
    return this.primary();
  }

  private primary(): number | boolean {
    const token = this.consume();
    if (token === '(') {
      const val = this.expression();
      this.consume(')');
      return val;
    }
    const num = Number(token);
    if (isNaN(num)) {
      throw new Error(`Invalid number: ${token}`);
    }
    return num;
  }
}

export class FormulaEvaluator {
  static evaluateNumber(expression: string | undefined, data: FormulaContext): number {
    if (!expression) return 0;
    const compiled = this.compile(expression, data);

    if (!/^[0-9+\-*/().\s]+$/.test(compiled)) {
      console.error(`Formula Error: Unsafe numeric expression '${expression}' -> '${compiled}'`);
      return 0;
    }

    try {
      const tokens = compiled.match(/\d+(?:\.\d+)?|&&|\|\||<=|>=|==|!=|[+\-*/()<>=!]/g) || [];
      const parser = new SafeExpressionParser(tokens);
      return Number(parser.parse());
    } catch (error) {
      console.error(`Formula Error: Failed to evaluate '${expression}'`, error);
      return 0;
    }
  }

  static evaluateBoolean(expression: string | undefined, data: FormulaContext): boolean {
    if (!expression || expression === 'always') return true;
    const compiled = this.compile(expression, data);

    if (!/^[0-9+\-*/().<>=!&|\s]+$/.test(compiled)) {
      console.error(`Formula Error: Unsafe boolean expression '${expression}' -> '${compiled}'`);
      return false;
    }

    try {
      const tokens = compiled.match(/\d+(?:\.\d+)?|&&|\|\||<=|>=|==|!=|[+\-*/()<>=!]/g) || [];
      const parser = new SafeExpressionParser(tokens);
      return Boolean(parser.parse());
    } catch (error) {
      console.error(`Formula Error: Failed to evaluate condition '${expression}'`, error);
      return false;
    }
  }

  private static compile(expression: string, data: FormulaContext): string {
    let compiled = expression.trim();

    compiled = compiled.replace(/\bbase\b/g, String(data.base ?? 0));
    compiled = compiled.replace(/self\.([a-zA-Z_0-9]+)/g, (_, statName) =>
      String(data.self?.[statName] ?? 0)
    );
    compiled = compiled.replace(/target\.([a-zA-Z_0-9]+)/g, (_, statName) =>
      String(data.target?.[statName] ?? 0)
    );
    compiled = compiled.replace(/context\.([a-zA-Z_0-9]+)/g, (_, statName) =>
      String(data.context?.[statName] ?? 0)
    );

    for (const char of compiled) {
      if (/[0-9\s]/.test(char) || OPERATORS.has(char)) continue;
      return '0';
    }

    return compiled;
  }
}

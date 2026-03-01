// FreeLang v6: Lexer

import { Token, TokenType as T } from "./token";

const KEYWORDS: Record<string, T> = {
  let: T.Let, const: T.Const, fn: T.Fn, return: T.Return,
  if: T.If, else: T.Else, while: T.While, for: T.For, in: T.In,
  break: T.Break, continue: T.Continue,
  print: T.Print, println: T.Println,
  true: T.Bool, false: T.Bool, null: T.Null,
  try: T.Try, catch: T.Catch, finally: T.Finally, throw: T.Throw,
  import: T.Import, export: T.Export, from: T.From, as: T.As,
  struct: T.Struct, new: T.New, match: T.Match,
  and: T.And, or: T.Or, not: T.Not,
};

export function lex(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0, line = 1, col = 1;

  while (i < source.length) {
    const ch = source[i];

    // Whitespace
    if (ch === " " || ch === "\t" || ch === "\r") { i++; col++; continue; }
    if (ch === "\n") { i++; line++; col = 1; continue; }

    // Comment
    if (ch === "/" && source[i + 1] === "/") {
      while (i < source.length && source[i] !== "\n") i++;
      continue;
    }

    // Number
    if (isDigit(ch)) {
      const start = i;
      while (i < source.length && (isDigit(source[i]) || source[i] === ".")) i++;
      tokens.push({ type: T.Number, value: source.slice(start, i), line, col });
      col += i - start;
      continue;
    }

    // String
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++; col++;

      // Collect parts for potential interpolation
      type Part = { kind: "str"; value: string } | { kind: "expr"; text: string };
      const parts: Part[] = [];
      let str = "";
      let hasInterp = false;

      while (i < source.length && source[i] !== quote) {
        if (source[i] === "\\" && i + 1 < source.length) {
          i++; col++;
          const esc = source[i];
          switch (esc) {
            case "n": str += "\n"; break;
            case "t": str += "\t"; break;
            case "r": str += "\r"; break;
            case "\\": str += "\\"; break;
            case '"': str += '"'; break;
            case "'": str += "'"; break;
            case "0": str += "\0"; break;
            default: str += esc; break;
          }
          i++; col++;
        } else if (quote === '"' && source[i] === "$" && i + 1 < source.length && source[i + 1] === "{") {
          hasInterp = true;
          parts.push({ kind: "str", value: str });
          str = "";
          i += 2; col += 2; // skip ${
          let depth = 1;
          const exprStart = i;
          while (i < source.length && depth > 0) {
            if (source[i] === "{") depth++;
            else if (source[i] === "}") { depth--; if (depth === 0) break; }
            i++; col++;
          }
          parts.push({ kind: "expr", text: source.slice(exprStart, i) });
          i++; col++; // skip }
        } else {
          str += source[i];
          i++; col++;
        }
      }
      i++; col++; // skip closing quote

      if (!hasInterp) {
        tokens.push({ type: T.String, value: str, line, col });
      } else {
        // Emit remaining string
        parts.push({ kind: "str", value: str });
        // Desugar to concatenation: ("str" + (expr) + "str" ...)
        tokens.push({ type: T.LParen, value: "(", line, col });
        let first = true;
        for (const part of parts) {
          if (!first) tokens.push({ type: T.Plus, value: "+", line, col });
          if (part.kind === "str") {
            tokens.push({ type: T.String, value: part.value, line, col });
          } else {
            tokens.push({ type: T.LParen, value: "(", line, col });
            const inner = lex(part.text);
            inner.pop(); // remove EOF
            tokens.push(...inner);
            tokens.push({ type: T.RParen, value: ")", line, col });
          }
          first = false;
        }
        tokens.push({ type: T.RParen, value: ")", line, col });
      }
      continue;
    }

    // Ident / Keyword
    if (isAlpha(ch)) {
      const start = i;
      while (i < source.length && isAlphaNum(source[i])) i++;
      const word = source.slice(start, i);
      tokens.push({ type: KEYWORDS[word] ?? T.Ident, value: word, line, col });
      col += i - start;
      continue;
    }

    // Operators & Delimiters
    const startCol = col;
    switch (ch) {
      case "+": tokens.push(source[i+1] === "=" ? (i++, col++, tok(T.PlusAssign, "+=")) : tok(T.Plus, "+")); break;
      case "-": tokens.push(source[i+1] === ">" ? (i++, col++, tok(T.Arrow, "->")) : source[i+1] === "=" ? (i++, col++, tok(T.MinusAssign, "-=")) : tok(T.Minus, "-")); break;
      case "*": tokens.push(source[i+1] === "=" ? (i++, col++, tok(T.StarAssign, "*=")) : tok(T.Star, "*")); break;
      case "/": tokens.push(source[i+1] === "=" ? (i++, col++, tok(T.SlashAssign, "/=")) : tok(T.Slash, "/")); break;
      case "%": tokens.push(tok(T.Percent, "%")); break;
      case "=": tokens.push(source[i+1] === "=" ? (i++, col++, tok(T.Eq, "==")) : source[i+1] === ">" ? (i++, col++, tok(T.FatArrow, "=>")) : tok(T.Assign, "=")); break;
      case "!": tokens.push(source[i+1] === "=" ? (i++, col++, tok(T.Neq, "!=")) : tok(T.Not, "!")); break;
      case "<": tokens.push(source[i+1] === "=" ? (i++, col++, tok(T.Lte, "<=")) : tok(T.Lt, "<")); break;
      case ">": tokens.push(source[i+1] === "=" ? (i++, col++, tok(T.Gte, ">=")) : tok(T.Gt, ">")); break;
      case "&":
        if (source[i+1] === "&") {
          i++; col++; tokens.push(tok(T.And, "&&"));
        } else {
          tokens.push(tok(T.Ampersand, "&"));
        }
        break;
      case "|": if (source[i+1] === "|") { i++; col++; tokens.push(tok(T.Or, "||")); } break;
      case "(": tokens.push(tok(T.LParen, "(")); break;
      case ")": tokens.push(tok(T.RParen, ")")); break;
      case "{": tokens.push(tok(T.LBrace, "{")); break;
      case "}": tokens.push(tok(T.RBrace, "}")); break;
      case "[": tokens.push(tok(T.LBracket, "[")); break;
      case "]": tokens.push(tok(T.RBracket, "]")); break;
      case ",": tokens.push(tok(T.Comma, ",")); break;
      case ";": tokens.push(tok(T.Semicolon, ";")); break;
      case ":": tokens.push(tok(T.Colon, ":")); break;
      case ".": tokens.push(source[i+1] === "." ? (i++, col++, tok(T.DotDot, "..")) : tok(T.Dot, ".")); break;
      default: throw new Error(`Unexpected character '${ch}' at line ${line}:${col}`);
    }
    i++; col++;

    function tok(type: T, value: string): Token {
      return { type, value, line, col: startCol };
    }
  }

  tokens.push({ type: T.EOF, value: "", line, col });
  return tokens;
}

function isDigit(ch: string): boolean { return ch >= "0" && ch <= "9"; }
function isAlpha(ch: string): boolean { return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_"; }
function isAlphaNum(ch: string): boolean { return isAlpha(ch) || isDigit(ch); }

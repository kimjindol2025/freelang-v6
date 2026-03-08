// FreeLang v6: Parser (Pratt / Recursive Descent)

import { Token, TokenType as T } from "./token";
import { Expr, Stmt, Program, MatchArm, Param } from "./ast";

export function parse(tokens: Token[]): Program {
  let pos = 0;

  function peek(): Token { return tokens[pos]; }
  function advance(): Token { return tokens[pos++]; }
  function expect(type: T, msg?: string): Token {
    const t = advance();
    if (t.type !== type) throw new Error(msg ?? `Expected ${T[type]}, got ${T[t.type]} '${t.value}' at line ${t.line}`);
    return t;
  }
  function match(type: T): boolean { if (peek().type === type) { advance(); return true; } return false; }
  function at(type: T): boolean { return peek().type === type; }

  // --- Statements ---
  function parseProgram(): Program {
    const stmts: Stmt[] = [];
    while (!at(T.EOF)) stmts.push(parseStmt());
    return { stmts };
  }

  function parseStmt(): Stmt {
    while (match(T.Semicolon)) {} // skip stray semicolons
    if (at(T.EOF)) return { kind: "expr", expr: { kind: "null" } };
    if (at(T.Let) || at(T.Const)) return parseLetStmt();
    if (at(T.Fn)) return parseFnStmt();
    if (at(T.Return)) return parseReturn();
    if (at(T.If)) return parseIf();
    if (at(T.While)) return parseWhile();
    if (at(T.For)) return parseFor();
    if (at(T.LBrace)) return parseBlock();
    if (at(T.Print) || at(T.Println)) return parsePrint();
    if (at(T.Break)) { advance(); match(T.Semicolon); return { kind: "break" }; }
    if (at(T.Continue)) { advance(); match(T.Semicolon); return { kind: "continue" }; }
    if (at(T.Try)) return parseTry();
    if (at(T.Throw)) return parseThrow();
    if (at(T.Struct)) return parseStruct();
    if (at(T.Enum)) return parseEnum();
    if (at(T.Import)) return parseImport();
    if (at(T.Export)) return parseExport();
    if (at(T.Match)) return parseMatch();
    return parseExprStmt();
  }

  function parseLetStmt(): Stmt {
    const mutable = advance().type === T.Let;

    // Object destructuring: let {a, b} = expr
    if (at(T.LBrace)) {
      advance();
      const names: string[] = [];
      while (!at(T.RBrace) && !at(T.EOF)) {
        names.push(expect(T.Ident, "Expected destructured name").value);
        match(T.Comma);
      }
      expect(T.RBrace);
      expect(T.Assign, "Expected '=' after destructuring pattern");
      const init = parseExpr();
      match(T.Semicolon);
      const tmp = `__d${pos}`;
      return { kind: "multi", stmts: [
        { kind: "let", name: tmp, mutable: false, init },
        ...names.map(n => ({
          kind: "let" as const, name: n, mutable,
          init: { kind: "member" as const, object: { kind: "ident" as const, name: tmp }, property: n } as Expr,
        }))
      ]};
    }

    // Array destructuring: let [x, y] = expr
    if (at(T.LBracket)) {
      advance();
      const names: string[] = [];
      while (!at(T.RBracket) && !at(T.EOF)) {
        names.push(expect(T.Ident, "Expected destructured name").value);
        match(T.Comma);
      }
      expect(T.RBracket);
      expect(T.Assign, "Expected '=' after destructuring pattern");
      const init = parseExpr();
      match(T.Semicolon);
      const tmp = `__d${pos}`;
      return { kind: "multi", stmts: [
        { kind: "let", name: tmp, mutable: false, init },
        ...names.map((n, i) => ({
          kind: "let" as const, name: n, mutable,
          init: { kind: "index" as const, object: { kind: "ident" as const, name: tmp }, index: { kind: "number" as const, value: i } as Expr } as Expr,
        }))
      ]};
    }

    const name = expect(T.Ident, "Expected variable name").value;
    let init: Expr | null = null;
    if (match(T.Assign)) init = parseExpr();
    match(T.Semicolon);
    return { kind: "let", name, mutable, init };
  }

  function parseFnStmt(): Stmt {
    advance(); // fn
    const name = expect(T.Ident, "Expected function name").value;

    // Parse type parameters if present: <T, U>
    let typeParams: string[] | undefined;
    if (at(T.Lt)) {
      advance(); // <
      typeParams = [];
      while (!at(T.Gt) && !at(T.EOF)) {
        typeParams.push(expect(T.Ident).value);
        match(T.Comma);
      }
      expect(T.Gt, "Expected '>' after type parameters");
    }

    expect(T.LParen);
    const params = parseParams();
    expect(T.RParen);

    // Parse return type annotation if present: -> Type
    let returnType: string | undefined;
    if (match(T.Arrow)) {
      const returnTokens: string[] = [];
      let depth = 0;
      while (!at(T.LBrace) && !at(T.EOF)) {
        const t = peek();
        if (t.type === T.LBracket) depth++;
        if (t.type === T.RBracket) depth--;
        if (depth < 0 || (depth === 0 && t.type === T.LBrace)) break;
        returnTokens.push(t.value || (t.type as unknown as string));
        advance();
      }
      returnType = returnTokens.join("");
    }

    expect(T.LBrace);
    const body = parseBody();
    expect(T.RBrace);
    return { kind: "fn", name, typeParams, params, returnType, body };
  }

  function parseReturn(): Stmt {
    advance(); // return
    let value: Expr | null = null;
    if (!at(T.Semicolon) && !at(T.RBrace) && !at(T.EOF)) value = parseExpr();
    match(T.Semicolon);
    return { kind: "return", value };
  }

  function parseIf(): Stmt {
    advance(); // if

    // Check for if let pattern
    if (at(T.Let)) {
      return parseIfLet();
    }

    const cond = parseExpr();
    expect(T.LBrace);
    const then = parseBody();
    expect(T.RBrace);
    let else_: Stmt[] | null = null;
    if (match(T.Else)) {
      if (at(T.If)) {
        else_ = [parseIf()];
      } else {
        expect(T.LBrace);
        else_ = parseBody();
        expect(T.RBrace);
      }
    }
    return { kind: "if", cond, then, else: else_ };
  }

  function parseIfLet(): Stmt {
    advance(); // let
    const pattern = parseOr(); // Use parseOr to avoid consuming the = operator
    expect(T.Assign);
    const value = parseOr(); // Use parseOr for consistency
    expect(T.LBrace);
    const body = parseBody();
    expect(T.RBrace);

    let else_: Stmt[] | undefined;
    if (match(T.Else)) {
      if (at(T.LBrace)) {
        expect(T.LBrace);
        else_ = parseBody();
        expect(T.RBrace);
      } else if (at(T.If)) {
        // else if pattern
        else_ = [parseIf()];
      }
    }

    return { kind: "if-let", pattern, value, body, else: else_ };
  }

  /**
   * [v3.1] Parse if as an expression
   *
   * Supports: let x = if condition { value1 } else { value2 };
   *
   * Key difference from parseIf():
   * - Must have else clause (to ensure all paths return a value)
   * - Body can contain expressions (parsed as statements with implicit return)
   * - Result is an Expr, not a Stmt
   */
  function parseIfExpr(): Expr {
    advance(); // if
    const cond = parseExpr();
    expect(T.LBrace);
    const then = parseBody();
    expect(T.RBrace);

    let else_: Stmt[];
    if (match(T.Else)) {
      if (at(T.If)) {
        // else if: recursively parse as if expression
        else_ = [{ kind: "expr", expr: parseIfExpr() }];
      } else {
        expect(T.LBrace);
        else_ = parseBody();
        expect(T.RBrace);
      }
    } else {
      throw new Error("If expression must have else clause");
    }

    // Return as an Expr node with kind "if"
    return { kind: "if", cond, then, else: else_ };
  }

  /**
   * [v3.4] Parse match as an expression
   *
   * Supports: let x = match value { ... };
   * Returns an Expr with kind "match"
   */
  function parseMatchExpr(): Expr {
    advance(); // match
    const subject = parseExpr();
    expect(T.LBrace);
    const arms: MatchArm[] = [];

    while (!at(T.RBrace) && !at(T.EOF)) {
      let pattern: Expr | null = null;
      if (at(T.Ident) && peek().value === "_") {
        advance(); // _
      } else {
        pattern = parseExpr();
      }

      // Parse optional guard clause: if condition
      let guard: Expr | null = null;
      if (match(T.If)) {
        guard = parseExpr();
      }

      expect(T.FatArrow, "Expected '=>' in match arm");

      // Parse body: can be expr or block
      let body: Stmt[];
      if (at(T.LBrace)) {
        expect(T.LBrace);
        body = parseBody();
        expect(T.RBrace);
      } else {
        // Single expression as body
        const expr = parseExpr();
        body = [{ kind: "expr", expr }];
      }

      arms.push({ pattern, guard, body });
      match(T.Comma);
    }

    expect(T.RBrace);
    return { kind: "match", subject, arms } as any;
  }

  function parseWhile(): Stmt {
    advance(); // while

    // Check for while let pattern
    if (at(T.Let)) {
      return parseWhileLet();
    }

    const useParen = match(T.LParen);
    const cond = parseExpr();
    if (useParen) expect(T.RParen);
    expect(T.LBrace);
    const body = parseBody();
    expect(T.RBrace);
    return { kind: "while", cond, body };
  }

  function parseWhileLet(): Stmt {
    advance(); // let
    const pattern = parseOr(); // Use parseOr to avoid consuming the = operator
    expect(T.Assign);
    const value = parseOr(); // Use parseOr for consistency
    expect(T.LBrace);
    const body = parseBody();
    expect(T.RBrace);

    return { kind: "while-let", pattern, value, body };
  }

  function parseFor(): Stmt {
    advance(); // for
    const name = expect(T.Ident, "Expected loop variable").value;
    expect(T.In, "Expected 'in'");
    const iter = parseExpr();
    expect(T.LBrace);
    const body = parseBody();
    expect(T.RBrace);
    return { kind: "for", name, iter, body };
  }

  function parseBlock(): Stmt {
    expect(T.LBrace);
    const body = parseBody();
    expect(T.RBrace);
    return { kind: "block", body };
  }

  function parsePrint(): Stmt {
    const newline = advance().type === T.Println;
    expect(T.LParen);
    const expr = parseExpr();
    expect(T.RParen);
    match(T.Semicolon);
    return { kind: "print", expr, newline };
  }

  function parseTry(): Stmt {
    advance(); // try
    expect(T.LBrace);
    const body = parseBody();
    expect(T.RBrace);
    let catchVar: string | null = null;
    let catchBody: Stmt[] = [];
    let finallyBody: Stmt[] = [];
    if (match(T.Catch)) {
      if (match(T.LParen)) {
        catchVar = expect(T.Ident, "Expected catch variable").value;
        expect(T.RParen);
      }
      expect(T.LBrace);
      catchBody = parseBody();
      expect(T.RBrace);
    }
    if (match(T.Finally)) {
      expect(T.LBrace);
      finallyBody = parseBody();
      expect(T.RBrace);
    }
    return { kind: "try", body, catchVar, catchBody, finallyBody };
  }

  function parseThrow(): Stmt {
    advance(); // throw
    const expr = parseExpr();
    match(T.Semicolon);
    return { kind: "throw", expr };
  }

  function parseStruct(): Stmt {
    advance(); // struct
    const name = expect(T.Ident).value;

    // Parse type parameters if present: <K, V>
    let typeParams: string[] | undefined;
    if (at(T.Lt)) {
      advance(); // <
      typeParams = [];
      while (!at(T.Gt) && !at(T.EOF)) {
        typeParams.push(expect(T.Ident).value);
        match(T.Comma);
      }
      expect(T.Gt, "Expected '>' after type parameters");
    }

    expect(T.LBrace);
    const fields: Array<{ name: string; type: string }> = [];
    while (!at(T.RBrace) && !at(T.EOF)) {
      const fieldName = expect(T.Ident).value;
      // Type annotation: "x: i32" or just "x" defaults to "any"
      let fieldType = "any";
      if (at(T.Colon)) {
        advance();
        fieldType = expect(T.Ident).value;
      }
      fields.push({ name: fieldName, type: fieldType });
      match(T.Comma);
    }
    expect(T.RBrace);
    return { kind: "struct", name, typeParams, fields };
  }

  function parseEnum(): Stmt {
    advance(); // enum
    const name = expect(T.Ident).value;

    // Parse type parameters if present: <T, E>
    let typeParams: string[] | undefined;
    if (at(T.Lt)) {
      advance(); // <
      typeParams = [];
      while (!at(T.Gt) && !at(T.EOF)) {
        typeParams.push(expect(T.Ident).value);
        match(T.Comma);
      }
      expect(T.Gt, "Expected '>' after type parameters");
    }

    expect(T.LBrace);
    const variants: Array<{ name: string; fields?: string[] }> = [];
    while (!at(T.RBrace) && !at(T.EOF)) {
      const variantName = expect(T.Ident).value;
      let fields: string[] | undefined;
      // Check for variant with data: Name(Type1, Type2)
      if (at(T.LParen)) {
        advance(); // (
        fields = [];
        while (!at(T.RParen) && !at(T.EOF)) {
          fields.push(expect(T.Ident).value);
          match(T.Comma);
        }
        expect(T.RParen);
      }
      variants.push({ name: variantName, fields });
      match(T.Comma);
    }
    expect(T.RBrace);
    return { kind: "enum", name, typeParams, variants };
  }

  function parseImport(): Stmt {
    advance(); // import
    if (at(T.LBrace)) {
      // import { name1, name2 } from "path"
      advance(); // {
      const names: string[] = [];
      while (!at(T.RBrace) && !at(T.EOF)) {
        names.push(expect(T.Ident, "Expected import name").value);
        match(T.Comma);
      }
      expect(T.RBrace);
      expect(T.From, "Expected 'from'");
      const p = expect(T.String, "Expected module path").value;
      match(T.Semicolon);
      return { kind: "import", names, path: p, alias: null };
    } else {
      // import "path" or import "path" as Alias
      const p = expect(T.String, "Expected module path").value;
      let alias: string | null = null;
      if (match(T.As)) alias = expect(T.Ident, "Expected alias name").value;
      match(T.Semicolon);
      return { kind: "import", names: null, path: p, alias };
    }
  }

  function parseExport(): Stmt {
    advance(); // export
    if (at(T.Fn)) return { kind: "export", stmt: parseFnStmt() };
    if (at(T.Let) || at(T.Const)) return { kind: "export", stmt: parseLetStmt() };
    throw new Error(`Expected fn or let after export at line ${peek().line}`);
  }

  function parseMatch(): Stmt {
    advance(); // match
    const subject = parseExpr();
    expect(T.LBrace);
    const arms: MatchArm[] = [];
    while (!at(T.RBrace) && !at(T.EOF)) {
      let pattern: Expr | null = null;
      if (at(T.Ident) && peek().value === "_") {
        advance(); // _
      } else {
        pattern = parseExpr();
      }

      // Parse optional guard clause: if condition
      let guard: Expr | null = null;
      if (match(T.If)) {
        guard = parseExpr();
      }

      expect(T.FatArrow, "Expected '=>' in match arm");
      let body: Stmt[];
      if (at(T.LBrace)) {
        expect(T.LBrace);
        body = parseBody();
        expect(T.RBrace);
      } else {
        body = [parseStmt()];
      }
      arms.push({ pattern, guard, body });
      match(T.Comma);
    }
    expect(T.RBrace);
    return { kind: "match", subject, arms };
  }

  function parseExprStmt(): Stmt {
    const expr = parseExpr();
    match(T.Semicolon);
    return { kind: "expr", expr };
  }

  // --- Expressions (Pratt) ---
  function parseExpr(): Expr { return parseAssign(); }

  function parseAssign(): Expr {
    let left = parseOr();
    if (at(T.Assign) || at(T.PlusAssign) || at(T.MinusAssign) || at(T.StarAssign) || at(T.SlashAssign)) {
      const op = advance();
      const right = parseAssign();
      if (op.type === T.Assign) return { kind: "assign", target: left, value: right };
      const binOp = op.value[0]; // +, -, *, /
      return { kind: "assign", target: left, value: { kind: "binary", op: binOp, left, right } };
    }
    return left;
  }

  function parseOr(): Expr {
    let left = parseAnd();
    while (match(T.Or)) left = { kind: "binary", op: "||", left, right: parseAnd() };
    return left;
  }

  function parseAnd(): Expr {
    let left = parseEquality();
    while (match(T.And)) left = { kind: "binary", op: "&&", left, right: parseEquality() };
    return left;
  }

  function parseEquality(): Expr {
    let left = parseComparison();
    while (at(T.Eq) || at(T.Neq)) {
      const op = advance().value;
      left = { kind: "binary", op, left, right: parseComparison() };
    }
    return left;
  }

  function parseComparison(): Expr {
    let left = parseAddition();
    while (at(T.Lt) || at(T.Gt) || at(T.Lte) || at(T.Gte)) {
      const op = advance().value;
      left = { kind: "binary", op, left, right: parseAddition() };
    }
    return left;
  }

  function parseAddition(): Expr {
    let left = parseMultiplication();
    while (at(T.Plus) || at(T.Minus)) {
      const op = advance().value;
      left = { kind: "binary", op, left, right: parseMultiplication() };
    }
    return left;
  }

  function parseMultiplication(): Expr {
    let left = parseUnary();
    while (at(T.Star) || at(T.Slash) || at(T.Percent)) {
      const op = advance().value;
      left = { kind: "binary", op, left, right: parseUnary() };
    }
    return left;
  }

  function parseUnary(): Expr {
    // Handle unary operators: -, !, &, *
    if (at(T.Minus) || at(T.Not) || at(T.Ampersand) || at(T.Star)) {
      const op = advance().value;
      return { kind: "unary", op, expr: parseUnary() };
    }
    return parsePostfix();
  }

  function parsePostfix(): Expr {
    let expr = parsePrimary();
    while (true) {
      if (match(T.LParen)) {
        const args: Expr[] = [];
        while (!at(T.RParen) && !at(T.EOF)) {
          args.push(parseExpr());
          match(T.Comma);
        }
        expect(T.RParen);
        expr = { kind: "call", callee: expr, args };
      } else if (match(T.LBracket)) {
        const index = parseExpr();
        expect(T.RBracket);
        expr = { kind: "index", object: expr, index };
      } else if (match(T.Dot)) {
        const prop = expect(T.Ident, "Expected property name").value;
        expr = { kind: "member", object: expr, property: prop };
      } else break;
    }
    return expr;
  }

  function parsePrimary(): Expr {
    const t = peek();
    switch (t.type) {
      case T.Number: advance(); return { kind: "number", value: Number(t.value) };
      case T.String: advance(); return { kind: "string", value: t.value };
      case T.Bool: advance(); return { kind: "bool", value: t.value === "true" };
      case T.Null: advance(); return { kind: "null" };
      case T.Ident: {
        advance();
        // Single-param arrow: x => expr
        if (at(T.FatArrow)) {
          advance();
          if (at(T.LBrace)) {
            expect(T.LBrace);
            const body = parseBody();
            expect(T.RBrace);
            return { kind: "fn", name: null, params: [{ name: t.value }], body };
          }
          const expr = parseAssign();
          return { kind: "fn", name: null, params: [{ name: t.value }], body: [{ kind: "return", value: expr }] };
        }
        return { kind: "ident", name: t.value };
      }
      case T.LParen: {
        // Try arrow function: (params) => body
        const savedPos = pos;
        advance(); // (

        // Check for empty parens arrow: () => ...
        if (at(T.RParen)) {
          const rp = pos;
          advance(); // )
          if (at(T.FatArrow)) {
            advance(); // =>
            return parseArrowBody([]);
          }
          // Not arrow, backtrack
          pos = savedPos;
          advance();
          const expr = parseExpr();
          expect(T.RParen);
          return expr;
        }

        // Try parsing as ident list for arrow function
        let isArrow = true;
        const params: Param[] = [];
        const tryPos = pos;
        while (!at(T.RParen) && !at(T.EOF)) {
          if (!at(T.Ident)) { isArrow = false; break; }
          params.push({ name: advance().value });
          if (!at(T.RParen)) {
            if (!match(T.Comma)) { isArrow = false; break; }
          }
        }
        if (isArrow && at(T.RParen)) {
          advance(); // )
          if (at(T.FatArrow)) {
            advance(); // =>
            return parseArrowBody(params);
          }
        }

        // Not arrow, backtrack and parse as grouped expression
        pos = savedPos;
        advance(); // (
        const expr = parseExpr();
        expect(T.RParen);
        return expr;
      }
      case T.LBracket: return parseArrayLiteral();
      case T.LBrace: return parseObjectLiteral();
      case T.Fn: return parseFnExpr();
      case T.If: return parseIfExpr();
      case T.Match: return parseMatchExpr();
      default: throw new Error(`Unexpected token '${t.value}' at line ${t.line}:${t.col}`);
    }
  }

  function parseArrowBody(params: Param[]): Expr {
    if (at(T.LBrace)) {
      expect(T.LBrace);
      const body = parseBody();
      expect(T.RBrace);
      return { kind: "fn", name: null, params, body };
    }
    const expr = parseAssign();
    return { kind: "fn", name: null, params, body: [{ kind: "return", value: expr }] };
  }

  function parseArrayLiteral(): Expr {
    advance(); // [
    const elements: Expr[] = [];
    while (!at(T.RBracket) && !at(T.EOF)) {
      elements.push(parseExpr());
      match(T.Comma);
    }
    expect(T.RBracket);
    return { kind: "array", elements };
  }

  function parseObjectLiteral(): Expr {
    advance(); // {
    const entries: { key: string; value: Expr }[] = [];
    while (!at(T.RBrace) && !at(T.EOF)) {
      const key = expect(T.Ident, "Expected key").value;
      expect(T.Colon);
      const value = parseExpr();
      entries.push({ key, value });
      match(T.Comma);
    }
    expect(T.RBrace);
    return { kind: "object", entries };
  }

  function parseFnExpr(): Expr {
    advance(); // fn
    let name: string | null = null;
    if (at(T.Ident)) name = advance().value;
    expect(T.LParen);
    const params = parseParams();
    expect(T.RParen);
    expect(T.LBrace);
    const body = parseBody();
    expect(T.RBrace);
    return { kind: "fn", name, params, body };
  }

  function parseParams(): Param[] {
    const params: Param[] = [];
    while (!at(T.RParen) && !at(T.EOF)) {
      const paramName = expect(T.Ident, "Expected parameter name").value;
      let typeAnnotation: string | undefined;

      // Parse type annotation if present: name: Type
      if (match(T.Colon)) {
        const typeTokens: string[] = [];
        let depth = 0;
        while (!at(T.Comma) && !at(T.RParen) && !at(T.EOF)) {
          const t = peek();
          if (t.type === T.LBracket) depth++;
          if (t.type === T.RBracket) depth--;
          if (depth < 0 || (depth === 0 && (t.type === T.Comma || t.type === T.RParen))) break;
          typeTokens.push(t.value || (t.type as unknown as string));
          advance();
        }
        typeAnnotation = typeTokens.join("");
      }

      params.push({ name: paramName, typeAnnotation });
      match(T.Comma);
    }
    return params;
  }

  function parseBody(): Stmt[] {
    const stmts: Stmt[] = [];
    while (!at(T.RBrace) && !at(T.EOF)) stmts.push(parseStmt());
    return stmts;
  }

  return parseProgram();
}

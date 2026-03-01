// FreeLang v6: Bytecode Compiler

import { Expr, Stmt, Program, MatchArm } from "./ast";

export enum Op {
  Const, Pop, Dup,
  Add, Sub, Mul, Div, Mod, Neg,
  Eq, Neq, Lt, Gt, Lte, Gte,
  And, Or, Not,
  Jump, JumpIfFalse, JumpIfTrue,
  Load, Store, LoadGlobal, StoreGlobal,
  Call, Return, Builtin,
  NewArray, Index, SetIndex,
  NewObject, GetProp, SetProp,
  NewClosure, LoadFree, StoreFree,
  Print, Println,
  TryBegin, TryEnd, Throw,
  Iter, IterNext, IterDone,
  AddrOf, Deref,  // v5.9.1: Pointer operators
  Halt,
}

export type Value =
  | { tag: "num"; val: number }
  | { tag: "str"; val: string }
  | { tag: "bool"; val: boolean }
  | { tag: "null" }
  | { tag: "array"; val: Value[] }
  | { tag: "object"; val: Map<string, Value> }
  | { tag: "fn"; name: string; arity: number; addr: number; freeVars: Value[] }
  | { tag: "builtin"; name: string }
  | { tag: "iter"; val: Value[]; idx: number }
  | { tag: "ptr"; addr: number; target: Value }; // Pointer type (v5.9.1)

export type Chunk = {
  code: number[];
  constants: Value[];
  lines: number[];
};

type Local = { name: string; depth: number };
type Upvalue = { name: string; isLocal: boolean; index: number };
type CompilerScope = {
  locals: Local[];
  depth: number;
  upvalues: Upvalue[];
};

type LoopInfo = { startAddr: number; breakPatches: number[] };

export function compile(program: Program): Chunk {
  const chunk: Chunk = { code: [], constants: [], lines: [] };
  const scopes: CompilerScope[] = [{ locals: [], depth: 0, upvalues: [] }];
  const globals = new Set<string>();
  const loopStack: LoopInfo[] = [];
  const finallyStack: Stmt[][] = [];

  function emit(op: Op, line = 0) { chunk.code.push(op); chunk.lines.push(line); }
  function emitArg(op: Op, arg: number, line = 0) { emit(op, line); chunk.code.push(arg); chunk.lines.push(line); }
  function addConst(val: Value): number {
    chunk.constants.push(val);
    return chunk.constants.length - 1;
  }
  function currentPos(): number { return chunk.code.length; }
  function patchJump(pos: number) { chunk.code[pos + 1] = currentPos(); }

  function scope(): CompilerScope { return scopes[scopes.length - 1]; }

  function resolveLocal(name: string): number {
    const locals = scope().locals;
    for (let i = locals.length - 1; i >= 0; i--) {
      if (locals[i].name === name) return i;
    }
    return -1;
  }

  function declareLocal(name: string) {
    scope().locals.push({ name, depth: scope().depth });
  }

  function resolveUpvalue(name: string): number {
    if (scopes.length < 2) return -1;
    const s = scope();
    for (let i = 0; i < s.upvalues.length; i++) {
      if (s.upvalues[i].name === name) return i;
    }
    const parent = scopes[scopes.length - 2];
    for (let j = parent.locals.length - 1; j >= 0; j--) {
      if (parent.locals[j].name === name) {
        s.upvalues.push({ name, isLocal: true, index: j });
        return s.upvalues.length - 1;
      }
    }
    for (let j = 0; j < parent.upvalues.length; j++) {
      if (parent.upvalues[j].name === name) {
        s.upvalues.push({ name, isLocal: false, index: j });
        return s.upvalues.length - 1;
      }
    }
    return -1;
  }

  function compileStmts(stmts: Stmt[]) {
    for (const s of stmts) compileStmt(s);
  }

  // Compile statements where the last expr must leave a value on the stack
  function compileStmtsAsExpr(stmts: Stmt[]) {
    for (let i = 0; i < stmts.length; i++) {
      const s = stmts[i];
      const isLast = i === stmts.length - 1;

      if (isLast && s.kind === "expr") {
        // Last statement is an expression: compile it but DON'T pop
        compileExpr(s.expr);
      } else if (isLast && s.kind === "if") {
        // Last statement is an if-statement in expression context
        // Both branches must leave values on the stack
        compileExpr(s.cond);
        const jumpFalse = currentPos(); emitArg(Op.JumpIfFalse, 0);
        compileStmtsAsExpr(s.then);
        if (s.else) {
          const jumpEnd = currentPos(); emitArg(Op.Jump, 0);
          patchJump(jumpFalse);
          compileStmtsAsExpr(s.else);
          patchJump(jumpEnd);
        } else {
          // If-statement without else in expression context: push null as default
          emitArg(Op.Const, addConst({ tag: "null" }));
          const jumpEnd = currentPos(); emitArg(Op.Jump, 0);
          patchJump(jumpFalse);
          patchJump(jumpEnd);
        }
      } else {
        compileStmt(s);
      }
    }
  }

  function compileStmt(s: Stmt) {
    switch (s.kind) {
      case "expr": compileExpr(s.expr); emit(Op.Pop); break;
      case "let": {
        if (scope().depth === 0) {
          globals.add(s.name);
          if (s.init) compileExpr(s.init); else emitArg(Op.Const, addConst({ tag: "null" }));
          emitArg(Op.StoreGlobal, addConst({ tag: "str", val: s.name }));
        } else {
          declareLocal(s.name);
          if (s.init) compileExpr(s.init); else emitArg(Op.Const, addConst({ tag: "null" }));
          // Store the value in the local variable slot
          emitArg(Op.Store, scope().locals.length - 1);
        }
        break;
      }
      case "fn": {
        if (scope().depth === 0) globals.add(s.name);
        else declareLocal(s.name);
        compileFnBody(s.name, s.params, s.body);
        if (scope().depth === 0) {
          emitArg(Op.StoreGlobal, addConst({ tag: "str", val: s.name }));
        }
        break;
      }
      case "return": {
        // Emit any pending finally blocks first
        for (const fb of [...finallyStack].reverse()) {
          compileStmts(fb);
        }
        if (s.value) compileExpr(s.value); else emitArg(Op.Const, addConst({ tag: "null" }));
        emit(Op.Return);
        break;
      }
      case "if": {
        compileExpr(s.cond);
        const jumpFalse = currentPos(); emitArg(Op.JumpIfFalse, 0);
        compileStmts(s.then);
        if (s.else) {
          const jumpEnd = currentPos(); emitArg(Op.Jump, 0);
          patchJump(jumpFalse);
          compileStmts(s.else);
          patchJump(jumpEnd);
        } else {
          patchJump(jumpFalse);
        }
        break;
      }
      case "while": {
        const loop: LoopInfo = { startAddr: currentPos(), breakPatches: [] };
        loopStack.push(loop);
        compileExpr(s.cond);
        const exit = currentPos(); emitArg(Op.JumpIfFalse, 0);
        compileStmts(s.body);
        emitArg(Op.Jump, loop.startAddr);
        patchJump(exit);
        for (const bp of loop.breakPatches) patchJump(bp);
        loopStack.pop();
        break;
      }
      case "for": {
        // Compile iterator expression, store as global __iter_N
        compileExpr(s.iter);
        emit(Op.Iter);
        const iterName = `__iter_${currentPos()}`;
        emitArg(Op.StoreGlobal, addConst({ tag: "str", val: iterName }));
        const loop: LoopInfo = { startAddr: currentPos(), breakPatches: [] };
        loopStack.push(loop);
        // Check done
        emitArg(Op.LoadGlobal, addConst({ tag: "str", val: iterName }));
        emit(Op.IterDone);
        const exit = currentPos(); emitArg(Op.JumpIfTrue, 0);
        // Get next value, store as loop variable
        emitArg(Op.LoadGlobal, addConst({ tag: "str", val: iterName }));
        emit(Op.IterNext);
        emitArg(Op.StoreGlobal, addConst({ tag: "str", val: s.name }));
        compileStmts(s.body);
        emitArg(Op.Jump, loop.startAddr);
        patchJump(exit);
        for (const bp of loop.breakPatches) patchJump(bp);
        loopStack.pop();
        break;
      }
      case "block": {
        scope().depth++;
        compileStmts(s.body);
        const localsToRemove = scope().locals.filter(l => l.depth === scope().depth).length;
        for (let i = 0; i < localsToRemove; i++) { emit(Op.Pop); scope().locals.pop(); }
        scope().depth--;
        break;
      }
      case "break": {
        if (loopStack.length === 0) throw new Error("break outside loop");
        const bp = currentPos(); emitArg(Op.Jump, 0);
        loopStack[loopStack.length - 1].breakPatches.push(bp);
        break;
      }
      case "continue": {
        if (loopStack.length === 0) throw new Error("continue outside loop");
        emitArg(Op.Jump, loopStack[loopStack.length - 1].startAddr);
        break;
      }
      case "print": {
        compileExpr(s.expr);
        emit(s.newline ? Op.Println : Op.Print);
        break;
      }
      case "try": {
        // Push finally block to stack if present
        if (s.finallyBody.length > 0) {
          finallyStack.push(s.finallyBody);
        }

        const tryBegin = currentPos(); emitArg(Op.TryBegin, 0); // catch addr
        compileStmts(s.body);  // return inside here will see finallyStack
        emit(Op.TryEnd);

        // Pop finally block from stack after compiling try body
        if (s.finallyBody.length > 0) {
          finallyStack.pop();
        }

        const jumpFinally = currentPos(); emitArg(Op.Jump, 0);
        // Catch
        patchJump(tryBegin);
        if (s.catchVar) {
          scope().depth++;
          declareLocal(s.catchVar);
          compileStmts(s.catchBody);
          const localsToRemove = scope().locals.filter(l => l.depth === scope().depth).length;
          for (let i = 0; i < localsToRemove; i++) { emit(Op.Pop); scope().locals.pop(); }
          scope().depth--;
        } else {
          emit(Op.Pop); // discard error
          compileStmts(s.catchBody);
        }
        // Finally
        patchJump(jumpFinally);
        compileStmts(s.finallyBody);
        break;
      }
      case "throw": {
        compileExpr(s.expr);
        emit(Op.Throw);
        break;
      }
      case "struct": {
        // Store struct definition as global with type metadata
        globals.add(s.name);

        // Create struct object with field information
        const structVal = new Map<string, Value>();

        // Add each field with null default
        for (const field of s.fields) {
          structVal.set(field.name, { tag: "null" });
        }

        // Store field metadata as JSON
        const fieldMetadata = s.fields.map(f => ({ name: f.name, type: f.type }));
        structVal.set("__fields__", { tag: "str", val: JSON.stringify(fieldMetadata) });
        structVal.set("__struct_name__", { tag: "str", val: s.name });

        emitArg(Op.Const, addConst({ tag: "object", val: structVal }));
        emitArg(Op.StoreGlobal, addConst({ tag: "str", val: s.name }));
        break;
      }
      case "import": break; // handled by module loader
      case "export": compileStmt(s.stmt); break; // compile inner stmt
      case "multi": compileStmts(s.stmts); break;
      case "match": {
        // Compile subject once, store as temp global
        compileExpr(s.subject);
        const tempName = `__match_${currentPos()}`;
        emitArg(Op.StoreGlobal, addConst({ tag: "str", val: tempName }));
        const endPatches: number[] = [];
        for (const arm of s.arms) {
          if (arm.pattern !== null) {
            emitArg(Op.LoadGlobal, addConst({ tag: "str", val: tempName }));
            compileExpr(arm.pattern);
            emit(Op.Eq);
            const skip = currentPos(); emitArg(Op.JumpIfFalse, 0);
            compileStmts(arm.body);
            endPatches.push(currentPos()); emitArg(Op.Jump, 0);
            patchJump(skip);
          } else {
            // Default arm (_)
            compileStmts(arm.body);
          }
        }
        const end = currentPos();
        for (const p of endPatches) patchJump(p);
        break;
      }
      case "if-let": {
        // If let: pattern matching with optional else
        compileExpr(s.value);
        const tempName = `__iflet_${currentPos()}`;
        emitArg(Op.StoreGlobal, addConst({ tag: "str", val: tempName }));

        // Compare value with pattern
        emitArg(Op.LoadGlobal, addConst({ tag: "str", val: tempName }));
        compileExpr(s.pattern);
        emit(Op.Eq);

        const skipBody = currentPos();
        emitArg(Op.JumpIfFalse, 0);

        // Execute body
        compileStmts(s.body);

        const skipElse = currentPos();
        emitArg(Op.Jump, 0);

        // Execute else (if exists)
        patchJump(skipBody);
        if (s.else) {
          compileStmts(s.else);
        }

        patchJump(skipElse);
        break;
      }
      case "while-let": {
        // While let: repeat while pattern matches
        const loopStart = currentPos();

        // Evaluate value
        compileExpr(s.value);
        const tempName = `__whilelet_${currentPos()}`;
        emitArg(Op.StoreGlobal, addConst({ tag: "str", val: tempName }));

        // Try to match pattern
        emitArg(Op.LoadGlobal, addConst({ tag: "str", val: tempName }));
        compileExpr(s.pattern);
        emit(Op.Eq);

        const exit = currentPos();
        emitArg(Op.JumpIfFalse, 0);

        // Execute body
        compileStmts(s.body);

        // Loop back
        emitArg(Op.Jump, loopStart);

        patchJump(exit);
        break;
      }
    }
  }

  function compileFnBody(name: string, params: string[], body: Stmt[]) {
    const jumpOver = currentPos(); emitArg(Op.Jump, 0);
    const fnAddr = currentPos();
    scopes.push({ locals: [], depth: 1, upvalues: [] });
    for (const p of params) declareLocal(p);
    // Compile body as expression: last stmt should leave value on stack
    if (body.length === 0) {
      emitArg(Op.Const, addConst({ tag: "null" }));
    } else {
      compileStmtsAsExpr(body);
    }
    emit(Op.Return);
    const fnScope = scopes.pop()!;
    patchJump(jumpOver);

    if (fnScope.upvalues.length > 0) {
      for (const uv of fnScope.upvalues) {
        if (uv.isLocal) emitArg(Op.Load, uv.index);
        else emitArg(Op.LoadFree, uv.index);
      }
      emitArg(Op.Const, addConst({ tag: "fn", name, arity: params.length, addr: fnAddr, freeVars: [] }));
      emitArg(Op.NewClosure, fnScope.upvalues.length);
    } else {
      emitArg(Op.Const, addConst({ tag: "fn", name, arity: params.length, addr: fnAddr, freeVars: [] }));
    }
  }

  function compileExpr(e: Expr) {
    switch (e.kind) {
      case "number": emitArg(Op.Const, addConst({ tag: "num", val: e.value })); break;
      case "string": emitArg(Op.Const, addConst({ tag: "str", val: e.value })); break;
      case "bool": emitArg(Op.Const, addConst({ tag: "bool", val: e.value })); break;
      case "null": emitArg(Op.Const, addConst({ tag: "null" })); break;
      case "ident": {
        const local = resolveLocal(e.name);
        if (local !== -1) { emitArg(Op.Load, local); break; }
        const upval = resolveUpvalue(e.name);
        if (upval !== -1) { emitArg(Op.LoadFree, upval); break; }
        emitArg(Op.LoadGlobal, addConst({ tag: "str", val: e.name }));
        break;
      }
      case "binary": {
        compileExpr(e.left);
        compileExpr(e.right);
        const ops: Record<string, Op> = {
          "+": Op.Add, "-": Op.Sub, "*": Op.Mul, "/": Op.Div, "%": Op.Mod,
          "==": Op.Eq, "!=": Op.Neq, "<": Op.Lt, ">": Op.Gt, "<=": Op.Lte, ">=": Op.Gte,
          "&&": Op.And, "||": Op.Or,
        };
        emit(ops[e.op]);
        break;
      }
      case "unary": {
        compileExpr(e.expr);
        if (e.op === "-") emit(Op.Neg);
        else if (e.op === "!" || e.op === "not") emit(Op.Not);
        else if (e.op === "&") emit(Op.AddrOf);  // v5.9.1: Address-of operator
        else if (e.op === "*") emit(Op.Deref);   // v5.9.1: Dereference operator
        break;
      }
      case "call": {
        compileExpr(e.callee); // Standard ident resolution: local → upvalue → global
        for (const arg of e.args) compileExpr(arg);
        emitArg(Op.Call, e.args.length);
        break;
      }
      case "assign": {
        compileExpr(e.value);
        if (e.target.kind === "ident") {
          const local = resolveLocal(e.target.name);
          if (local !== -1) { emit(Op.Dup); emitArg(Op.Store, local); }
          else {
            const upval = resolveUpvalue(e.target.name);
            if (upval !== -1) { emit(Op.Dup); emitArg(Op.StoreFree, upval); }
            else { emit(Op.Dup); emitArg(Op.StoreGlobal, addConst({ tag: "str", val: e.target.name })); }
          }
        } else if (e.target.kind === "index") {
          compileExpr(e.target.object);
          compileExpr(e.target.index);
          emit(Op.SetIndex);
        } else if (e.target.kind === "member") {
          compileExpr(e.target.object);
          emitArg(Op.Const, addConst({ tag: "str", val: e.target.property }));
          emit(Op.SetProp);
        }
        break;
      }
      case "array": {
        for (const el of e.elements) compileExpr(el);
        emitArg(Op.NewArray, e.elements.length);
        break;
      }
      case "object": {
        for (const { key, value } of e.entries) {
          emitArg(Op.Const, addConst({ tag: "str", val: key }));
          compileExpr(value);
        }
        emitArg(Op.NewObject, e.entries.length);
        break;
      }
      case "index": {
        compileExpr(e.object);
        compileExpr(e.index);
        emit(Op.Index);
        break;
      }
      case "member": {
        compileExpr(e.object);
        emitArg(Op.GetProp, addConst({ tag: "str", val: e.property }));
        break;
      }
      case "fn": {
        compileFnBody(e.name ?? "<anon>", e.params, e.body);
        break;
      }
      case "ternary": {
        compileExpr(e.cond);
        const jumpFalse = currentPos(); emitArg(Op.JumpIfFalse, 0);
        compileExpr(e.then);
        const jumpEnd = currentPos(); emitArg(Op.Jump, 0);
        patchJump(jumpFalse);
        compileExpr(e.else);
        patchJump(jumpEnd);
        break;
      }
      case "if": {
        // If-expression: if cond { then_block } else { else_block }
        // Both blocks must produce a value on the stack (don't pop last expr)
        compileExpr(e.cond);
        const jumpFalse = currentPos(); emitArg(Op.JumpIfFalse, 0);
        compileStmtsAsExpr(e.then);
        const jumpEnd = currentPos(); emitArg(Op.Jump, 0);
        patchJump(jumpFalse);
        compileStmtsAsExpr(e.else);
        patchJump(jumpEnd);
        break;
      }
      case "match": {
        // Match expression: evaluate subject and match against patterns
        compileExpr(e.subject);
        const tempName = `__match_${currentPos()}`;
        emitArg(Op.StoreGlobal, addConst({ tag: "str", val: tempName }));

        const endPatches: number[] = [];
        for (const arm of e.arms) {
          if (arm.pattern !== null) {
            // Load subject for comparison
            emitArg(Op.LoadGlobal, addConst({ tag: "str", val: tempName }));

            // Compile pattern and compare
            compileExpr(arm.pattern);
            emit(Op.Eq);

            // If guard exists, add it to the condition with AND
            if (arm.guard) {
              compileExpr(arm.guard);
              emit(Op.And);
            }

            const skip = currentPos();
            emitArg(Op.JumpIfFalse, 0);

            // Compile body as expression (preserve last value)
            compileStmtsAsExpr(arm.body);

            endPatches.push(currentPos());
            emitArg(Op.Jump, 0);
            patchJump(skip);
          } else {
            // Wildcard/default arm - always matches
            if (arm.guard) {
              // Even wildcard can have guard
              compileExpr(arm.guard);
              const skip = currentPos();
              emitArg(Op.JumpIfFalse, 0);
              compileStmtsAsExpr(arm.body);
              endPatches.push(currentPos());
              emitArg(Op.Jump, 0);
              patchJump(skip);
            } else {
              // Default case - execute unconditionally
              compileStmtsAsExpr(arm.body);
            }
          }
        }

        // Patch all end jumps
        const end = currentPos();
        for (const p of endPatches) patchJump(p);
        break;
      }
    }
  }

  compileStmts(program.stmts);
  emit(Op.Halt);
  return chunk;
}

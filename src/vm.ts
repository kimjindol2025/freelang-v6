// FreeLang v6: Virtual Machine

import { Op, Value, Chunk } from "./compiler";
import { getBuiltins } from "./stdlib/builtins";
import { JumpTable, OffsetCalculator } from "./jump-table";
import { MemoryAllocator } from "./memory-allocator";

type BuiltinFn = (args: Value[], vm: VM) => Value;
type Frame = { retAddr: number; baseSlot: number; fn: string; upvalues: Value[] };
type TryHandler = { catchAddr: number; stackDepth: number; frameDepth: number };
type LoopContext = {
  addr: number;
  iterationCount: number;
  // Phase 3.8: State snapshot for memory isolation
  stackHeightAtEntry: number;
  globalSnapshotAtEntry: Map<string, Value>;
  localSnapshotAtEntry: Value[];
  stateChanges: { varName: string; before: Value; after: Value }[];
};

export class VM {
  private stack: Value[] = [];
  private globals = new Map<string, Value>();
  private frames: Frame[] = [];
  private tryStack: TryHandler[] = [];
  private ip = 0;
  private output: string[] = [];
  private builtinFns: Record<string, BuiltinFn>;
  // Phase 8: try/catch error handling
  private lastError: Value | null = null;
  private inTryCall = false;
  // Phase 3.7: Safety guard & iteration tracking
  // Phase 3.9: Jump Table & Offset Optimization
  private jumpTable: JumpTable;
  private offsetCalc: OffsetCalculator = new OffsetCalculator();
  // Phase 5.9: Dynamic Memory Allocator
  private memoryAllocator: MemoryAllocator = new MemoryAllocator();

  private traceMode = false;
  private traceLogs: string[] = [];
  private loopStack: LoopContext[] = [];  // Track loop start positions + iteration counts
  private loopDepth = 0;                   // Track nesting depth
  private readonly MAX_SAFE_ITERATIONS = 1_000_000;  // Safety guard limit

  constructor(private chunk: Chunk, initialGlobals?: Map<string, Value>) {
    this.builtinFns = getBuiltins();
    this.jumpTable = new JumpTable(this.loopStack);

    // Register builtins
    for (const name of Object.keys(this.builtinFns)) {
      this.globals.set(name, { tag: "builtin", name });
    }
    // Restore persisted globals (e.g. from REPL)
    if (initialGlobals) {
      for (const [k, v] of initialGlobals) {
        if (!this.globals.has(k)) this.globals.set(k, v);
      }
    }
  }

  getGlobals(): Map<string, Value> { return new Map(this.globals); }

  run(): { output: string[]; result: Value } {
    while (this.ip < this.chunk.code.length) {
      const op = this.chunk.code[this.ip++];
      if (op === Op.Halt) {
        return { output: this.output, result: this.stack.length > 0 ? this.peek() : { tag: "null" } };
      }
      try {
        this.execOp(op);
      } catch (e) {
        // If error was caught by a try handler
        if (e instanceof Error && e.message.startsWith("__FREELANG_ERROR_CAUGHT__")) {
          // Continue from the new IP (which should point to catch handler or finally)
          continue;
        }
        // Re-throw unhandled errors
        throw e;
      }
    }
    return { output: this.output, result: { tag: "null" } };
  }

  // Public API for builtins
  getGlobal(name: string): Value | undefined { return this.globals.get(name); }
  setGlobal(name: string, val: Value) { this.globals.set(name, val); }
  getOutput(): string[] { return this.output; }
  addOutput(s: string) { this.output.push(s); }
  getLastError(): Value | null { return this.lastError; }
  clearLastError() { this.lastError = null; }

  // Phase 5.9: Memory Allocator API for builtins
  getAllocator() { return this.memoryAllocator; }

  // Trace mode for PC debugging
  enableTrace() { this.traceMode = true; this.traceLogs = []; }
  getTraceLogs(): string[] { return this.traceLogs; }

  /** Call a FreeLang fn or builtin Value from within a builtin (HOFs). */
  callValue(callee: Value, args: Value[]): Value {
    if (callee.tag === "builtin") {
      return this.builtinFns[callee.name](args, this);
    }
    if (callee.tag === "fn") {
      const savedIp = this.ip;
      const targetFrameDepth = this.frames.length;

      // Mimic Call opcode: push callee + args, push frame
      this.stack.push(callee);
      for (const a of args) this.stack.push(a);
      this.frames.push({
        retAddr: savedIp,
        baseSlot: this.stack.length - args.length,
        fn: callee.name,
        upvalues: callee.freeVars,
      });
      this.ip = callee.addr;

      // Execute until our frame is popped by Return
      try {
        while (this.frames.length > targetFrameDepth) {
          const op = this.chunk.code[this.ip++];
          this.execOp(op);
        }
      } catch (e) {
        // Re-throw sentinel errors so try_call can catch them
        if (e instanceof Error && e.message === "__FREELANG_ERROR_CAUGHT__") {
          throw e;
        }
        // Re-throw other errors
        throw e;
      }
      // Return handler pushed the result onto the stack and restored ip
      return this.stack.pop()!;
    }
    throw new Error(`Cannot call ${callee.tag}`);
  }

  /** Safe call for try_call builtin - captures errors as Value objects */
  trySafeCall(callee: Value, args: Value[]): { ok: boolean; value?: Value; error?: Value } {
    this.clearLastError();
    this.inTryCall = true;

    try {
      if (callee.tag === "builtin") {
        const retVal = this.builtinFns[callee.name](args, this);
        return { ok: true, value: retVal };
      }
      if (callee.tag === "fn") {
        const retVal = this.callValue(callee, args);
        return { ok: true, value: retVal };
      }
      return { ok: false, error: { tag: "str", val: `Cannot call ${callee.tag}` } };
    } catch (e) {
      // Check if a FreeLang error occurred
      if (e instanceof Error && e.message.startsWith("__FREELANG_ERROR_CAUGHT__")) {
        // Return the last error that was caught
        return { ok: false, error: this.lastError || { tag: "str", val: "Unknown error" } };
      }
      // Otherwise return string error
      return { ok: false, error: { tag: "str", val: String(e) } };
    } finally {
      this.inTryCall = false;
    }
  }

  stringify(v: Value): string {
    switch (v.tag) {
      case "num": return String(v.val);
      case "str": return v.val;
      case "bool": return String(v.val);
      case "null": return "null";
      case "array": return "[" + v.val.map(e => this.stringify(e)).join(", ") + "]";
      case "object": {
        const entries = Array.from(v.val.entries()).map(([k, v2]) => `${k}: ${this.stringify(v2)}`);
        return "{" + entries.join(", ") + "}";
      }
      case "fn": return `<fn ${v.name}>`;
      case "builtin": return `<builtin ${v.name}>`;
      default: return "<unknown>";
    }
  }

  // --- Private internals ---

  private execOp(op: number) {
    switch (op) {
      case Op.Const: this.stack.push(this.chunk.constants[this.chunk.code[this.ip++]]); break;
      case Op.Pop: this.stack.pop(); break;
      case Op.Dup: this.stack.push(this.peek()); break;

      // Arithmetic
      case Op.Add: { const b = this.pop(), a = this.pop(); this.stack.push(this.add(a, b)); break; }
      case Op.Sub: { const b = this.popNum(), a = this.popNum(); this.stack.push(num(a - b)); break; }
      case Op.Mul: { const b = this.popNum(), a = this.popNum(); this.stack.push(num(a * b)); break; }
      case Op.Div: { const b = this.popNum(), a = this.popNum(); if (b === 0) this.runtimeError("Division by zero"); this.stack.push(num(a / b)); break; }
      case Op.Mod: { const b = this.popNum(), a = this.popNum(); this.stack.push(num(a % b)); break; }
      case Op.Neg: this.stack.push(num(-this.popNum())); break;

      // Comparison
      case Op.Eq: { const b = this.pop(), a = this.pop(); this.stack.push(bool(this.valEq(a, b))); break; }
      case Op.Neq: { const b = this.pop(), a = this.pop(); this.stack.push(bool(!this.valEq(a, b))); break; }
      case Op.Lt: { const b = this.popNum(), a = this.popNum(); this.stack.push(bool(a < b)); break; }
      case Op.Gt: { const b = this.popNum(), a = this.popNum(); this.stack.push(bool(a > b)); break; }
      case Op.Lte: { const b = this.popNum(), a = this.popNum(); this.stack.push(bool(a <= b)); break; }
      case Op.Gte: { const b = this.popNum(), a = this.popNum(); this.stack.push(bool(a >= b)); break; }

      // Logic
      case Op.And: { const b = this.pop(), a = this.pop(); this.stack.push(bool(this.truthy(a) && this.truthy(b))); break; }
      case Op.Or: { const b = this.pop(), a = this.pop(); this.stack.push(bool(this.truthy(a) || this.truthy(b))); break; }
      case Op.Not: this.stack.push(bool(!this.truthy(this.pop()))); break;

      // Jump (v3.9: Optimized with Jump Table)
      case Op.Jump: {
        const targetAddr = this.chunk.code[this.ip];
        const offset = this.offsetCalc.calculateOffset(this.ip, targetAddr);

        // Back jump = loop-back condition
        if (offset < 0) {
          // Find or create loop context (direct access for reliability)
          let loopContext = this.loopStack.find(l => l.addr === targetAddr);

          if (!loopContext) {
            // First iteration: capture state snapshot for memory isolation check
            const snapshot = this.captureSnapshot();
            loopContext = {
              addr: targetAddr,
              iterationCount: 0,
              stackHeightAtEntry: snapshot.stackHeight,
              globalSnapshotAtEntry: snapshot.globals,
              localSnapshotAtEntry: snapshot.locals,
              stateChanges: [],
            };
            this.loopStack.push(loopContext);
            this.loopDepth++;
          }

          // Increment iteration count
          loopContext.iterationCount++;

          // Safety guard: panic if exceeded
          if (loopContext.iterationCount > this.MAX_SAFE_ITERATIONS) {
            this.runtimeError(
              `[PANIC] Safety guard triggered at loop PC ${loopContext.addr}. ` +
              `Max iterations (${this.MAX_SAFE_ITERATIONS}) exceeded.`
            );
          }

          if (this.traceMode) {
            const indent = "  ".repeat(this.loopDepth);
            this.traceLogs.push(
              `${indent}[JUMP] PC: ${this.ip} → ${targetAddr} (loop-back, offset: ${offset}) | ` +
              `Iteration: ${loopContext.iterationCount}/${this.MAX_SAFE_ITERATIONS}`
            );
          }
        }

        this.ip = targetAddr;
        break;
      }
      case Op.JumpIfFalse: {
        const addr = this.chunk.code[this.ip++];
        const cond = this.pop();
        const indent = "  ".repeat(this.loopDepth);

        if (!this.truthy(cond)) {
          // Loop condition FALSE = exit loop
          if (this.loopStack.length > 0) {
            const loopContext = this.loopStack[this.loopStack.length - 1];

            // Phase 3.8: Compare final state with entry snapshot
            const finalSnapshot = this.captureSnapshot();
            const comparison = this.compareSnapshots(
              {
                stackHeight: loopContext.stackHeightAtEntry,
                globals: loopContext.globalSnapshotAtEntry,
                locals: loopContext.localSnapshotAtEntry,
              },
              {
                stackHeight: finalSnapshot.stackHeight,
                globals: finalSnapshot.globals,
                locals: finalSnapshot.locals,
              }
            );

            if (this.traceMode) {
              this.traceLogs.push(
                `${indent}[JUMPIF] PC: ${this.ip-1} → ${addr} (condition FALSE, exit loop) | ` +
                `Final iteration count: ${loopContext.iterationCount}`
              );
              this.traceLogs.push(
                `${indent}  └─ Stack balanced: ${comparison.stackBalanced} | ` +
                `Global changes: ${comparison.globalChanges.length} | ` +
                `Local corruption: ${comparison.localChanges}`
              );
              for (const [varName, before, after] of comparison.globalChanges) {
                this.traceLogs.push(
                  `${indent}     ├─ ${varName}: ${this.stringify(before)} → ${this.stringify(after)}`
                );
              }
            }

            // Store state changes for later analysis
            loopContext.stateChanges = comparison.globalChanges.map(([name, before, after]) => ({
              varName: name,
              before,
              after,
            }));

            this.loopStack.pop();
            this.loopDepth--;
            if (this.traceMode) {
              this.traceLogs.push(`${indent}  └─ Loop depth: ${this.loopDepth}`);
            }
          }
          this.ip = addr;
        } else {
          // Loop condition TRUE = continue looping
          if (this.traceMode) {
            this.traceLogs.push(`${indent}[JUMPIF] PC: ${this.ip-1} (condition TRUE, continue loop)`);
          }
        }
        break;
      }
      case Op.JumpIfTrue: { const addr = this.chunk.code[this.ip++]; if (this.truthy(this.pop())) this.ip = addr; break; }

      // Variables
      case Op.Load: { const slot = this.chunk.code[this.ip++]; this.stack.push(this.stack[this.baseSlot() + slot]); break; }
      case Op.Store: { const slot = this.chunk.code[this.ip++]; this.stack[this.baseSlot() + slot] = this.peek(); break; }
      case Op.LoadGlobal: {
        const name = this.chunk.constants[this.chunk.code[this.ip++]] as { tag: "str"; val: string };
        const val = this.globals.get(name.val);
        if (val === undefined) this.runtimeError(`Undefined variable '${name.val}'`);
        this.stack.push(val!);
        break;
      }
      case Op.StoreGlobal: {
        const name = this.chunk.constants[this.chunk.code[this.ip++]] as { tag: "str"; val: string };
        this.globals.set(name.val, this.pop());
        break;
      }

      // Functions
      case Op.Call: {
        const argc = this.chunk.code[this.ip++];
        const callee = this.stack[this.stack.length - 1 - argc];
        if (callee.tag === "fn") {
          this.frames.push({ retAddr: this.ip, baseSlot: this.stack.length - argc, fn: callee.name, upvalues: callee.freeVars });
          this.ip = callee.addr;
        } else if (callee.tag === "builtin") {
          const args = this.stack.splice(this.stack.length - argc, argc);
          this.stack.pop(); // pop callee
          const result = this.builtinFns[callee.name](args, this);
          this.stack.push(result);
        } else {
          this.runtimeError(`Cannot call ${callee.tag}`);
        }
        break;
      }
      case Op.Return: {
        const result = this.pop();
        const frame = this.frames.pop()!;
        this.stack.length = frame.baseSlot - 1; // remove locals + callee
        this.stack.push(result);
        this.ip = frame.retAddr;

        // Safety: clear loop stack when returning from function
        // (loops should not escape function boundaries)
        if (this.frames.length === 0 && this.loopStack.length > 0) {
          this.loopStack = [];
          this.loopDepth = 0;
        }
        break;
      }

      // Array
      case Op.NewArray: {
        const len = this.chunk.code[this.ip++];
        const elements = this.stack.splice(this.stack.length - len, len);
        this.stack.push({ tag: "array", val: elements });
        break;
      }
      case Op.Index: {
        const idx = this.pop();
        const obj = this.pop();
        if (obj.tag === "array" && idx.tag === "num") {
          this.stack.push(obj.val[Math.floor(idx.val)] ?? { tag: "null" });
        } else if (obj.tag === "object" && idx.tag === "str") {
          this.stack.push(obj.val.get(idx.val) ?? { tag: "null" });
        } else if (obj.tag === "str" && idx.tag === "num") {
          const ch = obj.val[Math.floor(idx.val)];
          this.stack.push(ch ? { tag: "str", val: ch } : { tag: "null" });
        } else {
          this.stack.push({ tag: "null" });
        }
        break;
      }
      case Op.SetIndex: {
        const idx = this.pop();
        const obj = this.pop();
        const val = this.pop();
        if (obj.tag === "array" && idx.tag === "num") obj.val[Math.floor(idx.val)] = val;
        else if (obj.tag === "object" && idx.tag === "str") obj.val.set(idx.val, val);
        this.stack.push(val);
        break;
      }

      // Object
      case Op.NewObject: {
        const count = this.chunk.code[this.ip++];
        const map = new Map<string, Value>();
        const items = this.stack.splice(this.stack.length - count * 2, count * 2);
        for (let i = 0; i < items.length; i += 2) {
          map.set((items[i] as { tag: "str"; val: string }).val, items[i + 1]);
        }
        this.stack.push({ tag: "object", val: map });
        break;
      }
      case Op.GetProp: {
        const name = this.chunk.constants[this.chunk.code[this.ip++]] as { tag: "str"; val: string };
        const obj = this.pop();
        if (obj.tag === "object") this.stack.push(obj.val.get(name.val) ?? { tag: "null" });
        else if (obj.tag === "array" && name.val === "length") this.stack.push(num(obj.val.length));
        else if (obj.tag === "str" && name.val === "length") this.stack.push(num(obj.val.length));
        else this.stack.push({ tag: "null" });
        break;
      }
      case Op.SetProp: {
        const propName = this.pop();
        const obj = this.pop();
        const val = this.peek();
        if (obj.tag === "object" && propName.tag === "str") obj.val.set(propName.val, val);
        break;
      }

      // Closures
      case Op.NewClosure: {
        const numFree = this.chunk.code[this.ip++];
        const fnVal = this.pop();
        if (fnVal.tag !== "fn") this.runtimeError("NewClosure expects fn");
        const freeVars: Value[] = new Array(numFree);
        for (let i = numFree - 1; i >= 0; i--) freeVars[i] = this.pop();
        this.stack.push({ tag: "fn", name: fnVal.name, arity: fnVal.arity, addr: fnVal.addr, freeVars });
        break;
      }
      case Op.LoadFree: {
        const idx = this.chunk.code[this.ip++];
        const frame = this.frames[this.frames.length - 1];
        this.stack.push(frame.upvalues[idx]);
        break;
      }
      case Op.StoreFree: {
        const idx = this.chunk.code[this.ip++];
        const frame = this.frames[this.frames.length - 1];
        frame.upvalues[idx] = this.peek();
        break;
      }

      // Print
      case Op.Print: this.output.push(this.stringify(this.pop())); break;
      case Op.Println: this.output.push(this.stringify(this.pop()) + "\n"); break;

      // Try/Catch
      case Op.TryBegin: {
        const catchAddr = this.chunk.code[this.ip++];
        this.tryStack.push({ catchAddr, stackDepth: this.stack.length, frameDepth: this.frames.length });
        break;
      }
      case Op.TryEnd: this.tryStack.pop(); break;
      case Op.Throw: {
        const err = this.pop();
        this.handleError(err);
        break;
      }

      // Iterator
      case Op.Iter: {
        const val = this.pop();
        if (val.tag === "array") this.stack.push({ tag: "iter", val: val.val, idx: 0 });
        else if (val.tag === "str") this.stack.push({ tag: "iter", val: val.val.split("").map(c => ({ tag: "str", val: c } as Value)), idx: 0 });
        else this.runtimeError("Cannot iterate over " + val.tag);
        break;
      }
      case Op.IterNext: {
        const iter = this.pop();
        if (iter.tag === "iter") {
          this.stack.push(iter.val[iter.idx] ?? { tag: "null" });
          iter.idx++;
        } else {
          this.stack.push({ tag: "null" });
        }
        break;
      }
      case Op.IterDone: {
        const iter = this.pop();
        this.stack.push(bool(iter.tag === "iter" && iter.idx >= iter.val.length));
        break;
      }

      // v5.9.1: Pointer operators
      case Op.AddrOf: {
        const val = this.pop();
        // Address-of: create a pointer to the value with its address
        // For simplicity, we use a numeric ID as the address
        const ptrAddr = this.memoryAllocator.allocate(JSON.stringify(val).length);
        if (ptrAddr > 0) {
          this.stack.push({ tag: "ptr", addr: ptrAddr, target: val });
        } else {
          this.runtimeError("Cannot allocate memory for pointer");
        }
        break;
      }
      case Op.Deref: {
        const ptr = this.pop();
        if (ptr.tag === "ptr") {
          // Dereference: extract the target value from the pointer
          this.stack.push(ptr.target);
        } else {
          this.runtimeError(`Cannot dereference non-pointer type ${ptr.tag}`);
        }
        break;
      }

      default: this.runtimeError(`Unknown opcode ${op}`);
    }
  }

  private peek(): Value { return this.stack[this.stack.length - 1]; }
  private pop(): Value { return this.stack.pop()!; }
  private baseSlot(): number { return this.frames.length > 0 ? this.frames[this.frames.length - 1].baseSlot : 0; }

  // Phase 3.8: Memory snapshot for state integrity
  private captureSnapshot(): { stackHeight: number; globals: Map<string, Value>; locals: Value[] } {
    const stackHeight = this.stack.length;
    const globals = new Map(this.globals);
    const locals = this.stack.slice(0, this.baseSlot()).map(v => ({ ...v })); // shallow copy
    return { stackHeight, globals, locals };
  }

  private compareSnapshots(
    before: { stackHeight: number; globals: Map<string, Value>; locals: Value[] },
    after: { stackHeight: number; globals: Map<string, Value>; locals: Value[] }
  ): { stackBalanced: boolean; globalChanges: [string, Value, Value][]; localChanges: boolean } {
    const stackBalanced = before.stackHeight === after.stackHeight;

    // Find global changes
    const globalChanges: [string, Value, Value][] = [];
    for (const [key, beforeVal] of before.globals) {
      const afterVal = after.globals.get(key);
      if (!this.valEq(beforeVal, afterVal || { tag: "null" })) {
        globalChanges.push([key, beforeVal, afterVal || { tag: "null" }]);
      }
    }
    for (const [key] of after.globals) {
      if (!before.globals.has(key)) {
        globalChanges.push([key, { tag: "null" }, after.globals.get(key)!]);
      }
    }

    // Check if locals changed (shouldn't in safe code)
    const localChanges = before.locals.length !== after.locals.length ||
      before.locals.some((v, i) => !this.valEq(v, after.locals[i] || { tag: "null" }));

    return { stackBalanced, globalChanges, localChanges };
  }

  private popNum(): number {
    const v = this.pop();
    if (v.tag !== "num") this.runtimeError(`Expected number, got ${v.tag}`);
    return (v as any).val;
  }

  private add(a: Value, b: Value): Value {
    if (a.tag === "num" && b.tag === "num") return num(a.val + b.val);
    if (a.tag === "str" || b.tag === "str") return { tag: "str", val: this.stringify(a) + this.stringify(b) };
    if (a.tag === "array" && b.tag === "array") return { tag: "array", val: [...a.val, ...b.val] };
    return num(0);
  }

  private valEq(a: Value, b: Value): boolean {
    if (a.tag !== b.tag) return false;
    if (a.tag === "null") return true;
    if (a.tag === "num" || a.tag === "str" || a.tag === "bool") return (a as any).val === (b as any).val;
    return a === b;
  }

  private truthy(v: Value): boolean {
    if (v.tag === "null") return false;
    if (v.tag === "bool") return v.val;
    if (v.tag === "num") return v.val !== 0;
    if (v.tag === "str") return v.val !== "";
    if (v.tag === "array") return v.val.length > 0;
    return true;
  }

  private handleError(err: Value) {
    this.lastError = err;
    if (this.tryStack.length > 0) {
      const handler = this.tryStack.pop()!;
      this.stack.length = handler.stackDepth;
      this.frames.length = handler.frameDepth;
      this.stack.push(err);
      this.ip = handler.catchAddr;
    } else {
      // Throw error which will be caught by caller (trySafeCall, run, etc)
      throw new Error(`__FREELANG_ERROR_CAUGHT__:${this.stringify(err)}`);
    }
  }

  private runtimeError(msg: string): never {
    const err: Value = { tag: "str", val: msg };
    if (this.tryStack.length > 0) {
      this.handleError(err);
      // Throw sentinel that run() loop will catch and handle
      throw new Error("__FREELANG_ERROR_CAUGHT__");
    }
    throw new Error(`Runtime Error: ${msg}`);
  }
}

function num(n: number): Value { return { tag: "num", val: n }; }
function bool(b: boolean): Value { return { tag: "bool", val: b }; }

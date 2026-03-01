// FreeLang v6: File I/O builtins (Phase 3)
// Node.js fs sync API

import { Value } from "../compiler";
import { VM } from "../vm";
import { registerBuiltin } from "./builtins";
import * as fs from "fs";
import * as path from "path";

function num(n: number): Value { return { tag: "num", val: n }; }
function str(s: string): Value { return { tag: "str", val: s }; }
function bool(b: boolean): Value { return { tag: "bool", val: b }; }
function arr(items: Value[]): Value { return { tag: "array", val: items }; }
function strVal(v: Value): string { return v.tag === "str" ? v.val : ""; }
function numVal(v: Value): number { return v.tag === "num" ? v.val : 0; }

function tryOp<T>(fn: () => T, fallback: T): T {
  try { return fn(); } catch { return fallback; }
}

// --- File Read/Write ---

registerBuiltin("file_read", (args) => {
  return tryOp(() => str(fs.readFileSync(strVal(args[0]), "utf-8")), { tag: "null" });
});

registerBuiltin("file_write", (args) => {
  return tryOp(() => { fs.writeFileSync(strVal(args[0]), strVal(args[1]), "utf-8"); return bool(true); }, bool(false));
});

registerBuiltin("file_append", (args) => {
  return tryOp(() => { fs.appendFileSync(strVal(args[0]), strVal(args[1]), "utf-8"); return bool(true); }, bool(false));
});

registerBuiltin("file_read_lines", (args) => {
  return tryOp(() => {
    const lines = fs.readFileSync(strVal(args[0]), "utf-8").split("\n");
    return arr(lines.map(l => str(l)));
  }, arr([]));
});

registerBuiltin("file_write_lines", (args) => {
  if (args[1].tag !== "array") return bool(false);
  return tryOp(() => {
    const lines = args[1].tag === "array" ? args[1].val.map(v => v.tag === "str" ? v.val : String((v as any).val ?? "")).join("\n") : "";
    fs.writeFileSync(strVal(args[0]), lines, "utf-8");
    return bool(true);
  }, bool(false));
});

registerBuiltin("file_read_bytes", (args) => {
  return tryOp(() => {
    const buf = fs.readFileSync(strVal(args[0]));
    return arr(Array.from(buf).map(b => num(b)));
  }, arr([]));
});

registerBuiltin("file_write_bytes", (args) => {
  if (args[1].tag !== "array") return bool(false);
  return tryOp(() => {
    const bytes = args[1].tag === "array" ? Buffer.from(args[1].val.map(v => v.tag === "num" ? v.val : 0)) : Buffer.alloc(0);
    fs.writeFileSync(strVal(args[0]), bytes);
    return bool(true);
  }, bool(false));
});

// --- File Operations ---

registerBuiltin("file_exists", (args) => bool(fs.existsSync(strVal(args[0]))));

registerBuiltin("file_delete", (args) => {
  return tryOp(() => { fs.unlinkSync(strVal(args[0])); return bool(true); }, bool(false));
});

registerBuiltin("file_copy", (args) => {
  return tryOp(() => { fs.copyFileSync(strVal(args[0]), strVal(args[1])); return bool(true); }, bool(false));
});

registerBuiltin("file_move", (args) => {
  return tryOp(() => { fs.renameSync(strVal(args[0]), strVal(args[1])); return bool(true); }, bool(false));
});

registerBuiltin("file_size", (args) => {
  return tryOp(() => num(fs.statSync(strVal(args[0])).size), num(-1));
});

registerBuiltin("file_stat", (args) => {
  return tryOp(() => {
    const s = fs.statSync(strVal(args[0]));
    const map = new Map<string, Value>();
    map.set("size", num(s.size));
    map.set("is_file", bool(s.isFile()));
    map.set("is_dir", bool(s.isDirectory()));
    map.set("created", num(s.birthtimeMs));
    map.set("modified", num(s.mtimeMs));
    map.set("accessed", num(s.atimeMs));
    map.set("mode", num(s.mode));
    return { tag: "object" as const, val: map };
  }, { tag: "null" } as Value);
});

// --- Directory Operations ---

registerBuiltin("dir_create", (args) => {
  return tryOp(() => { fs.mkdirSync(strVal(args[0])); return bool(true); }, bool(false));
});

registerBuiltin("dir_create_all", (args) => {
  return tryOp(() => { fs.mkdirSync(strVal(args[0]), { recursive: true }); return bool(true); }, bool(false));
});

registerBuiltin("dir_list", (args) => {
  return tryOp(() => arr(fs.readdirSync(strVal(args[0])).map(f => str(f))), arr([]));
});

registerBuiltin("dir_exists", (args) => {
  return tryOp(() => fs.statSync(strVal(args[0])).isDirectory(), false) ? bool(true) : bool(false);
});

registerBuiltin("dir_delete", (args) => {
  return tryOp(() => { fs.rmdirSync(strVal(args[0])); return bool(true); }, bool(false));
});

registerBuiltin("dir_delete_all", (args) => {
  return tryOp(() => { fs.rmSync(strVal(args[0]), { recursive: true, force: true }); return bool(true); }, bool(false));
});

// --- Temp ---

registerBuiltin("file_temp_dir", () => str(require("os").tmpdir()));

registerBuiltin("file_temp_file", (args) => {
  const prefix = args.length > 0 ? strVal(args[0]) : "tmp";
  const dir = require("os").tmpdir();
  const name = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const p = path.join(dir, name);
  fs.writeFileSync(p, "");
  return str(p);
});

// --- Glob (simple) ---

registerBuiltin("file_glob", (args) => {
  const dir = strVal(args[0]);
  const pattern = strVal(args[1]);
  return tryOp(() => {
    const files = fs.readdirSync(dir);
    const re = new RegExp("^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
    return arr(files.filter(f => re.test(f)).map(f => str(path.join(dir, f))));
  }, arr([]));
});

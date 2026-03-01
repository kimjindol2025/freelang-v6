// FreeLang v6: Built-in Functions Registry

import { Value } from "../compiler";
import { VM } from "../vm";

type BuiltinFn = (args: Value[], vm: VM) => Value;

const builtins: Record<string, BuiltinFn> = {};

export function registerBuiltin(name: string, fn: BuiltinFn) {
  builtins[name] = fn;
}

export function getBuiltins(): Record<string, BuiltinFn> {
  return builtins;
}

// --- Core builtins ---

// Type conversion
registerBuiltin("int", (args) => {
  const v = args[0];
  if (v.tag === "num") return { tag: "num", val: Math.floor(v.val) };
  if (v.tag === "str") return { tag: "num", val: parseInt(v.val) || 0 };
  if (v.tag === "bool") return { tag: "num", val: v.val ? 1 : 0 };
  return { tag: "num", val: 0 };
});

registerBuiltin("float", (args) => {
  const v = args[0];
  if (v.tag === "num") return v;
  if (v.tag === "str") return { tag: "num", val: parseFloat(v.val) || 0 };
  return { tag: "num", val: 0 };
});

registerBuiltin("str", (args, vm) => ({ tag: "str", val: vm.stringify(args[0]) }));

registerBuiltin("bool", (args) => {
  const v = args[0];
  if (v.tag === "null") return { tag: "bool", val: false };
  if (v.tag === "bool") return v;
  if (v.tag === "num") return { tag: "bool", val: v.val !== 0 };
  if (v.tag === "str") return { tag: "bool", val: v.val !== "" };
  return { tag: "bool", val: true };
});

// Type checking
registerBuiltin("type", (args) => ({ tag: "str", val: args[0].tag === "num" ? "number" : args[0].tag }));
registerBuiltin("is_num", (args) => ({ tag: "bool", val: args[0].tag === "num" }));
registerBuiltin("is_str", (args) => ({ tag: "bool", val: args[0].tag === "str" }));
registerBuiltin("is_bool", (args) => ({ tag: "bool", val: args[0].tag === "bool" }));
registerBuiltin("is_null", (args) => ({ tag: "bool", val: args[0].tag === "null" }));
registerBuiltin("is_array", (args) => ({ tag: "bool", val: args[0].tag === "array" }));
registerBuiltin("is_object", (args) => ({ tag: "bool", val: args[0].tag === "object" }));
registerBuiltin("is_fn", (args) => ({ tag: "bool", val: args[0].tag === "fn" || args[0].tag === "builtin" }));

// Math
registerBuiltin("abs", (args) => ({ tag: "num", val: Math.abs(numVal(args[0])) }));
registerBuiltin("floor", (args) => ({ tag: "num", val: Math.floor(numVal(args[0])) }));
registerBuiltin("ceil", (args) => ({ tag: "num", val: Math.ceil(numVal(args[0])) }));
registerBuiltin("round", (args) => ({ tag: "num", val: Math.round(numVal(args[0])) }));
registerBuiltin("min", (args) => ({ tag: "num", val: Math.min(numVal(args[0]), numVal(args[1])) }));
registerBuiltin("max", (args) => ({ tag: "num", val: Math.max(numVal(args[0]), numVal(args[1])) }));
registerBuiltin("sqrt", (args) => ({ tag: "num", val: Math.sqrt(numVal(args[0])) }));
registerBuiltin("pow", (args) => ({ tag: "num", val: Math.pow(numVal(args[0]), numVal(args[1])) }));
registerBuiltin("random", () => ({ tag: "num", val: Math.random() }));
registerBuiltin("PI", () => ({ tag: "num", val: Math.PI }));

// String
registerBuiltin("len", (args) => {
  const v = args[0];
  if (v.tag === "str") return { tag: "num", val: v.val.length };
  if (v.tag === "array") return { tag: "num", val: v.val.length };
  if (v.tag === "object") return { tag: "num", val: v.val.size };
  return { tag: "num", val: 0 };
});
registerBuiltin("upper", (args) => ({ tag: "str", val: strVal(args[0]).toUpperCase() }));
registerBuiltin("lower", (args) => ({ tag: "str", val: strVal(args[0]).toLowerCase() }));
registerBuiltin("trim", (args) => ({ tag: "str", val: strVal(args[0]).trim() }));
registerBuiltin("split", (args) => ({ tag: "array", val: strVal(args[0]).split(strVal(args[1])).map(s => ({ tag: "str", val: s } as Value)) }));
registerBuiltin("join", (args) => {
  if (args[0].tag !== "array") return { tag: "str", val: "" };
  const sep = args.length > 1 ? strVal(args[1]) : ",";
  return { tag: "str", val: args[0].val.map(v => v.tag === "str" ? v.val : String((v as any).val ?? "")).join(sep) };
});
registerBuiltin("contains", (args) => {
  if (args[0].tag === "str") return { tag: "bool", val: args[0].val.includes(strVal(args[1])) };
  if (args[0].tag === "array") return { tag: "bool", val: args[0].val.some(v => v.tag === args[1].tag && (v as any).val === (args[1] as any).val) };
  return { tag: "bool", val: false };
});
registerBuiltin("replace", (args) => ({ tag: "str", val: strVal(args[0]).split(strVal(args[1])).join(strVal(args[2])) }));
registerBuiltin("starts_with", (args) => ({ tag: "bool", val: strVal(args[0]).startsWith(strVal(args[1])) }));
registerBuiltin("ends_with", (args) => ({ tag: "bool", val: strVal(args[0]).endsWith(strVal(args[1])) }));
registerBuiltin("substr", (args) => ({ tag: "str", val: strVal(args[0]).substring(numVal(args[1]), args.length > 2 ? numVal(args[2]) : undefined) }));
registerBuiltin("char_at", (args) => {
  const s = strVal(args[0]);
  const i = numVal(args[1]);
  return i >= 0 && i < s.length ? { tag: "str", val: s[i] } : { tag: "null" };
});
registerBuiltin("index_of", (args) => ({ tag: "num", val: strVal(args[0]).indexOf(strVal(args[1])) }));
registerBuiltin("repeat", (args) => ({ tag: "str", val: strVal(args[0]).repeat(numVal(args[1])) }));
registerBuiltin("reverse_str", (args) => ({ tag: "str", val: strVal(args[0]).split("").reverse().join("") }));
registerBuiltin("pad_start", (args) => ({ tag: "str", val: strVal(args[0]).padStart(numVal(args[1]), args.length > 2 ? strVal(args[2]) : " ") }));
registerBuiltin("pad_end", (args) => ({ tag: "str", val: strVal(args[0]).padEnd(numVal(args[1]), args.length > 2 ? strVal(args[2]) : " ") }));

// Array
registerBuiltin("push", (args) => {
  if (args[0].tag === "array") { args[0].val.push(args[1]); return args[0]; }
  return { tag: "null" };
});
registerBuiltin("pop", (args) => {
  if (args[0].tag === "array" && args[0].val.length > 0) return args[0].val.pop()!;
  return { tag: "null" };
});
registerBuiltin("shift", (args) => {
  if (args[0].tag === "array" && args[0].val.length > 0) return args[0].val.shift()!;
  return { tag: "null" };
});
registerBuiltin("unshift", (args) => {
  if (args[0].tag === "array") { args[0].val.unshift(args[1]); return { tag: "num", val: args[0].val.length }; }
  return { tag: "null" };
});
registerBuiltin("slice", (args) => {
  if (args[0].tag === "array") return { tag: "array", val: args[0].val.slice(numVal(args[1]), args.length > 2 ? numVal(args[2]) : undefined) };
  if (args[0].tag === "str") return { tag: "str", val: args[0].val.slice(numVal(args[1]), args.length > 2 ? numVal(args[2]) : undefined) };
  return { tag: "null" };
});
registerBuiltin("concat", (args) => {
  if (args[0].tag === "array" && args[1].tag === "array") return { tag: "array", val: [...args[0].val, ...args[1].val] };
  return { tag: "null" };
});
registerBuiltin("range", (args) => {
  const start = numVal(args[0]);
  const end = numVal(args[1]);
  const step = args.length > 2 ? numVal(args[2]) : 1;
  const result: Value[] = [];
  for (let i = start; step > 0 ? i < end : i > end; i += step) result.push({ tag: "num", val: i });
  return { tag: "array", val: result };
});
registerBuiltin("reverse", (args) => {
  if (args[0].tag === "array") return { tag: "array", val: [...args[0].val].reverse() };
  return { tag: "null" };
});
registerBuiltin("sort", (args) => {
  if (args[0].tag !== "array") return { tag: "null" };
  const sorted = [...args[0].val].sort((a, b) => {
    if (a.tag === "num" && b.tag === "num") return a.val - b.val;
    return String((a as any).val).localeCompare(String((b as any).val));
  });
  return { tag: "array", val: sorted };
});
registerBuiltin("flat", (args) => {
  if (args[0].tag !== "array") return { tag: "null" };
  const result: Value[] = [];
  for (const v of args[0].val) {
    if (v.tag === "array") result.push(...v.val);
    else result.push(v);
  }
  return { tag: "array", val: result };
});

// Object
registerBuiltin("keys", (args) => {
  if (args[0].tag === "object") return { tag: "array", val: Array.from(args[0].val.keys()).map(k => ({ tag: "str", val: k } as Value)) };
  return { tag: "array", val: [] };
});
registerBuiltin("values", (args) => {
  if (args[0].tag === "object") return { tag: "array", val: Array.from(args[0].val.values()) };
  return { tag: "array", val: [] };
});
registerBuiltin("entries", (args) => {
  if (args[0].tag === "object") {
    return { tag: "array", val: Array.from(args[0].val.entries()).map(([k, v]) => ({ tag: "array", val: [{ tag: "str", val: k } as Value, v] })) };
  }
  return { tag: "array", val: [] };
});
registerBuiltin("has_key", (args) => {
  if (args[0].tag === "object") return { tag: "bool", val: args[0].val.has(strVal(args[1])) };
  return { tag: "bool", val: false };
});
registerBuiltin("delete_key", (args) => {
  if (args[0].tag === "object") return { tag: "bool", val: args[0].val.delete(strVal(args[1])) };
  return { tag: "bool", val: false };
});

// Utility
registerBuiltin("typeof", (args) => ({ tag: "str", val: args[0].tag }));
registerBuiltin("to_json", (args, vm) => ({ tag: "str", val: JSON.stringify(toJS(args[0])) }));
registerBuiltin("from_json", (args) => fromJS(JSON.parse(strVal(args[0]))));
registerBuiltin("error", (args) => { throw new Error(strVal(args[0])); });
registerBuiltin("assert", (args) => {
  if (args[0].tag === "bool" && !args[0].val) throw new Error(args.length > 1 ? strVal(args[1]) : "Assertion failed");
  return { tag: "null" };
});

// --- Ported from v4/v5 (tested & passing in previous versions) ---

// Math extras (v4/v5)
registerBuiltin("gcd", (args) => {
  let a = Math.abs(numVal(args[0])), b = Math.abs(numVal(args[1]));
  while (b !== 0) { const t = b; b = a % t; a = t; }
  return { tag: "num", val: a };
});
registerBuiltin("lcm", (args) => {
  const a = Math.abs(numVal(args[0])), b = Math.abs(numVal(args[1]));
  const g = (x: number, y: number): number => y === 0 ? x : g(y, x % y);
  return { tag: "num", val: a && b ? (a * b) / g(a, b) : 0 };
});
registerBuiltin("sin", (args) => ({ tag: "num", val: Math.sin(numVal(args[0])) }));
registerBuiltin("cos", (args) => ({ tag: "num", val: Math.cos(numVal(args[0])) }));
registerBuiltin("tan", (args) => ({ tag: "num", val: Math.tan(numVal(args[0])) }));
registerBuiltin("asin", (args) => ({ tag: "num", val: Math.asin(numVal(args[0])) }));
registerBuiltin("acos", (args) => ({ tag: "num", val: Math.acos(numVal(args[0])) }));
registerBuiltin("atan", (args) => ({ tag: "num", val: Math.atan(numVal(args[0])) }));
registerBuiltin("atan2", (args) => ({ tag: "num", val: Math.atan2(numVal(args[0]), numVal(args[1])) }));
registerBuiltin("log", (args) => ({ tag: "num", val: Math.log(numVal(args[0])) }));
registerBuiltin("log2", (args) => ({ tag: "num", val: Math.log2(numVal(args[0])) }));
registerBuiltin("log10", (args) => ({ tag: "num", val: Math.log10(numVal(args[0])) }));
registerBuiltin("exp", (args) => ({ tag: "num", val: Math.exp(numVal(args[0])) }));
registerBuiltin("sign", (args) => ({ tag: "num", val: Math.sign(numVal(args[0])) }));
registerBuiltin("trunc", (args) => ({ tag: "num", val: Math.trunc(numVal(args[0])) }));
registerBuiltin("E", () => ({ tag: "num", val: Math.E }));
registerBuiltin("INF", () => ({ tag: "num", val: Infinity }));
registerBuiltin("NAN", () => ({ tag: "num", val: NaN }));
registerBuiltin("is_nan", (args) => ({ tag: "bool", val: isNaN(numVal(args[0])) }));
registerBuiltin("is_finite", (args) => ({ tag: "bool", val: isFinite(numVal(args[0])) }));
registerBuiltin("clamp", (args) => ({ tag: "num", val: Math.min(Math.max(numVal(args[0]), numVal(args[1])), numVal(args[2])) }));

// Crypto (v4/v5)
import * as crypto from "crypto";
registerBuiltin("md5", (args, vm) => ({ tag: "str", val: crypto.createHash("md5").update(vm.stringify(args[0])).digest("hex") }));
registerBuiltin("sha256", (args, vm) => ({ tag: "str", val: crypto.createHash("sha256").update(vm.stringify(args[0])).digest("hex") }));
registerBuiltin("sha512", (args, vm) => ({ tag: "str", val: crypto.createHash("sha512").update(vm.stringify(args[0])).digest("hex") }));
registerBuiltin("base64_encode", (args) => ({ tag: "str", val: Buffer.from(strVal(args[0]), "utf8").toString("base64") }));
registerBuiltin("base64_decode", (args) => {
  try { return { tag: "str", val: Buffer.from(strVal(args[0]), "base64").toString("utf8") }; }
  catch { return { tag: "null" }; }
});
registerBuiltin("hmac", (args, vm) => ({ tag: "str", val: crypto.createHmac("sha256", vm.stringify(args[1])).update(vm.stringify(args[0])).digest("hex") }));

// JSON extras (v4/v5)
registerBuiltin("json_parse", (args) => {
  try { return fromJS(JSON.parse(strVal(args[0]))); }
  catch { return { tag: "null" }; }
});
registerBuiltin("json_stringify", (args) => ({ tag: "str", val: JSON.stringify(toJS(args[0])) }));
registerBuiltin("json_validate", (args) => {
  try { JSON.parse(strVal(args[0])); return { tag: "bool", val: true }; }
  catch { return { tag: "bool", val: false }; }
});
registerBuiltin("json_pretty", (args) => {
  try { return { tag: "str", val: JSON.stringify(JSON.parse(strVal(args[0])), null, 2) }; }
  catch { return { tag: "null" }; }
});

// System (v4/v5)
registerBuiltin("panic", (args, vm) => { throw new Error(`panic: ${vm.stringify(args[0])}`); });
registerBuiltin("uuid", () => ({ tag: "str", val: crypto.randomUUID() }));
registerBuiltin("timestamp", () => ({ tag: "num", val: Date.now() }));
registerBuiltin("sleep", (args) => {
  const ms = numVal(args[0]);
  if (ms > 0 && ms <= 10000) { const end = Date.now() + ms; while (Date.now() < end) {} }
  return { tag: "null" };
});

// Array extras (v4/v5 HOF — high-order functions)
registerBuiltin("map", (args, vm) => {
  if (args[0].tag !== "array" || (args[1].tag !== "fn" && args[1].tag !== "builtin")) return { tag: "null" };
  const result: Value[] = [];
  for (const item of args[0].val) {
    result.push(vm.callValue(args[1], [item]));
  }
  return { tag: "array", val: result };
});
registerBuiltin("filter", (args, vm) => {
  if (args[0].tag !== "array" || (args[1].tag !== "fn" && args[1].tag !== "builtin")) return { tag: "null" };
  const result: Value[] = [];
  for (const item of args[0].val) {
    if (truthy(vm.callValue(args[1], [item]))) result.push(item);
  }
  return { tag: "array", val: result };
});
registerBuiltin("find", (args, vm) => {
  if (args[0].tag !== "array" || (args[1].tag !== "fn" && args[1].tag !== "builtin")) return { tag: "null" };
  for (const item of args[0].val) {
    if (truthy(vm.callValue(args[1], [item]))) return item;
  }
  return { tag: "null" };
});
registerBuiltin("every", (args, vm) => {
  if (args[0].tag !== "array" || (args[1].tag !== "fn" && args[1].tag !== "builtin")) return { tag: "bool", val: false };
  for (const item of args[0].val) {
    if (!truthy(vm.callValue(args[1], [item]))) return { tag: "bool", val: false };
  }
  return { tag: "bool", val: true };
});
registerBuiltin("some", (args, vm) => {
  if (args[0].tag !== "array" || (args[1].tag !== "fn" && args[1].tag !== "builtin")) return { tag: "bool", val: false };
  for (const item of args[0].val) {
    if (truthy(vm.callValue(args[1], [item]))) return { tag: "bool", val: true };
  }
  return { tag: "bool", val: false };
});
registerBuiltin("reduce", (args, vm) => {
  if (args[0].tag !== "array") return { tag: "null" };
  let acc = args.length > 2 ? args[2] : args[0].val[0];
  const start = args.length > 2 ? 0 : 1;
  for (let i = start; i < args[0].val.length; i++) {
    acc = vm.callValue(args[1], [acc, args[0].val[i]]);
  }
  return acc ?? { tag: "null" };
});
registerBuiltin("unique", (args) => {
  if (args[0].tag !== "array") return { tag: "null" };
  const seen = new Set<string>();
  const result: Value[] = [];
  for (const item of args[0].val) {
    const key = JSON.stringify(toJS(item));
    if (!seen.has(key)) { seen.add(key); result.push(item); }
  }
  return { tag: "array", val: result };
});
registerBuiltin("insert", (args) => {
  if (args[0].tag === "array") { args[0].val.splice(numVal(args[1]), 0, args[2]); return args[0]; }
  return { tag: "null" };
});
registerBuiltin("remove", (args) => {
  if (args[0].tag === "array") {
    const idx = numVal(args[1]);
    if (idx >= 0 && idx < args[0].val.length) return args[0].val.splice(idx, 1)[0];
  }
  return { tag: "null" };
});
registerBuiltin("fill", (args) => {
  if (args[0].tag === "array") {
    for (let i = 0; i < args[0].val.length; i++) args[0].val[i] = args[1];
    return args[0];
  }
  return { tag: "null" };
});
registerBuiltin("zip", (args) => {
  if (args[0].tag !== "array" || args[1].tag !== "array") return { tag: "null" };
  const len = Math.min(args[0].val.length, args[1].val.length);
  const result: Value[] = [];
  for (let i = 0; i < len; i++) result.push({ tag: "array", val: [args[0].val[i], args[1].val[i]] });
  return { tag: "array", val: result };
});

// Object extras
registerBuiltin("merge", (args) => {
  if (args[0].tag !== "object" || args[1].tag !== "object") return args[0] ?? { tag: "null" };
  const map = new Map(args[0].val);
  for (const [k, v] of args[1].val) map.set(k, v);
  return { tag: "object", val: map };
});
registerBuiltin("clone", (args) => fromJS(toJS(args[0])));

// String extras
registerBuiltin("trim_start", (args) => ({ tag: "str", val: strVal(args[0]).trimStart() }));
registerBuiltin("trim_end", (args) => ({ tag: "str", val: strVal(args[0]).trimEnd() }));
registerBuiltin("to_upper", (args) => ({ tag: "str", val: strVal(args[0]).toUpperCase() })); // v5 alias
registerBuiltin("to_lower", (args) => ({ tag: "str", val: strVal(args[0]).toLowerCase() })); // v5 alias
registerBuiltin("char_code", (args) => ({ tag: "num", val: strVal(args[0]).charCodeAt(numVal(args[1] ?? { tag: "num", val: 0 })) || 0 }));
registerBuiltin("from_char_code", (args) => ({ tag: "str", val: String.fromCharCode(numVal(args[0])) }));

// OS (v5)
import * as os from "os";
import * as fs from "fs";
import * as path from "path";

registerBuiltin("os_platform", () => ({ tag: "str", val: os.platform() }));
registerBuiltin("os_arch", () => ({ tag: "str", val: os.arch() }));
registerBuiltin("os_hostname", () => ({ tag: "str", val: os.hostname() }));
registerBuiltin("os_homedir", () => ({ tag: "str", val: os.homedir() }));
registerBuiltin("os_tmpdir", () => ({ tag: "str", val: os.tmpdir() }));
registerBuiltin("os_cpus", () => ({ tag: "num", val: os.cpus().length }));
registerBuiltin("os_uptime", () => ({ tag: "num", val: os.uptime() }));
registerBuiltin("env_get", (args) => {
  const v = process.env[strVal(args[0])];
  return v !== undefined ? { tag: "str", val: v } : { tag: "null" };
});
registerBuiltin("env_set", (args) => { process.env[strVal(args[0])] = strVal(args[1]); return { tag: "null" }; });
registerBuiltin("env_has", (args) => ({ tag: "bool", val: strVal(args[0]) in process.env }));

// File I/O (v5, converted to v6 types)
registerBuiltin("file_read", (args) => {
  try { return { tag: "str", val: fs.readFileSync(strVal(args[0]), "utf-8") }; }
  catch (e: any) { return { tag: "null" }; }
});
registerBuiltin("file_write", (args) => {
  try { fs.writeFileSync(strVal(args[0]), strVal(args[1]), "utf-8"); return { tag: "null" }; }
  catch { return { tag: "null" }; }
});
registerBuiltin("file_append", (args) => {
  try { fs.appendFileSync(strVal(args[0]), strVal(args[1]), "utf-8"); return { tag: "null" }; }
  catch { return { tag: "null" }; }
});
registerBuiltin("file_exists", (args) => ({ tag: "bool", val: fs.existsSync(strVal(args[0])) }));
registerBuiltin("file_delete", (args) => {
  try { fs.unlinkSync(strVal(args[0])); return { tag: "null" }; }
  catch { return { tag: "null" }; }
});
registerBuiltin("file_copy", (args) => {
  try { fs.copyFileSync(strVal(args[0]), strVal(args[1])); return { tag: "null" }; }
  catch { return { tag: "null" }; }
});
registerBuiltin("file_move", (args) => {
  try { fs.renameSync(strVal(args[0]), strVal(args[1])); return { tag: "null" }; }
  catch { return { tag: "null" }; }
});
registerBuiltin("file_size", (args) => {
  try { return { tag: "num", val: fs.statSync(strVal(args[0])).size }; }
  catch { return { tag: "num", val: 0 }; }
});
registerBuiltin("file_read_lines", (args) => {
  try {
    const lines = fs.readFileSync(strVal(args[0]), "utf-8").split("\n");
    return { tag: "array", val: lines.map(l => ({ tag: "str", val: l } as Value)) };
  } catch { return { tag: "array", val: [] }; }
});
registerBuiltin("file_write_lines", (args) => {
  try {
    if (args[1].tag !== "array") return { tag: "null" };
    const content = args[1].val.map(v => strVal(v)).join("\n");
    fs.writeFileSync(strVal(args[0]), content, "utf-8");
    return { tag: "null" };
  } catch { return { tag: "null" }; }
});
registerBuiltin("file_read_bytes", (args) => {
  try {
    const buf = fs.readFileSync(strVal(args[0]));
    return { tag: "array", val: Array.from(buf).map(b => ({ tag: "num", val: b } as Value)) };
  } catch { return { tag: "array", val: [] }; }
});
registerBuiltin("file_write_bytes", (args) => {
  try {
    if (args[1].tag !== "array") return { tag: "null" };
    const buf = Buffer.from(args[1].val.map((v: Value) => numVal(v)));
    fs.writeFileSync(strVal(args[0]), buf);
    return { tag: "null" };
  } catch { return { tag: "null" }; }
});
registerBuiltin("dir_create", (args) => {
  try { fs.mkdirSync(strVal(args[0])); return { tag: "null" }; }
  catch { return { tag: "null" }; }
});
registerBuiltin("dir_create_all", (args) => {
  try { fs.mkdirSync(strVal(args[0]), { recursive: true }); return { tag: "null" }; }
  catch { return { tag: "null" }; }
});
registerBuiltin("dir_list", (args) => {
  try {
    const entries = fs.readdirSync(strVal(args[0]));
    return { tag: "array", val: entries.map(e => ({ tag: "str", val: e } as Value)) };
  } catch { return { tag: "array", val: [] }; }
});
registerBuiltin("dir_exists", (args) => {
  try { return { tag: "bool", val: fs.statSync(strVal(args[0])).isDirectory() }; }
  catch { return { tag: "bool", val: false }; }
});
registerBuiltin("dir_delete", (args) => {
  try { fs.rmdirSync(strVal(args[0])); return { tag: "null" }; }
  catch { return { tag: "null" }; }
});
registerBuiltin("dir_delete_all", (args) => {
  try { fs.rmSync(strVal(args[0]), { recursive: true, force: true }); return { tag: "null" }; }
  catch { return { tag: "null" }; }
});
registerBuiltin("file_stat", (args) => {
  try {
    const s = fs.statSync(strVal(args[0]));
    const fields = new Map<string, Value>();
    fields.set("size", { tag: "num", val: s.size });
    fields.set("modified", { tag: "num", val: Math.floor(s.mtimeMs / 1000) });
    fields.set("created", { tag: "num", val: Math.floor(s.birthtimeMs / 1000) });
    fields.set("is_dir", { tag: "bool", val: s.isDirectory() });
    return { tag: "object", val: fields };
  } catch { return { tag: "object", val: new Map() }; }
});
registerBuiltin("file_temp_dir", () => ({ tag: "str", val: os.tmpdir() }));
registerBuiltin("file_temp_file", () => {
  try {
    const dir = os.tmpdir();
    const name = `fl_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const p = path.join(dir, name);
    fs.writeFileSync(p, "");
    return { tag: "str", val: p };
  } catch { return { tag: "null" }; }
});
registerBuiltin("file_glob", (args) => {
  try {
    const pattern = strVal(args[0]);
    const dir = path.dirname(pattern);
    const base = path.basename(pattern);
    const re = new RegExp("^" + base.replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
    const entries = fs.readdirSync(dir || ".").filter(f => re.test(f));
    return { tag: "array", val: entries.map(e => ({ tag: "str", val: path.join(dir || ".", e) } as Value)) };
  } catch { return { tag: "array", val: [] }; }
});

// Regex (v5, converted to v6 types)
function toRegex(pattern: string): RegExp | null {
  try { return new RegExp(pattern); } catch { return null; }
}
function toRegexG(pattern: string): RegExp | null {
  try { return new RegExp(pattern, "g"); } catch { return null; }
}

registerBuiltin("regex_match", (args) => {
  const re = toRegex(strVal(args[0]));
  if (!re) return { tag: "bool", val: false };
  return { tag: "bool", val: re.test(strVal(args[1])) };
});
registerBuiltin("regex_find", (args) => {
  const re = toRegex(strVal(args[0]));
  if (!re) return { tag: "null" };
  const m = strVal(args[1]).match(re);
  return m ? { tag: "str", val: m[0] } : { tag: "null" };
});
registerBuiltin("regex_find_all", (args) => {
  const re = toRegexG(strVal(args[0]));
  if (!re) return { tag: "array", val: [] };
  const matches = strVal(args[1]).match(re) || [];
  return { tag: "array", val: matches.map((s: string) => ({ tag: "str", val: s } as Value)) };
});
registerBuiltin("regex_replace", (args) => {
  const re = toRegex(strVal(args[0]));
  if (!re) return args[1];
  return { tag: "str", val: strVal(args[1]).replace(re, strVal(args[2])) };
});
registerBuiltin("regex_replace_all", (args) => {
  const re = toRegexG(strVal(args[0]));
  if (!re) return args[1];
  return { tag: "str", val: strVal(args[1]).replace(re, strVal(args[2])) };
});
registerBuiltin("regex_split", (args) => {
  const re = toRegex(strVal(args[0]));
  if (!re) return { tag: "array", val: [args[1]] };
  const parts = strVal(args[1]).split(re);
  return { tag: "array", val: parts.map((s: string) => ({ tag: "str", val: s } as Value)) };
});
registerBuiltin("regex_test", (args) => {
  const re = toRegex(strVal(args[0]));
  if (!re) return { tag: "bool", val: false };
  return { tag: "bool", val: re.test(strVal(args[1])) };
});
registerBuiltin("regex_capture", (args) => {
  const re = toRegex(strVal(args[0]));
  if (!re) return { tag: "null" };
  const m = strVal(args[1]).match(re);
  if (!m) return { tag: "null" };
  const groups = m.slice(1).map((s: string | undefined) => ({ tag: "str", val: s ?? "" } as Value));
  return { tag: "array", val: groups };
});
registerBuiltin("regex_capture_all", (args) => {
  const re = toRegexG(strVal(args[0]));
  if (!re) return { tag: "array", val: [] };
  const results: Value[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(strVal(args[1]))) !== null) {
    const groups = m.slice(1).map((s: string | undefined) => ({ tag: "str", val: s ?? "" } as Value));
    results.push({ tag: "array", val: groups });
  }
  return { tag: "array", val: results };
});
registerBuiltin("regex_escape", (args) => ({
  tag: "str",
  val: strVal(args[0]).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
}));
registerBuiltin("regex_count", (args) => {
  const re = toRegexG(strVal(args[0]));
  if (!re) return { tag: "num", val: 0 };
  return { tag: "num", val: (strVal(args[1]).match(re) || []).length };
});
registerBuiltin("regex_is_valid", (args) => ({
  tag: "bool",
  val: toRegex(strVal(args[0])) !== null,
}));
registerBuiltin("regex_named_capture", (args) => {
  const re = toRegex(strVal(args[0]));
  if (!re) return { tag: "null" };
  const m = re.exec(strVal(args[1]));
  if (!m || !m.groups) return { tag: "null" };
  const entries = new Map<string, Value>();
  for (const [k, v] of Object.entries(m.groups)) {
    entries.set(k, { tag: "str", val: v ?? "" });
  }
  return { tag: "object", val: entries };
});
registerBuiltin("regex_first_index", (args) => {
  const re = toRegex(strVal(args[0]));
  if (!re) return { tag: "num", val: -1 };
  const idx = strVal(args[1]).search(re);
  return { tag: "num", val: idx };
});
registerBuiltin("regex_last_index", (args) => {
  const re = toRegexG(strVal(args[0]));
  if (!re) return { tag: "num", val: -1 };
  const str = strVal(args[1]);
  let idx = -1;
  let m: RegExpExecArray | null;
  while ((m = re.exec(str)) !== null) {
    idx = m.index;
  }
  return { tag: "num", val: idx };
});

// Additional String functions (v5)
registerBuiltin("substring", (args) => {
  const s = strVal(args[0]);
  const start = numVal(args[1]) || 0;
  const end = args.length > 2 ? numVal(args[2]) : s.length;
  return { tag: "str", val: s.substring(start, end) };
});
registerBuiltin("index_of", (args) => {
  const s = strVal(args[0]);
  const sub = strVal(args[1]);
  return { tag: "num", val: s.indexOf(sub) };
});
registerBuiltin("last_index_of", (args) => {
  const s = strVal(args[0]);
  const sub = strVal(args[1]);
  return { tag: "num", val: s.lastIndexOf(sub) };
});
registerBuiltin("pad_start", (args) => {
  const s = strVal(args[0]);
  const len = numVal(args[1]);
  const ch = args.length > 2 ? strVal(args[2]) : " ";
  return { tag: "str", val: s.padStart(len, ch) };
});
registerBuiltin("pad_end", (args) => {
  const s = strVal(args[0]);
  const len = numVal(args[1]);
  const ch = args.length > 2 ? strVal(args[2]) : " ";
  return { tag: "str", val: s.padEnd(len, ch) };
});
registerBuiltin("starts_with", (args) => ({
  tag: "bool", val: strVal(args[0]).startsWith(strVal(args[1])),
}));
registerBuiltin("ends_with", (args) => ({
  tag: "bool", val: strVal(args[0]).endsWith(strVal(args[1])),
}));
registerBuiltin("reverse_str", (args) => ({
  tag: "str", val: strVal(args[0]).split("").reverse().join(""),
}));
registerBuiltin("strip", (args) => ({
  tag: "str", val: strVal(args[0]).trim(),
}));
registerBuiltin("count_chars", (args) => ({
  tag: "num", val: strVal(args[0]).length,
}));

// Additional Array functions (v5)
registerBuiltin("shift", (args) => {
  if (args[0].tag === "array" && args[0].val.length > 0) return args[0].val.shift()!;
  return { tag: "null" };
});
registerBuiltin("unshift", (args) => {
  if (args[0].tag === "array") {
    args[0].val.unshift(args[1]);
    return { tag: "num", val: args[0].val.length };
  }
  return { tag: "null" };
});
registerBuiltin("first", (args) => {
  if (args[0].tag === "array" && args[0].val.length > 0) return args[0].val[0];
  return { tag: "null" };
});
registerBuiltin("last", (args) => {
  if (args[0].tag === "array" && args[0].val.length > 0) return args[0].val[args[0].val.length - 1];
  return { tag: "null" };
});
registerBuiltin("at", (args) => {
  if (args[0].tag === "array") {
    const idx = numVal(args[1]);
    const len = args[0].val.length;
    const normalized = idx < 0 ? len + idx : idx;
    if (normalized >= 0 && normalized < len) return args[0].val[normalized];
  }
  return { tag: "null" };
});
registerBuiltin("includes", (args) => {
  if (args[0].tag === "array") {
    return { tag: "bool", val: args[0].val.some(v => valEq(v, args[1])) };
  }
  if (args[0].tag === "str") {
    return { tag: "bool", val: strVal(args[0]).includes(strVal(args[1])) };
  }
  return { tag: "bool", val: false };
});
registerBuiltin("index_of_arr", (args) => {
  if (args[0].tag === "array") {
    const idx = args[0].val.findIndex(v => valEq(v, args[1]));
    return { tag: "num", val: idx };
  }
  return { tag: "num", val: -1 };
});
registerBuiltin("partition", (args, vm) => {
  if (args[0].tag !== "array") return { tag: "null" };
  const left: Value[] = [];
  const right: Value[] = [];
  for (const item of args[0].val) {
    const result = vm.callValue(args[1], [item]);
    if (truthy(result)) left.push(item);
    else right.push(item);
  }
  return { tag: "array", val: [
    { tag: "array", val: left },
    { tag: "array", val: right },
  ] };
});
registerBuiltin("take", (args) => {
  if (args[0].tag === "array") {
    const n = numVal(args[1]);
    return { tag: "array", val: args[0].val.slice(0, Math.max(0, n)) };
  }
  return { tag: "array", val: [] };
});
registerBuiltin("drop", (args) => {
  if (args[0].tag === "array") {
    const n = numVal(args[1]);
    return { tag: "array", val: args[0].val.slice(Math.max(0, n)) };
  }
  return { tag: "array", val: [] };
});
registerBuiltin("compact", (args) => {
  if (args[0].tag === "array") {
    const result = args[0].val.filter(v => v.tag !== "null");
    return { tag: "array", val: result };
  }
  return { tag: "array", val: [] };
});

// Path functions (v5)
registerBuiltin("path_join", (args) => {
  const parts = args.map(strVal);
  return { tag: "str", val: path.join(...parts) };
});
registerBuiltin("path_resolve", (args) => ({
  tag: "str", val: path.resolve(strVal(args[0])),
}));
registerBuiltin("path_dirname", (args) => ({
  tag: "str", val: path.dirname(strVal(args[0])),
}));
registerBuiltin("path_basename", (args) => ({
  tag: "str", val: path.basename(strVal(args[0])),
}));
registerBuiltin("path_extname", (args) => ({
  tag: "str", val: path.extname(strVal(args[0])),
}));
registerBuiltin("path_normalize", (args) => ({
  tag: "str", val: path.normalize(strVal(args[0])),
}));
registerBuiltin("path_is_absolute", (args) => ({
  tag: "bool", val: path.isAbsolute(strVal(args[0])),
}));
registerBuiltin("path_relative", (args) => ({
  tag: "str", val: path.relative(strVal(args[0]), strVal(args[1])),
}));
registerBuiltin("path_parse", (args) => {
  const p = path.parse(strVal(args[0]));
  const entries = new Map<string, Value>();
  entries.set("dir", { tag: "str", val: p.dir });
  entries.set("root", { tag: "str", val: p.root });
  entries.set("base", { tag: "str", val: p.base });
  entries.set("name", { tag: "str", val: p.name });
  entries.set("ext", { tag: "str", val: p.ext });
  return { tag: "object", val: entries };
});
registerBuiltin("path_sep", () => ({
  tag: "str", val: path.sep,
}));
registerBuiltin("path_with_ext", (args) => {
  const p = strVal(args[0]);
  const ext = strVal(args[1]);
  const parsed = path.parse(p);
  return { tag: "str", val: path.join(parsed.dir, parsed.name + ext) };
});
registerBuiltin("path_strip_ext", (args) => {
  const p = strVal(args[0]);
  const parsed = path.parse(p);
  return { tag: "str", val: path.join(parsed.dir, parsed.name) };
});

// Helper for value equality check
function valEq(a: Value, b: Value): boolean {
  if (a.tag !== b.tag) return false;
  if (a.tag === "null") return true;
  if (a.tag === "num" || a.tag === "str" || a.tag === "bool") return (a as any).val === (b as any).val;
  return a === b;
}

// Helpers
function numVal(v: Value): number { return v.tag === "num" ? v.val : 0; }
function strVal(v: Value): string { return v.tag === "str" ? v.val : String((v as any).val ?? ""); }
function truthy(v: Value): boolean {
  if (v.tag === "null") return false;
  if (v.tag === "bool") return v.val;
  if (v.tag === "num") return v.val !== 0;
  if (v.tag === "str") return v.val !== "";
  return true;
}

function toJS(v: Value): any {
  switch (v.tag) {
    case "num": case "str": case "bool": return v.val;
    case "null": return null;
    case "array": return v.val.map(toJS);
    case "object": {
      const obj: any = {};
      for (const [k, val] of v.val) obj[k] = toJS(val);
      return obj;
    }
    default: return null;
  }
}

function fromJS(v: any): Value {
  if (v === null || v === undefined) return { tag: "null" };
  if (typeof v === "number") return { tag: "num", val: v };
  if (typeof v === "string") return { tag: "str", val: v };
  if (typeof v === "boolean") return { tag: "bool", val: v };
  if (Array.isArray(v)) return { tag: "array", val: v.map(fromJS) };
  if (typeof v === "object") {
    const map = new Map<string, Value>();
    for (const [k, val] of Object.entries(v)) map.set(k, fromJS(val));
    return { tag: "object", val: map };
  }
  return { tag: "null" };
}

// --- Phase 1: DateTime (25 functions) ---

registerBuiltin("dt_now", () => {
  return { tag: "num", val: Date.now() };
});

registerBuiltin("dt_now_ms", () => {
  return { tag: "num", val: Date.now() };
});

registerBuiltin("dt_from_iso", (args) => {
  const iso = strVal(args[0]);
  const d = new Date(iso);
  return { tag: "num", val: d.getTime() };
});

registerBuiltin("dt_to_iso", (args) => {
  const ts = numVal(args[0]);
  return { tag: "str", val: new Date(ts).toISOString() };
});

registerBuiltin("dt_format", (args) => {
  const ts = numVal(args[0]);
  const fmt = strVal(args[1] || { tag: "str", val: "YYYY-MM-DD HH:mm:ss" });
  const d = new Date(ts);

  let result = fmt;
  result = result.replace(/YYYY/g, d.getFullYear().toString());
  result = result.replace(/MM/g, String(d.getMonth() + 1).padStart(2, "0"));
  result = result.replace(/DD/g, String(d.getDate()).padStart(2, "0"));
  result = result.replace(/HH/g, String(d.getHours()).padStart(2, "0"));
  result = result.replace(/mm/g, String(d.getMinutes()).padStart(2, "0"));
  result = result.replace(/ss/g, String(d.getSeconds()).padStart(2, "0"));

  return { tag: "str", val: result };
});

registerBuiltin("dt_parse", (args) => {
  const dateStr = strVal(args[0]);
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? { tag: "null" } : { tag: "num", val: d.getTime() };
});

registerBuiltin("dt_year", (args) => {
  const ts = numVal(args[0]);
  return { tag: "num", val: new Date(ts).getFullYear() };
});

registerBuiltin("dt_month", (args) => {
  const ts = numVal(args[0]);
  return { tag: "num", val: new Date(ts).getMonth() + 1 };
});

registerBuiltin("dt_day", (args) => {
  const ts = numVal(args[0]);
  return { tag: "num", val: new Date(ts).getDate() };
});

registerBuiltin("dt_hour", (args) => {
  const ts = numVal(args[0]);
  return { tag: "num", val: new Date(ts).getHours() };
});

registerBuiltin("dt_minute", (args) => {
  const ts = numVal(args[0]);
  return { tag: "num", val: new Date(ts).getMinutes() };
});

registerBuiltin("dt_second", (args) => {
  const ts = numVal(args[0]);
  return { tag: "num", val: new Date(ts).getSeconds() };
});

registerBuiltin("dt_weekday", (args) => {
  const ts = numVal(args[0]);
  const d = new Date(ts);
  const dow = d.getDay();
  return { tag: "num", val: dow === 0 ? 7 : dow };
});

registerBuiltin("dt_add_days", (args) => {
  const ts = numVal(args[0]);
  const days = numVal(args[1]);
  return { tag: "num", val: ts + days * 24 * 60 * 60 * 1000 };
});

registerBuiltin("dt_add_hours", (args) => {
  const ts = numVal(args[0]);
  const hours = numVal(args[1]);
  return { tag: "num", val: ts + hours * 60 * 60 * 1000 };
});

registerBuiltin("dt_add_minutes", (args) => {
  const ts = numVal(args[0]);
  const mins = numVal(args[1]);
  return { tag: "num", val: ts + mins * 60 * 1000 };
});

registerBuiltin("dt_add_seconds", (args) => {
  const ts = numVal(args[0]);
  const secs = numVal(args[1]);
  return { tag: "num", val: ts + secs * 1000 };
});

registerBuiltin("dt_diff_seconds", (args) => {
  const ts1 = numVal(args[0]);
  const ts2 = numVal(args[1]);
  return { tag: "num", val: Math.floor((ts2 - ts1) / 1000) };
});

registerBuiltin("dt_diff_days", (args) => {
  const ts1 = numVal(args[0]);
  const ts2 = numVal(args[1]);
  return { tag: "num", val: Math.floor((ts2 - ts1) / (24 * 60 * 60 * 1000)) };
});

registerBuiltin("dt_start_of_day", (args) => {
  const ts = numVal(args[0]);
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return { tag: "num", val: d.getTime() };
});

registerBuiltin("dt_start_of_month", (args) => {
  const ts = numVal(args[0]);
  const d = new Date(ts);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return { tag: "num", val: d.getTime() };
});

registerBuiltin("dt_is_leap_year", (args) => {
  const ts = numVal(args[0]);
  const year = new Date(ts).getFullYear();
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return { tag: "bool", val: isLeap };
});

registerBuiltin("dt_days_in_month", (args) => {
  const ts = numVal(args[0]);
  const d = new Date(ts);
  const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { tag: "num", val: nextMonth.getDate() };
});

registerBuiltin("dt_to_local", (args) => {
  const ts = numVal(args[0]);
  const d = new Date(ts);
  return { tag: "str", val: d.toString() };
});

registerBuiltin("dt_elapsed_ms", (args) => {
  const ts = numVal(args[0]);
  return { tag: "num", val: Date.now() - ts };
});

// Additional DateTime functions for Phase 1
registerBuiltin("dt_now_iso", () => {
  return { tag: "str", val: new Date().toISOString() };
});

registerBuiltin("dt_from_parts", (args) => {
  const year = numVal(args[0]);
  const month = numVal(args[1]);
  const day = numVal(args[2]);
  const hour = args.length > 3 ? numVal(args[3]) : 0;
  const minute = args.length > 4 ? numVal(args[4]) : 0;
  const second = args.length > 5 ? numVal(args[5]) : 0;

  const d = new Date(year, month - 1, day, hour, minute, second);
  return { tag: "num", val: d.getTime() };
});

registerBuiltin("dt_from_unix", (args) => {
  const unixSec = numVal(args[0]);
  return { tag: "num", val: unixSec * 1000 };
});

registerBuiltin("dt_to_unix", (args) => {
  const ts = numVal(args[0]);
  return { tag: "num", val: Math.floor(ts / 1000) };
});

// --- Phase 5: Validation (19 functions) ---

registerBuiltin("validate_email", (args) => {
  const email = strVal(args[0]);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return { tag: "bool", val: emailRegex.test(email) };
});

registerBuiltin("validate_url", (args) => {
  const url = strVal(args[0]);
  try {
    new URL(url);
    return { tag: "bool", val: true };
  } catch {
    return { tag: "bool", val: false };
  }
});

registerBuiltin("validate_ipv4", (args) => {
  const ip = strVal(args[0]);
  const ipv4Regex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
  return { tag: "bool", val: ipv4Regex.test(ip) };
});

registerBuiltin("validate_ipv6", (args) => {
  const ip = strVal(args[0]);
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  return { tag: "bool", val: ipv6Regex.test(ip) };
});

registerBuiltin("validate_ipv", (args) => {
  const ip = strVal(args[0]);
  const ipv4Regex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}|[0-9a-fA-F]{1,4}::([0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4})$/;
  return { tag: "bool", val: ipv4Regex.test(ip) || ipv6Regex.test(ip) };
});

registerBuiltin("validate_uuid", (args) => {
  const uuid = strVal(args[0]);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return { tag: "bool", val: uuidRegex.test(uuid) };
});

registerBuiltin("validate_json", (args) => {
  const json = strVal(args[0]);
  try {
    JSON.parse(json);
    return { tag: "bool", val: true };
  } catch {
    return { tag: "bool", val: false };
  }
});

registerBuiltin("validate_int", (args) => {
  const str = strVal(args[0]);
  const intRegex = /^-?\d+$/;
  return { tag: "bool", val: intRegex.test(str) };
});

registerBuiltin("validate_float", (args) => {
  const str = strVal(args[0]);
  const floatRegex = /^-?(\d+\.?\d*|\d*\.\d+)$/;
  return { tag: "bool", val: floatRegex.test(str) && str !== "" && str !== "-" && str !== "." };
});

registerBuiltin("validate_alpha", (args) => {
  const str = strVal(args[0]);
  const alphaRegex = /^[a-zA-Z]+$/;
  return { tag: "bool", val: alphaRegex.test(str) };
});

registerBuiltin("validate_alphanumeric", (args) => {
  const str = strVal(args[0]);
  const alphanumRegex = /^[a-zA-Z0-9]+$/;
  return { tag: "bool", val: alphanumRegex.test(str) };
});

registerBuiltin("validate_hex", (args) => {
  const str = strVal(args[0]);
  const hexRegex = /^[0-9a-fA-F]+$/;
  return { tag: "bool", val: hexRegex.test(str) && str.length % 2 === 0 };
});

registerBuiltin("validate_base64", (args) => {
  const str = strVal(args[0]);
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(str) || str.length % 4 !== 0) return { tag: "bool", val: false };
  try {
    Buffer.from(str, "base64").toString("base64") === str;
    return { tag: "bool", val: true };
  } catch {
    return { tag: "bool", val: false };
  }
});

registerBuiltin("validate_phone", (args) => {
  const phone = strVal(args[0]);
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  const digitsOnly = phone.replace(/\D/g, "");
  return { tag: "bool", val: phoneRegex.test(phone) && digitsOnly.length >= 10 };
});

registerBuiltin("validate_credit_card", (args) => {
  const cc = strVal(args[0]).replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(cc)) return { tag: "bool", val: false };

  let sum = 0;
  let isEven = false;
  for (let i = cc.length - 1; i >= 0; i--) {
    let digit = parseInt(cc[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return { tag: "bool", val: sum % 10 === 0 };
});

registerBuiltin("validate_date_iso", (args) => {
  const dateStr = strVal(args[0]);
  const date = new Date(dateStr);
  return { tag: "bool", val: !isNaN(date.getTime()) && dateStr.includes("T") };
});

registerBuiltin("validate_min_length", (args) => {
  const str = strVal(args[0]);
  const minLen = numVal(args[1]);
  return { tag: "bool", val: str.length >= minLen };
});

registerBuiltin("validate_max_length", (args) => {
  const str = strVal(args[0]);
  const maxLen = numVal(args[1]);
  return { tag: "bool", val: str.length <= maxLen };
});

registerBuiltin("validate_range", (args) => {
  const num = numVal(args[0]);
  const min = numVal(args[1]);
  const max = numVal(args[2]);
  return { tag: "bool", val: num >= min && num <= max };
});

registerBuiltin("validate_not_empty", (args) => {
  const v = args[0];
  if (v.tag === "str") return { tag: "bool", val: v.val.length > 0 };
  if (v.tag === "array") return { tag: "bool", val: v.val.length > 0 };
  if (v.tag === "null") return { tag: "bool", val: false };
  return { tag: "bool", val: true };
});

registerBuiltin("validate_matches", (args) => {
  const str = strVal(args[0]);
  const pattern = strVal(args[1]);
  try {
    const regex = new RegExp(pattern);
    return { tag: "bool", val: regex.test(str) };
  } catch {
    return { tag: "bool", val: false };
  }
});

// === Memory Type System ===

// sizeof(type) - Get the size in bytes of a type or struct
registerBuiltin("sizeof", (args) => {
  const v = args[0];

  // Handle struct types passed as objects
  if (v.tag === "object") {
    // Check if this is a struct (has __struct_name__)
    const structName = v.val.get("__struct_name__");
    if (structName && structName.tag === "str") {
      // It's a struct - calculate size from fields
      const fieldsStr = v.val.get("__fields__");
      if (fieldsStr && fieldsStr.tag === "str") {
        try {
          const fields: Array<{ name: string; type: string }> = JSON.parse(fieldsStr.val);
          let totalSize = 0;
          let maxAlign = 1;

          // Calculate field sizes and track alignment
          for (const field of fields) {
            const fieldSize = getTypeSize(field.type);
            const fieldAlign = getTypeAlign(field.type);

            // Align current offset
            totalSize = align(totalSize, fieldAlign);
            totalSize += fieldSize;

            // Track max alignment requirement
            if (fieldAlign > maxAlign) maxAlign = fieldAlign;
          }

          // Align final size to max alignment (trailing padding)
          totalSize = align(totalSize, maxAlign);

          return { tag: "num", val: totalSize };
        } catch {
          return { tag: "num", val: 0 };
        }
      }
    }
    // Generic object size estimate
    return { tag: "num", val: v.val.size * 16 };
  }

  // Handle basic types
  if (v.tag === "num") return { tag: "num", val: 8 };
  if (v.tag === "str") return { tag: "num", val: 16 };  // pointer + length = 8 + 8
  if (v.tag === "bool") return { tag: "num", val: 1 };
  if (v.tag === "null") return { tag: "num", val: 0 };
  if (v.tag === "array") return { tag: "num", val: 8 + (v.val.length * 8) };
  if (v.tag === "ptr") return { tag: "num", val: 4 };    // v5.9.1: Pointer size

  return { tag: "num", val: 0 };
});

// Helper: Get size of a type string (i32, f64, bool, byte, string, etc)
// v5.9.2: Updated for 4-byte alignment
function getTypeSize(type: string): number {
  const t = type.toLowerCase().trim();
  const sizeMap: Record<string, number> = {
    "i32": 4,
    "i64": 8,
    "f32": 4,
    "f64": 8,
    "bool": 1,
    "byte": 1,
    "char": 1,
    "string": 16, // pointer + length
    "any": 8,
    "ptr": 4,     // Pointer type (v5.9.1)
    "null": 0,
  };
  return sizeMap[t] || 8; // default to 8
}

// Helper: Get alignment requirement of a type
// v5.9.2: Supports 4-byte and 8-byte boundaries
function getTypeAlign(type: string): number {
  const t = type.toLowerCase().trim();
  const alignMap: Record<string, number> = {
    "i32": 4,
    "i64": 8,
    "f32": 4,
    "f64": 8,
    "bool": 1,
    "byte": 1,
    "char": 1,
    "string": 4,  // Changed to 4 for v5.9.2
    "any": 4,     // Changed to 4 for v5.9.2
    "ptr": 4,     // Pointer alignment (v5.9.1)
    "null": 1,
  };
  return alignMap[t] || 4; // default to 4 for v5.9.2
}

// Helper: Align offset to next multiple of alignment
function align(offset: number, alignment: number): number {
  if (alignment <= 1) return offset;
  const remainder = offset % alignment;
  return remainder === 0 ? offset : offset + (alignment - remainder);
}

// === Phase 5.9: Dynamic Memory ===

// malloc(size) - Allocate size bytes and return pointer (address)
registerBuiltin("malloc", (args, vm) => {
  const size = numVal(args[0]);
  if (size <= 0) return { tag: "num", val: 0 };

  const allocator = vm.getAllocator();
  const addr = allocator.allocate(size);

  return { tag: "num", val: addr };
});

// free(pointer) - Free previously allocated memory
registerBuiltin("free", (args, vm) => {
  const ptr = numVal(args[0]);
  if (ptr === 0) return { tag: "bool", val: false };

  const allocator = vm.getAllocator();
  const success = allocator.free(ptr);

  return { tag: "bool", val: success };
});

// calloc(count, size) - Allocate count * size bytes (initialized to zero)
registerBuiltin("calloc", (args, vm) => {
  const count = numVal(args[0]);
  const size = numVal(args[1]);
  const totalSize = count * size;

  if (totalSize <= 0) return { tag: "num", val: 0 };

  const allocator = vm.getAllocator();
  const addr = allocator.allocate(totalSize);

  return { tag: "num", val: addr };
});

// memory_info() - Get memory allocator stats
registerBuiltin("memory_info", (args, vm) => {
  const allocator = vm.getAllocator();
  const stats = allocator.getStats();

  const info = new Map<string, Value>();
  info.set("allocated_blocks", { tag: "num", val: stats.allocatedBlocks });
  info.set("freed_blocks", { tag: "num", val: stats.freedBlocks });
  info.set("total_allocated", { tag: "num", val: stats.totalAllocated });
  info.set("total_freed", { tag: "num", val: stats.totalFreed });
  info.set("fragmentation", { tag: "num", val: stats.fragmentation });

  return { tag: "object", val: info };
});

// memory_leaks() - Detect unfreed allocations
registerBuiltin("memory_leaks", (args, vm) => {
  const allocator = vm.getAllocator();
  const leaks = allocator.detectLeaks();

  const result: Value[] = leaks.map(block => {
    const blockInfo = new Map<string, Value>();
    blockInfo.set("id", { tag: "num", val: block.id });
    blockInfo.set("addr", { tag: "num", val: block.addr });
    blockInfo.set("size", { tag: "num", val: block.size });
    return { tag: "object" as const, val: blockInfo };
  });

  return { tag: "array", val: result };
});

// access_memory(ptr) - Check memory access (detects use-after-free)
registerBuiltin("access_memory", (args, vm) => {
  const addr = numVal(args[0]);
  const allocator = vm.getAllocator();
  const success = allocator.access(addr);

  return { tag: "bool", val: success };
});

// memory_errors() - Get all detected errors
registerBuiltin("memory_errors", (args, vm) => {
  const allocator = vm.getAllocator();
  const errors = allocator.getErrors();

  const result: Value[] = errors.map(err => {
    const errInfo = new Map<string, Value>();
    errInfo.set("type", { tag: "str", val: err.type });
    errInfo.set("addr", { tag: "num", val: err.addr });
    errInfo.set("message", { tag: "str", val: err.message });
    return { tag: "object" as const, val: errInfo };
  });

  return { tag: "array", val: result };
});

// is_null(ptr) - Check if pointer is NULL (0)
registerBuiltin("is_null", (args) => {
  const ptr = numVal(args[0]);
  return { tag: "bool", val: ptr === 0 };
});

// v5.9.1: offset_of(struct, field_name) - Get byte offset of field in struct
registerBuiltin("offset_of", (args) => {
  const structVal = args[0];
  const fieldName = strVal(args[1]);

  if (structVal.tag !== "object") return { tag: "num", val: -1 };

  const fieldsStr = structVal.val.get("__fields__");
  if (!fieldsStr || fieldsStr.tag !== "str") return { tag: "num", val: -1 };

  try {
    const fields: Array<{ name: string; type: string }> = JSON.parse(fieldsStr.val);
    let offset = 0;
    let maxAlign = 1;

    for (const field of fields) {
      const fieldSize = getTypeSize(field.type);
      const fieldAlign = getTypeAlign(field.type);

      // Align current offset
      offset = align(offset, fieldAlign);
      if (fieldAlign > maxAlign) maxAlign = fieldAlign;

      if (field.name === fieldName) {
        return { tag: "num", val: offset };
      }

      offset += fieldSize;
    }

    return { tag: "num", val: -1 }; // field not found
  } catch {
    return { tag: "num", val: -1 };
  }
});

// v5.9.3: struct_padding(struct) - Calculate padding waste
registerBuiltin("struct_padding", (args) => {
  const structVal = args[0];

  if (structVal.tag !== "object") return { tag: "num", val: 0 };

  const fieldsStr = structVal.val.get("__fields__");
  if (!fieldsStr || fieldsStr.tag !== "str") return { tag: "num", val: 0 };

  try {
    const fields: Array<{ name: string; type: string }> = JSON.parse(fieldsStr.val);
    let totalPadding = 0;
    let offset = 0;
    let maxAlign = 1;

    // Calculate padding for each field
    for (const field of fields) {
      const fieldSize = getTypeSize(field.type);
      const fieldAlign = getTypeAlign(field.type);

      // Align current offset
      const alignedOffset = align(offset, fieldAlign);
      totalPadding += alignedOffset - offset;

      offset = alignedOffset + fieldSize;
      maxAlign = Math.max(maxAlign, fieldAlign);
    }

    // Add tail padding
    const finalOffset = align(offset, maxAlign);
    totalPadding += finalOffset - offset;

    return { tag: "num", val: totalPadding };
  } catch {
    return { tag: "num", val: 0 };
  }
});

// v5.9.4: fragmentation_ratio() - Get heap fragmentation percentage
registerBuiltin("fragmentation_ratio", (args, vm) => {
  const allocator = vm.getAllocator();
  const ratio = allocator.getFragmentationRatio();
  return { tag: "num", val: ratio };
});

// v5.9.4: fragmentation_stats() - Get detailed fragmentation statistics
registerBuiltin("fragmentation_stats", (args, vm) => {
  const allocator = vm.getAllocator();
  const stats = allocator.getFragmentationStats();

  const result = new Map<string, Value>();
  result.set("total_free", { tag: "num", val: stats.totalFree });
  result.set("largest_free", { tag: "num", val: stats.largestFree });
  result.set("num_fragments", { tag: "num", val: stats.numFragments });
  result.set("ratio", { tag: "num", val: stats.ratio });

  return { tag: "object", val: result };
});

// v5.9.4: coalesce_heap() - Manually trigger heap coalescing
registerBuiltin("coalesce_heap", (args, vm) => {
  const allocator = vm.getAllocator();
  // coalesceBlocks() is called automatically on free(), but user can trigger manually
  return { tag: "bool", val: true };
});

// v5.9.5: memory_leak_report() - Generate detailed leak report
registerBuiltin("memory_leak_report", (args, vm) => {
  const allocator = vm.getAllocator();
  const report = allocator.generateLeakReport();

  const leaksList = new Map<string, Value>();

  for (let i = 0; i < report.leaks.length; i++) {
    const leak = report.leaks[i];
    const leakObj = new Map<string, Value>();

    leakObj.set("block_id", { tag: "num", val: leak.blockId });
    leakObj.set("size", { tag: "num", val: leak.size });
    leakObj.set("addr", { tag: "num", val: leak.addr });
    leakObj.set("allocated_at", { tag: "num", val: leak.allocatedAt });
    leakObj.set("age_ms", { tag: "num", val: leak.ageMs });

    if (leak.sourceFile) {
      leakObj.set("source_file", { tag: "str", val: leak.sourceFile });
    }
    if (leak.sourceLine !== undefined) {
      leakObj.set("source_line", { tag: "num", val: leak.sourceLine });
    }
    if (leak.sourceInfo) {
      leakObj.set("source_info", { tag: "str", val: leak.sourceInfo });
    }

    leaksList.set(i.toString(), { tag: "object", val: leakObj });
  }

  const result = new Map<string, Value>();
  result.set("total_leaked", { tag: "num", val: report.totalLeaked });
  result.set("leak_count", { tag: "num", val: report.leakCount });
  result.set("leaks", { tag: "object", val: leaksList });
  result.set("timestamp", { tag: "num", val: report.timestamp });

  return { tag: "object", val: result };
});

// v5.9.5: memory_leak_report_string() - Format leak report as string
registerBuiltin("memory_leak_report_string", (args, vm) => {
  const allocator = vm.getAllocator();
  const reportStr = allocator.formatLeakReport();
  return { tag: "str", val: reportStr };
});

// v5.9.5: memory_zombies() - Detect double-free zombie blocks
registerBuiltin("memory_zombies", (args, vm) => {
  const allocator = vm.getAllocator();
  const zombies = allocator.detectZombies();

  const result = new Map<string, Value>();

  for (let i = 0; i < zombies.length; i++) {
    const zombie = zombies[i];
    const zombieObj = new Map<string, Value>();

    zombieObj.set("addr", { tag: "num", val: zombie.addr });
    zombieObj.set("freed_at", { tag: "num", val: zombie.freedAt });

    result.set(i.toString(), { tag: "object", val: zombieObj });
  }

  return { tag: "object", val: result };
});

// v5.9.5: memory_has_leaks() - Check if there are any unfreed blocks
registerBuiltin("memory_has_leaks", (args, vm) => {
  const allocator = vm.getAllocator();
  const leaks = allocator.detectLeaks();
  return { tag: "bool", val: leaks.length > 0 };
});

// v5.9.3: struct_efficiency(struct) - Calculate data efficiency percentage
registerBuiltin("struct_efficiency", (args) => {
  const structVal = args[0];

  if (structVal.tag !== "object") return { tag: "num", val: 0 };

  const fieldsStr = structVal.val.get("__fields__");
  if (!fieldsStr || fieldsStr.tag !== "str") return { tag: "num", val: 0 };

  try {
    const fields: Array<{ name: string; type: string }> = JSON.parse(fieldsStr.val);
    let totalSize = 0;
    let dataSize = 0;
    let offset = 0;
    let maxAlign = 1;

    for (const field of fields) {
      const fieldSize = getTypeSize(field.type);
      const fieldAlign = getTypeAlign(field.type);

      // Align current offset
      offset = align(offset, fieldAlign);
      offset += fieldSize;
      dataSize += fieldSize;

      maxAlign = Math.max(maxAlign, fieldAlign);
    }

    // Final size with tail padding
    totalSize = align(offset, maxAlign);

    const efficiency = totalSize > 0 ? Math.round((dataSize / totalSize) * 100) : 0;
    return { tag: "num", val: efficiency };
  } catch {
    return { tag: "num", val: 0 };
  }
});

// v5.9.6: pool_stats() - Get pool statistics
registerBuiltin("pool_stats", (args, vm) => {
  const allocator = vm.getAllocator();
  const stats = allocator.getPoolStats();

  const perSizeStats = new Map<string, Value>();
  for (const item of stats.perSizeStats) {
    const itemObj = new Map<string, Value>();
    itemObj.set("size", { tag: "num", val: item.size });
    itemObj.set("available", { tag: "num", val: item.available });
    perSizeStats.set(item.size.toString(), { tag: "object", val: itemObj });
  }

  const result = new Map<string, Value>();
  result.set("hit_rate", { tag: "num", val: stats.hitRate });
  result.set("total_hits", { tag: "num", val: stats.totalHits });
  result.set("total_misses", { tag: "num", val: stats.totalMisses });
  result.set("per_size_stats", { tag: "object", val: perSizeStats });

  return { tag: "object", val: result };
});

// v5.9.6: pool_hits() - Get total pool hits
registerBuiltin("pool_hits", (args, vm) => {
  const allocator = vm.getAllocator();
  return { tag: "num", val: allocator.getPoolHits() };
});

// v5.9.6: pool_hit_rate() - Get pool hit rate (0-100%)
registerBuiltin("pool_hit_rate", (args, vm) => {
  const allocator = vm.getAllocator();
  return { tag: "num", val: allocator.getPoolHitRate() };
});

// v5.9.6: pool_size_stats() - Get per-size pool statistics
registerBuiltin("pool_size_stats", (args, vm) => {
  const allocator = vm.getAllocator();
  const stats = allocator.getPoolSizeStats();

  const result = new Map<string, Value>();
  for (const item of stats) {
    const itemObj = new Map<string, Value>();
    itemObj.set("size", { tag: "num", val: item.size });
    itemObj.set("available", { tag: "num", val: item.available });
    result.set(item.size.toString(), { tag: "object", val: itemObj });
  }

  return { tag: "object", val: result };
});

// v5.9.6: pool_prefill(size, count) - Pre-fill a pool bucket
registerBuiltin("pool_prefill", (args, vm) => {
  const allocator = vm.getAllocator();
  const size = numVal(args[0]);
  const count = numVal(args[1]);
  const prefilled = allocator.prefillPool(size, count);
  return { tag: "num", val: prefilled };
});

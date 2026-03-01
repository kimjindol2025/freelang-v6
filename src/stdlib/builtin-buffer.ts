// FreeLang v6: Buffer & Encoding builtins (Phase 7)
// Node.js Buffer + crypto for hashing

import { Value } from "../compiler";
import { VM } from "../vm";
import { registerBuiltin } from "./builtins";
import * as crypto from "crypto";

function num(n: number): Value { return { tag: "num", val: n }; }
function str(s: string): Value { return { tag: "str", val: s }; }
function bool(b: boolean): Value { return { tag: "bool", val: b }; }
function arr(items: Value[]): Value { return { tag: "array", val: items }; }
function strVal(v: Value): string { return v.tag === "str" ? v.val : ""; }
function numVal(v: Value): number { return v.tag === "num" ? v.val : 0; }

// --- Encoding ---

registerBuiltin("base64_encode", (args) => str(Buffer.from(strVal(args[0])).toString("base64")));
registerBuiltin("base64_decode", (args) => {
  try { return str(Buffer.from(strVal(args[0]), "base64").toString("utf-8")); }
  catch { return { tag: "null" }; }
});

registerBuiltin("hex_encode", (args) => str(Buffer.from(strVal(args[0])).toString("hex")));
registerBuiltin("hex_decode", (args) => {
  try { return str(Buffer.from(strVal(args[0]), "hex").toString("utf-8")); }
  catch { return { tag: "null" }; }
});

registerBuiltin("url_encode", (args) => str(encodeURIComponent(strVal(args[0]))));
registerBuiltin("url_decode", (args) => {
  try { return str(decodeURIComponent(strVal(args[0]))); }
  catch { return str(strVal(args[0])); }
});

registerBuiltin("utf8_encode", (args) => {
  const buf = Buffer.from(strVal(args[0]), "utf-8");
  return arr(Array.from(buf).map(b => num(b)));
});

registerBuiltin("utf8_decode", (args) => {
  if (args[0].tag !== "array") return { tag: "null" };
  const bytes = args[0].val.map(v => v.tag === "num" ? v.val : 0);
  return str(Buffer.from(bytes).toString("utf-8"));
});

// --- Hashing ---

registerBuiltin("hash_md5", (args) => str(crypto.createHash("md5").update(strVal(args[0])).digest("hex")));
registerBuiltin("hash_sha1", (args) => str(crypto.createHash("sha1").update(strVal(args[0])).digest("hex")));
registerBuiltin("hash_sha256", (args) => str(crypto.createHash("sha256").update(strVal(args[0])).digest("hex")));
registerBuiltin("hash_sha512", (args) => str(crypto.createHash("sha512").update(strVal(args[0])).digest("hex")));

registerBuiltin("hash_hmac", (args) => {
  const algo = strVal(args[0]); // "sha256", etc
  const key = strVal(args[1]);
  const data = strVal(args[2]);
  try { return str(crypto.createHmac(algo, key).update(data).digest("hex")); }
  catch { return { tag: "null" }; }
});

registerBuiltin("hash_crc32", (args) => {
  const s = strVal(args[0]);
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i);
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
  }
  return num((crc ^ 0xFFFFFFFF) >>> 0);
});

// --- Buffer ---

registerBuiltin("buf_new", (args) => {
  const size = numVal(args[0]);
  return arr(new Array(size).fill(num(0)));
});

registerBuiltin("buf_from_str", (args) => {
  const buf = Buffer.from(strVal(args[0]), "utf-8");
  return arr(Array.from(buf).map(b => num(b)));
});

registerBuiltin("buf_to_str", (args) => {
  if (args[0].tag !== "array") return str("");
  const bytes = args[0].val.map(v => v.tag === "num" ? v.val : 0);
  return str(Buffer.from(bytes).toString("utf-8"));
});

registerBuiltin("buf_slice", (args) => {
  if (args[0].tag !== "array") return arr([]);
  const start = numVal(args[1]);
  const end = args.length > 2 ? numVal(args[2]) : args[0].val.length;
  return arr(args[0].val.slice(start, end));
});

registerBuiltin("buf_concat", (args) => {
  if (args[0].tag !== "array" || args[1].tag !== "array") return arr([]);
  return arr([...args[0].val, ...args[1].val]);
});

registerBuiltin("buf_compare", (args) => {
  if (args[0].tag !== "array" || args[1].tag !== "array") return num(-2);
  const a = (args[0] as any).val as Value[], b = (args[1] as any).val as Value[];
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const av = a[i].tag === "num" ? (a[i] as any).val : 0;
    const bv = b[i].tag === "num" ? (b[i] as any).val : 0;
    if (av < bv) return num(-1);
    if (av > bv) return num(1);
  }
  if (a.length < b.length) return num(-1);
  if (a.length > b.length) return num(1);
  return num(0);
});

// --- Random ---

registerBuiltin("random_bytes", (args) => {
  const n = numVal(args[0]);
  const bytes = crypto.randomBytes(n);
  return arr(Array.from(bytes).map(b => num(b)));
});

registerBuiltin("random_string", (args) => {
  const n = numVal(args[0]);
  return str(crypto.randomBytes(Math.ceil(n / 2)).toString("hex").slice(0, n));
});

registerBuiltin("random_int", (args) => {
  const min = numVal(args[0]), max = numVal(args[1]);
  return num(min + Math.floor(Math.random() * (max - min)));
});

registerBuiltin("random_float", (args) => {
  const min = args.length > 0 ? numVal(args[0]) : 0;
  const max = args.length > 1 ? numVal(args[1]) : 1;
  return num(min + Math.random() * (max - min));
});

registerBuiltin("random_choice", (args) => {
  if (args[0].tag !== "array" || args[0].val.length === 0) return { tag: "null" };
  return args[0].val[Math.floor(Math.random() * args[0].val.length)];
});

registerBuiltin("random_shuffle", (args) => {
  if (args[0].tag !== "array") return args[0];
  const a = [...args[0].val];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return arr(a);
});

registerBuiltin("random_uuid", () => str(crypto.randomUUID()));

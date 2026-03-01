// FreeLang v6: Compression builtins (Phase 13)
// Node.js zlib

import { Value } from "../compiler";
import { registerBuiltin } from "./builtins";
import * as zlib from "zlib";

function str(s: string): Value { return { tag: "str", val: s }; }
function num(n: number): Value { return { tag: "num", val: n }; }
function bool(b: boolean): Value { return { tag: "bool", val: b }; }
function arr(items: Value[]): Value { return { tag: "array", val: items }; }
function strVal(v: Value): string { return v.tag === "str" ? v.val : ""; }
function numVal(v: Value): number { return v.tag === "num" ? v.val : 0; }

registerBuiltin("gzip_compress", (args) => {
  try {
    const buf = zlib.gzipSync(Buffer.from(strVal(args[0]), "utf-8"));
    return str(buf.toString("base64"));
  } catch { return { tag: "null" }; }
});

registerBuiltin("gzip_decompress", (args) => {
  try {
    const buf = zlib.gunzipSync(Buffer.from(strVal(args[0]), "base64"));
    return str(buf.toString("utf-8"));
  } catch { return { tag: "null" }; }
});

registerBuiltin("deflate_compress", (args) => {
  try {
    const buf = zlib.deflateSync(Buffer.from(strVal(args[0]), "utf-8"));
    return str(buf.toString("base64"));
  } catch { return { tag: "null" }; }
});

registerBuiltin("deflate_decompress", (args) => {
  try {
    const buf = zlib.inflateSync(Buffer.from(strVal(args[0]), "base64"));
    return str(buf.toString("utf-8"));
  } catch { return { tag: "null" }; }
});

registerBuiltin("zlib_compress", (args) => {
  try {
    const level = args.length > 1 ? numVal(args[1]) : zlib.constants.Z_DEFAULT_COMPRESSION;
    const buf = zlib.deflateSync(Buffer.from(strVal(args[0]), "utf-8"), { level });
    return str(buf.toString("base64"));
  } catch { return { tag: "null" }; }
});

registerBuiltin("zlib_decompress", (args) => {
  try {
    const buf = zlib.inflateSync(Buffer.from(strVal(args[0]), "base64"));
    return str(buf.toString("utf-8"));
  } catch { return { tag: "null" }; }
});

registerBuiltin("compress_ratio", (args) => {
  const original = Buffer.from(strVal(args[0]), "utf-8");
  const compressed = zlib.deflateSync(original);
  return num(Math.round((1 - compressed.length / original.length) * 10000) / 100);
});

registerBuiltin("brotli_compress", (args) => {
  try {
    const buf = zlib.brotliCompressSync(Buffer.from(strVal(args[0]), "utf-8"));
    return str(buf.toString("base64"));
  } catch { return { tag: "null" }; }
});

registerBuiltin("brotli_decompress", (args) => {
  try {
    const buf = zlib.brotliDecompressSync(Buffer.from(strVal(args[0]), "base64"));
    return str(buf.toString("utf-8"));
  } catch { return { tag: "null" }; }
});

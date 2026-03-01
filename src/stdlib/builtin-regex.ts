// FreeLang v6: Regex builtins (Phase 2)
// Pure JS RegExp-based

import { Value } from "../compiler";
import { VM } from "../vm";
import { registerBuiltin } from "./builtins";

function num(n: number): Value { return { tag: "num", val: n }; }
function str(s: string): Value { return { tag: "str", val: s }; }
function bool(b: boolean): Value { return { tag: "bool", val: b }; }
function arr(items: Value[]): Value { return { tag: "array", val: items }; }
function numVal(v: Value): number { return v.tag === "num" ? v.val : 0; }
function strVal(v: Value): string { return v.tag === "str" ? v.val : ""; }

function makeRe(pattern: string, flags?: string): RegExp | null {
  try { return new RegExp(pattern, flags); }
  catch { return null; }
}

registerBuiltin("regex_test", (args) => {
  const re = makeRe(strVal(args[0]));
  return re ? bool(re.test(strVal(args[1]))) : bool(false);
});

registerBuiltin("regex_match", (args) => {
  const re = makeRe(strVal(args[0]));
  if (!re) return { tag: "null" };
  const m = strVal(args[1]).match(re);
  return m ? str(m[0]) : { tag: "null" };
});

registerBuiltin("regex_find_all", (args) => {
  const re = makeRe(strVal(args[0]), "g");
  if (!re) return arr([]);
  const matches = strVal(args[1]).match(re);
  return arr(matches ? matches.map(s => str(s)) : []);
});

registerBuiltin("regex_replace", (args) => {
  const re = makeRe(strVal(args[0]));
  if (!re) return args[1];
  return str(strVal(args[1]).replace(re, strVal(args[2])));
});

registerBuiltin("regex_replace_all", (args) => {
  const re = makeRe(strVal(args[0]), "g");
  if (!re) return args[1];
  return str(strVal(args[1]).replace(re, strVal(args[2])));
});

registerBuiltin("regex_split", (args) => {
  const re = makeRe(strVal(args[0]));
  if (!re) return arr([args[1]]);
  return arr(strVal(args[1]).split(re).map(s => str(s)));
});

registerBuiltin("regex_capture", (args) => {
  const re = makeRe(strVal(args[0]));
  if (!re) return arr([]);
  const m = strVal(args[1]).match(re);
  return m ? arr(m.slice(1).map(s => s !== undefined ? str(s) : { tag: "null" } as Value)) : arr([]);
});

registerBuiltin("regex_capture_all", (args) => {
  const re = makeRe(strVal(args[0]), "g");
  if (!re) return arr([]);
  const results: Value[] = [];
  const input = strVal(args[1]);
  const reLocal = makeRe(strVal(args[0]));
  if (!reLocal) return arr([]);
  let m: RegExpExecArray | null;
  const reExec = new RegExp(strVal(args[0]), "g");
  while ((m = reExec.exec(input)) !== null) {
    results.push(arr(m.slice(1).map(s => s !== undefined ? str(s) : { tag: "null" } as Value)));
    if (!reExec.lastIndex) break;
  }
  return arr(results);
});

registerBuiltin("regex_count", (args) => {
  const re = makeRe(strVal(args[0]), "g");
  if (!re) return num(0);
  const matches = strVal(args[1]).match(re);
  return num(matches ? matches.length : 0);
});

registerBuiltin("regex_is_valid", (args) => {
  return bool(makeRe(strVal(args[0])) !== null);
});

registerBuiltin("regex_escape", (args) => {
  return str(strVal(args[0]).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
});

registerBuiltin("regex_first_index", (args) => {
  const re = makeRe(strVal(args[0]));
  if (!re) return num(-1);
  const m = strVal(args[1]).search(re);
  return num(m);
});

registerBuiltin("regex_word_count", (args) => {
  const words = strVal(args[0]).match(/\b\w+\b/g);
  return num(words ? words.length : 0);
});

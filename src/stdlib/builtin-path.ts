// FreeLang v6: Path & OS builtins (Phase 4)
// Node.js path + os modules

import { Value } from "../compiler";
import { VM } from "../vm";
import { registerBuiltin } from "./builtins";
import * as pathMod from "path";
import * as os from "os";

function num(n: number): Value { return { tag: "num", val: n }; }
function str(s: string): Value { return { tag: "str", val: s }; }
function bool(b: boolean): Value { return { tag: "bool", val: b }; }
function arr(items: Value[]): Value { return { tag: "array", val: items }; }
function strVal(v: Value): string { return v.tag === "str" ? v.val : ""; }

// --- Path ---

registerBuiltin("path_join", (args) => {
  const parts = args.map(a => strVal(a));
  return str(pathMod.join(...parts));
});

registerBuiltin("path_resolve", (args) => {
  const parts = args.map(a => strVal(a));
  return str(pathMod.resolve(...parts));
});

registerBuiltin("path_dirname", (args) => str(pathMod.dirname(strVal(args[0]))));
registerBuiltin("path_basename", (args) => {
  const ext = args.length > 1 ? strVal(args[1]) : undefined;
  return str(pathMod.basename(strVal(args[0]), ext));
});
registerBuiltin("path_extname", (args) => str(pathMod.extname(strVal(args[0]))));
registerBuiltin("path_normalize", (args) => str(pathMod.normalize(strVal(args[0]))));
registerBuiltin("path_is_absolute", (args) => bool(pathMod.isAbsolute(strVal(args[0]))));

registerBuiltin("path_relative", (args) => str(pathMod.relative(strVal(args[0]), strVal(args[1]))));

registerBuiltin("path_parse", (args) => {
  const p = pathMod.parse(strVal(args[0]));
  const map = new Map<string, Value>();
  map.set("root", str(p.root));
  map.set("dir", str(p.dir));
  map.set("base", str(p.base));
  map.set("name", str(p.name));
  map.set("ext", str(p.ext));
  return { tag: "object" as const, val: map };
});

registerBuiltin("path_sep", () => str(pathMod.sep));

registerBuiltin("path_with_ext", (args) => {
  const p = pathMod.parse(strVal(args[0]));
  return str(pathMod.format({ ...p, base: undefined, ext: strVal(args[1]) }));
});

registerBuiltin("path_strip_ext", (args) => {
  const p = pathMod.parse(strVal(args[0]));
  return str(pathMod.join(p.dir, p.name));
});

// --- OS ---

registerBuiltin("os_platform", () => str(os.platform()));
registerBuiltin("os_arch", () => str(os.arch()));
registerBuiltin("os_hostname", () => str(os.hostname()));
registerBuiltin("os_homedir", () => str(os.homedir()));
registerBuiltin("os_tmpdir", () => str(os.tmpdir()));

registerBuiltin("os_cpus", () => num(os.cpus().length));

registerBuiltin("os_uptime", () => num(Math.floor(os.uptime())));

registerBuiltin("os_totalmem", () => num(os.totalmem()));
registerBuiltin("os_freemem", () => num(os.freemem()));

registerBuiltin("os_eol", () => str(os.EOL));

// --- Environment ---

registerBuiltin("env_get", (args) => {
  const val = process.env[strVal(args[0])];
  return val !== undefined ? str(val) : { tag: "null" };
});

registerBuiltin("env_set", (args) => {
  process.env[strVal(args[0])] = strVal(args[1]);
  return bool(true);
});

registerBuiltin("env_has", (args) => bool(strVal(args[0]) in process.env));

registerBuiltin("env_delete", (args) => {
  delete process.env[strVal(args[0])];
  return bool(true);
});

registerBuiltin("env_all", () => {
  const map = new Map<string, Value>();
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) map.set(k, str(v));
  }
  return { tag: "object" as const, val: map };
});

// FreeLang v6: DateTime builtins (Phase 1)
// Pure JS Date-based, no external deps

import { Value } from "../compiler";
import { VM } from "../vm";
import { registerBuiltin } from "./builtins";

function num(n: number): Value { return { tag: "num", val: n }; }
function str(s: string): Value { return { tag: "str", val: s }; }
function bool(b: boolean): Value { return { tag: "bool", val: b }; }
function numVal(v: Value): number { return v.tag === "num" ? v.val : 0; }
function strVal(v: Value): string { return v.tag === "str" ? v.val : ""; }

// --- Core ---

registerBuiltin("dt_now", () => num(Date.now()));

registerBuiltin("dt_now_iso", () => str(new Date().toISOString()));

registerBuiltin("dt_from_iso", (args) => {
  const d = new Date(strVal(args[0]));
  return isNaN(d.getTime()) ? { tag: "null" } : num(d.getTime());
});

registerBuiltin("dt_to_iso", (args) => {
  const d = new Date(numVal(args[0]));
  return str(d.toISOString());
});

registerBuiltin("dt_from_parts", (args) => {
  const y = numVal(args[0]), m = numVal(args[1]) - 1, d = numVal(args[2]);
  const h = args.length > 3 ? numVal(args[3]) : 0;
  const min = args.length > 4 ? numVal(args[4]) : 0;
  const s = args.length > 5 ? numVal(args[5]) : 0;
  return num(new Date(y, m, d, h, min, s).getTime());
});

// --- Extractors ---

registerBuiltin("dt_year", (args) => num(new Date(numVal(args[0])).getFullYear()));
registerBuiltin("dt_month", (args) => num(new Date(numVal(args[0])).getMonth() + 1));
registerBuiltin("dt_day", (args) => num(new Date(numVal(args[0])).getDate()));
registerBuiltin("dt_hour", (args) => num(new Date(numVal(args[0])).getHours()));
registerBuiltin("dt_minute", (args) => num(new Date(numVal(args[0])).getMinutes()));
registerBuiltin("dt_second", (args) => num(new Date(numVal(args[0])).getSeconds()));
registerBuiltin("dt_ms", (args) => num(new Date(numVal(args[0])).getMilliseconds()));
registerBuiltin("dt_weekday", (args) => num(new Date(numVal(args[0])).getDay()));

// --- Arithmetic ---

registerBuiltin("dt_add_ms", (args) => num(numVal(args[0]) + numVal(args[1])));
registerBuiltin("dt_add_seconds", (args) => num(numVal(args[0]) + numVal(args[1]) * 1000));
registerBuiltin("dt_add_minutes", (args) => num(numVal(args[0]) + numVal(args[1]) * 60000));
registerBuiltin("dt_add_hours", (args) => num(numVal(args[0]) + numVal(args[1]) * 3600000));
registerBuiltin("dt_add_days", (args) => num(numVal(args[0]) + numVal(args[1]) * 86400000));

registerBuiltin("dt_diff_ms", (args) => num(numVal(args[0]) - numVal(args[1])));
registerBuiltin("dt_diff_seconds", (args) => num(Math.floor((numVal(args[0]) - numVal(args[1])) / 1000)));
registerBuiltin("dt_diff_days", (args) => num(Math.floor((numVal(args[0]) - numVal(args[1])) / 86400000)));

// --- Formatting ---

registerBuiltin("dt_format", (args) => {
  const d = new Date(numVal(args[0]));
  const fmt = strVal(args[1]);
  const pad = (n: number) => String(n).padStart(2, "0");
  const result = fmt
    .replace("YYYY", String(d.getFullYear()))
    .replace("MM", pad(d.getMonth() + 1))
    .replace("DD", pad(d.getDate()))
    .replace("HH", pad(d.getHours()))
    .replace("mm", pad(d.getMinutes()))
    .replace("ss", pad(d.getSeconds()));
  return str(result);
});

// --- Utilities ---

registerBuiltin("dt_start_of_day", (args) => {
  const d = new Date(numVal(args[0]));
  d.setHours(0, 0, 0, 0);
  return num(d.getTime());
});

registerBuiltin("dt_start_of_month", (args) => {
  const d = new Date(numVal(args[0]));
  d.setDate(1); d.setHours(0, 0, 0, 0);
  return num(d.getTime());
});

registerBuiltin("dt_is_leap_year", (args) => {
  const y = args.length > 0 && args[0].tag === "num"
    ? (numVal(args[0]) > 9999 ? new Date(numVal(args[0])).getFullYear() : numVal(args[0]))
    : new Date().getFullYear();
  return bool((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0);
});

registerBuiltin("dt_days_in_month", (args) => {
  const y = numVal(args[0]), m = numVal(args[1]);
  return num(new Date(y, m, 0).getDate());
});

registerBuiltin("dt_elapsed_ms", (args) => num(Date.now() - numVal(args[0])));

registerBuiltin("dt_to_unix", (args) => num(Math.floor(numVal(args[0]) / 1000)));
registerBuiltin("dt_from_unix", (args) => num(numVal(args[0]) * 1000));

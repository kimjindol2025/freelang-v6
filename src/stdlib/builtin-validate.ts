// FreeLang v6: Validation builtins (Phase 5)

import { Value } from "../compiler";
import { registerBuiltin } from "./builtins";

function bool(b: boolean): Value { return { tag: "bool", val: b }; }
function strVal(v: Value): string { return v.tag === "str" ? v.val : ""; }
function numVal(v: Value): number { return v.tag === "num" ? v.val : 0; }

registerBuiltin("validate_email", (args) => {
  const s = strVal(args[0]);
  return bool(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
});

registerBuiltin("validate_url", (args) => {
  try { new URL(strVal(args[0])); return bool(true); }
  catch { return bool(false); }
});

registerBuiltin("validate_ipv4", (args) => {
  const parts = strVal(args[0]).split(".");
  return bool(parts.length === 4 && parts.every(p => {
    const n = Number(p);
    return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p;
  }));
});

registerBuiltin("validate_ipv6", (args) => {
  return bool(/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(strVal(args[0])) ||
    /^::$/.test(strVal(args[0])) ||
    /^([0-9a-fA-F]{1,4}:)*:([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/.test(strVal(args[0])));
});

registerBuiltin("validate_uuid", (args) => {
  return bool(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(strVal(args[0])));
});

registerBuiltin("validate_json", (args) => {
  try { JSON.parse(strVal(args[0])); return bool(true); }
  catch { return bool(false); }
});

registerBuiltin("validate_int", (args) => {
  const s = strVal(args[0]);
  return bool(/^-?\d+$/.test(s));
});

registerBuiltin("validate_float", (args) => {
  const s = strVal(args[0]);
  return bool(/^-?\d+(\.\d+)?$/.test(s));
});

registerBuiltin("validate_alpha", (args) => bool(/^[a-zA-Z]+$/.test(strVal(args[0]))));
registerBuiltin("validate_alphanumeric", (args) => bool(/^[a-zA-Z0-9]+$/.test(strVal(args[0]))));
registerBuiltin("validate_hex", (args) => bool(/^[0-9a-fA-F]+$/.test(strVal(args[0]))));

registerBuiltin("validate_base64", (args) => {
  const s = strVal(args[0]);
  return bool(/^[A-Za-z0-9+/]*={0,2}$/.test(s) && s.length % 4 === 0);
});

registerBuiltin("validate_phone", (args) => {
  return bool(/^\+?[\d\s\-()]{7,15}$/.test(strVal(args[0])));
});

registerBuiltin("validate_date_iso", (args) => {
  const d = new Date(strVal(args[0]));
  return bool(!isNaN(d.getTime()));
});

registerBuiltin("validate_min_length", (args) => {
  return bool(strVal(args[0]).length >= numVal(args[1]));
});

registerBuiltin("validate_max_length", (args) => {
  return bool(strVal(args[0]).length <= numVal(args[1]));
});

registerBuiltin("validate_range", (args) => {
  const n = numVal(args[0]), min = numVal(args[1]), max = numVal(args[2]);
  return bool(n >= min && n <= max);
});

registerBuiltin("validate_not_empty", (args) => {
  const v = args[0];
  if (v.tag === "str") return bool(v.val.trim().length > 0);
  if (v.tag === "array") return bool(v.val.length > 0);
  if (v.tag === "null") return bool(false);
  return bool(true);
});

registerBuiltin("validate_matches", (args) => {
  try {
    const re = new RegExp(strVal(args[1]));
    return bool(re.test(strVal(args[0])));
  } catch { return bool(false); }
});

registerBuiltin("validate_credit_card", (args) => {
  const s = strVal(args[0]).replace(/[\s-]/g, "");
  if (!/^\d{13,19}$/.test(s)) return bool(false);
  // Luhn algorithm
  let sum = 0;
  for (let i = s.length - 1; i >= 0; i--) {
    let d = parseInt(s[i]);
    if ((s.length - i) % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return bool(sum % 10 === 0);
});

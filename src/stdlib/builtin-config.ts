// FreeLang v6: UUID + Config builtins (Phase 6)

import { Value } from "../compiler";
import { registerBuiltin } from "./builtins";
import * as crypto from "crypto";
import * as fs from "fs";

function str(s: string): Value { return { tag: "str", val: s }; }
function bool(b: boolean): Value { return { tag: "bool", val: b }; }
function strVal(v: Value): string { return v.tag === "str" ? v.val : ""; }

// --- UUID ---

registerBuiltin("uuid_v4", () => str(crypto.randomUUID()));

registerBuiltin("uuid_nil", () => str("00000000-0000-0000-0000-000000000000"));

registerBuiltin("uuid_is_valid", (args) => {
  return bool(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(strVal(args[0])));
});

// --- Config ---

const configStore = new Map<string, Value>();

registerBuiltin("config_set", (args) => {
  configStore.set(strVal(args[0]), args[1]);
  return bool(true);
});

registerBuiltin("config_get", (args) => {
  return configStore.get(strVal(args[0])) ?? { tag: "null" };
});

registerBuiltin("config_get_or", (args) => {
  return configStore.get(strVal(args[0])) ?? args[1];
});

registerBuiltin("config_has", (args) => {
  return bool(configStore.has(strVal(args[0])));
});

registerBuiltin("config_delete", (args) => {
  return bool(configStore.delete(strVal(args[0])));
});

registerBuiltin("config_keys", () => {
  return { tag: "array", val: Array.from(configStore.keys()).map(k => str(k)) };
});

registerBuiltin("config_clear", () => {
  configStore.clear();
  return bool(true);
});

registerBuiltin("config_load_json", (args) => {
  try {
    const content = fs.readFileSync(strVal(args[0]), "utf-8");
    const obj = JSON.parse(content);
    for (const [k, v] of Object.entries(obj)) {
      configStore.set(k, typeof v === "string" ? str(v) : typeof v === "number" ? { tag: "num", val: v } : typeof v === "boolean" ? bool(v) : { tag: "str", val: String(v) });
    }
    return bool(true);
  } catch { return bool(false); }
});

registerBuiltin("config_from_env", (args) => {
  const prefix = args.length > 0 ? strVal(args[0]) : "";
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined && (prefix === "" || k.startsWith(prefix))) {
      configStore.set(prefix ? k.slice(prefix.length) : k, str(v));
    }
  }
  return bool(true);
});

registerBuiltin("config_load_dotenv", (args) => {
  try {
    const path = args.length > 0 ? strVal(args[0]) : ".env";
    const content = fs.readFileSync(path, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      configStore.set(key, str(val));
    }
    return bool(true);
  } catch { return bool(false); }
});

registerBuiltin("config_to_json", () => {
  const obj: Record<string, any> = {};
  for (const [k, v] of configStore) {
    if (v.tag === "str") obj[k] = v.val;
    else if (v.tag === "num") obj[k] = v.val;
    else if (v.tag === "bool") obj[k] = v.val;
    else obj[k] = null;
  }
  return str(JSON.stringify(obj));
});

registerBuiltin("config_merge", (args) => {
  if (args[0].tag !== "object") return bool(false);
  for (const [k, v] of args[0].val) configStore.set(k, v);
  return bool(true);
});

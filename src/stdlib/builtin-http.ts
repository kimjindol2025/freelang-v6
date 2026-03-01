// FreeLang v6: HTTP Client builtins (Phase 9)
// Node.js http/https + URL parsing

import { Value } from "../compiler";
import { registerBuiltin } from "./builtins";
import * as http from "http";
import * as https from "https";
import * as urlMod from "url";

function str(s: string): Value { return { tag: "str", val: s }; }
function num(n: number): Value { return { tag: "num", val: n }; }
function bool(b: boolean): Value { return { tag: "bool", val: b }; }
function strVal(v: Value): string { return v.tag === "str" ? v.val : ""; }
function numVal(v: Value): number { return v.tag === "num" ? v.val : 0; }

// --- URL Utilities ---

registerBuiltin("url_parse", (args) => {
  try {
    const u = new URL(strVal(args[0]));
    const map = new Map<string, Value>();
    map.set("protocol", str(u.protocol));
    map.set("host", str(u.host));
    map.set("hostname", str(u.hostname));
    map.set("port", str(u.port));
    map.set("pathname", str(u.pathname));
    map.set("search", str(u.search));
    map.set("hash", str(u.hash));
    map.set("origin", str(u.origin));
    return { tag: "object" as const, val: map };
  } catch { return { tag: "null" } as Value; }
});

registerBuiltin("url_build", (args) => {
  if (args[0].tag !== "object") return { tag: "null" } as Value;
  const obj = args[0].val;
  const getStr = (k: string, def: string) => { const v = obj.get(k); return v?.tag === "str" ? (v as any).val : def; };
  const protocol = getStr("protocol", "https:");
  const host = getStr("host", "localhost");
  const pathname = getStr("pathname", "/");
  const search = getStr("search", "");
  return str(`${protocol}//${host}${pathname}${search}`);
});

registerBuiltin("url_encode_component", (args) => str(encodeURIComponent(strVal(args[0]))));
registerBuiltin("url_decode_component", (args) => {
  try { return str(decodeURIComponent(strVal(args[0]))); }
  catch { return str(strVal(args[0])); }
});

registerBuiltin("query_string_parse", (args) => {
  const params = new URLSearchParams(strVal(args[0]));
  const map = new Map<string, Value>();
  for (const [k, v] of params) map.set(k, str(v));
  return { tag: "object" as const, val: map };
});

registerBuiltin("query_string_build", (args) => {
  if (args[0].tag !== "object") return str("");
  const params = new URLSearchParams();
  for (const [k, v] of args[0].val) {
    params.set(k, v.tag === "str" ? v.val : String((v as any).val ?? ""));
  }
  return str(params.toString());
});

// --- HTTP Client (sync via execSync workaround) ---
// Note: True async HTTP requires Phase 10 (async/await)
// These provide sync HTTP via child_process for now

registerBuiltin("http_get_sync", (args) => {
  try {
    const { execSync } = require("child_process");
    const url = strVal(args[0]);
    const result = execSync(`curl -sS "${url}"`, { timeout: 10000, encoding: "utf-8" });
    return str(result);
  } catch { return { tag: "null" } as Value; }
});

registerBuiltin("http_post_sync", (args) => {
  try {
    const { execSync } = require("child_process");
    const url = strVal(args[0]);
    const body = strVal(args[1]);
    const contentType = args.length > 2 ? strVal(args[2]) : "application/json";
    const result = execSync(
      `curl -sS -X POST -H "Content-Type: ${contentType}" -d '${body.replace(/'/g, "'\\''")}' "${url}"`,
      { timeout: 10000, encoding: "utf-8" }
    );
    return str(result);
  } catch { return { tag: "null" } as Value; }
});

// --- HTTP Server (simple, single-request for testing) ---

const serverRegistry = new Map<number, http.Server>();

registerBuiltin("http_server_create", (args) => {
  const port = numVal(args[0]);
  const routes = new Map<string, Value>();

  const server = http.createServer((req, res) => {
    const key = `${req.method} ${req.url}`;
    const handler = routes.get(key) || routes.get(`GET ${req.url}`);
    if (handler && handler.tag === "str") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(handler.val);
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  server.listen(port);
  serverRegistry.set(port, server);

  const map = new Map<string, Value>();
  map.set("port", num(port));
  map.set("running", bool(true));
  return { tag: "object" as const, val: map };
});

registerBuiltin("http_server_close", (args) => {
  const port = numVal(args[0]);
  const server = serverRegistry.get(port);
  if (server) {
    server.close();
    serverRegistry.delete(port);
    return bool(true);
  }
  return bool(false);
});

// --- JSON helpers for HTTP ---

registerBuiltin("json_parse", (args) => {
  try {
    const obj = JSON.parse(strVal(args[0]));
    return fromJS(obj);
  } catch { return { tag: "null" } as Value; }
});

registerBuiltin("json_stringify", (args, vm) => str(JSON.stringify(toJS(args[0]))));

registerBuiltin("json_pretty", (args, vm) => str(JSON.stringify(toJS(args[0]), null, 2)));

function toJS(v: Value): any {
  switch (v.tag) {
    case "num": case "str": case "bool": return v.val;
    case "null": return null;
    case "array": return v.val.map(toJS);
    case "object": { const o: any = {}; for (const [k, val] of v.val) o[k] = toJS(val); return o; }
    default: return null;
  }
}

function fromJS(v: any): Value {
  if (v === null || v === undefined) return { tag: "null" };
  if (typeof v === "number") return num(v);
  if (typeof v === "string") return str(v);
  if (typeof v === "boolean") return bool(v);
  if (Array.isArray(v)) return { tag: "array", val: v.map(fromJS) };
  if (typeof v === "object") {
    const map = new Map<string, Value>();
    for (const [k, val] of Object.entries(v)) map.set(k, fromJS(val));
    return { tag: "object", val: map };
  }
  return { tag: "null" };
}

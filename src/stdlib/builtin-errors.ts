// FreeLang v6: Error handling builtins

import { registerBuiltin } from "./builtins";
import { Value } from "../compiler";

/**
 * error_new(message: str, type?: str) → object
 * Creates a new error object with message and optional type
 */
registerBuiltin("error_new", ([msgArg, typeArg]) => {
  const message = msgArg?.tag === "str" ? msgArg.val : String(msgArg);
  const type = typeArg?.tag === "str" ? typeArg.val : "Error";

  const errorObj = new Map<string, Value>();
  errorObj.set("message", { tag: "str", val: message });
  errorObj.set("type", { tag: "str", val: type });
  errorObj.set("__error", { tag: "bool", val: true });

  return { tag: "object", val: errorObj };
});

/**
 * error_message(err: object) → str
 * Extracts the message from an error object
 */
registerBuiltin("error_message", ([err]) => {
  if (err?.tag === "object") {
    const message = err.val.get("message");
    if (message?.tag === "str") {
      return message;
    }
  }
  return { tag: "str", val: "Unknown error" };
});

/**
 * error_type(err: object) → str
 * Extracts the type from an error object
 */
registerBuiltin("error_type", ([err]) => {
  if (err?.tag === "object") {
    const type = err.val.get("type");
    if (type?.tag === "str") {
      return type;
    }
  }
  return { tag: "str", val: "Error" };
});

/**
 * is_error(val: any) → bool
 * Checks if a value is an error object
 */
registerBuiltin("is_error", ([val]) => {
  if (val?.tag === "object") {
    const isErr = val.val.get("__error");
    return { tag: "bool", val: isErr?.tag === "bool" && isErr.val === true };
  }
  return { tag: "bool", val: false };
});

/**
 * try_call(fn: function) → {ok: bool, value?: any, error?: any}
 * Attempts to call a function, catching any thrown value
 * Returns {ok: true, value: result} on success
 * Returns {ok: false, error: caught} on throw
 */
registerBuiltin("try_call", ([fnArg], vm) => {
  try {
    // Check what we received
    if (!fnArg) {
      const result = new Map<string, Value>();
      result.set("ok", { tag: "bool", val: false });
      result.set("error", { tag: "str", val: "try_call: no function provided" });
      return { tag: "object", val: result };
    }

    const safeResult = vm.trySafeCall(fnArg, []);

    const result = new Map<string, Value>();
    result.set("ok", { tag: "bool", val: safeResult.ok });
    if (safeResult.ok && safeResult.value) {
      result.set("value", safeResult.value);
    } else if (!safeResult.ok && safeResult.error) {
      result.set("error", safeResult.error);
    }

    return { tag: "object", val: result };
  } catch (e) {
    // Catch any unexpected errors and return them
    const result = new Map<string, Value>();
    result.set("ok", { tag: "bool", val: false });
    result.set("error", { tag: "str", val: String(e) });
    return { tag: "object", val: result };
  }
});

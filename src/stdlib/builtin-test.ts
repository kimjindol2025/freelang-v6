// FreeLang v6: Testing Framework builtins (Phase 11)

import { Value } from "../compiler";
import { VM } from "../vm";
import { registerBuiltin } from "./builtins";

function str(s: string): Value { return { tag: "str", val: s }; }
function num(n: number): Value { return { tag: "num", val: n }; }
function bool(b: boolean): Value { return { tag: "bool", val: b }; }
function strVal(v: Value): string { return v.tag === "str" ? v.val : ""; }
function numVal(v: Value): number { return v.tag === "num" ? v.val : 0; }

type TestResult = { name: string; passed: boolean; error?: string };
const testResults: TestResult[] = [];
let currentSuite = "";
let testCount = 0;
let passCount = 0;
let failCount = 0;

registerBuiltin("test_describe", (args, vm) => {
  currentSuite = strVal(args[0]);
  vm.addOutput(`  Suite: ${currentSuite}\n`);
  return { tag: "null" };
});

registerBuiltin("test_assert", (args, vm) => {
  testCount++;
  const condition = args[0].tag === "bool" ? args[0].val : false;
  const msg = args.length > 1 ? strVal(args[1]) : `assert #${testCount}`;
  if (condition) {
    passCount++;
    testResults.push({ name: msg, passed: true });
  } else {
    failCount++;
    testResults.push({ name: msg, passed: false, error: "Assertion failed" });
    vm.addOutput(`    FAIL: ${msg}\n`);
  }
  return bool(condition);
});

registerBuiltin("test_eq", (args, vm) => {
  testCount++;
  const msg = args.length > 2 ? strVal(args[2]) : `eq #${testCount}`;
  const a = args[0], b = args[1];
  const eq = valEqual(a, b);
  if (eq) {
    passCount++;
    testResults.push({ name: msg, passed: true });
  } else {
    failCount++;
    const errMsg = `Expected ${vm.stringify(b)}, got ${vm.stringify(a)}`;
    testResults.push({ name: msg, passed: false, error: errMsg });
    vm.addOutput(`    FAIL: ${msg} — ${errMsg}\n`);
  }
  return bool(eq);
});

registerBuiltin("test_neq", (args, vm) => {
  testCount++;
  const msg = args.length > 2 ? strVal(args[2]) : `neq #${testCount}`;
  const eq = !valEqual(args[0], args[1]);
  if (eq) { passCount++; testResults.push({ name: msg, passed: true }); }
  else { failCount++; testResults.push({ name: msg, passed: false }); vm.addOutput(`    FAIL: ${msg}\n`); }
  return bool(eq);
});

registerBuiltin("test_gt", (args) => {
  testCount++;
  const r = numVal(args[0]) > numVal(args[1]);
  if (r) passCount++; else failCount++;
  testResults.push({ name: `gt #${testCount}`, passed: r });
  return bool(r);
});

registerBuiltin("test_gte", (args) => {
  testCount++;
  const r = numVal(args[0]) >= numVal(args[1]);
  if (r) passCount++; else failCount++;
  testResults.push({ name: `gte #${testCount}`, passed: r });
  return bool(r);
});

registerBuiltin("test_lt", (args) => {
  testCount++;
  const r = numVal(args[0]) < numVal(args[1]);
  if (r) passCount++; else failCount++;
  testResults.push({ name: `lt #${testCount}`, passed: r });
  return bool(r);
});

registerBuiltin("test_lte", (args) => {
  testCount++;
  const r = numVal(args[0]) <= numVal(args[1]);
  if (r) passCount++; else failCount++;
  testResults.push({ name: `lte #${testCount}`, passed: r });
  return bool(r);
});

registerBuiltin("test_contains", (args) => {
  testCount++;
  let result = false;
  if (args[0].tag === "str" && args[1].tag === "str") result = args[0].val.includes(args[1].val);
  else if (args[0].tag === "array") result = args[0].val.some(v => valEqual(v, args[1]));
  if (result) passCount++; else failCount++;
  testResults.push({ name: `contains #${testCount}`, passed: result });
  return bool(result);
});

registerBuiltin("test_approx", (args) => {
  testCount++;
  const a = numVal(args[0]), b = numVal(args[1]);
  const eps = args.length > 2 ? numVal(args[2]) : 0.001;
  const r = Math.abs(a - b) < eps;
  if (r) passCount++; else failCount++;
  testResults.push({ name: `approx #${testCount}`, passed: r });
  return bool(r);
});

registerBuiltin("test_summary", (args, vm) => {
  const total = testCount;
  const passed = passCount;
  const failed = failCount;
  vm.addOutput(`\n  Results: ${passed}/${total} passed, ${failed} failed\n`);
  return bool(failed === 0);
});

registerBuiltin("test_reset", () => {
  testResults.length = 0;
  testCount = 0;
  passCount = 0;
  failCount = 0;
  currentSuite = "";
  return { tag: "null" };
});

registerBuiltin("test_count", () => num(testCount));
registerBuiltin("test_pass_count", () => num(passCount));
registerBuiltin("test_fail_count", () => num(failCount));

// Helper
function valEqual(a: Value, b: Value): boolean {
  if (a.tag !== b.tag) return false;
  if (a.tag === "null") return true;
  if (a.tag === "num" || a.tag === "str" || a.tag === "bool") return (a as any).val === (b as any).val;
  if (a.tag === "array" && b.tag === "array") {
    if (a.val.length !== b.val.length) return false;
    return a.val.every((v, i) => valEqual(v, (b as any).val[i]));
  }
  return a === b;
}

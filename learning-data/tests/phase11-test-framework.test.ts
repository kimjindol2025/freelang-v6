import { run } from "../src/index";

describe("Phase 11: Test Framework", () => {
  test("test_assert pass", () => {
    const out = run('test_reset(); test_assert(true, "should pass"); println(test_pass_count())');
    expect(out).toEqual(["1\n"]);
  });

  test("test_assert fail", () => {
    const out = run('test_reset(); test_assert(false, "should fail"); println(test_fail_count())');
    expect(out[out.length - 1]).toEqual("1\n");
  });

  test("test_eq pass", () => {
    const out = run('test_reset(); test_eq(42, 42, "numbers equal"); println(test_pass_count())');
    expect(out).toEqual(["1\n"]);
  });

  test("test_eq fail with message", () => {
    const out = run('test_reset(); test_eq(1, 2, "should fail"); println(test_fail_count())');
    expect(out[out.length - 1]).toEqual("1\n");
  });

  test("test_neq", () => {
    const out = run('test_reset(); test_neq(1, 2, "different"); println(test_pass_count())');
    expect(out).toEqual(["1\n"]);
  });

  test("test_gt", () => {
    const out = run('test_reset(); test_gt(5, 3); println(test_pass_count())');
    expect(out).toEqual(["1\n"]);
  });

  test("test_gte", () => {
    const out = run('test_reset(); test_gte(5, 5); println(test_pass_count())');
    expect(out).toEqual(["1\n"]);
  });

  test("test_lt", () => {
    const out = run('test_reset(); test_lt(3, 5); println(test_pass_count())');
    expect(out).toEqual(["1\n"]);
  });

  test("test_lte", () => {
    const out = run('test_reset(); test_lte(5, 5); println(test_pass_count())');
    expect(out).toEqual(["1\n"]);
  });

  test("test_contains string", () => {
    const out = run('test_reset(); test_contains("hello world", "world"); println(test_pass_count())');
    expect(out).toEqual(["1\n"]);
  });

  test("test_contains array", () => {
    const out = run('test_reset(); test_contains([1, 2, 3], 2); println(test_pass_count())');
    expect(out).toEqual(["1\n"]);
  });

  test("test_approx", () => {
    const out = run('test_reset(); test_approx(3.14159, 3.14, 0.01); println(test_pass_count())');
    expect(out).toEqual(["1\n"]);
  });

  test("test_count", () => {
    const out = run('test_reset(); test_assert(true, "a"); test_assert(false, "b"); test_eq(1, 1, "c"); println(test_count())');
    // 3 tests total (one will output FAIL message)
    expect(out[out.length - 1]).toEqual("3\n");
  });

  test("test_summary all pass", () => {
    const out = run('test_reset(); test_assert(true, "ok"); test_eq(1, 1, "eq"); test_summary()');
    const summary = out[out.length - 1];
    expect(summary).toContain("2/2 passed");
    expect(summary).toContain("0 failed");
  });

  test("test_summary with failures", () => {
    const out = run('test_reset(); test_assert(true, "ok"); test_assert(false, "bad"); test_summary()');
    const summary = out[out.length - 1];
    expect(summary).toContain("1/2 passed");
    expect(summary).toContain("1 failed");
  });

  test("test_reset clears state", () => {
    const out = run('test_assert(true, "x"); test_reset(); println(test_count())');
    expect(out).toEqual(["0\n"]);
  });

  test("test_describe outputs suite name", () => {
    const out = run('test_describe("Math Tests"); println("ok")');
    expect(out[0]).toContain("Math Tests");
  });

  test("multiple suites", () => {
    const out = run(`
      test_reset()
      test_describe("Suite A")
      test_assert(true, "a1")
      test_assert(true, "a2")
      test_describe("Suite B")
      test_eq(10, 10, "b1")
      test_summary()
    `);
    const summary = out[out.length - 1];
    expect(summary).toContain("3/3 passed");
  });

  test("test_eq arrays", () => {
    const out = run('test_reset(); test_eq([1, 2, 3], [1, 2, 3], "arrays"); println(test_pass_count())');
    expect(out).toEqual(["1\n"]);
  });

  test("test_eq strings", () => {
    const out = run('test_reset(); test_eq("hello", "hello", "strings"); println(test_pass_count())');
    expect(out).toEqual(["1\n"]);
  });
});

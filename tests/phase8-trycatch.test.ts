// FreeLang v6: Phase 8 - Try/Catch/Finally Comprehensive Tests

import { run } from "../src/index";

describe("Phase 8: Basic throw/catch", () => {
  test("throw string, catch string", () => {
    expect(run('try { throw "error1" } catch(e) { println(e) }')).toEqual(["error1\n"]);
  });

  test("throw number, catch number", () => {
    expect(run('try { throw 42 } catch(e) { println(e) }')).toEqual(["42\n"]);
  });

  test("throw object, catch object", () => {
    expect(run('try { throw {msg: "test"} } catch(e) { println(e.msg) }')).toEqual(["test\n"]);
  });

  test("catch variable binds thrown value", () => {
    expect(run('try { throw "caught" } catch(x) { println("error: " + x) }')).toEqual([
      "error: caught\n",
    ]);
  });

  test("no throw, catch not executed", () => {
    expect(run('try { println("ok") } catch(e) { println("error") }')).toEqual(["ok\n"]);
  });

  test("catch without variable discards error", () => {
    expect(run('try { throw "nope" } catch { println("caught") }')).toEqual(["caught\n"]);
  });

  test("error propagates if no catch", () => {
    expect(() => {
      run('try { throw "escape" } finally { println("finally") }');
    }).toThrow();
  });
});

describe("Phase 8: Finally block", () => {
  test("finally runs on normal path", () => {
    expect(run('try { println("try") } finally { println("finally") }')).toEqual([
      "try\n",
      "finally\n",
    ]);
  });

  test("finally runs after throw", () => {
    expect(
      run('try { throw "err" } catch(e) { println(e) } finally { println("cleanup") }')
    ).toEqual(["err\n", "cleanup\n"]);
  });

  test("finally runs after return inside try", () => {
    expect(run('fn f() { try { return 1 } finally { println("finally") } } println(f())')).toEqual(
      ["finally\n", "1\n"]
    );
  });

  test("finally value changed doesn't affect returned value", () => {
    expect(
      run(
        'fn f() { let x = 10; try { return x } finally { x = 20 } } println(f())'
      )
    ).toEqual(["10\n"]);
  });

  test("finally runs in nested try", () => {
    expect(
      run(
        'try { try { println("inner") } finally { println("inner-finally") } } finally { println("outer-finally") }'
      )
    ).toEqual(["inner\n", "inner-finally\n", "outer-finally\n"]);
  });

  test("finally runs with throw and catch", () => {
    expect(
      run('try { throw "err" } catch { println("caught") } finally { println("done") }')
    ).toEqual(["caught\n", "done\n"]);
  });

  test("try-only-finally works", () => {
    expect(run('try { println("stmt") } finally { println("cleanup") }')).toEqual([
      "stmt\n",
      "cleanup\n",
    ]);
  });

  test("throw inside finally is caught by outer catch", () => {
    expect(
      run(
        'try { try { throw "inner" } finally { throw "finally" } } catch(e) { println(e) }'
      )
    ).toEqual(["finally\n"]);
  });
});

describe("Phase 8: Error propagation", () => {
  test("throw from function to caller catch", () => {
    expect(
      run('fn bad() { throw "oops" } try { bad() } catch(e) { println(e) }')
    ).toEqual(["oops\n"]);
  });

  test("throw propagates through multiple frames", () => {
    expect(
      run(
        'fn a() { fn b() { fn c() { throw "deep" } c() } b() } try { a() } catch(e) { println(e) }'
      )
    ).toEqual(["deep\n"]);
  });

  test("rethrow in catch block", () => {
    expect(
      run(
        'try { try { throw "inner" } catch(e) { println("caught: " + e); throw "outer" } } catch(e) { println("final: " + e) }'
      )
    ).toEqual(["caught: inner\n", "final: outer\n"]);
  });

  test("error message preserved through propagation", () => {
    expect(
      run(
        'fn wrap() { try { throw "original" } catch(e) { throw "wrapped: " + e } } try { wrap() } catch(e) { println(e) }'
      )
    ).toEqual(["wrapped: original\n"]);
  });

  test("multiple catch levels", () => {
    expect(
      run(
        'try { try { throw "level1" } catch(e) { throw "level2" } } catch(e) { println(e) }'
      )
    ).toEqual(["level2\n"]);
  });

  test("error in nested try is caught by inner catch first", () => {
    expect(
      run(
        'try { try { throw "inner" } catch(e) { println("inner: " + e) } } catch(e) { println("outer: " + e) }'
      )
    ).toEqual(["inner: inner\n"]);
  });
});

describe("Phase 8: Nested try/catch", () => {
  test("inner catch handles, outer unaffected", () => {
    expect(
      run(
        'try { try { throw "a" } catch(e) { println(e) } println("ok") } catch(e) { println("never") }'
      )
    ).toEqual(["a\n", "ok\n"]);
  });

  test("inner catch fails, outer catches", () => {
    expect(
      run(
        'try { try { throw "inner" } catch(e) { throw "retry" } } catch(e) { println(e) }'
      )
    ).toEqual(["retry\n"]);
  });

  test("uncaught inner propagates to outer", () => {
    expect(
      run(
        'try { try { throw "a" } catch(e) { if (e == "b") { println("skip") } } } catch(e) { println("outer: " + e) }'
      )
    ).toEqual(["outer: a\n"]);
  });

  test("nested finally blocks all run", () => {
    expect(
      run(
        'try { try { println("1") } finally { println("2") } } finally { println("3") }'
      )
    ).toEqual(["1\n", "2\n", "3\n"]);
  });

  test("rethrow through multiple levels", () => {
    expect(
      run(
        'try { try { try { throw "x" } catch(e) { throw "y" } } catch(e) { throw "z" } } catch(e) { println(e) }'
      )
    ).toEqual(["z\n"]);
  });
});

describe("Phase 8: Error objects", () => {
  test("error_new creates error with message", () => {
    expect(
      run(
        'let err = error_new("test error"); println(error_message(err))'
      )
    ).toEqual(["test error\n"]);
  });

  test("error_new with type", () => {
    expect(
      run(
        'let err = error_new("test", "TypeError"); println(error_type(err))'
      )
    ).toEqual(["TypeError\n"]);
  });

  test("error_message from string error returns string", () => {
    expect(
      run(
        'try { throw "simple" } catch(e) { let msg = error_message(e); println(msg) }'
      )
    ).toEqual(["simple\n"]);
  });

  test("error_type from thrown error defaults to Error", () => {
    expect(
      run(
        'try { throw error_new("msg") } catch(e) { println(error_type(e)) }'
      )
    ).toEqual(["Error\n"]);
  });

  test("is_error detects error objects", () => {
    expect(
      run(
        'println(is_error(error_new("err"))); println(is_error("string")); println(is_error(42)); println(is_error({}))'
      )
    ).toEqual(["true\n", "false\n", "false\n", "false\n"]);
  });
});

describe("Phase 8: try_call builtin", () => {
  test("try_call on successful function", () => {
    expect(
      run(
        'fn good() { return 42 } let result = try_call(good); println(result.ok); println(result.value)'
      )
    ).toEqual(["true\n", "42\n"]);
  });

  test("try_call on throwing function", () => {
    expect(
      run(
        'fn bad() { throw "oops" } let result = try_call(bad); println(result.ok); println(result.error)'
      )
    ).toEqual(["false\n", "oops\n"]);
  });

  test("try_call with error object", () => {
    expect(
      run(
        'fn throws_err() { throw error_new("msg", "CustomError") } let r = try_call(throws_err); println(r.ok)'
      )
    ).toEqual(["false\n"]);
  });

  test("try_call result can be further processed", () => {
    expect(
      run(
        'fn test() { return "success" } let r = try_call(test); if (r.ok) { println(r.value) }'
      )
    ).toEqual(["success\n"]);
  });
});

describe("Phase 8: Break/Continue with Finally", () => {
  test("break inside try with finally", () => {
    expect(
      run(
        'for i in [1, 2, 3] { try { if (i == 2) { break } println(i) } finally { println("fin") } }'
      )
    ).toEqual(["1\n", "fin\n", "fin\n"]);
  });

  test("continue inside try with finally", () => {
    expect(
      run(
        'for i in [1, 2, 3] { try { if (i == 2) { continue } println(i) } finally { println("x") } }'
      )
    ).toEqual(["1\n", "x\n", "x\n", "3\n", "x\n"]);
  });
});

describe("Phase 8: Catch without parentheses", () => {
  test("catch without variable", () => {
    expect(run('try { throw "err" } catch { println("caught") }')).toEqual(["caught\n"]);
  });

  test("catch without variable and finally", () => {
    expect(
      run('try { throw "e" } catch { println("c") } finally { println("f") }')
    ).toEqual(["c\n", "f\n"]);
  });
});

describe("Phase 8: Runtime Errors caught", () => {
  test("division by zero is caught", () => {
    expect(() => {
      run('try { let x = 1 / 0 } catch(e) { println(e) }');
    }).not.toThrow();
  });

  test("undefined variable in try is caught", () => {
    expect(() => {
      run('try { println(undefined_var) } catch(e) { println("caught") }');
    }).not.toThrow();
  });
});

describe("Phase 8: Complex scenarios", () => {
  test("finally with multiple statements", () => {
    expect(
      run(
        'fn f() { try { return 1 } finally { println("a"); println("b"); println("c") } } println(f())'
      )
    ).toEqual(["a\n", "b\n", "c\n", "1\n"]);
  });

  test("error handling pipeline", () => {
    expect(
      run(`
        fn safe_divide(a, b) {
          try {
            if (b == 0) { throw error_new("Division by zero", "MathError") }
            return a / b
          } catch(e) {
            println("Error: " + error_message(e))
            return 0
          }
        }
        println(safe_divide(10, 2))
        println(safe_divide(10, 0))
      `)
    ).toEqual(["5\n", "Error: Division by zero\n", "0\n"]);
  });

  test("retrying logic with try_call", () => {
    expect(
      run(`
        fn unreliable(x) { if (x < 3) { throw "retry" } return x }
        let attempts = 0
        fn retry_fn() { attempts = attempts + 1; return unreliable(5) }
        let result = try_call(retry_fn)
        println(result.ok)
        println(result.value)
      `)
    ).toEqual(["true\n", "5\n"]);
  });
});

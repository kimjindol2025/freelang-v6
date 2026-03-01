// FreeLang v6: Core tests — Lexer, Parser, Compiler, VM

import { run } from "../src/index";

describe("Literals", () => {
  test("number", () => expect(run('println(42)')).toEqual(["42\n"]));
  test("string", () => expect(run('println("hello")')).toEqual(["hello\n"]));
  test("bool", () => expect(run("println(true)")).toEqual(["true\n"]));
  test("null", () => expect(run("println(null)")).toEqual(["null\n"]));
});

describe("Arithmetic", () => {
  test("add", () => expect(run("println(2 + 3)")).toEqual(["5\n"]));
  test("sub", () => expect(run("println(10 - 4)")).toEqual(["6\n"]));
  test("mul", () => expect(run("println(3 * 7)")).toEqual(["21\n"]));
  test("div", () => expect(run("println(10 / 4)")).toEqual(["2.5\n"]));
  test("mod", () => expect(run("println(10 % 3)")).toEqual(["1\n"]));
  test("neg", () => expect(run("println(-5)")).toEqual(["-5\n"]));
  test("precedence", () => expect(run("println(2 + 3 * 4)")).toEqual(["14\n"]));
  test("parens", () => expect(run("println((2 + 3) * 4)")).toEqual(["20\n"]));
});

describe("Comparison", () => {
  test("eq", () => expect(run("println(1 == 1)")).toEqual(["true\n"]));
  test("neq", () => expect(run("println(1 != 2)")).toEqual(["true\n"]));
  test("lt", () => expect(run("println(1 < 2)")).toEqual(["true\n"]));
  test("gt", () => expect(run("println(3 > 2)")).toEqual(["true\n"]));
  test("lte", () => expect(run("println(2 <= 2)")).toEqual(["true\n"]));
  test("gte", () => expect(run("println(3 >= 2)")).toEqual(["true\n"]));
});

describe("Logic", () => {
  test("and", () => expect(run("println(true and false)")).toEqual(["false\n"]));
  test("or", () => expect(run("println(false or true)")).toEqual(["true\n"]));
  test("not", () => expect(run("println(not true)")).toEqual(["false\n"]));
});

describe("Variables", () => {
  test("let", () => expect(run('let x = 10; println(x)')).toEqual(["10\n"]));
  test("const", () => expect(run('const PI = 3.14; println(PI)')).toEqual(["3.14\n"]));
  test("assign", () => expect(run('let x = 1; x = 2; println(x)')).toEqual(["2\n"]));
  test("string concat", () => expect(run('let a = "hello"; println(a + " world")')).toEqual(["hello world\n"]));
});

describe("If/Else", () => {
  test("if true", () => expect(run('if true { println("yes") }')).toEqual(["yes\n"]));
  test("if false", () => expect(run('if false { println("yes") }')).toEqual([]));
  test("if else", () => expect(run('if false { println("a") } else { println("b") }')).toEqual(["b\n"]));
  test("else if", () => {
    const out = run('let x = 2; if x == 1 { println("one") } else if x == 2 { println("two") } else { println("other") }');
    expect(out).toEqual(["two\n"]);
  });
});

describe("While", () => {
  test("loop", () => {
    const out = run('let i = 0; while i < 3 { println(i); i = i + 1 }');
    expect(out).toEqual(["0\n", "1\n", "2\n"]);
  });
  test("break", () => {
    const out = run('let i = 0; while true { if i == 2 { break }; println(i); i = i + 1 }');
    expect(out).toEqual(["0\n", "1\n"]);
  });
});

describe("For", () => {
  test("for in array", () => {
    const out = run('for x in [1, 2, 3] { println(x) }');
    expect(out).toEqual(["1\n", "2\n", "3\n"]);
  });
  test("for in range", () => {
    const out = run('for i in range(0, 3) { println(i) }');
    expect(out).toEqual(["0\n", "1\n", "2\n"]);
  });
});

describe("Functions", () => {
  test("basic fn", () => {
    const out = run('fn add(a, b) { return a + b } println(add(3, 4))');
    expect(out).toEqual(["7\n"]);
  });
  test("recursion", () => {
    const out = run('fn fib(n) { if n <= 1 { return n } return fib(n - 1) + fib(n - 2) } println(fib(10))');
    expect(out).toEqual(["55\n"]);
  });
  test("closure", () => {
    const out = run(`
      fn counter() {
        let c = 0
        return fn() { c = c + 1; return c }
      }
      let inc = counter()
      println(inc())
      println(inc())
      println(inc())
    `);
    expect(out).toEqual(["1\n", "2\n", "3\n"]);
  });
  test("closure adder", () => {
    const out = run(`
      fn make_adder(n) { return fn(x) { return n + x } }
      let add5 = make_adder(5)
      println(add5(3))
      println(add5(10))
    `);
    expect(out).toEqual(["8\n", "15\n"]);
  });
});

describe("Arrays", () => {
  test("literal", () => expect(run("println([1, 2, 3])")).toEqual(["[1, 2, 3]\n"]));
  test("index", () => expect(run("let a = [10, 20, 30]; println(a[1])")).toEqual(["20\n"]));
  test("length", () => expect(run("println(len([1, 2, 3]))")).toEqual(["3\n"]));
  test("push", () => expect(run("let a = [1]; push(a, 2); println(a)")).toEqual(["[1, 2]\n"]));
  test("sort", () => expect(run("println(sort([3, 1, 2]))")).toEqual(["[1, 2, 3]\n"]));
});

describe("Objects", () => {
  test("literal", () => {
    const out = run('let obj = {name: "Kim", age: 30}; println(obj.name)');
    expect(out).toEqual(["Kim\n"]);
  });
  test("keys", () => {
    const out = run('let obj = {a: 1, b: 2}; println(len(keys(obj)))');
    expect(out).toEqual(["2\n"]);
  });
});

describe("String builtins", () => {
  test("upper/lower", () => {
    expect(run('println(upper("hello"))')).toEqual(["HELLO\n"]);
    expect(run('println(lower("WORLD"))')).toEqual(["world\n"]);
  });
  test("trim", () => expect(run('println(trim("  hi  "))')).toEqual(["hi\n"]));
  test("split/join", () => expect(run('println(join(split("a-b-c", "-"), ", "))')).toEqual(["a, b, c\n"]));
  test("contains", () => expect(run('println(contains("hello", "ell"))')).toEqual(["true\n"]));
  test("replace", () => expect(run('println(replace("hello world", "world", "v6"))')).toEqual(["hello v6\n"]));
});

describe("Try/Catch", () => {
  test("catch error", () => {
    const out = run('try { throw "oops" } catch(e) { println(e) }');
    expect(out).toEqual(["oops\n"]);
  });
  test("try no error", () => {
    const out = run('try { println("ok") } catch(e) { println("error") }');
    expect(out).toEqual(["ok\n"]);
  });
});

describe("Math builtins", () => {
  test("abs", () => expect(run("println(abs(-5))")).toEqual(["5\n"]));
  test("floor/ceil", () => {
    expect(run("println(floor(3.7))")).toEqual(["3\n"]);
    expect(run("println(ceil(3.2))")).toEqual(["4\n"]);
  });
  test("min/max", () => {
    expect(run("println(min(3, 7))")).toEqual(["3\n"]);
    expect(run("println(max(3, 7))")).toEqual(["7\n"]);
  });
  test("sqrt", () => expect(run("println(sqrt(16))")).toEqual(["4\n"]));
});

describe("JSON", () => {
  test("to_json", () => {
    const out = run('println(to_json({name: "Kim", age: 30}))');
    expect(JSON.parse(out[0].trim())).toEqual({ name: "Kim", age: 30 });
  });
  test("from_json", () => {
    const out = run('let s = to_json({x: 42}); let obj = from_json(s); println(obj.x)');
    expect(out).toEqual(["42\n"]);
  });
});

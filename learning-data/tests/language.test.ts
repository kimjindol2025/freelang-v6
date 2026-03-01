// FreeLang v6: Language features tests — interpolation, arrow, destructuring, match

import { run } from "../src/index";

describe("String Interpolation", () => {
  test("simple variable", () => {
    expect(run('let name = "Kim"; println("hello ${name}")')).toEqual(["hello Kim\n"]);
  });
  test("expression", () => {
    expect(run('let x = 3; println("${x} + 4 = ${x + 4}")')).toEqual(["3 + 4 = 7\n"]);
  });
  test("nested expression", () => {
    expect(run('println("2 * 3 = ${2 * 3}")')).toEqual(["2 * 3 = 6\n"]);
  });
  test("no interpolation in single quotes", () => {
    expect(run("println('${nope}')")).toEqual(["${nope}\n"]);
  });
  test("empty interpolation part", () => {
    expect(run('let x = 42; println("${x}")')).toEqual(["42\n"]);
  });
  test("multiple interpolations", () => {
    expect(run('let a = 1; let b = 2; println("${a} + ${b} = ${a + b}")')).toEqual(["1 + 2 = 3\n"]);
  });
  test("interpolation with string concat", () => {
    expect(run('let w = "world"; println("hello ${w}!")')).toEqual(["hello world!\n"]);
  });
  test("interpolation with array", () => {
    expect(run('let arr = [1, 2, 3]; println("arr = ${arr}")')).toEqual(["arr = [1, 2, 3]\n"]);
  });
  test("interpolation with bool", () => {
    expect(run('println("result: ${1 < 2}")')).toEqual(["result: true\n"]);
  });
});

describe("Arrow Functions", () => {
  test("single param expression", () => {
    expect(run("let double = x => x * 2; println(double(5))")).toEqual(["10\n"]);
  });
  test("multi param expression", () => {
    expect(run("let add = (a, b) => a + b; println(add(3, 4))")).toEqual(["7\n"]);
  });
  test("no param", () => {
    expect(run('let greet = () => "hi"; println(greet())')).toEqual(["hi\n"]);
  });
  test("block body", () => {
    expect(run("let inc = (x) => { let y = x + 1; return y }; println(inc(9))")).toEqual(["10\n"]);
  });
  test("arrow as argument", () => {
    const out = run(`
      fn apply(f, x) { return f(x) }
      let double = x => x * 2
      println(apply(double, 21))
    `);
    expect(out).toEqual(["42\n"]);
  });
  test("arrow closure", () => {
    const out = run(`
      fn make(n) { return x => n + x }
      let add10 = make(10)
      println(add10(5))
    `);
    expect(out).toEqual(["15\n"]);
  });
});

describe("Destructuring", () => {
  test("object destructuring", () => {
    expect(run('let obj = {x: 1, y: 2}; let {x, y} = obj; println(x + y)')).toEqual(["3\n"]);
  });
  test("array destructuring", () => {
    expect(run("let arr = [10, 20, 30]; let [a, b, c] = arr; println(b)")).toEqual(["20\n"]);
  });
  test("object destructuring from function", () => {
    const out = run(
      'fn point() { return {x: 5, y: 10} }\n' +
      'let {x, y} = point()\n' +
      'println(x + ", " + y)'
    );
    expect(out).toEqual(["5, 10\n"]);
  });
  test("array destructuring partial", () => {
    expect(run("let [first, second] = [100, 200, 300]; println(first + second)")).toEqual(["300\n"]);
  });
});

describe("Match", () => {
  test("basic match", () => {
    const out = run(`
      let x = 2
      match x {
        1 => println("one")
        2 => println("two")
        3 => println("three")
      }
    `);
    expect(out).toEqual(["two\n"]);
  });
  test("match with default", () => {
    const out = run(`
      let x = 99
      match x {
        1 => println("one")
        _ => println("other")
      }
    `);
    expect(out).toEqual(["other\n"]);
  });
  test("match string", () => {
    const out = run(`
      let cmd = "quit"
      match cmd {
        "start" => println("starting")
        "quit" => println("bye")
        _ => println("unknown")
      }
    `);
    expect(out).toEqual(["bye\n"]);
  });
  test("match block body", () => {
    const out = run(`
      let n = 3
      match n {
        1 => { println("one") }
        3 => {
          println("three")
          println("!!!")
        }
      }
    `);
    expect(out).toEqual(["three\n", "!!!\n"]);
  });
  test("match no hit", () => {
    const out = run(`
      let x = 5
      match x {
        1 => println("one")
        2 => println("two")
      }
    `);
    expect(out).toEqual([]);
  });
});

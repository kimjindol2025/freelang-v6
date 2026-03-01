// FreeLang v6: Ported v4/v5 stdlib tests — HOFs, math, crypto, string, system, os

import { run } from "../src/index";

describe("HOF: map", () => {
  test("map with user fn", () => {
    expect(run("fn double(x) { return x * 2 }\nprintln(map([1,2,3], double))")).toEqual(["[2, 4, 6]\n"]);
  });
  test("map with arrow fn", () => {
    expect(run("println(map([10, 20], x => x + 1))")).toEqual(["[11, 21]\n"]);
  });
  test("map empty", () => {
    expect(run("println(map([], x => x))")).toEqual(["[]\n"]);
  });
});

describe("HOF: filter", () => {
  test("filter even", () => {
    expect(run("fn isEven(x) { return x % 2 == 0 }\nprintln(filter([1,2,3,4,5,6], isEven))")).toEqual(["[2, 4, 6]\n"]);
  });
  test("filter with arrow", () => {
    expect(run("println(filter([1,2,3,4], x => x > 2))")).toEqual(["[3, 4]\n"]);
  });
  test("filter none match", () => {
    expect(run("println(filter([1,2,3], x => x > 10))")).toEqual(["[]\n"]);
  });
});

describe("HOF: find", () => {
  test("find existing", () => {
    expect(run("println(find([1,2,3,4], x => x > 2))")).toEqual(["3\n"]);
  });
  test("find not found", () => {
    expect(run("println(find([1,2,3], x => x > 10))")).toEqual(["null\n"]);
  });
});

describe("HOF: every / some", () => {
  test("every true", () => {
    expect(run("println(every([2,4,6], x => x % 2 == 0))")).toEqual(["true\n"]);
  });
  test("every false", () => {
    expect(run("println(every([2,3,6], x => x % 2 == 0))")).toEqual(["false\n"]);
  });
  test("some true", () => {
    expect(run("println(some([1,3,5,4], x => x % 2 == 0))")).toEqual(["true\n"]);
  });
  test("some false", () => {
    expect(run("println(some([1,3,5], x => x % 2 == 0))")).toEqual(["false\n"]);
  });
});

describe("HOF: reduce", () => {
  test("sum", () => {
    expect(run("fn add(a, b) { return a + b }\nprintln(reduce([1,2,3,4], add, 0))")).toEqual(["10\n"]);
  });
  test("sum no init", () => {
    expect(run("fn add(a, b) { return a + b }\nprintln(reduce([1,2,3], add))")).toEqual(["6\n"]);
  });
  test("reduce with arrow", () => {
    expect(run("println(reduce([1,2,3,4], (a, b) => a * b, 1))")).toEqual(["24\n"]);
  });
});

describe("HOF: chained", () => {
  test("map then filter", () => {
    const out = run(`
      let nums = [1, 2, 3, 4, 5]
      let doubled = map(nums, x => x * 2)
      let big = filter(doubled, x => x > 5)
      println(big)
    `);
    expect(out).toEqual(["[6, 8, 10]\n"]);
  });
  test("map with closure", () => {
    const out = run(`
      fn makeAdder(n) { return x => n + x }
      let add10 = makeAdder(10)
      println(map([1, 2, 3], add10))
    `);
    expect(out).toEqual(["[11, 12, 13]\n"]);
  });
});

describe("Math extras", () => {
  test("gcd", () => {
    expect(run("println(gcd(12, 8))")).toEqual(["4\n"]);
  });
  test("lcm", () => {
    expect(run("println(lcm(4, 6))")).toEqual(["12\n"]);
  });
  test("sin/cos", () => {
    expect(run("println(sin(0))")).toEqual(["0\n"]);
    expect(run("println(cos(0))")).toEqual(["1\n"]);
  });
  test("log/exp", () => {
    expect(run("println(exp(0))")).toEqual(["1\n"]);
    expect(run("println(log(1))")).toEqual(["0\n"]);
  });
  test("clamp", () => {
    expect(run("println(clamp(15, 0, 10))")).toEqual(["10\n"]);
    expect(run("println(clamp(-5, 0, 10))")).toEqual(["0\n"]);
    expect(run("println(clamp(5, 0, 10))")).toEqual(["5\n"]);
  });
  test("sign/trunc", () => {
    expect(run("println(sign(-7))")).toEqual(["-1\n"]);
    expect(run("println(trunc(3.7))")).toEqual(["3\n"]);
  });
  test("is_nan/is_finite", () => {
    expect(run("println(is_nan(NAN()))")).toEqual(["true\n"]);
    expect(run("println(is_finite(INF()))")).toEqual(["false\n"]);
    expect(run("println(is_finite(42))")).toEqual(["true\n"]);
  });
});

describe("Crypto", () => {
  test("sha256", () => {
    const out = run('println(sha256("hello"))');
    expect(out[0]).toContain("2cf24dba");
  });
  test("md5", () => {
    const out = run('println(md5("hello"))');
    expect(out[0]).toContain("5d41402abc4b");
  });
  test("base64 round-trip", () => {
    expect(run('println(base64_decode(base64_encode("hello world")))')).toEqual(["hello world\n"]);
  });
  test("hmac", () => {
    const out = run('println(len(hmac("data", "secret")))');
    expect(out).toEqual(["64\n"]);
  });
});

describe("JSON extras", () => {
  test("json_parse", () => {
    expect(run('let obj = json_parse("{\\\"x\\\":1}"); println(obj.x)')).toEqual(["1\n"]);
  });
  test("json_stringify", () => {
    expect(run('println(json_stringify({a: 1, b: 2}))')).toEqual(['{"a":1,"b":2}\n']);
  });
  test("json_validate", () => {
    expect(run('println(json_validate("{}"))')).toEqual(["true\n"]);
    expect(run('println(json_validate("nope"))')).toEqual(["false\n"]);
  });
});

describe("System", () => {
  test("uuid", () => {
    const out = run("println(len(uuid()))");
    expect(out).toEqual(["36\n"]);
  });
  test("timestamp", () => {
    const out = run("println(timestamp() > 0)");
    expect(out).toEqual(["true\n"]);
  });
});

describe("String extras", () => {
  test("trim_start/end", () => {
    expect(run('println(trim_start("  hi"))')).toEqual(["hi\n"]);
    expect(run('println(trim_end("hi  "))')).toEqual(["hi\n"]);
  });
  test("to_upper/to_lower", () => {
    expect(run('println(to_upper("hello"))')).toEqual(["HELLO\n"]);
    expect(run('println(to_lower("HELLO"))')).toEqual(["hello\n"]);
  });
  test("char_code/from_char_code", () => {
    expect(run('println(char_code("A", 0))')).toEqual(["65\n"]);
    expect(run("println(from_char_code(65))")).toEqual(["A\n"]);
  });
});

describe("Array extras", () => {
  test("unique", () => {
    expect(run("println(unique([1,2,2,3,3,3]))")).toEqual(["[1, 2, 3]\n"]);
  });
  test("zip", () => {
    expect(run("println(zip([1,2,3], [4,5,6]))")).toEqual(["[[1, 4], [2, 5], [3, 6]]\n"]);
  });
  test("insert", () => {
    expect(run("let a = [1,3]; insert(a, 1, 2); println(a)")).toEqual(["[1, 2, 3]\n"]);
  });
  test("remove", () => {
    expect(run("let a = [1,2,3]; println(remove(a, 1)); println(a)")).toEqual(["2\n", "[1, 3]\n"]);
  });
  test("fill", () => {
    expect(run("let a = [0,0,0]; fill(a, 7); println(a)")).toEqual(["[7, 7, 7]\n"]);
  });
});

describe("Object extras", () => {
  test("merge", () => {
    expect(run("println(merge({a:1}, {b:2}))")).toEqual(["{a: 1, b: 2}\n"]);
  });
  test("clone", () => {
    const out = run(`
      let orig = {x: 1}
      let copy = clone(orig)
      copy.x = 99
      println(orig.x)
      println(copy.x)
    `);
    expect(out).toEqual(["1\n", "99\n"]);
  });
});

describe("OS", () => {
  test("os_platform", () => {
    const out = run("println(os_platform())");
    expect(out[0]).toBeTruthy();
  });
  test("os_cpus", () => {
    const out = run("println(os_cpus() > 0)");
    expect(out).toEqual(["true\n"]);
  });
  test("env_get/set/has", () => {
    const out = run(`
      env_set("FL_TEST_VAR", "hello")
      println(env_has("FL_TEST_VAR"))
      println(env_get("FL_TEST_VAR"))
    `);
    expect(out).toEqual(["true\n", "hello\n"]);
  });
});

// FreeLang v6: Module System Tests

import { run, clearModuleCache } from "../src/index";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const tmpDir = path.join(os.tmpdir(), "freelang-v6-modules-" + Date.now());
beforeAll(() => fs.mkdirSync(tmpDir, { recursive: true }));
afterAll(() => fs.rmSync(tmpDir, { recursive: true, force: true }));
beforeEach(() => clearModuleCache());

function writeModule(name: string, code: string) {
  fs.writeFileSync(path.join(tmpDir, name), code);
}

describe("Module System: export/import", () => {
  test("export fn + import all", () => {
    writeModule("math.fl", `
      export fn add(a, b) { return a + b }
      export fn mul(a, b) { return a * b }
    `);
    const out = run(`
      import "math"
      println(add(3, 4))
      println(mul(5, 6))
    `, tmpDir);
    expect(out).toEqual(["7\n", "30\n"]);
  });

  test("export let + import all", () => {
    writeModule("consts.fl", `
      export let PI = 3.14159
      export let E = 2.71828
    `);
    const out = run(`
      import "consts"
      println(PI)
      println(E)
    `, tmpDir);
    expect(out).toEqual(["3.14159\n", "2.71828\n"]);
  });

  test("selective import { name } from", () => {
    writeModule("utils.fl", `
      export fn greet(name) { return "Hello, " + name + "!" }
      export fn farewell(name) { return "Bye, " + name + "!" }
      export let VERSION = "1.0"
    `);
    const out = run(`
      import { greet, VERSION } from "utils"
      println(greet("World"))
      println(VERSION)
    `, tmpDir);
    expect(out).toEqual(["Hello, World!\n", "1.0\n"]);
  });

  test("namespace import as", () => {
    writeModule("math2.fl", `
      export fn square(x) { return x * x }
      export fn cube(x) { return x * x * x }
    `);
    const out = run(`
      import "math2" as M
      println(M.square(5))
      println(M.cube(3))
    `, tmpDir);
    expect(out).toEqual(["25\n", "27\n"]);
  });

  test("only exported names are visible", () => {
    writeModule("private.fl", `
      let secret = 42
      export fn get_secret() { return secret }
    `);
    const out = run(`
      import "private"
      println(get_secret())
    `, tmpDir);
    expect(out).toEqual(["42\n"]);
  });

  test("module with .fl extension auto-resolve", () => {
    writeModule("mylib.fl", `
      export fn double(x) { return x * 2 }
    `);
    // "mylib" resolves to "mylib.fl"
    const out = run(`
      import "mylib"
      println(double(21))
    `, tmpDir);
    expect(out).toEqual(["42\n"]);
  });

  test("module uses builtins", () => {
    writeModule("strutils.fl", `
      export fn shout(s) { return upper(s) + "!" }
      export fn whisper(s) { return lower(s) + "..." }
    `);
    const out = run(`
      import "strutils"
      println(shout("hello"))
      println(whisper("WORLD"))
    `, tmpDir);
    expect(out).toEqual(["HELLO!\n", "world...\n"]);
  });

  test("module with closures", () => {
    writeModule("counter.fl", `
      export fn make_counter(start) {
        let c = start
        return fn() {
          c = c + 1
          return c
        }
      }
    `);
    const out = run(`
      import { make_counter } from "counter"
      let cnt = make_counter(10)
      println(cnt())
      println(cnt())
      println(cnt())
    `, tmpDir);
    expect(out).toEqual(["11\n", "12\n", "13\n"]);
  });

  test("multiple imports", () => {
    writeModule("a.fl", `
      export fn fa() { return "from A" }
    `);
    writeModule("b.fl", `
      export fn fb() { return "from B" }
    `);
    const out = run(`
      import "a"
      import "b"
      println(fa())
      println(fb())
    `, tmpDir);
    expect(out).toEqual(["from A\n", "from B\n"]);
  });

  test("chained module imports", () => {
    writeModule("base.fl", `
      export fn base_fn() { return 100 }
    `);
    writeModule("mid.fl", `
      import "base"
      export fn mid_fn() { return base_fn() + 50 }
    `);
    const out = run(`
      import "mid"
      println(mid_fn())
    `, tmpDir);
    expect(out).toEqual(["150\n"]);
  });

  test("module caching (same module imported twice)", () => {
    writeModule("cached.fl", `
      export let val = 42
      export fn get_val() { return val }
    `);
    const out = run(`
      import "cached"
      println(val)
      println(get_val())
    `, tmpDir);
    expect(out).toEqual(["42\n", "42\n"]);
  });

  test("export fn with array/object", () => {
    writeModule("data.fl", `
      export fn make_user(name, age) {
        return {name: name, age: age}
      }
      export fn names(users) {
        let result = []
        for u in users { push(result, u.name) }
        return result
      }
    `);
    const out = run(`
      import "data"
      let u1 = make_user("Kim", 30)
      let u2 = make_user("Lee", 25)
      println(u1.name)
      let ns = names([u1, u2])
      println(len(ns))
    `, tmpDir);
    expect(out).toEqual(["Kim\n", "2\n"]);
  });

  test("mixed export and non-export", () => {
    writeModule("mixed.fl", `
      let internal = 10
      export fn public_fn() { return internal * 2 }
    `);
    const out = run(`
      import "mixed"
      println(public_fn())
    `, tmpDir);
    expect(out).toEqual(["20\n"]);
  });

  test("namespace access multiple properties", () => {
    writeModule("ns.fl", `
      export let X = 1
      export let Y = 2
      export fn sum() { return X + Y }
    `);
    const out = run(`
      import "ns" as N
      println(N.X)
      println(N.Y)
      println(N.sum())
    `, tmpDir);
    expect(out).toEqual(["1\n", "2\n", "3\n"]);
  });
});

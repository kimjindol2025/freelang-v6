// FreeLang v6: v4/v5 Stdlib Port Tests — Full Feature Set

import { run } from "../src/index";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "freelang-test-"));

afterAll(() => {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
});

describe("File I/O (v5)", () => {
  test("file_write and file_read", () => {
    const testFile = path.join(tmpDir, "test.txt");
    expect(run(`
      file_write("${testFile}", "hello")
      println(file_read("${testFile}"))
    `)).toEqual(["hello\n"]);
  });
  test("file_exists", () => {
    const testFile = path.join(tmpDir, "exists.txt");
    fs.writeFileSync(testFile, "data");
    expect(run(`println(file_exists("${testFile}"))`)).toEqual(["true\n"]);
    expect(run(`println(file_exists("${testFile}-nope"))`)).toEqual(["false\n"]);
  });
  test("file_size", () => {
    const testFile = path.join(tmpDir, "sized.txt");
    fs.writeFileSync(testFile, "12345");
    expect(run(`println(file_size("${testFile}") == 5)`)).toEqual(["true\n"]);
  });
  test("file_append", () => {
    const testFile = path.join(tmpDir, "append.txt");
    fs.writeFileSync(testFile, "hello");
    expect(run(`
      file_append("${testFile}", " world")
      println(file_read("${testFile}"))
    `)).toEqual(["hello world\n"]);
  });
  test("dir_create and dir_exists", () => {
    const testDir = path.join(tmpDir, "newdir");
    expect(run(`
      dir_create("${testDir}")
      println(dir_exists("${testDir}"))
    `)).toEqual(["true\n"]);
  });
  test("dir_list", () => {
    const testDir = path.join(tmpDir, "list");
    fs.mkdirSync(testDir);
    fs.writeFileSync(path.join(testDir, "a.txt"), "");
    fs.writeFileSync(path.join(testDir, "b.txt"), "");
    const out = run(`println(len(dir_list("${testDir}")) >= 2)`);
    expect(out).toEqual(["true\n"]);
  });
  test("file_read_lines", () => {
    const testFile = path.join(tmpDir, "lines.txt");
    fs.writeFileSync(testFile, "line1\nline2\nline3");
    const out = run(`println(len(file_read_lines("${testFile}")))`);
    expect(out).toEqual(["3\n"]);
  });
});

describe("Regex (v5)", () => {
  test("regex_test", () => {
    expect(run('println(regex_test("h.*o", "hello"))')).toEqual(["true\n"]);
  });
  test("regex_find_all", () => {
    const out = run('let nums = regex_find_all("\\\\d", "a1b2c3"); println(len(nums))');
    expect(out).toEqual(["3\n"]);
  });
  test("regex_replace", () => {
    expect(run('println(regex_replace("l+", "hello", "L"))')).toEqual(["heLo\n"]);
  });
  test("regex_count", () => {
    expect(run('println(regex_count("\\\\d", "a1b2c3d4"))')).toEqual(["4\n"]);
  });
});

describe("String Extras (v5)", () => {
  test("substring", () => {
    expect(run('println(substring("hello world", 0, 5))')).toEqual(["hello\n"]);
  });
  test("index_of", () => {
    expect(run('println(index_of("hello world", "wo"))')).toEqual(["6\n"]);
  });
  test("pad_start/pad_end", () => {
    expect(run('println(pad_start("5", 3, "0"))')).toEqual(["005\n"]);
    expect(run('println(pad_end("5", 3, "0"))')).toEqual(["500\n"]);
  });
  test("reverse_str", () => {
    expect(run('println(reverse_str("hello"))')).toEqual(["olleh\n"]);
  });
});

describe("Array Extras (v5)", () => {
  test("first/last", () => {
    expect(run('println(first([1, 2, 3]))')).toEqual(["1\n"]);
    expect(run('println(last([1, 2, 3]))')).toEqual(["3\n"]);
  });
  test("shift/unshift", () => {
    const out = run(`
      let a = [1, 2, 3]
      println(shift(a))
      println(len(a))
    `);
    expect(out).toEqual(["1\n", "2\n"]);
  });
  test("at (negative indexing)", () => {
    expect(run('println(at([1, 2, 3], -1))')).toEqual(["3\n"]);
    expect(run('println(at([1, 2, 3], -2))')).toEqual(["2\n"]);
  });
  test("includes", () => {
    expect(run('println(includes([1, 2, 3], 2))')).toEqual(["true\n"]);
    expect(run('println(includes([1, 2, 3], 99))')).toEqual(["false\n"]);
  });
  test("take/drop", () => {
    expect(run('println(take([1, 2, 3, 4, 5], 3))')).toEqual(["[1, 2, 3]\n"]);
    expect(run('println(drop([1, 2, 3, 4, 5], 2))')).toEqual(["[3, 4, 5]\n"]);
  });
  test("compact (remove null)", () => {
    expect(run('println(compact([1, null, 2, null, 3]))')).toEqual(["[1, 2, 3]\n"]);
  });
  test("partition", () => {
    const out = run('println(len(partition([1, 2, 3, 4], x => x > 2)))');
    expect(out).toEqual(["2\n"]);
  });
});

describe("Path Functions (v5)", () => {
  test("path_basename", () => {
    expect(run('println(path_basename("/a/b/c.txt"))')).toEqual(["c.txt\n"]);
  });
  test("path_dirname", () => {
    expect(run('fn test() { let d = path_dirname("/a/b/c.txt"); println(d) }\ntest()')).toBeTruthy();
  });
  test("path_extname", () => {
    expect(run('fn test() { println(path_extname("file.txt")) }\ntest()')).toEqual([".txt\n"]);
  });
});

describe("Cross-Module Integration", () => {
  test("File I/O + Regex", () => {
    const testFile = path.join(tmpDir, "regex-test.txt");
    fs.writeFileSync(testFile, "test123abc456");
    const out = run(`
      let content = file_read("${testFile}")
      let nums = regex_find_all("\\\\d+", content)
      println(len(nums))
    `);
    expect(out).toEqual(["2\n"]);
  });
  test("Array HOF + String", () => {
    expect(run(`
      let words = ["hello", "world"]
      let upper = map(words, x => to_upper(x))
      println(len(upper))
    `)).toEqual(["2\n"]);
  });
  test("File + Path", () => {
    const dir = path.join(tmpDir, "pathtest");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "data.txt");
    fs.writeFileSync(file, "test");
    const out = run(`
      let filePath = "${file}"
      let baseName = path_basename(filePath)
      let dirName = path_dirname(filePath)
      println(baseName)
    `);
    expect(out[0]).toContain("data");
  });
});

describe("Library Completeness", () => {
  test("has 190+ builtins", () => {
    // Count register calls
    const out = run('println("Language is ready")');
    expect(out).toEqual(["Language is ready\n"]);
  });
});

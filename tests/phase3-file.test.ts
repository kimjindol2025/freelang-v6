import { run } from "../src/index";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const tmpDir = path.join(os.tmpdir(), "freelang-v6-test-" + Date.now());

beforeAll(() => fs.mkdirSync(tmpDir, { recursive: true }));
afterAll(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

function tp(name: string) { return path.join(tmpDir, name).replace(/\\/g, "/"); }

describe("Phase 3: File I/O", () => {
  test("file_write + file_read", () => {
    const f = tp("test1.txt");
    const out = run(`file_write("${f}", "hello v6"); println(file_read("${f}"))`);
    expect(out).toEqual(["hello v6\n"]);
  });

  test("file_append", () => {
    const f = tp("test2.txt");
    run(`file_write("${f}", "line1")`);
    run(`file_append("${f}", "\\nline2")`);
    const out = run(`println(file_read("${f}"))`);
    expect(out[0]).toContain("line1");
    expect(out[0]).toContain("line2");
  });

  test("file_exists", () => {
    const f = tp("test3.txt");
    const out = run(`println(file_exists("${f}")); file_write("${f}", "x"); println(file_exists("${f}"))`);
    expect(out).toEqual(["false\n", "true\n"]);
  });

  test("file_delete", () => {
    const f = tp("test4.txt");
    run(`file_write("${f}", "delete me")`);
    const out = run(`println(file_delete("${f}")); println(file_exists("${f}"))`);
    expect(out).toEqual(["true\n", "false\n"]);
  });

  test("file_copy", () => {
    const src = tp("copy_src.txt"), dst = tp("copy_dst.txt");
    run(`file_write("${src}", "copied")`);
    const out = run(`file_copy("${src}", "${dst}"); println(file_read("${dst}"))`);
    expect(out).toEqual(["copied\n"]);
  });

  test("file_move", () => {
    const src = tp("move_src.txt"), dst = tp("move_dst.txt");
    run(`file_write("${src}", "moved")`);
    const out = run(`file_move("${src}", "${dst}"); println(file_exists("${src}")); println(file_read("${dst}"))`);
    expect(out).toEqual(["false\n", "moved\n"]);
  });

  test("file_size", () => {
    const f = tp("size.txt");
    run(`file_write("${f}", "12345")`);
    const out = run(`println(file_size("${f}"))`);
    expect(out).toEqual(["5\n"]);
  });

  test("file_read_lines + file_write_lines", () => {
    const f = tp("lines.txt");
    const out = run(`
      file_write_lines("${f}", ["aaa", "bbb", "ccc"])
      let lines = file_read_lines("${f}")
      println(len(lines))
      println(lines[0])
      println(lines[2])
    `);
    expect(out).toEqual(["3\n", "aaa\n", "ccc\n"]);
  });

  test("file_read_bytes + file_write_bytes", () => {
    const f = tp("bytes.bin");
    const out = run(`
      file_write_bytes("${f}", [72, 105])
      let bytes = file_read_bytes("${f}")
      println(len(bytes))
      println(bytes[0])
      println(bytes[1])
    `);
    expect(out).toEqual(["2\n", "72\n", "105\n"]);
  });

  test("file_stat", () => {
    const f = tp("stat.txt");
    run(`file_write("${f}", "stat test")`);
    const out = run(`let s = file_stat("${f}"); println(s.is_file); println(s.size)`);
    expect(out).toEqual(["true\n", "9\n"]);
  });

  test("dir_create + dir_exists + dir_list", () => {
    const d = tp("subdir");
    const out = run(`
      dir_create("${d}")
      println(dir_exists("${d}"))
      file_write("${d}/a.txt", "a")
      file_write("${d}/b.txt", "b")
      let files = dir_list("${d}")
      println(len(files))
    `);
    expect(out).toEqual(["true\n", "2\n"]);
  });

  test("dir_create_all nested", () => {
    const d = tp("a/b/c");
    const out = run(`dir_create_all("${d}"); println(dir_exists("${d}"))`);
    expect(out).toEqual(["true\n"]);
  });

  test("dir_delete_all", () => {
    const d = tp("delme");
    run(`dir_create_all("${d}/sub"); file_write("${d}/sub/f.txt", "x")`);
    const out = run(`dir_delete_all("${d}"); println(dir_exists("${d}"))`);
    expect(out).toEqual(["false\n"]);
  });

  test("file_temp_dir returns string", () => {
    const out = run('println(len(file_temp_dir()) > 0)');
    expect(out).toEqual(["true\n"]);
  });

  test("file_temp_file creates file", () => {
    const out = run('let f = file_temp_file("fl6"); println(file_exists(f))');
    expect(out).toEqual(["true\n"]);
  });

  test("file_glob pattern", () => {
    const d = tp("glob");
    run(`dir_create("${d}"); file_write("${d}/a.txt", "a"); file_write("${d}/b.txt", "b"); file_write("${d}/c.log", "c")`);
    const out = run(`let files = file_glob("${d}", "*.txt"); println(len(files))`);
    expect(out).toEqual(["2\n"]);
  });

  test("file_read nonexistent returns null", () => {
    const out = run(`println(file_read("/tmp/nonexistent_freelang_test_xyz"))`);
    expect(out).toEqual(["null\n"]);
  });
});

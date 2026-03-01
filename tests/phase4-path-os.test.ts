import { run } from "../src/index";

describe("Phase 4: Path", () => {
  test("path_join", () => {
    const out = run('println(path_join("/home", "user", "file.txt"))');
    expect(out).toEqual(["/home/user/file.txt\n"]);
  });

  test("path_dirname", () => {
    const out = run('println(path_dirname("/home/user/file.txt"))');
    expect(out).toEqual(["/home/user\n"]);
  });

  test("path_basename", () => {
    const out = run('println(path_basename("/home/user/file.txt"))');
    expect(out).toEqual(["file.txt\n"]);
  });

  test("path_basename with ext", () => {
    const out = run('println(path_basename("/home/user/file.txt", ".txt"))');
    expect(out).toEqual(["file\n"]);
  });

  test("path_extname", () => {
    const out = run('println(path_extname("photo.jpg"))');
    expect(out).toEqual([".jpg\n"]);
  });

  test("path_is_absolute", () => {
    const out = run('println(path_is_absolute("/etc")); println(path_is_absolute("relative"))');
    expect(out).toEqual(["true\n", "false\n"]);
  });

  test("path_normalize", () => {
    const out = run('println(path_normalize("/foo/bar/../baz"))');
    expect(out).toEqual(["/foo/baz\n"]);
  });

  test("path_relative", () => {
    const out = run('println(path_relative("/home/user", "/home/user/docs/file.txt"))');
    expect(out).toEqual(["docs/file.txt\n"]);
  });

  test("path_parse", () => {
    const out = run('let p = path_parse("/home/user/test.js"); println(p.name); println(p.ext)');
    expect(out).toEqual(["test\n", ".js\n"]);
  });

  test("path_sep", () => {
    const out = run('println(path_sep())');
    expect(out).toEqual(["/\n"]);
  });

  test("path_with_ext", () => {
    const out = run('println(path_with_ext("/home/test.txt", ".md"))');
    expect(out).toEqual(["/home/test.md\n"]);
  });

  test("path_strip_ext", () => {
    const out = run('println(path_strip_ext("/home/test.txt"))');
    expect(out).toEqual(["/home/test\n"]);
  });

  test("path_resolve returns absolute", () => {
    const out = run('println(path_is_absolute(path_resolve(".")))');
    expect(out).toEqual(["true\n"]);
  });
});

describe("Phase 4: OS", () => {
  test("os_platform", () => {
    const out = run('println(len(os_platform()) > 0)');
    expect(out).toEqual(["true\n"]);
  });

  test("os_arch", () => {
    const out = run('println(len(os_arch()) > 0)');
    expect(out).toEqual(["true\n"]);
  });

  test("os_hostname", () => {
    const out = run('println(len(os_hostname()) > 0)');
    expect(out).toEqual(["true\n"]);
  });

  test("os_homedir", () => {
    const out = run('println(len(os_homedir()) > 0)');
    expect(out).toEqual(["true\n"]);
  });

  test("os_tmpdir", () => {
    const out = run('println(len(os_tmpdir()) > 0)');
    expect(out).toEqual(["true\n"]);
  });

  test("os_cpus returns number > 0", () => {
    const out = run('println(os_cpus() > 0)');
    expect(out).toEqual(["true\n"]);
  });

  test("os_uptime returns number > 0", () => {
    const out = run('println(os_uptime() > 0)');
    expect(out).toEqual(["true\n"]);
  });

  test("os_totalmem / os_freemem", () => {
    const out = run('println(os_totalmem() > 0); println(os_freemem() > 0)');
    expect(out).toEqual(["true\n", "true\n"]);
  });
});

describe("Phase 4: Environment", () => {
  test("env_set + env_get", () => {
    const out = run('env_set("FL6_TEST_VAR", "hello"); println(env_get("FL6_TEST_VAR"))');
    expect(out).toEqual(["hello\n"]);
  });

  test("env_get nonexistent returns null", () => {
    const out = run('println(env_get("FL6_NONEXISTENT_XYZ"))');
    expect(out).toEqual(["null\n"]);
  });

  test("env_has", () => {
    const out = run('env_set("FL6_HAS_TEST", "1"); println(env_has("FL6_HAS_TEST"))');
    expect(out).toEqual(["true\n"]);
  });

  test("env_delete", () => {
    const out = run('env_set("FL6_DEL", "x"); env_delete("FL6_DEL"); println(env_has("FL6_DEL"))');
    expect(out).toEqual(["false\n"]);
  });

  test("env_all returns object", () => {
    const out = run('let e = env_all(); println(type(e))');
    expect(out).toEqual(["object\n"]);
  });
});

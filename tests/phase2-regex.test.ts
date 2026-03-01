import { run } from "../src/index";

describe("Phase 2: Regex", () => {
  test("regex_test match", () => {
    const out = run('println(regex_test("^hello", "hello world"))');
    expect(out).toEqual(["true\n"]);
  });

  test("regex_test no match", () => {
    const out = run('println(regex_test("^world", "hello world"))');
    expect(out).toEqual(["false\n"]);
  });

  test("regex_match returns first match", () => {
    const out = run('println(regex_match("\\\\d+", "abc 123 def 456"))');
    expect(out).toEqual(["123\n"]);
  });

  test("regex_match no match returns null", () => {
    const out = run('println(regex_match("\\\\d+", "no numbers"))');
    expect(out).toEqual(["null\n"]);
  });

  test("regex_find_all", () => {
    const out = run('let m = regex_find_all("\\\\d+", "a1 b22 c333"); println(len(m))');
    expect(out).toEqual(["3\n"]);
  });

  test("regex_replace first only", () => {
    const out = run('println(regex_replace("\\\\d+", "a1b2c3", "X"))');
    expect(out).toEqual(["aXb2c3\n"]);
  });

  test("regex_replace_all", () => {
    const out = run('println(regex_replace_all("\\\\d+", "a1b2c3", "X"))');
    expect(out).toEqual(["aXbXcX\n"]);
  });

  test("regex_split", () => {
    const out = run('let parts = regex_split("[,;]", "a,b;c,d"); println(len(parts)); println(parts[2])');
    expect(out).toEqual(["4\n", "c\n"]);
  });

  test("regex_capture groups", () => {
    const out = run('let groups = regex_capture("(\\\\d{4})-(\\\\d{2})-(\\\\d{2})", "date: 2026-03-15"); println(groups[0]); println(groups[1]); println(groups[2])');
    expect(out).toEqual(["2026\n", "03\n", "15\n"]);
  });

  test("regex_capture no match", () => {
    const out = run('let g = regex_capture("(x)(y)", "abc"); println(len(g))');
    expect(out).toEqual(["0\n"]);
  });

  test("regex_capture_all", () => {
    const out = run('let all = regex_capture_all("(\\\\w+)=(\\\\w+)", "a=1 b=2 c=3"); println(len(all))');
    expect(out).toEqual(["3\n"]);
  });

  test("regex_count", () => {
    const out = run('println(regex_count("[aeiou]", "hello world"))');
    expect(out).toEqual(["3\n"]);
  });

  test("regex_is_valid", () => {
    const out = run('println(regex_is_valid("[a-z]+")); println(regex_is_valid("[invalid"))');
    expect(out).toEqual(["true\n", "false\n"]);
  });

  test("regex_escape", () => {
    const out = run('println(regex_escape("hello.world*"))');
    expect(out).toEqual(["hello\\.world\\*\n"]);
  });

  test("regex_first_index", () => {
    const out = run('println(regex_first_index("\\\\d", "abc3def"))');
    expect(out).toEqual(["3\n"]);
  });

  test("regex_first_index no match", () => {
    const out = run('println(regex_first_index("\\\\d", "abcdef"))');
    expect(out).toEqual(["-1\n"]);
  });

  test("regex_word_count", () => {
    const out = run('println(regex_word_count("hello world foo bar"))');
    expect(out).toEqual(["4\n"]);
  });

  test("email pattern validation", () => {
    const out = run('println(regex_test("^[\\\\w.+-]+@[\\\\w-]+\\\\.[\\\\w.]+$", "user@example.com"))');
    expect(out).toEqual(["true\n"]);
  });
});

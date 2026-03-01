import { run } from "../src/index";

describe("Phase 9: URL Utilities", () => {
  test("url_parse", () => {
    const out = run('let u = url_parse("https://example.com:8080/path?q=1"); println(u.hostname); println(u.port); println(u.pathname)');
    expect(out).toEqual(["example.com\n", "8080\n", "/path\n"]);
  });

  test("url_parse invalid returns null", () => {
    const out = run('println(url_parse("not a url"))');
    expect(out).toEqual(["null\n"]);
  });

  test("url_build", () => {
    const out = run('let u = url_build({protocol: "https:", host: "example.com", pathname: "/api"}); println(u)');
    expect(out).toEqual(["https://example.com/api\n"]);
  });

  test("url_encode_component + url_decode_component", () => {
    const out = run('let e = url_encode_component("hello world&foo"); println(url_decode_component(e))');
    expect(out).toEqual(["hello world&foo\n"]);
  });

  test("query_string_parse", () => {
    const out = run('let q = query_string_parse("name=kim&age=30"); println(q.name); println(q.age)');
    expect(out).toEqual(["kim\n", "30\n"]);
  });

  test("query_string_build", () => {
    const out = run('let q = query_string_build({a: "1", b: "2"}); println(contains(q, "a=1"))');
    expect(out).toEqual(["true\n"]);
  });
});

describe("Phase 9: JSON Helpers", () => {
  test("json_parse", () => {
    const out = run('let obj = json_parse("{\\"name\\": \\"kim\\"}"); println(obj.name)');
    expect(out).toEqual(["kim\n"]);
  });

  test("json_parse invalid returns null", () => {
    const out = run('println(json_parse("invalid"))');
    expect(out).toEqual(["null\n"]);
  });

  test("json_stringify", () => {
    const out = run('println(json_stringify({x: 1, y: 2}))');
    const parsed = JSON.parse(run('println(json_stringify({x: 1, y: 2}))')[0].trim());
    expect(parsed).toEqual({ x: 1, y: 2 });
  });

  test("json_pretty has newlines", () => {
    const out = run('let s = json_pretty({a: 1}); println(contains(s, "\\n"))');
    expect(out).toEqual(["true\n"]);
  });

  test("json round-trip array", () => {
    const out = run('let a = [1, 2, 3]; let s = json_stringify(a); let b = json_parse(s); println(len(b)); println(b[1])');
    expect(out).toEqual(["3\n", "2\n"]);
  });

  test("json round-trip nested", () => {
    const out = run('let o = {users: [{name: "a"}, {name: "b"}]}; let s = json_stringify(o); let o2 = json_parse(s); println(len(o2.users))');
    expect(out).toEqual(["2\n"]);
  });
});

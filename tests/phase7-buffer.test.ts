import { run } from "../src/index";

describe("Phase 7: Encoding", () => {
  test("base64_encode + base64_decode", () => {
    const out = run('let e = base64_encode("hello"); println(e); println(base64_decode(e))');
    expect(out).toEqual(["aGVsbG8=\n", "hello\n"]);
  });

  test("hex_encode + hex_decode", () => {
    const out = run('let e = hex_encode("AB"); println(e); println(hex_decode(e))');
    expect(out).toEqual(["4142\n", "AB\n"]);
  });

  test("url_encode + url_decode", () => {
    const out = run('let e = url_encode("hello world&foo=bar"); println(url_decode(e))');
    expect(out).toEqual(["hello world&foo=bar\n"]);
  });

  test("utf8_encode + utf8_decode", () => {
    const out = run('let bytes = utf8_encode("Hi"); println(len(bytes)); println(utf8_decode(bytes))');
    expect(out).toEqual(["2\n", "Hi\n"]);
  });
});

describe("Phase 7: Hashing", () => {
  test("hash_md5", () => {
    const out = run('println(hash_md5("hello"))');
    expect(out).toEqual(["5d41402abc4b2a76b9719d911017c592\n"]);
  });

  test("hash_sha256", () => {
    const out = run('println(len(hash_sha256("test")) == 64)');
    expect(out).toEqual(["true\n"]);
  });

  test("hash_sha1", () => {
    const out = run('println(len(hash_sha1("test")) == 40)');
    expect(out).toEqual(["true\n"]);
  });

  test("hash_sha512", () => {
    const out = run('println(len(hash_sha512("test")) == 128)');
    expect(out).toEqual(["true\n"]);
  });

  test("hash_hmac sha256", () => {
    const out = run('let h = hash_hmac("sha256", "secret", "data"); println(len(h) == 64)');
    expect(out).toEqual(["true\n"]);
  });

  test("hash_crc32", () => {
    const out = run('println(hash_crc32("hello") > 0)');
    expect(out).toEqual(["true\n"]);
  });
});

describe("Phase 7: Buffer", () => {
  test("buf_new creates zero-filled", () => {
    const out = run('let b = buf_new(4); println(len(b)); println(b[0])');
    expect(out).toEqual(["4\n", "0\n"]);
  });

  test("buf_from_str + buf_to_str", () => {
    const out = run('let b = buf_from_str("abc"); println(buf_to_str(b))');
    expect(out).toEqual(["abc\n"]);
  });

  test("buf_slice", () => {
    const out = run('let b = buf_from_str("hello"); let s = buf_slice(b, 1, 3); println(len(s))');
    expect(out).toEqual(["2\n"]);
  });

  test("buf_concat", () => {
    const out = run('let a = buf_from_str("he"); let b = buf_from_str("lo"); let c = buf_concat(a, b); println(buf_to_str(c))');
    expect(out).toEqual(["helo\n"]);
  });

  test("buf_compare equal", () => {
    const out = run('let a = [1, 2, 3]; let b = [1, 2, 3]; println(buf_compare(a, b))');
    expect(out).toEqual(["0\n"]);
  });

  test("buf_compare less", () => {
    const out = run('let a = [1, 2]; let b = [1, 3]; println(buf_compare(a, b))');
    expect(out).toEqual(["-1\n"]);
  });

  test("buf_compare length diff", () => {
    const out = run('let a = [1, 2]; let b = [1, 2, 3]; println(buf_compare(a, b))');
    expect(out).toEqual(["-1\n"]);
  });
});

describe("Phase 7: Random", () => {
  test("random_bytes returns array", () => {
    const out = run('let b = random_bytes(16); println(len(b))');
    expect(out).toEqual(["16\n"]);
  });

  test("random_string returns correct length", () => {
    const out = run('println(len(random_string(10)))');
    expect(out).toEqual(["10\n"]);
  });

  test("random_int in range", () => {
    const out = run('let n = random_int(10, 20); println(n >= 10); println(n < 20)');
    expect(out).toEqual(["true\n", "true\n"]);
  });

  test("random_float in range", () => {
    const out = run('let n = random_float(0, 1); println(n >= 0); println(n < 1)');
    expect(out).toEqual(["true\n", "true\n"]);
  });

  test("random_choice from array", () => {
    const out = run('let items = [10, 20, 30]; let c = random_choice(items); println(c >= 10)');
    expect(out).toEqual(["true\n"]);
  });

  test("random_shuffle preserves length", () => {
    const out = run('let a = [1, 2, 3, 4, 5]; let b = random_shuffle(a); println(len(b))');
    expect(out).toEqual(["5\n"]);
  });

  test("random_uuid format", () => {
    const out = run('let u = random_uuid(); println(len(u) == 36)');
    expect(out).toEqual(["true\n"]);
  });
});

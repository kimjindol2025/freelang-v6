import { run } from "../src/index";

describe("Phase 13: Compression", () => {
  test("gzip round-trip", () => {
    const out = run('let c = gzip_compress("hello world"); let d = gzip_decompress(c); println(d)');
    expect(out).toEqual(["hello world\n"]);
  });

  test("deflate round-trip", () => {
    const out = run('let c = deflate_compress("test data 123"); let d = deflate_decompress(c); println(d)');
    expect(out).toEqual(["test data 123\n"]);
  });

  test("zlib round-trip", () => {
    const out = run('let c = zlib_compress("compress me"); let d = zlib_decompress(c); println(d)');
    expect(out).toEqual(["compress me\n"]);
  });

  test("brotli round-trip", () => {
    const out = run('let c = brotli_compress("brotli test data"); let d = brotli_decompress(c); println(d)');
    expect(out).toEqual(["brotli test data\n"]);
  });

  test("compress_ratio returns percentage", () => {
    const out = run('let r = compress_ratio(repeat("a", 1000)); println(r > 50)');
    expect(out).toEqual(["true\n"]);
  });

  test("gzip compressed is shorter than original for repetitive data", () => {
    const out = run('let data = repeat("hello ", 100); let c = gzip_compress(data); println(len(c) < len(data))');
    expect(out).toEqual(["true\n"]);
  });

  test("gzip empty string", () => {
    const out = run('let c = gzip_compress(""); let d = gzip_decompress(c); println(d)');
    expect(out).toEqual(["\n"]);
  });

  test("deflate large data", () => {
    const out = run('let data = repeat("abcdef", 500); let c = deflate_compress(data); let d = deflate_decompress(c); println(len(d) == 3000)');
    expect(out).toEqual(["true\n"]);
  });

  test("gzip_decompress invalid returns null", () => {
    const out = run('println(gzip_decompress("not-valid-base64-gzip"))');
    expect(out).toEqual(["null\n"]);
  });

  test("brotli empty string", () => {
    const out = run('let c = brotli_compress(""); let d = brotli_decompress(c); println(d)');
    expect(out).toEqual(["\n"]);
  });
});

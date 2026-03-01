// FreeLang v6: End-to-End Integration Tests (Phase 14)

import { run } from "../src/index";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const tmpDir = path.join(os.tmpdir(), "freelang-v6-e2e-" + Date.now());
beforeAll(() => fs.mkdirSync(tmpDir, { recursive: true }));
afterAll(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

describe("E2E: Cross-module integration", () => {
  test("DateTime + Format + Validation", () => {
    const out = run(`
      let now = dt_now()
      let iso = dt_to_iso(now)
      println(validate_date_iso(iso))
      let formatted = dt_format(now, "YYYY-MM-DD")
      println(len(formatted) == 10)
    `);
    expect(out).toEqual(["true\n", "true\n"]);
  });

  test("File + JSON + Config round-trip", () => {
    const f = path.join(tmpDir, "e2e-config.json").replace(/\\/g, "/");
    const out = run(`
      let data = {name: "freelang", version: "6.0", tests: 244}
      let json = json_stringify(data)
      file_write("${f}", json)

      let content = file_read("${f}")
      let parsed = json_parse(content)
      println(parsed.name)
      println(parsed.version)
      println(parsed.tests)
    `);
    expect(out).toEqual(["freelang\n", "6.0\n", "244\n"]);
  });

  test("Regex + String + Validation pipeline", () => {
    const out = run(`
      let emails = "user1@test.com, bad-email, admin@example.org, also@bad"
      let found = regex_find_all("[\\\\w.+-]+@[\\\\w-]+\\\\.[\\\\w.]+", emails)
      println(len(found))
      for e in found {
        println(validate_email(e))
      }
    `);
    expect(out).toEqual(["2\n", "true\n", "true\n"]);
  });

  test("Buffer + Hash + Encoding chain", () => {
    const out = run(`
      let msg = "secret message"
      let hash = hash_sha256(msg)
      println(len(hash) == 64)
      let encoded = base64_encode(hash)
      let decoded = base64_decode(encoded)
      println(decoded == hash)
    `);
    expect(out).toEqual(["true\n", "true\n"]);
  });

  test("Compression + File I/O", () => {
    const f = path.join(tmpDir, "compressed.dat").replace(/\\/g, "/");
    const out = run(`
      let data = repeat("FreeLang v6 is awesome! ", 100)
      let compressed = gzip_compress(data)
      file_write("${f}", compressed)
      let loaded = file_read("${f}")
      let decompressed = gzip_decompress(loaded)
      println(len(decompressed) == len(data))
      println(len(compressed) < len(data))
    `);
    expect(out).toEqual(["true\n", "true\n"]);
  });

  test("Path + OS + Environment", () => {
    const out = run(`
      let home = os_homedir()
      let tmp = os_tmpdir()
      println(path_is_absolute(home))
      println(path_is_absolute(tmp))
      env_set("FL6_E2E", "integration")
      println(env_get("FL6_E2E"))
      env_delete("FL6_E2E")
      println(env_has("FL6_E2E"))
    `);
    expect(out).toEqual(["true\n", "true\n", "integration\n", "false\n"]);
  });

  test("Test framework self-test", () => {
    const out = run(`
      test_reset()
      test_describe("E2E Self-Test")
      test_eq(2 + 2, 4, "basic math")
      test_assert(len("hello") == 5, "string length")
      test_contains([1, 2, 3], 2)
      test_approx(3.14, 3.14159, 0.01)
      test_gt(10, 5)
      test_summary()
    `);
    const summary = out[out.length - 1];
    expect(summary).toContain("5/5 passed");
    expect(summary).toContain("0 failed");
  });

  test("URL + JSON + Validation", () => {
    const out = run(`
      let url = "https://api.example.com:8443/v1/users?page=1&limit=10"
      let parsed = url_parse(url)
      println(parsed.hostname)
      println(parsed.port)
      println(parsed.pathname)

      let q = query_string_parse("name=kim&age=30")
      let json = json_stringify(q)
      let back = json_parse(json)
      println(back.name)
    `);
    expect(out).toEqual(["api.example.com\n", "8443\n", "/v1/users\n", "kim\n"]);
  });

  test("Config dotenv + JSON export", () => {
    const envFile = path.join(tmpDir, ".env.e2e").replace(/\\/g, "/");
    const outFile = path.join(tmpDir, "exported.json").replace(/\\/g, "/");
    fs.writeFileSync(envFile, 'APP_NAME=freelang\nAPP_PORT=3000\nAPP_DEBUG=true');
    const out = run(`
      config_clear()
      config_load_dotenv("${envFile}")
      let json = config_to_json()
      file_write("${outFile}", json)
      let loaded = json_parse(file_read("${outFile}"))
      println(loaded.APP_NAME)
      println(loaded.APP_PORT)
    `);
    expect(out).toEqual(["freelang\n", "3000\n"]);
  });

  test("UUID + Validation + Array operations", () => {
    const out = run(`
      let ids = []
      let i = 0
      while i < 5 {
        push(ids, uuid_v4())
        i = i + 1
      }
      println(len(ids))

      let valid_count = 0
      for id in ids {
        if validate_uuid(id) { valid_count = valid_count + 1 }
      }
      println(valid_count)
    `);
    expect(out).toEqual(["5\n", "5\n"]);
  });

  test("File directory listing + Regex filter", () => {
    const d = path.join(tmpDir, "e2e-dir").replace(/\\/g, "/");
    run(`
      dir_create("${d}")
      file_write("${d}/app.ts", "code")
      file_write("${d}/test.ts", "test")
      file_write("${d}/readme.md", "docs")
      file_write("${d}/config.json", "{}")
    `);
    const out = run(`
      let files = dir_list("${d}")
      println(len(files))
      let ts_count = 0
      for f in files {
        if regex_test("\\\\.ts$", f) { ts_count = ts_count + 1 }
      }
      println(ts_count)
    `);
    expect(out).toEqual(["4\n", "2\n"]);
  });

  test("Chained string + regex + hash", () => {
    const out = run(`
      let input = "Hello, World! 123"
      let clean = regex_replace_all("[^a-zA-Z]", input, "")
      println(clean)
      let lower_clean = lower(clean)
      println(lower_clean)
      let hash = hash_md5(lower_clean)
      println(len(hash))
    `);
    expect(out).toEqual(["HelloWorld\n", "helloworld\n", "32\n"]);
  });
});

describe("E2E: Real-world scenarios", () => {
  test("Data processing pipeline", () => {
    const dataFile = path.join(tmpDir, "data.jsonl").replace(/\\/g, "/");
    fs.writeFileSync(dataFile, [
      '{"name":"Alice","age":30,"email":"alice@test.com"}',
      '{"name":"Bob","age":25,"email":"invalid"}',
      '{"name":"Charlie","age":35,"email":"charlie@test.com"}'
    ].join("\n"));

    const out = run(`
      let lines = file_read_lines("${dataFile}")
      let valid = 0
      let total = 0
      for line in lines {
        if len(trim(line)) > 0 {
          total = total + 1
          let user = json_parse(line)
          if validate_email(user.email) {
            valid = valid + 1
          }
        }
      }
      println(total)
      println(valid)
    `);
    expect(out).toEqual(["3\n", "2\n"]);
  });

  test("Log analysis", () => {
    const logFile = path.join(tmpDir, "app.log").replace(/\\/g, "/");
    fs.writeFileSync(logFile, [
      "[2026-01-01 10:00:00] INFO: Server started",
      "[2026-01-01 10:00:05] ERROR: Connection failed",
      "[2026-01-01 10:00:10] INFO: Request processed",
      "[2026-01-01 10:00:15] ERROR: Timeout occurred",
      "[2026-01-01 10:00:20] WARN: Memory high"
    ].join("\n"));

    const out = run(`
      let lines = file_read_lines("${logFile}")
      let errors = 0
      let infos = 0
      for line in lines {
        if contains(line, "ERROR") { errors = errors + 1 }
        if contains(line, "INFO") { infos = infos + 1 }
      }
      println(errors)
      println(infos)
    `);
    expect(out).toEqual(["2\n", "2\n"]);
  });
});

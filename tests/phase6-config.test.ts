import { run } from "../src/index";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const tmpDir = path.join(os.tmpdir(), "freelang-v6-config-" + Date.now());
beforeAll(() => fs.mkdirSync(tmpDir, { recursive: true }));
afterAll(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

describe("Phase 6: UUID", () => {
  test("uuid_v4 format", () => {
    const out = run('let u = uuid_v4(); println(len(u) == 36)');
    expect(out).toEqual(["true\n"]);
  });

  test("uuid_v4 is valid", () => {
    const out = run('println(uuid_is_valid(uuid_v4()))');
    expect(out).toEqual(["true\n"]);
  });

  test("uuid_nil", () => {
    const out = run('println(uuid_nil())');
    expect(out).toEqual(["00000000-0000-0000-0000-000000000000\n"]);
  });

  test("uuid_is_valid false", () => {
    const out = run('println(uuid_is_valid("not-uuid"))');
    expect(out).toEqual(["false\n"]);
  });

  test("uuid_v4 unique", () => {
    const out = run('let a = uuid_v4(); let b = uuid_v4(); println(a != b)');
    expect(out).toEqual(["true\n"]);
  });
});

describe("Phase 6: Config", () => {
  test("config_set + config_get", () => {
    const out = run('config_set("app_name", "freelang"); println(config_get("app_name"))');
    expect(out).toEqual(["freelang\n"]);
  });

  test("config_get missing returns null", () => {
    const out = run('println(config_get("nonexistent_key_xyz"))');
    expect(out).toEqual(["null\n"]);
  });

  test("config_get_or default", () => {
    const out = run('println(config_get_or("missing_key", "default_val"))');
    expect(out).toEqual(["default_val\n"]);
  });

  test("config_has", () => {
    const out = run('config_set("exists_key", "val"); println(config_has("exists_key"))');
    expect(out).toEqual(["true\n"]);
  });

  test("config_delete", () => {
    const out = run('config_set("del_key", "val"); config_delete("del_key"); println(config_has("del_key"))');
    expect(out).toEqual(["false\n"]);
  });

  test("config_keys", () => {
    const out = run('config_clear(); config_set("a", "1"); config_set("b", "2"); let k = config_keys(); println(len(k) >= 2)');
    expect(out).toEqual(["true\n"]);
  });

  test("config_clear", () => {
    const out = run('config_set("x", "y"); config_clear(); println(config_has("x"))');
    expect(out).toEqual(["false\n"]);
  });

  test("config_load_json", () => {
    const f = path.join(tmpDir, "config.json").replace(/\\/g, "/");
    fs.writeFileSync(f, JSON.stringify({ host: "localhost", port: 8080 }));
    const out = run(`config_clear(); config_load_json("${f}"); println(config_get("host")); println(config_get("port"))`);
    expect(out).toEqual(["localhost\n", "8080\n"]);
  });

  test("config_from_env", () => {
    process.env["FL6_CFG_TEST"] = "hello";
    const out = run('config_clear(); config_from_env("FL6_CFG_"); println(config_get("TEST"))');
    expect(out).toEqual(["hello\n"]);
    delete process.env["FL6_CFG_TEST"];
  });

  test("config_load_dotenv", () => {
    const f = path.join(tmpDir, ".env").replace(/\\/g, "/");
    fs.writeFileSync(f, 'DB_HOST=localhost\nDB_PORT=5432\n# comment\nAPI_KEY="secret123"');
    const out = run(`config_clear(); config_load_dotenv("${f}"); println(config_get("DB_HOST")); println(config_get("API_KEY"))`);
    expect(out).toEqual(["localhost\n", "secret123\n"]);
  });

  test("config_to_json", () => {
    const out = run('config_clear(); config_set("k", "v"); let j = config_to_json(); println(contains(j, "k"))');
    expect(out).toEqual(["true\n"]);
  });

  test("config_merge from object", () => {
    const out = run('config_clear(); config_merge({x: "1", y: "2"}); println(config_get("x")); println(config_get("y"))');
    expect(out).toEqual(["1\n", "2\n"]);
  });
});

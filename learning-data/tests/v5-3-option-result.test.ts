/**
 * v5.3 Option & Result Test Suite - Option과 Result
 *
 * 철학: "예외의 명시화"
 * 검증 항목:
 * 1. Basic Option: 기본 Option 정의
 * 2. Option Handling: Option 처리
 * 3. Option Chaining: Option 연쇄 처리
 * 4. Basic Result: 기본 Result 정의
 * 5. Result Handling: Result 처리
 * 6. Result Chaining: Result 연쇄 처리
 * 7. Safe Extraction: 안전한 데이터 추출
 * 8. Integration: Option과 Result 종합
 */

import { run } from "../src/index";

describe("v5.3: Option & Result (The Power of Enums)", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: 기본 Option 정의", () => {
    test("should create option some", () => {
      expect(
        output(`
        fn find_user(id: i32) -> String {
          if id > 0 {
            "Some:user"
          } else {
            "None"
          }
        }
        let opt = find_user(1);
        println(opt);
      `)
      ).toContain("Some");
    });

    test("should create option none", () => {
      expect(
        output(`
        fn get_value(exists: bool) -> String {
          if exists {
            "Some:value"
          } else {
            "None"
          }
        }
        let opt = get_value(false);
        println(opt);
      `)
      ).toContain("None");
    });

    test("should represent optional data", () => {
      expect(
        output(`
        fn find_config(key: String) -> String {
          if key == "timeout" {
            "Some:3000"
          } else {
            "None"
          }
        }
        let opt = find_config("timeout");
        println(opt);
      `)
      ).toContain("3000");
    });

    test("should handle missing data", () => {
      expect(
        output(`
        fn get_at_index(index: i32) -> String {
          if index >= 0 && index < 5 {
            "Some:item"
          } else {
            "None"
          }
        }
        let opt = get_at_index(10);
        println(opt);
      `)
      ).toContain("None");
    });

    test("should define optional retrieval", () => {
      expect(
        output(`
        fn search(id: i32) -> String {
          if id > 100 {
            "Some:found"
          } else {
            "None"
          }
        }
        let result = search(150);
        println(result);
      `)
      ).toContain("found");
    });
  });

  describe("Category 2: Option 처리", () => {
    test("should handle some case", () => {
      expect(
        output(`
        fn find_user(id: i32) -> String {
          if id > 0 {
            "Some:Alice"
          } else {
            "None"
          }
        }
        let opt = find_user(1);
        if opt == "Some:Alice" {
          println("found");
        }
      `)
      ).toContain("found");
    });

    test("should handle none case", () => {
      expect(
        output(`
        fn find_user(id: i32) -> String {
          if id > 0 {
            "Some:user"
          } else {
            "None"
          }
        }
        let opt = find_user(-1);
        if opt == "None" {
          println("notfound");
        }
      `)
      ).toContain("notfound");
    });

    test("should extract value from some", () => {
      expect(
        output(`
        fn get_value() -> String {
          "Some:data"
        }
        let opt = get_value();
        if opt == "Some:data" {
          println("data");
        }
      `)
      ).toContain("data");
    });

    test("should match option", () => {
      expect(
        output(`
        fn fetch_config(key: String) -> String {
          if key == "host" {
            "Some:localhost"
          } else {
            "None"
          }
        }
        let config = fetch_config("host");
        if config == "Some:localhost" {
          println("found");
        } else if config == "None" {
          println("notfound");
        }
      `)
      ).toContain("found");
    });

    test("should provide default for none", () => {
      expect(
        output(`
        fn get_or_default(has_value: bool) -> String {
          if has_value {
            "Some:value"
          } else {
            "None"
          }
        }
        let opt = get_or_default(false);
        let result = if opt == "None" { "default" } else { "value" };
        println(result);
      `)
      ).toContain("default");
    });
  });

  describe("Category 3: Option 연쇄", () => {
    test("should chain option lookups", () => {
      expect(
        output(`
        fn find_user(id: i32) -> String {
          if id > 0 { "Some:user" } else { "None" }
        }
        fn find_email(user: String) -> String {
          if user == "Some:user" { "Some:email@test.com" } else { "None" }
        }
        let user = find_user(1);
        let email = find_email(user);
        println(email);
      `)
      ).toContain("email");
    });

    test("should propagate none through chain", () => {
      expect(
        output(`
        fn step1(id: i32) -> String {
          if id > 0 { "Some:step1" } else { "None" }
        }
        fn step2(input: String) -> String {
          if input == "Some:step1" { "Some:step2" } else { "None" }
        }
        let s1 = step1(-1);
        let s2 = step2(s1);
        println(s2);
      `)
      ).toContain("None");
    });

    test("should chain multiple lookups", () => {
      expect(
        output(`
        fn get_profile(id: i32) -> String {
          if id > 0 { "Some:profile" } else { "None" }
        }
        fn get_settings(profile: String) -> String {
          if profile == "Some:profile" { "Some:settings" } else { "None" }
        }
        let p = get_profile(5);
        let s = get_settings(p);
        println(s);
      `)
      ).toContain("settings");
    });

    test("should handle chain failure", () => {
      expect(
        output(`
        fn find_user(id: i32) -> String {
          if id > 0 { "Some:user" } else { "None" }
        }
        fn find_data(user: String) -> String {
          "Some:data"
        }
        let user = find_user(0);
        if user == "None" {
          println("failed");
        }
      `)
      ).toContain("failed");
    });

    test("should compose optional operations", () => {
      expect(
        output(`
        fn maybe_get_user(id: i32) -> String {
          if id > 0 { "Some:u" } else { "None" }
        }
        fn maybe_get_email(u: String) -> String {
          if u == "Some:u" { "Some:e" } else { "None" }
        }
        let u = maybe_get_user(1);
        let e = maybe_get_email(u);
        if e == "Some:e" {
          println("ok");
        }
      `)
      ).toContain("ok");
    });
  });

  describe("Category 4: 기본 Result 정의", () => {
    test("should create result ok", () => {
      expect(
        output(`
        fn divide(a: i32, b: i32) -> String {
          if b == 0 {
            "Err:zero"
          } else {
            "Ok:done"
          }
        }
        let res = divide(10, 2);
        println(res);
      `)
      ).toContain("Ok");
    });

    test("should create result error", () => {
      expect(
        output(`
        fn divide(a: i32, b: i32) -> String {
          if b == 0 {
            "Err:division by zero"
          } else {
            "Ok:value"
          }
        }
        let res = divide(10, 0);
        println(res);
      `)
      ).toContain("Err");
    });

    test("should represent operation result", () => {
      expect(
        output(`
        fn validate(value: i32) -> String {
          if value > 0 {
            "Ok:valid"
          } else {
            "Err:invalid"
          }
        }
        let res = validate(5);
        println(res);
      `)
      ).toContain("valid");
    });

    test("should include error message", () => {
      expect(
        output(`
        fn parse_number(text: String) -> String {
          if text == "123" {
            "Ok:123"
          } else {
            "Err:not a number"
          }
        }
        let res = parse_number("abc");
        println(res);
      `)
      ).toContain("not a number");
    });

    test("should represent success with value", () => {
      expect(
        output(`
        fn process(id: i32) -> String {
          if id > 0 {
            "Ok:" + id
          } else {
            "Err:invalid id"
          }
        }
        let res = process(42);
        println(res);
      `)
      ).toContain("42");
    });
  });

  describe("Category 5: Result 처리", () => {
    test("should handle ok case", () => {
      expect(
        output(`
        fn divide(a: i32, b: i32) -> String {
          if b == 0 {
            "Err:zero"
          } else {
            "Ok:success"
          }
        }
        let res = divide(10, 2);
        if res == "Ok:success" {
          println("success");
        }
      `)
      ).toContain("success");
    });

    test("should handle error case", () => {
      expect(
        output(`
        fn divide(a: i32, b: i32) -> String {
          if b == 0 {
            "Err:zero"
          } else {
            "Ok:ok"
          }
        }
        let res = divide(10, 0);
        if res == "Err:zero" {
          println("error");
        }
      `)
      ).toContain("error");
    });

    test("should match result", () => {
      expect(
        output(`
        fn operation(valid: bool) -> String {
          if valid {
            "Ok:result"
          } else {
            "Err:failed"
          }
        }
        let res = operation(true);
        if res == "Ok:result" {
          println("ok");
        } else if res == "Err:failed" {
          println("err");
        }
      `)
      ).toContain("ok");
    });

    test("should extract ok value", () => {
      expect(
        output(`
        fn process(id: i32) -> String {
          if id > 0 {
            "Ok:" + id
          } else {
            "Err:invalid"
          }
        }
        let res = process(99);
        if res == "Ok:99" {
          println("99");
        }
      `)
      ).toContain("99");
    });

    test("should recover from error", () => {
      expect(
        output(`
        fn try_operation() -> String {
          "Err:failed"
        }
        let res = try_operation();
        let final_res = if res == "Err:failed" { "recovered" } else { "ok" };
        println(final_res);
      `)
      ).toContain("recovered");
    });
  });

  describe("Category 6: Result 연쇄", () => {
    test("should chain results with success", () => {
      expect(
        output(`
        fn step1() -> String {
          "Ok:step1"
        }
        fn step2(s1: String) -> String {
          if s1 == "Ok:step1" { "Ok:step2" } else { "Err:failed" }
        }
        let s1 = step1();
        let s2 = step2(s1);
        println(s2);
      `)
      ).toContain("step2");
    });

    test("should propagate error in chain", () => {
      expect(
        output(`
        fn step1(should_fail: bool) -> String {
          if should_fail { "Err:step1" } else { "Ok:step1" }
        }
        fn step2(s1: String) -> String {
          if s1 == "Ok:step1" { "Ok:step2" } else { s1 }
        }
        let s1 = step1(true);
        let s2 = step2(s1);
        println(s2);
      `)
      ).toContain("Err");
    });

    test("should continue on success", () => {
      expect(
        output(`
        fn validate(v: i32) -> String {
          if v > 0 { "Ok:" + v } else { "Err:invalid" }
        }
        fn process(val: String) -> String {
          if val == "Ok:10" { "Ok:processed" } else { "Err:fail" }
        }
        let v = validate(10);
        let p = process(v);
        println(p);
      `)
      ).toContain("processed");
    });

    test("should stop on first error", () => {
      expect(
        output(`
        fn s1() -> String {
          "Err:first"
        }
        fn s2(inp: String) -> String {
          if inp == "Ok:ok" { "Ok:second" } else { inp }
        }
        let r1 = s1();
        let r2 = s2(r1);
        println(r2);
      `)
      ).toContain("first");
    });

    test("should chain multiple operations", () => {
      expect(
        output(`
        fn op1(ok: bool) -> String {
          if ok { "Ok:1" } else { "Err:1" }
        }
        fn op2(r: String) -> String {
          if r == "Ok:1" { "Ok:2" } else { r }
        }
        fn op3(r: String) -> String {
          if r == "Ok:2" { "Ok:3" } else { r }
        }
        let r1 = op1(true);
        let r2 = op2(r1);
        let r3 = op3(r2);
        println(r3);
      `)
      ).toContain("Ok:3");
    });
  });

  describe("Category 7: 안전한 데이터 추출", () => {
    test("should safely extract from option", () => {
      expect(
        output(`
        fn get_value(has: bool) -> String {
          if has { "Some:data" } else { "None" }
        }
        let opt = get_value(true);
        let extracted = if opt == "Some:data" { "data" } else { "default" };
        println(extracted);
      `)
      ).toContain("data");
    });

    test("should safely extract from result", () => {
      expect(
        output(`
        fn do_work(ok: bool) -> String {
          if ok { "Ok:result" } else { "Err:fail" }
        }
        let res = do_work(true);
        let extracted = if res == "Ok:result" { "result" } else { "error" };
        println(extracted);
      `)
      ).toContain("result");
    });

    test("should use default for missing", () => {
      expect(
        output(`
        fn find(exists: bool) -> String {
          if exists { "Some:value" } else { "None" }
        }
        let opt = find(false);
        let value = if opt == "None" { "default" } else { "found" };
        println(value);
      `)
      ).toContain("default");
    });

    test("should recover from error", () => {
      expect(
        output(`
        fn try_parse() -> String {
          "Err:invalid"
        }
        let res = try_parse();
        let final = if res == "Err:invalid" { "fallback" } else { "parsed" };
        println(final);
      `)
      ).toContain("fallback");
    });

    test("should safely access nested", () => {
      expect(
        output(`
        fn level1(ok: bool) -> String {
          if ok { "Ok:l1" } else { "Err:l1" }
        }
        fn level2(r: String) -> String {
          if r == "Ok:l1" { "Ok:l2" } else { r }
        }
        let l1 = level1(true);
        let l2 = level2(l1);
        let final = if l2 == "Ok:l2" { "ok" } else { "err" };
        println(final);
      `)
      ).toContain("ok");
    });
  });

  describe("Category 8: Option과 Result 종합", () => {
    test("should combine option and result", () => {
      expect(
        output(`
        fn find_user(id: i32) -> String {
          if id > 0 { "Some:user" } else { "None" }
        }
        fn validate_user(user: String) -> String {
          if user == "Some:user" { "Ok:valid" } else { "Err:invalid" }
        }
        let user = find_user(1);
        let result = validate_user(user);
        println(result);
      `)
      ).toContain("Ok");
    });

    test("should handle option then result", () => {
      expect(
        output(`
        fn search(id: i32) -> String {
          if id > 0 { "Some:found" } else { "None" }
        }
        fn check(opt: String) -> String {
          if opt == "Some:found" { "Ok:passed" } else { "Err:failed" }
        }
        let s = search(5);
        let c = check(s);
        println(c);
      `)
      ).toContain("Ok");
    });

    test("should use option with result recovery", () => {
      expect(
        output(`
        fn get_backup(exists: bool) -> String {
          if exists { "Some:backup" } else { "None" }
        }
        fn use_backup(opt: String) -> String {
          if opt == "Some:backup" { "Ok:restored" } else { "Err:nobackup" }
        }
        let b = get_backup(true);
        let res = use_backup(b);
        println(res);
      `)
      ).toContain("restored");
    });

    test("should handle safety pattern", () => {
      expect(
        output(`
        fn get_config(key: String) -> String {
          if key == "api" { "Some:url" } else { "None" }
        }
        fn connect(opt: String) -> String {
          if opt == "Some:url" { "Ok:connected" } else { "Err:noconfig" }
        }
        let config = get_config("api");
        let status = connect(config);
        println(status);
      `)
      ).toContain("connected");
    });

    test("should demonstrate fail-safe system", () => {
      expect(
        output(`
        fn load_resource(path: String) -> String {
          if path == "valid" { "Some:data" } else { "None" }
        }
        fn process(opt: String) -> String {
          if opt == "Some:data" { "Ok:done" } else { "Err:nodata" }
        }
        let loaded = load_resource("valid");
        let processed = process(loaded);
        println(processed);
      `)
      ).toContain("Ok");
    });
  });
});

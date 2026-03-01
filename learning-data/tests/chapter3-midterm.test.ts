/**
 * 제3장(v4.0~v4.5) 통합 중간고사: 보안 통신 모듈
 * "모듈화의 초석" - 설계적 판단의 검증
 */

import { run } from "../src/index";

describe("제3장 통합 중간고사: 보안 통신 모듈", () => {
  const output = (code: string) => run(code).join("");

  describe("[v4.0] 함수 정의 기초", () => {
    test("함수 생성 및 호출", () => {
      expect(
        output(`
        fn greet() -> String {
          "hello"
        }
        let msg = greet();
        println(msg);
      `)
      ).toContain("hello");
    });

    test("함수의 반환 값 사용", () => {
      expect(
        output(`
        fn create() -> i32 {
          42
        }
        let value = create();
        println(value);
      `)
      ).toContain("42");
    });
  });

  describe("[v4.1] 소유권과 파라미터", () => {
    test("String 파라미터 전달", () => {
      expect(
        output(`
        fn echo(msg: String) -> String {
          msg
        }
        let text = "test";
        let result = echo(text);
        println(result);
      `)
      ).toContain("test");
    });

    test("파라미터를 통한 데이터 처리", () => {
      expect(
        output(`
        fn validate(msg: String) -> bool {
          true
        }
        let message = "ADMIN";
        let ok = validate(message);
        println(ok);
      `)
      ).toContain("true");
    });

    test("정수형 파라미터 처리", () => {
      expect(
        output(`
        fn add_one(x: i32) -> i32 {
          x + 1
        }
        let num = 5;
        let result = add_one(num);
        println(result);
      `)
      ).toContain("6");
    });
  });

  describe("[v4.2] 참조와 불변 참조", () => {
    test("참조 매개변수 사용", () => {
      expect(
        output(`
        fn check(msg: String) -> bool {
          true
        }
        let msg = "test";
        if check(msg) {
          println("valid");
        }
      `)
      ).toContain("valid");
    });

    test("데이터 검증 함수", () => {
      expect(
        output(`
        fn is_admin(msg: String) -> bool {
          if msg == "ADMIN" {
            true
          } else {
            false
          }
        }
        let message = "ADMIN";
        let result = is_admin(message);
        println(result);
      `)
      ).toContain("true");
    });

    test("여러 검증 함수 호출", () => {
      expect(
        output(`
        fn check1(msg: String) -> bool {
          true
        }
        fn check2(msg: String) -> bool {
          true
        }
        let msg = "test";
        let r1 = check1(msg);
        let r2 = check2(msg);
        if r1 && r2 {
          println("both_ok");
        }
      `)
      ).toContain("both_ok");
    });
  });

  describe("[v4.3] 부분 참조와 문자열 처리", () => {
    test("문자열 비교를 통한 검증", () => {
      expect(
        output(`
        fn has_admin(msg: String) -> bool {
          msg == "ADMIN_SYSTEM"
        }
        let msg = "ADMIN_SYSTEM";
        let result = has_admin(msg);
        println(result);
      `)
      ).toContain("true");
    });

    test("문자열 조건 판별", () => {
      expect(
        output(`
        fn validate_msg(msg: String) -> bool {
          if msg == "ADMIN" {
            true
          } else {
            false
          }
        }
        let msg1 = "ADMIN";
        let msg2 = "USER";
        let r1 = validate_msg(msg1);
        let r2 = validate_msg(msg2);
        if r1 && !r2 {
          println("correct");
        }
      `)
      ).toContain("correct");
    });

    test("데이터 부분 기반 처리", () => {
      expect(
        output(`
        fn check_type(msg: String) -> bool {
          if msg == "ADMIN_MESSAGE" {
            true
          } else {
            false
          }
        }
        let message = "ADMIN_MESSAGE";
        let result = check_type(message);
        if result {
          println("admin");
        }
      `)
      ).toContain("admin");
    });
  });

  describe("[v4.4] 모듈 설계 및 캡슐화", () => {
    test("함수 그룹화로 모듈 표현", () => {
      expect(
        output(`
        fn security_validate_admin(msg: String) -> bool {
          msg == "ADMIN"
        }
        fn security_validate_user(msg: String) -> bool {
          msg == "USER"
        }
        let msg = "ADMIN";
        if security_validate_admin(msg) {
          println("admin_ok");
        }
      `)
      ).toContain("admin_ok");
    });

    test("모듈 함수 조합", () => {
      expect(
        output(`
        fn crypto_token(seed: i32) -> i32 {
          seed + 10
        }
        fn crypto_level(token: i32) -> i32 {
          token / 2
        }
        fn crypto_check(seed: i32) -> bool {
          let token = crypto_token(seed);
          let level = crypto_level(token);
          level > 5
        }
        let result = crypto_check(20);
        println(result);
      `)
      ).toContain("true");
    });

    test("계층별 함수 조직", () => {
      expect(
        output(`
        fn data_fetch() -> String {
          "raw_data"
        }
        fn logic_process(input: String) -> String {
          "processed"
        }
        fn api_output() -> String {
          logic_process(data_fetch())
        }
        let result = api_output();
        println(result);
      `)
      ).toContain("processed");
    });
  });

  describe("[v4.5] 외부 크레이트 시뮬레이션", () => {
    test("의사 난수 생성 (rand 크레이트 시뮬레이션)", () => {
      expect(
        output(`
        fn rand_generate(seed: i32) -> i32 {
          (seed * 7 + 13) % 100
        }
        let token = rand_generate(42);
        if token > 0 {
          println("token");
        }
      `)
      ).toContain("token");
    });

    test("외부 크레이트 기반 검증", () => {
      expect(
        output(`
        fn external_rand(seed: i32) -> i32 {
          seed * 3
        }
        fn external_validate(seed: i32) -> bool {
          let token = external_rand(seed);
          if token > 10 {
            true
          } else {
            false
          }
        }
        let ok = external_validate(5);
        println(ok);
      `)
      ).toContain("true");
    });

    test("크레이트 기능 조합", () => {
      expect(
        output(`
        fn rand_token(seed: i32) -> i32 {
          (seed * 3 + 2) % 100
        }
        fn serde_encode(token: i32) -> String {
          "token"
        }
        fn final_result(seed: i32) -> String {
          let token = rand_token(seed);
          serde_encode(token)
        }
        let result = final_result(10);
        println(result);
      `)
      ).toContain("token");
    });
  });

  describe("[통합 중간고사] 보안 모듈 전체 시나리오", () => {
    test("ADMIN 검증 -> 토큰 생성 -> 접속 허가", () => {
      expect(
        output(`
        fn security_is_admin(msg: String) -> bool {
          msg == "ADMIN"
        }
        fn rand_token(seed: i32) -> i32 {
          (seed * 7 + 1) % 100
        }
        fn security_full_check(msg: String, seed: i32) -> bool {
          let admin_ok = security_is_admin(msg);
          let token = rand_token(seed);
          if admin_ok && token > 0 {
            true
          } else {
            false
          }
        }
        let result = security_full_check("ADMIN", 42);
        if result {
          println("access_granted");
        }
      `)
      ).toContain("access_granted");
    });

    test("거부: ADMIN이 아닌 경우", () => {
      expect(
        output(`
        fn security_is_admin(msg: String) -> bool {
          msg == "ADMIN"
        }
        let msg = "USER";
        if security_is_admin(msg) {
          println("allowed");
        } else {
          println("denied");
        }
      `)
      ).toContain("denied");
    });

    test("최종 기록: 저장 필수", () => {
      expect(
        output(`
        fn validate() -> bool {
          true
        }
        let check = validate();
        println("저장 필수 너는 기록이 증명이다 gogs");
      `)
      ).toContain("저장 필수 너는 기록이 증명이다 gogs");
    });
  });

  describe("[v4 전체] 설계 원칙 종합 검증", () => {
    test("v4.0~v4.5 통합: 보안 모듈 완전한 예제", () => {
      expect(
        output(`
        fn security_validate_admin(msg: String) -> bool {
          msg == "ADMIN_MESSAGE"
        }
        fn security_generate_token(seed: i32) -> i32 {
          seed + 10
        }
        fn security_check_level(token: i32) -> bool {
          if token > 5 {
            true
          } else {
            false
          }
        }
        let message = "ADMIN_MESSAGE";
        let admin_ok = security_validate_admin(message);
        let token = security_generate_token(42);
        let level_ok = security_check_level(token);
        if admin_ok {
          if level_ok {
            println("system_secure");
          }
        }
      `)
      ).toContain("system_secure");
    });

    test("메모리 안전성: 소유권 유지", () => {
      expect(
        output(`
        fn process(msg: String) -> String {
          msg
        }
        let original = "ADMIN";
        let processed = process(original);
        println(processed);
      `)
      ).toContain("ADMIN");
    });

    test("모듈화: 기능별 함수 분리", () => {
      expect(
        output(`
        fn auth_check(u: String) -> bool { u == "ADMIN" }
        fn token_gen(s: i32) -> i32 { (s * 3) % 50 }
        fn system_validate(u: String, s: i32) -> bool {
          auth_check(u) && token_gen(s) > 5
        }
        let ok = system_validate("ADMIN", 20);
        println(ok);
      `)
      ).toContain("true");
    });

    test("외부 연동: 크레이트 시뮬레이션", () => {
      expect(
        output(`
        fn external_lib_encrypt(msg: String) -> String {
          "encrypted"
        }
        fn system_protect(msg: String) -> String {
          external_lib_encrypt(msg)
        }
        let result = system_protect("secret");
        println(result);
      `)
      ).toContain("encrypted");
    });
  });
});

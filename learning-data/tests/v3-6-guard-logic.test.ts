/**
 * v3.6 Guard Logic Test Suite - 가드 클로즈와 조기 리턴
 *
 * 테스트 항목:
 * 1. Early Return: 함수의 조기 종료
 * 2. Continue: 루프의 다음 반복으로 진행
 * 3. Break: 루프 즉시 탈출
 * 4. Guard Patterns: 다중 검증 구조
 * 5. Invariant Guarantees: 불변성 보장
 */

import { run } from "../src/index";

describe("v3.6: Guard Logic (가드와 불변 논리)", () => {
  const output = (code: string) => run(code).join("");

  describe("Early Return - 함수의 조기 종료", () => {
    test("should return immediately on failed condition", () => {
      expect(
        output(`
        let result = "";
        fn check(x) {
          if x < 0 {
            result = "negative";
            return;
          }
          result = "positive";
        }
        check(-5);
        println(result);
      `)
      ).toContain("negative");
    });

    test("should skip remaining code after return", () => {
      expect(
        output(`
        let log = "";
        fn process() {
          log = "step1";
          return;
          log = "step2";  // 실행 안 됨
        }
        process();
        println(log);
      `)
      ).toContain("step1");
    });

    test("should return with early exit for multiple conditions", () => {
      expect(
        output(`
        fn authenticate(user, pass) {
          if user == "" {
            println("fail1");
            return;
          }
          if pass == "" {
            println("fail2");
            return;
          }
          println("success");
        }
        authenticate("", "pwd");
      `)
      ).toContain("fail1");
    });

    test("should execute code after guard passage", () => {
      expect(
        output(`
        fn check(x) {
          if x < 0 {
            println("blocked");
            return;
          }
          println("allowed");
        }
        check(5);
      `)
      ).toContain("allowed");
    });
  });

  describe("Multiple Guards - 다중 가드 패턴", () => {
    test("should pass all guards sequentially", () => {
      expect(
        output(`
        fn validate(a, b, c) {
          if a < 0 {
            println("guard1_failed");
            return;
          }
          if b < 0 {
            println("guard2_failed");
            return;
          }
          if c < 0 {
            println("guard3_failed");
            return;
          }
          println("all_passed");
        }
        validate(1, 2, 3);
      `)
      ).toContain("all_passed");
    });

    test("should stop at first guard failure", () => {
      expect(
        output(`
        fn validate(a, b, c) {
          if a < 0 {
            println("guard1_failed");
            return;
          }
          if b < 0 {
            println("guard2_failed");
            return;
          }
          if c < 0 {
            println("guard3_failed");
            return;
          }
          println("all_passed");
        }
        validate(1, -2, 3);
      `)
      ).toContain("guard2_failed");
    });

    test("should verify invariant after all guards", () => {
      expect(
        output(`
        fn process(admin, active, ready) {
          if !admin {
            println("not_admin");
            return;
          }
          if !active {
            println("not_active");
            return;
          }
          if !ready {
            println("not_ready");
            return;
          }
          println("preconditions_met");
        }
        process(true, true, true);
      `)
      ).toContain("preconditions_met");
    });
  });

  describe("Continue in Loops - 루프 내 Continue", () => {
    test("should skip to next iteration on continue", () => {
      expect(
        output(`
        let mut count = 0;
        let mut i = 0;
        while i < 5 {
          if i == 2 {
            i = i + 1;
            continue;
          }
          count = count + 1;
          i = i + 1;
        }
        println(count);
      `)
      ).toContain("4");
    });

    test("should process multiple continues", () => {
      expect(
        output(`
        let mut sum = 0;
        let mut i = 0;
        while i < 10 {
          if i == 2 {
            i = i + 1;
            continue;
          }
          if i == 5 {
            i = i + 1;
            continue;
          }
          sum = sum + i;
          i = i + 1;
        }
        println(sum);
      `)
      ).toContain("38");  // 0+1+3+4+6+7+8+9 = 38
    });

    test("should validate items with continue guards", () => {
      expect(
        output(`
        let mut valid = 0;
        let mut i = 0;
        while i < 3 {
          let val = i * 10;
          if val == 0 {
            i = i + 1;
            continue;
          }
          valid = valid + 1;
          i = i + 1;
        }
        println(valid);
      `)
      ).toContain("2");
    });

    test("should skip null values with continue", () => {
      expect(
        output(`
        let mut processed = 0;
        let items = [1, 2, 3];
        let mut i = 0;
        while i < 3 {
          let item = items[i];
          if item == 2 {
            i = i + 1;
            continue;
          }
          processed = processed + item;
          i = i + 1;
        }
        println(processed);
      `)
      ).toContain("4");
    });
  });

  describe("Break in Loops - 루프의 Break", () => {
    test("should exit loop on break", () => {
      expect(
        output(`
        let mut count = 0;
        let mut i = 0;
        while i < 10 {
          if i == 3 {
            break;
          }
          count = count + 1;
          i = i + 1;
        }
        println(count);
      `)
      ).toContain("3");
    });

    test("should find target with break", () => {
      expect(
        output(`
        let items = [1, 2, 3, 4, 5];
        let mut i = 0;
        let mut found = false;
        while i < 5 {
          if items[i] == 3 {
            found = true;
            break;
          }
          i = i + 1;
        }
        if found {
          println("found");
        }
      `)
      ).toContain("found");
    });

    test("should handle break with multiple conditions", () => {
      expect(
        output(`
        let mut sum = 0;
        let mut i = 0;
        while i < 10 {
          if i == 5 {
            break;
          }
          sum = sum + i;
          i = i + 1;
        }
        println(sum);
      `)
      ).toContain("10");
    });

    test("should terminate early with guard check", () => {
      expect(
        output(`
        let mut processed = 0;
        let mut i = 0;
        while i < 100 {
          if i > 5 {
            break;
          }
          processed = processed + 1;
          i = i + 1;
        }
        println(processed);
      `)
      ).toContain("6");
    });
  });

  describe("Pyramid Elimination - 중첩 제거", () => {
    test("guard pattern eliminates deep nesting", () => {
      expect(
        output(`
        fn validate(x, y, z) {
          if x < 0 {
            println("fail");
            return;
          }
          if y < 0 {
            println("fail");
            return;
          }
          if z < 0 {
            println("fail");
            return;
          }
          println("pass");
        }
        validate(1, 2, 3);
      `)
      ).toContain("pass");
    });

    test("should flatten compared to nested ifs", () => {
      expect(
        output(`
        fn process(ready, auth, safe) {
          // 가드: 조건 불만족 시 즉시 반환
          if !ready {
            return;
          }
          if !auth {
            return;
          }
          if !safe {
            return;
          }
          // 핵심 로직 (최소 들여쓰기)
          println("executed");
        }
        process(true, true, true);
      `)
      ).toContain("executed");
    });

    test("should verify core logic runs only with all guards passed", () => {
      expect(
        output(`
        let result = "";
        fn check(a, b, c) {
          if !a {
            result = "guard1";
            return;
          }
          if !b {
            result = "guard2";
            return;
          }
          if !c {
            result = "guard3";
            return;
          }
          result = "success";
        }
        check(true, true, false);
        println(result);
      `)
      ).toContain("guard3");
    });
  });

  describe("Invariant Guarantees - 불변성 보장", () => {
    test("reaching core logic means all conditions passed", () => {
      expect(
        output(`
        let status = "";
        fn execute(cond1, cond2, cond3) {
          if !cond1 {
            status = "blocked";
            return;
          }
          if !cond2 {
            status = "blocked";
            return;
          }
          if !cond3 {
            status = "blocked";
            return;
          }
          // 이 지점에 도달했다는 것은:
          // cond1 == true && cond2 == true && cond3 == true 가 보장됨
          status = "invariant_safe";
        }
        execute(true, true, true);
        println(status);
      `)
      ).toContain("invariant_safe");
    });

    test("should guarantee state consistency in core section", () => {
      expect(
        output(`
        fn authorize(user_exists, is_admin, quota_ok) {
          // 가드: 부적격 조건 필터링
          if !user_exists {
            println("user_missing");
            return;
          }
          if !is_admin {
            println("perm_denied");
            return;
          }
          if !quota_ok {
            println("quota_exceeded");
            return;
          }

          // [불변성 보장] 모든 조건이 참임이 보장됨
          println("auth_ok");
        }
        authorize(true, true, true);
      `)
      ).toContain("auth_ok");
    });

    test("should make invariants explicit through early returns", () => {
      expect(
        output(`
        let mut balance = 1000;
        fn withdraw(amount, has_pin, account_active) {
          if !account_active {
            println("inactive");
            return;
          }
          if !has_pin {
            println("no_auth");
            return;
          }
          if amount > balance {
            println("insufficient");
            return;
          }
          // 불변성:
          // - account is active
          // - user is authenticated
          // - balance >= amount
          balance = balance - amount;
          println("withdrawn");
        }
        withdraw(100, true, true);
      `)
      ).toContain("withdrawn");
    });
  });

  describe("Complex Scenarios - 복합 시나리오", () => {
    test("should handle interleaved guards and loops", () => {
      expect(
        output(`
        fn process_items(items, count, allow) {
          if !allow {
            println("denied");
            return;
          }

          let mut i = 0;
          while i < count {
            let item = items[i];
            if item == 0 {
              i = i + 1;
              continue;
            }
            println("item");
            i = i + 1;
          }
        }
        let arr = [1, 0, 2, 0, 3];
        process_items(arr, 5, true);
      `)
      ).toContain("item");
    });

    test("should combine guards with conditional breaks", () => {
      expect(
        output(`
        fn search(target, max_attempts, allow_search) {
          if !allow_search {
            println("blocked");
            return;
          }

          let mut attempts = 0;
          while attempts < max_attempts {
            attempts = attempts + 1;
            if attempts == target {
              println("found");
              break;
            }
          }
        }
        search(3, 5, true);
      `)
      ).toContain("found");
    });

    test("should apply guards before iteration", () => {
      expect(
        output(`
        fn validate_all(items, count, must_validate) {
          if !must_validate {
            println("skip");
            return;
          }

          let mut valid = 0;
          let mut i = 0;
          while i < count {
            valid = valid + 1;
            i = i + 1;
          }
          println(valid);
        }
        let arr = [1, 2, 3];
        validate_all(arr, 3, true);
      `)
      ).toContain("3");
    });
  });

  describe("Edge Cases - 엣지 케이스", () => {
    test("should handle empty guard (no action)", () => {
      expect(
        output(`
        let result = "";
        fn check(x) {
          if x < 0 {
            return;  // 아무 메시지 없이 반환
          }
          result = "ok";
        }
        check(5);
        println(result);
      `)
      ).toContain("ok");
    });

    test("should handle guard with state change", () => {
      expect(
        output(`
        let mut state = 0;
        fn set_state(x) {
          if x < 0 {
            state = -1;
            return;
          }
          state = 1;
        }
        set_state(-5);
        println(state);
      `)
      ).toContain("-1");
    });

    test("should handle break in nested loop", () => {
      expect(
        output(`
        let mut total = 0;
        let mut i = 0;
        while i < 3 {
          let mut j = 0;
          while j < 3 {
            if j == 1 {
              break;
            }
            total = total + 1;
            j = j + 1;
          }
          i = i + 1;
        }
        println(total);
      `)
      ).toContain("3");
    });

    test("should handle continue in nested conditions", () => {
      expect(
        output(`
        let mut count = 0;
        let mut i = 0;
        while i < 5 {
          if i < 2 {
            i = i + 1;
            continue;
          }
          count = count + 1;
          i = i + 1;
        }
        println(count);
      `)
      ).toContain("3");
    });

    test("should support multiple returns in function", () => {
      expect(
        output(`
        fn classify(x) {
          if x < 0 {
            println("negative");
            return;
          }
          if x == 0 {
            println("zero");
            return;
          }
          println("positive");
        }
        classify(0);
      `)
      ).toContain("zero");
    });
  });

  describe("Real-World Patterns - 실무 패턴", () => {
    test("should implement early return for validation", () => {
      expect(
        output(`
        fn validate_email(email) {
          if email == "" {
            println("empty");
            return;
          }
          if email == "invalid" {
            println("invalid");
            return;
          }
          println("valid");
        }
        validate_email("user@example.com");
      `)
      ).toContain("valid");
    });

    test("should implement loop with skip pattern", () => {
      expect(
        output(`
        let mut processed = 0;
        let mut i = 0;
        while i < 10 {
          if i % 2 == 0 {
            i = i + 1;
            continue;
          }
          processed = processed + 1;
          i = i + 1;
        }
        println(processed);
      `)
      ).toContain("5");
    });

    test("should implement search-and-stop pattern", () => {
      expect(
        output(`
        let items = [10, 20, 30, 40, 50];
        let mut i = 0;
        let mut result = -1;
        while i < 5 {
          if items[i] > 25 {
            result = items[i];
            break;
          }
          i = i + 1;
        }
        println(result);
      `)
      ).toContain("30");
    });
  });
});

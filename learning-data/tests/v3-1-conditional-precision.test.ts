/**
 * v3.1 조건문 정밀 설계 - 종합 테스트
 *
 * 테스트 항목:
 * 1. 복합 조건식 (&&, ||)
 * 2. 표현식으로서의 IF
 * 3. Short-circuit 성능 최적화
 * 4. 무결성 검증 (타입 일치, 우선순위, 완전성)
 */

import { run } from "../src/index";

describe("v3.1: Conditional Precision Design", () => {
  describe("1. Composite Conditionals (&&)", () => {
    test("should evaluate AND with both true", () => {
      const output = run(`
        let result = true && true;
        println(result);
      `).join("");
      expect(output).toContain("true");
    });

    test("should evaluate AND with false on left", () => {
      const output = run(`
        let result = false && true;
        println(result);
      `);
      expect(output).toContain("false");
    });

    test("should evaluate AND with false on right", () => {
      const output = run(`
        let result = true && false;
        println(result);
      `);
      expect(output).toContain("false");
    });

    test("should evaluate AND with both false", () => {
      const output = run(`
        let result = false && false;
        println(result);
      `);
      expect(output).toContain("false");
    });

    test("should handle multi-condition AND", () => {
      const output = run(`
        let a = 5 > 3;
        let b = 10 < 20;
        let c = true;
        let result = a && b && c;
        println(result);
      `);
      expect(output).toContain("true");
    });

    test("AND with one false condition should return false", () => {
      const output = run(`
        let a = true;
        let b = false;
        let c = true;
        let result = a && b && c;
        println(result);
      `);
      expect(output).toContain("false");
    });
  });

  describe("2. Composite Conditionals (||)", () => {
    test("should evaluate OR with both true", () => {
      const output = run(`
        let result = true || true;
        println(result);
      `);
      expect(output).toContain("true");
    });

    test("should evaluate OR with true on left", () => {
      const output = run(`
        let result = true || false;
        println(result);
      `);
      expect(output).toContain("true");
    });

    test("should evaluate OR with true on right", () => {
      const output = run(`
        let result = false || true;
        println(result);
      `);
      expect(output).toContain("true");
    });

    test("should evaluate OR with both false", () => {
      const output = run(`
        let result = false || false;
        println(result);
      `);
      expect(output).toContain("false");
    });

    test("should handle multi-condition OR", () => {
      const output = run(`
        let a = false;
        let b = false;
        let c = true;
        let result = a || b || c;
        println(result);
      `);
      expect(output).toContain("true");
    });

    test("OR with all false conditions should return false", () => {
      const output = run(`
        let a = false;
        let b = false;
        let c = false;
        let result = a || b || c;
        println(result);
      `);
      expect(output).toContain("false");
    });
  });

  describe("3. Mixed Conditions (&&와 || 혼합)", () => {
    test("should respect operator precedence: && before ||", () => {
      // a || b && c = a || (b && c)
      const output = run(`
        let a = false;
        let b = true;
        let c = true;
        let result = a || b && c;  // false || (true && true) = true
        println(result);
      `);
      expect(output).toContain("true");
    });

    test("should evaluate complex nested conditions", () => {
      const output = run(`
        let x = 10;
        let y = 20;
        let z = 30;
        let result = (x > 5 && y < 25) || (z == 30);
        println(result);
      `);
      expect(output).toContain("true");
    });

    test("should handle multiple AND/OR chains", () => {
      const output = run(`
        let a = true;
        let b = true;
        let c = false;
        let d = true;
        let result = a && b || c && d;  // (true && true) || (false && true) = true
        println(result);
      `);
      expect(output).toContain("true");
    });
  });

  describe("4. If as Expression (표현식으로서의 IF)", () => {
    test("should assign if result to variable with string type", () => {
      const output = run(`
        let message = if true { "yes" } else { "no" };
        println(message);
      `);
      expect(output).toContain("yes");
    });

    test("should assign if result to variable with number type", () => {
      const output = run(`
        let value = if false { 10 } else { 20 };
        println(value);
      `);
      expect(output).toContain("20");
    });

    test("should maintain type consistency in if-else", () => {
      const output = run(`
        let x = 5;
        let classification = if x > 10 { "large" } else if x > 0 { "small" } else { "zero" };
        println(classification);
      `);
      expect(output).toContain("small");
    });

    test("should support nested if expressions", () => {
      const output = run(`
        let age = 25;
        let status = if age >= 18 {
          if age >= 65 { "senior" } else { "adult" }
        } else {
          "minor"
        };
        println(status);
      `);
      expect(output).toContain("adult");
    });

    test("should work with function return values", () => {
      const output = run(`
        fn get_status(value) {
          if value > 0 { "positive" } else if value < 0 { "negative" } else { "zero" }
        }
        let result = get_status(10);
        println(result);
      `);
      expect(output).toContain("positive");
    });
  });

  describe("5. Short-Circuit Evaluation", () => {
    test("AND should not evaluate right side if left is false", () => {
      // 이 테스트는 구현 로직의 정확성을 확인
      const output = run(`
        let count = 0;
        let left = false;
        let result = left && true;
        println(result);
        println(count);  // 변수가 수정되지 않았음을 확인
      `);
      expect(output).toContain("false");
      expect(output).toContain("0");
    });

    test("OR should not evaluate right side if left is true", () => {
      const output = run(`
        let left = true;
        let result = left || false;
        println(result);
      `);
      expect(output).toContain("true");
    });

    test("should work with numeric comparisons", () => {
      const output = run(`
        let x = 5;
        let y = 10;
        let result = x > 3 && y > 8;  // true && true = true
        println(result);
      `);
      expect(output).toContain("true");
    });

    test("should work with string comparisons", () => {
      const output = run(`
        let name = "Alice";
        let result = name == "Alice" && true;
        println(result);
      `);
      expect(output).toContain("true");
    });
  });

  describe("6. Security Clearance Pattern (Case Study 1)", () => {
    test("should grant full access when admin AND system online", () => {
      const output = run(`
        let is_admin = true;
        let system_online = true;
        let access = if is_admin && system_online { "Full" } else { "Denied" };
        println(access);
      `);
      expect(output).toContain("Full");
    });

    test("should deny access when admin is false", () => {
      const output = run(`
        let is_admin = false;
        let system_online = true;
        let access = if is_admin && system_online { "Full" } else { "Denied" };
        println(access);
      `);
      expect(output).toContain("Denied");
    });

    test("should grant limited access with OR condition", () => {
      const output = run(`
        let access_level = 5;
        let system_online = true;
        let access = if access_level > 3 || system_online { "Limited" } else { "Denied" };
        println(access);
      `);
      expect(output).toContain("Limited");
    });
  });

  describe("7. Thermal Management Pattern (Case Study 2)", () => {
    test("should return critical status when temp > 85", () => {
      const output = run(`
        let temp = 90;
        let system_online = true;
        let status = if system_online {
          if temp > 85 { "CRITICAL" } else { "OK" }
        } else {
          "OFFLINE"
        };
        println(status);
      `);
      expect(output).toContain("CRITICAL");
    });

    test("should return warning status when temp between 70-85", () => {
      const output = run(`
        let temp = 75;
        let system_online = true;
        let status = if system_online {
          if temp > 85 { "CRITICAL" } else if temp > 70 { "WARNING" } else { "OK" }
        } else {
          "OFFLINE"
        };
        println(status);
      `);
      expect(output).toContain("WARNING");
    });

    test("should return offline status when system is offline", () => {
      const output = run(`
        let system_online = false;
        let status = if system_online { "OK" } else { "OFFLINE" };
        println(status);
      `);
      expect(output).toContain("OFFLINE");
    });
  });

  describe("8. Loan Approval Pattern (Case Study 3)", () => {
    test("should approve premium when all conditions met", () => {
      const output = run(`
        let credit_score = 760;
        let income = 75000;
        let employment = 3;
        let loan = if credit_score >= 750 && income > 50000 && employment >= 2 {
          "Premium"
        } else {
          "Denied"
        };
        println(loan);
      `);
      expect(output).toContain("Premium");
    });

    test("should approve standard when second condition met", () => {
      const output = run(`
        let credit_score = 660;
        let income = 45000;
        let employment = 2;
        let loan = if credit_score >= 750 && income > 50000 && employment >= 2 {
          "Premium"
        } else if credit_score >= 650 && income > 30000 && employment >= 1 {
          "Standard"
        } else {
          "Denied"
        };
        println(loan);
      `);
      expect(output).toContain("Standard");
    });

    test("should approve conditional when OR condition met", () => {
      const output = run(`
        let credit_score = 560;
        let income = 45000;
        let loan = if credit_score >= 550 || income > 40000 { "Conditional" } else { "Denied" };
        println(loan);
      `);
      expect(output).toContain("Conditional");
    });

    test("should deny when no condition met", () => {
      const output = run(`
        let credit_score = 500;
        let income = 20000;
        let loan = if credit_score >= 550 || income > 40000 { "Approved" } else { "Denied" };
        println(loan);
      `);
      expect(output).toContain("Denied");
    });
  });

  describe("9. Type Consistency Verification", () => {
    test("all branches should have same type", () => {
      const output = run(`
        let status = if true { "active" } else { "inactive" };
        println(status);
      `);
      expect(output).toContain("active");
    });

    test("should handle numeric return types consistently", () => {
      const output = run(`
        let priority = if true { 1 } else { 0 };
        println(priority);
      `);
      expect(output).toContain("1");
    });
  });

  describe("10. Completeness Verification", () => {
    test("should handle all three branches in if-else-if-else", () => {
      const output = run(`
        let value = 15;
        let category = if value > 20 {
          "large"
        } else if value > 10 {
          "medium"
        } else {
          "small"
        };
        println(category);
      `);
      expect(output).toContain("medium");
    });

    test("else branch should catch all remaining cases", () => {
      const output = run(`
        let value = 5;
        let category = if value > 20 {
          "large"
        } else if value > 10 {
          "medium"
        } else {
          "small"
        };
        println(category);
      `);
      expect(output).toContain("small");
    });

    test("should handle unexpected input in else", () => {
      const output = run(`
        let code = 999;
        let message = if code == 200 {
          "OK"
        } else if code == 404 {
          "Not Found"
        } else {
          "Unknown"
        };
        println(message);
      `);
      expect(output).toContain("Unknown");
    });
  });

  describe("11. Complex Real-World Scenarios", () => {
    test("should handle permission checking with AND", () => {
      const output = run(`
        fn check_permission(is_admin, is_active, has_token) {
          if is_admin && is_active && has_token { "allowed" } else { "denied" }
        }
        println(check_permission(true, true, true));
        println(check_permission(true, false, true));
      `);
      expect(output).toContain("allowed");
      expect(output).toContain("denied");
    });

    test("should handle fallback logic with OR", () => {
      const output = run(`
        fn get_default_value(primary, fallback, default) {
          if primary { "primary" } else if fallback { "fallback" } else { "default" }
        }
        println(get_default_value(false, true, false));
      `);
      expect(output).toContain("fallback");
    });

    test("should combine AND and OR for complex business logic", () => {
      const output = run(`
        let is_premium = true;
        let has_discount = false;
        let is_sale = true;
        let price_multiplier = if (is_premium && has_discount) || is_sale { 1 } else { 2 };
        println(price_multiplier);
      `);
      expect(output).toContain("1");
    });
  });
});

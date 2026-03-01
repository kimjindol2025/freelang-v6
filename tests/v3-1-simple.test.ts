/**
 * v3.1 조건문 정밀 설계 - 간단한 테스트
 */

import { run } from "../src/index";

describe("v3.1: Conditional Precision Design - Simple", () => {
  const output = (code: string) => run(code).join("");

  describe("AND (&&) Operator", () => {
    test("true && true = true", () => {
      expect(output(`println(true && true);`)).toContain("true");
    });

    test("true && false = false", () => {
      expect(output(`println(true && false);`)).toContain("false");
    });

    test("false && true = false", () => {
      expect(output(`println(false && true);`)).toContain("false");
    });

    test("false && false = false", () => {
      expect(output(`println(false && false);`)).toContain("false");
    });

    test("5 > 3 && 10 > 5", () => {
      expect(output(`println(5 > 3 && 10 > 5);`)).toContain("true");
    });

    test("5 > 3 && 10 < 5", () => {
      expect(output(`println(5 > 3 && 10 < 5);`)).toContain("false");
    });
  });

  describe("OR (||) Operator", () => {
    test("true || true = true", () => {
      expect(output(`println(true || true);`)).toContain("true");
    });

    test("true || false = true", () => {
      expect(output(`println(true || false);`)).toContain("true");
    });

    test("false || true = true", () => {
      expect(output(`println(false || true);`)).toContain("true");
    });

    test("false || false = false", () => {
      expect(output(`println(false || false);`)).toContain("false");
    });

    test("5 > 10 || 20 > 10", () => {
      expect(output(`println(5 > 10 || 20 > 10);`)).toContain("true");
    });

    test("5 > 10 || 20 < 10", () => {
      expect(output(`println(5 > 10 || 20 < 10);`)).toContain("false");
    });
  });

  describe("Mixed && and ||", () => {
    test("true && true || false", () => {
      // (true && true) || false = true || false = true
      expect(output(`println(true && true || false);`)).toContain("true");
    });

    test("false || true && false", () => {
      // false || (true && false) = false || false = false
      expect(output(`println(false || true && false);`)).toContain("false");
    });

    test("true || false && false", () => {
      // true || (false && false) = true || false = true
      expect(output(`println(true || false && false);`)).toContain("true");
    });
  });

  describe("If-Else as Expression", () => {
    test("if true then string 'yes'", () => {
      expect(output(`
        let x = if true { "yes" } else { "no" };
        println(x);
      `)).toContain("yes");
    });

    test("if false then string 'no'", () => {
      expect(output(`
        let x = if false { "yes" } else { "no" };
        println(x);
      `)).toContain("no");
    });

    test("if-else with numbers", () => {
      expect(output(`
        let x = if true { 10 } else { 20 };
        println(x);
      `)).toContain("10");
    });

    test("if-else with comparisons", () => {
      expect(output(`
        let age = 25;
        let status = if age >= 18 { "adult" } else { "minor" };
        println(status);
      `)).toContain("adult");
    });
  });

  describe("If-Else-If Chains", () => {
    test("if-else-if basic", () => {
      expect(output(`
        let x = 5;
        let result = if x > 10 { "big" } else if x > 0 { "small" } else { "zero" };
        println(result);
      `)).toContain("small");
    });

    test("if-else-if all branches", () => {
      const out1 = output(`
        let x = 15;
        let result = if x > 10 { "big" } else if x > 0 { "small" } else { "zero" };
        println(result);
      `);
      expect(out1).toContain("big");

      const out2 = output(`
        let x = 5;
        let result = if x > 10 { "big" } else if x > 0 { "small" } else { "zero" };
        println(result);
      `);
      expect(out2).toContain("small");

      const out3 = output(`
        let x = -5;
        let result = if x > 10 { "big" } else if x > 0 { "small" } else { "zero" };
        println(result);
      `);
      expect(out3).toContain("zero");
    });
  });

  describe("Nested If", () => {
    test("nested if-else", () => {
      expect(output(`
        let x = 10;
        let y = 20;
        let result = if x > 5 { if y > 15 { "both large" } else { "x large" } } else { "both small" };
        println(result);
      `)).toContain("both large");
    });
  });

  describe("Complex Conditions", () => {
    test("security clearance pattern", () => {
      expect(output(`
        let is_admin = true;
        let system_online = true;
        let access = if is_admin && system_online { "Full Access" } else { "Denied" };
        println(access);
      `)).toContain("Full Access");
    });

    test("security clearance pattern - deny", () => {
      expect(output(`
        let is_admin = false;
        let system_online = true;
        let access = if is_admin && system_online { "Full Access" } else { "Denied" };
        println(access);
      `)).toContain("Denied");
    });

    test("loan approval with OR", () => {
      expect(output(`
        let credit_score = 560;
        let income = 45000;
        let approved = if credit_score >= 550 || income > 40000 { "Yes" } else { "No" };
        println(approved);
      `)).toContain("Yes");
    });

    test("thermal management pattern", () => {
      expect(output(`
        let temp = 90;
        let system_online = true;
        let status = if system_online {
          if temp > 85 { "CRITICAL" } else { "OK" }
        } else {
          "OFFLINE"
        };
        println(status);
      `)).toContain("CRITICAL");
    });

    test("thermal management - warning", () => {
      expect(output(`
        let temp = 75;
        let status = if temp > 85 { "CRITICAL" } else if temp > 70 { "WARNING" } else { "OK" };
        println(status);
      `)).toContain("WARNING");
    });
  });

  describe("Type Consistency", () => {
    test("all branches return string", () => {
      expect(output(`
        let status = if true { "active" } else { "inactive" };
        println(status);
      `)).toContain("active");
    });

    test("all branches return number", () => {
      expect(output(`
        let priority = if false { 1 } else { 0 };
        println(priority);
      `)).toContain("0");
    });
  });

  describe("Real-World Scenarios", () => {
    test("user permission checking", () => {
      expect(output(`
        let is_authenticated = true;
        let has_permission = true;
        let can_access = if is_authenticated && has_permission { "granted" } else { "denied" };
        println(can_access);
      `)).toContain("granted");
    });

    test("fallback logic with OR", () => {
      expect(output(`
        let primary_available = false;
        let fallback_available = true;
        let resource = if primary_available || fallback_available { "available" } else { "unavailable" };
        println(resource);
      `)).toContain("available");
    });

    test("priority-based decision", () => {
      expect(output(`
        let level = 3;
        let priority = if level == 1 { "critical" } else if level == 2 { "high" } else if level == 3 { "medium" } else { "low" };
        println(priority);
      `)).toContain("medium");
    });
  });
});

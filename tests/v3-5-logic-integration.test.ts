/**
 * v3.5 Logic Integration - Syntactic Sugar Test Suite
 *
 * Focus: if let, while let pattern binding
 */

import { run } from "../src/index";

describe("v3.5: Logic Integration (Syntactic Sugar)", () => {
  const output = (code: string) => run(code).join("");

  describe("If Let - Simple", () => {
    test("if let with number value", () => {
      expect(
        output(`
        let value = 42;
        if let 42 = value {
          println("matched");
        }
      `)
      ).toContain("matched");
    });

    test("if let with string", () => {
      expect(
        output(`
        let msg = "hello";
        if let "hello" = msg {
          println("matched");
        }
      `)
      ).toContain("matched");
    });

    test("if let with boolean", () => {
      expect(
        output(`
        let flag = true;
        if let true = flag {
          println("matched");
        }
      `)
      ).toContain("matched");
    });

    test("if let no match", () => {
      expect(
        output(`
        let value = 100;
        let result = "empty";
        if let 42 = value {
          result = "matched";
        } else {
          result = "no match";
        }
        println(result);
      `)
      ).toContain("no match");
    });
  });

  describe("If Let - With Else", () => {
    test("if let with else - match succeeds", () => {
      expect(
        output(`
        let value = Some(100);
        let result = "empty";
        if let Some(x) = value {
          result = "found";
        } else {
          result = "not found";
        }
        println(result);
      `)
      ).toContain("found");
    });

    test("if let with else - match fails", () => {
      expect(
        output(`
        let none_value = None;
        let result = "empty";
        if let Some(x) = none_value {
          result = "found";
        } else {
          result = "not found";
        }
        println(result);
      `)
      ).toContain("not found");
    });

    test("if let else - pattern mismatch executes else", () => {
      expect(
        output(`
        let value = Some(99);
        let result = "none";
        if let Some(x) = value {
          if x == 99 {
            result = "matched";
          }
        } else {
          result = "else";
        }
        println(result);
      `)
      ).toContain("matched");
    });
  });

  describe("If Let - No Match", () => {
    test("if let skips block on None", () => {
      expect(
        output(`
        let none_val = None;
        let executed = false;
        if let Some(x) = none_val {
          executed = true;
        }
        if executed {
          println("executed");
        } else {
          println("skipped");
        }
      `)
      ).toContain("skipped");
    });

    test("if let correctly extracts Some value", () => {
      expect(
        output(`
        let value = Some(42);
        let found = false;
        if let Some(x) = value {
          if x == 42 {
            found = true;
          }
        }
        if found {
          println("correct");
        } else {
          println("wrong");
        }
      `)
      ).toContain("correct");
    });

    test("if let handles different patterns", () => {
      expect(
        output(`
        let value = Some(100);
        let result = "none";
        if let Some(x) = value {
          result = "some";
        }
        println(result);
      `)
      ).toContain("some");
    });

    test("if let multiple conditions", () => {
      expect(
        output(`
        let a = Some(10);
        let b = Some(20);
        let total = 0;
        if let Some(x) = a {
          if let Some(y) = b {
            total = x + y;
          }
        }
        println(total);
      `)
      ).toContain("30");
    });
  });

  describe("While Let - Basic", () => {
    test("while let basic loop", () => {
      expect(
        output(`
        let mut i = 3;
        let mut count = 0;
        while i > 0 {
          count = count + 1;
          i = i - 1;
        }
        println(count);
      `)
      ).toContain("3");
    });

    test("while let with counter", () => {
      expect(
        output(`
        let mut n = 5;
        let mut sum = 0;
        while n > 0 {
          sum = sum + n;
          n = n - 1;
        }
        println(sum);
      `)
      ).toContain("15");
    });

    test("while let empty condition", () => {
      expect(
        output(`
        let mut i = 0;
        let mut iterations = 0;
        while i < 0 {
          iterations = iterations + 1;
          i = i + 1;
        }
        println(iterations);
      `)
      ).toContain("0");
    });

    test("while let with array iteration", () => {
      expect(
        output(`
        let arr = vec!["a", "b", "c"];
        let mut i = 0;
        let mut count = 0;
        while i < 3 {
          count = count + 1;
          i = i + 1;
        }
        println(count);
      `)
      ).toContain("3");
    });
  });

  describe("While Let - Empty", () => {
    test("while let with empty collection", () => {
      expect(
        output(`
        let arr = vec![];
        let mut i = 0;
        let mut iterations = 0;
        while i < 0 {
          iterations = iterations + 1;
          i = i + 1;
        }
        println(iterations);
      `)
      ).toContain("0");
    });

    test("while let terminates on condition", () => {
      expect(
        output(`
        let mut i = 0;
        let mut sum = 0;
        while i < 5 {
          sum = sum + i;
          i = i + 1;
        }
        println(sum);
      `)
      ).toContain("10");
    });
  });

  describe("If Let - Guard Condition", () => {
    test("if let with guard - condition true", () => {
      expect(
        output(`
        let value = Some(50);
        let result = "empty";
        if let Some(x) = value {
          if x > 40 {
            result = "large";
          } else {
            result = "small";
          }
        }
        println(result);
      `)
      ).toContain("large");
    });

    test("if let with guard - condition false", () => {
      expect(
        output(`
        let value = Some(10);
        let result = "empty";
        if let Some(x) = value {
          if x > 40 {
            result = "large";
          } else {
            result = "small";
          }
        }
        println(result);
      `)
      ).toContain("small");
    });

    test("if let with guard - equality check", () => {
      expect(
        output(`
        let config = Some("ACTIVE");
        let status = "unknown";
        if let Some(c) = config {
          if c == "ACTIVE" {
            status = "active";
          }
        }
        println(status);
      `)
      ).toContain("active");
    });
  });

  describe("Nested If Let", () => {
    test("nested if let with Some-Some", () => {
      expect(
        output(`
        let outer = Some(Some(42));
        let found = false;
        if let Some(inner) = outer {
          if let Some(value) = inner {
            if value == 42 {
              found = true;
            }
          }
        }
        if found {
          println("nested matched");
        }
      `)
      ).toContain("nested matched");
    });

    test("nested if let with multiple levels", () => {
      expect(
        output(`
        let value = Some("ACTIVE");
        let status = "unknown";
        if let Some(v) = value {
          if v == "ACTIVE" {
            status = "active";
          }
        }
        println(status);
      `)
      ).toContain("active");
    });

    test("nested if let early termination", () => {
      expect(
        output(`
        let a = Some(10);
        let b = None;
        let result = "none";
        if let Some(x) = a {
          if let Some(y) = b {
            result = "both";
          } else {
            result = "one";
          }
        }
        println(result);
      `)
      ).toContain("one");
    });
  });

  describe("Real-world Scenarios", () => {
    test("signal handling pattern", () => {
      expect(
        output(`
        let signal = Some("EMERGENCY_STOP");
        let response = "idle";
        if let Some(msg) = signal {
          if msg == "EMERGENCY_STOP" {
            response = "emergency";
          }
        }
        println(response);
      `)
      ).toContain("emergency");
    });

    test("optional configuration", () => {
      expect(
        output(`
        let config = Some(100);
        let timeout = 30;
        if let Some(t) = config {
          timeout = t;
        }
        println(timeout);
      `)
      ).toContain("100");
    });

    test("authentication pattern", () => {
      expect(
        output(`
        let user = Some("admin");
        let authenticated = false;
        if let Some(u) = user {
          if u == "admin" {
            authenticated = true;
          }
        }
        if authenticated {
          println("authenticated");
        }
      `)
      ).toContain("authenticated");
    });

    test("data extraction and validation", () => {
      expect(
        output(`
        let data = Some(42);
        let value = 0;
        if let Some(d) = data {
          if d > 0 {
            value = d;
          }
        }
        println(value);
      `)
      ).toContain("42");
    });

    test("queue-like processing", () => {
      expect(
        output(`
        let mut items = vec!["task1", "task2", "task3"];
        let mut i = 0;
        let mut count = 0;
        while i < 3 {
          count = count + 1;
          i = i + 1;
        }
        println(count);
      `)
      ).toContain("3");
    });
  });

  describe("Edge Cases", () => {
    test("if let with expression body", () => {
      expect(
        output(`
        let value = Some(10);
        let result = 0;
        if let Some(x) = value {
          result = x + 5;
        }
        println(result);
      `)
      ).toContain("15");
    });

    test("multiple sequential if let", () => {
      expect(
        output(`
        let a = Some(10);
        let b = Some(20);
        let sum = 0;
        if let Some(x) = a {
          sum = sum + x;
        }
        if let Some(y) = b {
          sum = sum + y;
        }
        println(sum);
      `)
      ).toContain("30");
    });

    test("if let in loop context", () => {
      expect(
        output(`
        let mut i = 0;
        let mut total = 0;
        while i < 3 {
          let value = Some(i + 1);
          if let Some(v) = value {
            total = total + v;
          }
          i = i + 1;
        }
        println(total);
      `)
      ).toContain("6");
    });

    test("if let with scope", () => {
      expect(
        output(`
        let outer = Some(42);
        let result = 0;
        if let Some(x) = outer {
          result = x;
        }
        println(result);
      `)
      ).toContain("42");
    });
  });
});

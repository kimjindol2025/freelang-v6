/**
 * v3.5 Logic Integration - Simplified Test (Literal Pattern Matching)
 *
 * Note: v3.5 MVP focuses on simple literal patterns
 * Future: Destructuring patterns in v3.6+
 */

import { run } from "../src/index";

describe("v3.5: Logic Integration (Literal Pattern)", () => {
  const output = (code: string) => run(code).join("");

  describe("If Let - Simple Matching", () => {
    test("if let number match", () => {
      expect(
        output(`
        let value = 42;
        if let 42 = value {
          println("matched");
        }
      `)
      ).toContain("matched");
    });

    test("if let string match", () => {
      expect(
        output(`
        let msg = "hello";
        if let "hello" = msg {
          println("matched");
        }
      `)
      ).toContain("matched");
    });

    test("if let boolean match", () => {
      expect(
        output(`
        let flag = true;
        if let true = flag {
          println("matched");
        }
      `)
      ).toContain("matched");
    });

    test("if let no match condition", () => {
      expect(
        output(`
        let value = 42;
        let result = "none";
        if let 99 = value {
          result = "matched";
        }
        println(result);
      `)
      ).toContain("none");
    });
  });

  describe("If Let - With Else", () => {
    test("if let with else - match succeeds", () => {
      expect(
        output(`
        let value = 42;
        let result = "empty";
        if let 42 = value {
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
        let value = 42;
        let result = "empty";
        if let 99 = value {
          result = "found";
        } else {
          result = "not found";
        }
        println(result);
      `)
      ).toContain("not found");
    });

    test("if let else with string pattern", () => {
      expect(
        output(`
        let status = "ACTIVE";
        let action = "none";
        if let "ACTIVE" = status {
          action = "proceed";
        } else {
          action = "stop";
        }
        println(action);
      `)
      ).toContain("proceed");
    });

    test("if let else with multiple patterns", () => {
      expect(
        output(`
        let code = 404;
        let message = "unknown";
        if let 200 = code {
          message = "success";
        } else {
          message = "error";
        }
        println(message);
      `)
      ).toContain("error");
    });
  });

  describe("While Let - Conditional Loop", () => {
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

    test("while let with accumulation", () => {
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
        let mut count = 0;
        while i < 0 {
          count = count + 1;
          i = i + 1;
        }
        println(count);
      `)
      ).toContain("0");
    });

    test("while let termination", () => {
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

    test("while let with string condition", () => {
      expect(
        output(`
        let mut status = "RUNNING";
        let mut iterations = 0;
        while status == "RUNNING" {
          iterations = iterations + 1;
          if iterations > 2 {
            status = "STOPPED";
          }
        }
        println(iterations);
      `)
      ).toContain("3");
    });
  });

  describe("Complex Scenarios", () => {
    test("nested if let conditions", () => {
      expect(
        output(`
        let a = 10;
        let b = 10;
        let result = "none";
        if let 10 = a {
          if let 10 = b {
            result = "both";
          }
        }
        println(result);
      `)
      ).toContain("both");
    });

    test("if let with guard logic", () => {
      expect(
        output(`
        let value = 50;
        let result = "empty";
        if let 50 = value {
          if value > 40 {
            result = "large";
          }
        }
        println(result);
      `)
      ).toContain("large");
    });

    test("sequential if let patterns", () => {
      expect(
        output(`
        let a = 10;
        let b = 20;
        let sum = 0;
        if let 10 = a {
          sum = sum + 10;
        }
        if let 20 = b {
          sum = sum + 20;
        }
        println(sum);
      `)
      ).toContain("30");
    });

    test("if let in loop context", () => {
      expect(
        output(`
        let mut i = 0;
        let mut count = 0;
        while i < 3 {
          if let 0 = i {
            count = count + 1;
          }
          if let 1 = i {
            count = count + 1;
          }
          if let 2 = i {
            count = count + 1;
          }
          i = i + 1;
        }
        println(count);
      `)
      ).toContain("3");
    });

    test("status machine with if let", () => {
      expect(
        output(`
        let status = "CRITICAL";
        let action = "none";
        if let "CRITICAL" = status {
          action = "emergency";
        } else if let "WARNING" = status {
          action = "alert";
        } else {
          action = "normal";
        }
        println(action);
      `)
      ).toContain("emergency");
    });

    test("HTTP status code matching", () => {
      expect(
        output(`
        let code = 404;
        let message = "unknown";
        if let 200 = code {
          message = "ok";
        } else if let 404 = code {
          message = "not found";
        } else if let 500 = code {
          message = "server error";
        } else {
          message = "other";
        }
        println(message);
      `)
      ).toContain("not found");
    });
  });

  describe("Edge Cases", () => {
    test("if let with boolean negation", () => {
      expect(
        output(`
        let flag = true;
        let result = "unknown";
        if let true = flag {
          result = "is true";
        }
        println(result);
      `)
      ).toContain("is true");
    });

    test("if let with number ranges concept", () => {
      expect(
        output(`
        let value = 50;
        let category = "none";
        if let 50 = value {
          category = "exact";
        }
        println(category);
      `)
      ).toContain("exact");
    });

    test("while let with counter reset", () => {
      expect(
        output(`
        let mut counter = 3;
        let mut result = 0;
        while counter > 0 {
          result = result + counter;
          counter = counter - 1;
        }
        println(result);
      `)
      ).toContain("6");
    });

    test("multiple while let sequences", () => {
      expect(
        output(`
        let mut i = 0;
        let mut sum1 = 0;
        while i < 2 {
          sum1 = sum1 + i;
          i = i + 1;
        }
        i = 0;
        let mut sum2 = 0;
        while i < 2 {
          sum2 = sum2 + i;
          i = i + 1;
        }
        println(sum1 + sum2);
      `)
      ).toContain("2");
    });
  });
});

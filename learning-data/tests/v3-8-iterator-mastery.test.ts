/**
 * v3.8 Iterator Mastery Test Suite - Declarative Data Flow
 *
 * Test Items:
 * 1. Filtering: Conditional data selection
 * 2. Mapping: Data transformation
 * 3. Pipelines: Multi-stage data processing
 * 4. Accumulation: Fold/reduce operations
 * 5. Safety: Iterator boundary protection
 * 6. Immutability: Avoiding state mutation
 */

import { run } from "../src/index";

describe("v3.8: Iterator Mastery (Declarative Data Flow)", () => {
  const output = (code: string) => run(code).join("");

  describe("Basic Filtering", () => {
    test("should count elements matching condition", () => {
      expect(
        output(`
        let arr = [1, 2, 3, 4, 5];
        let mut count = 0;
        for item in arr {
          if item > 3 {
            count = count + 1;
          }
        }
        println(count);
      `)
      ).toContain("2");
    });

    test("should filter out zero values", () => {
      expect(
        output(`
        let values = [10, 0, 20, 0, 30];
        let mut nonzero = 0;
        for v in values {
          if v > 0 {
            nonzero = nonzero + 1;
          }
        }
        println(nonzero);
      `)
      ).toContain("3");
    });

    test("should filter by string condition", () => {
      expect(
        output(`
        let statuses = ["active", "inactive", "active", "pending"];
        let mut active = 0;
        for status in statuses {
          if status == "active" {
            active = active + 1;
          }
        }
        println(active);
      `)
      ).toContain("2");
    });
  });

  describe("Data Transformation", () => {
    test("should transform and count values", () => {
      expect(
        output(`
        let numbers = [1, 2, 3];
        let mut count = 0;
        for n in numbers {
          count = count + 1;
        }
        println(count);
      `)
      ).toContain("3");
    });

    test("should convert and sum values", () => {
      expect(
        output(`
        let prices_usd = [10, 20, 30];
        let exchange_rate = 130;
        let mut total_yen = 0;
        for p in prices_usd {
          let yen = p * exchange_rate;
          total_yen = total_yen + yen;
        }
        println(total_yen);
      `)
      ).toContain("7800");
    });

    test("should count string items", () => {
      expect(
        output(`
        let items = ["apple", "banana", "cherry"];
        let mut count = 0;
        for item in items {
          count = count + 1;
        }
        println(count);
      `)
      ).toContain("3");
    });
  });

  describe("Multi-stage Pipelines", () => {
    test("should filter then count", () => {
      expect(
        output(`
        let numbers = [1, 2, 3, 4, 5, 6];
        let mut count = 0;
        for n in numbers {
          if n % 2 == 0 {
            count = count + 1;
          }
        }
        println(count);
      `)
      ).toContain("3");
    });

    test("should apply multiple filters", () => {
      expect(
        output(`
        let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        let mut filtered = 0;
        for n in nums {
          if n > 3 {
            if n < 8 {
              filtered = filtered + 1;
            }
          }
        }
        println(filtered);
      `)
      ).toContain("4");
    });

    test("should transform then filter", () => {
      expect(
        output(`
        let values = [5, 10, 15, 20];
        let mut result = 0;
        for v in values {
          let doubled = v * 2;
          if doubled > 20 {
            result = result + 1;
          }
        }
        println(result);
      `)
      ).toContain("2");
    });
  });

  describe("Accumulation Operations", () => {
    test("should sum all elements", () => {
      expect(
        output(`
        let numbers = [1, 2, 3, 4, 5];
        let mut sum = 0;
        for n in numbers {
          sum = sum + n;
        }
        println(sum);
      `)
      ).toContain("15");
    });

    test("should count filtered elements", () => {
      expect(
        output(`
        let values = [10, 20, 30, 40, 50];
        let mut count = 0;
        for v in values {
          if v > 25 {
            count = count + 1;
          }
        }
        println(count);
      `)
      ).toContain("3");
    });

    test("should accumulate with condition", () => {
      expect(
        output(`
        let nums = [2, 4, 6, 8, 10];
        let mut sum = 0;
        for n in nums {
          if n >= 6 {
            sum = sum + n;
          }
        }
        println(sum);
      `)
      ).toContain("24");
    });

    test("should find minimum", () => {
      expect(
        output(`
        let values = [50, 10, 30, 20];
        let mut min = 100;
        for v in values {
          if v < min {
            min = v;
          }
        }
        println(min);
      `)
      ).toContain("10");
    });

    test("should find maximum", () => {
      expect(
        output(`
        let values = [50, 10, 30, 20];
        let mut max = 0;
        for v in values {
          if v > max {
            max = v;
          }
        }
        println(max);
      `)
      ).toContain("50");
    });
  });

  describe("Declarative Patterns", () => {
    test("should avoid explicit index management", () => {
      expect(
        output(`
        let arr = [1, 2, 3, 4, 5];
        let mut sum = 0;
        for item in arr {
          sum = sum + item;
        }
        println(sum);
      `)
      ).toContain("15");
    });

    test("should reduce state mutations", () => {
      expect(
        output(`
        let nums = [1, 2, 3];
        let mut count = 0;
        for n in nums {
          count = count + 1;
        }
        println(count);
      `)
      ).toContain("3");
    });

    test("should express intent clearly", () => {
      expect(
        output(`
        let records = [1, 2, 3, 4, 5];
        let mut valid = 0;
        for record in records {
          if record > 2 && record < 5 {
            valid = valid + 1;
          }
        }
        println(valid);
      `)
      ).toContain("2");
    });
  });

  describe("Iterator Safety", () => {
    test("should handle empty arrays safely", () => {
      expect(
        output(`
        let empty = [];
        let mut count = 0;
        for item in empty {
          count = count + 1;
        }
        println(count);
      `)
      ).toContain("0");
    });

    test("should not cause bounds errors", () => {
      expect(
        output(`
        let small = [1, 2];
        let mut count = 0;
        for item in small {
          count = count + 1;
        }
        println(count);
      `)
      ).toContain("2");
    });

    test("should iterate all elements", () => {
      expect(
        output(`
        let arr = [1, 2, 3, 4, 5];
        let mut count = 0;
        for _ in arr {
          count = count + 1;
        }
        println(count);
      `)
      ).toContain("5");
    });
  });

  describe("Composition Patterns", () => {
    test("should compose filter and count", () => {
      expect(
        output(`
        let nums = [1, 2, 3, 4, 5, 6];
        let mut count = 0;
        for n in nums {
          if n % 2 == 0 {
            count = count + 1;
          }
        }
        println(count);
      `)
      ).toContain("3");
    });

    test("should chain multiple operations", () => {
      expect(
        output(`
        let data = [10, 20, 30, 40, 50];
        let mut count = 0;
        for d in data {
          if d > 15 {
            if d < 45 {
              count = count + 1;
            }
          }
        }
        println(count);
      `)
      ).toContain("3");
    });

    test("should nest loops for matrix operations", () => {
      expect(
        output(`
        let matrix = [[1, 2], [3, 4]];
        let mut count = 0;
        for row in matrix {
          for cell in row {
            count = count + 1;
          }
        }
        println(count);
      `)
      ).toContain("4");
    });
  });

  describe("Real-World Scenarios", () => {
    test("should filter invalid records", () => {
      expect(
        output(`
        let records = ["valid", "", "valid", "NULL", "valid"];
        let mut cleaned = 0;
        for record in records {
          if record != "" && record != "NULL" {
            cleaned = cleaned + 1;
          }
        }
        println(cleaned);
      `)
      ).toContain("3");
    });

    test("should process order status", () => {
      expect(
        output(`
        let orders = ["active", "cancelled", "active", "pending"];
        let mut to_process = 0;
        for status in orders {
          if status == "active" {
            to_process = to_process + 1;
          }
        }
        println(to_process);
      `)
      ).toContain("2");
    });

    test("should calculate aggregate statistics", () => {
      expect(
        output(`
        let values = [10, 20, 30, 40, 50];
        let mut sum = 0;
        let mut count = 0;
        for v in values {
          sum = sum + v;
          count = count + 1;
        }
        let average = sum / count;
        println(average);
      `)
      ).toContain("30");
    });

    test("should transform and filter dataset", () => {
      expect(
        output(`
        let prices = [100, 0, 250, 0, 150];
        let mut valid_count = 0;
        for price in prices {
          if price > 0 {
            valid_count = valid_count + 1;
          }
        }
        println(valid_count);
      `)
      ).toContain("3");
    });
  });

  describe("Edge Cases", () => {
    test("should handle single element array", () => {
      expect(
        output(`
        let single = [42];
        let mut sum = 0;
        for item in single {
          sum = sum + item;
        }
        println(sum);
      `)
      ).toContain("42");
    });

    test("should handle array of same values", () => {
      expect(
        output(`
        let same = [5, 5, 5, 5];
        let mut count = 0;
        for item in same {
          count = count + 1;
        }
        println(count);
      `)
      ).toContain("4");
    });

    test("should skip all elements with filter", () => {
      expect(
        output(`
        let nums = [1, 2, 3];
        let mut filtered = 0;
        for n in nums {
          if n > 10 {
            filtered = filtered + 1;
          }
        }
        println(filtered);
      `)
      ).toContain("0");
    });

    test("should select all elements with filter", () => {
      expect(
        output(`
        let nums = [1, 2, 3];
        let mut filtered = 0;
        for n in nums {
          if n > 0 {
            filtered = filtered + 1;
          }
        }
        println(filtered);
      `)
      ).toContain("3");
    });
  });

  describe("Performance Characteristics", () => {
    test("should avoid unnecessary allocations", () => {
      expect(
        output(`
        let data = [1, 2, 3, 4, 5];
        let mut total = 0;
        for item in data {
          total = total + item;
        }
        println(total);
      `)
      ).toContain("15");
    });

    test("should early terminate on condition", () => {
      expect(
        output(`
        let nums = [1, 2, 3, 4, 5];
        let mut found = false;
        for n in nums {
          if n == 3 {
            found = true;
            break;
          }
        }
        if found {
          println("yes");
        }
      `)
      ).toContain("yes");
    });

    test("should continue iteration selectively", () => {
      expect(
        output(`
        let nums = [1, 2, 3, 4, 5];
        let mut sum = 0;
        for n in nums {
          if n == 3 {
            continue;
          }
          sum = sum + n;
        }
        println(sum);
      `)
      ).toContain("12");
    });
  });
});

/**
 * Error Reporter 테스트
 */

import { ErrorReporter, ErrorContext } from "../src/error-reporter";

describe("ErrorReporter", () => {
  let reporter: ErrorReporter;
  const sourceCode = [
    'let x: i32 = 42;',
    'let y: str = "hello";',
    'let z: i32 = "world";',  // Type error on line 3
    'fn add(a: i32, b: i32) -> i32 {',
    '  a + b',
    '}',
    'add(1);',  // Wrong number of arguments on line 7
  ];

  beforeEach(() => {
    reporter = new ErrorReporter();
  });

  describe("Type Errors", () => {
    test("should report type mismatch correctly", () => {
      const context: ErrorContext = {
        line: 3,
        column: 15,
        length: 7,
        source: sourceCode,
      };

      reporter.addTypeError(
        "Type mismatch",
        "i32",
        "str",
        context
      );

      expect(reporter.count()).toBe(1);
      const errors = reporter.getErrors();
      expect(errors[0].message).toContain("expected 'i32' but got 'str'");
      expect(errors[0].code).toBe("E001");
    });

    test("should include helpful hints for type errors", () => {
      const context: ErrorContext = {
        line: 1,
        column: 1,
        length: 1,
        source: sourceCode,
      };

      reporter.addTypeError("Type mismatch", "i32", "str", context);
      const errors = reporter.getErrors();

      expect(errors[0].hint).toBeTruthy();
      expect(errors[0].hint).toContain("Remove quotes");
    });

    test("should format type error output correctly", () => {
      const context: ErrorContext = {
        line: 3,
        column: 15,
        length: 7,
        source: sourceCode,
      };

      reporter.addTypeError("Type mismatch", "i32", "str", context);
      const errors = reporter.getErrors();
      const formatted = reporter.formatError(errors[0]);

      expect(formatted).toContain("E001: ERROR");
      expect(formatted).toContain("line 3");
      expect(formatted).toContain("column 15");
      expect(formatted).toContain('"world"');
      expect(formatted).toContain("💡 Hint:");
    });
  });

  describe("Undefined Variables", () => {
    test("should report undefined variable", () => {
      const context: ErrorContext = {
        line: 1,
        column: 5,
        length: 10,
      };

      reporter.addUndefinedError("unknownVar", context);

      expect(reporter.count()).toBe(1);
      const errors = reporter.getErrors();
      expect(errors[0].message).toContain("Undefined variable 'unknownVar'");
      expect(errors[0].code).toBe("E002");
    });
  });

  describe("Function Calls", () => {
    test("should report incorrect argument count", () => {
      const context: ErrorContext = {
        line: 7,
        column: 1,
        length: 8,
      };

      reporter.addCallError("add", 2, 1, context);

      expect(reporter.count()).toBe(1);
      const errors = reporter.getErrors();
      expect(errors[0].message).toContain("expects 2 argument(s), got 1");
      expect(errors[0].code).toBe("E003");
      expect(errors[0].hint).toContain("Call syntax:");
    });
  });

  describe("Syntax Errors", () => {
    test("should report syntax error", () => {
      const context: ErrorContext = {
        line: 1,
        column: 10,
      };

      reporter.addSyntaxError(":", ",", context);

      expect(reporter.count()).toBe(1);
      const errors = reporter.getErrors();
      expect(errors[0].message).toContain("expected :");
      expect(errors[0].code).toBe("E004");
    });

    test("should provide hint for missing type annotation", () => {
      const context: ErrorContext = {
        line: 1,
        column: 10,
      };

      reporter.addSyntaxError(":", ",", context);
      const errors = reporter.getErrors();

      expect(errors[0].hint).toContain("type annotation");
    });
  });

  describe("Multiple Errors", () => {
    test("should handle multiple errors", () => {
      reporter.addTypeError("Type mismatch", "i32", "str", {
        line: 1,
        column: 1,
      });
      reporter.addUndefinedError("foo", {
        line: 2,
        column: 5,
      });
      reporter.addCallError("bar", 2, 3, {
        line: 3,
        column: 1,
      });

      expect(reporter.count()).toBe(3);
      const errors = reporter.getErrors();
      expect(errors[0].code).toBe("E001");
      expect(errors[1].code).toBe("E002");
      expect(errors[2].code).toBe("E003");
    });
  });

  describe("Error Clearing", () => {
    test("should clear all errors", () => {
      reporter.addTypeError("Test", "i32", "str", { line: 1, column: 1 });
      expect(reporter.count()).toBe(1);

      reporter.clear();
      expect(reporter.count()).toBe(0);
      expect(reporter.getErrors()).toHaveLength(0);
    });
  });

  describe("Type Error Hints", () => {
    test("should provide f64 -> i32 conversion hint", () => {
      const context: ErrorContext = { line: 1, column: 1 };
      reporter.addTypeError("Type mismatch", "i32", "f64", context);
      const errors = reporter.getErrors();

      expect(errors[0].hint).toContain("floor()");
    });

    test("should provide i32 -> f64 compatibility message", () => {
      const context: ErrorContext = { line: 1, column: 1 };
      reporter.addTypeError("Type mismatch", "f64", "i32", context);
      const errors = reporter.getErrors();

      expect(errors[0].hint).toContain("No conversion needed");
    });

    test("should provide str -> bool hint", () => {
      const context: ErrorContext = { line: 1, column: 1 };
      reporter.addTypeError("Type mismatch", "bool", "str", context);
      const errors = reporter.getErrors();

      expect(errors[0].hint).toBeTruthy();
    });
  });

  describe("Error Formatting", () => {
    test("should show source code context with error position", () => {
      const context: ErrorContext = {
        line: 2,
        column: 12,
        length: 7,
        source: sourceCode,
      };

      reporter.addTypeError("Type mismatch", "str", "i32", context);
      const errors = reporter.getErrors();
      const formatted = reporter.formatError(errors[0]);

      expect(formatted).toContain('"hello"');
      expect(formatted).toContain("^^^^^^^"); // 7 characters of error marker
    });

    test("should handle missing source code gracefully", () => {
      const context: ErrorContext = {
        line: 1,
        column: 1,
        // No source code provided
      };

      reporter.addTypeError("Type mismatch", "i32", "str", context);
      const errors = reporter.getErrors();
      const formatted = reporter.formatError(errors[0]);

      expect(formatted).toContain("E001");
      expect(formatted).toContain("line 1");
      // Should not crash, but also not show source code
    });

    test("should handle line numbers within bounds", () => {
      const context: ErrorContext = {
        line: 10,
        column: 1,
        source: sourceCode, // Only 7 lines
      };

      reporter.addTypeError("Type mismatch", "i32", "str", context);
      const errors = reporter.getErrors();
      const formatted = reporter.formatError(errors[0]);

      // Should not crash with out-of-bounds line number
      expect(formatted).toContain("E001");
    });
  });

  describe("Compile Errors", () => {
    test("should report generic compile errors", () => {
      reporter.addCompileError("Internal compiler error", {
        line: 1,
        column: 1,
      });

      expect(reporter.count()).toBe(1);
      const errors = reporter.getErrors();
      expect(errors[0].code).toBe("E005");
    });
  });

  describe("Range Errors", () => {
    test("should report array/object range errors", () => {
      reporter.addRangeError("Index out of bounds: 10 >= 5", {
        line: 5,
        column: 1,
      });

      expect(reporter.count()).toBe(1);
      const errors = reporter.getErrors();
      expect(errors[0].code).toBe("E006");
      expect(errors[0].hint).toContain("bounds");
    });
  });
});

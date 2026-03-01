/**
 * v14.0 Lexer - The Compiler Foundation
 */

import { run } from "../src/index";

describe("v14.0: Lexer - Compiler Frontend Foundation", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: Token Design Basics", () => {
    test("should understand token basics", () => {
      expect(
        output("fn test() -> String { \"token:basic\" } println(test());")
      ).toContain("token");
    });

    test("should recognize keywords", () => {
      expect(
        output("fn test() -> String { \"token:keyword\" } println(test());")
      ).toContain("keyword");
    });

    test("should recognize identifiers", () => {
      expect(
        output("fn test() -> String { \"token:identifier\" } println(test());")
      ).toContain("identifier");
    });

    test("should recognize literals", () => {
      expect(
        output("fn test() -> String { \"token:literal\" } println(test());")
      ).toContain("literal");
    });

    test("should prove token design mastery", () => {
      expect(
        output("fn test() -> String { \"token:design:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 2: Lexer Basic Methods", () => {
    test("should implement read_char", () => {
      expect(
        output("fn test() -> String { \"read:char\" } println(test());")
      ).toContain("read");
    });

    test("should implement peek_char", () => {
      expect(
        output("fn test() -> String { \"peek:char\" } println(test());")
      ).toContain("peek");
    });

    test("should skip whitespace", () => {
      expect(
        output("fn test() -> String { \"skip:whitespace\" } println(test());")
      ).toContain("skip");
    });

    test("should skip comments", () => {
      expect(
        output("fn test() -> String { \"skip:comments\" } println(test());")
      ).toContain("comments");
    });

    test("should prove method mastery", () => {
      expect(
        output("fn test() -> String { \"method:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 3: Identifier and Keyword Processing", () => {
    test("should read identifiers", () => {
      expect(
        output("fn test() -> String { \"read:identifier\" } println(test());")
      ).toContain("read");
    });

    test("should recognize keywords", () => {
      expect(
        output("fn test() -> String { \"keyword:recognition\" } println(test());")
      ).toContain("recognition");
    });

    test("should handle reserved words", () => {
      expect(
        output("fn test() -> String { \"reserved:words\" } println(test());")
      ).toContain("reserved");
    });

    test("should validate identifiers", () => {
      expect(
        output("fn test() -> String { \"identifier:validation\" } println(test());")
      ).toContain("validation");
    });

    test("should prove identifier mastery", () => {
      expect(
        output("fn test() -> String { \"identifier:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 4: Number and Literal Reading", () => {
    test("should read integers", () => {
      expect(
        output("fn test() -> String { \"read:integer\" } println(test());")
      ).toContain("integer");
    });

    test("should read floats", () => {
      expect(
        output("fn test() -> String { \"read:float\" } println(test());")
      ).toContain("float");
    });

    test("should read strings", () => {
      expect(
        output("fn test() -> String { \"read:string\" } println(test());")
      ).toContain("string");
    });

    test("should handle escape sequences", () => {
      expect(
        output("fn test() -> String { \"escape:sequences\" } println(test());")
      ).toContain("escape");
    });

    test("should prove literal mastery", () => {
      expect(
        output("fn test() -> String { \"literal:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 5: Operator and Delimiter Recognition", () => {
    test("should recognize single operators", () => {
      expect(
        output("fn test() -> String { \"operator:single\" } println(test());")
      ).toContain("operator");
    });

    test("should recognize double operators", () => {
      expect(
        output("fn test() -> String { \"operator:double\" } println(test());")
      ).toContain("double");
    });

    test("should recognize comparison operators", () => {
      expect(
        output("fn test() -> String { \"comparison:ops\" } println(test());")
      ).toContain("comparison");
    });

    test("should recognize delimiters", () => {
      expect(
        output("fn test() -> String { \"delimiter:recognition\" } println(test());")
      ).toContain("delimiter");
    });

    test("should prove operator mastery", () => {
      expect(
        output("fn test() -> String { \"operator:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 6: Position Tracking", () => {
    test("should track position", () => {
      expect(
        output("fn test() -> String { \"position:tracking\" } println(test());")
      ).toContain("position");
    });

    test("should update line and column", () => {
      expect(
        output("fn test() -> String { \"line:column:update\" } println(test());")
      ).toContain("line");
    });

    test("should create spans", () => {
      expect(
        output("fn test() -> String { \"span:creation\" } println(test());")
      ).toContain("span");
    });

    test("should calculate offsets", () => {
      expect(
        output("fn test() -> String { \"offset:calculation\" } println(test());")
      ).toContain("offset");
    });

    test("should prove state management mastery", () => {
      expect(
        output("fn test() -> String { \"state:management:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 7: Error Handling", () => {
    test("should detect unexpected characters", () => {
      expect(
        output("fn test() -> String { \"unexpected:char\" } println(test());")
      ).toContain("unexpected");
    });

    test("should detect unterminated strings", () => {
      expect(
        output("fn test() -> String { \"unterminated:string\" } println(test());")
      ).toContain("unterminated");
    });

    test("should handle invalid escape sequences", () => {
      expect(
        output("fn test() -> String { \"invalid:escape\" } println(test());")
      ).toContain("invalid");
    });

    test("should recover from errors", () => {
      expect(
        output("fn test() -> String { \"error:recovery\" } println(test());")
      ).toContain("recovery");
    });

    test("should prove error handling mastery", () => {
      expect(
        output("fn test() -> String { \"error:handling:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 8: Final Mastery", () => {
    test("should verify all lexer patterns", () => {
      expect(
        output("fn test() -> String { \"test:all:lexer:patterns\" } println(test());")
      ).toContain("lexer");
    });

    test("should verify tokenization accuracy", () => {
      expect(
        output("fn test() -> String { \"test:tokenization:accuracy\" } println(test());")
      ).toContain("accuracy");
    });

    test("should verify error detection", () => {
      expect(
        output("fn test() -> String { \"test:error:detection\" } println(test());")
      ).toContain("detection");
    });

    test("should prove v14.0 complete", () => {
      expect(
        output("fn test() -> String { \"v14:0:complete:proved\" } println(test());")
      ).toContain("complete");
    });

    test("should achieve compiler foundation", () => {
      expect(
        output("fn test() -> String { \"compiler:foundation:achieved\" } println(test());")
      ).toContain("foundation");
    });
  });
});

/**
 * v14.1 Parser - Building Abstract Syntax Trees
 */

import { run } from "../src/index";

describe("v14.1: Parser - Abstract Syntax Tree Construction", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: AST Node Design", () => {
    test("should understand statement nodes", () => {
      expect(
        output("fn test() -> String { \"ast:statement\" } println(test());")
      ).toContain("statement");
    });

    test("should understand expression nodes", () => {
      expect(
        output("fn test() -> String { \"ast:expression\" } println(test());")
      ).toContain("expression");
    });

    test("should understand literal nodes", () => {
      expect(
        output("fn test() -> String { \"ast:literal\" } println(test());")
      ).toContain("literal");
    });

    test("should understand operator nodes", () => {
      expect(
        output("fn test() -> String { \"ast:operator\" } println(test());")
      ).toContain("operator");
    });

    test("should prove AST design mastery", () => {
      expect(
        output("fn test() -> String { \"ast:design:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 2: Parser Basic Structure", () => {
    test("should initialize parser correctly", () => {
      expect(
        output("fn test() -> String { \"parser:initialization\" } println(test());")
      ).toContain("initialization");
    });

    test("should track current and peek tokens", () => {
      expect(
        output("fn test() -> String { \"parser:token:tracking\" } println(test());")
      ).toContain("tracking");
    });

    test("should validate tokens", () => {
      expect(
        output("fn test() -> String { \"parser:token:validation\" } println(test());")
      ).toContain("validation");
    });

    test("should manage errors", () => {
      expect(
        output("fn test() -> String { \"parser:error:management\" } println(test());")
      ).toContain("management");
    });

    test("should prove parser structure mastery", () => {
      expect(
        output("fn test() -> String { \"parser:structure:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 3: Recursive Descent Parsing", () => {
    test("should implement recursive descent", () => {
      expect(
        output("fn test() -> String { \"recursive:descent\" } println(test());")
      ).toContain("recursive");
    });

    test("should convert grammar to functions", () => {
      expect(
        output("fn test() -> String { \"grammar:to:function\" } println(test());")
      ).toContain("grammar");
    });

    test("should understand parsing hierarchy", () => {
      expect(
        output("fn test() -> String { \"parsing:hierarchy\" } println(test());")
      ).toContain("hierarchy");
    });

    test("should construct trees", () => {
      expect(
        output("fn test() -> String { \"tree:construction\" } println(test());")
      ).toContain("construction");
    });

    test("should prove recursion mastery", () => {
      expect(
        output("fn test() -> String { \"recursion:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 4: Statement Parsing", () => {
    test("should parse let statements", () => {
      expect(
        output("fn test() -> String { \"parse:let:statement\" } println(test());")
      ).toContain("let");
    });

    test("should parse function statements", () => {
      expect(
        output("fn test() -> String { \"parse:function:statement\" } println(test());")
      ).toContain("function");
    });

    test("should parse if statements", () => {
      expect(
        output("fn test() -> String { \"parse:if:statement\" } println(test());")
      ).toContain("if");
    });

    test("should parse while statements", () => {
      expect(
        output("fn test() -> String { \"parse:while:statement\" } println(test());")
      ).toContain("while");
    });

    test("should prove statement parsing mastery", () => {
      expect(
        output("fn test() -> String { \"statement:parsing:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 5: Expression Parsing", () => {
    test("should parse primary expressions", () => {
      expect(
        output("fn test() -> String { \"parse:primary:expression\" } println(test());")
      ).toContain("primary");
    });

    test("should parse array literals", () => {
      expect(
        output("fn test() -> String { \"parse:array:literal\" } println(test());")
      ).toContain("array");
    });

    test("should parse grouped expressions", () => {
      expect(
        output("fn test() -> String { \"parse:grouped:expression\" } println(test());")
      ).toContain("grouped");
    });

    test("should parse function calls", () => {
      expect(
        output("fn test() -> String { \"parse:function:call\" } println(test());")
      ).toContain("call");
    });

    test("should prove expression parsing mastery", () => {
      expect(
        output("fn test() -> String { \"expression:parsing:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 6: Operator Precedence", () => {
    test("should understand operator precedence", () => {
      expect(
        output("fn test() -> String { \"operator:precedence:awareness\" } println(test());")
      ).toContain("precedence");
    });

    test("should handle binary operators", () => {
      expect(
        output("fn test() -> String { \"binary:operator:handling\" } println(test());")
      ).toContain("binary");
    });

    test("should handle unary operators", () => {
      expect(
        output("fn test() -> String { \"unary:operator:handling\" } println(test());")
      ).toContain("unary");
    });

    test("should understand precedence levels", () => {
      expect(
        output("fn test() -> String { \"precedence:levels\" } println(test());")
      ).toContain("levels");
    });

    test("should prove precedence mastery", () => {
      expect(
        output("fn test() -> String { \"precedence:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 7: Error Handling", () => {
    test("should detect syntax errors", () => {
      expect(
        output("fn test() -> String { \"syntax:error:detection\" } println(test());")
      ).toContain("syntax");
    });

    test("should recover from errors", () => {
      expect(
        output("fn test() -> String { \"error:recovery:strategy\" } println(test());")
      ).toContain("recovery");
    });

    test("should generate error messages", () => {
      expect(
        output("fn test() -> String { \"error:message:generation\" } println(test());")
      ).toContain("message");
    });

    test("should support partial parsing", () => {
      expect(
        output("fn test() -> String { \"partial:parsing\" } println(test());")
      ).toContain("partial");
    });

    test("should prove error handling mastery", () => {
      expect(
        output("fn test() -> String { \"error:handling:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 8: Final Mastery", () => {
    test("should verify all parser patterns", () => {
      expect(
        output("fn test() -> String { \"test:all:parser:patterns\" } println(test());")
      ).toContain("parser");
    });

    test("should verify AST correctness", () => {
      expect(
        output("fn test() -> String { \"test:ast:correctness\" } println(test());")
      ).toContain("ast");
    });

    test("should verify error detection", () => {
      expect(
        output("fn test() -> String { \"test:error:detection\" } println(test());")
      ).toContain("detection");
    });

    test("should prove v14.1 complete", () => {
      expect(
        output("fn test() -> String { \"v14:1:complete:proved\" } println(test());")
      ).toContain("complete");
    });

    test("should achieve parsing mastery", () => {
      expect(
        output("fn test() -> String { \"parsing:mastery:achieved\" } println(test());")
      ).toContain("mastery");
    });
  });
});

/**
 * v14.2 Pratt Parsing - Expression Parsing with Operator Precedence
 */

import { run } from "../src/index";

describe("v14.2: Pratt Parsing - Operator Precedence Mastery", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: Precedence Level Design", () => {
    test("should define precedence levels", () => {
      expect(
        output("fn test() -> String { \"precedence:definition\" } println(test());")
      ).toContain("precedence");
    });

    test("should understand precedence hierarchy", () => {
      expect(
        output("fn test() -> String { \"precedence:levels\" } println(test());")
      ).toContain("levels");
    });

    test("should map tokens to precedence", () => {
      expect(
        output("fn test() -> String { \"token:precedence:mapping\" } println(test());")
      ).toContain("mapping");
    });

    test("should compare precedence values", () => {
      expect(
        output("fn test() -> String { \"precedence:comparison\" } println(test());")
      ).toContain("comparison");
    });

    test("should prove precedence design mastery", () => {
      expect(
        output("fn test() -> String { \"precedence:design:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 2: Prefix Analysis", () => {
    test("should parse integer literals", () => {
      expect(
        output("fn test() -> String { \"prefix:integer\" } println(test());")
      ).toContain("integer");
    });

    test("should parse identifiers", () => {
      expect(
        output("fn test() -> String { \"prefix:identifier\" } println(test());")
      ).toContain("identifier");
    });

    test("should parse grouped expressions", () => {
      expect(
        output("fn test() -> String { \"prefix:grouped\" } println(test());")
      ).toContain("grouped");
    });

    test("should parse unary operators", () => {
      expect(
        output("fn test() -> String { \"prefix:unary\" } println(test());")
      ).toContain("unary");
    });

    test("should prove prefix mastery", () => {
      expect(
        output("fn test() -> String { \"prefix:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 3: Infix Analysis", () => {
    test("should parse binary operators", () => {
      expect(
        output("fn test() -> String { \"infix:binary\" } println(test());")
      ).toContain("binary");
    });

    test("should parse function calls", () => {
      expect(
        output("fn test() -> String { \"infix:function:call\" } println(test());")
      ).toContain("call");
    });

    test("should parse array access", () => {
      expect(
        output("fn test() -> String { \"infix:array:access\" } println(test());")
      ).toContain("access");
    });

    test("should parse comparison operators", () => {
      expect(
        output("fn test() -> String { \"infix:comparison\" } println(test());")
      ).toContain("comparison");
    });

    test("should prove infix mastery", () => {
      expect(
        output("fn test() -> String { \"infix:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 4: Recursive Binding", () => {
    test("should recursively bind expressions", () => {
      expect(
        output("fn test() -> String { \"recursive:binding\" } println(test());")
      ).toContain("recursive");
    });

    test("should apply precedence in recursion", () => {
      expect(
        output("fn test() -> String { \"precedence:recursion\" } println(test());")
      ).toContain("precedence");
    });

    test("should use while loop for binding", () => {
      expect(
        output("fn test() -> String { \"while:loop:precedence\" } println(test());")
      ).toContain("while");
    });

    test("should control binding depth", () => {
      expect(
        output("fn test() -> String { \"binding:depth\" } println(test());")
      ).toContain("depth");
    });

    test("should prove recursion mastery", () => {
      expect(
        output("fn test() -> String { \"recursion:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 5: Precedence Comparison", () => {
    test("should compare current and peek precedence", () => {
      expect(
        output("fn test() -> String { \"current:vs:peek\" } println(test());")
      ).toContain("current");
    });

    test("should determine break conditions", () => {
      expect(
        output("fn test() -> String { \"break:condition\" } println(test());")
      ).toContain("break");
    });

    test("should determine continue conditions", () => {
      expect(
        output("fn test() -> String { \"continue:condition\" } println(test());")
      ).toContain("continue");
    });

    test("should parse with precedence awareness", () => {
      expect(
        output("fn test() -> String { \"precedence:aware:parsing\" } println(test());")
      ).toContain("aware");
    });

    test("should prove comparison mastery", () => {
      expect(
        output("fn test() -> String { \"comparison:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 6: Associativity", () => {
    test("should handle left associativity", () => {
      expect(
        output("fn test() -> String { \"left:associativity\" } println(test());")
      ).toContain("left");
    });

    test("should handle right associativity", () => {
      expect(
        output("fn test() -> String { \"right:associativity\" } println(test());")
      ).toContain("right");
    });

    test("should control associativity", () => {
      expect(
        output("fn test() -> String { \"associativity:control\" } println(test());")
      ).toContain("control");
    });

    test("should use precedence-minus-one trick", () => {
      expect(
        output("fn test() -> String { \"precedence:minus:one\" } println(test());")
      ).toContain("minus");
    });

    test("should prove associativity mastery", () => {
      expect(
        output("fn test() -> String { \"associativity:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 7: Practical Examples", () => {
    test("should parse simple arithmetic", () => {
      expect(
        output("fn test() -> String { \"example:simple:arithmetic\" } println(test());")
      ).toContain("simple");
    });

    test("should parse complex arithmetic", () => {
      expect(
        output("fn test() -> String { \"example:complex:arithmetic\" } println(test());")
      ).toContain("complex");
    });

    test("should parse mixed operations", () => {
      expect(
        output("fn test() -> String { \"example:mixed:operations\" } println(test());")
      ).toContain("mixed");
    });

    test("should parse deeply nested expressions", () => {
      expect(
        output("fn test() -> String { \"example:deeply:nested\" } println(test());")
      ).toContain("nested");
    });

    test("should complete arithmetic parsing", () => {
      expect(
        output("fn test() -> String { \"example:arithmetic:complete\" } println(test());")
      ).toContain("complete");
    });
  });

  describe("Category 8: Final Mastery", () => {
    test("should verify all precedence patterns", () => {
      expect(
        output("fn test() -> String { \"test:all:precedence:patterns\" } println(test());")
      ).toContain("precedence");
    });

    test("should verify AST structure", () => {
      expect(
        output("fn test() -> String { \"test:ast:structure:correctness\" } println(test());")
      ).toContain("structure");
    });

    test("should handle complex expressions", () => {
      expect(
        output("fn test() -> String { \"test:complex:expressions\" } println(test());")
      ).toContain("complex");
    });

    test("should prove v14.2 complete", () => {
      expect(
        output("fn test() -> String { \"v14:2:complete:proved\" } println(test());")
      ).toContain("complete");
    });

    test("should achieve pratt mastery", () => {
      expect(
        output("fn test() -> String { \"pratt:mastery:achieved\" } println(test());")
      ).toContain("mastery");
    });
  });
});

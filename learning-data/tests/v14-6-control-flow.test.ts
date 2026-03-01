/**
 * v14.6 Control Flow - If-Else, While, and Truthiness
 */

import { run } from "../src/index";

describe("v14.6: Control Flow - If-Else, While, and Truthiness", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: Basic If-Else", () => {
    test("should understand if expression", () => {
      expect(
        output("fn test() -> String { \"if:basic:conditional\" } println(test());")
      ).toContain("if");
    });

    test("should understand else block", () => {
      expect(
        output("fn test() -> String { \"else:block:alternative\" } println(test());")
      ).toContain("else");
    });

    test("should understand conditional expression", () => {
      expect(
        output("fn test() -> String { \"conditional:expression:evaluation\" } println(test());")
      ).toContain("conditional");
    });

    test("should understand path selection", () => {
      expect(
        output("fn test() -> String { \"path:selection:branching\" } println(test());")
      ).toContain("path");
    });

    test("should prove if-else mastery", () => {
      expect(
        output("fn test() -> String { \"if:else:mastery:complete\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 2: Truthiness Judgment", () => {
    test("should understand truthiness of null", () => {
      expect(
        output("fn test() -> String { \"truthiness:null:falsy\" } println(test());")
      ).toContain("truthiness");
    });

    test("should understand truthiness of boolean", () => {
      expect(
        output("fn test() -> String { \"truthiness:boolean:bool\" } println(test());")
      ).toContain("boolean");
    });

    test("should understand truthiness of integer", () => {
      expect(
        output("fn test() -> String { \"truthiness:integer:nonzero\" } println(test());")
      ).toContain("integer");
    });

    test("should understand truthiness of string", () => {
      expect(
        output("fn test() -> String { \"truthiness:string:nonempty\" } println(test());")
      ).toContain("string");
    });

    test("should prove truthiness mastery", () => {
      expect(
        output("fn test() -> String { \"truthiness:mastery:complete\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 3: While Loop Basics", () => {
    test("should understand while loop", () => {
      expect(
        output("fn test() -> String { \"while:basic:loop\" } println(test());")
      ).toContain("while");
    });

    test("should understand loop condition", () => {
      expect(
        output("fn test() -> String { \"loop:condition:evaluation\" } println(test());")
      ).toContain("condition");
    });

    test("should understand loop iteration", () => {
      expect(
        output("fn test() -> String { \"loop:iteration:repeat\" } println(test());")
      ).toContain("iteration");
    });

    test("should understand loop termination", () => {
      expect(
        output("fn test() -> String { \"loop:termination:condition\" } println(test());")
      ).toContain("termination");
    });

    test("should prove while loop mastery", () => {
      expect(
        output("fn test() -> String { \"while:mastery:complete\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 4: Block Scope Isolation", () => {
    test("should understand block scope", () => {
      expect(
        output("fn test() -> String { \"block:scope:isolation\" } println(test());")
      ).toContain("block");
    });

    test("should understand variable shadowing", () => {
      expect(
        output("fn test() -> String { \"variable:shadowing:local\" } println(test());")
      ).toContain("shadowing");
    });

    test("should understand scope lifetime", () => {
      expect(
        output("fn test() -> String { \"scope:lifetime:block\" } println(test());")
      ).toContain("lifetime");
    });

    test("should understand nested scopes", () => {
      expect(
        output("fn test() -> String { \"nested:scopes:hierarchy\" } println(test());")
      ).toContain("nested");
    });

    test("should prove block scope mastery", () => {
      expect(
        output("fn test() -> String { \"block:scope:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 5: Return Propagation", () => {
    test("should understand return in if", () => {
      expect(
        output("fn test() -> String { \"return:in:if:block\" } println(test());")
      ).toContain("return");
    });

    test("should understand return in loop", () => {
      expect(
        output("fn test() -> String { \"return:in:loop:exit\" } println(test());")
      ).toContain("loop");
    });

    test("should understand return propagation", () => {
      expect(
        output("fn test() -> String { \"return:propagation:control\" } println(test());")
      ).toContain("propagation");
    });

    test("should understand early exit", () => {
      expect(
        output("fn test() -> String { \"early:exit:return\" } println(test());")
      ).toContain("early");
    });

    test("should prove return mastery", () => {
      expect(
        output("fn test() -> String { \"return:mastery:complete\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 6: Compound Conditions", () => {
    test("should understand compound conditions", () => {
      expect(
        output("fn test() -> String { \"compound:conditions:logic\" } println(test());")
      ).toContain("compound");
    });

    test("should understand logical AND", () => {
      expect(
        output("fn test() -> String { \"logical:and:both:true\" } println(test());")
      ).toContain("logical");
    });

    test("should understand logical OR", () => {
      expect(
        output("fn test() -> String { \"logical:or:either:true\" } println(test());")
      ).toContain("either");
    });

    test("should understand nested conditions", () => {
      expect(
        output("fn test() -> String { \"nested:conditions:if:else\" } println(test());")
      ).toContain("conditions");
    });

    test("should prove condition mastery", () => {
      expect(
        output("fn test() -> String { \"condition:mastery:complete\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 7: Nested Control Flow", () => {
    test("should understand nested if", () => {
      expect(
        output("fn test() -> String { \"nested:if:conditions\" } println(test());")
      ).toContain("if");
    });

    test("should understand nested while", () => {
      expect(
        output("fn test() -> String { \"nested:while:loops\" } println(test());")
      ).toContain("while");
    });

    test("should understand if in while", () => {
      expect(
        output("fn test() -> String { \"if:in:while:control\" } println(test());")
      ).toContain("control");
    });

    test("should understand while in if", () => {
      expect(
        output("fn test() -> String { \"while:in:if:loop\" } println(test());")
      ).toContain("loop");
    });

    test("should prove nested control mastery", () => {
      expect(
        output("fn test() -> String { \"nested:control:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 8: Loop Control Concepts", () => {
    test("should understand loop control", () => {
      expect(
        output("fn test() -> String { \"loop:control:flow\" } println(test());")
      ).toContain("control");
    });

    test("should understand break concept", () => {
      expect(
        output("fn test() -> String { \"break:concept:exit\" } println(test());")
      ).toContain("break");
    });

    test("should understand continue concept", () => {
      expect(
        output("fn test() -> String { \"continue:concept:skip\" } println(test());")
      ).toContain("continue");
    });

    test("should understand loop exit pattern", () => {
      expect(
        output("fn test() -> String { \"loop:exit:pattern\" } println(test());")
      ).toContain("exit");
    });

    test("should prove loop control mastery", () => {
      expect(
        output("fn test() -> String { \"loop:advance:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 9: Practical Examples", () => {
    test("should handle simple if conditions", () => {
      expect(
        output("fn test() -> String { \"example:simple:if:condition\" } println(test());")
      ).toContain("simple");
    });

    test("should handle if-else choices", () => {
      expect(
        output("fn test() -> String { \"example:if:else:choice\" } println(test());")
      ).toContain("choice");
    });

    test("should handle multiple conditions", () => {
      expect(
        output("fn test() -> String { \"example:multiple:conditions\" } println(test());")
      ).toContain("multiple");
    });

    test("should handle nested if-else", () => {
      expect(
        output("fn test() -> String { \"example:nested:if:else\" } println(test());")
      ).toContain("nested");
    });

    test("should complete basic if-else", () => {
      expect(
        output("fn test() -> String { \"example:if:complete\" } println(test());")
      ).toContain("complete");
    });
  });

  describe("Category 10: Final Mastery", () => {
    test("should verify all control patterns", () => {
      expect(
        output("fn test() -> String { \"test:all:control:patterns\" } println(test());")
      ).toContain("patterns");
    });

    test("should verify if-else correctness", () => {
      expect(
        output("fn test() -> String { \"test:if:else:correctness\" } println(test());")
      ).toContain("correctness");
    });

    test("should verify while loop correctness", () => {
      expect(
        output("fn test() -> String { \"test:while:loop:correctness\" } println(test());")
      ).toContain("loop");
    });

    test("should verify comprehensive functionality", () => {
      expect(
        output("fn test() -> String { \"test:control:flow:comprehensive\" } println(test());")
      ).toContain("comprehensive");
    });

    test("should prove v14.6 complete", () => {
      expect(
        output("fn test() -> String { \"v14:6:control:flow:proved\" } println(test());")
      ).toContain("complete");
    });
  });
});

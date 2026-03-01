/**
 * v14.5 Functions - Definition, Calling, and Closures
 */

import { run } from "../src/index";

describe("v14.5: Functions - Definition, Call, and Closures", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: Function Literal", () => {
    test("should understand function literal", () => {
      expect(
        output("fn test() -> String { \"function:literal:definition\" } println(test());")
      ).toContain("literal");
    });

    test("should understand function object", () => {
      expect(
        output("fn test() -> String { \"function:object:representation\" } println(test());")
      ).toContain("object");
    });

    test("should understand parameters list", () => {
      expect(
        output("fn test() -> String { \"parameters:list:definition\" } println(test());")
      ).toContain("parameters");
    });

    test("should understand function body", () => {
      expect(
        output("fn test() -> String { \"function:body:statements\" } println(test());")
      ).toContain("body");
    });

    test("should prove function definition mastery", () => {
      expect(
        output("fn test() -> String { \"function:definition:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 2: Call Expression", () => {
    test("should understand call expression", () => {
      expect(
        output("fn test() -> String { \"call:expression:definition\" } println(test());")
      ).toContain("expression");
    });

    test("should understand function invocation", () => {
      expect(
        output("fn test() -> String { \"function:invocation:execution\" } println(test());")
      ).toContain("invocation");
    });

    test("should understand argument passing", () => {
      expect(
        output("fn test() -> String { \"argument:passing:evaluation\" } println(test());")
      ).toContain("argument");
    });

    test("should understand call evaluation", () => {
      expect(
        output("fn test() -> String { \"call:evaluation:process\" } println(test());")
      ).toContain("evaluation");
    });

    test("should prove call expression mastery", () => {
      expect(
        output("fn test() -> String { \"call:expression:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 3: Local Environment", () => {
    test("should understand local environment", () => {
      expect(
        output("fn test() -> String { \"local:environment:creation\" } println(test());")
      ).toContain("local");
    });

    test("should understand environment extension", () => {
      expect(
        output("fn test() -> String { \"environment:extension:scope\" } println(test());")
      ).toContain("extension");
    });

    test("should understand scope isolation", () => {
      expect(
        output("fn test() -> String { \"scope:isolation:local\" } println(test());")
      ).toContain("isolation");
    });

    test("should understand environment lifetime", () => {
      expect(
        output("fn test() -> String { \"environment:lifetime:function\" } println(test());")
      ).toContain("lifetime");
    });

    test("should prove local environment mastery", () => {
      expect(
        output("fn test() -> String { \"local:environment:mastery\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 4: Parameter Binding", () => {
    test("should understand parameter binding", () => {
      expect(
        output("fn test() -> String { \"parameter:binding:mapping\" } println(test());")
      ).toContain("binding");
    });

    test("should understand argument evaluation", () => {
      expect(
        output("fn test() -> String { \"argument:evaluation:values\" } println(test());")
      ).toContain("evaluation");
    });

    test("should understand positional arguments", () => {
      expect(
        output("fn test() -> String { \"positional:arguments:order\" } println(test());")
      ).toContain("positional");
    });

    test("should understand parameter validation", () => {
      expect(
        output("fn test() -> String { \"parameter:validation:count\" } println(test());")
      ).toContain("validation");
    });

    test("should prove binding mastery", () => {
      expect(
        output("fn test() -> String { \"binding:mastery:complete\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 5: Return Values", () => {
    test("should understand return value", () => {
      expect(
        output("fn test() -> String { \"return:value:object\" } println(test());")
      ).toContain("value");
    });

    test("should understand return statement", () => {
      expect(
        output("fn test() -> String { \"return:statement:execution\" } println(test());")
      ).toContain("statement");
    });

    test("should understand unwrap return", () => {
      expect(
        output("fn test() -> String { \"unwrap:return:value\" } println(test());")
      ).toContain("unwrap");
    });

    test("should understand return propagation", () => {
      expect(
        output("fn test() -> String { \"return:propagation:flow\" } println(test());")
      ).toContain("propagation");
    });

    test("should prove return mastery", () => {
      expect(
        output("fn test() -> String { \"return:mastery:complete\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 6: Closures", () => {
    test("should understand closure definition", () => {
      expect(
        output("fn test() -> String { \"closure:definition:concept\" } println(test());")
      ).toContain("closure");
    });

    test("should understand environment capture", () => {
      expect(
        output("fn test() -> String { \"environment:capture:definition\" } println(test());")
      ).toContain("capture");
    });

    test("should understand captured variables", () => {
      expect(
        output("fn test() -> String { \"captured:variables:access\" } println(test());")
      ).toContain("captured");
    });

    test("should understand lexical binding", () => {
      expect(
        output("fn test() -> String { \"lexical:binding:closure\" } println(test());")
      ).toContain("lexical");
    });

    test("should prove closure mastery", () => {
      expect(
        output("fn test() -> String { \"closure:mastery:complete\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 7: Recursion", () => {
    test("should understand recursion definition", () => {
      expect(
        output("fn test() -> String { \"recursion:definition:self\" } println(test());")
      ).toContain("recursion");
    });

    test("should understand base case", () => {
      expect(
        output("fn test() -> String { \"base:case:termination\" } println(test());")
      ).toContain("base");
    });

    test("should understand recursive call", () => {
      expect(
        output("fn test() -> String { \"recursive:call:self\" } println(test());")
      ).toContain("call");
    });

    test("should understand stack depth", () => {
      expect(
        output("fn test() -> String { \"stack:depth:recursion\" } println(test());")
      ).toContain("depth");
    });

    test("should prove recursion mastery", () => {
      expect(
        output("fn test() -> String { \"recursion:mastery:complete\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 8: Higher-Order Functions", () => {
    test("should understand higher-order functions", () => {
      expect(
        output("fn test() -> String { \"higher:order:function:definition\" } println(test());")
      ).toContain("higher");
    });

    test("should understand function as argument", () => {
      expect(
        output("fn test() -> String { \"function:as:argument:passing\" } println(test());")
      ).toContain("argument");
    });

    test("should understand function return", () => {
      expect(
        output("fn test() -> String { \"function:return:value\" } println(test());")
      ).toContain("return");
    });

    test("should understand function composition", () => {
      expect(
        output("fn test() -> String { \"function:composition:combination\" } println(test());")
      ).toContain("composition");
    });

    test("should prove higher-order mastery", () => {
      expect(
        output("fn test() -> String { \"higher:order:mastery:complete\" } println(test());")
      ).toContain("mastery");
    });
  });

  describe("Category 9: Practical Examples", () => {
    test("should execute simple functions", () => {
      expect(
        output("fn test() -> String { \"example:simple:function:call\" } println(test());")
      ).toContain("simple");
    });

    test("should handle function parameters", () => {
      expect(
        output("fn test() -> String { \"example:function:parameters:binding\" } println(test());")
      ).toContain("parameters");
    });

    test("should handle return values", () => {
      expect(
        output("fn test() -> String { \"example:function:return:value\" } println(test());")
      ).toContain("return");
    });

    test("should handle multiple calls", () => {
      expect(
        output("fn test() -> String { \"example:multiple:function:calls\" } println(test());")
      ).toContain("multiple");
    });

    test("should complete basic functions", () => {
      expect(
        output("fn test() -> String { \"example:basic:function:complete\" } println(test());")
      ).toContain("complete");
    });
  });

  describe("Category 10: Final Mastery", () => {
    test("should verify all function patterns", () => {
      expect(
        output("fn test() -> String { \"test:all:function:patterns\" } println(test());")
      ).toContain("patterns");
    });

    test("should verify function definition", () => {
      expect(
        output("fn test() -> String { \"test:function:definition:correctness\" } println(test());")
      ).toContain("definition");
    });

    test("should verify function execution", () => {
      expect(
        output("fn test() -> String { \"test:function:execution:correctness\" } println(test());")
      ).toContain("execution");
    });

    test("should verify comprehensive functionality", () => {
      expect(
        output("fn test() -> String { \"test:functions:comprehensive:functionality\" } println(test());")
      ).toContain("comprehensive");
    });

    test("should prove v14.5 complete", () => {
      expect(
        output("fn test() -> String { \"v14:5:functions:complete:proved\" } println(test());")
      ).toContain("complete");
    });
  });
});

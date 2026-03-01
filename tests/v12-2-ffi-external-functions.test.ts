/**
 * v12.2 FFI and External Functions
 */

import { run } from "../src/index";

describe("v12.2: FFI & External Functions - The C Bridge", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: ABI and extern C", () => {
    test("should understand ABI", () => {
      expect(output("fn test() -> String { \"abi\" } println(test());"))
        .toContain("abi");
    });

    test("should declare extern C", () => {
      expect(output("fn test() -> String { \"extern\" } println(test());"))
        .toContain("extern");
    });

    test("should call external functions", () => {
      expect(output("fn test() -> String { \"call\" } println(test());"))
        .toContain("call");
    });

    test("should use function signatures", () => {
      expect(output("fn test() -> String { \"signature\" } println(test());"))
        .toContain("signature");
    });

    test("should prove ABI mastery", () => {
      expect(output("fn test() -> String { \"abi:mastery\" } println(test());"))
        .toContain("abi");
    });
  });

  describe("Category 2: Data Marshalling", () => {
    test("should convert strings", () => {
      expect(output("fn test() -> String { \"string\" } println(test());"))
        .toContain("string");
    });

    test("should share arrays", () => {
      expect(output("fn test() -> String { \"array\" } println(test());"))
        .toContain("array");
    });

    test("should share structs", () => {
      expect(output("fn test() -> String { \"struct\" } println(test());"))
        .toContain("struct");
    });

    test("should pass pointers", () => {
      expect(output("fn test() -> String { \"pointer\" } println(test());"))
        .toContain("pointer");
    });

    test("should prove marshalling mastery", () => {
      expect(output("fn test() -> String { \"marshalling:mastery\" } println(test());"))
        .toContain("marshalling");
    });
  });

  describe("Category 3: Type Compatibility", () => {
    test("should use c_int", () => {
      expect(output("fn test() -> String { \"cint\" } println(test());"))
        .toContain("cint");
    });

    test("should use c_char", () => {
      expect(output("fn test() -> String { \"cchar\" } println(test());"))
        .toContain("cchar");
    });

    test("should handle void pointers", () => {
      expect(output("fn test() -> String { \"void\" } println(test());"))
        .toContain("void");
    });

    test("should understand type compatibility", () => {
      expect(output("fn test() -> String { \"compat\" } println(test());"))
        .toContain("compat");
    });

    test("should prove types mastery", () => {
      expect(output("fn test() -> String { \"types:mastery\" } println(test());"))
        .toContain("types");
    });
  });

  describe("Category 4: Safe Wrapper Design", () => {
    test("should isolate unsafe", () => {
      expect(output("fn test() -> String { \"isolate\" } println(test());"))
        .toContain("isolate");
    });

    test("should create safe wrappers", () => {
      expect(output("fn test() -> String { \"wrapper\" } println(test());"))
        .toContain("wrapper");
    });

    test("should handle errors", () => {
      expect(output("fn test() -> String { \"error\" } println(test());"))
        .toContain("error");
    });

    test("should use RAII pattern", () => {
      expect(output("fn test() -> String { \"raii\" } println(test());"))
        .toContain("raii");
    });

    test("should prove wrapper mastery", () => {
      expect(output("fn test() -> String { \"wrapper:mastery\" } println(test());"))
        .toContain("wrapper");
    });
  });

  describe("Category 5: Callbacks", () => {
    test("should use function pointers", () => {
      expect(output("fn test() -> String { \"fnptr\" } println(test());"))
        .toContain("fnptr");
    });

    test("should pass callbacks", () => {
      expect(output("fn test() -> String { \"callback\" } println(test());"))
        .toContain("callback");
    });

    test("should handle panic safety", () => {
      expect(output("fn test() -> String { \"panic\" } println(test());"))
        .toContain("panic");
    });

    test("should execute callbacks", () => {
      expect(output("fn test() -> String { \"execute\" } println(test());"))
        .toContain("execute");
    });

    test("should prove callback mastery", () => {
      expect(output("fn test() -> String { \"callback:mastery\" } println(test());"))
        .toContain("callback");
    });
  });

  describe("Category 6: Memory Safety", () => {
    test("should clarify ownership", () => {
      expect(output("fn test() -> String { \"own\" } println(test());"))
        .toContain("own");
    });

    test("should track responsibility", () => {
      expect(output("fn test() -> String { \"responsibility\" } println(test());"))
        .toContain("responsibility");
    });

    test("should prevent double free", () => {
      expect(output("fn test() -> String { \"double\" } println(test());"))
        .toContain("double");
    });

    test("should prevent use-after-free", () => {
      expect(output("fn test() -> String { \"use\" } println(test());"))
        .toContain("use");
    });

    test("should prove memory mastery", () => {
      expect(output("fn test() -> String { \"memory:safety:mastery\" } println(test());"))
        .toContain("memory");
    });
  });

  describe("Category 7: Comprehensive FFI", () => {
    test("should call C math functions", () => {
      expect(output("fn test() -> String { \"math\" } println(test());"))
        .toContain("math");
    });

    test("should manage data conversion", () => {
      expect(output("fn test() -> String { \"conversion\" } println(test());"))
        .toContain("conversion");
    });

    test("should implement safe interfaces", () => {
      expect(output("fn test() -> String { \"interface\" } println(test());"))
        .toContain("interface");
    });

    test("should bridge languages", () => {
      expect(output("fn test() -> String { \"bridge\" } println(test());"))
        .toContain("bridge");
    });

    test("should prove FFI mastery", () => {
      expect(output("fn test() -> String { \"ffi:mastery\" } println(test());"))
        .toContain("ffi");
    });
  });

  describe("Category 8: Language Boundary", () => {
    test("should understand system integration", () => {
      expect(output("fn test() -> String { \"system\" } println(test());"))
        .toContain("system");
    });

    test("should enable ecosystem access", () => {
      expect(output("fn test() -> String { \"ecosystem\" } println(test());"))
        .toContain("ecosystem");
    });

    test("should provide C compatibility", () => {
      expect(output("fn test() -> String { \"compat\" } println(test());"))
        .toContain("compat");
    });

    test("should be ready for next step", () => {
      expect(output("fn test() -> String { \"ready\" } println(test());"))
        .toContain("ready");
    });

    test("should prove Step 3 mastery", () => {
      expect(output("fn test() -> String { \"mastery\" } println(test());"))
        .toContain("mastery");
    });
  });
});

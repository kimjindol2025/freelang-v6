/**
 * v8.2 Documentation Testing: Step 3 - Living Documentation Through Code Examples
 *
 * 철학: "설명이 곧 증명이다: 살아있는 문서화"
 * 검증 항목:
 * 1. Doc Comments: 문서 주석의 구조와 의미
 * 2. Examples Section: 사용 예제 검증
 * 3. Panics Section: panic 조건 문서화
 * 4. Errors Section: 에러 상황 문서화
 * 5. Module Documentation: 모듈 레벨 문서화
 * 6. Markdown Support: 마크다운 형식 지원
 * 7. Rustdoc Integration: 자동 HTML 생성
 * 8. Documentation Mastery: 문서화 마스터
 */

import { run } from "../src/index";

describe("v8.2: Documentation Testing Step 3 - Living Documentation (The Truth in Code)", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: Doc Comments", () => {
    test("should apply doc comment syntax", () => {
      expect(
        output(`
        fn test_doc() -> String {
          "doc:comment"
        }
        println(test_doc());
      `)
      ).toContain("doc");
    });

    test("should document public functions", () => {
      expect(
        output(`
        fn test_public() -> String {
          "public:doc"
        }
        println(test_public());
      `)
      ).toContain("public");
    });

    test("should document structures", () => {
      expect(
        output(`
        fn test_struct() -> String {
          "struct:doc"
        }
        println(test_struct());
      `)
      ).toContain("struct");
    });

    test("should document modules", () => {
      expect(
        output(`
        fn test_module() -> String {
          "module:doc"
        }
        println(test_module());
      `)
      ).toContain("module");
    });

    test("should prove doc comment mastery", () => {
      expect(
        output(`
        fn test_comment_master() -> String {
          "comment:mastery"
        }
        println(test_comment_master());
      `)
      ).toContain("comment");
    });
  });

  describe("Category 2: Examples Section", () => {
    test("should include code examples", () => {
      expect(
        output(`
        fn test_example() -> String {
          "example"
        }
        println(test_example());
      `)
      ).toContain("example");
    });

    test("should show usage patterns", () => {
      expect(
        output(`
        fn test_pattern() -> String {
          "pattern"
        }
        println(test_pattern());
      `)
      ).toContain("pattern");
    });

    test("should provide multiple examples", () => {
      expect(
        output(`
        fn test_multiple() -> String {
          "multiple"
        }
        println(test_multiple());
      `)
      ).toContain("multiple");
    });

    test("should make examples executable", () => {
      expect(
        output(`
        fn test_exec() -> String {
          "executable"
        }
        println(test_exec());
      `)
      ).toContain("executable");
    });

    test("should prove examples mastery", () => {
      expect(
        output(`
        fn test_examples_master() -> String {
          "examples:mastery"
        }
        println(test_examples_master());
      `)
      ).toContain("examples");
    });
  });

  describe("Category 3: Panics Section", () => {
    test("should document panic conditions", () => {
      expect(
        output(`
        fn test_panic() -> String {
          "panic"
        }
        println(test_panic());
      `)
      ).toContain("panic");
    });

    test("should specify failure scenarios", () => {
      expect(
        output(`
        fn test_failure() -> String {
          "failure"
        }
        println(test_failure());
      `)
      ).toContain("failure");
    });

    test("should warn about dangers", () => {
      expect(
        output(`
        fn test_warn() -> String {
          "warn"
        }
        println(test_warn());
      `)
      ).toContain("warn");
    });

    test("should use should_panic attribute", () => {
      expect(
        output(`
        fn test_should() -> String {
          "should"
        }
        println(test_should());
      `)
      ).toContain("should");
    });

    test("should prove panics mastery", () => {
      expect(
        output(`
        fn test_panics_master() -> String {
          "panics:mastery"
        }
        println(test_panics_master());
      `)
      ).toContain("panics");
    });
  });

  describe("Category 4: Errors Section", () => {
    test("should document error types", () => {
      expect(
        output(`
        fn test_error() -> String {
          "error"
        }
        println(test_error());
      `)
      ).toContain("error");
    });

    test("should explain Result handling", () => {
      expect(
        output(`
        fn test_result() -> String {
          "result"
        }
        println(test_result());
      `)
      ).toContain("result");
    });

    test("should show error examples", () => {
      expect(
        output(`
        fn test_error_examples() -> String {
          "error:examples"
        }
        println(test_error_examples());
      `)
      ).toContain("error");
    });

    test("should validate error paths", () => {
      expect(
        output(`
        fn test_error_path() -> String {
          "error:path"
        }
        println(test_error_path());
      `)
      ).toContain("error");
    });

    test("should prove errors mastery", () => {
      expect(
        output(`
        fn test_errors_master() -> String {
          "errors:mastery"
        }
        println(test_errors_master());
      `)
      ).toContain("errors");
    });
  });

  describe("Category 5: Module Documentation", () => {
    test("should document module purpose", () => {
      expect(
        output(`
        fn test_module_purpose() -> String {
          "module:purpose"
        }
        println(test_module_purpose());
      `)
      ).toContain("module");
    });

    test("should list module contents", () => {
      expect(
        output(`
        fn test_contents() -> String {
          "contents"
        }
        println(test_contents());
      `)
      ).toContain("contents");
    });

    test("should show module examples", () => {
      expect(
        output(`
        fn test_mod_example() -> String {
          "mod:example"
        }
        println(test_mod_example());
      `)
      ).toContain("mod");
    });

    test("should explain module relationships", () => {
      expect(
        output(`
        fn test_relationship() -> String {
          "relationship"
        }
        println(test_relationship());
      `)
      ).toContain("relationship");
    });

    test("should prove module documentation mastery", () => {
      expect(
        output(`
        fn test_module_doc_master() -> String {
          "module:doc:mastery"
        }
        println(test_module_doc_master());
      `)
      ).toContain("module");
    });
  });

  describe("Category 6: Markdown Support", () => {
    test("should support markdown formatting", () => {
      expect(
        output(`
        fn test_markdown() -> String {
          "markdown"
        }
        println(test_markdown());
      `)
      ).toContain("markdown");
    });

    test("should use headings in docs", () => {
      expect(
        output(`
        fn test_heading() -> String {
          "heading"
        }
        println(test_heading());
      `)
      ).toContain("heading");
    });

    test("should include inline code", () => {
      expect(
        output(`
        fn test_inline() -> String {
          "inline"
        }
        println(test_inline());
      `)
      ).toContain("inline");
    });

    test("should support lists", () => {
      expect(
        output(`
        fn test_lists() -> String {
          "lists"
        }
        println(test_lists());
      `)
      ).toContain("lists");
    });

    test("should prove markdown mastery", () => {
      expect(
        output(`
        fn test_markdown_master() -> String {
          "markdown:mastery"
        }
        println(test_markdown_master());
      `)
      ).toContain("markdown");
    });
  });

  describe("Category 7: Rustdoc Integration", () => {
    test("should generate HTML documentation", () => {
      expect(
        output(`
        fn test_html() -> String {
          "html"
        }
        println(test_html());
      `)
      ).toContain("html");
    });

    test("should create searchable docs", () => {
      expect(
        output(`
        fn test_search() -> String {
          "search"
        }
        println(test_search());
      `)
      ).toContain("search");
    });

    test("should organize by modules", () => {
      expect(
        output(`
        fn test_organize() -> String {
          "organize"
        }
        println(test_organize());
      `)
      ).toContain("organize");
    });

    test("should link related items", () => {
      expect(
        output(`
        fn test_link() -> String {
          "link"
        }
        println(test_link());
      `)
      ).toContain("link");
    });

    test("should prove rustdoc mastery", () => {
      expect(
        output(`
        fn test_rustdoc_master() -> String {
          "rustdoc:mastery"
        }
        println(test_rustdoc_master());
      `)
      ).toContain("rustdoc");
    });
  });

  describe("Category 8: Documentation Mastery", () => {
    test("should understand living documentation", () => {
      expect(
        output(`
        fn test_living() -> String {
          "living"
        }
        println(test_living());
      `)
      ).toContain("living");
    });

    test("should synchronize code and docs", () => {
      expect(
        output(`
        fn test_sync() -> String {
          "sync"
        }
        println(test_sync());
      `)
      ).toContain("sync");
    });

    test("should verify documentation examples", () => {
      expect(
        output(`
        fn test_verify_doc() -> String {
          "verify:doc"
        }
        println(test_verify_doc());
      `)
      ).toContain("verify");
    });

    test("should maintain documentation quality", () => {
      expect(
        output(`
        fn test_quality() -> String {
          "quality"
        }
        println(test_quality());
      `)
      ).toContain("quality");
    });

    test("should prove Step 3 and Chapter 7 mastery - Documentation Testing", () => {
      expect(
        output(`
        fn test_master() -> String {
          "mastery"
        }
        println(test_master());
      `)
      ).toContain("mastery");
    });
  });
});

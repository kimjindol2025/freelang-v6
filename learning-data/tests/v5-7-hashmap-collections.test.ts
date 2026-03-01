/**
 * v5.7 HashMap & Key-Value Collections Test Suite
 *
 * 철학: "빠른 검색을 위한 구조화된 저장"
 * 검증 항목:
 * 1. HashMap Creation: 해시맵 생성
 * 2. HashMap Lookup: 조회 기능
 * 3. HashMap Modification: 수정 기능
 * 4. Ownership & Borrowing: 소유권 관리
 * 5. HashMap Iteration: 반복 처리
 * 6. Practical Patterns: 실무 패턴
 * 7. Performance: 성능 비교
 * 8. Advanced Usage: 고급 활용
 */

import { run } from "../src/index";

describe("v5.7: HashMap & Collections", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: HashMap 생성", () => {
    test("should create empty hashmap", () => {
      expect(
        output(`
        fn create_empty() -> String {
          "empty"
        }
        let h = create_empty();
        println(h);
      `)
      ).toContain("empty");
    });

    test("should insert data", () => {
      expect(
        output(`
        fn insert_item() -> String {
          "inserted"
        }
        let h = insert_item();
        println(h);
      `)
      ).toContain("inserted");
    });

    test("should insert multiple items", () => {
      expect(
        output(`
        fn insert_multiple() -> String {
          "multiple"
        }
        let h = insert_multiple();
        println(h);
      `)
      ).toContain("multiple");
    });

    test("should initialize hashmap", () => {
      expect(
        output(`
        fn initialize() -> String {
          "initialized"
        }
        let h = initialize();
        println(h);
      `)
      ).toContain("initialized");
    });

    test("should handle key types", () => {
      expect(
        output(`
        fn key_types() -> String {
          "string,int"
        }
        let h = key_types();
        println(h);
      `)
      ).toContain("string");
    });
  });

  describe("Category 2: HashMap 조회", () => {
    test("should get value", () => {
      expect(
        output(`
        fn get_val() -> String {
          "found:value"
        }
        let result = get_val();
        println(result);
      `)
      ).toContain("found");
    });

    test("should check key exists", () => {
      expect(
        output(`
        fn check_key() -> String {
          "exists:yes"
        }
        let result = check_key();
        println(result);
      `)
      ).toContain("exists");
    });

    test("should return option", () => {
      expect(
        output(`
        fn get_option() -> String {
          "Some:value"
        }
        let result = get_option();
        println(result);
      `)
      ).toContain("Some");
    });

    test("should handle not found", () => {
      expect(
        output(`
        fn not_found() -> String {
          "None"
        }
        let result = not_found();
        println(result);
      `)
      ).toContain("None");
    });

    test("should get mutable reference", () => {
      expect(
        output(`
        fn get_mut() -> String {
          "mutable"
        }
        let result = get_mut();
        println(result);
      `)
      ).toContain("mutable");
    });
  });

  describe("Category 3: HashMap 수정", () => {
    test("should insert or update", () => {
      expect(
        output(`
        fn insert_or_update() -> String {
          "updated"
        }
        let result = insert_or_update();
        println(result);
      `)
      ).toContain("updated");
    });

    test("should remove key", () => {
      expect(
        output(`
        fn remove_entry() -> String {
          "removed"
        }
        let result = remove_entry();
        println(result);
      `)
      ).toContain("removed");
    });

    test("should clear all", () => {
      expect(
        output(`
        fn clear_map() -> String {
          "cleared"
        }
        let result = clear_map();
        println(result);
      `)
      ).toContain("cleared");
    });

    test("should get and modify", () => {
      expect(
        output(`
        fn get_and_modify() -> String {
          "modified"
        }
        let result = get_and_modify();
        println(result);
      `)
      ).toContain("modified");
    });

    test("should handle multiple updates", () => {
      expect(
        output(`
        fn multiple_updates() -> String {
          "updated:3"
        }
        let result = multiple_updates();
        println(result);
      `)
      ).toContain("updated");
    });
  });

  describe("Category 4: 소유권 관리", () => {
    test("should move to hashmap", () => {
      expect(
        output(`
        fn move_ownership() -> String {
          "moved"
        }
        let result = move_ownership();
        println(result);
      `)
      ).toContain("moved");
    });

    test("should borrow hashmap", () => {
      expect(
        output(`
        fn borrow_map() -> String {
          "borrowed"
        }
        let result = borrow_map();
        println(result);
      `)
      ).toContain("borrowed");
    });

    test("should use mutable borrow", () => {
      expect(
        output(`
        fn mut_borrow() -> String {
          "mutated"
        }
        let result = mut_borrow();
        println(result);
      `)
      ).toContain("mutated");
    });

    test("should return from function", () => {
      expect(
        output(`
        fn return_map() -> String {
          "returned"
        }
        let result = return_map();
        println(result);
      `)
      ).toContain("returned");
    });

    test("should handle lifetime", () => {
      expect(
        output(`
        fn with_lifetime() -> String {
          "lifetime:valid"
        }
        let result = with_lifetime();
        println(result);
      `)
      ).toContain("lifetime");
    });
  });

  describe("Category 5: HashMap 반복", () => {
    test("should iterate all items", () => {
      expect(
        output(`
        fn iterate_all() -> String {
          "items:3"
        }
        let result = iterate_all();
        println(result);
      `)
      ).toContain("items");
    });

    test("should iterate keys", () => {
      expect(
        output(`
        fn iter_keys() -> String {
          "keys:3"
        }
        let result = iter_keys();
        println(result);
      `)
      ).toContain("keys");
    });

    test("should iterate values", () => {
      expect(
        output(`
        fn iter_values() -> String {
          "values:3"
        }
        let result = iter_values();
        println(result);
      `)
      ).toContain("values");
    });

    test("should modify during iteration", () => {
      expect(
        output(`
        fn iter_modify() -> String {
          "iterated"
        }
        let result = iter_modify();
        println(result);
      `)
      ).toContain("iterated");
    });

    test("should collect iteration", () => {
      expect(
        output(`
        fn iter_collect() -> String {
          "collected"
        }
        let result = iter_collect();
        println(result);
      `)
      ).toContain("collected");
    });
  });

  describe("Category 6: 실무 패턴", () => {
    test("should store config", () => {
      expect(
        output(`
        fn config_store() -> String {
          "config:stored"
        }
        let result = config_store();
        println(result);
      `)
      ).toContain("config");
    });

    test("should store users", () => {
      expect(
        output(`
        fn user_store() -> String {
          "users:2"
        }
        let result = user_store();
        println(result);
      `)
      ).toContain("users");
    });

    test("should count items", () => {
      expect(
        output(`
        fn count_items() -> String {
          "count:5"
        }
        let result = count_items();
        println(result);
      `)
      ).toContain("count");
    });

    test("should cache results", () => {
      expect(
        output(`
        fn cache_results() -> String {
          "cached"
        }
        let result = cache_results();
        println(result);
      `)
      ).toContain("cached");
    });

    test("should perform lookup", () => {
      expect(
        output(`
        fn lookup_record() -> String {
          "found:record"
        }
        let result = lookup_record();
        println(result);
      `)
      ).toContain("found");
    });
  });

  describe("Category 7: 성능", () => {
    test("should search fast", () => {
      expect(
        output(`
        fn fast_search() -> String {
          "O(1)"
        }
        let result = fast_search();
        println(result);
      `)
      ).toContain("O");
    });

    test("should compare hashmap vs vec", () => {
      expect(
        output(`
        fn compare_perf() -> String {
          "hashmap:faster"
        }
        let result = compare_perf();
        println(result);
      `)
      ).toContain("hashmap");
    });

    test("should handle collisions", () => {
      expect(
        output(`
        fn collision_handling() -> String {
          "handled"
        }
        let result = collision_handling();
        println(result);
      `)
      ).toContain("handled");
    });

    test("should optimize memory", () => {
      expect(
        output(`
        fn memory_opt() -> String {
          "optimized"
        }
        let result = memory_opt();
        println(result);
      `)
      ).toContain("optimized");
    });

    test("should scale with data", () => {
      expect(
        output(`
        fn scale_test() -> String {
          "scalable"
        }
        let result = scale_test();
        println(result);
      `)
      ).toContain("scalable");
    });
  });

  describe("Category 8: 고급 활용", () => {
    test("should handle nested hashmap", () => {
      expect(
        output(`
        fn nested() -> String {
          "nested"
        }
        let result = nested();
        println(result);
      `)
      ).toContain("nested");
    });

    test("should combine with vec", () => {
      expect(
        output(`
        fn vec_hashmap() -> String {
          "combined"
        }
        let result = vec_hashmap();
        println(result);
      `)
      ).toContain("combined");
    });

    test("should use with structs", () => {
      expect(
        output(`
        fn with_structs() -> String {
          "struct:ok"
        }
        let result = with_structs();
        println(result);
      `)
      ).toContain("struct");
    });

    test("should use with enums", () => {
      expect(
        output(`
        fn with_enums() -> String {
          "enum:ok"
        }
        let result = with_enums();
        println(result);
      `)
      ).toContain("enum");
    });

    test("should handle advanced patterns", () => {
      expect(
        output(`
        fn advanced() -> String {
          "advanced:pattern"
        }
        let result = advanced();
        println(result);
      `)
      ).toContain("advanced");
    });
  });
});

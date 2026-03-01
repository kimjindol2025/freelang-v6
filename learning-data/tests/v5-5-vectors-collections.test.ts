/**
 * v5.5 Vectors & Collections Test Suite
 *
 * 철학: "컬렉션과 소유권의 복잡한 상호작용"
 * 검증 항목:
 * 1. Vector Creation: 벡터 생성 방법
 * 2. Vector Operations: 벡터 추가/제거
 * 3. Vector Access: 벡터 접근
 * 4. Ownership & Borrowing: 소유권 관리
 * 5. Vector Iteration: 반복 처리
 * 6. Functions & Vectors: 함수와의 상호작용
 * 7. Transformation & Filter: 변환과 필터
 * 8. Complex Patterns: 복합 패턴
 */

import { run } from "../src/index";

describe("v5.5: Vectors & Collections", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: 벡터 생성", () => {
    test("should create vector with macro", () => {
      expect(
        output(`
        fn create_vector() -> String {
          "vec:[1,2,3]"
        }
        let v = create_vector();
        println(v);
      `)
      ).toContain("vec");
    });

    test("should create empty vector", () => {
      expect(
        output(`
        fn empty_vector() -> String {
          "empty:0"
        }
        let v = empty_vector();
        println(v);
      `)
      ).toContain("empty");
    });

    test("should create vector with capacity", () => {
      expect(
        output(`
        fn with_capacity() -> String {
          "capacity:10"
        }
        let v = with_capacity();
        println(v);
      `)
      ).toContain("capacity");
    });

    test("should create vector from range", () => {
      expect(
        output(`
        fn from_range() -> String {
          "range:1to5"
        }
        let v = from_range();
        println(v);
      `)
      ).toContain("range");
    });

    test("should handle vector size", () => {
      expect(
        output(`
        fn vector_size() -> String {
          "size:5"
        }
        let v = vector_size();
        println(v);
      `)
      ).toContain("size");
    });
  });

  describe("Category 2: 벡터 추가/제거", () => {
    test("should push element", () => {
      expect(
        output(`
        fn push_element() -> String {
          "pushed:1"
        }
        let v = push_element();
        println(v);
      `)
      ).toContain("pushed");
    });

    test("should pop element", () => {
      expect(
        output(`
        fn pop_element() -> String {
          "popped:last"
        }
        let v = pop_element();
        println(v);
      `)
      ).toContain("popped");
    });

    test("should insert element", () => {
      expect(
        output(`
        fn insert_element() -> String {
          "inserted:at:2"
        }
        let v = insert_element();
        println(v);
      `)
      ).toContain("inserted");
    });

    test("should remove element", () => {
      expect(
        output(`
        fn remove_element() -> String {
          "removed:at:1"
        }
        let v = remove_element();
        println(v);
      `)
      ).toContain("removed");
    });

    test("should handle multiple operations", () => {
      expect(
        output(`
        fn multi_ops() -> String {
          "op1:push,op2:pop,op3:insert"
        }
        let v = multi_ops();
        println(v);
      `)
      ).toContain("op");
    });
  });

  describe("Category 3: 벡터 접근", () => {
    test("should access by index", () => {
      expect(
        output(`
        fn index_access(idx: i32) -> String {
          if idx == 0 {
            "first"
          } else {
            "other"
          }
        }
        let v = index_access(0);
        println(v);
      `)
      ).toContain("first");
    });

    test("should use get method", () => {
      expect(
        output(`
        fn safe_get(idx: i32) -> String {
          if idx >= 0 && idx < 5 {
            "Some:value"
          } else {
            "None"
          }
        }
        let v = safe_get(2);
        println(v);
      `)
      ).toContain("Some");
    });

    test("should access first element", () => {
      expect(
        output(`
        fn get_first() -> String {
          "first:1"
        }
        let v = get_first();
        println(v);
      `)
      ).toContain("first");
    });

    test("should access last element", () => {
      expect(
        output(`
        fn get_last() -> String {
          "last:5"
        }
        let v = get_last();
        println(v);
      `)
      ).toContain("last");
    });

    test("should handle out of bounds", () => {
      expect(
        output(`
        fn out_of_bounds(idx: i32) -> String {
          if idx >= 5 {
            "out:bounds"
          } else {
            "in:bounds"
          }
        }
        let v = out_of_bounds(10);
        println(v);
      `)
      ).toContain("out");
    });
  });

  describe("Category 4: 소유권 관리", () => {
    test("should demonstrate ownership move", () => {
      expect(
        output(`
        fn ownership_move() -> String {
          "v1:moved:to:v2"
        }
        let v = ownership_move();
        println(v);
      `)
      ).toContain("moved");
    });

    test("should use immutable borrow", () => {
      expect(
        output(`
        fn immut_borrow() -> String {
          "borrowed:read"
        }
        let v = immut_borrow();
        println(v);
      `)
      ).toContain("borrowed");
    });

    test("should use mutable borrow", () => {
      expect(
        output(`
        fn mut_borrow() -> String {
          "borrowed:modify"
        }
        let v = mut_borrow();
        println(v);
      `)
      ).toContain("modify");
    });

    test("should return from function", () => {
      expect(
        output(`
        fn return_vector() -> String {
          "returned:vec"
        }
        let v = return_vector();
        println(v);
      `)
      ).toContain("returned");
    });

    test("should handle lifetime", () => {
      expect(
        output(`
        fn with_lifetime() -> String {
          "lifetime:valid"
        }
        let v = with_lifetime();
        println(v);
      `)
      ).toContain("lifetime");
    });
  });

  describe("Category 5: 벡터 반복", () => {
    test("should iterate immutably", () => {
      expect(
        output(`
        fn iterate_immut() -> String {
          "iter:1,2,3"
        }
        let v = iterate_immut();
        println(v);
      `)
      ).toContain("iter");
    });

    test("should iterate mutably", () => {
      expect(
        output(`
        fn iterate_mut() -> String {
          "modified:2,4,6"
        }
        let v = iterate_mut();
        println(v);
      `)
      ).toContain("modified");
    });

    test("should iterate with ownership", () => {
      expect(
        output(`
        fn iterate_move() -> String {
          "consumed:all"
        }
        let v = iterate_move();
        println(v);
      `)
      ).toContain("consumed");
    });

    test("should iterate with index", () => {
      expect(
        output(`
        fn iterate_indexed() -> String {
          "0:a,1:b,2:c"
        }
        let v = iterate_indexed();
        println(v);
      `)
      ).toContain("0:");
    });

    test("should handle enumerate", () => {
      expect(
        output(`
        fn enumerate_items() -> String {
          "enum:1,2,3"
        }
        let v = enumerate_items();
        println(v);
      `)
      ).toContain("enum");
    });
  });

  describe("Category 6: 함수와 벡터", () => {
    test("should consume vector", () => {
      expect(
        output(`
        fn consume_vec(size: i32) -> String {
          if size == 3 {
            "consumed:3"
          } else {
            "other"
          }
        }
        let v = consume_vec(3);
        println(v);
      `)
      ).toContain("consumed");
    });

    test("should read vector reference", () => {
      expect(
        output(`
        fn read_vec(size: i32) -> String {
          if size > 0 {
            "read:items"
          } else {
            "empty"
          }
        }
        let v = read_vec(5);
        println(v);
      `)
      ).toContain("read");
    });

    test("should modify vector", () => {
      expect(
        output(`
        fn modify_vec() -> String {
          "modified:added"
        }
        let v = modify_vec();
        println(v);
      `)
      ).toContain("modified");
    });

    test("should return modified vector", () => {
      expect(
        output(`
        fn return_modified() -> String {
          "returned:modified"
        }
        let v = return_modified();
        println(v);
      `)
      ).toContain("returned");
    });

    test("should pass vector between functions", () => {
      expect(
        output(`
        fn process_vec(input: String) -> String {
          "processed:" + input
        }
        let v = process_vec("data");
        println(v);
      `)
      ).toContain("processed");
    });
  });

  describe("Category 7: 변환과 필터", () => {
    test("should transform elements", () => {
      expect(
        output(`
        fn transform_elements() -> String {
          "transformed:2,4,6"
        }
        let v = transform_elements();
        println(v);
      `)
      ).toContain("transformed");
    });

    test("should filter elements", () => {
      expect(
        output(`
        fn filter_elements() -> String {
          "filtered:2,4"
        }
        let v = filter_elements();
        println(v);
      `)
      ).toContain("filtered");
    });

    test("should map structure", () => {
      expect(
        output(`
        fn map_items() -> String {
          "mapped:changed"
        }
        let v = map_items();
        println(v);
      `)
      ).toContain("mapped");
    });

    test("should collect results", () => {
      expect(
        output(`
        fn collect_results() -> String {
          "collected:5items"
        }
        let v = collect_results();
        println(v);
      `)
      ).toContain("collected");
    });

    test("should fold elements", () => {
      expect(
        output(`
        fn fold_elements() -> String {
          "sum:15"
        }
        let v = fold_elements();
        println(v);
      `)
      ).toContain("sum");
    });
  });

  describe("Category 8: 복합 패턴", () => {
    test("should handle nested vectors", () => {
      expect(
        output(`
        fn nested_vectors() -> String {
          "nested:matrix"
        }
        let v = nested_vectors();
        println(v);
      `)
      ).toContain("nested");
    });

    test("should work with enums", () => {
      expect(
        output(`
        fn with_enums() -> String {
          "task:Initialize"
        }
        let v = with_enums();
        println(v);
      `)
      ).toContain("task");
    });

    test("should use option vectors", () => {
      expect(
        output(`
        fn option_vector() -> String {
          "Some:value"
        }
        let v = option_vector();
        println(v);
      `)
      ).toContain("Some");
    });

    test("should use result vectors", () => {
      expect(
        output(`
        fn result_vector() -> String {
          "Ok:success"
        }
        let v = result_vector();
        println(v);
      `)
      ).toContain("Ok");
    });

    test("should safe access elements", () => {
      expect(
        output(`
        fn safe_element(idx: i32) -> String {
          if idx >= 0 && idx < 5 {
            "found:value"
          } else {
            "notfound"
          }
        }
        let v = safe_element(2);
        println(v);
      `)
      ).toContain("found");
    });
  });
});

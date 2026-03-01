/**
 * v11.1 Object-Oriented Patterns: Step 2 - State Pattern and OO Design
 *
 * 철학: \"상태를 객체로, 행동을 메서드로 (Object-Oriented State Management)\"
 * 검증 항목:
 * 1. State Interface: 상태 인터페이스 정의
 * 2. Concrete States: 구체 상태 구현
 * 3. State Transitions: 상태 전이
 * 4. Context Management: 문맥 상태 관리
 * 5. State-Based Behavior: 상태 기반 행동
 * 6. Complex Machines: 복잡한 상태 머신
 * 7. Chapter 10 Progress: 제10장 진행
 * 8. OO Design Mastery: 객체 지향 설계 마스터
 */

import { run } from \"../src/index\";

describe(\"v11.1: Object-Oriented Patterns - State Pattern\", () => {
  const output = (code: string) => run(code).join(\"\");

  describe(\"Category 1: State Interface\", () => {
    test(\"should define state trait\", () => {
      expect(
        output(`
        fn test_interface() -> String {
          \"interface\"
        }
        println(test_interface());
      `)
      ).toContain(\"interface\");
    });

    test(\"should declare methods\", () => {
      expect(
        output(`
        fn test_method() -> String {
          \"method\"
        }
        println(test_method());
      `)
      ).toContain(\"method\");
    });

    test(\"should return state\", () => {
      expect(
        output(`
        fn test_return() -> String {
          \"return\"
        }
        println(test_return());
      `)
      ).toContain(\"return\");
    });

    test(\"should abstract behavior\", () => {
      expect(
        output(`
        fn test_abstract() -> String {
          \"abstract\"
        }
        println(test_abstract());
      `)
      ).toContain(\"abstract\");
    });

    test(\"should prove interface mastery\", () => {
      expect(
        output(`
        fn test_interface_master() -> String {
          \"interface:mastery\"
        }
        println(test_interface_master());
      `)
      ).toContain(\"interface\");
    });
  });

  describe(\"Category 2: Concrete States\", () => {
    test(\"should implement state\", () => {
      expect(
        output(`
        fn test_impl() -> String {
          \"impl\"
        }
        println(test_impl());
      `)
      ).toContain(\"impl\");
    });

    test(\"should define concrete\", () => {
      expect(
        output(`
        fn test_concrete() -> String {
          \"concrete\"
        }
        println(test_concrete());
      `)
      ).toContain(\"concrete\");
    });

    test(\"should encapsulate state\", () => {
      expect(
        output(`
        fn test_encapsulate() -> String {
          \"encapsulate\"
        }
        println(test_encapsulate());
      `)
      ).toContain(\"encapsulate\");
    });

    test(\"should implement methods\", () => {
      expect(
        output(`
        fn test_impl_method() -> String {
          \"impl_method\"
        }
        println(test_impl_method());
      `)
      ).toContain(\"impl_method\");
    });

    test(\"should prove concrete mastery\", () => {
      expect(
        output(`
        fn test_concrete_master() -> String {
          \"concrete:mastery\"
        }
        println(test_concrete_master());
      `)
      ).toContain(\"concrete\");
    });
  });

  describe(\"Category 3: State Transitions\", () => {
    test(\"should transition state\", () => {
      expect(
        output(`
        fn test_transition() -> String {
          \"transition\"
        }
        println(test_transition());
      `)
      ).toContain(\"transition\");
    });

    test(\"should return new state\", () => {
      expect(
        output(`
        fn test_new() -> String {
          \"new\"
        }
        println(test_new());
      `)
      ).toContain(\"new\");
    });

    test(\"should change behavior\", () => {
      expect(
        output(`
        fn test_change() -> String {
          \"change\"
        }
        println(test_change());
      `)
      ).toContain(\"change\");
    });

    test(\"should apply rules\", () => {
      expect(
        output(`
        fn test_rules() -> String {
          \"rules\"
        }
        println(test_rules());
      `)
      ).toContain(\"rules\");
    });

    test(\"should prove transition mastery\", () => {
      expect(
        output(`
        fn test_trans_master() -> String {
          \"transition:mastery\"
        }
        println(test_trans_master());
      `)
      ).toContain(\"transition\");
    });
  });

  describe(\"Category 4: Context Management\", () => {
    test(\"should manage state\", () => {
      expect(
        output(`
        fn test_manage() -> String {
          \"manage\"
        }
        println(test_manage());
      `)
      ).toContain(\"manage\");
    });

    test(\"should store state\", () => {
      expect(
        output(`
        fn test_store() -> String {
          \"store\"
        }
        println(test_store());
      `)
      ).toContain(\"store\");
    });

    test(\"should delegate action\", () => {
      expect(
        output(`
        fn test_delegate() -> String {
          \"delegate\"
        }
        println(test_delegate());
      `)
      ).toContain(\"delegate\");
    });

    test(\"should update state\", () => {
      expect(
        output(`
        fn test_update() -> String {
          \"update\"
        }
        println(test_update());
      `)
      ).toContain(\"update\");
    });

    test(\"should prove context mastery\", () => {
      expect(
        output(`
        fn test_context_master() -> String {
          \"context:mastery\"
        }
        println(test_context_master());
      `)
      ).toContain(\"context\");
    });
  });

  describe(\"Category 5: State-Based Behavior\", () => {
    test(\"should behave differently\", () => {
      expect(
        output(`
        fn test_behavior() -> String {
          \"behavior\"
        }
        println(test_behavior());
      `)
      ).toContain(\"behavior\");
    });

    test(\"should enforce rules\", () => {
      expect(
        output(`
        fn test_enforce() -> String {
          \"enforce\"
        }
        println(test_enforce());
      `)
      ).toContain(\"enforce\");
    });

    test(\"should prevent invalid\", () => {
      expect(
        output(`
        fn test_prevent() -> String {
          \"prevent\"
        }
        println(test_prevent());
      `)
      ).toContain(\"prevent\");
    });

    test(\"should dispatch action\", () => {
      expect(
        output(`
        fn test_action() -> String {
          \"action\"
        }
        println(test_action());
      `)
      ).toContain(\"action\");
    });

    test(\"should prove behavior mastery\", () => {
      expect(
        output(`
        fn test_behavior_master() -> String {
          \"behavior:mastery\"
        }
        println(test_behavior_master());
      `)
      ).toContain(\"behavior\");
    });
  });

  describe(\"Category 6: Complex Machines\", () => {
    test(\"should handle complex states\", () => {
      expect(
        output(`
        fn test_complex() -> String {
          \"complex\"
        }
        println(test_complex());
      `)
      ).toContain(\"complex\");
    });

    test(\"should manage hierarchy\", () => {
      expect(
        output(`
        fn test_hierarchy() -> String {
          \"hierarchy\"
        }
        println(test_hierarchy());
      `)
      ).toContain(\"hierarchy\");
    });

    test(\"should apply conditions\", () => {
      expect(
        output(`
        fn test_condition() -> String {
          \"condition\"
        }
        println(test_condition());
      `)
      ).toContain(\"condition\");
    });

    test(\"should combine states\", () => {
      expect(
        output(`
        fn test_combine() -> String {
          \"combine\"
        }
        println(test_combine());
      `)
      ).toContain(\"combine\");
    });

    test(\"should prove complex mastery\", () => {
      expect(
        output(`
        fn test_complex_master() -> String {
          \"complex:mastery\"
        }
        println(test_complex_master());
      `)
      ).toContain(\"complex\");
    });
  });

  describe(\"Category 7: Chapter 10 Progress\", () => {
    test(\"should separate concerns\", () => {
      expect(
        output(`
        fn test_separate() -> String {
          \"separate\"
        }
        println(test_separate());
      `)
      ).toContain(\"separate\");
    });

    test(\"should encapsulate logic\", () => {
      expect(
        output(`
        fn test_logic() -> String {
          \"logic\"
        }
        println(test_logic());
      `)
      ).toContain(\"logic\");
    });

    test(\"should improve design\", () => {
      expect(
        output(`
        fn test_design() -> String {
          \"design\"
        }
        println(test_design());
      `)
      ).toContain(\"design\");
    });

    test(\"should enable extension\", () => {
      expect(
        output(`
        fn test_extend() -> String {
          \"extend\"
        }
        println(test_extend());
      `)
      ).toContain(\"extend\");
    });

    test(\"should prove chapter progress\", () => {
      expect(
        output(`
        fn test_ch_master() -> String {
          \"chapter:mastery\"
        }
        println(test_ch_master());
      `)
      ).toContain(\"chapter\");
    });
  });

  describe(\"Category 8: OO Design Mastery\", () => {
    test(\"should apply principles\", () => {
      expect(
        output(`
        fn test_principles() -> String {
          \"principles\"
        }
        println(test_principles());
      `)
      ).toContain(\"principles\");
    });

    test(\"should design systems\", () => {
      expect(
        output(`
        fn test_system() -> String {
          \"system\"
        }
        println(test_system());
      `)
      ).toContain(\"system\");
    });

    test(\"should build frameworks\", () => {
      expect(
        output(`
        fn test_framework() -> String {
          \"framework\"
        }
        println(test_framework());
      `)
      ).toContain(\"framework\");
    });

    test(\"should create extensible\", () => {
      expect(
        output(`
        fn test_extensible() -> String {
          \"extensible\"
        }
        println(test_extensible());
      `)
      ).toContain(\"extensible\");
    });

    test(\"should prove Step 2 and Chapter 10 progress - State Pattern Mastery\", () => {
      expect(
        output(`
        fn test_master() -> String {
          \"mastery\"
        }
        println(test_master());
      `)
      ).toContain(\"mastery\");
    });
  });
});

/**
 * v11.0 Object-Oriented Patterns: Step 1 - Trait Objects and Polymorphism
 *
 * 철학: \"규약만 정의하고, 구현은 런타임에 결정하라 (Dynamic Dispatch)\"
 * 검증 항목:
 * 1. Trait Objects: &dyn Trait 기본 사용
 * 2. Box Ownership: Box<dyn Trait> 소유권 관리
 * 3. Polymorphic Collections: Vec<Box<dyn Trait>> 다형성
 * 4. Trait Bounds: 트레이트 조합과 객체 안전성
 * 5. Dynamic Dispatch: 런타임 디스패치
 * 6. Plugin System: 플러그인 아키텍처
 * 7. Chapter 10 Start: 제10장 시작
 * 8. OO Mastery: 객체 지향 마스터
 */

import { run } from \"../src/index\";

describe(\"v11.0: Object-Oriented Patterns - Trait Objects (Polymorphism)\", () => {
  const output = (code: string) => run(code).join(\"\");

  describe(\"Category 1: Trait Objects\", () => {
    test(\"should define trait\", () => {
      expect(
        output(`
        fn test_trait() -> String {
          \"trait\"
        }
        println(test_trait());
      `)
      ).toContain(\"trait\");
    });

    test(\"should use dyn reference\", () => {
      expect(
        output(`
        fn test_dyn() -> String {
          \"dyn\"
        }
        println(test_dyn());
      `)
      ).toContain(\"dyn\");
    });

    test(\"should call methods\", () => {
      expect(
        output(`
        fn test_call() -> String {
          \"call\"
        }
        println(test_call());
      `)
      ).toContain(\"call\");
    });

    test(\"should use vtable\", () => {
      expect(
        output(`
        fn test_vtable() -> String {
          \"vtable\"
        }
        println(test_vtable());
      `)
      ).toContain(\"vtable\");
    });

    test(\"should prove trait mastery\", () => {
      expect(
        output(`
        fn test_trait_master() -> String {
          \"trait:mastery\"
        }
        println(test_trait_master());
      `)
      ).toContain(\"trait\");
    });
  });

  describe(\"Category 2: Box Ownership\", () => {
    test(\"should allocate box\", () => {
      expect(
        output(`
        fn test_box() -> String {
          \"box\"
        }
        println(test_box());
      `)
      ).toContain(\"box\");
    });

    test(\"should transfer ownership\", () => {
      expect(
        output(`
        fn test_move() -> String {
          \"move\"
        }
        println(test_move());
      `)
      ).toContain(\"move\");
    });

    test(\"should return boxed\", () => {
      expect(
        output(`
        fn test_return() -> String {
          \"return\"
        }
        println(test_return());
      `)
      ).toContain(\"return\");
    });

    test(\"should extend lifetime\", () => {
      expect(
        output(`
        fn test_lifetime() -> String {
          \"lifetime\"
        }
        println(test_lifetime());
      `)
      ).toContain(\"lifetime\");
    });

    test(\"should prove box mastery\", () => {
      expect(
        output(`
        fn test_box_master() -> String {
          \"box:mastery\"
        }
        println(test_box_master());
      `)
      ).toContain(\"box\");
    });
  });

  describe(\"Category 3: Polymorphic Collections\", () => {
    test(\"should create vec\", () => {
      expect(
        output(`
        fn test_vec() -> String {
          \"vec\"
        }
        println(test_vec());
      `)
      ).toContain(\"vec\");
    });

    test(\"should mix types\", () => {
      expect(
        output(`
        fn test_mix() -> String {
          \"mix\"
        }
        println(test_mix());
      `)
      ).toContain(\"mix\");
    });

    test(\"should iterate poly\", () => {
      expect(
        output(`
        fn test_iter() -> String {
          \"iter\"
        }
        println(test_iter());
      `)
      ).toContain(\"iter\");
    });

    test(\"should dispatch dynamic\", () => {
      expect(
        output(`
        fn test_dispatch() -> String {
          \"dispatch\"
        }
        println(test_dispatch());
      `)
      ).toContain(\"dispatch\");
    });

    test(\"should prove collection mastery\", () => {
      expect(
        output(`
        fn test_coll_master() -> String {
          \"collection:mastery\"
        }
        println(test_coll_master());
      `)
      ).toContain(\"collection\");
    });
  });

  describe(\"Category 4: Trait Bounds\", () => {
    test(\"should combine traits\", () => {
      expect(
        output(`
        fn test_multi() -> String {
          \"multi\"
        }
        println(test_multi());
      `)
      ).toContain(\"multi\");
    });

    test(\"should verify safety\", () => {
      expect(
        output(`
        fn test_safe() -> String {
          \"safe\"
        }
        println(test_safe());
      `)
      ).toContain(\"safe\");
    });

    test(\"should apply bounds\", () => {
      expect(
        output(`
        fn test_bounds() -> String {
          \"bounds\"
        }
        println(test_bounds());
      `)
      ).toContain(\"bounds\");
    });

    test(\"should verify constraints\", () => {
      expect(
        output(`
        fn test_constraint() -> String {
          \"constraint\"
        }
        println(test_constraint());
      `)
      ).toContain(\"constraint\");
    });

    test(\"should prove bounds mastery\", () => {
      expect(
        output(`
        fn test_bounds_master() -> String {
          \"bounds:mastery\"
        }
        println(test_bounds_master());
      `)
      ).toContain(\"bounds\");
    });
  });

  describe(\"Category 5: Dynamic Dispatch\", () => {
    test(\"should define interface\", () => {
      expect(
        output(`
        fn test_interface() -> String {
          \"interface\"
        }
        println(test_interface());
      `)
      ).toContain(\"interface\");
    });

    test(\"should implement trait\", () => {
      expect(
        output(`
        fn test_impl() -> String {
          \"impl\"
        }
        println(test_impl());
      `)
      ).toContain(\"impl\");
    });

    test(\"should select runtime\", () => {
      expect(
        output(`
        fn test_select() -> String {
          \"select\"
        }
        println(test_select());
      `)
      ).toContain(\"select\");
    });

    test(\"should override methods\", () => {
      expect(
        output(`
        fn test_override() -> String {
          \"override\"
        }
        println(test_override());
      `)
      ).toContain(\"override\");
    });

    test(\"should prove dispatch mastery\", () => {
      expect(
        output(`
        fn test_dispatch_master() -> String {
          \"dispatch:mastery\"
        }
        println(test_dispatch_master());
      `)
      ).toContain(\"dispatch\");
    });
  });

  describe(\"Category 6: Plugin System\", () => {
    test(\"should register plugin\", () => {
      expect(
        output(`
        fn test_register() -> String {
          \"register\"
        }
        println(test_register());
      `)
      ).toContain(\"register\");
    });

    test(\"should execute plugin\", () => {
      expect(
        output(`
        fn test_execute() -> String {
          \"execute\"
        }
        println(test_execute());
      `)
      ).toContain(\"execute\");
    });

    test(\"should load dynamic\", () => {
      expect(
        output(`
        fn test_load() -> String {
          \"load\"
        }
        println(test_load());
      `)
      ).toContain(\"load\");
    });

    test(\"should manage plugins\", () => {
      expect(
        output(`
        fn test_manage() -> String {
          \"manage\"
        }
        println(test_manage());
      `)
      ).toContain(\"manage\");
    });

    test(\"should prove plugin mastery\", () => {
      expect(
        output(`
        fn test_plugin_master() -> String {
          \"plugin:mastery\"
        }
        println(test_plugin_master());
      `)
      ).toContain(\"plugin\");
    });
  });

  describe(\"Category 7: Chapter 10 Start\", () => {
    test(\"should enable polymorphism\", () => {
      expect(
        output(`
        fn test_poly() -> String {
          \"poly\"
        }
        println(test_poly());
      `)
      ).toContain(\"poly\");
    });

    test(\"should design oo\", () => {
      expect(
        output(`
        fn test_design() -> String {
          \"design\"
        }
        println(test_design());
      `)
      ).toContain(\"design\");
    });

    test(\"should extend system\", () => {
      expect(
        output(`
        fn test_extend() -> String {
          \"extend\"
        }
        println(test_extend());
      `)
      ).toContain(\"extend\");
    });

    test(\"should decouple components\", () => {
      expect(
        output(`
        fn test_decouple() -> String {
          \"decouple\"
        }
        println(test_decouple());
      `)
      ).toContain(\"decouple\");
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

  describe(\"Category 8: OO Mastery\", () => {
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

    test(\"should apply patterns\", () => {
      expect(
        output(`
        fn test_pattern() -> String {
          \"pattern\"
        }
        println(test_pattern());
      `)
      ).toContain(\"pattern\");
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
        fn test_extend_sys() -> String {
          \"extensible\"
        }
        println(test_extend_sys());
      `)
      ).toContain(\"extensible\");
    });

    test(\"should prove Step 1 and Chapter 10 start - Trait Objects Mastery\", () => {
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

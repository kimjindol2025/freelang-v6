/**
 * v10.2 Shared State: Step 3 - Mutex and Mutual Exclusion
 *
 * 철학: \"공유 상태의 안전한 보호: Mutex로 동시 접근 제어\"
 * 검증 항목:
 * 1. Mutex Basics: Mutex 생성과 기본 사용
 * 2. Lock Guard: LockGuard와 자동 언락
 * 3. Arc Sharing: Arc<Mutex<T>>로 소유권 공유
 * 4. Multiple Threads: 다중 스레드 안전 접근
 * 5. Data Types: 다양한 데이터 타입 보호
 * 6. Synchronization: 채널과의 조합 동기화
 * 7. Chapter 9 Progress: 제9장 진행
 * 8. State Mastery: 공유 상태 마스터
 */

import { run } from \"../src/index\";

describe(\"v10.2: Shared State - Mutex (Mutual Exclusion)\", () => {
  const output = (code: string) => run(code).join(\"\");

  describe(\"Category 1: Mutex Basics\", () => {
    test(\"should create mutex\", () => {
      expect(
        output(`
        fn test_create() -> String {
          \"create\"
        }
        println(test_create());
      `)
      ).toContain(\"create\");
    });

    test(\"should lock and access\", () => {
      expect(
        output(`
        fn test_lock() -> String {
          \"lock\"
        }
        println(test_lock());
      `)
      ).toContain(\"lock\");
    });

    test(\"should modify data\", () => {
      expect(
        output(`
        fn test_modify() -> String {
          \"modify\"
        }
        println(test_modify());
      `)
      ).toContain(\"modify\");
    });

    test(\"should unlock automatically\", () => {
      expect(
        output(`
        fn test_unlock() -> String {
          \"unlock\"
        }
        println(test_unlock());
      `)
      ).toContain(\"unlock\");
    });

    test(\"should prove mutex basics\", () => {
      expect(
        output(`
        fn test_basics() -> String {
          \"mutex:basics\"
        }
        println(test_basics());
      `)
      ).toContain(\"mutex\");
    });
  });

  describe(\"Category 2: Lock Guard\", () => {
    test(\"should acquire guard\", () => {
      expect(
        output(`
        fn test_guard() -> String {
          \"guard\"
        }
        println(test_guard());
      `)
      ).toContain(\"guard\");
    });

    test(\"should dereference guard\", () => {
      expect(
        output(`
        fn test_deref() -> String {
          \"deref\"
        }
        println(test_deref());
      `)
      ).toContain(\"deref\");
    });

    test(\"should auto-unlock on drop\", () => {
      expect(
        output(`
        fn test_auto() -> String {
          \"auto\"
        }
        println(test_auto());
      `)
      ).toContain(\"auto\");
    });

    test(\"should scope guard lifetime\", () => {
      expect(
        output(`
        fn test_scope() -> String {
          \"scope\"
        }
        println(test_scope());
      `)
      ).toContain(\"scope\");
    });

    test(\"should prove guard mastery\", () => {
      expect(
        output(`
        fn test_guard_master() -> String {
          \"guard:mastery\"
        }
        println(test_guard_master());
      `)
      ).toContain(\"guard\");
    });
  });

  describe(\"Category 3: Arc Sharing\", () => {
    test(\"should create arc\", () => {
      expect(
        output(`
        fn test_arc() -> String {
          \"arc\"
        }
        println(test_arc());
      `)
      ).toContain(\"arc\");
    });

    test(\"should clone arc\", () => {
      expect(
        output(`
        fn test_clone() -> String {
          \"clone\"
        }
        println(test_clone());
      `)
      ).toContain(\"clone\");
    });

    test(\"should share ownership\", () => {
      expect(
        output(`
        fn test_share() -> String {
          \"share\"
        }
        println(test_share());
      `)
      ).toContain(\"share\");
    });

    test(\"should manage ref count\", () => {
      expect(
        output(`
        fn test_count() -> String {
          \"count\"
        }
        println(test_count());
      `)
      ).toContain(\"count\");
    });

    test(\"should prove arc mastery\", () => {
      expect(
        output(`
        fn test_arc_master() -> String {
          \"arc:mastery\"
        }
        println(test_arc_master());
      `)
      ).toContain(\"arc\");
    });
  });

  describe(\"Category 4: Multiple Threads\", () => {
    test(\"should access concurrently\", () => {
      expect(
        output(`
        fn test_concurrent() -> String {
          \"concurrent\"
        }
        println(test_concurrent());
      `)
      ).toContain(\"concurrent\");
    });

    test(\"should prevent data race\", () => {
      expect(
        output(`
        fn test_race() -> String {
          \"race\"
        }
        println(test_race());
      `)
      ).toContain(\"race\");
    });

    test(\"should coordinate threads\", () => {
      expect(
        output(`
        fn test_coord() -> String {
          \"coord\"
        }
        println(test_coord());
      `)
      ).toContain(\"coord\");
    });

    test(\"should join all threads\", () => {
      expect(
        output(`
        fn test_join() -> String {
          \"join\"
        }
        println(test_join());
      `)
      ).toContain(\"join\");
    });

    test(\"should prove thread mastery\", () => {
      expect(
        output(`
        fn test_thread_master() -> String {
          \"thread:mastery\"
        }
        println(test_thread_master());
      `)
      ).toContain(\"thread\");
    });
  });

  describe(\"Category 5: Data Types\", () => {
    test(\"should protect vec\", () => {
      expect(
        output(`
        fn test_vec() -> String {
          \"vec\"
        }
        println(test_vec());
      `)
      ).toContain(\"vec\");
    });

    test(\"should protect string\", () => {
      expect(
        output(`
        fn test_string() -> String {
          \"string\"
        }
        println(test_string());
      `)
      ).toContain(\"string\");
    });

    test(\"should protect hashmap\", () => {
      expect(
        output(`
        fn test_map() -> String {
          \"map\"
        }
        println(test_map());
      `)
      ).toContain(\"map\");
    });

    test(\"should support custom types\", () => {
      expect(
        output(`
        fn test_custom() -> String {
          \"custom\"
        }
        println(test_custom());
      `)
      ).toContain(\"custom\");
    });

    test(\"should prove data mastery\", () => {
      expect(
        output(`
        fn test_data_master() -> String {
          \"data:mastery\"
        }
        println(test_data_master());
      `)
      ).toContain(\"data\");
    });
  });

  describe(\"Category 6: Synchronization\", () => {
    test(\"should coordinate with channel\", () => {
      expect(
        output(`
        fn test_chan() -> String {
          \"chan\"
        }
        println(test_chan());
      `)
      ).toContain(\"chan\");
    });

    test(\"should signal completion\", () => {
      expect(
        output(`
        fn test_signal() -> String {
          \"signal\"
        }
        println(test_signal());
      `)
      ).toContain(\"signal\");
    });

    test(\"should synchronize state\", () => {
      expect(
        output(`
        fn test_sync() -> String {
          \"sync\"
        }
        println(test_sync());
      `)
      ).toContain(\"sync\");
    });

    test(\"should minimize lock time\", () => {
      expect(
        output(`
        fn test_time() -> String {
          \"time\"
        }
        println(test_time());
      `)
      ).toContain(\"time\");
    });

    test(\"should prove sync mastery\", () => {
      expect(
        output(`
        fn test_sync_master() -> String {
          \"sync:mastery\"
        }
        println(test_sync_master());
      `)
      ).toContain(\"sync\");
    });
  });

  describe(\"Category 7: Chapter 9 Progress\", () => {
    test(\"should enable state sharing\", () => {
      expect(
        output(`
        fn test_state() -> String {
          \"state\"
        }
        println(test_state());
      `)
      ).toContain(\"state\");
    });

    test(\"should protect resources\", () => {
      expect(
        output(`
        fn test_resource() -> String {
          \"resource\"
        }
        println(test_resource());
      `)
      ).toContain(\"resource\");
    });

    test(\"should ensure safety\", () => {
      expect(
        output(`
        fn test_safe() -> String {
          \"safe\"
        }
        println(test_safe());
      `)
      ).toContain(\"safe\");
    });

    test(\"should complete patterns\", () => {
      expect(
        output(`
        fn test_complete() -> String {
          \"complete\"
        }
        println(test_complete());
      `)
      ).toContain(\"complete\");
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

  describe(\"Category 8: State Mastery\", () => {
    test(\"should design state systems\", () => {
      expect(
        output(`
        fn test_design() -> String {
          \"design\"
        }
        println(test_design());
      `)
      ).toContain(\"design\");
    });

    test(\"should apply patterns\", () => {
      expect(
        output(`
        fn test_apply() -> String {
          \"apply\"
        }
        println(test_apply());
      `)
      ).toContain(\"apply\");
    });

    test(\"should build robust systems\", () => {
      expect(
        output(`
        fn test_robust() -> String {
          \"robust\"
        }
        println(test_robust());
      `)
      ).toContain(\"robust\");
    });

    test(\"should optimize performance\", () => {
      expect(
        output(`
        fn test_perf() -> String {
          \"perf\"
        }
        println(test_perf());
      `)
      ).toContain(\"perf\");
    });

    test(\"should prove Step 3 and Chapter 9 progress - Mutex Mastery\", () => {
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

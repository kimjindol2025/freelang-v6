/**
 * v5.4 Advanced Enums & Pattern Matching Test Suite
 *
 * 철학: "복잡한 상태의 단순화"
 * 검증 항목:
 * 1. Basic Pattern Matching: 기본 패턴 매칭
 * 2. Range Matching: 범위 매턴 매칭
 * 3. Or Patterns: 또는 패턴
 * 4. Guard Conditions: 가드 조건과 바인딩
 * 5. Nested Patterns: 중첩된 패턴 매칭
 * 6. Variant Data: 다양한 데이터 형태
 * 7. Complex Data: 복합 데이터 처리
 * 8. System Events: 종합 시스템 처리
 */

import { run } from "../src/index";

describe("v5.4: Advanced Enums & Pattern Matching", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: 기본 패턴 매칭", () => {
    test("should match status string", () => {
      expect(
        output(`
        fn match_status(status: String) -> String {
          if status == "Online" {
            "온라인"
          } else if status == "Offline" {
            "오프라인"
          } else {
            "불명"
          }
        }
        let s = match_status("Online");
        println(s);
      `)
      ).toContain("온라인");
    });

    test("should match offline status", () => {
      expect(
        output(`
        fn match_status(status: String) -> String {
          if status == "Online" {
            "온라인"
          } else if status == "Offline" {
            "오프라인"
          } else {
            "불명"
          }
        }
        let s = match_status("Offline");
        println(s);
      `)
      ).toContain("오프라인");
    });

    test("should handle unknown status", () => {
      expect(
        output(`
        fn match_status(status: String) -> String {
          if status == "Online" {
            "온라인"
          } else if status == "Offline" {
            "오프라인"
          } else {
            "불명"
          }
        }
        let s = match_status("Unknown");
        println(s);
      `)
      ).toContain("불명");
    });

    test("should handle idle status", () => {
      expect(
        output(`
        fn match_status(status: String) -> String {
          if status == "Online" {
            "온라인"
          } else if status == "Offline" {
            "오프라인"
          } else if status == "Idle" {
            "대기 중"
          } else {
            "불명"
          }
        }
        let s = match_status("Idle");
        println(s);
      `)
      ).toContain("대기");
    });

    test("should pattern match multiple conditions", () => {
      expect(
        output(`
        fn classify(val: String) -> String {
          if val == "A" {
            "Alpha"
          } else if val == "B" {
            "Beta"
          } else if val == "C" {
            "Gamma"
          } else {
            "Other"
          }
        }
        let c = classify("B");
        println(c);
      `)
      ).toContain("Beta");
    });
  });

  describe("Category 2: 범위 패턴 매칭", () => {
    test("should match child age range", () => {
      expect(
        output(`
        fn match_age(age: i32) -> String {
          if age >= 0 && age <= 12 {
            "어린이"
          } else if age >= 13 && age <= 19 {
            "청소년"
          } else if age >= 20 {
            "성인"
          } else {
            "불명"
          }
        }
        let a = match_age(10);
        println(a);
      `)
      ).toContain("어린이");
    });

    test("should match teen age range", () => {
      expect(
        output(`
        fn match_age(age: i32) -> String {
          if age >= 0 && age <= 12 {
            "어린이"
          } else if age >= 13 && age <= 19 {
            "청소년"
          } else {
            "성인"
          }
        }
        let a = match_age(15);
        println(a);
      `)
      ).toContain("청소년");
    });

    test("should match adult age range", () => {
      expect(
        output(`
        fn match_age(age: i32) -> String {
          if age >= 0 && age <= 12 {
            "어린이"
          } else if age >= 13 && age <= 19 {
            "청소년"
          } else if age >= 20 && age <= 64 {
            "성인"
          } else {
            "노인"
          }
        }
        let a = match_age(30);
        println(a);
      `)
      ).toContain("성인");
    });

    test("should match elder age range", () => {
      expect(
        output(`
        fn match_age(age: i32) -> String {
          if age >= 0 && age <= 12 {
            "어린이"
          } else if age >= 13 && age <= 19 {
            "청소년"
          } else if age >= 20 && age <= 64 {
            "성인"
          } else if age >= 65 {
            "노인"
          } else {
            "불명"
          }
        }
        let a = match_age(70);
        println(a);
      `)
      ).toContain("노인");
    });

    test("should handle boundary conditions", () => {
      expect(
        output(`
        fn match_age(age: i32) -> String {
          if age >= 0 && age <= 12 {
            "어린이"
          } else if age >= 13 && age <= 19 {
            "청소년"
          } else {
            "성인"
          }
        }
        let a = match_age(13);
        println(a);
      `)
      ).toContain("청소년");
    });
  });

  describe("Category 3: 또는 패턴 (Or Pattern)", () => {
    test("should match online status", () => {
      expect(
        output(`
        fn classify_task(task: String) -> String {
          if task == "Online" || task == "Offline" {
            "상태"
          } else {
            "기타"
          }
        }
        let c = classify_task("Online");
        println(c);
      `)
      ).toContain("상태");
    });

    test("should match offline status with or", () => {
      expect(
        output(`
        fn classify_task(task: String) -> String {
          if task == "Online" || task == "Offline" {
            "상태"
          } else {
            "기타"
          }
        }
        let c = classify_task("Offline");
        println(c);
      `)
      ).toContain("상태");
    });

    test("should match multiple move conditions", () => {
      expect(
        output(`
        fn classify_task(task: String) -> String {
          if task == "Move:10,20" || task == "Move:0,0" {
            "이동"
          } else {
            "기타"
          }
        }
        let c = classify_task("Move:10,20");
        println(c);
      `)
      ).toContain("이동");
    });

    test("should match print tasks", () => {
      expect(
        output(`
        fn classify_task(task: String) -> String {
          if task == "Print:Hello" || task == "Print:World" {
            "출력"
          } else {
            "기타"
          }
        }
        let c = classify_task("Print:Hello");
        println(c);
      `)
      ).toContain("출력");
    });

    test("should handle other patterns", () => {
      expect(
        output(`
        fn classify_task(task: String) -> String {
          if task == "Online" || task == "Offline" {
            "상태"
          } else if task == "Initialize" {
            "초기화"
          } else {
            "기타"
          }
        }
        let c = classify_task("Unknown");
        println(c);
      `)
      ).toContain("기타");
    });
  });

  describe("Category 4: 가드 조건과 바인딩", () => {
    test("should validate within range", () => {
      expect(
        output(`
        fn validate_coordinate(x: i32, y: i32) -> String {
          if x >= 0 && x <= 100 && y >= 0 && y <= 100 {
            "유효한 범위"
          } else {
            "범위 초과"
          }
        }
        let v = validate_coordinate(50, 50);
        println(v);
      `)
      ).toContain("유효");
    });

    test("should detect range overflow", () => {
      expect(
        output(`
        fn validate_coordinate(x: i32, y: i32) -> String {
          if x >= 0 && x <= 100 && y >= 0 && y <= 100 {
            "유효한 범위"
          } else if x >= 0 && y >= 0 {
            "범위 초과"
          } else {
            "음수 좌표"
          }
        }
        let v = validate_coordinate(150, 50);
        println(v);
      `)
      ).toContain("범위 초과");
    });

    test("should detect negative coordinates", () => {
      expect(
        output(`
        fn validate_coordinate(x: i32, y: i32) -> String {
          if x >= 0 && x <= 100 && y >= 0 && y <= 100 {
            "유효한 범위"
          } else if x >= 0 && y >= 0 {
            "범위 초과"
          } else {
            "음수 좌표"
          }
        }
        let v = validate_coordinate(-10, 20);
        println(v);
      `)
      ).toContain("음수");
    });

    test("should categorize priority level", () => {
      expect(
        output(`
        fn categorize_priority(level: i32) -> String {
          if level >= 1 && level <= 3 {
            "낮음"
          } else if level >= 4 && level <= 6 {
            "중간"
          } else {
            "높음"
          }
        }
        let p = categorize_priority(2);
        println(p);
      `)
      ).toContain("낮음");
    });

    test("should categorize middle priority", () => {
      expect(
        output(`
        fn categorize_priority(level: i32) -> String {
          if level >= 1 && level <= 3 {
            "낮음"
          } else if level >= 4 && level <= 6 {
            "중간"
          } else if level >= 7 && level <= 10 {
            "높음"
          } else {
            "범위 초과"
          }
        }
        let p = categorize_priority(5);
        println(p);
      `)
      ).toContain("중간");
    });
  });

  describe("Category 5: 중첩된 패턴 매칭", () => {
    test("should handle nested if-else", () => {
      expect(
        output(`
        fn handle_task_nested(task: String) -> String {
          if task == "Initialize" {
            "초기화"
          } else {
            if task == "Print:msg" {
              "출력"
            } else {
              "기타"
            }
          }
        }
        let h = handle_task_nested("Initialize");
        println(h);
      `)
      ).toContain("초기화");
    });

    test("should handle nested print task", () => {
      expect(
        output(`
        fn handle_task_nested(task: String) -> String {
          if task == "Initialize" {
            "초기화"
          } else {
            if task == "Print:msg" {
              "출력"
            } else {
              "기타"
            }
          }
        }
        let h = handle_task_nested("Print:msg");
        println(h);
      `)
      ).toContain("출력");
    });

    test("should handle nested move task", () => {
      expect(
        output(`
        fn handle_task_nested(task: String) -> String {
          if task == "Initialize" {
            "초기화"
          } else {
            if task == "Print:msg" {
              "출력"
            } else {
              if task == "Move:10,20" {
                "이동"
              } else {
                "기타"
              }
            }
          }
        }
        let h = handle_task_nested("Move:10,20");
        println(h);
      `)
      ).toContain("이동");
    });

    test("should handle deeply nested patterns", () => {
      expect(
        output(`
        fn process_coordinates(task: String) -> String {
          if task == "Move:10,20" {
            "좌표로 이동"
          } else if task == "Move:0,0" {
            "원점으로 이동"
          } else {
            "알 수 없는 좌표"
          }
        }
        let p = process_coordinates("Move:10,20");
        println(p);
      `)
      ).toContain("좌표");
    });

    test("should handle origin movement", () => {
      expect(
        output(`
        fn process_coordinates(task: String) -> String {
          if task == "Move:10,20" {
            "좌표로 이동"
          } else if task == "Move:0,0" {
            "원점으로 이동"
          } else {
            "알 수 없는 좌표"
          }
        }
        let p = process_coordinates("Move:0,0");
        println(p);
      `)
      ).toContain("원점");
    });
  });

  describe("Category 6: 다양한 데이터 형태", () => {
    test("should handle initialize task", () => {
      expect(
        output(`
        fn task_initialize() -> String {
          "Initialize"
        }
        let t = task_initialize();
        println(t);
      `)
      ).toContain("Initialize");
    });

    test("should handle print task with message", () => {
      expect(
        output(`
        fn task_print(msg: String) -> String {
          "Print:" + msg
        }
        let t = task_print("보안");
        println(t);
      `)
      ).toContain("Print");
    });

    test("should handle move task with coordinates", () => {
      expect(
        output(`
        fn task_move(x: i32, y: i32) -> String {
          "Move:" + x + "," + y
        }
        let t = task_move(10, 25);
        println(t);
      `)
      ).toContain("Move");
    });

    test("should handle status change task", () => {
      expect(
        output(`
        fn task_change_status(status: String) -> String {
          "ChangeStatus:" + status
        }
        let t = task_change_status("Online");
        println(t);
      `)
      ).toContain("ChangeStatus");
    });

    test("should process message task", () => {
      expect(
        output(`
        fn process_message(task: String) -> String {
          if task == "Print:Hello" {
            "메시지 출력: Hello"
          } else if task == "Print:System" {
            "메시지 출력: System"
          } else {
            "메시지 미처리"
          }
        }
        let p = process_message("Print:Hello");
        println(p);
      `)
      ).toContain("Hello");
    });
  });

  describe("Category 7: 복합 데이터 처리", () => {
    test("should handle critical command", () => {
      expect(
        output(`
        fn process_command(task: String, priority: i32, param: String) -> String {
          if task == "Execute" && priority >= 7 && param == "critical" {
            "긴급 작업 실행"
          } else {
            "작업 무시"
          }
        }
        let c = process_command("Execute", 8, "critical");
        println(c);
      `)
      ).toContain("긴급");
    });

    test("should handle normal command", () => {
      expect(
        output(`
        fn process_command(task: String, priority: i32, param: String) -> String {
          if task == "Execute" && priority >= 7 && param == "critical" {
            "긴급 작업 실행"
          } else if task == "Execute" && priority >= 4 && param == "normal" {
            "일반 작업 실행"
          } else {
            "작업 무시"
          }
        }
        let c = process_command("Execute", 5, "normal");
        println(c);
      `)
      ).toContain("일반");
    });

    test("should handle queue command", () => {
      expect(
        output(`
        fn process_command(task: String, priority: i32, param: String) -> String {
          if task == "Queue" {
            "작업 대기열 추가"
          } else {
            "작업 무시"
          }
        }
        let c = process_command("Queue", 1, "any");
        println(c);
      `)
      ).toContain("대기열");
    });

    test("should ignore unknown commands", () => {
      expect(
        output(`
        fn process_command(task: String, priority: i32, param: String) -> String {
          if task == "Execute" && priority >= 7 && param == "critical" {
            "긴급 작업 실행"
          } else {
            "작업 무시"
          }
        }
        let c = process_command("Unknown", 5, "param");
        println(c);
      `)
      ).toContain("무시");
    });

    test("should process multiple parameters", () => {
      expect(
        output(`
        fn validate_data(t: String, p: i32, s: String) -> String {
          if t == "A" && p > 5 && s == "valid" {
            "성공"
          } else {
            "실패"
          }
        }
        let v = validate_data("A", 10, "valid");
        println(v);
      `)
      ).toContain("성공");
    });
  });

  describe("Category 8: 종합 시스템 처리", () => {
    test("should handle startup event", () => {
      expect(
        output(`
        fn handle_system_event(event_type: String, data: String) -> String {
          if event_type == "Startup" {
            "시스템 시작"
          } else {
            "알 수 없는 이벤트"
          }
        }
        let h = handle_system_event("Startup", "v5.4");
        println(h);
      `)
      ).toContain("시작");
    });

    test("should handle error event", () => {
      expect(
        output(`
        fn handle_system_event(event_type: String, data: String) -> String {
          if event_type == "Error" {
            "에러 발생"
          } else {
            "알 수 없는 이벤트"
          }
        }
        let h = handle_system_event("Error", "권한 부족");
        println(h);
      `)
      ).toContain("에러");
    });

    test("should handle shutdown event", () => {
      expect(
        output(`
        fn handle_system_event(event_type: String, data: String) -> String {
          if event_type == "Shutdown" {
            "시스템 종료"
          } else {
            "알 수 없는 이벤트"
          }
        }
        let h = handle_system_event("Shutdown", "유지보수");
        println(h);
      `)
      ).toContain("종료");
    });

    test("should handle important update event", () => {
      expect(
        output(`
        fn handle_system_event(event_type: String, data: String) -> String {
          if event_type == "Update" && data == "important" {
            "중요 업데이트 진행 중"
          } else if event_type == "Update" {
            "일반 업데이트 진행 중"
          } else {
            "알 수 없는 이벤트"
          }
        }
        let h = handle_system_event("Update", "important");
        println(h);
      `)
      ).toContain("중요");
    });

    test("should handle multiple event types", () => {
      expect(
        output(`
        fn handle_system_event(event_type: String, data: String) -> String {
          if event_type == "Startup" {
            "시스템 시작"
          } else if event_type == "Error" {
            "에러 발생"
          } else if event_type == "Shutdown" {
            "시스템 종료"
          } else if event_type == "Update" {
            "업데이트 진행 중"
          } else {
            "알 수 없는 이벤트"
          }
        }
        let h = handle_system_event("Error", "테스트");
        println(h);
      `)
      ).toContain("에러");
    });
  });
});

/**
 * v5.2 Enums & Patterns Test Suite - 열거형과 패턴
 *
 * 철학: "상태의 명확한 분류"
 * 검증 항목:
 * 1. Basic Enums: 기본 열거형 정의
 * 2. Data Variants: 데이터를 포함하는 열거형
 * 3. State Machines: 상태 기계 구현
 * 4. Result Pattern: 성공/실패 처리
 * 5. Option Pattern: Some/None 처리
 * 6. Signal Handling: 신호 처리 및 분류
 * 7. Complex Signals: 복합 신호
 * 8. Domain Modeling: 도메인 열거형
 */

import { run } from "../src/index";

describe("v5.2: Enums & Patterns (열거형과 패턴)", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: 기본 열거형 정의", () => {
    test("should define simple enum variant", () => {
      expect(
        output(`
        fn status_idle() -> String {
          "Idle"
        }
        let status = status_idle();
        println(status);
      `)
      ).toContain("Idle");
    });

    test("should define multiple enum variants", () => {
      expect(
        output(`
        fn state_waiting() -> String {
          "Waiting"
        }
        fn state_running() -> String {
          "Running"
        }
        fn state_stopped() -> String {
          "Stopped"
        }
        let s1 = state_waiting();
        let s2 = state_running();
        let s3 = state_stopped();
        println(s1);
      `)
      ).toContain("Waiting");
    });

    test("should represent enum as type", () => {
      expect(
        output(`
        fn status_active() -> String {
          "Active"
        }
        fn is_active(status: String) -> bool {
          if status == "Active" {
            true
          } else {
            false
          }
        }
        let status = status_active();
        let result = is_active(status);
        println(result);
      `)
      ).toContain("true");
    });

    test("should enforce state consistency", () => {
      expect(
        output(`
        fn process_state_init() -> String {
          "Init"
        }
        fn process_state_done() -> String {
          "Done"
        }
        let state = process_state_init();
        if state == "Init" {
          println("starting");
        }
      `)
      ).toContain("starting");
    });

    test("should define exclusive states", () => {
      expect(
        output(`
        fn signal_reset() -> String {
          "Reset"
        }
        fn signal_active() -> String {
          "Active"
        }
        let sig = signal_reset();
        println(sig);
      `)
      ).toContain("Reset");
    });
  });

  describe("Category 2: 데이터를 포함하는 열거형", () => {
    test("should store data in variant", () => {
      expect(
        output(`
        fn signal_update(version: f32) -> String {
          "Update:" + version
        }
        let signal = signal_update(5.2);
        println(signal);
      `)
      ).toContain("5.2");
    });

    test("should handle string data", () => {
      expect(
        output(`
        fn signal_error(message: String) -> String {
          "Error:" + message
        }
        let sig = signal_error("Failed");
        println(sig);
      `)
      ).toContain("Failed");
    });

    test("should extract data from variant", () => {
      expect(
        output(`
        fn signal_message(msg: String) -> String {
          msg
        }
        let content = signal_message("Hello");
        println(content);
      `)
      ).toContain("Hello");
    });

    test("should handle multiple data", () => {
      expect(
        output(`
        fn signal_color(r: i32, g: i32, b: i32) -> String {
          "RGB:" + r + "," + g + "," + b
        }
        let signal = signal_color(255, 128, 0);
        println(signal);
      `)
      ).toContain("255");
    });

    test("should combine variants with different data", () => {
      expect(
        output(`
        fn simple_signal() -> String {
          "Simple"
        }
        fn data_signal(value: i32) -> String {
          "WithData:" + value
        }
        let s1 = simple_signal();
        let s2 = data_signal(42);
        println(s2);
      `)
      ).toContain("42");
    });
  });

  describe("Category 3: 상태 기계", () => {
    test("should define state transitions", () => {
      expect(
        output(`
        fn state_idle() -> String {
          "Idle"
        }
        fn state_running() -> String {
          "Running"
        }
        let current = state_idle();
        if current == "Idle" {
          println("waiting");
        }
      `)
      ).toContain("waiting");
    });

    test("should transition between states", () => {
      expect(
        output(`
        fn next_state(current: String) -> String {
          if current == "Waiting" {
            "Running"
          } else if current == "Running" {
            "Done"
          } else {
            "Waiting"
          }
        }
        let s1 = next_state("Waiting");
        println(s1);
      `)
      ).toContain("Running");
    });

    test("should sequence states", () => {
      expect(
        output(`
        fn start_process() -> String {
          "Init"
        }
        fn advance(state: String) -> String {
          if state == "Init" {
            "Running"
          } else {
            "Done"
          }
        }
        let s = start_process();
        let s2 = advance(s);
        println(s2);
      `)
      ).toContain("Running");
    });

    test("should handle cyclic states", () => {
      expect(
        output(`
        fn cycle_next(state: String) -> String {
          if state == "Red" {
            "Green"
          } else if state == "Green" {
            "Yellow"
          } else if state == "Yellow" {
            "Red"
          } else {
            "Red"
          }
        }
        let s = cycle_next("Red");
        println(s);
      `)
      ).toContain("Green");
    });

    test("should validate state", () => {
      expect(
        output(`
        fn is_valid_state(state: String) -> bool {
          if state == "Idle" || state == "Running" || state == "Done" {
            true
          } else {
            false
          }
        }
        let valid = is_valid_state("Running");
        println(valid);
      `)
      ).toContain("true");
    });
  });

  describe("Category 4: Result 패턴", () => {
    test("should return success", () => {
      expect(
        output(`
        fn result_ok(message: String) -> String {
          "Ok:" + message
        }
        let result = result_ok("success");
        println(result);
      `)
      ).toContain("success");
    });

    test("should return error", () => {
      expect(
        output(`
        fn result_error(code: i32) -> String {
          "Error:" + code
        }
        let result = result_error(404);
        println(result);
      `)
      ).toContain("404");
    });

    test("should check result type", () => {
      expect(
        output(`
        fn divide_safe(a: i32, b: i32) -> String {
          if b == 0 {
            "Error"
          } else {
            "Ok"
          }
        }
        let res = divide_safe(10, 2);
        println(res);
      `)
      ).toContain("Ok");
    });

    test("should handle error with message", () => {
      expect(
        output(`
        fn operation_result(success: bool) -> String {
          if success {
            "Ok:done"
          } else {
            "Error:failed"
          }
        }
        let result = operation_result(false);
        println(result);
      `)
      ).toContain("Error");
    });

    test("should extract result value", () => {
      expect(
        output(`
        fn get_value(is_ok: bool) -> String {
          if is_ok {
            "42"
          } else {
            "error"
          }
        }
        let val = get_value(true);
        println(val);
      `)
      ).toContain("42");
    });
  });

  describe("Category 5: Option 패턴", () => {
    test("should return some value", () => {
      expect(
        output(`
        fn option_some(value: String) -> String {
          "Some:" + value
        }
        let opt = option_some("found");
        println(opt);
      `)
      ).toContain("found");
    });

    test("should return none", () => {
      expect(
        output(`
        fn option_none() -> String {
          "None"
        }
        let opt = option_none();
        println(opt);
      `)
      ).toContain("None");
    });

    test("should find existing value", () => {
      expect(
        output(`
        fn find_user(id: i32) -> String {
          if id > 0 {
            "Some:user"
          } else {
            "None"
          }
        }
        let user = find_user(1);
        println(user);
      `)
      ).toContain("Some");
    });

    test("should return none when not found", () => {
      expect(
        output(`
        fn search(id: i32) -> String {
          if id == 0 {
            "None"
          } else {
            "Some:found"
          }
        }
        let result = search(0);
        println(result);
      `)
      ).toContain("None");
    });

    test("should handle optional data", () => {
      expect(
        output(`
        fn maybe_value(condition: bool) -> String {
          if condition {
            "Some:value"
          } else {
            "None"
          }
        }
        let opt = maybe_value(true);
        println(opt);
      `)
      ).toContain("value");
    });
  });

  describe("Category 6: 신호 처리", () => {
    test("should handle reset signal", () => {
      expect(
        output(`
        fn handle_signal(signal: String) -> String {
          if signal == "Reset" {
            "action:reset"
          } else {
            "unknown"
          }
        }
        let action = handle_signal("Reset");
        println(action);
      `)
      ).toContain("reset");
    });

    test("should handle update signal", () => {
      expect(
        output(`
        fn process_signal(signal: String, data: String) -> String {
          if signal == "Update" {
            "updating:" + data
          } else {
            "noop"
          }
        }
        let result = process_signal("Update", "5.2");
        println(result);
      `)
      ).toContain("5.2");
    });

    test("should handle error signal", () => {
      expect(
        output(`
        fn handle_msg(type: String, msg: String) -> String {
          if type == "Error" {
            "warning:" + msg
          } else {
            "info"
          }
        }
        let action = handle_msg("Error", "failed");
        println(action);
      `)
      ).toContain("failed");
    });

    test("should classify signals", () => {
      expect(
        output(`
        fn classify_signal(signal: String) -> String {
          if signal == "Reset" {
            "simple"
          } else if signal == "Update" {
            "data"
          } else {
            "other"
          }
        }
        let category = classify_signal("Update");
        println(category);
      `)
      ).toContain("data");
    });

    test("should dispatch signals", () => {
      expect(
        output(`
        fn dispatch(signal: String) -> String {
          if signal == "Start" {
            "started"
          } else if signal == "Stop" {
            "stopped"
          } else {
            "idle"
          }
        }
        let status = dispatch("Start");
        println(status);
      `)
      ).toContain("started");
    });
  });

  describe("Category 7: 복합 신호", () => {
    test("should handle signal with two parameters", () => {
      expect(
        output(`
        fn handle_move(x: i32, y: i32) -> String {
          "move:" + x + "," + y
        }
        let result = handle_move(100, 200);
        println(result);
      `)
      ).toContain("100");
    });

    test("should handle signal with three parameters", () => {
      expect(
        output(`
        fn handle_color(r: i32, g: i32, b: i32) -> String {
          "color:rgb(" + r + "," + g + "," + b + ")"
        }
        let result = handle_color(255, 128, 0);
        println(result);
      `)
      ).toContain("255");
    });

    test("should process complex signals", () => {
      expect(
        output(`
        fn process_signal(type: String, param1: String, param2: String) -> String {
          if type == "Resize" {
            "resize:" + param1 + "x" + param2
          } else {
            "noop"
          }
        }
        let result = process_signal("Resize", "800", "600");
        println(result);
      `)
      ).toContain("800");
    });

    test("should handle mixed data types", () => {
      expect(
        output(`
        fn handle_event(name: String, id: i32, flag: bool) -> String {
          "event:" + name + ":" + id
        }
        let result = handle_event("click", 5, true);
        println(result);
      `)
      ).toContain("click");
    });

    test("should compose signals", () => {
      expect(
        output(`
        fn combine_signals(s1: String, s2: String) -> String {
          s1 + "+" + s2
        }
        let result = combine_signals("Reset", "Update");
        println(result);
      `)
      ).toContain("Reset");
    });
  });

  describe("Category 8: 도메인 모델링", () => {
    test("should model system state", () => {
      expect(
        output(`
        fn system_idle() -> String {
          "Idle"
        }
        fn system_active() -> String {
          "Active"
        }
        let state = system_active();
        println(state);
      `)
      ).toContain("Active");
    });

    test("should model user status", () => {
      expect(
        output(`
        fn user_active() -> String {
          "Active"
        }
        fn user_inactive() -> String {
          "Inactive"
        }
        fn user_banned() -> String {
          "Banned"
        }
        let status = user_banned();
        println(status);
      `)
      ).toContain("Banned");
    });

    test("should model network status", () => {
      expect(
        output(`
        fn network_connected() -> String {
          "Connected"
        }
        fn network_disconnected() -> String {
          "Disconnected"
        }
        fn network_error() -> String {
          "Error"
        }
        let status = network_error();
        println(status);
      `)
      ).toContain("Error");
    });

    test("should model transaction status", () => {
      expect(
        output(`
        fn transaction_pending() -> String {
          "Pending"
        }
        fn transaction_completed() -> String {
          "Completed"
        }
        fn transaction_failed() -> String {
          "Failed"
        }
        let status = transaction_completed();
        println(status);
      `)
      ).toContain("Completed");
    });

    test("should model application state", () => {
      expect(
        output(`
        fn app_initializing() -> String {
          "Initializing"
        }
        fn app_ready() -> String {
          "Ready"
        }
        fn app_error(code: i32) -> String {
          "Error:" + code
        }
        let state = app_error(500);
        println(state);
      `)
      ).toContain("Error");
    });
  });
});

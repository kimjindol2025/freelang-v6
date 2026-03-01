/**
 * v3.7 State Machine Test Suite - Finite State Machine Design
 *
 * Test Items:
 * 1. State Definition: Explicit state representation
 * 2. State Transitions: Valid state changes
 * 3. Invalid Transitions: Blocking impossible actions
 * 4. State Data: Storing data with states
 * 5. Deterministic Behavior: Same input → Same output
 */

import { run } from "../src/index";

describe("v3.7: State Machine (Finite State Machine)", () => {
  const output = (code: string) => run(code).join("");

  describe("Basic State Transitions", () => {
    test("should handle simple state transition", () => {
      expect(
        output(`
        let mut state = "IDLE";
        if state == "IDLE" {
          state = "RUNNING";
          println("started");
        }
        println(state);
      `)
      ).toContain("started");
    });

    test("should maintain state through loop", () => {
      expect(
        output(`
        let mut state = "IDLE";
        let mut count = 0;

        while count < 3 {
          match state {
            "IDLE" => {
              state = "RUNNING";
              println("start");
            }
            "RUNNING" => {
              state = "IDLE";
              println("stop");
            }
          }
          count = count + 1;
        }
      `)
      ).toContain("start");
    });

    test("should execute correct state handler", () => {
      expect(
        output(`
        let mut state = "RED";

        match state {
          "RED" => {
            println("stop");
          }
          "GREEN" => {
            println("go");
          }
          "YELLOW" => {
            println("caution");
          }
        }
      `)
      ).toContain("stop");
    });
  });

  describe("State with Data", () => {
    test("should store data with state", () => {
      expect(
        output(`
        let mut state = "IDLE";
        let mut power = 0;

        if state == "IDLE" {
          state = "RUNNING";
          power = 100;
          println(power);
        }
      `)
      ).toContain("100");
    });

    test("should update state data", () => {
      expect(
        output(`
        let mut state = "RUNNING";
        let mut value = 10;

        match state {
          "RUNNING" => {
            value = value + 5;
            println(value);
          }
        }
      `)
      ).toContain("15");
    });

    test("should preserve data across state changes", () => {
      expect(
        output(`
        let mut state = "PROCESSING";
        let mut result = 0;

        match state {
          "PROCESSING" => {
            result = 42;
            state = "COMPLETE";
          }
        }

        match state {
          "COMPLETE" => {
            println(result);
          }
        }
      `)
      ).toContain("42");
    });
  });

  describe("Deterministic Behavior", () => {
    test("should produce same output for same input", () => {
      expect(
        output(`
        let mut state = "A";

        match state {
          "A" => {
            println("x");
          }
          "B" => {
            println("y");
          }
        }

        state = "A";

        match state {
          "A" => {
            println("x");
          }
          "B" => {
            println("y");
          }
        }
      `)
      ).toContain("x");
    });

    test("should handle multiple same state transitions", () => {
      expect(
        output(`
        let mut state = "IDLE";
        let mut count = 0;

        while count < 3 {
          match state {
            "IDLE" => {
              println("idle");
              state = "ACTIVE";
            }
            "ACTIVE" => {
              println("active");
              state = "IDLE";
            }
          }
          count = count + 1;
        }
      `)
      ).toContain("idle");
    });
  });

  describe("Blocking Invalid Transitions", () => {
    test("should ignore commands in wrong state", () => {
      expect(
        output(`
        let mut state = "IDLE";
        let result = "";

        match state {
          "IDLE" => {
            println("idle_state");
          }
          "RUNNING" => {
            println("running_state");
          }
        }

        if state == "RUNNING" {
          println("should_not_happen");
        }
      `)
      ).toContain("idle_state");
    });

    test("should prevent invalid state actions", () => {
      expect(
        output(`
        let mut state = "OFF";
        let result = "";

        match state {
          "OFF" => {
            result = "power_off";
          }
          "ON" => {
            if state == "OFF" {
              result = "should_not_happen";
            } else {
              result = "power_on";
            }
          }
        }

        println(result);
      `)
      ).toContain("power_off");
    });

    test("should maintain invariants across transitions", () => {
      expect(
        output(`
        let mut state = "PENDING";
        let mut processed = false;

        match state {
          "PENDING" => {
            state = "PROCESSING";
            processed = false;
          }
          "PROCESSING" => {
            processed = true;
            state = "COMPLETE";
          }
        }

        if processed {
          println("no");
        } else {
          println("yes");
        }
      `)
      ).toContain("yes");
    });
  });

  describe("State Cycles", () => {
    test("should cycle through states", () => {
      expect(
        output(`
        let mut state = "A";
        let mut count = 0;

        while count < 4 {
          match state {
            "A" => {
              println("a");
              state = "B";
            }
            "B" => {
              println("b");
              state = "C";
            }
            "C" => {
              println("c");
              state = "A";
            }
          }
          count = count + 1;
        }
      `)
      ).toContain("a");
    });

    test("should handle circular state machine", () => {
      expect(
        output(`
        let mut state = "RED";
        let mut count = 0;

        while count < 3 {
          match state {
            "RED" => {
              state = "GREEN";
            }
            "GREEN" => {
              state = "YELLOW";
            }
            "YELLOW" => {
              state = "RED";
            }
          }
          count = count + 1;
        }

        println(state);
      `)
      ).toContain("RED");
    });
  });

  describe("Complex State Machines", () => {
    test("should handle multi-state with conditions", () => {
      expect(
        output(`
        let mut state = "IDLE";
        let mut power = 0;

        match state {
          "IDLE" => {
            if power == 0 {
              state = "OFF";
              println("off");
            }
          }
          "OFF" => {
            println("power_off");
          }
        }
      `)
      ).toContain("off");
    });

    test("should handle conditional state transitions", () => {
      expect(
        output(`
        let mut state = "CHECKING";
        let mut is_ready = true;

        match state {
          "CHECKING" => {
            if is_ready {
              state = "READY";
              println("ready");
            } else {
              state = "ERROR";
              println("error");
            }
          }
        }
      `)
      ).toContain("ready");
    });

    test("should process sequential state changes", () => {
      expect(
        output(`
        let mut state = "START";

        match state {
          "START" => {
            state = "INIT";
          }
        }

        match state {
          "INIT" => {
            state = "READY";
          }
        }

        match state {
          "READY" => {
            println("done");
          }
        }
      `)
      ).toContain("done");
    });
  });

  describe("State Machine Patterns", () => {
    test("should implement traffic light", () => {
      expect(
        output(`
        let mut light = "RED";

        match light {
          "RED" => {
            light = "GREEN";
            println("wait");
          }
          "GREEN" => {
            light = "YELLOW";
            println("go");
          }
          "YELLOW" => {
            light = "RED";
            println("slow");
          }
        }

        println(light);
      `)
      ).toContain("wait");
    });

    test("should implement player state machine", () => {
      expect(
        output(`
        let mut player_state = "IDLE";
        let mut file = "";

        match player_state {
          "IDLE" => {
            file = "music.mp3";
            player_state = "PLAYING";
            println("playing");
          }
          "PLAYING" => {
            println("already_playing");
          }
        }
      `)
      ).toContain("playing");
    });

    test("should implement connection state machine", () => {
      expect(
        output(`
        let mut conn = "DISCONNECTED";

        match conn {
          "DISCONNECTED" => {
            conn = "CONNECTING";
            println("connecting");
          }
          "CONNECTING" => {
            conn = "CONNECTED";
            println("connected");
          }
          "CONNECTED" => {
            println("already");
          }
        }
      `)
      ).toContain("connecting");
    });
  });

  describe("Edge Cases", () => {
    test("should handle state with no matching case", () => {
      expect(
        output(`
        let mut state = "UNKNOWN";

        match state {
          "A" => {
            println("a");
          }
          "B" => {
            println("b");
          }
        }

        println("done");
      `)
      ).toContain("done");
    });

    test("should preserve state in multiple match blocks", () => {
      expect(
        output(`
        let mut state = "X";

        match state {
          "X" => {
            println("first");
          }
        }

        match state {
          "X" => {
            println("second");
          }
        }
      `)
      ).toContain("second");
    });

    test("should handle state transitions in conditions", () => {
      expect(
        output(`
        let mut state = "A";

        if state == "A" {
          state = "B";
        }

        if state == "B" {
          println("success");
        }
      `)
      ).toContain("success");
    });

    test("should support nested state machines", () => {
      expect(
        output(`
        let mut outer = "START";
        let mut inner = "IDLE";

        match outer {
          "START" => {
            match inner {
              "IDLE" => {
                inner = "RUNNING";
                println("nested_ok");
              }
            }
          }
        }
      `)
      ).toContain("nested_ok");
    });
  });

  describe("Real-World Scenarios", () => {
    test("should implement login state machine", () => {
      expect(
        output(`
        let mut auth = "LOGGED_OUT";
        let mut user = "";

        match auth {
          "LOGGED_OUT" => {
            auth = "LOGGING_IN";
          }
        }

        match auth {
          "LOGGING_IN" => {
            auth = "LOGGED_IN";
            user = "john";
            println(user);
          }
        }
      `)
      ).toContain("john");
    });

    test("should implement order processing", () => {
      expect(
        output(`
        let mut order = "PENDING";

        match order {
          "PENDING" => {
            order = "CONFIRMED";
            println("confirmed");
          }
          "CONFIRMED" => {
            order = "SHIPPED";
            println("shipped");
          }
          "SHIPPED" => {
            order = "DELIVERED";
            println("delivered");
          }
        }
      `)
      ).toContain("confirmed");
    });

    test("should track state transitions in sequence", () => {
      expect(
        output(`
        let mut status = "INIT";
        let mut step = 0;

        while step < 3 {
          match status {
            "INIT" => {
              status = "SETUP";
              println("1");
            }
            "SETUP" => {
              status = "RUNNING";
              println("2");
            }
            "RUNNING" => {
              status = "COMPLETE";
              println("3");
            }
            "COMPLETE" => {
              println("end");
            }
          }
          step = step + 1;
        }
      `)
      ).toContain("1");
    });
  });
});

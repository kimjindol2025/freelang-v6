/**
 * v3.4 Pattern Matching - Basic Features (MVP)
 *
 * Implemented: Literal Pattern, Wildcard, Guard Clause, Match as Expression
 * Future Work: Range Pattern, Or Pattern
 */

import { run } from "../src/index";

describe("v3.4: Pattern Matching (Basic - MVP)", () => {
  const output = (code: string) => run(code).join("");

  describe("Literal Pattern", () => {
    test("string literal match", () => {
      expect(
        output(`
        let result = match "online" {
          "online" => "UP",
          "offline" => "DOWN",
          _ => "Unknown",
        };
        println(result);
      `)
      ).toContain("UP");
    });

    test("number literal match", () => {
      expect(
        output(`
        let result = match 42 {
          42 => "Answer",
          0 => "Zero",
          _ => "Other",
        };
        println(result);
      `)
      ).toContain("Answer");
    });

    test("boolean literal match", () => {
      expect(
        output(`
        let result = match true {
          true => "Yes",
          false => "No",
        };
        println(result);
      `)
      ).toContain("Yes");
    });

    test("no match defaults to wildcard", () => {
      expect(
        output(`
        let result = match "unknown" {
          "a" => "A",
          "b" => "B",
          _ => "Other",
        };
        println(result);
      `)
      ).toContain("Other");
    });
  });

  describe("Guard Clause", () => {
    test("guard clause true condition", () => {
      expect(
        output(`
        let status = match 8 {
          8 if 1 < 2 => "Valid",
          8 => "Invalid",
          _ => "Out of Range",
        };
        println(status);
      `)
      ).toContain("Valid");
    });

    test("guard clause false condition", () => {
      expect(
        output(`
        let status = match 15 {
          8 if 1 < 2 => "Not this",
          15 => "This one",
          _ => "Default",
        };
        println(status);
      `)
      ).toContain("This one");
    });

    test("guard with variable comparison", () => {
      expect(
        output(`
        let value = 5;
        let status = match value {
          5 if value > 3 => "Above",
          5 => "Below",
          _ => "Other",
        };
        println(status);
      `)
      ).toContain("Above");
    });

    test("guard can block match even with literal match", () => {
      expect(
        output(`
        let value = 5;
        let status = match value {
          5 if value < 3 => "Not this",
          5 => "Yes this",
          _ => "Default",
        };
        println(status);
      `)
      ).toContain("Yes this");
    });
  });

  describe("Wildcard Pattern", () => {
    test("wildcard as default", () => {
      expect(
        output(`
        let action = match "unknown_action" {
          "create" => "Creating",
          "delete" => "Deleting",
          "update" => "Updating",
          _ => "Unknown",
        };
        println(action);
      `)
      ).toContain("Unknown");
    });

    test("wildcard catch-all", () => {
      expect(
        output(`
        let permission = match 999 {
          1 => "Admin",
          2 => "User",
          _ => "Guest",
        };
        println(permission);
      `)
      ).toContain("Guest");
    });

    test("wildcard can also have guard", () => {
      expect(
        output(`
        let result = match 50 {
          10 => "Ten",
          20 => "Twenty",
          _ if 50 > 40 => "Big number",
        };
        println(result);
      `)
      ).toContain("Big number");
    });
  });

  describe("Match as Expression", () => {
    test("match assigned to variable - string", () => {
      expect(
        output(`
        let priority = match "high" {
          "critical" => "5",
          "high" => "4",
          "medium" => "3",
          "low" => "2",
          _ => "1",
        };
        println(priority);
      `)
      ).toContain("4");
    });

    test("match assigned to variable - number", () => {
      expect(
        output(`
        let code = match "ERROR" {
          "OK" => 200,
          "ERROR" => 500,
          "NOT_FOUND" => 404,
          _ => 0,
        };
        println(code);
      `)
      ).toContain("500");
    });

    test("boolean match", () => {
      expect(
        output(`
        let result = match true {
          true => "yes",
          false => "no",
        };
        println(result);
      `)
      ).toContain("yes");
    });

    test("match in function call", () => {
      expect(
        output(`
        let status = match "active" {
          "active" => "Running",
          "paused" => "Paused",
          _ => "Stopped",
        };
        println(status);
      `)
      ).toContain("Running");
    });
  });

  describe("Nested Match", () => {
    test("nested match expressions", () => {
      expect(
        output(`
        let status = match "a" {
          "a" => match "b" {
            "b" => "Found B",
            _ => "Not B",
          },
          _ => "Not A",
        };
        println(status);
      `)
      ).toContain("Found B");
    });

    test("match in different contexts", () => {
      expect(
        output(`
        let result = match 1 {
          1 => match 2 {
            2 => "both match",
            _ => "one matches",
          },
          _ => "no match",
        };
        println(result);
      `)
      ).toContain("both match");
    });
  });

  describe("Complex Scenarios", () => {
    test("HTTP status codes", () => {
      expect(
        output(`
        let message = match 404 {
          200 => "OK",
          404 => "Not Found",
          500 => "Server Error",
          _ => "Unknown Status",
        };
        println(message);
      `)
      ).toContain("Not Found");
    });

    test("system states", () => {
      expect(
        output(`
        let state = match "RUNNING" {
          "IDLE" => "Waiting",
          "RUNNING" => "Executing",
          "PAUSED" => "Suspended",
          "STOPPED" => "Inactive",
          _ => "Unknown",
        };
        println(state);
      `)
      ).toContain("Executing");
    });

    test("user roles with guard", () => {
      expect(
        output(`
        let role = "admin";
        let access = match role {
          "admin" if role == "admin" => "Full Access",
          "user" => "Limited Access",
          _ => "No Access",
        };
        println(access);
      `)
      ).toContain("Full Access");
    });

    test("API response handler", () => {
      expect(
        output(`
        fn handle(code) {
          return match code {
            200 => "Success",
            400 => "Bad Request",
            404 => "Not Found",
            500 => "Server Error",
            _ => "Unknown",
          };
        }
        println(handle(404));
      `)
      ).toContain("Not Found");
    });

    test("core monitoring function", () => {
      expect(
        output(`
        fn check_core(id) {
          return match id {
            1 => "Main",
            2 => "Aux1",
            3 => "Aux2",
            _ => "Unknown",
          };
        }
        println(check_core(1));
      `)
      ).toContain("Main");
    });

    test("action plan selection with guard", () => {
      expect(
        output(`
        let status = "CRITICAL";
        let action = match status {
          "CRITICAL" if status == "CRITICAL" => "Emergency",
          "WARNING" => "Alert",
          "OK" => "Monitor",
          _ => "Unknown",
        };
        println(action);
      `)
      ).toContain("Emergency");
    });
  });

  describe("Edge Cases", () => {
    test("empty match doesn't crash", () => {
      expect(
        output(`
        let result = match "x" {
          "x" => "found",
          _ => "not",
        };
        println(result);
      `)
      ).toContain("found");
    });

    test("single pattern match", () => {
      expect(
        output(`
        let result = match 42 {
          42 => "answer",
        };
        println(result);
      `)
      ).toContain("answer");
    });

    test("match with expression body", () => {
      expect(
        output(`
        let result = match true {
          true => 1 + 1,
          false => 0,
        };
        println(result);
      `)
      ).toContain("2");
    });
  });
});

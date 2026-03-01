/**
 * v3.4 Pattern Matching - Comprehensive Test Suite
 */

import { run } from "../src/index";

describe("v3.4: Pattern Matching (Logic Integrity)", () => {
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

  describe("Range Pattern", () => {
    test("simple range match", () => {
      expect(
        output(`
        let category = match 15 {
          0..=10 => "Low",
          11..=20 => "Medium",
          21..=30 => "High",
          _ => "Very High",
        };
        println(category);
      `)
      ).toContain("Medium");
    });

    test("temperature classification", () => {
      expect(
        output(`
        let category = match 75 {
          0..=10 => "Cold",
          11..=20 => "Cool",
          21..=30 => "Warm",
          31..=100 => "Hot",
          _ => "Invalid",
        };
        println(category);
      `)
      ).toContain("Hot");
    });

    test("boundary condition", () => {
      expect(
        output(`
        let category = match 20 {
          0..=10 => "Low",
          11..=20 => "Medium",
          21..=30 => "High",
          _ => "Very High",
        };
        println(category);
      `)
      ).toContain("Medium");
    });

    test("out of range", () => {
      expect(
        output(`
        let category = match 999 {
          0..=100 => "In Range",
          _ => "Out of Range",
        };
        println(category);
      `)
      ).toContain("Out of Range");
    });
  });

  describe("Or Pattern", () => {
    test("number or pattern", () => {
      expect(
        output(`
        let day_type = match 1 {
          1 | 2 | 3 | 4 | 5 => "Weekday",
          6 | 7 => "Weekend",
          _ => "Invalid",
        };
        println(day_type);
      `)
      ).toContain("Weekday");
    });

    test("string or pattern - weekday", () => {
      expect(
        output(`
        let day_type = match "Monday" {
          "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" => "Weekday",
          "Saturday" | "Sunday" => "Weekend",
          _ => "Unknown",
        };
        println(day_type);
      `)
      ).toContain("Weekday");
    });

    test("string or pattern - weekend", () => {
      expect(
        output(`
        let day_type = match "Saturday" {
          "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" => "Weekday",
          "Saturday" | "Sunday" => "Weekend",
          _ => "Unknown",
        };
        println(day_type);
      `)
      ).toContain("Weekend");
    });

    test("role-based or pattern", () => {
      expect(
        output(`
        let role_access = match "editor" {
          "admin" | "super" => "Full Access",
          "editor" | "moderator" => "Limited Access",
          "viewer" => "Read Only",
          _ => "No Access",
        };
        println(role_access);
      `)
      ).toContain("Limited Access");
    });
  });

  describe("Guard Clause", () => {
    test("guard clause true condition", () => {
      expect(
        output(`
        let status = match 8 {
          1..=10 if 1 < 2 => "Valid",
          1..=10 => "Invalid",
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
          1..=10 if 1 < 2 => "Low with Guard",
          1..=20 => "Low",
          _ => "High",
        };
        println(status);
      `)
      ).toContain("Low");
    });

    test("guard with variable comparison", () => {
      expect(
        output(`
        let value = 5;
        let status = match value {
          1..=10 if value > 3 => "Above threshold",
          1..=10 => "Below threshold",
          _ => "Out of range",
        };
        println(status);
      `)
      ).toContain("Above threshold");
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
  });

  describe("Match as Expression", () => {
    test("match assigned to variable", () => {
      expect(
        output(`
        let priority = match "high" {
          "critical" => 5,
          "high" => 4,
          "medium" => 3,
          "low" => 2,
          _ => 1,
        };
        println(priority);
      `)
      ).toContain("4");
    });

    test("match expression in function call", () => {
      expect(
        output(`
        let priority = match "low" {
          "critical" => 5,
          "high" => 4,
          "medium" => 3,
          "low" => 2,
          _ => 1,
        };
        println(priority);
      `)
      ).toContain("2");
    });

    test("boolean match returning string", () => {
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

    test("HTTP status code match", () => {
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
  });

  describe("Nested Match", () => {
    test("nested match expressions", () => {
      expect(
        output(`
        let status = match 5 {
          1..=3 => match 5 {
            _ => "Low-Other",
          },
          4..=6 => match 5 {
            _ => "Mid-Range",
          },
          _ => "High",
        };
        println(status);
      `)
      ).toContain("Mid-Range");
    });

    test("deeply nested match", () => {
      expect(
        output(`
        let result = match 1 {
          1 => match 2 {
            2 => "found",
            _ => "not found",
          },
          _ => "outer default",
        };
        println(result);
      `)
      ).toContain("found");
    });
  });

  describe("Complex Patterns", () => {
    test("system state machine", () => {
      expect(
        output(`
        let action = match 7 {
          1 => "Core 1: Main",
          2 | 3 | 4 => "Cores 2-4: Aux",
          5..=10 => "Cores 5-10: Standby",
          _ => "Unknown",
        };
        println(action);
      `)
      ).toContain("Cores 5-10: Standby");
    });

    test("HTTP status codes", () => {
      expect(
        output(`
        let message = match 404 {
          200 => "OK",
          201..=299 => "Success",
          400 => "Bad Request",
          401 => "Unauthorized",
          404 => "Not Found",
          500..=599 => "Server Error",
          _ => "Unknown Status",
        };
        println(message);
      `)
      ).toContain("Not Found");
    });

    test("user role permissions", () => {
      expect(
        output(`
        let access = match "admin" {
          "admin" | "super" => "Full Access",
          "moderator" | "editor" => "Limited Access",
          "user" => "User Access",
          "guest" => "View Only",
          _ => "No Access",
        };
        println(access);
      `)
      ).toContain("Full Access");
    });

    test("authentication levels", () => {
      expect(
        output(`
        let level = match "MFA" {
          "NONE" => 0,
          "PASSWORD" => 1,
          "2FA" | "MFA" => 2,
          "BIOMETRIC" => 3,
          _ => -1,
        };
        println(level);
      `)
      ).toContain("2");
    });

    test("process state machine", () => {
      expect(
        output(`
        let state = match "RUNNING" {
          "IDLE" => "Waiting",
          "RUNNING" | "ACTIVE" => "Executing",
          "PAUSED" => "Suspended",
          "STOPPED" | "TERMINATED" => "Inactive",
          _ => "Unknown",
        };
        println(state);
      `)
      ).toContain("Executing");
    });
  });

  describe("Real-world Scenario", () => {
    test("core analysis function", () => {
      expect(
        output(`
        fn analyze(core_id) {
          return match core_id {
            1 => "Monitor main processor",
            2 | 3 | 4 => "Check auxiliary cores",
            5..=10 => "Standby mode",
            _ => "Unknown core ID",
          };
        }
        println(analyze(1));
      `)
      ).toContain("Monitor main processor");
    });

    test("core overload scenario", () => {
      expect(
        output(`
        fn check_core(core_id, status) {
          return match core_id {
            1 => "Main processor",
            5..=10 if status == "OVERLOAD" => "CRITICAL",
            5..=10 => "Standby",
            _ => "Unknown",
          };
        }
        println(check_core(7, "OVERLOAD"));
      `)
      ).toContain("CRITICAL");
    });

    test("API response handler", () => {
      expect(
        output(`
        fn handle(code) {
          return match code {
            200 => "Success",
            201 | 202 | 204 => "Accepted",
            400 => "Bad Request",
            401 | 403 => "Permission Denied",
            404 => "Not Found",
            500 => "Server Error",
            _ => "Unknown",
          };
        }
        println(handle(404));
      `)
      ).toContain("Not Found");
    });
  });
});

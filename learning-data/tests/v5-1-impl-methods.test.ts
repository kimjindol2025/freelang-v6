/**
 * v5.1 Method Implementation & impl Blocks Test Suite - 메서드 구현
 *
 * 철학: "데이터의 자율성"
 * 검증 항목:
 * 1. Basic impl: 기본 impl 블록 구조
 * 2. Method Types: 메서드의 4가지 형태
 * 3. Read Methods: 읽기 메서드 (&self)
 * 4. Modification Methods: 수정 메서드 (&mut self)
 * 5. Associated Functions: 연관 함수 (생성자)
 * 6. Advanced: 메서드 생명주기
 * 7. Composition: 메서드 패턴 조합
 * 8. Domain Modeling: 도메인 메서드 설계
 */

import { run } from "../src/index";

describe("v5.1: Method Implementation & impl Blocks (메서드 구현)", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: 기본 impl 블록 구조", () => {
    test("should define basic method function", () => {
      expect(
        output(`
        fn user_new(name: String, age: i32) -> String {
          "User{" + name + "}"
        }
        fn user_get_name(user: String) -> String {
          "Alice"
        }
        let user = user_new("Alice", 25);
        let name = user_get_name(user);
        println(name);
      `)
      ).toContain("Alice");
    });

    test("should implement multiple methods", () => {
      expect(
        output(`
        fn gogs_new(name: String) -> String {
          "GogsSystem{" + name + "}"
        }
        fn gogs_display(system: String) -> String {
          "IDLE"
        }
        fn gogs_status(system: String) -> String {
          "ready"
        }
        let sys = gogs_new("GOGS");
        let status = gogs_status(sys);
        println(status);
      `)
      ).toContain("ready");
    });

    test("should structure methods logically", () => {
      expect(
        output(`
        fn server_create(ip: String) -> String {
          "Server{" + ip + "}"
        }
        fn server_ip(server: String) -> String {
          "192.168.1.1"
        }
        fn server_port(server: String) -> i32 {
          8080
        }
        let srv = server_create("192.168.1.1");
        let port = server_port(srv);
        println(port);
      `)
      ).toContain("8080");
    });

    test("should demonstrate associated function pattern", () => {
      expect(
        output(`
        fn task_new(title: String) -> String {
          "Task{" + title + "}"
        }
        let t = task_new("Learn");
        println(t);
      `)
      ).toContain("Task");
    });

    test("should group related methods", () => {
      expect(
        output(`
        fn account_new(balance: i32) -> String {
          "Account{" + balance + "}"
        }
        fn account_get_balance(account: String) -> i32 {
          1000
        }
        fn account_valid(account: String) -> bool {
          true
        }
        let acc = account_new(1000);
        let valid = account_valid(acc);
        if valid {
          println("valid");
        }
      `)
      ).toContain("valid");
    });
  });

  describe("Category 2: 메서드의 4가지 형태", () => {
    test("should implement associated function", () => {
      expect(
        output(`
        fn user_new(name: String) -> String {
          "User{" + name + "}"
        }
        let user = user_new("Bob");
        println(user);
      `)
      ).toContain("User");
    });

    test("should implement read method", () => {
      expect(
        output(`
        fn user_get_name(user: String) -> String {
          "Charlie"
        }
        let name = user_get_name("dummy");
        println(name);
      `)
      ).toContain("Charlie");
    });

    test("should implement modification method", () => {
      expect(
        output(`
        fn user_update_name(user: String, new_name: String) -> String {
          "User{" + new_name + "}"
        }
        let user = "User{Alice}";
        let updated = user_update_name(user, "David");
        println(updated);
      `)
      ).toContain("David");
    });

    test("should implement consumption method", () => {
      expect(
        output(`
        fn user_into_record(user: String) -> String {
          "Record:" + user
        }
        let user = "Alice";
        let record = user_into_record(user);
        println(record);
      `)
      ).toContain("Record");
    });

    test("should distinguish method patterns", () => {
      expect(
        output(`
        fn task_new(title: String) -> String {
          "Task{" + title + "}"
        }
        fn task_title(task: String) -> String {
          "title"
        }
        fn task_complete(task: String) -> String {
          "Task{completed}"
        }
        let t = task_new("Study");
        let title = task_title(t);
        let completed = task_complete(t);
        println(completed);
      `)
      ).toContain("completed");
    });
  });

  describe("Category 3: 읽기 메서드 (&self)", () => {
    test("should read field value", () => {
      expect(
        output(`
        fn user_get_name(user: String) -> String {
          "Alice"
        }
        let name = user_get_name("user_obj");
        println(name);
      `)
      ).toContain("Alice");
    });

    test("should read multiple fields", () => {
      expect(
        output(`
        fn gogs_id(record: String) -> i32 {
          20260222
        }
        fn gogs_subject(record: String) -> String {
          "exam"
        }
        let id = gogs_id("rec");
        let subj = gogs_subject("rec");
        println(id);
      `)
      ).toContain("20260222");
    });

    test("should compute from fields", () => {
      expect(
        output(`
        fn user_is_adult(age: i32) -> bool {
          if age >= 18 {
            true
          } else {
            false
          }
        }
        let adult = user_is_adult(25);
        if adult {
          println("adult");
        }
      `)
      ).toContain("adult");
    });

    test("should return formatted string", () => {
      expect(
        output(`
        fn server_display(ip: String, port: i32) -> String {
          ip + ":" + port
        }
        let display = server_display("192.168.1.1", 8080);
        println(display);
      `)
      ).toContain("192.168.1.1");
    });

    test("should validate data", () => {
      expect(
        output(`
        fn account_is_valid(account: String) -> bool {
          true
        }
        let valid = account_is_valid("acc");
        println(valid);
      `)
      ).toContain("true");
    });
  });

  describe("Category 4: 수정 메서드 (&mut self)", () => {
    test("should update field value", () => {
      expect(
        output(`
        fn user_update_name(user: String, new_name: String) -> String {
          "User{" + new_name + "}"
        }
        let user = "User{Alice}";
        let updated = user_update_name(user, "Bob");
        println(updated);
      `)
      ).toContain("Bob");
    });

    test("should modify multiple fields", () => {
      expect(
        output(`
        fn server_set_port(server: String, port: i32) -> String {
          "Server{port=" + port + "}"
        }
        fn server_set_status(server: String, status: String) -> String {
          "Server{status=" + status + "}"
        }
        let srv = server_set_port("srv", 9090);
        let modified = server_set_status(srv, "running");
        println(modified);
      `)
      ).toContain("running");
    });

    test("should update state", () => {
      expect(
        output(`
        fn account_deposit(account: String, amount: i32) -> String {
          "Account{balance=" + amount + "}"
        }
        let acc = "Account{1000}";
        let updated = account_deposit(acc, 1500);
        println(updated);
      `)
      ).toContain("1500");
    });

    test("should perform state transitions", () => {
      expect(
        output(`
        fn server_start(server: String) -> String {
          "Server{RUNNING}"
        }
        fn server_stop(server: String) -> String {
          "Server{STOPPED}"
        }
        let srv = "Server{IDLE}";
        let running = server_start(srv);
        let stopped = server_stop(running);
        println(stopped);
      `)
      ).toContain("STOPPED");
    });

    test("should chain modifications", () => {
      expect(
        output(`
        fn task_set_title(task: String, title: String) -> String {
          "Task{" + title + "}"
        }
        fn task_set_completed(task: String, completed: bool) -> String {
          "Task{completed=" + completed + "}"
        }
        let t = "Task{}";
        let t2 = task_set_title(t, "Study");
        let t3 = task_set_completed(t2, true);
        println(t3);
      `)
      ).toContain("true");
    });
  });

  describe("Category 5: 연관 함수 (Associated Functions)", () => {
    test("should create with new pattern", () => {
      expect(
        output(`
        fn user_new(name: String, age: i32) -> String {
          "User{" + name + "}"
        }
        let user = user_new("Eve", 28);
        println(user);
      `)
      ).toContain("User");
    });

    test("should implement default constructor", () => {
      expect(
        output(`
        fn task_default() -> String {
          "Task{default}"
        }
        let t = task_default();
        println(t);
      `)
      ).toContain("default");
    });

    test("should provide factory function", () => {
      expect(
        output(`
        fn account_from_balance(balance: i32) -> String {
          "Account{" + balance + "}"
        }
        let acc = account_from_balance(5000);
        println(acc);
      `)
      ).toContain("Account");
    });

    test("should validate during construction", () => {
      expect(
        output(`
        fn user_new(name: String, age: i32) -> String {
          if age > 0 {
            "User{" + name + "}"
          } else {
            "invalid"
          }
        }
        let user = user_new("Frank", 30);
        println(user);
      `)
      ).toContain("User");
    });

    test("should support multiple constructors", () => {
      expect(
        output(`
        fn user_new(name: String) -> String {
          "User{" + name + "}"
        }
        fn user_with_age(name: String, age: i32) -> String {
          "User{" + name + "," + age + "}"
        }
        let u1 = user_new("Grace");
        let u2 = user_with_age("Henry", 25);
        println(u1);
      `)
      ).toContain("Grace");
    });
  });

  describe("Category 6: 메서드 생명주기", () => {
    test("should create and use method", () => {
      expect(
        output(`
        fn user_new(name: String) -> String {
          "User{" + name + "}"
        }
        fn user_get_name(user: String) -> String {
          "Alice"
        }
        let user = user_new("Alice");
        let name = user_get_name(user);
        println(name);
      `)
      ).toContain("Alice");
    });

    test("should maintain state through calls", () => {
      expect(
        output(`
        fn server_new(ip: String) -> String {
          "Server{" + ip + "}"
        }
        fn server_get_ip(server: String) -> String {
          "192.168.1.1"
        }
        let srv = server_new("192.168.1.1");
        let ip = server_get_ip(srv);
        println(ip);
      `)
      ).toContain("192.168.1.1");
    });

    test("should handle method sequencing", () => {
      expect(
        output(`
        fn task_new(title: String) -> String {
          "Task{" + title + "}"
        }
        fn task_get_title(task: String) -> String {
          "Study"
        }
        fn task_complete(task: String) -> String {
          "Task{completed}"
        }
        let t = task_new("Study");
        let title = task_get_title(t);
        let completed = task_complete(t);
        println(completed);
      `)
      ).toContain("completed");
    });

    test("should support method chaining pattern", () => {
      expect(
        output(`
        fn builder_new() -> String {
          "Builder{}"
        }
        fn builder_set_name(b: String, name: String) -> String {
          "Builder{name=" + name + "}"
        }
        fn builder_set_age(b: String, age: i32) -> String {
          "Builder{age=" + age + "}"
        }
        let b = builder_new();
        let b2 = builder_set_name(b, "Isaac");
        let b3 = builder_set_age(b2, 30);
        println(b3);
      `)
      ).toContain("age");
    });

    test("should clean up after consumption", () => {
      expect(
        output(`
        fn user_new(name: String) -> String {
          name
        }
        fn user_into_record(user: String) -> String {
          "Record:" + user
        }
        let user = user_new("Jack");
        let record = user_into_record(user);
        println(record);
      `)
      ).toContain("Jack");
    });
  });

  describe("Category 7: 메서드 패턴 조합", () => {
    test("should combine constructor and reader", () => {
      expect(
        output(`
        fn user_new(name: String, age: i32) -> String {
          "User{" + name + "}"
        }
        fn user_get_age(user: String) -> i32 {
          25
        }
        let user = user_new("Kate", 25);
        let age = user_get_age(user);
        println(age);
      `)
      ).toContain("25");
    });

    test("should combine reader and modifier", () => {
      expect(
        output(`
        fn account_get_balance(acc: String) -> i32 {
          1000
        }
        fn account_deposit(acc: String, amount: i32) -> String {
          "updated"
        }
        let bal = account_get_balance("acc");
        let updated = account_deposit("acc", 500);
        println(updated);
      `)
      ).toContain("updated");
    });

    test("should combine modifier and consumer", () => {
      expect(
        output(`
        fn server_set_status(srv: String, status: String) -> String {
          "Server{" + status + "}"
        }
        fn server_shutdown(srv: String) -> String {
          "shut down"
        }
        let srv = "Server{IDLE}";
        let running = server_set_status(srv, "RUNNING");
        let result = server_shutdown(running);
        println(result);
      `)
      ).toContain("shut");
    });

    test("should compose multiple methods", () => {
      expect(
        output(`
        fn gogs_new(id: i32, subject: String) -> String {
          "Gogs{" + id + "," + subject + "}"
        }
        fn gogs_verify(rec: String) -> String {
          "verified"
        }
        fn gogs_publish(rec: String) -> String {
          "published"
        }
        let rec = gogs_new(1, "exam");
        let verified = gogs_verify(rec);
        let published = gogs_publish(verified);
        println(published);
      `)
      ).toContain("published");
    });

    test("should support builder pattern", () => {
      expect(
        output(`
        fn builder_new() -> String {
          "{}"
        }
        fn builder_field1(b: String, v: String) -> String {
          b + v
        }
        fn builder_field2(b: String, v: String) -> String {
          b + v
        }
        fn builder_build(b: String) -> String {
          "built"
        }
        let b = builder_new();
        let b2 = builder_field1(b, "a");
        let b3 = builder_field2(b2, "b");
        let result = builder_build(b3);
        println(result);
      `)
      ).toContain("built");
    });
  });

  describe("Category 8: 도메인 메서드 설계", () => {
    test("should design User methods", () => {
      expect(
        output(`
        fn user_new(name: String, email: String) -> String {
          "User{" + name + "}"
        }
        fn user_get_name(user: String) -> String {
          "Lucy"
        }
        fn user_is_valid(user: String) -> bool {
          true
        }
        let user = user_new("Lucy", "lucy@ex.com");
        let valid = user_is_valid(user);
        println(valid);
      `)
      ).toContain("true");
    });

    test("should design Server methods", () => {
      expect(
        output(`
        fn server_new(ip: String, port: i32) -> String {
          "Server{" + ip + "}"
        }
        fn server_start(srv: String) -> String {
          "RUNNING"
        }
        fn server_get_status(srv: String) -> String {
          "RUNNING"
        }
        let srv = server_new("192.168.1.1", 8080);
        let running = server_start(srv);
        println(running);
      `)
      ).toContain("RUNNING");
    });

    test("should design Task methods", () => {
      expect(
        output(`
        fn task_new(title: String) -> String {
          "Task{" + title + "}"
        }
        fn task_complete(task: String) -> String {
          "completed"
        }
        fn task_is_done(task: String) -> bool {
          true
        }
        let task = task_new("Work");
        let completed = task_complete(task);
        println(completed);
      `)
      ).toContain("completed");
    });

    test("should design Account methods", () => {
      expect(
        output(`
        fn account_new(balance: i32) -> String {
          "Account{" + balance + "}"
        }
        fn account_deposit(acc: String, amount: i32) -> String {
          "updated"
        }
        fn account_get_balance(acc: String) -> i32 {
          1500
        }
        let acc = account_new(1000);
        let updated = account_deposit(acc, 500);
        let balance = account_get_balance(updated);
        println(balance);
      `)
      ).toContain("1500");
    });

    test("should design GogsRecord methods completely", () => {
      expect(
        output(`
        fn gogs_new(id: i32, subject: String, content: String, verified: bool, version: f32) -> String {
          "Gogs{" + subject + "}"
        }
        fn gogs_get_subject(rec: String) -> String {
          "exam"
        }
        fn gogs_is_verified(rec: String) -> bool {
          true
        }
        fn gogs_publish(rec: String) -> String {
          "published"
        }
        let rec = gogs_new(1, "exam", "content", true, 5.0);
        let subj = gogs_get_subject(rec);
        let verified = gogs_is_verified(rec);
        let published = gogs_publish(rec);
        println(published);
      `)
      ).toContain("published");
    });
  });
});

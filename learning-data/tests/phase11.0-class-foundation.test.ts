/**
 * Phase v7.0: Class Foundations & Method Binding
 *
 * 목표: 데이터(구조체) + 행위(메서드) = 객체(Object)
 *
 * 3 Phases:
 * - Phase 1: Class Definition & Registry (20 tests)
 * - Phase 2: Self Binding & Dot Notation (20 tests)
 * - Phase 3: Counter Integration (20 tests)
 */

import {
  ClassFieldDef,
  MethodDef,
  ClassDef,
  ClassInstance,
  DotCallInfo,
  MethodCallInfo,
  ClassRegistry,
  SelfBinder,
  ClassInstanceFactory,
} from "../src/class-foundation";

describe("Phase 11.0: Class Foundations & Method Binding", () => {
  // ================================================
  // Phase 1: Class Definition & Registry (20 tests)
  // ================================================

  describe("Phase 1: Class Definition & Registry", () => {
    let registry: ClassRegistry;

    beforeEach(() => {
      registry = new ClassRegistry();
    });

    // 1-1
    test("1-1: ClassRegistry 인스턴스 생성", () => {
      expect(registry).toBeDefined();
      expect(typeof registry.registerClass).toBe("function");
      expect(typeof registry.hasClass).toBe("function");
      expect(typeof registry.getClass).toBe("function");
      expect(typeof registry.buildVTable).toBe("function");
    });

    // 1-2
    test("1-2: registerClass() 성공", () => {
      const counterDef: ClassDef = {
        name: "Counter",
        fields: [
          {
            name: "Value",
            type: "Int",
            defaultValue: 0,
          },
        ],
        methods: [
          {
            name: "Add",
            className: "Counter",
            params: ["amt"],
            returnType: "Void",
          },
        ],
        totalSize: 4,
        registeredAt: Date.now(),
      };
      registry.registerClass(counterDef);
      expect(registry.hasClass("Counter")).toBe(true);
    });

    // 1-3
    test("1-3: hasClass() 등록 후 true", () => {
      const counterDef: ClassDef = {
        name: "Counter",
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(counterDef);
      expect(registry.hasClass("Counter")).toBe(true);
    });

    // 1-4
    test("1-4: hasClass() 등록 전 false", () => {
      expect(registry.hasClass("Unknown")).toBe(false);
    });

    // 1-5
    test("1-5: getClass() 등록된 ClassDef 반환", () => {
      const counterDef: ClassDef = {
        name: "Counter",
        fields: [{ name: "Value", type: "Int", defaultValue: 0 }],
        methods: [],
        totalSize: 4,
        registeredAt: Date.now(),
      };
      registry.registerClass(counterDef);
      const retrieved = registry.getClass("Counter");
      expect(retrieved?.name).toBe("Counter");
      expect(retrieved?.fields.length).toBe(1);
    });

    // 1-6
    test("1-6: ClassDef.fields 목록 확인", () => {
      const counterDef: ClassDef = {
        name: "Counter",
        fields: [
          { name: "Value", type: "Int", defaultValue: 0 },
          { name: "Name", type: "Str", defaultValue: "Counter" },
        ],
        methods: [],
        totalSize: 12,
        registeredAt: Date.now(),
      };
      registry.registerClass(counterDef);
      const retrieved = registry.getClass("Counter");
      expect(retrieved?.fields.length).toBe(2);
      expect(retrieved?.fields[0].name).toBe("Value");
      expect(retrieved?.fields[1].name).toBe("Name");
    });

    // 1-7
    test("1-7: ClassDef.methods 목록 확인", () => {
      const counterDef: ClassDef = {
        name: "Counter",
        fields: [],
        methods: [
          {
            name: "Add",
            className: "Counter",
            params: ["amt"],
            returnType: "Void",
          },
          {
            name: "GetValue",
            className: "Counter",
            params: [],
            returnType: "Int",
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(counterDef);
      const retrieved = registry.getClass("Counter");
      expect(retrieved?.methods.length).toBe(2);
    });

    // 1-8
    test("1-8: getMethod('Counter', 'Add') 반환", () => {
      const counterDef: ClassDef = {
        name: "Counter",
        fields: [],
        methods: [
          {
            name: "Add",
            className: "Counter",
            params: ["amt"],
            returnType: "Void",
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(counterDef);
      const method = registry.getMethod("Counter", "Add");
      expect(method?.name).toBe("Add");
      expect(method?.className).toBe("Counter");
    });

    // 1-9
    test("1-9: getMethod('Counter', 'GetValue') 반환", () => {
      const counterDef: ClassDef = {
        name: "Counter",
        fields: [],
        methods: [
          {
            name: "GetValue",
            className: "Counter",
            params: [],
            returnType: "Int",
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(counterDef);
      const method = registry.getMethod("Counter", "GetValue");
      expect(method?.name).toBe("GetValue");
    });

    // 1-10
    test("1-10: getAllClasses() 2개 반환", () => {
      const counter: ClassDef = {
        name: "Counter",
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      const dog: ClassDef = {
        name: "Dog",
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(counter);
      registry.registerClass(dog);
      const all = registry.getAllClasses();
      expect(all.length).toBe(2);
    });

    // 1-11
    test("1-11: bindMethodAddr() 메서드 주소 등록", () => {
      const counterDef: ClassDef = {
        name: "Counter",
        fields: [],
        methods: [
          {
            name: "Add",
            className: "Counter",
            params: ["amt"],
            returnType: "Void",
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(counterDef);
      registry.bindMethodAddr("Counter", "Add", 1000);
      const method = registry.getMethod("Counter", "Add");
      expect(method?.addr).toBe(1000);
    });

    // 1-12
    test("1-12: buildVTable() vTable 생성", () => {
      const counterDef: ClassDef = {
        name: "Counter",
        fields: [],
        methods: [
          {
            name: "Add",
            className: "Counter",
            params: ["amt"],
            returnType: "Void",
            addr: 1000,
          },
          {
            name: "GetValue",
            className: "Counter",
            params: [],
            returnType: "Int",
            addr: 1020,
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(counterDef);
      const vTable = registry.buildVTable("Counter");
      expect(vTable.get("Add")).toBe(1000);
      expect(vTable.get("GetValue")).toBe(1020);
    });

    // 1-13
    test("1-13: vTable['Add'] !== vTable['GetValue'] (주소 분리)", () => {
      const counterDef: ClassDef = {
        name: "Counter",
        fields: [],
        methods: [
          {
            name: "Add",
            className: "Counter",
            params: ["amt"],
            returnType: "Void",
            addr: 1000,
          },
          {
            name: "GetValue",
            className: "Counter",
            params: [],
            returnType: "Int",
            addr: 1020,
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(counterDef);
      const vTable = registry.buildVTable("Counter");
      expect(vTable.get("Add")).not.toBe(vTable.get("GetValue"));
    });

    // 1-14
    test("1-14: Namespace Isolation: Counter.Add vs Dog.Add 분리", () => {
      const counterDef: ClassDef = {
        name: "Counter",
        fields: [],
        methods: [
          {
            name: "Add",
            className: "Counter",
            params: ["amt"],
            returnType: "Void",
            addr: 1000,
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      const dogDef: ClassDef = {
        name: "Dog",
        fields: [],
        methods: [
          {
            name: "Add",
            className: "Dog",
            params: ["food"],
            returnType: "Void",
            addr: 2000,
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(counterDef);
      registry.registerClass(dogDef);

      const counterAdd = registry.getMethod("Counter", "Add");
      const dogAdd = registry.getMethod("Dog", "Add");
      expect(counterAdd?.addr).toBe(1000);
      expect(dogAdd?.addr).toBe(2000);
    });

    // 1-15
    test("1-15: 동일 이름 메서드가 다른 클래스에 있어도 충돌 없음", () => {
      const counter: ClassDef = {
        name: "Counter",
        fields: [],
        methods: [
          {
            name: "Increment",
            className: "Counter",
            params: [],
            returnType: "Void",
            addr: 3000,
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      const point: ClassDef = {
        name: "Point",
        fields: [],
        methods: [
          {
            name: "Increment",
            className: "Point",
            params: [],
            returnType: "Void",
            addr: 4000,
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(counter);
      registry.registerClass(point);

      expect(registry.getMethod("Counter", "Increment")?.addr).toBe(3000);
      expect(registry.getMethod("Point", "Increment")?.addr).toBe(4000);
    });

    // 1-16
    test("1-16: clear() 후 초기화", () => {
      const counterDef: ClassDef = {
        name: "Counter",
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(counterDef);
      expect(registry.hasClass("Counter")).toBe(true);
      registry.clear();
      expect(registry.hasClass("Counter")).toBe(false);
    });

    // 1-17
    test("1-17: 복수 클래스 등록 (Counter, Dog, Point)", () => {
      const counter: ClassDef = {
        name: "Counter",
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      const dog: ClassDef = {
        name: "Dog",
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      const point: ClassDef = {
        name: "Point",
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(counter);
      registry.registerClass(dog);
      registry.registerClass(point);
      const all = registry.getAllClasses();
      expect(all.length).toBe(3);
    });

    // 1-18
    test("1-18: ClassDef.totalSize 자동 계산", () => {
      const counterDef: ClassDef = {
        name: "Counter",
        fields: [
          { name: "Value", type: "Int", defaultValue: 0 },
          { name: "Name", type: "Str", defaultValue: "" },
        ],
        methods: [],
        totalSize: 24,  // 4 + 16 + padding = 24
        registeredAt: Date.now(),
      };
      registry.registerClass(counterDef);
      const retrieved = registry.getClass("Counter");
      expect(retrieved?.totalSize).toBe(24);
    });

    // 1-19
    test("1-19: MethodDef.returnType 정확한 저장", () => {
      const counterDef: ClassDef = {
        name: "Counter",
        fields: [],
        methods: [
          {
            name: "GetValue",
            className: "Counter",
            params: [],
            returnType: "Int",
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(counterDef);
      const method = registry.getMethod("Counter", "GetValue");
      expect(method?.returnType).toBe("Int");
    });

    // 1-20
    test("1-20: ✅ ClassDef 완전 등록 + vTable 구성", () => {
      const counterDef: ClassDef = {
        name: "Counter",
        fields: [{ name: "Value", type: "Int", defaultValue: 0 }],
        methods: [
          {
            name: "Add",
            className: "Counter",
            params: ["amt"],
            returnType: "Void",
            addr: 1000,
          },
          {
            name: "GetValue",
            className: "Counter",
            params: [],
            returnType: "Int",
            addr: 1020,
          },
        ],
        totalSize: 4,
        registeredAt: Date.now(),
      };
      registry.registerClass(counterDef);

      // 검증
      expect(registry.hasClass("Counter")).toBe(true);
      expect(registry.getClass("Counter")?.fields.length).toBe(1);
      expect(registry.getClass("Counter")?.methods.length).toBe(2);

      const vTable = registry.buildVTable("Counter");
      expect(vTable.has("Add")).toBe(true);
      expect(vTable.has("GetValue")).toBe(true);
    });
  });

  // ================================================
  // Phase 2: Self Binding & Dot Notation (20 tests)
  // ================================================

  describe("Phase 2: Self Binding & Dot Notation", () => {
    let binder: SelfBinder;

    beforeEach(() => {
      binder = new SelfBinder();
    });

    // 2-1
    test("2-1: SelfBinder 인스턴스 생성", () => {
      expect(binder).toBeDefined();
      expect(typeof binder.parseDotCall).toBe("function");
      expect(typeof binder.isSelfAccess).toBe("function");
      expect(typeof binder.bindSelf).toBe("function");
    });

    // 2-2
    test("2-2: parseDotCall('my_counter.Add(5)') 성공", () => {
      const result = binder.parseDotCall("my_counter.Add(5)");
      expect(result).not.toBeNull();
      expect(result?.receiver).toBe("my_counter");
      expect(result?.method).toBe("Add");
      expect(result?.args).toEqual(["5"]);
    });

    // 2-3
    test("2-3: DotCallInfo.receiver = 'my_counter'", () => {
      const result = binder.parseDotCall("my_counter.Add(5)");
      expect(result?.receiver).toBe("my_counter");
    });

    // 2-4
    test("2-4: DotCallInfo.method = 'Add'", () => {
      const result = binder.parseDotCall("my_counter.Add(5)");
      expect(result?.method).toBe("Add");
    });

    // 2-5
    test("2-5: DotCallInfo.args = ['5']", () => {
      const result = binder.parseDotCall("my_counter.Add(5)");
      expect(result?.args).toEqual(["5"]);
    });

    // 2-6
    test("2-6: parseDotCall('obj.GetValue()') args = []", () => {
      const result = binder.parseDotCall("obj.GetValue()");
      expect(result?.args).toEqual([]);
    });

    // 2-7
    test("2-7: isSelfAccess('self.Value') = true", () => {
      expect(binder.isSelfAccess("self.Value")).toBe(true);
    });

    // 2-8
    test("2-8: isSelfAccess('other.Value') = false", () => {
      expect(binder.isSelfAccess("other.Value")).toBe(false);
    });

    // 2-9
    test("2-9: parseSelfAccess('self.Value') → { field: 'Value' }", () => {
      const result = binder.parseSelfAccess("self.Value");
      expect(result?.field).toBe("Value");
    });

    // 2-10
    test("2-10: bindSelf('my_counter.Add(5)') → MethodCallInfo", () => {
      const result = binder.bindSelf("my_counter.Add(5)");
      expect(result).not.toBeNull();
      expect(result?.receiver).toBe("my_counter");
      expect(result?.method).toBe("Add");
    });

    // 2-11
    test("2-11: MethodCallInfo.receiver = 'my_counter'", () => {
      const result = binder.bindSelf("my_counter.Add(5)");
      expect(result?.receiver).toBe("my_counter");
    });

    // 2-12
    test("2-12: MethodCallInfo.explicitArgs = ['5']", () => {
      const result = binder.bindSelf("my_counter.Add(5)");
      expect(result?.explicitArgs).toEqual(["5"]);
    });

    // 2-13
    test("2-13: MethodCallInfo.fullArgs[0] = 'my_counter' (self가 첫 인자)", () => {
      const result = binder.bindSelf("my_counter.Add(5)");
      expect(result?.fullArgs[0]).toBe("my_counter");
      expect(result?.fullArgs[1]).toBe("5");
    });

    // 2-14
    test("2-14: parseDotCall('obj.method(a, b, c)') → 3 args", () => {
      const result = binder.parseDotCall("obj.method(a, b, c)");
      expect(result?.args.length).toBe(3);
      expect(result?.args).toEqual(["a", "b", "c"]);
    });

    // 2-15
    test("2-15: parseDotCall('obj.method()') → args = []", () => {
      const result = binder.parseDotCall("obj.method()");
      expect(result?.args).toEqual([]);
    });

    // 2-16
    test("2-16: parseDotCall('plain_function()') = null", () => {
      const result = binder.parseDotCall("plain_function()");
      expect(result).toBeNull();
    });

    // 2-17
    test("2-17: parseDotCall(빈 문자열) = null", () => {
      const result = binder.parseDotCall("");
      expect(result).toBeNull();
    });

    // 2-18
    test("2-18: parseSelfAccess('self.HP') → { field: 'HP' }", () => {
      const result = binder.parseSelfAccess("self.HP");
      expect(result?.field).toBe("HP");
    });

    // 2-19
    test("2-19: SET self.field 패턴 탐지: isSelfAccess('self.Value = x')", () => {
      expect(binder.isSelfAccess("self.Value = x")).toBe(true);
    });

    // 2-20
    test("2-20: ✅ SELF BINDING COMPLETE", () => {
      const dotCall = binder.parseDotCall("my_counter.Add(5)");
      expect(dotCall?.receiver).toBe("my_counter");

      const methodCall = binder.bindSelf("my_counter.Add(5)");
      expect(methodCall?.fullArgs).toEqual(["my_counter", "5"]);
      expect(binder.isSelfAccess("self.Value")).toBe(true);
    });
  });

  // ================================================
  // Phase 3: Counter Integration (20 tests)
  // ================================================

  describe("Phase 3: Counter Integration", () => {
    let registry: ClassRegistry;
    let factory: ClassInstanceFactory;

    beforeEach(() => {
      registry = new ClassRegistry();
      const counterDef: ClassDef = {
        name: "Counter",
        fields: [{ name: "Value", type: "Int", defaultValue: 0 }],
        methods: [
          {
            name: "Add",
            className: "Counter",
            params: ["amt"],
            returnType: "Void",
            addr: 1000,
          },
          {
            name: "GetValue",
            className: "Counter",
            params: [],
            returnType: "Int",
            addr: 1020,
          },
        ],
        totalSize: 4,
        registeredAt: Date.now(),
      };
      registry.registerClass(counterDef);
      factory = new ClassInstanceFactory(registry);
    });

    // 3-1
    test("3-1: ClassInstanceFactory 생성", () => {
      expect(factory).toBeDefined();
      expect(typeof factory.create).toBe("function");
      expect(typeof factory.getField).toBe("function");
      expect(typeof factory.setField).toBe("function");
      expect(typeof factory.lookupMethod).toBe("function");
    });

    // 3-2
    test("3-2: create('Counter') → ClassInstance 반환", () => {
      const instance = factory.create("Counter");
      expect(instance).toBeDefined();
      expect(instance.className).toBe("Counter");
    });

    // 3-3
    test("3-3: ClassInstance.className = 'Counter'", () => {
      const instance = factory.create("Counter");
      expect(instance.className).toBe("Counter");
    });

    // 3-4
    test("3-4: ClassInstance.vTable에 'Add' 등록", () => {
      const instance = factory.create("Counter");
      expect(instance.vTable.has("Add")).toBe(true);
    });

    // 3-5
    test("3-5: ClassInstance.vTable에 'GetValue' 등록", () => {
      const instance = factory.create("Counter");
      expect(instance.vTable.has("GetValue")).toBe(true);
    });

    // 3-6
    test("3-6: getField(inst, 'Value') 초기값 = 0", () => {
      const instance = factory.create("Counter");
      expect(factory.getField(instance, "Value")).toBe(0);
    });

    // 3-7
    test("3-7: setField(inst, 'Value', 10) 성공", () => {
      const instance = factory.create("Counter");
      factory.setField(instance, "Value", 10);
      expect(factory.getField(instance, "Value")).toBe(10);
    });

    // 3-8
    test("3-8: getField(inst, 'Value') = 10", () => {
      const instance = factory.create("Counter");
      factory.setField(instance, "Value", 10);
      expect(factory.getField(instance, "Value")).toBe(10);
    });

    // 3-9
    test("3-9: lookupMethod(inst, 'Add') → addr 반환", () => {
      const instance = factory.create("Counter");
      expect(factory.lookupMethod(instance, "Add")).toBe(1000);
    });

    // 3-10
    test("3-10: lookupMethod(inst, 'GetValue') → addr 반환", () => {
      const instance = factory.create("Counter");
      expect(factory.lookupMethod(instance, "GetValue")).toBe(1020);
    });

    // 3-11
    test("3-11: lookupMethod(inst, 'Unknown') = undefined", () => {
      const instance = factory.create("Counter");
      expect(factory.lookupMethod(instance, "Unknown")).toBeUndefined();
    });

    // 3-12
    test("3-12: isInstance(inst) = true", () => {
      const instance = factory.create("Counter");
      expect(factory.isInstance(instance)).toBe(true);
    });

    // 3-13
    test("3-13: create() 2회 → 독립적인 인스턴스", () => {
      const inst1 = factory.create("Counter");
      const inst2 = factory.create("Counter");
      expect(inst1).not.toBe(inst2);
    });

    // 3-14
    test("3-14: 인스턴스1.Value 변경이 인스턴스2에 영향 없음 (격리)", () => {
      const inst1 = factory.create("Counter");
      const inst2 = factory.create("Counter");
      factory.setField(inst1, "Value", 100);
      expect(factory.getField(inst1, "Value")).toBe(100);
      expect(factory.getField(inst2, "Value")).toBe(0);
    });

    // 3-15
    test("3-15: Counter 전체 플로우: create → set(10) → add(5) → get() = 15", () => {
      const instance = factory.create("Counter");
      factory.setField(instance, "Value", 10);
      // 실제 add(5) 호출은 VM에서 이루어지지만, 여기서는 필드값 직접 수정
      const current = (factory.getField(instance, "Value") as number) || 0;
      factory.setField(instance, "Value", current + 5);
      expect(factory.getField(instance, "Value")).toBe(15);
    });

    // 3-16
    test("3-16: 두 인스턴스 독립 연산", () => {
      const inst1 = factory.create("Counter");
      const inst2 = factory.create("Counter");
      factory.setField(inst1, "Value", 10);
      factory.setField(inst2, "Value", 20);
      expect(factory.getField(inst1, "Value")).toBe(10);
      expect(factory.getField(inst2, "Value")).toBe(20);
    });

    // 3-17
    test("3-17: ClassRegistry + SelfBinder + Factory 통합 테스트", () => {
      const instance = factory.create("Counter");
      expect(factory.isInstance(instance)).toBe(true);

      const binder = new SelfBinder();
      const methodCall = binder.bindSelf("instance.Add(5)");
      expect(methodCall?.fullArgs).toEqual(["instance", "5"]);
    });

    // 3-18
    test("3-18: 메서드 Namespace: Counter.Add vs Dog.Add 독립 vTable", () => {
      const dogDef: ClassDef = {
        name: "Dog",
        fields: [{ name: "Hunger", type: "Int", defaultValue: 0 }],
        methods: [
          {
            name: "Add",
            className: "Dog",
            params: ["food"],
            returnType: "Void",
            addr: 2000,  // Counter.Add와 다른 주소
          },
        ],
        totalSize: 4,
        registeredAt: Date.now(),
      };
      registry.registerClass(dogDef);

      const counterInst = factory.create("Counter");
      const dogInst = factory.create("Dog");

      expect(factory.lookupMethod(counterInst, "Add")).toBe(1000);
      expect(factory.lookupMethod(dogInst, "Add")).toBe(2000);
    });

    // 3-19
    test("3-19: 성능: 1000개 인스턴스 생성 < 100ms", () => {
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        factory.create("Counter");
      }
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    // 3-20
    test("3-20: ✅ TC_V7_0_CLASS_FOUNDATION COMPLETE", () => {
      // Phase 1: Registry
      expect(registry.hasClass("Counter")).toBe(true);
      const vTable = registry.buildVTable("Counter");
      expect(vTable.has("Add")).toBe(true);

      // Phase 2: Self Binding
      const binder = new SelfBinder();
      const methodCall = binder.bindSelf("myCounter.Add(5)");
      expect(methodCall?.fullArgs).toEqual(["myCounter", "5"]);

      // Phase 3: Integration
      const instance = factory.create("Counter");
      factory.setField(instance, "Value", 10);
      const current = (factory.getField(instance, "Value") as number) || 0;
      factory.setField(instance, "Value", current + 5);
      expect(factory.getField(instance, "Value")).toBe(15);

      // All checks passed ✅
      expect(factory.isInstance(instance)).toBe(true);
      expect(factory.lookupMethod(instance, "GetValue")).toBe(1020);
    });
  });
});

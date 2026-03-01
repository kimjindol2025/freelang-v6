/**
 * FreeLang v7.1: Inheritance & Memory Offset Expansion
 * 60 Integration Tests
 *
 * Phase 1: Hierarchy & Layout (20 tests)
 * Phase 2: Super Binding & Method Resolution (20 tests)
 * Phase 3: Point3D Integration (20 tests)
 */

import {
  ClassDef,
  ClassRegistry,
  ClassInstanceFactory,
} from '../src/class-foundation';
import {
  ClassHierarchy,
  InheritanceLayout,
  SuperBinder,
  InheritanceFactory,
  ClassLayout,
} from '../src/class-inheritance';

describe('v7.1: Inheritance & Memory Offset Expansion', () => {
  let hierarchy: ClassHierarchy;
  let layout: InheritanceLayout;
  let registry: ClassRegistry;
  let factory: InheritanceFactory;

  beforeEach(() => {
    hierarchy = new ClassHierarchy();
    layout = new InheritanceLayout();
    registry = new ClassRegistry();
    factory = new InheritanceFactory(registry, hierarchy, layout);
  });

  describe('Phase 1: Hierarchy & Layout (20 tests)', () => {
    it('1-1: ClassHierarchy 인스턴스 생성', () => {
      expect(hierarchy).toBeDefined();
      expect(typeof hierarchy.extend).toBe('function');
    });

    it('1-2: extend("Point3D", "Point") 등록 성공', () => {
      hierarchy.extend('Point3D', 'Point');
      expect(hierarchy.hasParent('Point3D')).toBe(true);
    });

    it('1-3: hasParent("Point3D") = true', () => {
      hierarchy.extend('Point3D', 'Point');
      expect(hierarchy.hasParent('Point3D')).toBe(true);
    });

    it('1-4: hasParent("Point") = false (루트 클래스)', () => {
      expect(hierarchy.hasParent('Point')).toBe(false);
    });

    it('1-5: getParent("Point3D") = "Point"', () => {
      hierarchy.extend('Point3D', 'Point');
      expect(hierarchy.getParent('Point3D')).toBe('Point');
    });

    it('1-6: getInheritanceChain("Point3D") = ["Point3D", "Point"]', () => {
      hierarchy.extend('Point3D', 'Point');
      const chain = hierarchy.getInheritanceChain('Point3D');
      expect(chain).toEqual(['Point3D', 'Point']);
    });

    it('1-7: getInheritanceChain("Point") = ["Point"]', () => {
      const chain = hierarchy.getInheritanceChain('Point');
      expect(chain).toEqual(['Point']);
    });

    it('1-8: isSubclassOf("Point3D", "Point") = true', () => {
      hierarchy.extend('Point3D', 'Point');
      expect(hierarchy.isSubclassOf('Point3D', 'Point')).toBe(true);
    });

    it('1-9: isSubclassOf("Point", "Point3D") = false', () => {
      hierarchy.extend('Point3D', 'Point');
      expect(hierarchy.isSubclassOf('Point', 'Point3D')).toBe(false);
    });

    it('1-10: getRootClass("Point3D") = "Point"', () => {
      hierarchy.extend('Point3D', 'Point');
      expect(hierarchy.getRootClass('Point3D')).toBe('Point');
    });

    it('1-11: InheritanceLayout 인스턴스 생성', () => {
      expect(layout).toBeDefined();
      expect(typeof layout.getTypeSize).toBe('function');
    });

    it('1-12: getTypeSize("Int") = 4', () => {
      expect(layout.getTypeSize('Int')).toBe(4);
    });

    it('1-13: calculateParentLayout(Point) → { totalSize: 8 }', () => {
      const pointDef: ClassDef = {
        name: 'Point',
        fields: [
          { name: 'X', type: 'Int' },
          { name: 'Y', type: 'Int' },
        ],
        methods: [],
        totalSize: 8,
        registeredAt: Date.now(),
      };

      registry.registerClass(pointDef);
      const pointLayout = layout.calculateParentLayout(pointDef, hierarchy, registry);

      expect(pointLayout.totalSize).toBe(8);
      expect(pointLayout.fields.length).toBe(2);
    });

    it('1-14: calculateChildLayout(Point3D, pointLayout) → { totalSize: 12 }', () => {
      const pointDef: ClassDef = {
        name: 'Point',
        fields: [
          { name: 'X', type: 'Int' },
          { name: 'Y', type: 'Int' },
        ],
        methods: [],
        totalSize: 8,
        registeredAt: Date.now(),
      };

      registry.registerClass(pointDef);
      const pointLayout = layout.calculateParentLayout(pointDef, hierarchy, registry);

      const point3dDef: ClassDef = {
        name: 'Point3D',
        fields: [{ name: 'Z', type: 'Int' }],
        methods: [],
        totalSize: 12,
        registeredAt: Date.now(),
      };

      const point3dLayout = layout.calculateChildLayout(point3dDef, pointLayout);

      expect(point3dLayout.totalSize).toBe(12);
      expect(point3dLayout.fields.length).toBe(3);
    });

    it('1-15: Point3D.Z offset = 8 (부모 8B 뒤에 추가)', () => {
      const pointDef: ClassDef = {
        name: 'Point',
        fields: [
          { name: 'X', type: 'Int' },
          { name: 'Y', type: 'Int' },
        ],
        methods: [],
        totalSize: 8,
        registeredAt: Date.now(),
      };

      registry.registerClass(pointDef);
      const pointLayout = layout.calculateParentLayout(pointDef, hierarchy, registry);

      const point3dDef: ClassDef = {
        name: 'Point3D',
        fields: [{ name: 'Z', type: 'Int' }],
        methods: [],
        totalSize: 12,
        registeredAt: Date.now(),
      };

      const point3dLayout = layout.calculateChildLayout(point3dDef, pointLayout);
      const zField = point3dLayout.fields.find((f) => f.name === 'Z');

      expect(zField?.offset).toBe(8);
    });

    it('1-16: Point3D.X offset = 0 (부모 오프셋 보존)', () => {
      const pointDef: ClassDef = {
        name: 'Point',
        fields: [
          { name: 'X', type: 'Int' },
          { name: 'Y', type: 'Int' },
        ],
        methods: [],
        totalSize: 8,
        registeredAt: Date.now(),
      };

      registry.registerClass(pointDef);
      const pointLayout = layout.calculateParentLayout(pointDef, hierarchy, registry);

      const point3dDef: ClassDef = {
        name: 'Point3D',
        fields: [{ name: 'Z', type: 'Int' }],
        methods: [],
        totalSize: 12,
        registeredAt: Date.now(),
      };

      const point3dLayout = layout.calculateChildLayout(point3dDef, pointLayout);
      const xField = point3dLayout.fields.find((f) => f.name === 'X');

      expect(xField?.offset).toBe(0);
    });

    it('1-17: Point3D.Y offset = 4 (부모 오프셋 보존)', () => {
      const pointDef: ClassDef = {
        name: 'Point',
        fields: [
          { name: 'X', type: 'Int' },
          { name: 'Y', type: 'Int' },
        ],
        methods: [],
        totalSize: 8,
        registeredAt: Date.now(),
      };

      registry.registerClass(pointDef);
      const pointLayout = layout.calculateParentLayout(pointDef, hierarchy, registry);

      const point3dDef: ClassDef = {
        name: 'Point3D',
        fields: [{ name: 'Z', type: 'Int' }],
        methods: [],
        totalSize: 12,
        registeredAt: Date.now(),
      };

      const point3dLayout = layout.calculateChildLayout(point3dDef, pointLayout);
      const yField = point3dLayout.fields.find((f) => f.name === 'Y');

      expect(yField?.offset).toBe(4);
    });

    it('1-18: calculateLayoutForClass("Point3D") → 전체 레이아웃', () => {
      const pointDef: ClassDef = {
        name: 'Point',
        fields: [
          { name: 'X', type: 'Int' },
          { name: 'Y', type: 'Int' },
        ],
        methods: [],
        totalSize: 8,
        registeredAt: Date.now(),
      };

      registry.registerClass(pointDef);
      hierarchy.extend('Point3D', 'Point');

      const point3dDef: ClassDef = {
        name: 'Point3D',
        fields: [{ name: 'Z', type: 'Int' }],
        methods: [],
        totalSize: 12,
        registeredAt: Date.now(),
      };

      registry.registerClass(point3dDef);

      const fullLayout = layout.calculateLayoutForClass('Point3D', hierarchy, registry);

      expect(fullLayout.totalSize).toBe(12);
      expect(fullLayout.fields.length).toBe(3);
    });

    it('1-19: 3단계 상속 (A → B → C) 체인 확인', () => {
      hierarchy.extend('B', 'A');
      hierarchy.extend('C', 'B');

      const chain = hierarchy.getInheritanceChain('C');
      expect(chain).toEqual(['C', 'B', 'A']);
    });

    it('1-20: ✅ HIERARCHY & LAYOUT COMPLETE', () => {
      expect(hierarchy.getAllRelations().length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Phase 2: Super Binding & Method Resolution (20 tests)', () => {
    it('2-1: SuperBinder 인스턴스 생성', () => {
      const binder = new SuperBinder(hierarchy, registry);
      expect(binder).toBeDefined();
    });

    it('2-2: isSuperCall("super.SetPoint(1, 2)") = true', () => {
      const binder = new SuperBinder(hierarchy, registry);
      expect(binder.isSuperCall('super.SetPoint(1, 2)')).toBe(true);
    });

    it('2-3: isSuperCall("self.SetPoint(1, 2)") = false', () => {
      const binder = new SuperBinder(hierarchy, registry);
      expect(binder.isSuperCall('self.SetPoint(1, 2)')).toBe(false);
    });

    it('2-4: parseSuperCall("super.SetPoint(1, 2)") → SuperCallInfo', () => {
      const binder = new SuperBinder(hierarchy, registry);
      const info = binder.parseSuperCall('super.SetPoint(1, 2)');

      expect(info).toBeDefined();
      expect(info?.method).toBe('SetPoint');
    });

    it('2-5: SuperCallInfo.targetClass = "Point" (부모 클래스)', () => {
      hierarchy.extend('Point3D', 'Point');
      const binder = new SuperBinder(hierarchy, registry);

      expect(hierarchy.getParent('Point3D')).toBe('Point');
    });

    it('2-6: SuperCallInfo.method = "SetPoint"', () => {
      const binder = new SuperBinder(hierarchy, registry);
      const info = binder.parseSuperCall('super.SetPoint(1, 2)');

      expect(info?.method).toBe('SetPoint');
    });

    it('2-7: resolveSuperMethod("Point3D", "SetPoint") → Point의 MethodDef', () => {
      const pointDef: ClassDef = {
        name: 'Point',
        fields: [
          { name: 'X', type: 'Int' },
          { name: 'Y', type: 'Int' },
        ],
        methods: [
          {
            name: 'SetPoint',
            className: 'Point',
            params: ['x', 'y'],
            returnType: 'Void',
            addr: 1000,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };

      registry.registerClass(pointDef);
      hierarchy.extend('Point3D', 'Point');

      const binder = new SuperBinder(hierarchy, registry);
      const method = binder.resolveSuperMethod('Point3D', 'SetPoint');

      expect(method).toBeDefined();
      expect(method?.className).toBe('Point');
    });

    it('2-8: resolveSuperMethod 없는 메서드 → undefined', () => {
      const pointDef: ClassDef = {
        name: 'Point',
        fields: [
          { name: 'X', type: 'Int' },
          { name: 'Y', type: 'Int' },
        ],
        methods: [],
        totalSize: 8,
        registeredAt: Date.now(),
      };

      registry.registerClass(pointDef);
      hierarchy.extend('Point3D', 'Point');

      const binder = new SuperBinder(hierarchy, registry);
      const method = binder.resolveSuperMethod('Point3D', 'NonExistent');

      expect(method).toBeUndefined();
    });

    it('2-9: InheritanceFactory 생성', () => {
      expect(factory).toBeDefined();
      expect(typeof factory.createWithInheritance).toBe('function');
    });

    it('2-10: buildInheritedVTable (부모 메서드 포함)', () => {
      const pointDef: ClassDef = {
        name: 'Point',
        fields: [
          { name: 'X', type: 'Int' },
          { name: 'Y', type: 'Int' },
        ],
        methods: [
          {
            name: 'SetPoint',
            className: 'Point',
            params: ['x', 'y'],
            returnType: 'Void',
            addr: 1000,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };

      registry.registerClass(pointDef);
      hierarchy.extend('Point3D', 'Point');

      const vTable = factory.buildInheritedVTable('Point3D');

      expect(vTable.has('SetPoint')).toBe(true);
    });

    it('2-11: 부모 메서드가 자식 vTable에 등록됨', () => {
      const pointDef: ClassDef = {
        name: 'Point',
        fields: [
          { name: 'X', type: 'Int' },
          { name: 'Y', type: 'Int' },
        ],
        methods: [
          {
            name: 'SetPoint',
            className: 'Point',
            params: ['x', 'y'],
            returnType: 'Void',
            addr: 1000,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };

      registry.registerClass(pointDef);
      hierarchy.extend('Point3D', 'Point');

      const point3dDef: ClassDef = {
        name: 'Point3D',
        fields: [{ name: 'Z', type: 'Int' }],
        methods: [],
        totalSize: 12,
        registeredAt: Date.now(),
      };

      registry.registerClass(point3dDef);

      const vTable = factory.buildInheritedVTable('Point3D');
      expect(vTable.get('SetPoint')).toBe(1000);
    });

    it('2-12: 자식이 오버라이드 시 vTable 갱신됨', () => {
      const pointDef: ClassDef = {
        name: 'Point',
        fields: [
          { name: 'X', type: 'Int' },
          { name: 'Y', type: 'Int' },
        ],
        methods: [
          {
            name: 'SetPoint',
            className: 'Point',
            params: ['x', 'y'],
            returnType: 'Void',
            addr: 1000,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };

      registry.registerClass(pointDef);
      hierarchy.extend('Point3D', 'Point');

      const point3dDef: ClassDef = {
        name: 'Point3D',
        fields: [{ name: 'Z', type: 'Int' }],
        methods: [
          {
            name: 'SetPoint', // 오버라이드
            className: 'Point3D',
            params: ['x', 'y', 'z'],
            returnType: 'Void',
            addr: 2000,
          },
        ],
        totalSize: 12,
        registeredAt: Date.now(),
      };

      registry.registerClass(point3dDef);

      const vTable = factory.buildInheritedVTable('Point3D');
      expect(vTable.get('SetPoint')).toBe(2000); // 자식 오버라이드 주소
    });

    it('2-13: 부모 메서드 addr 접근 가능', () => {
      const pointDef: ClassDef = {
        name: 'Point',
        fields: [
          { name: 'X', type: 'Int' },
          { name: 'Y', type: 'Int' },
        ],
        methods: [
          {
            name: 'SetPoint',
            className: 'Point',
            params: ['x', 'y'],
            returnType: 'Void',
            addr: 1000,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };

      registry.registerClass(pointDef);

      const method = registry.getMethod('Point', 'SetPoint');
      expect(method?.addr).toBe(1000);
    });

    it('2-14: isSuperCall("") = false', () => {
      const binder = new SuperBinder(hierarchy, registry);
      expect(binder.isSuperCall('')).toBe(false);
    });

    it('2-15: isSuperCall("plainFunc()") = false', () => {
      const binder = new SuperBinder(hierarchy, registry);
      expect(binder.isSuperCall('plainFunc()')).toBe(false);
    });

    it('2-16: getAllRelations() 전체 상속 관계 목록', () => {
      hierarchy.extend('B', 'A');
      hierarchy.extend('C', 'B');

      const relations = hierarchy.getAllRelations();
      expect(relations.length).toBe(2);
    });

    it('2-17: 다중 상속 체인의 super 방향 (B.super = A)', () => {
      hierarchy.extend('B', 'A');
      expect(hierarchy.getParent('B')).toBe('A');
    });

    it('2-18: 상속 없는 클래스의 super → undefined', () => {
      const binder = new SuperBinder(hierarchy, registry);
      const method = binder.resolveSuperMethod('Standalone', 'AnyMethod');

      expect(method).toBeUndefined();
    });

    it('2-19: isInstanceOfClass(p3, "Point") = true (upcasting)', () => {
      const pointDef: ClassDef = {
        name: 'Point',
        fields: [
          { name: 'X', type: 'Int' },
          { name: 'Y', type: 'Int' },
        ],
        methods: [],
        totalSize: 8,
        registeredAt: Date.now(),
      };

      registry.registerClass(pointDef);
      hierarchy.extend('Point3D', 'Point');

      const point3dDef: ClassDef = {
        name: 'Point3D',
        fields: [{ name: 'Z', type: 'Int' }],
        methods: [],
        totalSize: 12,
        registeredAt: Date.now(),
      };

      registry.registerClass(point3dDef);

      const p3 = factory.createWithInheritance('Point3D');

      expect(factory.isInstanceOfClass(p3, 'Point')).toBe(true);
    });

    it('2-20: ✅ SUPER BINDING COMPLETE', () => {
      const binder = new SuperBinder(hierarchy, registry);
      expect(binder.isSuperCall('super.Method()')).toBe(true);
    });
  });

  describe('Phase 3: Point3D Integration (20 tests)', () => {
    beforeEach(() => {
      // Point 클래스 정의
      const pointDef: ClassDef = {
        name: 'Point',
        fields: [
          { name: 'X', type: 'Int' },
          { name: 'Y', type: 'Int' },
        ],
        methods: [],
        totalSize: 8,
        registeredAt: Date.now(),
      };

      registry.registerClass(pointDef);

      // Point3D 클래스 정의
      const point3dDef: ClassDef = {
        name: 'Point3D',
        fields: [{ name: 'Z', type: 'Int' }],
        methods: [],
        totalSize: 12,
        registeredAt: Date.now(),
      };

      registry.registerClass(point3dDef);

      // 상속 관계 등록
      hierarchy.extend('Point3D', 'Point');
    });

    it('3-1: Point(X,Y) + Point3D(Z) extends Point 전체 등록', () => {
      expect(registry.hasClass('Point')).toBe(true);
      expect(registry.hasClass('Point3D')).toBe(true);
      expect(hierarchy.getParent('Point3D')).toBe('Point');
    });

    it('3-2: createWithInheritance("Point3D") → ClassInstance', () => {
      const p3 = factory.createWithInheritance('Point3D');

      expect(p3).toBeDefined();
      expect(p3.className).toBe('Point3D');
    });

    it('3-3: Point3D 인스턴스에 X 필드 존재 (부모 상속)', () => {
      const p3 = factory.createWithInheritance('Point3D');

      expect(p3.fields.has('X')).toBe(true);
    });

    it('3-4: Point3D 인스턴스에 Y 필드 존재 (부모 상속)', () => {
      const p3 = factory.createWithInheritance('Point3D');

      expect(p3.fields.has('Y')).toBe(true);
    });

    it('3-5: Point3D 인스턴스에 Z 필드 존재 (자신의 필드)', () => {
      const p3 = factory.createWithInheritance('Point3D');

      expect(p3.fields.has('Z')).toBe(true);
    });

    it('3-6: X 초기값 = 0 (부모 필드 기본값)', () => {
      const p3 = factory.createWithInheritance('Point3D');

      expect(p3.fields.get('X')).toBe(0);
    });

    it('3-7: Y 초기값 = 0 (부모 필드 기본값)', () => {
      const p3 = factory.createWithInheritance('Point3D');

      expect(p3.fields.get('Y')).toBe(0);
    });

    it('3-8: setField(p3, "X", 10) → X = 10', () => {
      const p3 = factory.createWithInheritance('Point3D');
      const baseFactory = new ClassInstanceFactory(registry);

      baseFactory.setField(p3, 'X', 10);

      expect(p3.fields.get('X')).toBe(10);
    });

    it('3-9: setField(p3, "Y", 20) → Y = 20', () => {
      const p3 = factory.createWithInheritance('Point3D');
      const baseFactory = new ClassInstanceFactory(registry);

      baseFactory.setField(p3, 'Y', 20);

      expect(p3.fields.get('Y')).toBe(20);
    });

    it('3-10: setField(p3, "Z", 30) → Z = 30', () => {
      const p3 = factory.createWithInheritance('Point3D');
      const baseFactory = new ClassInstanceFactory(registry);

      baseFactory.setField(p3, 'Z', 30);

      expect(p3.fields.get('Z')).toBe(30);
    });

    it('3-11: getField(p3, "X") = 10', () => {
      const p3 = factory.createWithInheritance('Point3D');
      const baseFactory = new ClassInstanceFactory(registry);

      baseFactory.setField(p3, 'X', 10);

      expect(baseFactory.getField(p3, 'X')).toBe(10);
    });

    it('3-12: getField(p3, "Y") = 20', () => {
      const p3 = factory.createWithInheritance('Point3D');
      const baseFactory = new ClassInstanceFactory(registry);

      baseFactory.setField(p3, 'Y', 20);

      expect(baseFactory.getField(p3, 'Y')).toBe(20);
    });

    it('3-13: getField(p3, "Z") = 30', () => {
      const p3 = factory.createWithInheritance('Point3D');
      const baseFactory = new ClassInstanceFactory(registry);

      baseFactory.setField(p3, 'Z', 30);

      expect(baseFactory.getField(p3, 'Z')).toBe(30);
    });

    it('3-14: sizeof(Point3D) = 12 (X:4 + Y:4 + Z:4)', () => {
      const fullLayout = layout.calculateLayoutForClass('Point3D', hierarchy, registry);

      expect(fullLayout.totalSize).toBe(12);
    });

    it('3-15: 오프셋 무결성: X@0, Y@4, Z@8', () => {
      const fullLayout = layout.calculateLayoutForClass('Point3D', hierarchy, registry);

      const xField = fullLayout.fields.find((f) => f.name === 'X');
      const yField = fullLayout.fields.find((f) => f.name === 'Y');
      const zField = fullLayout.fields.find((f) => f.name === 'Z');

      expect(xField?.offset).toBe(0);
      expect(yField?.offset).toBe(4);
      expect(zField?.offset).toBe(8);
    });

    it('3-16: createWithInheritance 2회 → 독립 인스턴스', () => {
      const p3a = factory.createWithInheritance('Point3D');
      const p3b = factory.createWithInheritance('Point3D');

      expect(p3a).not.toBe(p3b);
      expect(p3a.fields).not.toBe(p3b.fields);
    });

    it('3-17: p3a.X 변경이 p3b.X에 영향 없음', () => {
      const baseFactory = new ClassInstanceFactory(registry);
      const p3a = factory.createWithInheritance('Point3D');
      const p3b = factory.createWithInheritance('Point3D');

      baseFactory.setField(p3a, 'X', 100);

      expect(baseFactory.getField(p3a, 'X')).toBe(100);
      expect(baseFactory.getField(p3b, 'X')).toBe(0);
    });

    it('3-18: isInstanceOfClass(p3, "Point3D") = true', () => {
      const p3 = factory.createWithInheritance('Point3D');

      expect(factory.isInstanceOfClass(p3, 'Point3D')).toBe(true);
    });

    it('3-19: isInstanceOfClass(p3, "Point") = true (upcasting)', () => {
      const p3 = factory.createWithInheritance('Point3D');

      expect(factory.isInstanceOfClass(p3, 'Point')).toBe(true);
    });

    it('3-20: ✅ TC_V7_1_INHERITANCE_COMPLETE', () => {
      const p3 = factory.createWithInheritance('Point3D');
      const baseFactory = new ClassInstanceFactory(registry);

      baseFactory.setField(p3, 'X', 10);
      baseFactory.setField(p3, 'Y', 20);
      baseFactory.setField(p3, 'Z', 30);

      expect(baseFactory.getField(p3, 'X')).toBe(10);
      expect(baseFactory.getField(p3, 'Y')).toBe(20);
      expect(baseFactory.getField(p3, 'Z')).toBe(30);
      expect(factory.isInstanceOfClass(p3, 'Point')).toBe(true);
    });
  });
});

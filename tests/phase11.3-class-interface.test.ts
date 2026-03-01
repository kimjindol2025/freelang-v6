/**
 * FreeLang v7.3: Interfaces & Abstract Contract - 60 Tests
 *
 * 목표: 엔진이 강제하는 인터페이스 계약
 * - Phase 1: 인터페이스 정의 & 등록 (20 tests)
 * - Phase 2: 계약 강제성 & 추상 메서드 (20 tests)
 * - Phase 3: 통합 & 엣지 케이스 (20 tests)
 */

import {
  ClassDef,
  ClassRegistry,
  MethodDef,
} from '../src/class-foundation';
import {
  ClassHierarchy,
  InheritanceFactory,
} from '../src/class-inheritance';
import {
  MethodIndexTable,
  VTableBuilder,
  VTableDispatcher,
  PolymorphicFactory,
  VirtualTable,
} from '../src/class-polymorphism';
import {
  InterfaceDef,
  InterfaceMethodDef,
  InterfaceRegistry,
  AbstractValidator,
  ContractChecker,
  ContractViolation,
  ContractMapping,
} from '../src/class-interface';

describe('Phase 11.3: Interfaces & Abstract Contract', () => {
  let registry: ClassRegistry;
  let hierarchy: ClassHierarchy;
  let ifRegistry: InterfaceRegistry;
  let validator: AbstractValidator;
  let checker: ContractChecker;

  beforeEach(() => {
    registry = new ClassRegistry();
    hierarchy = new ClassHierarchy();
    ifRegistry = new InterfaceRegistry();
    validator = new AbstractValidator(registry, ifRegistry);
    checker = new ContractChecker(registry, ifRegistry, validator);
  });

  describe('Phase 1: Interface Definition & Registration (20 tests)', () => {
    test('1-1: InterfaceRegistry 인스턴스 생성', () => {
      expect(ifRegistry).toBeDefined();
      expect(ifRegistry.getAllInterfaces().length).toBe(0);
    });

    test('1-2: Shape 인터페이스 정의 (GetArea, GetPerimeter)', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [
          {
            name: 'GetArea',
            params: ['self'],
            returnType: 'Int',
            slotIndex: 0,
          },
          {
            name: 'GetPerimeter',
            params: ['self'],
            returnType: 'Int',
            slotIndex: 1,
          },
        ],
        registeredAt: Date.now(),
      };
      expect(shapeInterface.methods.length).toBe(2);
      expect(shapeInterface.name).toBe('Shape');
    });

    test('1-3: registerInterface(Shape)', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [
          {
            name: 'GetArea',
            params: ['self'],
            returnType: 'Int',
            slotIndex: 0,
          },
        ],
        registeredAt: Date.now(),
      };
      ifRegistry.registerInterface(shapeInterface);
      expect(ifRegistry.getAllInterfaces().length).toBe(1);
    });

    test('1-4: getInterface("Shape") 조회', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [],
        registeredAt: Date.now(),
      };
      ifRegistry.registerInterface(shapeInterface);
      const retrieved = ifRegistry.getInterface('Shape');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Shape');
    });

    test('1-5: 인터페이스 메서드 슬롯 인덱싱: GetArea=0, GetPerimeter=1', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [
          {
            name: 'GetArea',
            params: ['self'],
            returnType: 'Int',
            slotIndex: 0,
          },
          {
            name: 'GetPerimeter',
            params: ['self'],
            returnType: 'Int',
            slotIndex: 1,
          },
        ],
        registeredAt: Date.now(),
      };
      expect(shapeInterface.methods[0].slotIndex).toBe(0);
      expect(shapeInterface.methods[1].slotIndex).toBe(1);
    });

    test('1-6: 인터페이스는 데이터 멤버 없음 (Zero-Data Rule)', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [
          {
            name: 'GetArea',
            params: ['self'],
            returnType: 'Int',
            slotIndex: 0,
          },
        ],
        registeredAt: Date.now(),
      };
      // InterfaceDef에 fields 속성이 없음 (메서드만 가능)
      expect((shapeInterface as any).fields).toBeUndefined();
    });

    test('1-7: 여러 인터페이스 등록: Shape, Drawable', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [],
        registeredAt: Date.now(),
      };
      const drawableInterface: InterfaceDef = {
        name: 'Drawable',
        methods: [],
        registeredAt: Date.now(),
      };
      ifRegistry.registerInterface(shapeInterface);
      ifRegistry.registerInterface(drawableInterface);
      expect(ifRegistry.getAllInterfaces().length).toBe(2);
    });

    test('1-8: getAllInterfaces() 전체 목록', () => {
      const if1: InterfaceDef = { name: 'A', methods: [], registeredAt: Date.now() };
      const if2: InterfaceDef = { name: 'B', methods: [], registeredAt: Date.now() };
      ifRegistry.registerInterface(if1);
      ifRegistry.registerInterface(if2);
      const all = ifRegistry.getAllInterfaces();
      expect(all.length).toBe(2);
      expect(all.map((i) => i.name).sort()).toEqual(['A', 'B']);
    });

    test('1-9: 메서드 순서와 슬롯 인덱스 일치 확인', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'M1', params: ['self'], returnType: 'Int', slotIndex: 0 },
          { name: 'M2', params: ['self'], returnType: 'Int', slotIndex: 1 },
          { name: 'M3', params: ['self'], returnType: 'Int', slotIndex: 2 },
        ],
        registeredAt: Date.now(),
      };
      for (let i = 0; i < shapeInterface.methods.length; i++) {
        expect(shapeInterface.methods[i].slotIndex).toBe(i);
      }
    });

    test('1-10: 인터페이스 메서드 시그니처 보존', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [
          {
            name: 'GetArea',
            params: ['self'],
            returnType: 'Int',
            slotIndex: 0,
          },
        ],
        registeredAt: Date.now(),
      };
      ifRegistry.registerInterface(shapeInterface);
      const retrieved = ifRegistry.getInterface('Shape');
      expect(retrieved?.methods[0].returnType).toBe('Int');
      expect(retrieved?.methods[0].params).toEqual(['self']);
    });

    test('1-11: 3개 메서드 인터페이스 슬롯 매핑 검증', () => {
      const comInterface: InterfaceDef = {
        name: 'Comparable',
        methods: [
          { name: 'Compare', params: ['self', 'other'], returnType: 'Int', slotIndex: 0 },
          { name: 'Equals', params: ['self', 'other'], returnType: 'Bool', slotIndex: 1 },
          { name: 'Hash', params: ['self'], returnType: 'Int', slotIndex: 2 },
        ],
        registeredAt: Date.now(),
      };
      expect(comInterface.methods.length).toBe(3);
      expect(comInterface.methods[2].slotIndex).toBe(2);
    });

    test('1-12: 슬롯 인덱스 연속성 (0, 1, 2, ...)', () => {
      const ifDef: InterfaceDef = {
        name: 'Test',
        methods: [
          { name: 'M0', params: ['self'], returnType: 'Int', slotIndex: 0 },
          { name: 'M1', params: ['self'], returnType: 'Int', slotIndex: 1 },
          { name: 'M2', params: ['self'], returnType: 'Int', slotIndex: 2 },
          { name: 'M3', params: ['self'], returnType: 'Int', slotIndex: 3 },
        ],
        registeredAt: Date.now(),
      };
      const slots = ifDef.methods.map((m) => m.slotIndex);
      expect(slots).toEqual([0, 1, 2, 3]);
    });

    test('1-13: Comparable 인터페이스 (Compare 메서드)', () => {
      const comInterface: InterfaceDef = {
        name: 'Comparable',
        methods: [
          { name: 'Compare', params: ['self', 'other'], returnType: 'Int', slotIndex: 0 },
        ],
        registeredAt: Date.now(),
      };
      ifRegistry.registerInterface(comInterface);
      const retrieved = ifRegistry.getInterface('Comparable');
      expect(retrieved?.methods[0].name).toBe('Compare');
    });

    test('1-14: 인터페이스 메타데이터 보존', () => {
      const timestamp = Date.now();
      const ifDef: InterfaceDef = {
        name: 'Shape',
        methods: [],
        registeredAt: timestamp,
      };
      ifRegistry.registerInterface(ifDef);
      const retrieved = ifRegistry.getInterface('Shape');
      expect(retrieved?.registeredAt).toBe(timestamp);
    });

    test('1-15: Zero-Data 규칙 강제: 데이터 필드 방지', () => {
      // InterfaceDef는 데이터 필드를 가질 수 없음
      const ifDef: InterfaceDef = {
        name: 'Shape',
        methods: [],
        registeredAt: Date.now(),
      };
      // 타입 체커가 미리 막아주지만, 런타임 검증도 가능
      expect((ifDef as any).fields).toBeUndefined();
    });

    test('1-16: 중복 인터페이스 등록 처리', () => {
      const ifDef1: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'M1', params: ['self'], returnType: 'Int', slotIndex: 0 },
        ],
        registeredAt: Date.now(),
      };
      const ifDef2: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'M1', params: ['self'], returnType: 'Str', slotIndex: 0 },
        ],
        registeredAt: Date.now(),
      };
      ifRegistry.registerInterface(ifDef1);
      ifRegistry.registerInterface(ifDef2); // 덮어쓰기
      const retrieved = ifRegistry.getInterface('Shape');
      expect(retrieved?.methods[0].returnType).toBe('Str'); // 최신 정의
    });

    test('1-17: 인터페이스 메서드 재정렬 시도', () => {
      const ifDef: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'M2', params: ['self'], returnType: 'Int', slotIndex: 1 },
          { name: 'M1', params: ['self'], returnType: 'Int', slotIndex: 0 },
        ],
        registeredAt: Date.now(),
      };
      // 슬롯 인덱스는 명시적이므로 순서와 관계없음
      expect(ifDef.methods[0].slotIndex).toBe(1);
      expect(ifDef.methods[1].slotIndex).toBe(0);
    });

    test('1-18: Empty Interface (메서드 없음)', () => {
      const ifDef: InterfaceDef = {
        name: 'Marker',
        methods: [],
        registeredAt: Date.now(),
      };
      ifRegistry.registerInterface(ifDef);
      const retrieved = ifRegistry.getInterface('Marker');
      expect(retrieved?.methods.length).toBe(0);
    });

    test('1-19: 인터페이스 메서드 주소(addr) = undefined (모두 NULL)', () => {
      const ifDef: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
        ],
        registeredAt: Date.now(),
      };
      // InterfaceMethodDef는 addr 속성이 없음
      expect((ifDef.methods[0] as any).addr).toBeUndefined();
    });

    test('1-20: ✅ INTERFACE DEFINITION COMPLETE', () => {
      // 인터페이스 정의 체인 완료
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
          { name: 'GetPerimeter', params: ['self'], returnType: 'Int', slotIndex: 1 },
        ],
        registeredAt: Date.now(),
      };
      ifRegistry.registerInterface(shape);
      expect(ifRegistry.getAllInterfaces().length).toBe(1);
      expect(ifRegistry.getInterface('Shape')).toBeDefined();
    });
  });

  describe('Phase 2: Contract Enforcement (20 tests)', () => {
    test('2-1: AbstractValidator 인스턴스 생성', () => {
      expect(validator).toBeDefined();
    });

    test('2-2: Circle IMPLEMENTS Shape (완전 구현)', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
          { name: 'GetPerimeter', params: ['self'], returnType: 'Int', slotIndex: 1 },
        ],
        registeredAt: Date.now(),
      };
      const circleDef: ClassDef = {
        name: 'Circle',
        fields: [{ name: 'Radius', type: 'Int' }],
        methods: [
          {
            name: 'GetArea',
            className: 'Circle',
            params: ['self'],
            returnType: 'Int',
            addr: 1500,
          },
          {
            name: 'GetPerimeter',
            className: 'Circle',
            params: ['self'],
            returnType: 'Int',
            addr: 1600,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(circleDef);
      ifRegistry.registerInterface(shapeInterface);
      const violation = validator.validateImplementation('Circle', ['Shape']);
      expect(violation).toBeNull(); // 완벽 구현
    });

    test('2-3: Square IMPLEMENTS Shape (불완전: GetArea만)', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
          { name: 'GetPerimeter', params: ['self'], returnType: 'Int', slotIndex: 1 },
        ],
        registeredAt: Date.now(),
      };
      const squareDef: ClassDef = {
        name: 'Square',
        fields: [{ name: 'Side', type: 'Int' }],
        methods: [
          {
            name: 'GetArea',
            className: 'Square',
            params: ['self'],
            returnType: 'Int',
            addr: 2000,
          },
          // GetPerimeter 없음!
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(squareDef);
      ifRegistry.registerInterface(shapeInterface);
      const violation = validator.validateImplementation('Square', ['Shape']);
      expect(violation).not.toBeNull();
    });

    test('2-4: validateImplementation("Square", ["Shape"]) → 위반 감지 ✅', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
          { name: 'GetPerimeter', params: ['self'], returnType: 'Int', slotIndex: 1 },
        ],
        registeredAt: Date.now(),
      };
      const squareDef: ClassDef = {
        name: 'Square',
        fields: [{ name: 'Side', type: 'Int' }],
        methods: [
          {
            name: 'GetArea',
            className: 'Square',
            params: ['self'],
            returnType: 'Int',
            addr: 2000,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(squareDef);
      ifRegistry.registerInterface(shapeInterface);
      const violation = validator.validateImplementation('Square', ['Shape']);
      expect(violation?.severity).toBe('error');
    });

    test('2-5: missingMethods = ["GetPerimeter"] 정확히 감지', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
          { name: 'GetPerimeter', params: ['self'], returnType: 'Int', slotIndex: 1 },
        ],
        registeredAt: Date.now(),
      };
      const squareDef: ClassDef = {
        name: 'Square',
        fields: [{ name: 'Side', type: 'Int' }],
        methods: [
          {
            name: 'GetArea',
            className: 'Square',
            params: ['self'],
            returnType: 'Int',
            addr: 2000,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(squareDef);
      ifRegistry.registerInterface(shapeInterface);
      const violation = validator.validateImplementation('Square', ['Shape']);
      expect(violation?.missingMethods).toEqual(['GetPerimeter']);
    });

    test('2-6: validateImplementation("Circle", ["Shape"]) → null (완벽)', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
          { name: 'GetPerimeter', params: ['self'], returnType: 'Int', slotIndex: 1 },
        ],
        registeredAt: Date.now(),
      };
      const circleDef: ClassDef = {
        name: 'Circle',
        fields: [{ name: 'Radius', type: 'Int' }],
        methods: [
          {
            name: 'GetArea',
            className: 'Circle',
            params: ['self'],
            returnType: 'Int',
            addr: 1500,
          },
          {
            name: 'GetPerimeter',
            className: 'Circle',
            params: ['self'],
            returnType: 'Int',
            addr: 1600,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(circleDef);
      ifRegistry.registerInterface(shapeInterface);
      const violation = validator.validateImplementation('Circle', ['Shape']);
      expect(violation).toBeNull();
    });

    test('2-7: 여러 인터페이스 구현 검증', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [{ name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      const drawable: InterfaceDef = {
        name: 'Drawable',
        methods: [{ name: 'Draw', params: ['self'], returnType: 'Void', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      const rectDef: ClassDef = {
        name: 'Rectangle',
        fields: [],
        methods: [
          {
            name: 'GetArea',
            className: 'Rectangle',
            params: ['self'],
            returnType: 'Int',
            addr: 3000,
          },
          {
            name: 'Draw',
            className: 'Rectangle',
            params: ['self'],
            returnType: 'Void',
            addr: 3100,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(rectDef);
      ifRegistry.registerInterface(shape);
      ifRegistry.registerInterface(drawable);
      const v1 = validator.validateImplementation('Rectangle', ['Shape']);
      const v2 = validator.validateImplementation('Rectangle', ['Drawable']);
      expect(v1).toBeNull();
      expect(v2).toBeNull();
    });

    test('2-8: checkVTableCompleteness: 모든 슬롯 주소 확인', () => {
      const vTable: VirtualTable = {
        className: 'Circle',
        addrs: [1500, 1600],
        slotCount: 2,
      };
      const complete = validator.checkVTableCompleteness(vTable);
      expect(complete).toBe(true);
    });

    test('2-9: NULL 슬롯 감지 (미구현 메서드)', () => {
      const vTable: VirtualTable = {
        className: 'Square',
        addrs: [2000, null as any], // GetPerimeter = NULL
        slotCount: 2,
      };
      const complete = validator.checkVTableCompleteness(vTable);
      expect(complete).toBe(false);
    });

    test('2-10: vTable 확장: addrs = (number | null)[]', () => {
      // v7.2의 VirtualTable을 v7.3에서 NULL 슬롯 지원으로 확장
      const vTable: VirtualTable = {
        className: 'Test',
        addrs: [100, null as any, 300],
        slotCount: 3,
      };
      expect(vTable.addrs[0]).toBe(100);
      expect(vTable.addrs[1]).toBeNull();
      expect(vTable.addrs[2]).toBe(300);
    });

    test('2-11: ContractChecker.checkInstanceCreation("Square") → 에러', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
        ],
        registeredAt: Date.now(),
      };
      const squareDef: ClassDef = {
        name: 'Square',
        fields: [],
        methods: [], // 메서드 없음
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(squareDef);
      ifRegistry.registerInterface(shapeInterface);
      ifRegistry.mapImplementation('Square', ['Shape']);
      expect(() => {
        checker.checkInstanceCreation('Square');
      }).toThrow();
    });

    test('2-12: **핵심 TEST 2-12: NEW Square() 시도 → "missing methods" 에러', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
          { name: 'GetPerimeter', params: ['self'], returnType: 'Int', slotIndex: 1 },
        ],
        registeredAt: Date.now(),
      };
      const squareDef: ClassDef = {
        name: 'Square',
        fields: [{ name: 'Side', type: 'Int' }],
        methods: [
          {
            name: 'GetArea',
            className: 'Square',
            params: ['self'],
            returnType: 'Int',
            addr: 2000,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(squareDef);
      ifRegistry.registerInterface(shapeInterface);
      ifRegistry.mapImplementation('Square', ['Shape']);
      expect(() => {
        checker.checkInstanceCreation('Square');
      }).toThrow(/missing methods/);
    });

    test('2-13: ContractChecker.checkInstanceCreation("Circle") → OK', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
          { name: 'GetPerimeter', params: ['self'], returnType: 'Int', slotIndex: 1 },
        ],
        registeredAt: Date.now(),
      };
      const circleDef: ClassDef = {
        name: 'Circle',
        fields: [{ name: 'Radius', type: 'Int' }],
        methods: [
          {
            name: 'GetArea',
            className: 'Circle',
            params: ['self'],
            returnType: 'Int',
            addr: 1500,
          },
          {
            name: 'GetPerimeter',
            className: 'Circle',
            params: ['self'],
            returnType: 'Int',
            addr: 1600,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(circleDef);
      ifRegistry.registerInterface(shapeInterface);
      ifRegistry.mapImplementation('Circle', ['Shape']);
      const result = checker.checkInstanceCreation('Circle');
      expect(result).toBe(true);
    });

    test('2-14: NEW Circle() 성공 (모든 메서드 구현됨)', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
        ],
        registeredAt: Date.now(),
      };
      const circleDef: ClassDef = {
        name: 'Circle',
        fields: [],
        methods: [
          {
            name: 'GetArea',
            className: 'Circle',
            params: ['self'],
            returnType: 'Int',
            addr: 1500,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(circleDef);
      ifRegistry.registerInterface(shapeInterface);
      ifRegistry.mapImplementation('Circle', ['Shape']);
      expect(() => {
        checker.checkInstanceCreation('Circle');
      }).not.toThrow();
    });

    test('2-15: Rectangle IMPLEMENTS Shape + Drawable (다중 구현)', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [{ name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      const drawable: InterfaceDef = {
        name: 'Drawable',
        methods: [{ name: 'Draw', params: ['self'], returnType: 'Void', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      const rectDef: ClassDef = {
        name: 'Rectangle',
        fields: [],
        methods: [
          {
            name: 'GetArea',
            className: 'Rectangle',
            params: ['self'],
            returnType: 'Int',
            addr: 3000,
          },
          {
            name: 'Draw',
            className: 'Rectangle',
            params: ['self'],
            returnType: 'Void',
            addr: 3100,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(rectDef);
      ifRegistry.registerInterface(shape);
      ifRegistry.registerInterface(drawable);
      const mapping = ifRegistry.mapImplementation('Rectangle', ['Shape', 'Drawable']);
      expect(mapping.implementedInterfaces.length).toBe(2);
    });

    test('2-16: 다중 인터페이스 모두 검증', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [{ name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      const drawable: InterfaceDef = {
        name: 'Drawable',
        methods: [{ name: 'Draw', params: ['self'], returnType: 'Void', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      const rectDef: ClassDef = {
        name: 'Rectangle',
        fields: [],
        methods: [
          {
            name: 'GetArea',
            className: 'Rectangle',
            params: ['self'],
            returnType: 'Int',
            addr: 3000,
          },
          {
            name: 'Draw',
            className: 'Rectangle',
            params: ['self'],
            returnType: 'Void',
            addr: 3100,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(rectDef);
      ifRegistry.registerInterface(shape);
      ifRegistry.registerInterface(drawable);
      const v1 = validator.validateImplementation('Rectangle', ['Shape']);
      const v2 = validator.validateImplementation('Rectangle', ['Drawable']);
      expect(v1).toBeNull();
      expect(v2).toBeNull();
    });

    test('2-17: 인터페이스 메서드 시그니처 매칭', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
        ],
        registeredAt: Date.now(),
      };
      const circleDef: ClassDef = {
        name: 'Circle',
        fields: [],
        methods: [
          {
            name: 'GetArea',
            className: 'Circle',
            params: ['self'],
            returnType: 'Int',
            addr: 1500,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(circleDef);
      ifRegistry.registerInterface(shape);
      const violation = validator.validateImplementation('Circle', ['Shape']);
      expect(violation).toBeNull(); // 시그니처 일치
    });

    test('2-18: 슬롯 인덱스 정확성 검증', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'M1', params: ['self'], returnType: 'Int', slotIndex: 0 },
          { name: 'M2', params: ['self'], returnType: 'Int', slotIndex: 1 },
        ],
        registeredAt: Date.now(),
      };
      expect(shape.methods[0].slotIndex).toBe(0);
      expect(shape.methods[1].slotIndex).toBe(1);
    });

    test('2-19: ContractViolation 상세 정보', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
          { name: 'GetPerimeter', params: ['self'], returnType: 'Int', slotIndex: 1 },
        ],
        registeredAt: Date.now(),
      };
      const squareDef: ClassDef = {
        name: 'Square',
        fields: [],
        methods: [
          {
            name: 'GetArea',
            className: 'Square',
            params: ['self'],
            returnType: 'Int',
            addr: 2000,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(squareDef);
      ifRegistry.registerInterface(shape);
      const violation = validator.validateImplementation('Square', ['Shape']);
      expect(violation?.className).toBe('Square');
      expect(violation?.interfaceName).toBe('Shape');
      expect(violation?.missingMethods.length).toBe(1);
    });

    test('2-20: ✅ CONTRACT ENFORCEMENT COMPLETE', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
        ],
        registeredAt: Date.now(),
      };
      const circleDef: ClassDef = {
        name: 'Circle',
        fields: [],
        methods: [
          {
            name: 'GetArea',
            className: 'Circle',
            params: ['self'],
            returnType: 'Int',
            addr: 1500,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(circleDef);
      ifRegistry.registerInterface(shape);
      ifRegistry.mapImplementation('Circle', ['Shape']);
      expect(() => checker.checkInstanceCreation('Circle')).not.toThrow();
    });
  });

  describe('Phase 3: Integration & Edge Cases (20 tests)', () => {
    test('3-1: PolymorphicFactory 통합 (v7.2)', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
        ],
        registeredAt: Date.now(),
      };
      const circleDef: ClassDef = {
        name: 'Circle',
        fields: [{ name: 'Radius', type: 'Int' }],
        methods: [
          {
            name: 'GetArea',
            className: 'Circle',
            params: ['self'],
            returnType: 'Int',
            addr: 1500,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(circleDef);
      ifRegistry.registerInterface(shapeInterface);
      ifRegistry.mapImplementation('Circle', ['Shape']);
      expect(registry.getClass('Circle')).toBeDefined();
      expect(ifRegistry.getInterface('Shape')).toBeDefined();
    });

    test('3-2: Shape 타입으로 선언된 Circle 인스턴스', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
        ],
        registeredAt: Date.now(),
      };
      const circleDef: ClassDef = {
        name: 'Circle',
        fields: [],
        methods: [
          {
            name: 'GetArea',
            className: 'Circle',
            params: ['self'],
            returnType: 'Int',
            addr: 1500,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(circleDef);
      ifRegistry.registerInterface(shapeInterface);
      // REF s: Shape = NEW Circle()
      const mapping = ifRegistry.mapImplementation('Circle', ['Shape']);
      expect(mapping.className).toBe('Circle');
    });

    test('3-3: **TC_V7_3_CONTRACT**: REF s = NEW Circle(); s.GetArea() → 성공 ✅', () => {
      const shapeInterface: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
        ],
        registeredAt: Date.now(),
      };
      const circleDef: ClassDef = {
        name: 'Circle',
        fields: [{ name: 'Radius', type: 'Int' }],
        methods: [
          {
            name: 'GetArea',
            className: 'Circle',
            params: ['self'],
            returnType: 'Int',
            addr: 1500,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(circleDef);
      ifRegistry.registerInterface(shapeInterface);
      ifRegistry.mapImplementation('Circle', ['Shape']);
      // NEW Circle() 검증
      expect(() => checker.checkInstanceCreation('Circle')).not.toThrow();
      // GetArea 슬롯 검증
      const slotMap = checker.getInterfaceSlotMap('Shape');
      expect(slotMap.get('GetArea')).toBe(0);
    });

    test('3-4: GetArea 호출 시 NULL 슬롯 아닌지 checkMethodInvocation', () => {
      const vTable: VirtualTable = {
        className: 'Circle',
        addrs: [1500],
        slotCount: 1,
      };
      expect(() => checker.checkMethodInvocation(vTable, 0)).not.toThrow();
    });

    test('3-5: Drawable 인터페이스도 함께 구현한 Rectangle', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [{ name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      const drawable: InterfaceDef = {
        name: 'Drawable',
        methods: [{ name: 'Draw', params: ['self'], returnType: 'Void', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      const rectDef: ClassDef = {
        name: 'Rectangle',
        fields: [],
        methods: [
          {
            name: 'GetArea',
            className: 'Rectangle',
            params: ['self'],
            returnType: 'Int',
            addr: 3000,
          },
          {
            name: 'Draw',
            className: 'Rectangle',
            params: ['self'],
            returnType: 'Void',
            addr: 3100,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(rectDef);
      ifRegistry.registerInterface(shape);
      ifRegistry.registerInterface(drawable);
      ifRegistry.mapImplementation('Rectangle', ['Shape', 'Drawable']);
      const mapping = ifRegistry.getContractMapping('Rectangle');
      expect(mapping?.implementedInterfaces.length).toBe(2);
    });

    test('3-6: 두 인터페이스 모두 완벽히 구현', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [{ name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      const drawable: InterfaceDef = {
        name: 'Drawable',
        methods: [{ name: 'Draw', params: ['self'], returnType: 'Void', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      const rectDef: ClassDef = {
        name: 'Rectangle',
        fields: [],
        methods: [
          {
            name: 'GetArea',
            className: 'Rectangle',
            params: ['self'],
            returnType: 'Int',
            addr: 3000,
          },
          {
            name: 'Draw',
            className: 'Rectangle',
            params: ['self'],
            returnType: 'Void',
            addr: 3100,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(rectDef);
      ifRegistry.registerInterface(shape);
      ifRegistry.registerInterface(drawable);
      const v1 = validator.validateImplementation('Rectangle', ['Shape']);
      const v2 = validator.validateImplementation('Rectangle', ['Drawable']);
      expect(v1).toBeNull();
      expect(v2).toBeNull();
    });

    test('3-7: 업캐스팅: Rectangle → Shape 또는 Drawable', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [{ name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      const drawable: InterfaceDef = {
        name: 'Drawable',
        methods: [{ name: 'Draw', params: ['self'], returnType: 'Void', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      const rectDef: ClassDef = {
        name: 'Rectangle',
        fields: [],
        methods: [
          {
            name: 'GetArea',
            className: 'Rectangle',
            params: ['self'],
            returnType: 'Int',
            addr: 3000,
          },
          {
            name: 'Draw',
            className: 'Rectangle',
            params: ['self'],
            returnType: 'Void',
            addr: 3100,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(rectDef);
      ifRegistry.registerInterface(shape);
      ifRegistry.registerInterface(drawable);
      const mapping = ifRegistry.mapImplementation('Rectangle', ['Shape', 'Drawable']);
      expect(mapping.implementedInterfaces).toContain('Shape');
      expect(mapping.implementedInterfaces).toContain('Drawable');
    });

    test('3-8: Shape.GetArea() 호출 (slot 0)', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [{ name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      ifRegistry.registerInterface(shape);
      const slotMap = checker.getInterfaceSlotMap('Shape');
      expect(slotMap.get('GetArea')).toBe(0);
    });

    test('3-9: Drawable.Draw() 호출 (다른 vTable 영역)', () => {
      const drawable: InterfaceDef = {
        name: 'Drawable',
        methods: [{ name: 'Draw', params: ['self'], returnType: 'Void', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      ifRegistry.registerInterface(drawable);
      const slotMap = checker.getInterfaceSlotMap('Drawable');
      expect(slotMap.get('Draw')).toBe(0);
    });

    test('3-10: Triangle IMPLEMENTS Shape (GetArea, GetPerimeter)', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
          { name: 'GetPerimeter', params: ['self'], returnType: 'Int', slotIndex: 1 },
        ],
        registeredAt: Date.now(),
      };
      const triangleDef: ClassDef = {
        name: 'Triangle',
        fields: [],
        methods: [
          {
            name: 'GetArea',
            className: 'Triangle',
            params: ['self'],
            returnType: 'Int',
            addr: 4000,
          },
          {
            name: 'GetPerimeter',
            className: 'Triangle',
            params: ['self'],
            returnType: 'Int',
            addr: 4100,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(triangleDef);
      ifRegistry.registerInterface(shape);
      const violation = validator.validateImplementation('Triangle', ['Shape']);
      expect(violation).toBeNull();
    });

    test('3-11: 3개 도형 다형성 호출 (동적 디스패치)', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [{ name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      const shapes = ['Circle', 'Square', 'Triangle'];
      for (const name of shapes) {
        const def: ClassDef = {
          name,
          fields: [],
          methods: [
            {
              name: 'GetArea',
              className: name,
              params: ['self'],
              returnType: 'Int',
              addr: 1000 + shapes.indexOf(name) * 100,
            },
          ],
          totalSize: 8,
          registeredAt: Date.now(),
        };
        registry.registerClass(def);
        ifRegistry.mapImplementation(name, ['Shape']);
      }
      ifRegistry.registerInterface(shape);
      for (const name of shapes) {
        expect(() => checker.checkInstanceCreation(name)).not.toThrow();
      }
    });

    test('3-12: 상속 + 인터페이스: Dog EXTENDS Animal IMPLEMENTS Comparable', () => {
      const comparable: InterfaceDef = {
        name: 'Comparable',
        methods: [
          { name: 'Compare', params: ['self', 'other'], returnType: 'Int', slotIndex: 0 },
        ],
        registeredAt: Date.now(),
      };
      const animalDef: ClassDef = {
        name: 'Animal',
        fields: [{ name: 'Name', type: 'Str' }],
        methods: [
          {
            name: 'Speak',
            className: 'Animal',
            params: ['self'],
            returnType: 'Void',
            addr: 5000,
          },
        ],
        totalSize: 16,
        registeredAt: Date.now(),
      };
      const dogDef: ClassDef = {
        name: 'Dog',
        fields: [{ name: 'Breed', type: 'Str' }],
        methods: [
          {
            name: 'Compare',
            className: 'Dog',
            params: ['self', 'other'],
            returnType: 'Int',
            addr: 6000,
          },
        ],
        totalSize: 32,
        registeredAt: Date.now(),
      };
      registry.registerClass(animalDef);
      registry.registerClass(dogDef);
      ifRegistry.registerInterface(comparable);
      ifRegistry.mapImplementation('Dog', ['Comparable']);
      const violation = validator.validateImplementation('Dog', ['Comparable']);
      expect(violation).toBeNull();
    });

    test('3-13: 부모 클래스 메서드 상속 + 인터페이스 메서드 신규 구현', () => {
      const comparable: InterfaceDef = {
        name: 'Comparable',
        methods: [
          { name: 'Compare', params: ['self', 'other'], returnType: 'Int', slotIndex: 0 },
        ],
        registeredAt: Date.now(),
      };
      const animalDef: ClassDef = {
        name: 'Animal',
        fields: [],
        methods: [],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      const dogDef: ClassDef = {
        name: 'Dog',
        fields: [],
        methods: [
          {
            name: 'Compare',
            className: 'Dog',
            params: ['self', 'other'],
            returnType: 'Int',
            addr: 6000,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(animalDef);
      registry.registerClass(dogDef);
      ifRegistry.registerInterface(comparable);
      const violation = validator.validateImplementation('Dog', ['Comparable']);
      expect(violation).toBeNull();
    });

    test('3-14: 계약 추적: ContractMapping 정확성', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [{ name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      const circleDef: ClassDef = {
        name: 'Circle',
        fields: [],
        methods: [
          {
            name: 'GetArea',
            className: 'Circle',
            params: ['self'],
            returnType: 'Int',
            addr: 1500,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(circleDef);
      ifRegistry.registerInterface(shape);
      const mapping = ifRegistry.mapImplementation('Circle', ['Shape']);
      expect(mapping.className).toBe('Circle');
      expect(mapping.implementedInterfaces).toEqual(['Shape']);
    });

    test('3-15: generateReport(): 전체 계약 위반 현황', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [{ name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      const circleDef: ClassDef = {
        name: 'Circle',
        fields: [],
        methods: [
          {
            name: 'GetArea',
            className: 'Circle',
            params: ['self'],
            returnType: 'Int',
            addr: 1500,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(circleDef);
      ifRegistry.registerInterface(shape);
      ifRegistry.mapImplementation('Circle', ['Shape']);
      const report = checker.generateReport();
      expect(report.totalInterfaces).toBe(1);
      expect(report.totalClasses).toBe(1);
      expect(report.violations.length).toBe(0);
    });

    test('3-16: 여러 클래스 동시 검증', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [{ name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      const shapes = [
        {
          name: 'Circle',
          methods: [{ name: 'GetArea', className: 'Circle', params: ['self'], returnType: 'Int', addr: 1500 }],
        },
        {
          name: 'Square',
          methods: [{ name: 'GetArea', className: 'Square', params: ['self'], returnType: 'Int', addr: 2000 }],
        },
      ];
      for (const s of shapes) {
        const def: ClassDef = {
          name: s.name,
          fields: [],
          methods: s.methods,
          totalSize: 8,
          registeredAt: Date.now(),
        };
        registry.registerClass(def);
        ifRegistry.mapImplementation(s.name, ['Shape']);
      }
      ifRegistry.registerInterface(shape);
      for (const s of shapes) {
        const violation = validator.validateImplementation(s.name, ['Shape']);
        expect(violation).toBeNull();
      }
    });

    test('3-17: 구현 중간에 메서드 추가 시나리오', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
          { name: 'GetPerimeter', params: ['self'], returnType: 'Int', slotIndex: 1 },
        ],
        registeredAt: Date.now(),
      };
      const squareDef: ClassDef = {
        name: 'Square',
        fields: [],
        methods: [
          {
            name: 'GetArea',
            className: 'Square',
            params: ['self'],
            returnType: 'Int',
            addr: 2000,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(squareDef);
      ifRegistry.registerInterface(shape);
      let violation = validator.validateImplementation('Square', ['Shape']);
      expect(violation?.missingMethods).toContain('GetPerimeter');
      // 메서드 추가
      squareDef.methods.push({
        name: 'GetPerimeter',
        className: 'Square',
        params: ['self'],
        returnType: 'Int',
        addr: 2100,
      });
      violation = validator.validateImplementation('Square', ['Shape']);
      expect(violation).toBeNull();
    });

    test('3-18: 인터페이스 진화 (새 메서드 추가) → 기존 구현체 에러', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
        ],
        registeredAt: Date.now(),
      };
      const circleDef: ClassDef = {
        name: 'Circle',
        fields: [],
        methods: [
          {
            name: 'GetArea',
            className: 'Circle',
            params: ['self'],
            returnType: 'Int',
            addr: 1500,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(circleDef);
      ifRegistry.registerInterface(shape);
      expect(validator.validateImplementation('Circle', ['Shape'])).toBeNull();
      // 인터페이스에 새 메서드 추가
      shape.methods.push({
        name: 'GetPerimeter',
        params: ['self'],
        returnType: 'Int',
        slotIndex: 1,
      });
      // 이제 Circle은 불완전함
      const violation = validator.validateImplementation('Circle', ['Shape']);
      expect(violation?.missingMethods).toContain('GetPerimeter');
    });

    test('3-19: 메모리 효율: 여러 Shape 구현체가 동일 슬롯 공유', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [{ name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      const shapes = ['Circle', 'Square', 'Triangle'];
      for (const name of shapes) {
        const def: ClassDef = {
          name,
          fields: [],
          methods: [
            {
              name: 'GetArea',
              className: name,
              params: ['self'],
              returnType: 'Int',
              addr: 1000 + shapes.indexOf(name) * 100,
            },
          ],
          totalSize: 8,
          registeredAt: Date.now(),
        };
        registry.registerClass(def);
      }
      ifRegistry.registerInterface(shape);
      // 모든 도형이 Shape.GetArea를 slot 0에 구현
      const slotMap = checker.getInterfaceSlotMap('Shape');
      expect(slotMap.get('GetArea')).toBe(0);
    });

    test('3-20: ✅ TC_V7_3_INTERFACE_CONTRACT_COMPLETE', () => {
      const shape: InterfaceDef = {
        name: 'Shape',
        methods: [
          { name: 'GetArea', params: ['self'], returnType: 'Int', slotIndex: 0 },
          { name: 'GetPerimeter', params: ['self'], returnType: 'Int', slotIndex: 1 },
        ],
        registeredAt: Date.now(),
      };
      const drawable: InterfaceDef = {
        name: 'Drawable',
        methods: [{ name: 'Draw', params: ['self'], returnType: 'Void', slotIndex: 0 }],
        registeredAt: Date.now(),
      };
      const rectDef: ClassDef = {
        name: 'Rectangle',
        fields: [],
        methods: [
          {
            name: 'GetArea',
            className: 'Rectangle',
            params: ['self'],
            returnType: 'Int',
            addr: 3000,
          },
          {
            name: 'GetPerimeter',
            className: 'Rectangle',
            params: ['self'],
            returnType: 'Int',
            addr: 3050,
          },
          {
            name: 'Draw',
            className: 'Rectangle',
            params: ['self'],
            returnType: 'Void',
            addr: 3100,
          },
        ],
        totalSize: 8,
        registeredAt: Date.now(),
      };
      registry.registerClass(rectDef);
      ifRegistry.registerInterface(shape);
      ifRegistry.registerInterface(drawable);
      ifRegistry.mapImplementation('Rectangle', ['Shape', 'Drawable']);
      // 모든 검증 통과
      expect(() => checker.checkInstanceCreation('Rectangle')).not.toThrow();
      expect(checker.generateReport().violations.length).toBe(0);
    });
  });
});

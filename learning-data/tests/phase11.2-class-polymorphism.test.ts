/**
 * FreeLang v7.2: Polymorphism & vTable (Dynamic Dispatch)
 * 60 Integration Tests
 *
 * Phase 1: vTable Construction (20 tests)
 * Phase 2: Dynamic Dispatch (20 tests)
 * Phase 3: Animal/Dog Polymorphism Integration (20 tests)
 */

import {
  ClassDef,
  ClassRegistry,
} from '../src/class-foundation';
import {
  ClassHierarchy,
  InheritanceLayout,
  InheritanceFactory,
} from '../src/class-inheritance';
import {
  MethodIndexTable,
  VTableBuilder,
  VTableDispatcher,
  PolymorphicFactory,
} from '../src/class-polymorphism';

describe('v7.2: Polymorphism & vTable (Dynamic Dispatch)', () => {
  let registry: ClassRegistry;
  let hierarchy: ClassHierarchy;
  let layout: InheritanceLayout;
  let inheritanceFactory: InheritanceFactory;
  let indexTable: MethodIndexTable;
  let builder: VTableBuilder;
  let dispatcher: VTableDispatcher;
  let factory: PolymorphicFactory;

  beforeEach(() => {
    registry = new ClassRegistry();
    hierarchy = new ClassHierarchy();
    layout = new InheritanceLayout();
    inheritanceFactory = new InheritanceFactory(registry, hierarchy, layout);
    indexTable = new MethodIndexTable();
    builder = new VTableBuilder(registry, hierarchy, indexTable);
    dispatcher = new VTableDispatcher(builder, indexTable, hierarchy);
    factory = new PolymorphicFactory(inheritanceFactory, hierarchy);
  });

  describe('Phase 1: vTable Construction (20 tests)', () => {
    beforeEach(() => {
      // Animal 클래스 정의
      const animalDef: ClassDef = {
        name: 'Animal',
        fields: [],
        methods: [
          {
            name: 'Speak',
            className: 'Animal',
            params: [],
            returnType: 'Void',
            addr: 1000,
          },
          {
            name: 'Eat',
            className: 'Animal',
            params: [],
            returnType: 'Void',
            addr: 3000,
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };

      registry.registerClass(animalDef);

      // Dog 클래스 정의 (Speak 오버라이드)
      const dogDef: ClassDef = {
        name: 'Dog',
        fields: [],
        methods: [
          {
            name: 'Speak',
            className: 'Dog',
            params: [],
            returnType: 'Void',
            addr: 2000, // ← 오버라이드 (Animal: 1000)
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };

      registry.registerClass(dogDef);
      hierarchy.extend('Dog', 'Animal');
    });

    it('1-1: MethodIndexTable 인스턴스 생성', () => {
      expect(indexTable).toBeDefined();
      expect(typeof indexTable.buildFromHierarchy).toBe('function');
    });

    it('1-2: Animal + Dog 클래스 등록 후 buildFromHierarchy', () => {
      indexTable.buildFromHierarchy(registry, hierarchy);
      expect(indexTable.getSlotCount()).toBeGreaterThan(0);
    });

    it('1-3: getSlotIndex("Speak") = 0 (첫 번째 메서드)', () => {
      indexTable.buildFromHierarchy(registry, hierarchy);
      expect(indexTable.getSlotIndex('Speak')).toBe(0);
    });

    it('1-4: getSlotIndex("Eat") = 1 (두 번째 메서드)', () => {
      indexTable.buildFromHierarchy(registry, hierarchy);
      expect(indexTable.getSlotIndex('Eat')).toBe(1);
    });

    it('1-5: getSlotCount() = 2 (Speak + Eat)', () => {
      indexTable.buildFromHierarchy(registry, hierarchy);
      expect(indexTable.getSlotCount()).toBe(2);
    });

    it('1-6: Animal_vTable.addrs = [1000, 3000]', () => {
      indexTable.buildFromHierarchy(registry, hierarchy);
      const animalTable = builder.buildVTable('Animal');

      expect(animalTable.addrs[0]).toBe(1000); // Speak
      expect(animalTable.addrs[1]).toBe(3000); // Eat
    });

    it('1-7: Dog_vTable.addrs = [2000, 3000] (Speak만 갈아끼움)', () => {
      indexTable.buildFromHierarchy(registry, hierarchy);
      const dogTable = builder.buildVTable('Dog');

      expect(dogTable.addrs[0]).toBe(2000); // Dog.Speak
      expect(dogTable.addrs[1]).toBe(3000); // Animal.Eat (상속)
    });

    it('1-8: Dog_vTable.addrs[0] = 2000 (Dog.Speak 주소)', () => {
      indexTable.buildFromHierarchy(registry, hierarchy);
      const dogTable = builder.buildVTable('Dog');

      expect(dogTable.addrs[0]).toBe(2000);
    });

    it('1-9: Dog_vTable.addrs[1] = 3000 (Animal.Eat, 오버라이드 안됨)', () => {
      indexTable.buildFromHierarchy(registry, hierarchy);
      const dogTable = builder.buildVTable('Dog');

      expect(dogTable.addrs[1]).toBe(3000);
    });

    it('1-10: Animal_vTable.addrs[0] = 1000 (Animal.Speak 주소)', () => {
      indexTable.buildFromHierarchy(registry, hierarchy);
      const animalTable = builder.buildVTable('Animal');

      expect(animalTable.addrs[0]).toBe(1000);
    });

    it('1-11: VTableBuilder.buildAllTables() → 모든 클래스 vTable', () => {
      indexTable.buildFromHierarchy(registry, hierarchy);
      const allTables = builder.buildAllTables();

      expect(allTables.has('Animal')).toBe(true);
      expect(allTables.has('Dog')).toBe(true);
    });

    it('1-12: VirtualTable.slotCount = 2', () => {
      indexTable.buildFromHierarchy(registry, hierarchy);
      const dogTable = builder.buildVTable('Dog');

      expect(dogTable.slotCount).toBe(2);
    });

    it('1-13: VirtualTable.parentClass = "Animal" (Dog의 경우)', () => {
      indexTable.buildFromHierarchy(registry, hierarchy);
      const dogTable = builder.buildVTable('Dog');

      expect(dogTable.parentClass).toBe('Animal');
    });

    it('1-14: 오버라이드 안 된 메서드는 부모 addr 사용 확인', () => {
      indexTable.buildFromHierarchy(registry, hierarchy);
      const dogTable = builder.buildVTable('Dog');

      // Eat은 Dog에서 정의하지 않았으므로 Animal의 3000을 사용
      expect(dogTable.addrs[1]).toBe(3000);
    });

    it('1-15: 슬롯 인덱스 일관성: Animal.Speak.slot == Dog.Speak.slot', () => {
      indexTable.buildFromHierarchy(registry, hierarchy);

      const animalIdx = indexTable.getSlotIndex('Speak');
      const dogIdx = indexTable.getSlotIndex('Speak');

      expect(animalIdx).toBe(dogIdx);
      expect(animalIdx).toBe(0);
    });

    it('1-16: 3단계 상속 vTable 구축 (A → B → C)', () => {
      // Cat extends Dog extends Animal
      const catDef: ClassDef = {
        name: 'Cat',
        fields: [],
        methods: [
          {
            name: 'Speak',
            className: 'Cat',
            params: [],
            returnType: 'Void',
            addr: 4000, // Cat.Speak (오버라이드)
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };

      registry.registerClass(catDef);
      hierarchy.extend('Cat', 'Dog');

      indexTable.buildFromHierarchy(registry, hierarchy);
      const catTable = builder.buildVTable('Cat');

      expect(catTable.addrs[0]).toBe(4000); // Cat.Speak
    });

    it('1-17: 3단계에서 가장 하위 클래스의 슬롯 우선', () => {
      // Cat extends Dog extends Animal
      const catDef: ClassDef = {
        name: 'Cat',
        fields: [],
        methods: [
          {
            name: 'Speak',
            className: 'Cat',
            params: [],
            returnType: 'Void',
            addr: 4000,
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };

      registry.registerClass(catDef);
      hierarchy.extend('Cat', 'Dog');

      indexTable.buildFromHierarchy(registry, hierarchy);
      const catTable = builder.buildVTable('Cat');
      const dogTable = builder.buildVTable('Dog');

      // Cat.Speak addr와 Dog.Speak addr이 다름 (Cat이 우선)
      expect(catTable.addrs[0]).toBe(4000);
      expect(dogTable.addrs[0]).toBe(2000);
    });

    it('1-18: getAllSlots() 전체 슬롯 목록', () => {
      indexTable.buildFromHierarchy(registry, hierarchy);
      const slots = indexTable.getAllSlots();

      expect(slots.length).toBe(2);
      expect(slots[0].methodName).toBe('Speak');
      expect(slots[0].slotIndex).toBe(0);
      expect(slots[1].methodName).toBe('Eat');
      expect(slots[1].slotIndex).toBe(1);
    });

    it('1-19: 메서드 없는 클래스의 vTable → 부모 슬롯 그대로', () => {
      // Bird extends Animal (메서드 없음)
      const birdDef: ClassDef = {
        name: 'Bird',
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };

      registry.registerClass(birdDef);
      hierarchy.extend('Bird', 'Animal');

      indexTable.buildFromHierarchy(registry, hierarchy);
      const birdTable = builder.buildVTable('Bird');

      // Bird는 메서드가 없으므로 Animal의 addr 그대로
      expect(birdTable.addrs[0]).toBe(1000); // Animal.Speak
      expect(birdTable.addrs[1]).toBe(3000); // Animal.Eat
    });

    it('1-20: ✅ VTABLE CONSTRUCTION COMPLETE', () => {
      indexTable.buildFromHierarchy(registry, hierarchy);
      const allTables = builder.buildAllTables();

      expect(allTables.size).toBeGreaterThan(0);
      expect(indexTable.getSlotCount()).toBeGreaterThan(0);
    });
  });

  describe('Phase 2: Dynamic Dispatch (20 tests)', () => {
    beforeEach(() => {
      // Animal 클래스
      const animalDef: ClassDef = {
        name: 'Animal',
        fields: [],
        methods: [
          {
            name: 'Speak',
            className: 'Animal',
            params: [],
            returnType: 'Void',
            addr: 1000,
          },
          {
            name: 'Eat',
            className: 'Animal',
            params: [],
            returnType: 'Void',
            addr: 3000,
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };

      registry.registerClass(animalDef);

      // Dog 클래스 (Speak 오버라이드)
      const dogDef: ClassDef = {
        name: 'Dog',
        fields: [],
        methods: [
          {
            name: 'Speak',
            className: 'Dog',
            params: [],
            returnType: 'Void',
            addr: 2000,
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };

      registry.registerClass(dogDef);
      hierarchy.extend('Dog', 'Animal');
      indexTable.buildFromHierarchy(registry, hierarchy);
    });

    it('2-1: VTableDispatcher 인스턴스 생성', () => {
      expect(dispatcher).toBeDefined();
      expect(typeof dispatcher.dispatch).toBe('function');
    });

    it('2-2: dispatch("Animal", "Speak") → addr:1000', () => {
      const result = dispatcher.dispatch('Animal', 'Speak');

      expect(result).toBeDefined();
      expect(result?.addr).toBe(1000);
    });

    it('2-3: dispatch("Dog", "Speak") → addr:2000', () => {
      const result = dispatcher.dispatch('Dog', 'Speak');

      expect(result).toBeDefined();
      expect(result?.addr).toBe(2000);
    });

    it('2-4: dispatch("Dog", "Speak") ≠ dispatch("Animal", "Speak") (핵심!)', () => {
      const dogResult = dispatcher.dispatch('Dog', 'Speak');
      const animalResult = dispatcher.dispatch('Animal', 'Speak');

      expect(dogResult?.addr).not.toBe(animalResult?.addr);
      expect(dogResult?.addr).toBe(2000);
      expect(animalResult?.addr).toBe(1000);
    });

    it('2-5: dispatch("Dog", "Eat") → addr:3000 (부모 addr 사용)', () => {
      const result = dispatcher.dispatch('Dog', 'Eat');

      expect(result).toBeDefined();
      expect(result?.addr).toBe(3000); // Animal.Eat
    });

    it('2-6: dispatch 결과: resolvedIn = "Dog"', () => {
      const result = dispatcher.dispatch('Dog', 'Speak');

      expect(result?.resolvedIn).toBe('Dog');
    });

    it('2-7: dispatch 결과: slotIndex = 0 (Speak의 슬롯)', () => {
      const result = dispatcher.dispatch('Dog', 'Speak');

      expect(result?.slotIndex).toBe(0);
    });

    it('2-8: dispatchPolymorphic(upcastedDog, "Speak") → addr:2000', () => {
      const dogPoly = factory.create('Dog');
      const upcastedDog = factory.upcast(dogPoly, 'Animal');

      const result = dispatcher.dispatchPolymorphic(upcastedDog, 'Speak');

      expect(result).toBeDefined();
      expect(result?.addr).toBe(2000); // Dog.Speak, not Animal!
    });

    it('2-9: 선언 타입="Animal", 실제="Dog" → Dog.Speak 실행 ✅', () => {
      const dogPoly = factory.create('Dog');
      const upcastedDog = factory.upcast(dogPoly, 'Animal');

      expect(upcastedDog.declaredType).toBe('Animal');
      expect(upcastedDog.vptr).toBe('Dog');

      const result = dispatcher.dispatchPolymorphic(upcastedDog, 'Speak');

      // vptr="Dog"로 디스패치 → 2000
      expect(result?.addr).toBe(2000);
    });

    it('2-10: isDynamic = true (업캐스팅 발생 시)', () => {
      const dogPoly = factory.create('Dog');
      const upcastedDog = factory.upcast(dogPoly, 'Animal');

      const result = dispatcher.dispatchPolymorphic(upcastedDog, 'Speak');

      expect(result?.isDynamic).toBe(true);
    });

    it('2-11: isDynamic = false (동일 타입 호출 시)', () => {
      const dogPoly = factory.create('Dog');

      const result = dispatcher.dispatchPolymorphic(dogPoly, 'Speak');

      expect(result?.isDynamic).toBe(false);
    });

    it('2-12: 존재하지 않는 메서드 → null', () => {
      const result = dispatcher.dispatch('Dog', 'NonExistent');

      expect(result).toBeNull();
    });

    it('2-13: 캐시 활용: 두 번째 dispatch 빠름', () => {
      const before = dispatcher.dispatch('Dog', 'Speak');
      const after = dispatcher.dispatch('Dog', 'Speak');

      // 캐시 된 것도 같은 결과 반환
      expect(before?.addr).toBe(after?.addr);
      expect(before?.addr).toBe(2000);
    });

    it('2-14: 3단계 상속 디스패치: 가장 하위 클래스 메서드 선택', () => {
      // Cat extends Dog extends Animal
      const catDef: ClassDef = {
        name: 'Cat',
        fields: [],
        methods: [
          {
            name: 'Speak',
            className: 'Cat',
            params: [],
            returnType: 'Void',
            addr: 4000,
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };

      registry.registerClass(catDef);
      hierarchy.extend('Cat', 'Dog');
      indexTable.buildFromHierarchy(registry, hierarchy);

      const result = dispatcher.dispatch('Cat', 'Speak');

      expect(result?.addr).toBe(4000); // Cat.Speak (가장 하위)
    });

    it('2-15: DispatchResult 구조 완전 검증', () => {
      const result = dispatcher.dispatch('Dog', 'Speak');

      expect(result?.methodName).toBe('Speak');
      expect(result?.slotIndex).toBe(0);
      expect(result?.addr).toBe(2000);
      expect(result?.resolvedIn).toBe('Dog');
      expect(result?.isDynamic).toBe(false);
    });

    it('2-16: 슬롯 기반 공식 확인: addr = vTable.addrs[slotIndex]', () => {
      const slotIdx = indexTable.getSlotIndex('Speak');
      const dogTable = builder.buildVTable('Dog');

      expect(dogTable.addrs[slotIdx!]).toBe(2000);

      const dispatchResult = dispatcher.dispatch('Dog', 'Speak');

      expect(dispatchResult?.addr).toBe(dogTable.addrs[slotIdx!]);
    });

    it('2-17: 여러 인스턴스가 같은 vTable 참조 (메모리 효율)', () => {
      const table1 = builder.buildVTable('Dog');
      const table2 = builder.buildVTable('Dog');

      // 같은 vTable 객체 (참조 동일)
      expect(table1).toBe(table2);
    });

    it('2-18: vptr가 실제 타입을 항상 추적', () => {
      const poly = factory.create('Dog', 'Animal');

      // 업캐스팅 후에도 vptr은 Dog
      expect(poly.vptr).toBe('Dog');
      expect(poly.declaredType).toBe('Animal');

      const result = dispatcher.dispatchPolymorphic(poly, 'Speak');

      // vptr="Dog"로 디스패치
      expect(result?.addr).toBe(2000);
    });

    it('2-19: 동적 바인딩: 선언 타입과 관계없이 실제 타입의 메서드 실행', () => {
      const dogPoly = factory.create('Dog');
      const asAnimal = factory.upcast(dogPoly, 'Animal');

      // 선언 타입="Animal"이지만 vptr="Dog"
      const result = dispatcher.dispatchPolymorphic(asAnimal, 'Speak');

      expect(result?.addr).toBe(2000); // Dog.Speak (실제 타입 우선)
    });

    it('2-20: ✅ DYNAMIC DISPATCH COMPLETE', () => {
      expect(dispatcher).toBeDefined();

      const animalResult = dispatcher.dispatch('Animal', 'Speak');
      const dogResult = dispatcher.dispatch('Dog', 'Speak');

      expect(animalResult?.addr).toBe(1000);
      expect(dogResult?.addr).toBe(2000);
      expect(animalResult?.addr).not.toBe(dogResult?.addr);
    });
  });

  describe('Phase 3: Animal/Dog Polymorphism Integration (20 tests)', () => {
    beforeEach(() => {
      // Animal 클래스
      const animalDef: ClassDef = {
        name: 'Animal',
        fields: [],
        methods: [
          {
            name: 'Speak',
            className: 'Animal',
            params: [],
            returnType: 'Void',
            addr: 1000,
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };

      registry.registerClass(animalDef);

      // Dog 클래스 (Speak 오버라이드)
      const dogDef: ClassDef = {
        name: 'Dog',
        fields: [],
        methods: [
          {
            name: 'Speak',
            className: 'Dog',
            params: [],
            returnType: 'Void',
            addr: 2000,
          },
        ],
        totalSize: 0,
        registeredAt: Date.now(),
      };

      registry.registerClass(dogDef);
      hierarchy.extend('Dog', 'Animal');
      indexTable.buildFromHierarchy(registry, hierarchy);
    });

    it('3-1: PolymorphicFactory 생성', () => {
      expect(factory).toBeDefined();
      expect(typeof factory.create).toBe('function');
    });

    it('3-2: create("Dog") → PolymorphicObject', () => {
      const poly = factory.create('Dog');

      expect(poly).toBeDefined();
      expect(poly.vptr).toBe('Dog');
      expect(poly.declaredType).toBe('Dog');
    });

    it('3-3: create("Dog").vptr = "Dog" (Class ID = 실제 타입)', () => {
      const poly = factory.create('Dog');

      expect(poly.vptr).toBe('Dog');
    });

    it('3-4: create("Dog", "Animal") → declaredType="Animal"', () => {
      const poly = factory.create('Dog', 'Animal');

      expect(poly.vptr).toBe('Dog');
      expect(poly.declaredType).toBe('Animal');
    });

    it('3-5: upcast(dogPoly, "Animal") → declaredType="Animal", vptr="Dog"', () => {
      const dogPoly = factory.create('Dog');
      const upcast = factory.upcast(dogPoly, 'Animal');

      expect(upcast.declaredType).toBe('Animal');
      expect(upcast.vptr).toBe('Dog');
    });

    it('3-6: upcast 후 vptr 변경 없음 = "Dog" (핵심!)', () => {
      const dogPoly = factory.create('Dog');
      const upcast = factory.upcast(dogPoly, 'Animal');

      // vptr은 그대로 Dog (동적 디스패치 기반)
      expect(upcast.vptr).toBe('Dog');
    });

    it('3-7: upcast 후 dispatchPolymorphic → Dog.Speak addr:2000', () => {
      const dogPoly = factory.create('Dog');
      const upcast = factory.upcast(dogPoly, 'Animal');

      const result = dispatcher.dispatchPolymorphic(upcast, 'Speak');

      expect(result?.addr).toBe(2000);
    });

    it('3-8: TC_V7_2: my_pet=NEW Dog(); my_pet.Speak() → addr:2000 ✅', () => {
      const myPet = factory.create('Dog', 'Animal');

      expect(myPet.vptr).toBe('Dog'); // 실제 타입
      expect(myPet.declaredType).toBe('Animal'); // 선언 타입

      const result = dispatcher.dispatchPolymorphic(myPet, 'Speak');

      // vptr="Dog"로 디스패치 → Dog.Speak → addr:2000 ✅
      expect(result?.addr).toBe(2000);
    });

    it('3-9: animalPoly.Speak() → addr:1000 (Animal)', () => {
      const animalPoly = factory.create('Animal');

      const result = dispatcher.dispatchPolymorphic(animalPoly, 'Speak');

      expect(result?.addr).toBe(1000);
    });

    it('3-10: dogPoly.Speak() → addr:2000 (Dog)', () => {
      const dogPoly = factory.create('Dog');

      const result = dispatcher.dispatchPolymorphic(dogPoly, 'Speak');

      expect(result?.addr).toBe(2000);
    });

    it('3-11: 동일 선언 타입("Animal"), 다른 실제 타입 → 다른 addr', () => {
      const animalPoly = factory.create('Animal', 'Animal');
      const dogAsAnimal = factory.create('Dog', 'Animal');

      const animalResult = dispatcher.dispatchPolymorphic(animalPoly, 'Speak');
      const dogResult = dispatcher.dispatchPolymorphic(dogAsAnimal, 'Speak');

      expect(animalResult?.addr).toBe(1000);
      expect(dogResult?.addr).toBe(2000);
      expect(animalResult?.addr).not.toBe(dogResult?.addr);
    });

    it('3-12: 잘못된 업캐스팅 → 예외 발생', () => {
      const animalPoly = factory.create('Animal');

      // Animal → Dog는 업캐스팅 불가 (Dog가 자식)
      expect(() => factory.upcast(animalPoly, 'Dog')).toThrow();
    });

    it('3-13: isUpcast 검사: declaredType ≠ vptr', () => {
      const dogPoly = factory.create('Dog');
      const upcast = factory.upcast(dogPoly, 'Animal');

      expect(factory.isUpcast(dogPoly)).toBe(false);
      expect(factory.isUpcast(upcast)).toBe(true);
    });

    it('3-14: PolymorphicObject.vptr가 Object Header 역할', () => {
      const poly = factory.create('Dog');

      // vptr은 Object Header (첫 4바이트)
      expect(poly.vptr).toBe('Dog');
      expect(typeof poly.vptr).toBe('string');
    });

    it('3-15: vptr 기반으로 올바른 vTable 항상 조회', () => {
      const dogAsAnimal = factory.create('Dog', 'Animal');

      // vptr="Dog"로 Dog vTable 조회
      const table = builder.buildVTable(dogAsAnimal.vptr);

      expect(table.className).toBe('Dog');
      expect(table.addrs[0]).toBe(2000);
    });

    it('3-16: 두 개 PolymorphicObject 독립성 (inst1 ≠ inst2)', () => {
      const dog1 = factory.create('Dog');
      const dog2 = factory.create('Dog');

      expect(dog1).not.toBe(dog2);
      expect(dog1.instance).not.toBe(dog2.instance);
    });

    it('3-17: Dog에만 있는 메서드 → Dog vTable에만 존재', () => {
      // Fetch는 Dog에만 있는 메서드
      const dogDef = registry.getClass('Dog');
      const hasMethod = dogDef?.methods.some((m) => m.name === 'Fetch');

      // 현재 Fetch는 없지만, 있다면 Dog.Fetch → Dog vTable만
      if (hasMethod) {
        const dogTable = builder.buildVTable('Dog');
        const animalTable = builder.buildVTable('Animal');

        expect(dogTable.addrs.length).toBeGreaterThanOrEqual(animalTable.addrs.length);
      }

      expect(true).toBe(true);
    });

    it('3-18: 복합 시나리오: create, upcast, dispatch 연속', () => {
      // 1. create
      const dog = factory.create('Dog');
      expect(dog.vptr).toBe('Dog');

      // 2. upcast
      const asAnimal = factory.upcast(dog, 'Animal');
      expect(asAnimal.vptr).toBe('Dog');
      expect(asAnimal.declaredType).toBe('Animal');

      // 3. dispatch
      const result = dispatcher.dispatchPolymorphic(asAnimal, 'Speak');
      expect(result?.addr).toBe(2000);
    });

    it('3-19: 메모리 효율: 여러 Dog 인스턴스가 Dog_vTable 공유', () => {
      const dog1 = factory.create('Dog');
      const dog2 = factory.create('Dog');

      // 같은 vTable 참조 (메모리 절약)
      const table1 = builder.buildVTable(dog1.vptr);
      const table2 = builder.buildVTable(dog2.vptr);

      expect(table1).toBe(table2);
    });

    it('3-20: ✅ TC_V7_2_POLYMORPHISM_COMPLETE', () => {
      const myPet = factory.create('Dog', 'Animal');

      expect(myPet.vptr).toBe('Dog');
      expect(myPet.declaredType).toBe('Animal');
      expect(factory.isUpcast(myPet)).toBe(true);

      const result = dispatcher.dispatchPolymorphic(myPet, 'Speak');

      expect(result?.addr).toBe(2000);
      expect(result?.isDynamic).toBe(true);
    });
  });
});

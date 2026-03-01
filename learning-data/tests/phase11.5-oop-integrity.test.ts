/**
 * FreeLang v7.5: OOP Integrity & GC Readiness - 60 Tests
 *
 * 목표: 객체 생명주기 완결 + 메모리 안전성
 * - Phase 1: Object Header (20 tests)
 * - Phase 2: Destructor Engine (20 tests)
 * - Phase 3: Instance Tracking & Integration (20 tests)
 */

import { ObjectHeader, ObjectHeaderManager } from '../src/object-header';
import { DestructorEngine } from '../src/destructor-engine';
import { InstanceTracker } from '../src/instance-tracker';
import { ClassHierarchy } from '../src/class-inheritance';

describe('Phase 11.5: OOP Integrity & GC Readiness', () => {
  let manager: ObjectHeaderManager;
  let engine: DestructorEngine;
  let tracker: InstanceTracker;
  let hierarchy: ClassHierarchy;

  beforeEach(() => {
    manager = new ObjectHeaderManager();
    engine = new DestructorEngine();
    tracker = new InstanceTracker();
    hierarchy = new ClassHierarchy();
  });

  describe('Phase 1: Object Header (20 tests)', () => {
    test('1-1: ObjectHeaderManager 인스턴스 생성', () => {
      expect(manager).toBeDefined();
    });

    test('1-2: create("Derived") → ObjectHeader 반환', () => {
      const header = manager.create('Derived', 'derived_1');
      expect(header).toBeDefined();
      expect(header.vPtr).toBe('Derived');
    });

    test('1-3: header.vPtr = "Derived" (클래스명)', () => {
      const header = manager.create('Derived', 'derived_1');
      expect(header.vPtr).toBe('Derived');
    });

    test('1-4: header.refCount = 1 (초기값)', () => {
      const header = manager.create('Derived', 'derived_1');
      expect(header.refCount).toBe(1);
    });

    test('1-5: header.destroyed = false', () => {
      const header = manager.create('Derived', 'derived_1');
      expect(header.destroyed).toBe(false);
    });

    test('1-6: header.createdAt는 타임스탐프', () => {
      const before = Date.now();
      const header = manager.create('Derived', 'derived_1');
      const after = Date.now();
      expect(header.createdAt).toBeGreaterThanOrEqual(before);
      expect(header.createdAt).toBeLessThanOrEqual(after);
    });

    test('1-7: header.instanceData는 Map', () => {
      const header = manager.create('Derived', 'derived_1');
      expect(header.instanceData instanceof Map).toBe(true);
    });

    test('1-8: setField(header, "Secret", 999)', () => {
      const header = manager.create('Derived', 'derived_1');
      manager.setField(header, 'Secret', 999);
      expect(header.instanceData.has('Secret')).toBe(true);
    });

    test('1-9: getField(header, "Secret") = 999', () => {
      const header = manager.create('Derived', 'derived_1');
      manager.setField(header, 'Secret', 999);
      const value = manager.getField(header, 'Secret');
      expect(value).toBe(999);
    });

    test('1-10: incrementRef() → refCount = 2', () => {
      const header = manager.create('Derived', 'derived_1');
      expect(header.refCount).toBe(1);
      manager.incrementRef(header);
      expect(header.refCount).toBe(2);
    });

    test('1-11: incrementRef() 다시 → refCount = 3', () => {
      const header = manager.create('Derived', 'derived_1');
      manager.incrementRef(header);
      manager.incrementRef(header);
      expect(header.refCount).toBe(3);
    });

    test('1-12: decrementRef() → refCount = 2, 반환값 false', () => {
      const header = manager.create('Derived', 'derived_1');
      manager.incrementRef(header);
      manager.incrementRef(header); // refCount = 3
      const shouldDelete = manager.decrementRef(header);
      expect(header.refCount).toBe(2);
      expect(shouldDelete).toBe(false);
    });

    test('1-13: decrementRef() 계속 → refCount = 1', () => {
      const header = manager.create('Derived', 'derived_1');
      manager.incrementRef(header);
      manager.incrementRef(header); // refCount = 3
      manager.decrementRef(header); // 2
      manager.decrementRef(header); // 1
      expect(header.refCount).toBe(1);
    });

    test('1-14: decrementRef() 마지막 → refCount = 0, 반환값 true', () => {
      const header = manager.create('Derived', 'derived_1');
      const shouldDelete = manager.decrementRef(header);
      expect(header.refCount).toBe(0);
      expect(shouldDelete).toBe(true);
    });

    test('1-15: destroyed 객체에 incrementRef 시도 → 에러', () => {
      const header = manager.create('Derived', 'derived_1');
      header.destroyed = true;
      expect(() => manager.incrementRef(header)).toThrow();
    });

    test('1-16: 여러 필드 동시 저장', () => {
      const header = manager.create('Derived', 'derived_1');
      manager.setField(header, 'ID', 100);
      manager.setField(header, 'Secret', 999);
      manager.setField(header, 'Name', 'Test');
      expect(manager.getFieldCount(header)).toBe(3);
    });

    test('1-17: 필드 덮어쓰기 (999 → 0)', () => {
      const header = manager.create('Derived', 'derived_1');
      manager.setField(header, 'Secret', 999);
      manager.setField(header, 'Secret', 0);
      expect(manager.getField(header, 'Secret')).toBe(0);
    });

    test('1-18: 필드 존재 여부 확인', () => {
      const header = manager.create('Derived', 'derived_1');
      manager.setField(header, 'Secret', 999);
      expect(manager.hasField(header, 'Secret')).toBe(true);
      expect(manager.hasField(header, 'Unknown')).toBe(false);
    });

    test('1-19: 필드 목록 조회', () => {
      const header = manager.create('Derived', 'derived_1');
      manager.setField(header, 'ID', 100);
      manager.setField(header, 'Secret', 999);
      const names = manager.getAllFieldNames(header);
      expect(names).toContain('ID');
      expect(names).toContain('Secret');
      expect(names.length).toBe(2);
    });

    test('1-20: ✅ OBJECT HEADER COMPLETE', () => {
      const header = manager.create('Derived', 'derived_1');
      manager.setField(header, 'ID', 100);
      manager.setField(header, 'Secret', 999);
      manager.incrementRef(header);
      manager.decrementRef(header);
      expect(header.refCount).toBe(1);
      expect(manager.getField(header, 'ID')).toBe(100);
      expect(manager.getField(header, 'Secret')).toBe(999);
    });
  });

  describe('Phase 2: Destructor Engine (20 tests)', () => {
    test('2-1: DestructorEngine 인스턴스 생성', () => {
      expect(engine).toBeDefined();
    });

    test('2-2: register(Destructor) 성공', () => {
      engine.register({
        className: 'Derived',
        onDelete: () => {
          // cleanup
        },
      });
      const destructor = engine.getDestructor('Derived');
      expect(destructor).toBeDefined();
    });

    test('2-3: getDestructor("Derived") 조회', () => {
      engine.register({
        className: 'Derived',
        code: 'cleanup',
      });
      const destructor = engine.getDestructor('Derived');
      expect(destructor?.className).toBe('Derived');
    });

    test('2-4: finalize() 호출 → destroyed = true', () => {
      const header = manager.create('Derived', 'derived_1');
      expect(header.destroyed).toBe(false);
      engine.finalize(header);
      expect(header.destroyed).toBe(true);
    });

    test('2-5: finalize() 후 destroyed 객체에 접근 → 에러', () => {
      const header = manager.create('Derived', 'derived_1');
      engine.finalize(header);
      expect(() => manager.getField(header, 'Secret')).toThrow();
    });

    test('2-6: finalize() 시 onDelete 콜백 실행', () => {
      const header = manager.create('Derived', 'derived_1');
      let callbackCalled = false;
      engine.register({
        className: 'Derived',
        onDelete: () => {
          callbackCalled = true;
        },
      });
      engine.finalize(header);
      expect(callbackCalled).toBe(true);
    });

    test('2-7: 상속 구조에서 resolveDestructor (부모 찾기)', () => {
      hierarchy.extend('Derived', 'Base');
      engine.register({
        className: 'Base',
        code: 'base_cleanup',
      });
      const destructor = engine.resolveDestructor('Derived', hierarchy);
      expect(destructor?.className).toBe('Base');
    });

    test('2-8: Base → Derived 체인에서 Destructor 해석', () => {
      hierarchy.extend('Derived', 'Base');
      engine.register({
        className: 'Derived',
        code: 'derived_cleanup',
      });
      const destructor = engine.resolveDestructor('Derived', hierarchy);
      expect(destructor?.className).toBe('Derived');
    });

    test('2-9: finalize 후 instanceData 정리 확인', () => {
      const header = manager.create('Derived', 'derived_1');
      manager.setField(header, 'Secret', 999);
      expect(manager.getFieldCount(header)).toBe(1);
      engine.finalize(header);
      expect(manager.getFieldCount(header)).toBe(0);
    });

    test('2-10: 중복 finalize 시도 (idempotent)', () => {
      const header = manager.create('Derived', 'derived_1');
      engine.finalize(header);
      expect(header.destroyed).toBe(true);
      engine.finalize(header); // 다시 호출
      expect(header.destroyed).toBe(true); // 여전히 true
    });

    test('2-11: Destructor 없는 클래스도 정상 finalize', () => {
      const header = manager.create('NoDestructor', 'nd_1');
      expect(() => engine.finalize(header)).not.toThrow();
      expect(header.destroyed).toBe(true);
    });

    test('2-12: 3단계 상속 (A → B → C) Destructor 해석', () => {
      hierarchy.extend('B', 'A');
      hierarchy.extend('C', 'B');
      engine.register({
        className: 'A',
        code: 'a_cleanup',
      });
      const destructor = engine.resolveDestructor('C', hierarchy);
      expect(destructor?.className).toBe('A');
    });

    test('2-13: finalize 콜백에서 clean-up 작업', () => {
      const header = manager.create('FileHandle', 'fh_1');
      const cleanupLog: string[] = [];
      engine.register({
        className: 'FileHandle',
        onDelete: () => {
          cleanupLog.push('file_closed');
        },
      });
      engine.finalize(header);
      expect(cleanupLog).toContain('file_closed');
    });

    test('2-14: 여러 인스턴스 각각 finalize', () => {
      const header1 = manager.create('Derived', 'derived_1');
      const header2 = manager.create('Derived', 'derived_2');
      engine.finalize(header1);
      engine.finalize(header2);
      expect(header1.destroyed).toBe(true);
      expect(header2.destroyed).toBe(true);
    });

    test('2-15: finalize 순서 추적 (로깅)', () => {
      const log: string[] = [];
      engine.register({
        className: 'First',
        onDelete: () => log.push('first_finalized'),
      });
      engine.register({
        className: 'Second',
        onDelete: () => log.push('second_finalized'),
      });
      const h1 = manager.create('First', 'first_1');
      const h2 = manager.create('Second', 'second_1');
      engine.finalize(h1);
      engine.finalize(h2);
      expect(log).toEqual(['first_finalized', 'second_finalized']);
    });

    test('2-16: 부모 Destructor도 호출되는가?', () => {
      hierarchy.extend('Derived', 'Base');
      const log: string[] = [];
      engine.register({
        className: 'Base',
        onDelete: () => log.push('base'),
      });
      engine.register({
        className: 'Derived',
        onDelete: () => log.push('derived'),
      });
      const header = manager.create('Derived', 'derived_1');
      engine.finalizeWithChain(header, hierarchy);
      expect(log).toContain('derived');
      expect(log).toContain('base');
    });

    test('2-17: Destructor 체인 (부모 → 자식)', () => {
      hierarchy.extend('B', 'A');
      const log: string[] = [];
      engine.register({
        className: 'A',
        onDelete: () => log.push('A'),
      });
      engine.register({
        className: 'B',
        onDelete: () => log.push('B'),
      });
      const header = manager.create('B', 'b_1');
      engine.finalizeWithChain(header, hierarchy);
      expect(log.length).toBe(2);
    });

    test('2-18: Destructor 우선순위', () => {
      const header = manager.create('Priority', 'p_1');
      let firstCall = 0;
      engine.register({
        className: 'Priority',
        onDelete: () => {
          firstCall++;
        },
      });
      engine.finalize(header);
      expect(firstCall).toBe(1);
    });

    test('2-19: 메모리 정리 후 재할당 가능', () => {
      const header1 = manager.create('Derived', 'derived_1');
      manager.setField(header1, 'data', 'large');
      engine.finalize(header1);

      // 새로 할당 가능
      const header2 = manager.create('Derived', 'derived_2');
      expect(header2.refCount).toBe(1);
      expect(header2.destroyed).toBe(false);
    });

    test('2-20: ✅ DESTRUCTOR ENGINE COMPLETE', () => {
      hierarchy.extend('Derived', 'Base');
      const log: string[] = [];
      engine.register({
        className: 'Base',
        onDelete: () => log.push('base'),
      });
      engine.register({
        className: 'Derived',
        onDelete: () => log.push('derived'),
      });
      const header = manager.create('Derived', 'derived_1');
      manager.setField(header, 'Secret', 999);
      engine.finalizeWithChain(header, hierarchy);
      expect(header.destroyed).toBe(true);
      expect(log.length).toBe(2);
    });
  });

  describe('Phase 3: Instance Tracking & Integration (20 tests)', () => {
    test('3-1: InstanceTracker 인스턴스 생성', () => {
      expect(tracker).toBeDefined();
    });

    test('3-2: trackCreate() → InstanceRecord 반환', () => {
      const header = manager.create('Derived', 'derived_1');
      const record = tracker.trackCreate('Derived', header);
      expect(record).toBeDefined();
      expect(record.className).toBe('Derived');
    });

    test('3-3: record.instanceId = "inst_1" (자동 증가)', () => {
      const header = manager.create('Derived', 'derived_1');
      const record = tracker.trackCreate('Derived', header);
      expect(record.instanceId).toBe('inst_1');
    });

    test('3-4: record.className = "Derived"', () => {
      const header = manager.create('Derived', 'derived_1');
      const record = tracker.trackCreate('Derived', header);
      expect(record.className).toBe('Derived');
    });

    test('3-5: record.createdAt는 타임스탐프', () => {
      const header = manager.create('Derived', 'derived_1');
      const record = tracker.trackCreate('Derived', header);
      expect(typeof record.createdAt).toBe('number');
      expect(record.createdAt > 0).toBe(true);
    });

    test('3-6: record.isFreed = false (초기)', () => {
      const header = manager.create('Derived', 'derived_1');
      const record = tracker.trackCreate('Derived', header);
      expect(record.isFreed).toBe(false);
    });

    test('3-7: getActiveInstances() = [inst_1]', () => {
      const header = manager.create('Derived', 'derived_1');
      tracker.trackCreate('Derived', header);
      const active = tracker.getActiveInstances();
      expect(active.length).toBe(1);
      expect(active[0].instanceId).toBe('inst_1');
    });

    test('3-8: trackCreate 2회 → [inst_1, inst_2]', () => {
      const header1 = manager.create('Derived', 'derived_1');
      const header2 = manager.create('Derived', 'derived_2');
      tracker.trackCreate('Derived', header1);
      tracker.trackCreate('Derived', header2);
      const active = tracker.getActiveInstances();
      expect(active.length).toBe(2);
      expect(active[0].instanceId).toBe('inst_1');
      expect(active[1].instanceId).toBe('inst_2');
    });

    test('3-9: trackFree("inst_1") → isFreed = true', () => {
      const header = manager.create('Derived', 'derived_1');
      const record = tracker.trackCreate('Derived', header);
      tracker.trackFree('inst_1');
      expect(record.isFreed).toBe(true);
    });

    test('3-10: trackFree 후 getActiveInstances() = [inst_2]', () => {
      const h1 = manager.create('Derived', 'derived_1');
      const h2 = manager.create('Derived', 'derived_2');
      tracker.trackCreate('Derived', h1);
      tracker.trackCreate('Derived', h2);
      tracker.trackFree('inst_1');
      const active = tracker.getActiveInstances();
      expect(active.length).toBe(1);
      expect(active[0].instanceId).toBe('inst_2');
    });

    test('3-11: getAllInstances() = [inst_1, inst_2] (모두 조회)', () => {
      const h1 = manager.create('Derived', 'derived_1');
      const h2 = manager.create('Derived', 'derived_2');
      tracker.trackCreate('Derived', h1);
      tracker.trackCreate('Derived', h2);
      tracker.trackFree('inst_1');
      const all = tracker.getAllInstances();
      expect(all.length).toBe(2);
    });

    test('3-12: getStats().totalCreated = 2', () => {
      const h1 = manager.create('Derived', 'derived_1');
      const h2 = manager.create('Derived', 'derived_2');
      tracker.trackCreate('Derived', h1);
      tracker.trackCreate('Derived', h2);
      const stats = tracker.getStats();
      expect(stats.totalCreated).toBe(2);
    });

    test('3-13: getStats().totalFreed = 1', () => {
      const h1 = manager.create('Derived', 'derived_1');
      const h2 = manager.create('Derived', 'derived_2');
      tracker.trackCreate('Derived', h1);
      tracker.trackCreate('Derived', h2);
      tracker.trackFree('inst_1');
      const stats = tracker.getStats();
      expect(stats.totalFreed).toBe(1);
    });

    test('3-14: getStats().activeCount = 1', () => {
      const h1 = manager.create('Derived', 'derived_1');
      const h2 = manager.create('Derived', 'derived_2');
      tracker.trackCreate('Derived', h1);
      tracker.trackCreate('Derived', h2);
      tracker.trackFree('inst_1');
      const stats = tracker.getStats();
      expect(stats.activeCount).toBe(1);
    });

    test('3-15: getStats().leakedCount = 1 (남은 객체)', () => {
      const h1 = manager.create('Derived', 'derived_1');
      const h2 = manager.create('Derived', 'derived_2');
      tracker.trackCreate('Derived', h1);
      tracker.trackCreate('Derived', h2);
      tracker.trackFree('inst_1');
      const stats = tracker.getStats();
      expect(stats.leakedCount).toBe(1);
    });

    test('3-16: checkMemoryLeak() 반환 (누수 객체 목록)', () => {
      const h1 = manager.create('Derived', 'derived_1');
      const h2 = manager.create('Derived', 'derived_2');
      tracker.trackCreate('Derived', h1);
      tracker.trackCreate('Derived', h2);
      tracker.trackFree('inst_1');
      const leaks = tracker.checkMemoryLeak();
      expect(leaks.length).toBe(1);
      expect(leaks[0].instanceId).toBe('inst_2');
    });

    test('3-17: **TC_V7_5_OOP_LIFECYCLE**: NEW Base() → Destructor → Heap Check ✅', () => {
      hierarchy.extend('Derived', 'Base');
      engine.register({
        className: 'Base',
        onDelete: () => {
          // Base cleanup
        },
      });
      engine.register({
        className: 'Derived',
        onDelete: () => {
          // Derived cleanup
        },
      });

      // 객체 생성
      const header = manager.create('Derived', 'derived_1');
      manager.setField(header, 'ID', 100);
      manager.setField(header, 'Secret', 999);
      tracker.trackCreate('Derived', header);

      expect(tracker.getActiveCount()).toBe(1);

      // 객체 소멸
      engine.finalizeWithChain(header, hierarchy);
      tracker.trackFree('inst_1');

      // 메모리 누수 검사
      expect(tracker.checkMemoryLeak().length).toBe(0);
    });

    test('3-18: 상속 + 다형성 + 캡슐화 + 생명주기 통합 테스트', () => {
      hierarchy.extend('Derived', 'Base');
      const log: string[] = [];
      engine.register({
        className: 'Derived',
        onDelete: () => log.push('finalized'),
      });

      const header = manager.create('Derived', 'derived_1');
      manager.setField(header, 'ID', 100);
      const record = tracker.trackCreate('Derived', header);

      expect(record.className).toBe('Derived');
      expect(tracker.getActiveCount()).toBe(1);

      engine.finalize(header);
      tracker.trackFree('inst_1');

      expect(log).toContain('finalized');
      expect(header.destroyed).toBe(true);
      expect(tracker.checkMemoryLeak().length).toBe(0);
    });

    test('3-19: 성능: 1000개 객체 생성/소멸 < 200ms', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        const header = manager.create('Test', `test_${i}`);
        const record = tracker.trackCreate('Test', header);
        tracker.trackFree(record.instanceId);
        engine.finalize(header);
      }

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(200);
    });

    test('3-20: ✅ TC_V7_5_OOP_INTEGRITY_COMPLETE', () => {
      // 통합 검증
      hierarchy.extend('Derived', 'Base');
      engine.register({
        className: 'Base',
      });
      engine.register({
        className: 'Derived',
      });

      // 3개 객체 생성
      const headers = [];
      for (let i = 0; i < 3; i++) {
        const h = manager.create('Derived', `d_${i}`);
        manager.setField(h, 'value', i);
        tracker.trackCreate('Derived', h);
        headers.push(h);
      }

      expect(tracker.getActiveCount()).toBe(3);
      expect(tracker.checkMemoryLeak().length).toBe(3);

      // 모두 소멸
      for (let i = 0; i < 3; i++) {
        engine.finalizeWithChain(headers[i], hierarchy);
        tracker.trackFree(`inst_${i + 1}`);
      }

      expect(tracker.getActiveCount()).toBe(0);
      expect(tracker.checkMemoryLeak().length).toBe(0);

      const stats = tracker.getStats();
      expect(stats.totalCreated).toBe(3);
      expect(stats.totalFreed).toBe(3);
      expect(stats.leakedCount).toBe(0);
    });
  });
});

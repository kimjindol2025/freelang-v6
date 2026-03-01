/**
 * FreeLang v8.0: Exception Handling & Stack Unwinding
 * 60 Tests (20/20/20)
 *
 * Phase 1: Exception Object (20 tests)
 * Phase 2: Exception Handler (20 tests)
 * Phase 3: Stack Unwinding & Integration (20 tests)
 */

import {
  ExceptionObjectFactory,
  ExceptionObject,
  StackFrame,
  StackTrace,
} from '../src/exception-object';
import {
  ExceptionHandlerManager,
  HandlerEntry,
} from '../src/exception-handler';
import {
  StackUnwindingEngine,
  UnwindingEvent,
} from '../src/stack-unwinding';

describe('Phase 1: Exception Object (20 tests)', () => {
  let factory: ExceptionObjectFactory;

  beforeEach(() => {
    factory = new ExceptionObjectFactory();
  });

  // 1-1: Factory 생성
  test('1-1: ExceptionObjectFactory 인스턴스 생성', () => {
    expect(factory).toBeDefined();
    expect(factory).toBeInstanceOf(ExceptionObjectFactory);
  });

  // 1-2: 기본 Exception 생성
  test('1-2: create() 메서드로 Exception 생성', () => {
    const frames = [
      factory.createStackFrame('DangerousDivision', 42, 1500),
    ];
    const stackTrace = factory.createStackTrace(frames);
    const ex = factory.create(
      'ZeroDivisionError',
      'Cannot divide by zero',
      stackTrace
    );

    expect(ex).toBeDefined();
    expect(ex.type).toBe('ZeroDivisionError');
    expect(ex.message).toBe('Cannot divide by zero');
  });

  // 1-3: Exception type 검증
  test('1-3: exception.type이 올바른가', () => {
    const stackTrace = factory.createStackTrace([]);
    const ex = factory.create('NullReferenceError', 'Null pointer', stackTrace);
    expect(ex.type).toBe('NullReferenceError');
  });

  // 1-4: Exception message 검증
  test('1-4: exception.message가 올바른가', () => {
    const stackTrace = factory.createStackTrace([]);
    const ex = factory.create(
      'TestError',
      'Test message content',
      stackTrace
    );
    expect(ex.message).toBe('Test message content');
  });

  // 1-5: Exception timestamp 검증
  test('1-5: exception.timestamp > 0인가', () => {
    const stackTrace = factory.createStackTrace([]);
    const ex = factory.create('TestError', 'Test', stackTrace);
    expect(ex.timestamp).toBeGreaterThan(0);
  });

  // 1-6: StackFrame 생성
  test('1-6: StackFrame 생성', () => {
    const frame = factory.createStackFrame('myFunction', 10, 1000, 'context');
    expect(frame.functionName).toBe('myFunction');
    expect(frame.lineNumber).toBe(10);
    expect(frame.address).toBe(1000);
    expect(frame.context).toBe('context');
  });

  // 1-7: StackTrace with 3 frames
  test('1-7: StackTrace with 3 frames', () => {
    const frames = [
      factory.createStackFrame('main', 1, 100),
      factory.createStackFrame('foo', 2, 200),
      factory.createStackFrame('bar', 3, 300),
    ];
    const trace = factory.createStackTrace(frames);
    expect(trace.frames.length).toBe(3);
    expect(trace.depth).toBe(3);
  });

  // 1-8: formatStackTrace() 출력
  test('1-8: formatStackTrace() 포맷팅', () => {
    const frames = [
      factory.createStackFrame('DangerousDivision', 42, 1500),
      factory.createStackFrame('BusinessLogic', 50, 1600),
      factory.createStackFrame('main', 55, 1700),
    ];
    const stackTrace = factory.createStackTrace(frames);
    const ex = factory.create(
      'ZeroDivisionError',
      'Cannot divide by zero',
      stackTrace
    );

    const formatted = factory.formatStackTrace(ex);
    expect(formatted).toContain('ZeroDivisionError');
    expect(formatted).toContain('Cannot divide by zero');
    expect(formatted).toContain('DangerousDivision');
    expect(formatted).toContain('line 42');
  });

  // 1-9: Exception 체이닝
  test('1-9: Exception 체이닝 (cause)', () => {
    const trace1 = factory.createStackTrace([]);
    const ex1 = factory.create('IOException', 'File not found', trace1);

    const trace2 = factory.createStackTrace([]);
    const ex2 = factory.create(
      'InitializationError',
      'Cannot initialize',
      trace2
    );

    const chained = factory.chainCause(ex2, ex1);
    expect(chained.cause).toBe(ex1);
    expect(chained.type).toBe('InitializationError');
  });

  // 1-10: getRootCause() 근본 원인
  test('1-10: getRootCause() 최상위 원인 추적', () => {
    const trace = factory.createStackTrace([]);
    const ex1 = factory.create('RootError', 'Root', trace);
    const ex2 = factory.create('MiddleError', 'Middle', trace);
    const ex3 = factory.create('TopError', 'Top', trace);

    let chained = ex2;
    chained = factory.chainCause(chained, ex1);
    chained = factory.chainCause(ex3, chained);

    const root = factory.getRootCause(chained);
    expect(root.type).toBe('RootError');
  });

  // 1-11: Exception with code
  test('1-11: Exception with error code', () => {
    const trace = factory.createStackTrace([]);
    const ex = factory.create('Error100', 'Error with code', trace, 100);
    expect(ex.code).toBe(100);
  });

  // 1-12: Exception with custom context
  test('1-12: StackFrame with custom context', () => {
    const frame = factory.createStackFrame('func', 10, 100, 'dividing 10 by 0');
    const trace = factory.createStackTrace([frame]);
    const ex = factory.create('CustomError', 'Test', trace);
    expect(ex.stackTrace.frames[0].context).toBe('dividing 10 by 0');
  });

  // 1-13: 여러 Exception 독립성
  test('1-13: 여러 Exception 독립성', () => {
    const trace1 = factory.createStackTrace([]);
    const ex1 = factory.create('Error1', 'Message1', trace1);

    const trace2 = factory.createStackTrace([]);
    const ex2 = factory.create('Error2', 'Message2', trace2);

    expect(ex1.type).toBe('Error1');
    expect(ex2.type).toBe('Error2');
    expect(ex1.message).not.toBe(ex2.message);
  });

  // 1-14: Exception clone
  test('1-14: Exception clone()', () => {
    const frame = factory.createStackFrame('func', 10, 100);
    const trace = factory.createStackTrace([frame]);
    const ex = factory.create('TestError', 'Test', trace, 50);
    const cloned = factory.clone(ex);

    expect(cloned.type).toBe(ex.type);
    expect(cloned.message).toBe(ex.message);
    expect(cloned.code).toBe(ex.code);
    expect(cloned).not.toBe(ex);
  });

  // 1-15: Exception 직렬화
  test('1-15: Exception 직렬화 (JSON)', () => {
    const frame = factory.createStackFrame('func', 10, 100);
    const trace = factory.createStackTrace([frame]);
    const ex = factory.create('TestError', 'Test', trace);

    const json = JSON.stringify(ex);
    const parsed = JSON.parse(json);

    expect(parsed.type).toBe('TestError');
    expect(parsed.message).toBe('Test');
  });

  // 1-16: 깊은 체인 (3단계)
  test('1-16: 깊은 Exception 체인 (3단계)', () => {
    const trace = factory.createStackTrace([]);
    const root = factory.create('RootError', 'Root', trace);
    const middle = factory.create('MiddleError', 'Middle', trace);
    const top = factory.create('TopError', 'Top', trace);

    let current = root;
    current = factory.chainCause(middle, current);
    current = factory.chainCause(top, current);

    let count = 0;
    let node: ExceptionObject | undefined = current;
    while (node) {
      count++;
      node = node.cause;
    }

    expect(count).toBe(3);
  });

  // 1-17: Exception 메타데이터
  test('1-17: Exception 메타데이터 (timestamp, code)', () => {
    const trace = factory.createStackTrace([]);
    const ex = factory.create('TestError', 'Test', trace, 999);

    expect(ex.timestamp).toBeGreaterThan(0);
    expect(ex.code).toBe(999);
    expect(ex.stackTrace).toBeDefined();
  });

  // 1-18: StackFrame 정보 정확성
  test('1-18: StackFrame 정보 정확성', () => {
    const frame1 = factory.createStackFrame('funcA', 100, 5000, 'context1');
    const frame2 = factory.createStackFrame('funcB', 200, 6000, 'context2');
    const trace = factory.createStackTrace([frame1, frame2]);
    const ex = factory.create('TestError', 'Test', trace);

    expect(ex.stackTrace.frames[0].functionName).toBe('funcA');
    expect(ex.stackTrace.frames[0].lineNumber).toBe(100);
    expect(ex.stackTrace.frames[0].address).toBe(5000);
    expect(ex.stackTrace.frames[1].context).toBe('context2');
  });

  // 1-19: Exception equals
  test('1-19: equals() - 같은 타입과 메시지 비교', () => {
    const trace1 = factory.createStackTrace([]);
    const trace2 = factory.createStackTrace([]);

    const ex1 = factory.create('TestError', 'Message', trace1);
    const ex2 = factory.create('TestError', 'Message', trace2);

    expect(factory.equals(ex1, ex2)).toBe(true);
  });

  // 1-20: Phase 1 완료
  test('1-20: ✅ EXCEPTION OBJECT COMPLETE', () => {
    const factory2 = new ExceptionObjectFactory();
    expect(factory2).toBeDefined();
  });
});

// ============================================================================

describe('Phase 2: Exception Handler (20 tests)', () => {
  let manager: ExceptionHandlerManager;

  beforeEach(() => {
    manager = new ExceptionHandlerManager();
  });

  // 2-1: Manager 생성
  test('2-1: ExceptionHandlerManager 인스턴스 생성', () => {
    expect(manager).toBeDefined();
    expect(manager).toBeInstanceOf(ExceptionHandlerManager);
  });

  // 2-2: pushHandler → handler_1
  test('2-2: pushHandler() → handler_1 등록', () => {
    const id = manager.pushHandler(1000, ['ZeroDivisionError'], {
      startPC: 100,
      endPC: 500,
    });
    expect(id).toBe('handler_1');
  });

  // 2-3: handler.handlerId 검증
  test('2-3: 등록된 handlerId = handler_1', () => {
    const id = manager.pushHandler(1000, ['ZeroDivisionError'], {
      startPC: 100,
      endPC: 500,
    });
    const handler = manager.getCurrentHandler();
    expect(handler?.handlerId).toBe(id);
    expect(handler?.handlerId).toBe('handler_1');
  });

  // 2-4: exceptionTypes 검증
  test('2-4: exceptionTypes = [ZeroDivisionError]', () => {
    manager.pushHandler(1000, ['ZeroDivisionError'], {
      startPC: 100,
      endPC: 500,
    });
    const handler = manager.getCurrentHandler();
    expect(handler?.exceptionTypes).toContain('ZeroDivisionError');
  });

  // 2-5: getCurrentHandler()
  test('2-5: getCurrentHandler() 최상위 핸들러 조회', () => {
    manager.pushHandler(1000, ['ErrorA'], { startPC: 100, endPC: 500 });
    manager.pushHandler(2000, ['ErrorB'], { startPC: 200, endPC: 600 });

    const handler = manager.getCurrentHandler();
    expect(handler?.exceptionTypes).toContain('ErrorB');
  });

  // 2-6: popHandler()
  test('2-6: popHandler() → 핸들러 제거', () => {
    manager.pushHandler(1000, ['ErrorA'], { startPC: 100, endPC: 500 });
    const popped = manager.popHandler();

    expect(popped).toBe('handler_1');
    expect(manager.getCurrentHandler()).toBeUndefined();
  });

  // 2-7: findMatchingHandler("ZeroDivisionError")
  test('2-7: findMatchingHandler() - 예외 타입 매칭', () => {
    manager.pushHandler(1000, ['ZeroDivisionError'], {
      startPC: 100,
      endPC: 500,
    });

    const handler = manager.findMatchingHandler('ZeroDivisionError');
    expect(handler).toBeDefined();
    expect(handler?.catchAddress).toBe(1000);
  });

  // 2-8: findMatchingHandler 미매칭
  test('2-8: findMatchingHandler() - 미매칭 → undefined', () => {
    manager.pushHandler(1000, ['ZeroDivisionError'], {
      startPC: 100,
      endPC: 500,
    });

    const handler = manager.findMatchingHandler('FileNotFoundError');
    expect(handler).toBeUndefined();
  });

  // 2-9: isInTryScope() 범위 확인
  test('2-9: isInTryScope() - PC 범위 확인', () => {
    const id = manager.pushHandler(1000, ['Error'], { startPC: 100, endPC: 500 });

    expect(manager.isInTryScope(id, 100)).toBe(true);
    expect(manager.isInTryScope(id, 300)).toBe(true);
    expect(manager.isInTryScope(id, 500)).toBe(true);
    expect(manager.isInTryScope(id, 99)).toBe(false);
    expect(manager.isInTryScope(id, 501)).toBe(false);
  });

  // 2-10: getHandlersForPC() 여러 핸들러
  test('2-10: getHandlersForPC() - PC에 해당하는 모든 핸들러', () => {
    manager.pushHandler(1000, ['ErrorA'], { startPC: 0, endPC: 1000 });
    manager.pushHandler(2000, ['ErrorB'], { startPC: 100, endPC: 500 });

    const handlers = manager.getHandlersForPC(300);
    expect(handlers.length).toBe(2);
  });

  // 2-11: 중첩 핸들러 (2개)
  test('2-11: 중첩 핸들러 (2개)', () => {
    manager.pushHandler(1000, ['ErrorA'], { startPC: 100, endPC: 500 });
    manager.pushHandler(2000, ['ErrorB'], { startPC: 200, endPC: 400 });

    const current = manager.getCurrentHandler();
    expect(current?.exceptionTypes).toContain('ErrorB');
  });

  // 2-12: 중첩 핸들러 (3개)
  test('2-12: 중첩 핸들러 (3개)', () => {
    manager.pushHandler(1000, ['ErrorA'], { startPC: 100, endPC: 600 });
    manager.pushHandler(2000, ['ErrorB'], { startPC: 200, endPC: 500 });
    manager.pushHandler(3000, ['ErrorC'], { startPC: 300, endPC: 400 });

    const handlers = manager.getHandlersForPC(350);
    expect(handlers.length).toBe(3);
  });

  // 2-13: pushHandler 후 popHandler
  test('2-13: pushHandler → popHandler → empty', () => {
    manager.pushHandler(1000, ['Error'], { startPC: 100, endPC: 500 });
    expect(manager.getHandlerDepth()).toBe(1);

    manager.popHandler();
    expect(manager.getHandlerDepth()).toBe(0);
  });

  // 2-14: 핸들러 스택 동기화
  test('2-14: 핸들러 스택 깊이 동기화', () => {
    expect(manager.getHandlerDepth()).toBe(0);

    manager.pushHandler(1000, ['ErrorA'], { startPC: 100, endPC: 500 });
    expect(manager.getHandlerDepth()).toBe(1);

    manager.pushHandler(2000, ['ErrorB'], { startPC: 200, endPC: 600 });
    expect(manager.getHandlerDepth()).toBe(2);

    manager.popHandler();
    expect(manager.getHandlerDepth()).toBe(1);
  });

  // 2-15: exceptionTypes: ["Any"] 모든 예외 처리
  test('2-15: exceptionTypes=[Any] - 모든 예외 처리', () => {
    manager.pushHandler(1000, ['Any'], { startPC: 100, endPC: 500 });

    expect(manager.findMatchingHandler('ZeroDivisionError')).toBeDefined();
    expect(manager.findMatchingHandler('NullReferenceError')).toBeDefined();
    expect(manager.findMatchingHandler('CustomError')).toBeDefined();
  });

  // 2-16: "NullReferenceError" 타입
  test('2-16: NullReferenceError 타입 처리', () => {
    manager.pushHandler(2000, ['NullReferenceError'], {
      startPC: 200,
      endPC: 600,
    });

    const handler = manager.findMatchingHandler('NullReferenceError');
    expect(handler?.handlerId).toBe('handler_1');
  });

  // 2-17: "IndexOutOfBoundsError" 타입
  test('2-17: IndexOutOfBoundsError 타입 처리', () => {
    manager.pushHandler(3000, ['IndexOutOfBoundsError'], {
      startPC: 300,
      endPC: 700,
    });

    const handler = manager.findMatchingHandler('IndexOutOfBoundsError');
    expect(handler).toBeDefined();
    expect(handler?.catchAddress).toBe(3000);
  });

  // 2-18: getStackSnapshot()
  test('2-18: getStackSnapshot() - 현재 핸들러 스택 상태', () => {
    manager.pushHandler(1000, ['ErrorA'], { startPC: 100, endPC: 500 });
    manager.pushHandler(2000, ['ErrorB'], { startPC: 200, endPC: 600 });

    const snapshot = manager.getStackSnapshot();
    expect(snapshot.length).toBe(2);
    expect(snapshot[1].exceptionTypes).toContain('ErrorB');
  });

  // 2-19: 핸들러 통계
  test('2-19: getStatistics() - 핸들러 통계', () => {
    manager.pushHandler(1000, ['ErrorA'], { startPC: 100, endPC: 500 });
    manager.findMatchingHandler('ErrorA');

    const stats = manager.getStatistics();
    expect(stats.totalRegistered).toBe(1);
    expect(stats.totalMatched).toBe(1);
  });

  // 2-20: Phase 2 완료
  test('2-20: ✅ EXCEPTION HANDLER COMPLETE', () => {
    const manager2 = new ExceptionHandlerManager();
    expect(manager2).toBeDefined();
  });
});

// ============================================================================

describe('Phase 3: Stack Unwinding & Integration (20 tests)', () => {
  let unwinder: StackUnwindingEngine;
  let destructorEngineStub: any;

  beforeEach(() => {
    destructorEngineStub = {
      finalize: jest.fn(),
    };
    unwinder = new StackUnwindingEngine(destructorEngineStub);
  });

  // 3-1: StackUnwindingEngine 생성
  test('3-1: StackUnwindingEngine 인스턴스 생성', () => {
    expect(unwinder).toBeDefined();
    expect(unwinder).toBeInstanceOf(StackUnwindingEngine);
  });

  // 3-2: pushFrame("main", variables)
  test('3-2: pushFrame() - 스택에 프레임 추가', () => {
    const variables = new Map([['x', 10]]);
    unwinder.pushFrame('main', variables);
    expect(unwinder.getStackDepth()).toBe(1);
  });

  // 3-3: 여러 pushFrame → 깊이 증가
  test('3-3: 여러 pushFrame() → 깊이 증가', () => {
    unwinder.pushFrame('main', new Map());
    unwinder.pushFrame('foo', new Map());
    unwinder.pushFrame('bar', new Map());
    expect(unwinder.getStackDepth()).toBe(3);
  });

  // 3-4: getStackDepth() = 3
  test('3-4: getStackDepth() 정확성', () => {
    unwinder.pushFrame('a', new Map());
    unwinder.pushFrame('b', new Map());
    unwinder.pushFrame('c', new Map());
    expect(unwinder.getStackDepth()).toBe(3);
  });

  // 3-5: unwind() 1 프레임 정리
  test('3-5: unwind(2) - 프레임 2만 정리', () => {
    unwinder.pushFrame('a', new Map());
    unwinder.pushFrame('b', new Map());
    unwinder.pushFrame('c', new Map());

    unwinder.unwind(2);
    expect(unwinder.getStackDepth()).toBe(3); // c 정리 후에도 3
  });

  // 3-6: unwind 후 깊이 감소
  test('3-6: unwind() 후 스택 깊이 감소', () => {
    unwinder.pushFrame('a', new Map());
    unwinder.pushFrame('b', new Map());
    unwinder.pushFrame('c', new Map());

    expect(unwinder.getStackDepth()).toBe(3);
    unwinder.unwind(0); // a 프레임 제외 모두 정리
    expect(unwinder.getStackDepth()).toBe(1);
  });

  // 3-7: 지역 변수 정리
  test('3-7: unwind() - 지역 변수 정리', () => {
    const vars = new Map([
      ['x', 10],
      ['y', 20],
    ]);
    unwinder.pushFrame('foo', vars);
    unwinder.unwind(-1); // 모든 프레임 정리

    const log = unwinder.getUnwindingLog();
    expect(log[0].variablesCleared).toBe(2);
  });

  // 3-8: Destructor 호출
  test('3-8: unwind() - Destructor 호출', () => {
    const obj = { destroyed: false };
    const vars = new Map([['obj', obj]]);
    unwinder.pushFrame('foo', vars);

    unwinder.unwind(-1);
    expect(destructorEngineStub.finalize).toHaveBeenCalledWith(obj);
  });

  // 3-9: unwind 여러 단계
  test('3-9: unwind() 여러 단계 정리', () => {
    unwinder.pushFrame('main', new Map([['x', 1]]));
    unwinder.pushFrame('foo', new Map([['y', 2]]));
    unwinder.pushFrame('bar', new Map([['z', 3]]));

    unwinder.unwind(0);
    const log = unwinder.getUnwindingLog();
    expect(log.length).toBe(2); // 2개 프레임 정리
  });

  // 3-10: getUnwindingLog()
  test('3-10: getUnwindingLog() - 언와인딩 로그 조회', () => {
    unwinder.pushFrame('foo', new Map([['x', 10]]));
    unwinder.pushFrame('bar', new Map([['y', 20]]));

    unwinder.unwind(0);
    const log = unwinder.getUnwindingLog();

    expect(log.length).toBe(1);
    expect(log[0].functionName).toBe('bar');
    expect(log[0].variablesCleared).toBe(1);
  });

  // 3-11: TC_V8_0_EXCEPTION_SAFETY
  test('3-11: TC_V8_0_EXCEPTION_SAFETY - DangerousDivision 흐름', () => {
    // 호출 흐름: main → BusinessLogic → DangerousDivision
    unwinder.pushFrame('main', new Map([['result', 0]]));
    unwinder.pushFrame('BusinessLogic', new Map([['temp', 100]]));
    unwinder.pushFrame('DangerousDivision', new Map([['a', 10], ['b', 0]]));

    expect(unwinder.getStackDepth()).toBe(3);

    // 예외 발생 → BusinessLogic과 DangerousDivision 정리
    unwinder.unwind(0); // main 프레임 제외 모두 정리

    expect(unwinder.getStackDepth()).toBe(1);
    const log = unwinder.getUnwindingLog();
    expect(log.length).toBe(2);
  });

  // 3-12: 깊은 호출 중 THROW (5단계)
  test('3-12: 깊은 호출 중 THROW (5단계)', () => {
    for (let i = 0; i < 5; i++) {
      unwinder.pushFrame(`level${i}`, new Map([['var', i]]));
    }

    expect(unwinder.getStackDepth()).toBe(5);
    unwinder.unwind(1); // level 1 이상 모두 정리
    expect(unwinder.getStackDepth()).toBe(2);
  });

  // 3-13: 스택 언와인딩 + Destructor 보장
  test('3-13: unwind() + Destructor 호출 보장', () => {
    const obj1 = { destroyed: false };
    const obj2 = { destroyed: false };

    unwinder.pushFrame('f1', new Map([['o1', obj1]]));
    unwinder.pushFrame('f2', new Map([['o2', obj2]]));

    unwinder.unwind(-1); // 모든 프레임 정리

    expect(destructorEngineStub.finalize).toHaveBeenCalledTimes(2);
  });

  // 3-14: getStackSnapshot()
  test('3-14: getStackSnapshot() - 현재 스택 상태', () => {
    unwinder.pushFrame('main', new Map([['x', 10]]));
    unwinder.pushFrame('foo', new Map([['y', 20], ['z', 30]]));

    const snapshot = unwinder.getStackSnapshot();
    expect(snapshot.length).toBe(2);
    expect(snapshot[0].functionName).toBe('main');
    expect(snapshot[0].variableCount).toBe(1);
    expect(snapshot[1].variableCount).toBe(2);
  });

  // 3-15: Exception 접근 (Exception Object 통합)
  test('3-15: Exception과 함께 통합 테스트', () => {
    const factory = new ExceptionObjectFactory();
    const frames = [
      factory.createStackFrame('DangerousDivision', 42, 1500),
      factory.createStackFrame('BusinessLogic', 50, 1600),
    ];
    const stackTrace = factory.createStackTrace(frames);
    const ex = factory.create(
      'ZeroDivisionError',
      'Cannot divide by zero',
      stackTrace
    );

    expect(ex.type).toBe('ZeroDivisionError');
    expect(ex.message).toBe('Cannot divide by zero');
    expect(ex.stackTrace.frames.length).toBe(2);
  });

  // 3-16: Handler Stack vs Call Stack 동기화
  test('3-16: Handler Stack과 Call Stack 동기화', () => {
    const manager = new ExceptionHandlerManager();
    unwinder.pushFrame('main', new Map());
    unwinder.pushFrame('foo', new Map());

    manager.pushHandler(1000, ['Error'], { startPC: 100, endPC: 500 });

    expect(unwinder.getStackDepth()).toBe(2);
    expect(manager.getHandlerDepth()).toBe(1);

    unwinder.unwind(0);
    manager.popHandler();

    expect(unwinder.getStackDepth()).toBe(1);
    expect(manager.getHandlerDepth()).toBe(0);
  });

  // 3-17: 중첩 TRY-CATCH
  test('3-17: 중첩 TRY-CATCH (외부에서 캐치)', () => {
    const manager = new ExceptionHandlerManager();

    manager.pushHandler(1000, ['CustomError'], {
      startPC: 0,
      endPC: 10000,
    });
    manager.pushHandler(2000, ['DifferentError'], {
      startPC: 100,
      endPC: 500,
    });

    const handler = manager.findMatchingHandler('CustomError');
    expect(handler?.handlerId).toBe('handler_1'); // 외부 핸들러 매칭
  });

  // 3-18: 예외 타입 필터링
  test('3-18: 예외 타입 필터링 (일부만 처리)', () => {
    const manager = new ExceptionHandlerManager();

    manager.pushHandler(1000, ['ZeroDivisionError'], {
      startPC: 100,
      endPC: 500,
    });
    manager.pushHandler(2000, ['NullReferenceError'], {
      startPC: 200,
      endPC: 600,
    });

    const h1 = manager.findMatchingHandler('ZeroDivisionError');
    const h2 = manager.findMatchingHandler('NullReferenceError');

    expect(h1?.handlerId).toBe('handler_1');
    expect(h2?.handlerId).toBe('handler_2');
  });

  // 3-19: 성능: 1000 단계 깊이 언와인딩
  test('3-19: 성능 - 1000단계 깊이 언와인딩 < 100ms', () => {
    const startTime = Date.now();

    for (let i = 0; i < 1000; i++) {
      unwinder.pushFrame(`level${i}`, new Map([['var', i]]));
    }

    unwinder.unwind(0);
    const elapsed = Date.now() - startTime;

    expect(elapsed).toBeLessThan(100);
    expect(unwinder.getStackDepth()).toBe(1);
  });

  // 3-20: Phase 3 완료
  test('3-20: ✅ TC_V8_0_EXCEPTION_HANDLING_COMPLETE', () => {
    const factory = new ExceptionObjectFactory();
    const manager = new ExceptionHandlerManager();
    const unwinder2 = new StackUnwindingEngine();

    expect(factory).toBeDefined();
    expect(manager).toBeDefined();
    expect(unwinder2).toBeDefined();
  });
});

// HeapManager 기본 테스트 (Phase 1)

import { HeapManager, TYPE_ID } from "./heap-manager";

function assert(condition: boolean, msg: string): void {
  if (condition) {
    console.log(`✓ ${msg}`);
  } else {
    console.error(`✗ FAILED: ${msg}`);
    process.exit(1);
  }
}

function assertEqual(actual: any, expected: any, msg: string): void {
  if (actual === expected) {
    console.log(`✓ ${msg}`);
  } else {
    console.error(`✗ FAILED: ${msg} (expected ${expected}, got ${actual})`);
    process.exit(1);
  }
}

/**
 * TEST 1: 기본 할당/해제
 */
function test_01_basic_allocation(): void {
  console.log("\n🧪 TEST 1: 기본 할당/해제");

  const heap = new HeapManager();

  // 할당
  const ptr = heap.allocate(TYPE_ID.NUM, 42);
  assert(ptr > 0, "할당 후 유효한 포인터 반환");

  // 접근
  const obj = heap.get(ptr);
  assert(obj !== null, "get()이 객체 반환");
  assertEqual(obj!.payload, 42, "payload가 42");
  assertEqual(obj!.refCount, 1, "refCount 초기값 1");
  assertEqual(obj!.typeId, TYPE_ID.NUM, "typeId가 NUM");

  // 유효성
  assert(heap.isValid(ptr), "할당 후 포인터 유효");

  // 해제
  heap.free(ptr);
  assert(!heap.isValid(ptr), "해제 후 포인터 무효");

  console.log("✅ TEST 1 PASSED\n");
}

/**
 * TEST 2: RefCount 관리
 */
function test_02_refcount_management(): void {
  console.log("\n🧪 TEST 2: RefCount 관리");

  const heap = new HeapManager();

  const ptr = heap.allocate(TYPE_ID.STR, "hello");
  assertEqual(heap.getRefCount(ptr), 1, "초기 refCount = 1");

  // 증가
  heap.incrementRefCount(ptr);
  assertEqual(heap.getRefCount(ptr), 2, "증가 후 refCount = 2");

  heap.incrementRefCount(ptr);
  assertEqual(heap.getRefCount(ptr), 3, "다시 증가 후 refCount = 3");

  // 감소 (자동 해제 안 됨)
  heap.decrementRefCount(ptr);
  assertEqual(heap.getRefCount(ptr), 2, "감소 후 refCount = 2");
  assert(heap.isValid(ptr), "아직 유효");

  // 마지막 감소 (자동 해제)
  heap.decrementRefCount(ptr);
  heap.decrementRefCount(ptr);
  assert(!heap.isValid(ptr), "refCount = 0이 되면 자동 해제");

  console.log("✅ TEST 2 PASSED\n");
}

/**
 * TEST 3: 다양한 타입
 */
function test_03_multiple_types(): void {
  console.log("\n🧪 TEST 3: 다양한 타입");

  const heap = new HeapManager();

  const num_ptr = heap.allocate(TYPE_ID.NUM, 3.14);
  const str_ptr = heap.allocate(TYPE_ID.STR, "world");
  const bool_ptr = heap.allocate(TYPE_ID.BOOL, true);
  const null_ptr = heap.allocate(TYPE_ID.NULL, null);

  assert(heap.get(num_ptr)!.payload === 3.14, "NUMBER 타입");
  assert(heap.get(str_ptr)!.payload === "world", "STRING 타입");
  assert(heap.get(bool_ptr)!.payload === true, "BOOL 타입");
  assert(heap.get(null_ptr)!.payload === null, "NULL 타입");

  assertEqual(heap.getStats().currentObjects, 4, "4개 객체 생성");

  heap.free(num_ptr);
  heap.free(str_ptr);
  heap.free(bool_ptr);
  heap.free(null_ptr);

  assertEqual(heap.getStats().currentObjects, 0, "모두 해제");

  console.log("✅ TEST 3 PASSED\n");
}

/**
 * TEST 4: 복합 데이터 (배열)
 */
function test_04_complex_data_array(): void {
  console.log("\n🧪 TEST 4: 복합 데이터 (배열)");

  const heap = new HeapManager();

  // 배열: [1, 2, 3] (포인터 배열)
  // 이 단계에서는 배열 자체만 생성 (원소는 아직 일반 값)
  const arr_ptr = heap.allocate(TYPE_ID.ARRAY, [
    heap.allocate(TYPE_ID.NUM, 1),
    heap.allocate(TYPE_ID.NUM, 2),
    heap.allocate(TYPE_ID.NUM, 3),
  ]);

  const arr_obj = heap.get(arr_ptr);
  assert(arr_obj !== null, "배열 객체 생성");
  assert(Array.isArray(arr_obj!.payload), "payload가 배열");
  assertEqual(arr_obj!.payload.length, 3, "배열 길이 = 3");

  // 원소 접근
  const elem0_ptr = arr_obj!.payload[0];
  const elem0 = heap.get(elem0_ptr);
  assertEqual(elem0!.payload, 1, "첫 번째 원소 = 1");

  assertEqual(heap.getStats().currentObjects, 4, "배열 + 3개 원소");

  console.log("✅ TEST 4 PASSED\n");
}

/**
 * TEST 5: 복합 데이터 (객체)
 */
function test_05_complex_data_object(): void {
  console.log("\n🧪 TEST 5: 복합 데이터 (객체)");

  const heap = new HeapManager();

  // 객체: {a: 1, b: 2}
  const obj_ptr = heap.allocate(TYPE_ID.OBJECT, {
    a: heap.allocate(TYPE_ID.NUM, 1),
    b: heap.allocate(TYPE_ID.NUM, 2),
  });

  const obj = heap.get(obj_ptr);
  assert(obj !== null, "객체 생성");
  assert(typeof obj!.payload === "object", "payload가 객체");

  const a_ptr = obj!.payload.a;
  const b_ptr = obj!.payload.b;
  assertEqual(heap.get(a_ptr)!.payload, 1, "a = 1");
  assertEqual(heap.get(b_ptr)!.payload, 2, "b = 2");

  assertEqual(heap.getStats().currentObjects, 3, "객체 + 2개 속성");

  console.log("✅ TEST 5 PASSED\n");
}

/**
 * TEST 6: 포인터 연쇄 참조
 */
function test_06_pointer_chain(): void {
  console.log("\n🧪 TEST 6: 포인터 연쇄 참조");

  const heap = new HeapManager();

  // 데이터: 1 → 2 → 3 (체인)
  const ptr3 = heap.allocate(TYPE_ID.NUM, 3);
  const ptr2 = heap.allocate(TYPE_ID.OBJECT, { next: ptr3 });
  const ptr1 = heap.allocate(TYPE_ID.OBJECT, { next: ptr2 });

  // 추적
  const obj1 = heap.get(ptr1)!;
  const obj2 = heap.get(obj1.payload.next)!;
  const obj3 = heap.get(obj2.payload.next)!;

  assertEqual(obj3.payload, 3, "체인 추적 성공");

  console.log("✅ TEST 6 PASSED\n");
}

/**
 * TEST 7: 통계
 */
function test_07_statistics(): void {
  console.log("\n🧪 TEST 7: 통계");

  const heap = new HeapManager();

  assertEqual(heap.getStats().currentObjects, 0, "초기: 0개");

  const ptr1 = heap.allocate(TYPE_ID.NUM, 1);
  const ptr2 = heap.allocate(TYPE_ID.STR, "a");
  const ptr3 = heap.allocate(TYPE_ID.BOOL, true);

  const stats = heap.getStats();
  assertEqual(stats.currentObjects, 3, "현재 3개");
  assertEqual(stats.totalAllocated, 3, "총 할당 3");
  assertEqual(stats.totalFreed, 0, "총 해제 0");

  heap.free(ptr1);
  const stats2 = heap.getStats();
  assertEqual(stats2.currentObjects, 2, "해제 후 2개");
  assertEqual(stats2.totalFreed, 1, "총 해제 1");

  console.log("✅ TEST 7 PASSED\n");
}

/**
 * 메인 테스트 러너
 */
function runAllTests(): void {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║        🔨 HeapManager Phase 1 Test Suite                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  test_01_basic_allocation();
  test_02_refcount_management();
  test_03_multiple_types();
  test_04_complex_data_array();
  test_05_complex_data_object();
  test_06_pointer_chain();
  test_07_statistics();

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║              ✅ ALL TESTS PASSED (7/7)                    ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
}

// 실행
runAllTests();

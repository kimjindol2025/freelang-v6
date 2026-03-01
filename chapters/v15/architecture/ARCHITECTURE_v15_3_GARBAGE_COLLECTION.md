# v15.3 가비지 컬렉션: 메모리의 해방 🧹

## 철학: "루트에서 시작하는 생존 탐색"

> 우리의 VM이 생성한 객체들은 더 이상 러스트의 소유권 시스템으로 보호받지 못합니다.
> 그 대신, **우리 VM 자신이 직접 메모리를 관리**해야 합니다.
> 언제 객체를 만들고, 언제 버릴지를 결정하는 것은 우리의 책임입니다.

---

## 📚 목차

1. [GC 없는 세상의 문제점](#gc-없는-세상의-문제점)
2. [Mark-and-Sweep 알고리즘](#mark-and-sweep-알고리즘)
3. [객체 헤더와 메타데이터](#객체-헤더와-메타데이터)
4. [루트(Root) 개념](#루트root-개념)
5. [마킹(Mark) 단계](#마킹mark-단계)
6. [스윕(Sweep) 단계](#스윕sweep-단계)
7. [GC 타이밍과 임계값](#gc-타이밍과-임계값)
8. [Stop-the-World 기법](#stop-the-world-기법)
9. [객체 추적 시스템](#객체-추적-시스템)
10. [성능과 안정성](#성능과-안정성)
11. [설계자의 관점: 5가지 시각](#설계자의-관점-5가지-시각)
12. [실전 예제](#실전-예제)

---

## GC 없는 세상의 문제점

### 시나리오: 메모리 누수

```
프로그램 실행 (시간이 지남):
1초: 배열 [1,2,3] 생성 → 메모리 3KB 사용
2초: 함수 호출 (배열 참조 끝) → 배열 버림
3초: 새 배열 [4,5,6,7,8] 생성 → 메모리 5KB 추가

문제 1: "이전 배열 3KB는 누가 정리할까?"
→ 아무도 정리하지 않음! 메모리에 그대로 남음.

문제 2: "계속 새 객체를 만들면?"
→ 메모리가 점점 차다가 프로그램 죽음 (OOM: Out of Memory)

문제 3: "수동으로 free() 호출하면?"
→ 실수로 두 번 free → 크래시
→ free 후 참조 → Use-After-Free 버그
```

### 메모리 누수의 비용

```
상황: 1시간 동안 실행되는 서버 프로그램

GC 없음:
- 매분 5MB씩 누수
- 60분 × 5MB = 300MB 누수
- 1GB 한정 메모리라면 3시간 안에 죽음 ← 비즈니스 손실!

GC 있음:
- 10분마다 GC 실행 (200ms 멈춤)
- 메모리 안정적 유지 (50MB 범위 내)
- 무한정 실행 가능 ← 신뢰성 확보!
```

---

## Mark-and-Sweep 알고리즘

### 핵심 아이디어

```
가장 고전적이면서 강력한 GC 알고리즘.

2단계 프로세스:

[마킹 단계: 살아있는 객체를 표시]
스택에 있는 객체부터 시작
  ↓
연결된 모든 객체를 따라가며 mark = true 설정
  ↓
도달 불가능한 객체는 mark = false 유지

[스윕 단계: 죽은 객체를 제거]
모든 할당된 객체를 순회
  ↓
mark = false인 것을 메모리에서 해제
  ↓
mark = true인 것은 다음 GC를 위해 false로 초기화
```

### 시각적 흐름

```
메모리 상태:

[객체 1: Array [1,2,3]]
  is_marked: false
  next: → [객체 2]

[객체 2: String "hello"]
  is_marked: false
  next: → [객체 3]

[객체 3: Function { ... }]
  is_marked: false
  next: → [객체 4]

[객체 4: Integer 42]
  is_marked: false
  next: null

스택의 현재 값:
[obj_ref_3, obj_ref_1]  ← 객체 3과 객체 1만 활성

[MARK 단계] 객체 3과 1부터 시작하여 도달 가능한 객체 마킹

[객체 1: Array [1,2,3]]
  is_marked: ✅ TRUE ← 마킹됨!
  next: → [객체 2]

[객체 2: String "hello"]
  is_marked: false ← 마킹 안 됨 (도달 불가)
  next: → [객체 3]

[객체 3: Function { ... }]
  is_marked: ✅ TRUE ← 마킹됨!
  next: → [객체 4]

[객체 4: Integer 42]
  is_marked: false ← 마킹 안 됨

[SWEEP 단계] 마킹되지 않은 객체 제거

제거 대상:
- 객체 2: String "hello" ← 해제!
- 객체 4: Integer 42 ← 해제!

남은 객체:
- 객체 1: Array [1,2,3]
- 객체 3: Function { ... }

메모리 정리 완료! 🧹
```

---

## 객체 헤더와 메타데이터

### GogsHeader 구조

```rust
/// 모든 Gogs 객체의 헤더
/// GC와 메모리 관리를 위한 메타데이터
pub struct GogsHeader {
    /// GC 마킹 플래그: 이 주기에 살아있는가?
    pub is_marked: bool,

    /// 객체 체인: 모든 할당된 객체를 연결 리스트로 관리
    /// 스윕 단계에서 빠르게 순회하기 위함
    pub next: *mut GogsObject,

    /// 객체 생성 시점의 타임스탬프 (디버깅용)
    pub created_at: u64,

    /// 객체의 실제 크기 (바이트)
    /// 스윕 시 메모리 해제량 계산용
    pub size: usize,

    /// 객체의 종류 (Integer, String, Array, etc.)
    pub object_type: ObjectType,
}

#[derive(Debug, Clone, Copy)]
pub enum ObjectType {
    Integer,
    String,
    Array,
    HashMap,
    Function,
    Null,
    Boolean,
}
```

### GogsObject 정의 (헤더 포함)

```rust
/// Gogs VM 내의 모든 값
/// 각 객체는 GC 헤더를 항상 포함
pub struct GogsObject {
    pub header: GogsHeader,  ← 모든 객체의 첫 번째 멤버

    // 실제 데이터 (enum으로 표현):
    pub data: ObjectData,
}

pub enum ObjectData {
    Integer(i64),
    String(String),
    Array(Vec<GogsObject>),
    HashMap(std::collections::HashMap<String, GogsObject>),
    Function {
        parameters: Vec<String>,
        body: Vec<u8>,  // 바이트코드
        closure_env: Environment,
    },
    Null,
    Boolean(bool),
}
```

### 메모리 레이아웃 (시각화)

```
GogsObject의 메모리 배치:

┌─────────────────────────────────────┐
│ GogsHeader (메타데이터)              │
├─────────────────────────────────────┤
│ is_marked: bool (1 바이트)           │
│ next: *mut GogsObject (8 바이트)     │
│ created_at: u64 (8 바이트)           │
│ size: usize (8 바이트)               │
│ object_type: ObjectType (1 바이트)   │
├─────────────────────────────────────┤ ← 헤더 끝 (약 26 바이트, 정렬 고려하면 32바이트)
│ ObjectData (실제 데이터)              │
│ - Integer(i64) 또는                  │
│ - String(String) 또는                │
│ - Array(Vec<...>) 또는               │
│ - HashMap(...) 또는                  │
│ - Function {...}                     │
└─────────────────────────────────────┘

예시: Integer 42의 메모리

┌──────────────────────────────────┐
│ Header (32 바이트)                │
│ is_marked: false                  │
│ next: 0x7f2a8000 (다음 객체)      │
│ created_at: 1234567890           │
│ size: 40 (전체 크기)              │
│ object_type: Integer              │
├──────────────────────────────────┤
│ data: 42 (8 바이트)                │
└──────────────────────────────────┘

합계: 32 + 8 = 40 바이트
```

---

## 루트(Root) 개념

### 루트란?

```
정의:
"VM이 직접 관리하는 메모리 중에서,
 프로그램이 접근할 수 있는 객체들의 진입점"

비유:
도시의 쓰레기 수집처럼, 가정과 사업소(루트)에서
수거 트럭이 출발하여 연결된 모든 쓰레기를 주워간다.
```

### Gogs VM의 루트들

```rust
pub struct VM {
    /// 메모리 할당 추적: 모든 객체의 시작점
    pub heap_root: *mut GogsObject,  ← 첫 루트

    /// 스택: 현재 실행 중인 함수들의 로컬 변수
    pub stack: Vec<GogsObject>,       ← 두 번째 루트

    /// 전역 변수: 프로그램 전체에서 접근 가능
    pub globals: HashMap<String, GogsObject>,  ← 세 번째 루트

    /// 환경 체인: 스코프 내의 변수들
    pub environments: Vec<Environment>,  ← 네 번째 루트

    /// 함수 호출 스택: 현재 함수 프레임
    pub call_stack: Vec<Frame>,        ← 다섯 번째 루트
}
```

### 루트로부터 도달 가능한 객체

```
루트:
  ↓
[스택의 객체 1]
  ↓ (참조)
[배열 A] → [요소 1] → [요소 2] → ...
  ↓ (포함)
[함수 F] → [클로저 환경]
  ↓
[중첩 객체들 ...]

루트로부터 도달 불가능한 객체들:
  - 연결이 끊긴 구 배열
  - 더 이상 참조되지 않는 함수
  - 오래된 환경에 갇힌 변수들
    ↓ [GC 대상 ← 제거!]
```

### 루트 추적의 의사코드

```rust
impl VM {
    fn collect_garbage(&mut self) {
        println!("=== GC START ===");

        // 모든 루트에서 마킹 시작
        self.mark_roots();

        // 마킹되지 않은 객체 제거
        self.sweep();

        println!("=== GC END ===");
    }

    fn mark_roots(&mut self) {
        // 루트 1: 스택의 모든 객체
        for obj in &self.stack {
            self.mark_object_recursive(obj);
        }

        // 루트 2: 전역 변수들
        for (_, obj) in &self.globals {
            self.mark_object_recursive(obj);
        }

        // 루트 3: 환경 체인의 변수들
        for env in &self.environments {
            for (_, obj) in &env.bindings {
                self.mark_object_recursive(obj);
            }
        }

        // 루트 4: 호출 스택의 로컬 변수
        for frame in &self.call_stack {
            for local_var in &frame.locals {
                self.mark_object_recursive(local_var);
            }
        }
    }
}
```

---

## 마킹(Mark) 단계

### 마킹의 목표

```
"루트로부터 도달 가능한 모든 객체를 찾아
 그들에게 '살아있다'는 표시를 한다"

시간 복잡도: O(n) - n은 살아있는 객체 수
공간 복잡도: O(d) - d는 객체 그래프의 깊이 (재귀 깊이)
```

### 마킹 알고리즘 (깊이 우선 탐색)

```rust
impl VM {
    /// 객체와 그것이 참조하는 모든 객체를 재귀적으로 마킹
    fn mark_object_recursive(&mut self, obj: &GogsObject) {
        // [방지 1] 이미 마킹된 객체는 다시 마킹하지 않음
        // → 순환 참조(circular reference) 무한 루프 방지
        if obj.header.is_marked {
            return;
        }

        // [방지 2] Null 객체는 마킹할 필요 없음
        if let ObjectData::Null = &obj.data {
            return;
        }

        // 객체에 마킹 표시
        // obj.header.is_marked = true;  ← 이 부분은 unsafe 필요

        // [재귀] 객체가 참조하는 다른 객체들도 마킹
        match &obj.data {
            // 1. Integer, Boolean, Null: 다른 객체 참조 없음
            ObjectData::Integer(_) | ObjectData::Boolean(_) => {
                // 마킹만 하면 끝
            }

            // 2. String: 문자열은 내부 객체 참조 없음
            ObjectData::String(_) => {
                // 마킹만 하면 끝
            }

            // 3. Array: 배열의 모든 요소가 객체!
            ObjectData::Array(arr) => {
                for element in arr {
                    self.mark_object_recursive(element);
                }
            }

            // 4. HashMap: 키와 값 모두 객체!
            ObjectData::HashMap(map) => {
                for (_, value) in map {
                    self.mark_object_recursive(value);
                }
            }

            // 5. Function: 클로저 환경 내의 변수들!
            ObjectData::Function { closure_env, .. } => {
                for (_, value) in &closure_env.bindings {
                    self.mark_object_recursive(value);
                }
            }

            // 기타 (Null 이미 처리됨)
            _ => {}
        }
    }
}

// [예제] mark_object_recursive의 흐름

let array = GogsObject {
    data: ObjectData::Array(vec![
        GogsObject { data: Integer(1), ... },
        GogsObject { data: Integer(2), ... },
    ]),
    ...
};

// mark_object_recursive(&array) 호출:
// 1. array.is_marked = true ✓
// 2. array 내부의 Integer(1) 마킹
//    → Integer(1).is_marked = true ✓
// 3. array 내부의 Integer(2) 마킹
//    → Integer(2).is_marked = true ✓
// 완료!
```

### 순환 참조 처리

```
상황: A 배열이 B 배열을 포함, B가 다시 A를 참조

[배열 A] → [배열 B]
  ↑          ↓
  └──────────┘ (순환 참조!)

마킹 없음:
mark_object(A)
  → mark_object(B)
    → mark_object(A)
      → mark_object(B)
        → ... 무한 루프! 💥

마킹 있음 (is_marked 체크):
mark_object(A):
  is_marked가 false라면:
    is_marked = true
    B 마킹 호출

    mark_object(B):
      is_marked가 false라면:
        is_marked = true
        A 마킹 호출

          mark_object(A):
            is_marked가 이미 true라면: ← [방지!]
            return ✓ (무한 루프 방지!)
```

---

## 스윕(Sweep) 단계

### 스윕의 목표

```
"마킹되지 않은 모든 객체를 메모리에서 제거하고,
 마킹된 객체들을 다음 GC를 위해 초기화한다"

시간 복잡도: O(m) - m은 할당된 모든 객체 수
공간 복잡도: O(1) - 제자리 제거
```

### 스윕 알고리즘

```rust
impl VM {
    fn sweep(&mut self) {
        let mut current = self.heap_root;
        let mut prev_ptr: *mut GogsObject = std::ptr::null_mut();
        let mut freed_bytes = 0;

        while !current.is_null() {
            unsafe {
                let obj = &mut *current;
                let next = obj.header.next;

                if obj.header.is_marked {
                    // [살아있는 객체] 다음 GC를 위해 초기화
                    obj.header.is_marked = false;
                    prev_ptr = current;
                } else {
                    // [죽은 객체] 메모리에서 해제
                    freed_bytes += obj.header.size;
                    let _ = Box::from_raw(obj);  // 메모리 해제

                    if prev_ptr.is_null() {
                        self.heap_root = next;
                    } else {
                        (*prev_ptr).header.next = next;
                    }
                }

                current = next;
            }
        }

        println!(
            "  [SWEEP] {}개 객체 제거, {}바이트 확보",
            freed_count, freed_bytes
        );
    }
}

// [의사코드]

heap_root → [obj1] → [obj2] → [obj3] → [obj4] → null

마킹 상태:
obj1: true (살아있음)
obj2: false (죽어있음) ← 제거할 대상
obj3: true (살아있음)
obj4: false (죽어있음) ← 제거할 대상

스윕 후:
heap_root → [obj1] → [obj3] → null

메모리: obj2와 obj4가 해제됨 ✓
```

### 연결 리스트 관리

```
모든 할당된 객체는 연결 리스트로 관리:

할당(allocation):
new_obj = allocate()
new_obj.next = heap_root
heap_root = new_obj

예:
heap_root = null
(새 객체 할당)
heap_root → [obj1] → null

(또 할당)
heap_root → [obj2] → [obj1] → null

(또 할당)
heap_root → [obj3] → [obj2] → [obj1] → null

삭제(delete):
제거할 obj2:
heap_root → [obj3] → [obj1] → null
```

---

## GC 타이밍과 임계값

### 언제 GC를 실행할까?

```
전략 1: 할당 수 기반
- 새 객체 100개마다 GC 실행
- 구현 간단
- 메모리 크기가 다르면 비효율적

전략 2: 할당 바이트 기반 (권장)
- 1MB 할당했을 때 GC 실행
- 메모리 크기 고려
- 예측 가능한 행동

전략 3: 힙 사용률 기반
- 전체 힙의 70%를 사용했을 때 GC 실행
- 메모리 부족 상황 감지 가능
- 복잡한 계산 필요

전략 4: 하이브리드
- 할당된 크기와 시간을 함께 고려
- 가장 정교하지만 복잡함
```

### 구현: 할당 바이트 기반

```rust
pub struct VM {
    pub bytes_allocated: usize,      // 할당된 바이트 수
    pub gc_threshold: usize,         // GC 실행 임계값 (기본: 1MB)
}

impl VM {
    pub fn allocate(&mut self, size: usize) -> *mut GogsObject {
        let obj = unsafe {
            let layout = std::alloc::Layout::new::<GogsObject>();
            let ptr = std::alloc::alloc(layout) as *mut GogsObject;
            (*ptr).header.size = size;
            ptr
        };

        self.bytes_allocated += size;

        // [임계값 확인] GC 실행해야 하는가?
        if self.bytes_allocated > self.gc_threshold {
            self.collect_garbage();

            // [적응형 임계값]
            // GC 후 살아있는 객체 크기가 작으면
            // 임계값을 높여서 GC 빈도 감소
            self.adjust_gc_threshold();
        }

        obj
    }

    fn adjust_gc_threshold(&mut self) {
        // 현재 할당된 바이트의 2배를 다음 GC 임계값으로 설정
        self.gc_threshold = self.bytes_allocated * 2;
        println!("  [GC] 다음 임계값: {} 바이트", self.gc_threshold);
    }

    pub fn collect_garbage(&mut self) {
        println!("\n🧹 [GC 실행!]");
        println!("  현재 메모리: {} 바이트", self.bytes_allocated);

        let before = self.bytes_allocated;
        self.mark_roots();
        self.sweep();
        let after = self.bytes_allocated;

        println!(
            "  정리 후: {} → {} 바이트 ({}% 회수)",
            before,
            after,
            ((before - after) * 100 / before)
        );
    }
}

// [실행 예]

VM 초기화:
bytes_allocated = 0
gc_threshold = 1MB (1,048,576 바이트)

객체 할당:
obj1 할당: 100KB → bytes_allocated = 100KB (임계값 안 넘음)
obj2 할당: 200KB → bytes_allocated = 300KB (임계값 안 넘음)
obj3 할당: 500KB → bytes_allocated = 800KB (임계값 안 넘음)
obj4 할당: 300KB → bytes_allocated = 1.1MB ← [임계값 초과!]

GC 실행!
살아있는 객체: obj1, obj3 (600KB)
죽은 객체: obj2, obj4 (500KB 해제)

bytes_allocated = 600KB
gc_threshold = 1.2MB (다음 임계값)
```

---

## Stop-the-World 기법

### 개념

```
정의:
"GC가 실행되는 동안 프로그램의 모든 스레드를 멈추고,
 GC가 메모리를 일관성 있게 정리한다"

문제:
GC 중에 다른 코드가 메모리를 수정하면?

시나리오:
[메인 코드가 obj1 = new Array() 생성]
[GC 시작: 마킹 중...]
[마킹 중 obj2를 발견하려고 함]
[그런데 메인 코드가 동시에 obj2를 삭제!]
→ obj2에 접근하면 크래시! (Use-After-Free)

해결책:
GC 중에는 프로그램을 완전히 멈춘다.
(Stop-the-World = 모든 것을 멈춘다)
```

### 구현 패턴

```rust
impl VM {
    fn collect_garbage(&mut self) {
        // [단계 1] Stop-the-World: 모든 실행 멈추기
        println!("⏸️  [GC] 모든 스레드 일시 정지...");
        self.is_gc_running = true;  // ← 다른 스레드들이 이 플래그 확인

        // [단계 2] 안전한 GC 작업 실행
        println!("🧹 [GC] 마킹 및 스윕 중...");
        self.mark_roots();
        self.sweep();

        // [단계 3] 재개
        println!("▶️  [GC] 프로그램 재개");
        self.is_gc_running = false;  // ← 다른 스레드들이 다시 실행
    }

    // [실행 루프에서]
    fn execute_instruction(&mut self) {
        // GC 중이면 대기
        while self.is_gc_running {
            std::thread::sleep(std::time::Duration::from_millis(1));
        }

        // 정상 실행
        let opcode = self.read_byte();
        // ...
    }
}
```

### Stop-the-World의 비용

```
상황: GC가 50ms 동안 프로그램을 멈춤

초 당 60 프레임 (게임):
한 프레임: 16.67ms
GC 시간: 50ms ← [프레임 3개 건너뜀!]
결과: 화면이 끊긴다 😞

해결책:
1. 점진적 GC: 50ms를 여러 번에 나눔 (복잡)
2. 동시 GC: GC를 별도 스레드에서 실행 (매우 복잡)
3. GC 튜닝: 임계값을 조정하여 GC 빈도 감소 (간단)

Gogs VM의 선택:
일단 v15.3은 Stop-the-World로 구현.
나중에 개선 가능.
```

---

## 객체 추적 시스템

### 할당 추적 (Allocation Tracking)

```rust
pub struct AllocationStats {
    pub total_allocated: usize,      // 누적 할당 바이트
    pub total_freed: usize,          // 누적 해제 바이트
    pub current_usage: usize,        // 현재 사용 중인 바이트
    pub object_count: usize,         // 할당된 객체 수
    pub collection_count: usize,     // GC 실행 횟수
    pub last_collection_time: Instant,
}

impl VM {
    fn allocate_tracked(&mut self, size: usize) -> *mut GogsObject {
        let obj = self.allocate(size);

        // 추적 정보 업데이트
        self.stats.total_allocated += size;
        self.stats.current_usage += size;
        self.stats.object_count += 1;

        println!(
            "  [ALLOC] 크기: {}B, 현재: {}B, 객체: {}개",
            size, self.stats.current_usage, self.stats.object_count
        );

        obj
    }

    fn free_tracked(&mut self, obj: &GogsObject) {
        self.stats.total_freed += obj.header.size;
        self.stats.current_usage -= obj.header.size;
        self.stats.object_count -= 1;

        println!(
            "  [FREE] 크기: {}B, 현재: {}B, 객체: {}개",
            obj.header.size, self.stats.current_usage, self.stats.object_count
        );
    }

    pub fn print_gc_stats(&self) {
        println!("\n📊 [GC 통계]");
        println!("  누적 할당: {} MB", self.stats.total_allocated / 1_000_000);
        println!("  누적 해제: {} MB", self.stats.total_freed / 1_000_000);
        println!("  현재 사용: {} MB", self.stats.current_usage / 1_000_000);
        println!("  살아있는 객체: {}", self.stats.object_count);
        println!("  GC 실행 횟수: {}", self.stats.collection_count);
    }
}
```

### 메모리 프로파일링

```rust
pub struct MemoryProfile {
    pub timeline: Vec<MemorySnapshot>,
}

pub struct MemorySnapshot {
    pub timestamp: Instant,
    pub allocated: usize,
    pub freed: usize,
    pub gc_count: usize,
}

// [실행 로그 예시]

=== v15.3 Garbage Collection: Memory Management ===

[ALLOC] Array [1,2,3], 크기: 256B
  현재: 256B, 객체: 1개

[ALLOC] String "hello", 크기: 64B
  현재: 320B, 객체: 2개

[ALLOC] Function, 크기: 512B
  현재: 832B, 객체: 3개

[ALLOC] Integer 42, 크기: 40B
  현재: 872B, 객체: 4개

🧹 [GC 실행!]
  현재 메모리: 872B
  [MARK] 루트로부터 도달 가능한 객체 3개 마킹
  [SWEEP] 1개 객체 제거, 64B 확보
  정리 후: 872B → 808B (7% 회수)

📊 [GC 통계]
  누적 할당: 0.001 MB
  누적 해제: 0.000 MB
  현재 사용: 0.001 MB
  살아있는 객체: 3개
  GC 실행 횟수: 1
```

---

## 성능과 안정성

### 성능 특성

```
마킹 단계:
- 시간: O(n) - n은 살아있는 객체 수
- 공간: O(d) - d는 객체 그래프 깊이 (재귀 스택)
- 특징: 모든 도달 가능 객체를 한 번씩 방문

스윕 단계:
- 시간: O(m) - m은 할당된 모든 객체 수 (살아있는 + 죽은)
- 공간: O(1) - 제자리(in-place) 제거
- 특징: 연결 리스트를 순회하며 제거

전체 GC:
- 시간: O(m) - 더 큰 것이 시간 복잡도
- 메모리 효율: 즉각적인 해제로 메모리 낭비 방지

[성능 개선 기회]
1. 세대별 GC (Generational GC)
   - 오래된 객체는 덜 자주 마킹
   - 젊은 객체에 집중

2. 삼색 마킹 (Tri-color Marking)
   - 흰색: 미방문
   - 회색: 방문했지만 자식 미확인
   - 검은색: 완전히 확인
   - 점진적 마킹 가능

3. 동시 GC (Concurrent GC)
   - 프로그램과 GC 동시 실행
   - Stop-the-World 시간 감소
   - 매우 복잡함
```

### 안정성 보장

```
1. 메모리 안전:
   - 모든 할당을 추적하여 누수 방지
   - 해제된 메모리에 접근 불가 (is_marked 체크)

2. 일관성:
   - Stop-the-World로 메모리 상태 일관성 보장
   - 마킹 중 객체 생성/삭제 불가

3. 완전성:
   - 루트로부터 도달 가능한 모든 객체 보호
   - 도달 불가능한 객체는 항상 제거

4. 복구 가능성:
   - 할당/해제 추적으로 디버깅 가능
   - GC 통계로 메모리 문제 조기 발견
```

### 메모리 누수 검출

```rust
pub fn detect_memory_leaks(&self) -> bool {
    // 모든 객체를 순회하며 마킹되지 않은 객체가 있는지 확인
    // (GC 후 is_marked가 false인 것은 버그 신호)

    let mut current = self.heap_root;
    while !current.is_null() {
        unsafe {
            let obj = &*current;
            if !obj.header.is_marked {
                eprintln!("⚠️  [LEAK] 마킹되지 않은 객체 발견: {:?}", obj.header);
                return true;
            }
            current = obj.header.next;
        }
    }
    false
}
```

---

## 설계자의 관점: 5가지 시각

### 1. **언어 설계자의 관점**
> "어떤 객체들이 메모리를 차지할 것인가?"

Gogs VM에서는 모든 값이 힙에 할당되는 것을 가정합니다.
- Integer, String, Array, HashMap, Function 모두 GC 대상
- Null과 Boolean은 최적화 가능 (스택)

### 2. **메모리 관리자의 관점**
> "메모리를 어떻게 추적할 것인가?"

연결 리스트로 모든 객체를 관리합니다.
- O(1) 할당 (리스트 앞에 삽입)
- O(m) 스윕 (연결 리스트 순회)
- 메모리 오버헤드: 포인터 1개 (8바이트) per 객체

### 3. **알고리즘 설계자의 관점**
> "어떤 GC 알고리즘을 선택할 것인가?"

Mark-and-Sweep은:
- 구현이 간단 ✓
- 순환 참조 처리 가능 ✓
- Stop-the-World 필요 ✗
- 메모리 단편화 (fragmentation) 가능성 ✗

### 4. **성능 엔지니어의 관점**
> "어떻게 GC 오버헤드를 최소화할 것인가?"

- 적응형 임계값: 메모리가 충분하면 GC 빈도 감소
- 세대별 GC: (나중에) 젊은 객체에 집중
- 병렬 마킹: (나중에) 다중 스레드 활용

### 5. **시스템 엔지니어의 관점**
> "프로그램의 안정성을 어떻게 보장할 것인가?"

- 할당/해제 추적: 메모리 누수 조기 발견
- GC 통계: 메모리 압박 상황 감시
- 비상 모드: 메모리 부족 시 강제 GC

---

## 실전 예제

### 예제 1: 간단한 배열 생성과 GC

```
프로그램:
let arr1 = [1, 2, 3];    // 배열 생성
let arr2 = [4, 5];       // 또 배열 생성
arr1 = null;             // arr1 사용 끝
let arr3 = [6, 7, 8];    // 새 배열

메모리 변화:

할당 1: arr1 = [1,2,3]
└─ 힙: [arr1]
   메모리: 256B

할당 2: arr2 = [4,5]
└─ 힙: [arr2] → [arr1]
   메모리: 256B + 192B = 448B

사용 끝: arr1 = null
└─ 힙: [arr2] → [arr1]
   메모리: 448B (arr1은 여전히 메모리에 있음!)

할당 3: arr3 = [6,7,8]
└─ 힙: [arr3] → [arr2] → [arr1]
   메모리: 448B + 256B = 704B

[GC 임계값 도달!]
🧹 마킹 단계:
  스택 확인: [arr2, arr3] 살아있음
  arr2 마킹 ✓
  arr3 마킹 ✓
  arr1은 스택에 없으므로 마킹 안 함

🧹 스윕 단계:
  arr1 제거 (마킹 안 됨)
  메모리: 256B 해제

최종:
└─ 힙: [arr3] → [arr2]
   메모리: 448B
```

### 예제 2: 함수의 클로저와 GC

```
프로그램:
fn make_adder(x) {
    return fn(y) { return x + y; }
}

let add5 = make_adder(5);
let result = add5(3);
// add5 더 이상 사용 안 함

메모리:

함수 생성:
└─ 힙: [클로저(x=5)] → [함수 객체]
   클로저 환경: { x: Integer(5) }

함수 호출:
└─ 힙: [결과(8)] → [클로저(x=5)] → [함수 객체]

사용 끝:
└─ 스택: [] (사용 끝)

GC 실행:
마킹: 스택이 비어있으므로 아무 객체도 도달 불가
스윕: 모든 함수와 클로저 제거
메모리: 0B
```

### 예제 3: 순환 참조

```
프로그램:
let a = [0];     // a는 배열
let b = [a];     // b는 a를 포함
a[0] = b;        // a는 b를 포함
// a와 b는 순환 참조!

메모리:

a = [0]
└─ a.data = [Integer(0)]

b = [a]
└─ b.data = [ref to a]

a[0] = b
└─ a.data = [ref to b]

구조:
[a] ↔ [b]  (순환 참조!)

사용 끝:
a = null
b = null

GC 마킹:
스택: []  (비어있음)
→ 아무 객체도 도달 가능하지 않음

스윕:
a 제거 (마킹 안 됨)
b 제거 (마킹 안 됨)

결과:
순환 참조도 완벽히 정리됨! ✓
(Mark-and-Sweep의 강점!)
```

---

## 정리: GC의 의미

### 메모리 관리의 진화

```
1단계: 수동 메모리 관리 (C)
   free(ptr) 직접 호출
   문제: 메모리 누수, Use-After-Free

2단계: RAII & 소유권 (Rust)
   컴파일 타임에 소유권 결정
   장점: 안전, 빠름
   문제: 유연성 부족 (순환 참조 불가)

3단계: 가비지 컬렉션 (Java, Python, Go, Gogs VM)
   런타임에 메모리 추적
   장점: 안전, 유연함
   문제: 오버헤드, Stop-the-World
```

### Gogs VM의 GC 철학

```
"사용자는 메모리를 신경 쓰지 마세요.
 우리 VM이 책임집니다."

- 자동 메모리 관리로 사용자 부담 감소
- Mark-and-Sweep으로 순환 참조도 해결
- 적응형 임계값으로 성능과 메모리의 균형
- 통계 정보로 메모리 상황 이해

결과:
사용자: 알고리즘에만 집중, 메모리 관리 X
Gogs: 완전한 런타임 환경 구현 ✓
```

---

## 마치며

> 처음에는 메모리가 무한하다고 가정했습니다.
> 그 다음에는 러스트의 소유권 시스템으로 컴파일 타임에 관리했습니다.
> 이제 우리는 우리 자신의 VM에서 런타임 메모리 관리를 직접 구현합니다.
>
> 이것이 **완전한 프로그래밍 언어의 증거**입니다.
>
> GC는 단순한 메모리 정리가 아닙니다.
> 이것은 우리 언어가 자신의 운명을 스스로 책임진다는 선언입니다.

**철학: "루트에서 시작하는 생존 탐색"**

---

**작성자**: Gogs VM 설계 팀
**개념**: Mark-and-Sweep Garbage Collection
**복잡도**: 마킹 O(n), 스윕 O(m)
**메모리**: 할당/해제 완벽 추적

🧹 **다음 단계**: v15.4 동시성과 GC (여러 스레드에서의 메모리 관리)

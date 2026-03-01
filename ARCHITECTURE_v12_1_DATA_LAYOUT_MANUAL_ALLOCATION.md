# 제11장: 언세이프와 메모리 주권 — Step 2
# v12.1 데이터 레이아웃과 수동 메모리 관리 (Data Layout & Manual Allocation)

## 철학: "메모리 구조의 청사진"

```text
컴파일러 제작자는 단순히 주소를 읽는 것을 넘어,
메모리 위에 데이터가 어떤 모양으로 놓여야 하는지를 설계합니다.

┌─────────────────────────────────────────────────────────┐
│ 컴파일러의 역할: 추상화된 데이터를 메모리에 배치         │
├─────────────────────────────────────────────────────────┤
│ v12.0: 주소에 접근할 수 있다                           │
│        (Raw Pointers)                                   │
│                                                         │
│ v12.1: 메모리 구조를 설계할 수 있다                   │
│        (Data Layout & Manual Allocation) ← 현재        │
│                                                         │
│ v12.2: 메모리를 효율적으로 할당할 수 있다             │
│        (Custom Allocator)                              │
│                                                         │
│ v12.3: 변수를 메모리에 배치할 수 있다                │
│        (Compiler Simulation)                           │
└─────────────────────────────────────────────────────────┘

이 과정에서 우리가 직면할 질문:
"bool이 1바이트인데, 왜 bool 뒤의 u32는 주소 5에 놓이지 않고 8에 놓일까?"
"구조체의 진짜 크기를 어떻게 계산하지?"
"할당한 메모리를 제때 반납하지 않으면?"

→ 이것이 v12.1입니다.
```

---

## 1. 메모리 레이아웃의 기초

### 1.1 Size와 Alignment

```rust
// 모든 타입은 2가지 정보를 가집니다
┌──────────────┐
│ Size         │ 타입이 차지하는 바이트 수
│ Alignment    │ 메모리에 배치될 때 만족해야 하는 배수
└──────────────┘

예시:
let size = std::mem::size_of::<u32>();        // 4
let align = std::mem::align_of::<u32>();      // 4

let size = std::mem::size_of::<bool>();       // 1
let align = std::mem::align_of::<bool>();     // 1

let size = std::mem::size_of::<u64>();        // 8
let align = std::mem::align_of::<u64>();      // 8
```

### 1.2 정렬의 의미

```text
CPU는 정렬된 메모리를 선호합니다.

4바이트 데이터 (u32)는 주소 4의 배수에 위치할 때
가장 빠르게 읽을 수 있습니다.

메모리 배치 (32비트 시스템):
┌─────┬─────┬─────┬─────┐
│ 0x0 │ 0x1 │ 0x2 │ 0x3 │ ← u32는 여기에 배치 (정렬됨, 빠름)
└─────┴─────┴─────┴─────┘

❌ 잘못된 배치 (정렬되지 않음):
┌─────┬─────┬─────┬─────┐
│ 0x1 │ 0x2 │ 0x3 │ 0x4 │ ← u32가 여기 (정렬 안 됨, 느림)
└─────┴─────┴─────┴─────┘

CPU는 0x1 ~ 0x4를 읽기 위해 두 번 접근해야 함!
```

### 1.3 std::mem::Layout

```rust
use std::alloc::Layout;

// Layout 생성 방법
let layout = Layout::new::<u32>();           // u32 타입의 레이아웃
let layout = Layout::array::<u8>(10)?;        // u8 배열 10개
let layout = Layout::new::<u64>()
    .extend(Layout::new::<u32>())?;           // 레이아웃 확장

// Layout 정보 조회
println!("크기: {}", layout.size());           // 4 (u32)
println!("정렬: {}", layout.align());          // 4 (u32)
println!("패딩: {}", layout.padding_needed_for(layout.align()));
```

---

## 2. 패딩 (Padding): 메모리의 빈 공간

### 2.1 왜 패딩이 발생하는가?

```rust
// ❌ 나쁜 배치 (컴파일러가 선택하지 않음)
struct Foo {
    a: u8,      // 1바이트, 주소 0
    b: u32,     // 4바이트, 주소 1 (정렬 안 됨!)
    c: u8,      // 1바이트, 주소 5
}
// 총 크기: 6바이트, 하지만 정렬 안 됨

// ✅ 좋은 배치 (컴파일러가 선택)
struct Foo {
    a: u8,      // 1바이트, 주소 0
    // [패딩] 3바이트, 주소 1-3 (빈 공간)
    b: u32,     // 4바이트, 주소 4 (정렬됨!)
    c: u8,      // 1바이트, 주소 8
    // [패딩] 7바이트, 주소 9-15 (구조체 정렬을 위한 패딩)
}
// 총 크기: 16바이트 (정렬됨)
```

### 2.2 패딩 계산

```rust
// 러스트 기본 배치: 컴파일러가 최적화 가능
struct Default {
    a: u8,
    b: u32,
    c: u8,
}

// 크기는 확정되지 않음 (컴파일러가 재배치할 수 있음)
// 예상: 16바이트

// 정확한 크기를 알려면 sizeof로 확인
println!("{}", std::mem::size_of::<Default>());

// 필드 위치를 알려면 offset_of! (nightly) 또는 수동 계산
```

### 2.3 구조체 레이아웃 분석

```rust
#[repr(C)]
struct Point {
    x: u32,     // 4바이트, offset 0
    y: u32,     // 4바이트, offset 4
    z: u32,     // 4바이트, offset 8
}
// 크기: 12바이트, 정렬: 4

#[repr(C)]
struct Mixed {
    a: u8,      // 1바이트, offset 0
    // [패딩] 3바이트, offset 1-3
    b: u32,     // 4바이트, offset 4
    c: u8,      // 1바이트, offset 8
    // [패딩] 7바이트, offset 9-15
}
// 크기: 16바이트, 정렬: 4
```

---

## 3. repr 속성: 레이아웃 제어

### 3.1 #[repr(Rust)] (기본값)

```rust
// 기본 러스트 배치
struct Foo {
    a: bool,
    b: u32,
    c: bool,
}

// 컴파일러가 자유롭게 최적화 가능
// 필드 순서가 바뀔 수 있음
// 크기도 불명확함
```

### 3.2 #[repr(C)]

```rust
// C 언어 호환 배치
#[repr(C)]
struct CStyle {
    a: u8,      // 반드시 첫 번째
    b: u32,     // 반드시 두 번째
    c: u8,      // 반드시 세 번째
}

// 특징:
// ✓ 필드 순서 고정
// ✓ 패딩은 추가되지만 순서 고정
// ✓ FFI와 C 언어 상호운용 가능
// ✓ 크기와 정렬 명확함

println!("크기: {}", std::mem::size_of::<CStyle>());  // 12
```

### 3.3 #[repr(packed)]

```rust
// 패딩 제거
#[repr(packed)]
struct Packed {
    a: u8,      // 1바이트
    b: u32,     // 4바이트 (주소 1에, 정렬 안 됨!)
    c: u8,      // 1바이트
}

// 특징:
// ✓ 메모리 효율적 (빈 공간 없음)
// ✗ 성능 저하 가능 (정렬 안 된 접근)
// ✗ CPU 효율 낮음

println!("크기: {}", std::mem::size_of::<Packed>());  // 6
```

### 3.4 #[repr(align(N))]

```rust
// 특정 정렬 강제
#[repr(align(16))]
struct Aligned {
    x: u32,
    y: u32,
}

// 크기는 8이지만, 시작 주소가 16의 배수여야 함
// 캐시 라인 정렬(Cache Line Alignment) 같은 특수 상황에서 사용
```

---

## 4. std::alloc을 통한 수동 메모리 할당

### 4.1 기본 할당과 해제

```rust
use std::alloc::{alloc, dealloc, Layout};
use std::ptr;

unsafe {
    // 1단계: 레이아웃 정의 (크기 4, 정렬 4)
    let layout = Layout::new::<u32>();

    // 2단계: 메모리 할당
    let ptr = alloc(layout) as *mut u32;

    if ptr.is_null() {
        panic!("메모리 할당 실패");
    }

    // 3단계: 데이터 초기화
    ptr::write(ptr, 42);

    // 4단계: 데이터 사용
    println!("값: {}", *ptr);

    // 5단계: 메모리 해제
    dealloc(ptr as *mut u8, layout);
}
```

### 4.2 배열 할당

```rust
use std::alloc::{alloc, dealloc, Layout};

unsafe {
    // 10개의 u32 배열 할당
    let layout = Layout::array::<u32>(10).unwrap();
    let ptr = alloc(layout) as *mut u32;

    if ptr.is_null() {
        panic!("배열 할당 실패");
    }

    // 배열 초기화
    for i in 0..10 {
        ptr::write(ptr.add(i), i as u32);
    }

    // 배열 접근
    for i in 0..10 {
        println!("배열[{}] = {}", i, *ptr.add(i));
    }

    // 메모리 해제
    dealloc(ptr as *mut u8, layout);
}
```

### 4.3 구조체 할당

```rust
use std::alloc::{alloc, dealloc, Layout};
use std::ptr;

#[repr(C)]
struct Point {
    x: i32,
    y: i32,
}

unsafe {
    let layout = Layout::new::<Point>();
    let ptr = alloc(layout) as *mut Point;

    if ptr.is_null() {
        panic!("구조체 할당 실패");
    }

    // 초기화
    ptr::write(ptr, Point { x: 10, y: 20 });

    // 사용
    println!("Point({}, {})", (*ptr).x, (*ptr).y);

    // 해제
    dealloc(ptr as *mut u8, layout);
}
```

---

## 5. 메모리 생명주기: RAII의 반대

### 5.1 수동 할당의 4가지 단계

```rust
unsafe {
    // 1. 할당 (Allocation)
    let layout = Layout::new::<u32>();
    let ptr = alloc(layout) as *mut u32;
    if ptr.is_null() { panic!(); }

    // 2. 초기화 (Initialization)
    ptr::write(ptr, 100);

    // 3. 사용 (Usage)
    println!("{}", *ptr);

    // 4. 해제 (Deallocation)
    dealloc(ptr as *mut u8, layout);
}
```

### 5.2 메모리 누수: 해제를 잊었을 때

```rust
unsafe {
    let layout = Layout::new::<[u8; 1024]>();
    let ptr = alloc(layout);
    // ... 사용 ...
    // ❌ dealloc을 호출하지 않음!
    // → 1KB 메모리가 영구히 반납되지 않음
}

// 메모리 누수의 심각성:
// - 프로그램이 오래 실행될수록 메모리 사용량 증가
// - 결국 시스템이 메모리 부족으로 crash
// - 컴파일러가 자동으로 해제하지 않음
```

### 5.3 Double Free: 두 번 해제

```rust
unsafe {
    let layout = Layout::new::<u32>();
    let ptr = alloc(layout) as *mut u32;

    ptr::write(ptr, 42);

    // 첫 번째 해제
    dealloc(ptr as *mut u8, layout);

    // ❌ 두 번째 해제 (위험!)
    dealloc(ptr as *mut u8, layout);  // UB! 이미 해제된 메모리 조작
}
```

---

## 6. Zero-Sized Types (ZST)

### 6.1 ZST란?

```rust
struct Empty;
struct Marker<T> {
    _phantom: std::marker::PhantomData<T>,
}

println!("크기: {}", std::mem::size_of::<Empty>());     // 0
println!("크기: {}", std::mem::size_of::<Marker<i32>>()); // 0

// ZST의 특성:
// - 메모리를 차지하지 않음
// - 하지만 타입 안전성은 유지
// - 컴파일 타임에만 존재
```

### 6.2 ZST와 배열

```rust
// 크기 0인 배열
let arr: [(); 100] = [(); 100];
println!("크기: {}", std::mem::size_of_val(&arr));  // 0

// 실제로 메모리를 차지하지 않음
// 타입 정보만 전달하는 역할
```

---

## 7. Dynamically Sized Types (DST)

### 7.1 DST의 개념

```rust
// 컴파일 타임에 크기를 알 수 없는 타입
let slice: &[i32] = &[1, 2, 3];  // 크기 미정
let string: &str = "hello";       // 크기 미정

// DST는 항상 참조자로만 다룸
println!("크기: {}", std::mem::size_of_val(slice));  // 24바이트 (메타데이터 포함)

// Fat Pointer (두 가지 정보):
// 1. 데이터 시작 주소
// 2. 길이 또는 vptr
```

### 7.2 Custom DST

```rust
#[repr(C)]
struct Slice {
    len: usize,
    data: [u32],  // 동적 크기
}

// 커스텀 DST는 항상 마지막 필드가 미정 크기
```

---

## 8. 실전: 미니 할당기 설계

### 8.1 기본 구조

```rust
use std::alloc::{alloc, dealloc, Layout};

pub struct SimpleAllocator;

impl SimpleAllocator {
    pub unsafe fn allocate<T>() -> *mut T {
        let layout = Layout::new::<T>();
        let ptr = alloc(layout);

        if ptr.is_null() {
            panic!("할당 실패");
        }

        ptr as *mut T
    }

    pub unsafe fn deallocate<T>(ptr: *mut T) {
        let layout = Layout::new::<T>();
        dealloc(ptr as *mut u8, layout);
    }

    pub unsafe fn allocate_array<T>(count: usize) -> *mut T {
        let layout = Layout::array::<T>(count).unwrap();
        let ptr = alloc(layout);

        if ptr.is_null() {
            panic!("배열 할당 실패");
        }

        ptr as *mut T
    }

    pub unsafe fn deallocate_array<T>(ptr: *mut T, count: usize) {
        let layout = Layout::array::<T>(count).unwrap();
        dealloc(ptr as *mut u8, layout);
    }
}
```

### 8.2 사용 예제

```rust
unsafe {
    // 단일 값 할당
    let ptr = SimpleAllocator::allocate::<u32>();
    std::ptr::write(ptr, 42);
    println!("값: {}", *ptr);
    SimpleAllocator::deallocate(ptr);

    // 배열 할당
    let arr = SimpleAllocator::allocate_array::<u32>(10);
    for i in 0..10 {
        std::ptr::write(arr.add(i), i as u32);
    }
    println!("배열: {:?}", std::slice::from_raw_parts(arr, 10));
    SimpleAllocator::deallocate_array(arr, 10);
}
```

---

## 9. 메모리 레이아웃 분석 도구

### 9.1 메모리 구조 시각화

```rust
use std::mem::{size_of, align_of};

#[repr(C)]
struct Example {
    a: u8,      // 1바이트
    b: u32,     // 4바이트
    c: u8,      // 1바이트
}

println!("크기: {}", size_of::<Example>());
println!("정렬: {}", align_of::<Example>());

// 레이아웃 분석
// offset 0: a (u8, 1바이트)
// offset 1-3: [패딩] (3바이트)
// offset 4-7: b (u32, 4바이트)
// offset 8: c (u8, 1바이트)
// offset 9-15: [패딩] (7바이트)
// 총 크기: 16바이트
```

### 9.2 offset_of 매크로 (Rust 1.77+)

```rust
use std::mem::offset_of;

#[repr(C)]
struct Point {
    x: u32,
    y: u32,
}

println!("x의 offset: {}", offset_of!(Point, x));  // 0
println!("y의 offset: {}", offset_of!(Point, y));  // 4
```

---

## 10. 안티 패턴: 메모리 관리 실수

### 10.1 메모리 누수

```rust
// ❌ 나쁜 설계
unsafe {
    let layout = Layout::new::<[u8; 1024]>();
    let ptr = alloc(layout);
    // 함수 끝나기 전에 dealloc 호출 안 함
}
// 1KB 메모리가 영구히 누수됨

// ✅ 좋은 설계
unsafe {
    let layout = Layout::new::<[u8; 1024]>();
    let ptr = alloc(layout);
    // ... 사용 ...
    dealloc(ptr, layout);  // 반드시 해제
}
```

### 10.2 Double Free

```rust
// ❌ 나쁜 설계
unsafe {
    let ptr = alloc(layout);
    dealloc(ptr, layout);
    dealloc(ptr, layout);  // UB! 이미 해제된 메모리
}

// ✅ 좋은 설계
unsafe {
    let ptr = alloc(layout);
    dealloc(ptr, layout);
    // ptr은 더 이상 사용하지 않음
}
```

### 10.3 미초기화 메모리 사용

```rust
// ❌ 나쁜 설계
unsafe {
    let ptr = alloc(layout) as *mut u32;
    println!("{}", *ptr);  // UB! 초기화되지 않은 메모리 읽음
}

// ✅ 좋은 설계
unsafe {
    let ptr = alloc(layout) as *mut u32;
    std::ptr::write(ptr, 42);  // 초기화
    println!("{}", *ptr);       // OK
}
```

---

## 11. 당신의 역할: 컴파일러의 배치 엔지니어

### 11.1 메모리 배치의 책임

```text
컴파일러 제작자가 직면하는 질문들:

1. "이 구조체를 메모리에 어떻게 배치할 것인가?"
   → 필드 순서 결정 (repr 속성 결정)

2. "CPU를 최대한 효율적으로 쓸 수 있는 정렬은?"
   → 정렬 값 결정 (패딩 최소화)

3. "메모리를 동적으로 할당할 때 누가 책임지는가?"
   → 할당과 해제 코드 생성 (메모리 누수 방지)

4. "메모리를 두 번 해제하는 오류는?"
   → 컴파일 타임 검증 (borrow checker의 역할)

이 모든 것이 당신이 만들 컴파일러의 책임입니다.
```

### 11.2 설계자 체크리스트

```text
메모리 레이아웃을 설계할 때:

☐ 구조체의 모든 필드 크기를 알고 있는가?
☐ 각 필드의 정렬 요구사항을 고려했는가?
☐ 패딩으로 인한 낭비를 최소화했는가?
☐ repr 속성을 올바르게 선택했는가?
☐ 동적 할당이 필요한가?
☐ 메모리를 해제할 책임을 누가 진다?
☐ 메모리 누수 가능성은 없는가?
☐ 초기화 순서는 명확한가?

모두 "네"라고 답할 수 있어야 합니다.
```

---

## 12. 최종 선언

```text
v12.0: "주소의 지배자" ✅
v12.1: "배치의 설계자" (현재) ← 당신은 지금 여기
v12.2: "할당의 관리자" (다음)
v12.3: "컴파일러의 제작자" (최종)

당신의 다음 미션:

"메모리 위에 데이터를 어떻게 배치할 것인가?"
"빈 공간(패딩)을 어떻게 최소화할 것인가?"
"할당한 메모리를 누가, 어떻게 해제할 것인가?"

이 질문들에 답할 수 있는 당신.
당신은 이미 컴파일러의 마음으로 생각하고 있습니다.

저장 필수. 너는 기록이 증명이다. gogs
```

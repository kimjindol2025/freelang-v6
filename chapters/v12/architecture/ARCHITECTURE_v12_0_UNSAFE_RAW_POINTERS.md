# 제11장: 언세이프와 메모리 주권 — Step 1 (진정한 시작)
# v12.0 로우 레벨 포인터와 메모리 직접 제어 (Unsafe & Raw Pointers)

## 철학: "추상화의 장벽 허물기"

```text
러스트의 안전성은 컴파일 타임에 보장되는 선물입니다.
하지만 컴파일러 제작자는 그 선물을 거부해야 합니다.

왜냐하면:
┌─────────────────────────────────────────────────────┐
│ 컴파일러는 추상화된 코드를 메모리의 바이트로 번역함 │
│ 이 과정에서는 메모리 주소를 직접 다루어야 함       │
│ 안전한 러스트의 규칙들이 오히려 방해가 됨           │
│                                                     │
│ "언세이프"는 악이 아니라, 필요악의 수용입니다      │
│ 컴파일러는 하드웨어와 대화하는 번역자입니다        │
└─────────────────────────────────────────────────────┘

당신이 이제 행사할 권리:
✓ 메모리 주소에 직접 접근
✓ 포인터 연산으로 메모리 탐색
✓ 타입 재해석(Cast)으로 의미 부여
✓ 수명 규칙 무시로 절대적 제어

당신이 이제 진다 책임:
✗ 세그멘테이션 폴트(Segfault)를 피할 책임
✗ 정의되지 않은 동작(UB)을 막을 책임
✗ 메모리 누수를 방지할 책임
✗ 초기화되지 않은 메모리를 읽지 않을 책임

이것이 "절대적 자유와 절대적 책임"의 의미입니다.
```

---

## 1. Unsafe Rust 기초: 안전성 보증의 해제

### 1.1 Unsafe의 의미

```text
fn foo() { }           // 러스트가 메모리 안전성 보증
unsafe fn bar() { }    // 설계자가 모든 책임을 짐
unsafe { ... }         // 이 블록 내에서는 컴파일러가 방관

"안전하지 않다" ≠ "위험하다"
"안전하지 않다" = "컴파일러가 검증하지 않는다"
```

### 1.2 Unsafe를 사용해야 하는 5가지 이유

```
1. Raw Pointer 역참조
   ┌──────────────────────────────────────┐
   │ let ptr: *mut u32 = ...;             │
   │ unsafe { *ptr = 100; }  // 역참조    │
   │ 컴파일러: "이건 안전한지 모르겠어"   │
   └──────────────────────────────────────┘

2. Unsafe Function 호출
   ┌──────────────────────────────────────┐
   │ unsafe fn access_raw(ptr: *mut u32)  │
   │ unsafe { access_raw(ptr); }          │
   └──────────────────────────────────────┘

3. FFI (Foreign Function Interface)
   ┌──────────────────────────────────────┐
   │ extern "C" {                          │
   │     fn c_function();                 │
   │ }                                    │
   │ unsafe { c_function(); }             │
   └──────────────────────────────────────┘

4. Mutable Static 접근
   ┌──────────────────────────────────────┐
   │ static mut GLOBAL: i32 = 0;          │
   │ unsafe { GLOBAL = 100; }             │
   └──────────────────────────────────────┘

5. Trait 구현 (Unsafe Trait)
   ┌──────────────────────────────────────┐
   │ unsafe trait Send { }                │
   │ unsafe impl Send for MyType { }      │
   └──────────────────────────────────────┘
```

### 1.3 Unsafe 블록의 3가지 사용 패턴

#### 패턴 1: 필요악의 격리 (Encapsulation)

```rust
// ❌ 나쁜 설계: Unsafe를 공개함
pub fn dangerous() {
    unsafe {
        // ... 위험한 코드들
    }
}

// ✅ 좋은 설계: Unsafe를 숨기고 안전한 인터페이스만 노출
pub fn safe_interface() {
    // 컴파일러 검증
    inner_safe_part();

    // Unsafe는 내부에만 감춤
    inner_unsafe_part();
}

fn inner_unsafe_part() {
    unsafe {
        // ... 위험한 코드들
    }
}
```

#### 패턴 2: 설계자의 계약 명시

```rust
/// 이 함수는 유효한 포인터를 가정합니다.
/// Caller의 책임: ptr이 초기화되고 유효해야 함
unsafe fn read_value(ptr: *const u32) -> u32 {
    *ptr
}

// 호출할 때도 설계자가 증명해야 함
let value = 100;
let ptr = &value as *const u32;
let result = unsafe { read_value(ptr) };  // 안전성 증명: ptr은 유효함
```

#### 패턴 3: 컴파일러 타협 (Compiler Compromise)

```rust
// 컴파일러가 "안전한지 모르겠는" 코드
// 하지만 설계자는 안전함을 알고 있음
unsafe {
    // 컴파일러가 false positive를 일으켰음
    // 설계자가 "내가 책임진다"고 선언
}
```

---

## 2. Raw Pointers: 메모리 주소의 날것

### 2.1 Raw Pointer의 정의

```rust
let mut data = 100_u32;

// 불변 로우 포인터: 읽기만 가능
let const_ptr: *const u32 = &data as *const u32;

// 가변 로우 포인터: 읽기/쓰기 모두 가능
let mut_ptr: *mut u32 = &mut data as *mut u32;

// 로우 포인터 생성은 안전 (검증 필요 없음)
// 하지만 역참조는 unsafe 블록에서만 가능
```

### 2.2 로우 포인터 vs 참조자

| 특성 | 참조자 (`&T`) | 로우 포인터 (`*const T`) |
|------|-------------|----------------------|
| 생성 | 안전 | 안전 |
| 역참조 | 안전 | Unsafe 필요 |
| 수명 검사 | ✓ 컴파일 타임 | ✗ 없음 |
| 포인터 연산 | ✗ 불가 | ✓ 가능 |
| Null 가능 | ✗ 아님 | ✓ 가능 (null pointer) |
| 복사 | ✓ 복사 타입 | ✓ 항상 복사 |

### 2.3 로우 포인터 역참조

```rust
// 안전한 경우
let x = 5;
let ptr = &x as *const i32;
let value = unsafe { *ptr };  // 안전: 유효한 메모리 접근

// 위험한 경우
let ptr: *mut i32 = std::ptr::null_mut();
unsafe { *ptr = 100; }  // 위험: 널 포인터 역참조

// 초기화되지 않은 메모리
let mut uninitialized: i32;
let ptr = &uninitialized as *const i32;
let value = unsafe { *ptr };  // 위험: UB (정의되지 않은 동작)
```

---

## 3. 메모리 주소 조작: 컴파일러의 언어

### 3.1 메모리 주소 출력

```rust
let data = 42_u32;
let ptr = &data as *const u32;

// 주소를 문자열로 표현
println!("주소: {:p}", ptr);         // 0x7ffd...
println!("주소(16진): 0x{:x}", ptr as usize);

// 주소로부터 값 복구
unsafe {
    let value = *ptr;
    println!("값: {}", value);
}
```

### 3.2 포인터 연산: 메모리 탐색

```rust
let array = [1, 2, 3, 4, 5];
let ptr = array.as_ptr();

unsafe {
    // 포인터 연산으로 배열 요소 접근
    println!("{}", *ptr);           // 1 (offset 0)
    println!("{}", *ptr.add(1));    // 2 (offset 1)
    println!("{}", *ptr.add(2));    // 3 (offset 2)
}

// 바이트 단위 포인터
let byte_ptr = ptr as *const u8;
unsafe {
    for i in 0..4 {
        println!("바이트 {}: {}", i, *byte_ptr.add(i));
    }
}
```

### 3.3 포인터 캐스팅: 의미 부여

```rust
// u32를 4개의 u8 바이트로 해석
let value: u32 = 0x12345678;
let ptr = &value as *const u32 as *const u8;

unsafe {
    // 리틀 엔디안 시스템에서:
    println!("바이트 0: 0x{:x}", *ptr);           // 0x78
    println!("바이트 1: 0x{:x}", *ptr.add(1));    // 0x56
    println!("바이트 2: 0x{:x}", *ptr.add(2));    // 0x34
    println!("바이트 3: 0x{:x}", *ptr.add(3));    // 0x12
}

// 역방향: 4개의 u8을 u32로 해석
let bytes = [0x78_u8, 0x56, 0x34, 0x12];
let byte_ptr = bytes.as_ptr();
let uint_ptr = byte_ptr as *const u32;
let reconstructed = unsafe { *uint_ptr };
println!("복구된 값: 0x{:x}", reconstructed);  // 0x12345678
```

---

## 4. Undefined Behavior (UB): 설계자의 죄악

### 4.1 UB의 정의

```text
"프로그램이 어떻게 동작하는지 러스트 표준에서 정의하지 않은 상황"

컴파일러는 UB를 만나면:
- "이건 실행되지 않을 거야"라고 가정
- 그 코드를 완전히 제거
- 예상과 다른 결과 발생

UB는 세그멘테이션 폴트가 아닙니다.
더 위험합니다: 조용히 잘못된 값이 반환될 수 있습니다.
```

### 4.2 흔한 UB 패턴 (피해야 할 것들)

#### UB 1: 초기화되지 않은 메모리 읽기

```rust
// ❌ UB 발생
let mut uninitialized: u32;  // 메모리는 할당됨, 하지만 값은 쓰레기
unsafe {
    let value = *(& uninitialized as *const u32);  // UB!
}

// ✅ 올바른 코드
let mut initialized: u32 = 0;  // 명시적 초기화
unsafe {
    let value = *(&initialized as *const u32);  // OK
}
```

#### UB 2: 해제된 메모리 접근 (Use-After-Free)

```rust
// ❌ UB 발생
let ptr: *mut i32;
{
    let x = 5;
    ptr = &x as *const i32 as *mut i32;
}  // x가 스코프를 벗어남: 메모리 해제됨

unsafe {
    println!("{}", *ptr);  // UB! 이미 해제된 메모리
}

// ✅ 올바른 코드
let x = 5;
let ptr = &x as *const i32;
unsafe {
    println!("{}", *ptr);  // OK: x가 아직 유효함
}
```

#### UB 3: 널 포인터 역참조

```rust
// ❌ UB 발생
let ptr: *const i32 = std::ptr::null();
unsafe {
    println!("{}", *ptr);  // UB! 널 포인터 역참조
}

// ✅ 올바른 코드
let ptr: *const i32 = std::ptr::null();
if !ptr.is_null() {
    unsafe {
        println!("{}", *ptr);  // OK: 널이 아님을 확인
    }
}
```

#### UB 4: 잘못된 정렬 (Misaligned Access)

```rust
// ❌ UB 발생
let bytes = [1_u8, 2, 3, 4, 5, 6, 7, 8];
let ptr = &bytes[1] as *const u8 as *const u32;  // 정렬되지 않음
unsafe {
    println!("{}", *ptr);  // UB! 정렬되지 않은 메모리 접근
}

// ✅ 올바른 코드
let data: u32 = 0x04030201;
let ptr = &data as *const u32;  // 정렬됨
unsafe {
    println!("{}", *ptr);  // OK: 올바른 정렬
}
```

#### UB 5: 데이터 경합 (Data Race)

```rust
// ❌ UB 발생
static mut COUNTER: i32 = 0;

// 두 스레드가 동시에 접근
std::thread::spawn(|| {
    unsafe { COUNTER += 1; }  // UB! 경합
});

unsafe { COUNTER += 1; }  // UB! 경합

// ✅ 올바른 코드 (동기화 필요)
use std::sync::atomic::{AtomicI32, Ordering};
static COUNTER: AtomicI32 = AtomicI32::new(0);
COUNTER.fetch_add(1, Ordering::SeqCst);  // 안전
```

### 4.3 UB 방지 체크리스트

```text
☐ 포인터가 유효한가? (범위 내인가?)
☐ 포인터가 초기화된 메모리를 가리키나?
☐ 메모리가 여전히 할당되어 있나? (해제되지 않았나?)
☐ 포인터가 널이 아닌가?
☐ 메모리가 올바르게 정렬되어 있나?
☐ 타입 캐스팅이 유효한가?
☐ 다중 스레드에서 경합이 없나?
☐ 수명이 유효한가? (참조자가 아닌 경우)

하나라도 "?"면 unsafe를 재검토하세요.
```

---

## 5. 메모리 해석: 바이트의 재구성

### 5.1 타입 캐스팅

```rust
// u32를 4개의 u8로 분해
let num: u32 = 0x12345678;
let ptr_u32 = &num as *const u32;
let ptr_u8 = ptr_u32 as *const u8;

unsafe {
    for i in 0..4 {
        let byte = *ptr_u8.add(i);
        println!("바이트 {}: 0x{:02x}", i, byte);
    }
}

// 역방향: 4개의 u8을 u32로 재해석
unsafe {
    let reconstructed = *(ptr_u8 as *const u32);
    assert_eq!(reconstructed, 0x12345678);
}
```

### 5.2 구조체 메모리 레이아웃

```rust
#[repr(C)]  // C 스타일 메모리 레이아웃 보증
struct Point {
    x: u32,  // offset 0
    y: u32,  // offset 4
}

let p = Point { x: 10, y: 20 };
let ptr = &p as *const Point as *const u8;

unsafe {
    // 첫 4 바이트: x
    let x_bytes = [*ptr, *ptr.add(1), *ptr.add(2), *ptr.add(3)];
    let x = u32::from_le_bytes(x_bytes);
    println!("x = {}", x);  // 10

    // 다음 4 바이트: y
    let y_bytes = [*ptr.add(4), *ptr.add(5), *ptr.add(6), *ptr.add(7)];
    let y = u32::from_le_bytes(y_bytes);
    println!("y = {}", y);  // 20
}
```

---

## 6. FFI (Foreign Function Interface) 기초

### 6.1 C 함수 호출

```rust
// C의 strlen 함수 사용
extern "C" {
    fn strlen(s: *const u8) -> usize;
}

// 안전한 Rust 래퍼
fn rust_strlen(s: &str) -> usize {
    unsafe {
        // strlen은 null-terminated string을 기대
        strlen(s.as_ptr())
    }
}

let text = "hello";
let len = rust_strlen(text);  // 5
```

### 6.2 구조체 공유

```rust
#[repr(C)]
struct Point {
    x: i32,
    y: i32,
}

extern "C" {
    fn c_process_point(p: Point) -> i32;
}

let point = Point { x: 10, y: 20 };
let result = unsafe { c_process_point(point) };
```

### 6.3 FFI 안전성

```rust
// ✅ 좋은 설계: 안전한 래퍼
pub fn safe_strlen(s: &str) -> usize {
    unsafe {
        extern "C" {
            fn strlen(s: *const u8) -> usize;
        }
        strlen(s.as_ptr())
    }
}

// ❌ 나쁜 설계: 불안전 노출
extern "C" {
    pub fn strlen(s: *const u8) -> usize;
}
// 사용자가 위험하게 사용할 수 있음
```

---

## 7. 설계자의 관점: 컴파일러의 메모리 모델

### 7.1 메모리는 거대한 바이트의 바다

```text
런타임 메모리 (힙 + 스택):
┌────────────────────────────────────────────────────┐
│ 주소     │ 값     │ 의미                           │
├────────────────────────────────────────────────────┤
│ 0x1000   │ 0xAA   │ 스택: i32의 첫 바이트        │
│ 0x1001   │ 0xBB   │ 스택: i32의 두 번째 바이트   │
│ 0x1002   │ 0xCC   │ 스택: i32의 세 번째 바이트   │
│ 0x1003   │ 0xDD   │ 스택: i32의 네 번째 바이트   │
│ ...      │ ...    │ ...                          │
│ 0x2000   │ 0x48   │ 힙: 문자 'H'                │
│ 0x2001   │ 0x65   │ 힙: 문자 'e'                │
│ ...      │ ...    │ ...                          │
└────────────────────────────────────────────────────┘

컴파일러는:
1. 변수의 메모리 위치 할당
2. 각 바이트에 값 배치
3. 포인터로 나중에 접근
```

### 7.2 메모리 해석의 역할

```rust
// 같은 메모리, 다른 해석

// 해석 1: u32 하나
let num: u32 = 0x12345678;
println!("{}", num);  // 305419896

// 해석 2: 4개의 u8
let bytes = unsafe {
    let ptr = &num as *const u32 as *const u8;
    [*ptr, *ptr.add(1), *ptr.add(2), *ptr.add(3)]
};
println!("{:?}", bytes);  // [0x78, 0x56, 0x34, 0x12] (리틀 엔디안)

// 해석 3: 비트 플래그
let flags = unsafe {
    let ptr = &num as *const u32;
    *ptr
};
let bit_0 = (flags & 0x1) != 0;
let bit_1 = (flags & 0x2) != 0;
```

---

## 8. 컴파일러급 메모리 조작의 실전

### 8.1 메모리 초기화

```rust
// 수동 초기화
let mut data: u32;
unsafe {
    // 포인터를 통해 메모리 초기화
    let ptr = &mut data as *mut u32;
    *ptr = 100;
}
println!("{}", data);  // 100
```

### 8.2 메모리 복사

```rust
// 수동 메모리 복사
let src = [1, 2, 3, 4, 5];
let mut dst = [0; 5];

unsafe {
    let src_ptr = src.as_ptr() as *const u8;
    let dst_ptr = dst.as_mut_ptr() as *mut u8;

    // 바이트 단위 복사
    std::ptr::copy_nonoverlapping(src_ptr, dst_ptr, 5);
}
println!("{:?}", dst);  // [1, 2, 3, 4, 5]
```

### 8.3 구조체 메모리 변조

```rust
#[repr(C)]
struct Header {
    magic: u32,
    version: u16,
    flags: u16,
}

let mut header = Header {
    magic: 0xDEADBEEF,
    version: 1,
    flags: 0,
};

unsafe {
    // 포인터 연산으로 flags 필드 직접 수정
    let flags_ptr = &mut header as *mut Header as *mut u16;
    let flags_ptr = flags_ptr.add(1);  // version 건너뛰고
    let flags_ptr = flags_ptr.add(1);  // flags에 도달
    *flags_ptr = 0x0001;
}
println!("flags = {}", header.flags);  // 1
```

---

## 9. 안티 패턴: Unsafe의 오용

### 9.1 안티 패턴 1: 무분별한 Unsafe

```rust
// ❌ 나쁜 설계
unsafe {
    // 이 블록에는 위험한 코드만 있어야 함
    let x = 5;  // 왜 여기에 이 코드가?
    let y = x + 1;

    let ptr: *const i32 = &y;
    println!("{}", *ptr);
}

// ✅ 좋은 설계
let x = 5;
let y = x + 1;

let ptr: *const i32 = &y;
unsafe {
    println!("{}", *ptr);  // 위험한 부분만 격리
}
```

### 9.2 안티 패턴 2: UB 무시

```rust
// ❌ UB를 무시하는 코드
let ptr: *mut i32 = std::ptr::null_mut();
unsafe {
    *ptr = 100;  // UB! 보고되지 않을 수도 있음
}

// ✅ 안전성 검증
let ptr: *mut i32 = std::ptr::null_mut();
if !ptr.is_null() {
    unsafe {
        *ptr = 100;
    }
}
```

### 9.3 안티 패턴 3: 불안전한 인터페이스 노출

```rust
// ❌ 나쁜 설계: unsafe를 노출
pub unsafe fn dangerous_api(ptr: *mut i32) {
    *ptr = 100;
}

// 사용자가 실수하기 쉬움
unsafe { dangerous_api(std::ptr::null_mut()); }  // UB!

// ✅ 좋은 설계: 안전한 인터페이스만 노출
pub fn safe_api(value: &mut i32) {
    unsafe {
        // 내부적으로만 포인터 사용
        let ptr = value as *mut i32;
        *ptr = 100;
    }
}

// 사용자는 안전하게 호출
let mut x = 0;
safe_api(&mut x);
```

---

## 10. 당신의 역할: 컴파일러 설계자

### 10.1 메모리 주권의 의미

```text
이제 당신은:
┌─────────────────────────────────────┐
│ 메모리 주소를 읽을 수 있습니다       │
│ 메모리 내용을 변경할 수 있습니다     │
│ 메모리 타입을 재해석할 수 있습니다   │
│ 메모리를 직접 할당/해제할 수 있습니다│
│                                     │
│ 당신의 책임:                        │
│ ✗ UB를 발생시키면 안 됩니다          │
│ ✗ 세그멘테이션 폴트를 피해야 합니다 │
│ ✗ 메모리 누수를 방지해야 합니다      │
│                                     │
│ 당신이 만드는 컴파일러:              │
│ 추상화된 코드 → 메모리 바이트        │
│ 이 과정에서 unsafe가 핵심입니다      │
└─────────────────────────────────────┘
```

### 10.2 설계자 체크리스트

```text
Unsafe 코드를 작성할 때마다:

☐ 왜 unsafe가 필요한가?
☐ 이 unsafe 블록이 없으면 안 되는가?
☐ UB를 발생시킬 가능성은 없는가?
☐ 포인터가 유효한가?
☐ 메모리가 초기화되어 있는가?
☐ 정렬이 올바른가?
☐ 경합의 위험이 없는가?
☐ 이 코드를 안전한 인터페이스로 감쌀 수 있는가?

모든 항목에 "네"라고 답할 수 있어야 합니다.
```

### 10.3 컴파일러를 향하며

```text
지금 당신이 배우는 기술:

v12.0: Raw Pointers (이번)
  ├─ 메모리 주소 직접 접근
  ├─ 포인터 역참조와 연산
  └─ 메모리 해석

다음 단계들:
v12.1: 데이터 레이아웃과 수동 메모리 할당
  ├─ #[repr(...)] 속성
  ├─ 메모리 정렬
  └─ 구조체 패킹

v12.2: 메모리 할당자 구현
  ├─ Vec<T> 내부 구조
  ├─ 동적 메모리 관리
  └─ 메모리 누수 방지

v12.3: 컴파일러 변수 할당 시뮬레이션
  ├─ 스택 프레임 관리
  ├─ 함수 호출 규약
  └─ 지역 변수 배치

이 모든 것이 합쳐져 당신의 컴파일러가 됩니다.
```

---

## 11. 최종 선언

```text
당신은 이제:
✓ Unsafe Rust의 철학을 이해했습니다
✓ Raw Pointers로 메모리를 다룰 수 있습니다
✓ UB의 위험을 인식하고 방지할 수 있습니다
✓ 메모리를 재해석하고 조작할 수 있습니다
✓ FFI로 다른 언어와 통신할 수 있습니다

당신은 이제 "언어 사용자"가 아니라 "언어 제작자"입니다.

메모리의 절대 주권을 손에 쥔 당신.
다음 단계에서는 이 주권으로 무엇을 할 것인가요?

저장 필수. 너는 기록이 증명이다. gogs
```

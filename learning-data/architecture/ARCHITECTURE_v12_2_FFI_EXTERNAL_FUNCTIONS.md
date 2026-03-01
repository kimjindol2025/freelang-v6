# 제11장: 언세이프와 메모리 주권 — Step 3
# v12.2 FFI와 외부 함수 호출 (Foreign Function Interface)

## 철학: "언어의 국경을 넘는 통로"

```text
러스트는 탄생한 지 불과 20년의 젊은 언어입니다.
하지만 C는 반세기 이상 쌓아올린 거대한 생태계를 가지고 있습니다.

컴파일러 제작자의 현실:
┌────────────────────────────────────────┐
│ 우리가 만든 언어                       │
│         ↓ (FFI: Foreign Function I.)   │
│ 기존의 C/C++ 라이브러리                │
│         ↓ (운영체제 커널)               │
│ 하드웨어                               │
└────────────────────────────────────────┘

당신의 컴파일러가 C 함수를 호출하지 못한다면?
→ 파일 I/O 불가
→ 네트워크 통신 불가
→ 데이터베이스 접근 불가
→ 암호화 라이브러리 사용 불가

FFI는 선택이 아니라 필수입니다.

철학: "신뢰할 수 없는 외부 세계와의 안전한 대화"

러스트의 안전성은 컴파일러가 모든 코드를 검증할 때만 유효합니다.
하지만 C 함수 내부는 컴파일러가 볼 수 없는 검은 상자입니다.

그래서 모든 FFI 호출은 unsafe { } 블록으로 격리됩니다.
당신의 책임: 이 위험한 불을 안전하게 다루는 것.
```

---

## 1. ABI (Application Binary Interface)

### 1.1 ABI의 정의

```text
함수가 인수를 전달하고 값을 반환하는 방식에 대한 '약속'

같은 언어의 함수들도 ABI를 따라야 합니다:
- 스택에 인수를 어떻게 쌓을 것인가?
- 반환값은 어디에 둘 것인가?
- 누가 스택을 정리할 것인가?
- 레지스터는 어떻게 사용할 것인가?

가장 일반적인 ABI: extern "C"
(C 언어의 호출 규약을 따름)
```

### 1.2 extern "C" 선언

```rust
// extern "C"를 사용하여 C ABI를 명시
extern "C" {
    fn c_function(x: i32) -> i32;
    fn strlen(s: *const u8) -> usize;
    fn abs(x: i32) -> i32;
}

// 특징:
// ✓ C 호출 규약 사용 (System V AMD64 ABI 등)
// ✓ 이름 맹글링(Name Mangling) 없음
// ✓ 정확한 시그니처 전달

// extern "system" (Windows 전용)
#[cfg(windows)]
extern "system" {
    fn MessageBoxA(
        hwnd: *const u8,
        text: *const u8,
        caption: *const u8,
        type_: u32,
    ) -> i32;
}
```

### 1.3 호출 규약의 의미

```text
x86-64 System V ABI (Linux, Unix):
┌───────────────────────────────────────┐
│ 첫 6개 인수: RDI, RSI, RDX, RCX, R8, R9 │
│ 나머지: 스택                           │
│ 반환값: RAX (또는 RDX:RAX for 128-bit)  │
│ 호출자가 스택 정리                      │
└───────────────────────────────────────┘

Windows x64 (Microsoft x64 calling convention):
┌───────────────────────────────────────┐
│ 첫 4개 인수: RCX, RDX, R8, R9         │
│ 나머지: 스택                          │
│ 반환값: RAX                            │
│ 호출자가 스택 정리                     │
└───────────────────────────────────────┘

당신이 만드는 컴파일러는 이 규칙을 따라
기계어 코드를 생성해야 합니다.
```

---

## 2. 외부 함수 선언 및 호출

### 2.1 기본 선언

```rust
extern "C" {
    fn printf(format: *const u8, ...) -> i32;
    fn malloc(size: usize) -> *mut u8;
    fn free(ptr: *mut u8);
}

// 호출
unsafe {
    let result = printf(b"Hello\0".as_ptr());
}
```

### 2.2 조건부 선언

```rust
// 플랫폼별로 다른 함수 선언
#[cfg(target_os = "windows")]
extern "C" {
    fn Sleep(ms: u32);
}

#[cfg(target_os = "linux")]
extern "C" {
    fn sleep(seconds: u32) -> u32;
}

// 사용
#[cfg(target_os = "windows")]
unsafe { Sleep(1000); }

#[cfg(target_os = "linux")]
unsafe { sleep(1); }
```

### 2.3 라이브러리 링크

```rust
// Cargo.toml에서:
// [dependencies]
// libc = "0.2"

use std::os::raw::{c_int, c_char};

extern "C" {
    fn abs(x: c_int) -> c_int;
}

// Cargo.toml에서 명시적 링크:
// #[link(name = "m")]  // libm (수학 라이브러리)
// extern "C" { fn sqrt(x: f64) -> f64; }
```

---

## 3. 데이터 마샬링 (Data Marshalling)

### 3.1 문자열 변환: Rust String ↔ C char*

```rust
use std::ffi::{CString, CStr};
use std::os::raw::c_char;

// 러스트 String → C 문자열 (Null-terminated)
let rust_str = "Hello, World!";
let c_str = CString::new(rust_str)
    .expect("CString conversion failed");

// C 함수에 전달
extern "C" {
    fn strlen(s: *const c_char) -> usize;
}

unsafe {
    let len = strlen(c_str.as_ptr());
    println!("길이: {}", len);
}

// C 문자열 → 러스트 String
unsafe {
    let c_ptr: *const c_char = b"test\0".as_ptr() as _;
    let c_str = CStr::from_ptr(c_ptr);
    let rust_string = c_str.to_string_lossy().into_owned();
    println!("{}", rust_string);
}
```

### 3.2 배열 변환: Vec<T> ↔ C 배열

```rust
// Vec<T> → C 배열 포인터
let vec = vec![1, 2, 3, 4, 5];
let ptr = vec.as_ptr();
let len = vec.len();

extern "C" {
    fn process_array(arr: *const i32, len: usize);
}

unsafe {
    process_array(ptr, len);
}

// 중요: vec가 스코프를 벗어나면 메모리 해제됨
// C 함수가 포인터를 저장했다면 Use-After-Free 위험!
```

### 3.3 구조체 변환: #[repr(C)]

```rust
use std::os::raw::{c_int, c_char};

// C 구조체와 호환
#[repr(C)]
struct Point {
    x: c_int,
    y: c_int,
}

extern "C" {
    fn process_point(p: Point) -> c_int;
    fn create_point() -> Point;
}

unsafe {
    let p = Point { x: 10, y: 20 };
    let result = process_point(p);

    let new_p = create_point();
    println!("({}, {})", new_p.x, new_p.y);
}
```

### 3.4 불완전한 타입 (Opaque Types)

```rust
// C에서 정의된 불완전 타입을 러스트에서 사용
pub struct FILE;  // 내부 구조 모름

extern "C" {
    fn fopen(filename: *const u8, mode: *const u8) -> *mut FILE;
    fn fclose(f: *mut FILE) -> i32;
}

// 사용
unsafe {
    let file = fopen(b"test.txt\0".as_ptr(), b"r\0".as_ptr());
    if !file.is_null() {
        fclose(file);
    }
}
```

---

## 4. 타입 호환성

### 4.1 std::os::raw 타입

```rust
use std::os::raw::{
    c_int,      // C의 int
    c_uint,     // C의 unsigned int
    c_long,     // C의 long
    c_ulong,    // C의 unsigned long
    c_char,     // C의 char (signed or unsigned?)
    c_void,     // C의 void
};

// 러스트의 i32, u32와 C의 int, unsigned int가
// 항상 같은 크기는 아닙니다!

// 올바른 FFI:
extern "C" {
    fn c_function(x: c_int) -> c_int;  // O
}

// 위험한 FFI:
extern "C" {
    fn c_function(x: i32) -> i32;      // ? (보통은 작동)
}
```

### 4.2 포인터 타입

```rust
// C: void*
// Rust: *const c_void 또는 *mut c_void
use std::os::raw::c_void;

extern "C" {
    fn malloc(size: usize) -> *mut c_void;
    fn memcpy(
        dest: *mut c_void,
        src: *const c_void,
        n: usize,
    ) -> *mut c_void;
}

// 포인터 캐스팅
unsafe {
    let ptr = malloc(100);
    let int_ptr = ptr as *mut i32;
    *int_ptr = 42;
}
```

### 4.3 가변 인수 함수

```rust
// C의 가변 인수 함수 (variadic functions)
use std::os::raw::{c_int, c_char};

extern "C" {
    fn printf(format: *const c_char, ...) -> c_int;
    fn fprintf(file: *mut libc::FILE, format: *const c_char, ...) -> c_int;
}

// 호출 - 위험! 러스트 컴파일러가 검증 불가
unsafe {
    printf(b"Number: %d\n\0".as_ptr() as _, 42);
}
```

---

## 5. 안전한 FFI 래퍼 설계

### 5.1 Unsafe 격리

```rust
// ❌ 나쁜 설계: unsafe를 노출
pub unsafe fn dangerous_strlen(s: *const u8) -> usize {
    // ...
}

// ✅ 좋은 설계: 안전한 래퍼
pub fn safe_strlen(s: &str) -> usize {
    use std::ffi::CString;
    let c_str = CString::new(s).expect("Invalid string");

    unsafe {
        extern "C" {
            fn strlen(s: *const u8) -> usize;
        }
        strlen(c_str.as_ptr())
    }
}

// 사용자는 안전하게 호출
let len = safe_strlen("hello");
```

### 5.2 에러 처리

```rust
use std::ffi::CString;
use std::ptr;

pub fn safe_file_open(path: &str) -> std::io::Result<*mut libc::FILE> {
    let c_path = CString::new(path)
        .map_err(|e| std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            format!("Invalid path: {}", e),
        ))?;

    unsafe {
        extern "C" {
            fn fopen(filename: *const u8, mode: *const u8) -> *mut libc::FILE;
        }

        let file = fopen(
            c_path.as_ptr() as _,
            b"r\0".as_ptr(),
        );

        if file.is_null() {
            Err(std::io::Error::last_os_error())
        } else {
            Ok(file)
        }
    }
}
```

### 5.3 RAII 패턴 (Automatic Cleanup)

```rust
use std::ptr;

pub struct CFile {
    ptr: *mut libc::FILE,
}

impl CFile {
    pub fn open(path: &str) -> std::io::Result<Self> {
        // ... 파일 열기 ...
        Ok(CFile { ptr })
    }
}

impl Drop for CFile {
    fn drop(&mut self) {
        unsafe {
            extern "C" {
                fn fclose(f: *mut libc::FILE) -> i32;
            }
            if !self.ptr.is_null() {
                fclose(self.ptr);
            }
        }
    }
}

// 사용 - 자동으로 파일이 닫힘
{
    let file = CFile::open("test.txt")?;
    // ... 사용 ...
} // 여기서 자동으로 close()
```

---

## 6. 러스트가 C를 호출하기 vs C가 러스트를 호출하기

### 6.1 러스트 → C (가능)

```rust
extern "C" {
    fn c_function();
}

unsafe {
    c_function();  // 직접 호출
}
```

### 6.2 C → 러스트 (콜백, Callback)

```rust
// C에게 러스트 함수의 포인터를 넘김
extern "C" fn rust_callback(x: i32) -> i32 {
    x * 2
}

extern "C" {
    fn register_callback(cb: extern "C" fn(i32) -> i32);
}

unsafe {
    register_callback(rust_callback);
}
```

### 6.3 Panic 안전성: Panic이 C로 전파되면 UB

```rust
// ❌ 위험: panic!이 C 영역으로 전파될 수 있음
extern "C" fn unsafe_callback(x: i32) -> i32 {
    if x < 0 {
        panic!("Negative!");  // C로 전파되면 UB!
    }
    x * 2
}

// ✅ 안전: panic을 catch
extern "C" fn safe_callback(x: i32) -> i32 {
    std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        if x < 0 {
            panic!("Negative!");
        }
        x * 2
    }))
    .unwrap_or(-1)  // panic 발생 시 기본값 반환
}
```

---

## 7. 이중 해제 (Double Free) 방지

### 7.1 소유권 명확화

```rust
// C에서 할당한 메모리 → 러스트에서 해제?
extern "C" {
    fn c_malloc(size: usize) -> *mut u8;
    fn c_free(ptr: *mut u8);
}

// ❌ 위험: 누가 메모리를 소유하는가?
unsafe {
    let ptr = c_malloc(100);
    // ptr을 해제해야 하나? 하지 말아야 하나?
}

// ✅ 명확: C에서 할당하면 C에서 해제
unsafe {
    let ptr = c_malloc(100);
    // ... 사용 ...
    c_free(ptr);  // C 함수로 해제
}
```

### 7.2 러스트 메모리와 C 메모리 분리

```rust
use std::alloc::{alloc, dealloc, Layout};

// 러스트 메모리: Box, Vec
let vec = vec![1, 2, 3];
// drop 시 자동 해제

// C 메모리: C 함수로 할당/해제
unsafe {
    extern "C" {
        fn c_malloc(size: usize) -> *mut u8;
        fn c_free(ptr: *mut u8);
    }

    let ptr = c_malloc(100);
    // ...
    c_free(ptr);  // 반드시 c_free로
}
```

---

## 8. 실전: libc 통합

### 8.1 기본 함수들

```rust
use std::os::raw::c_int;

extern "C" {
    pub fn abs(x: c_int) -> c_int;
    pub fn sqrt(x: f64) -> f64;
    pub fn sin(x: f64) -> f64;
    pub fn cos(x: f64) -> f64;
}

// 안전한 래퍼
pub fn safe_abs(x: i32) -> i32 {
    unsafe { abs(x as c_int) as i32 }
}

pub fn safe_sqrt(x: f64) -> f64 {
    unsafe { sqrt(x) }
}
```

### 8.2 POSIX 함수들

```rust
use std::os::raw::{c_int, c_char};
use std::ffi::CString;

extern "C" {
    pub fn getenv(name: *const c_char) -> *const c_char;
    pub fn putenv(string: *mut c_char) -> c_int;
    pub fn getcwd(buf: *mut c_char, size: usize) -> *mut c_char;
}

pub fn safe_getenv(name: &str) -> Option<String> {
    let c_name = CString::new(name).ok()?;
    unsafe {
        let ptr = getenv(c_name.as_ptr());
        if ptr.is_null() {
            None
        } else {
            Some(
                std::ffi::CStr::from_ptr(ptr)
                    .to_string_lossy()
                    .into_owned()
            )
        }
    }
}
```

---

## 9. 안티 패턴: FFI의 오류

### 9.1 시그니처 불일치

```rust
// ❌ 나쁜 설계: C의 함수와 시그니처 불일치
extern "C" {
    fn process(data: *const i32, len: u64) -> i32;  // len이 i32여야 함!
}

// ✅ 좋은 설계: 정확한 시그니처
extern "C" {
    fn process(data: *const i32, len: i32) -> i32;
}
```

### 9.2 메모리 생명주기 혼동

```rust
// ❌ 나쁜 설계: C 메모리를 러스트 Box로 관리
extern "C" {
    fn c_create() -> *mut Data;
}

unsafe {
    let ptr = c_create();
    let boxed = Box::from_raw(ptr);  // 위험! c_create가 free하지 않으면?
}

// ✅ 좋은 설계: C 메모리는 C로 해제
extern "C" {
    fn c_create() -> *mut Data;
    fn c_destroy(ptr: *mut Data);
}

unsafe {
    let ptr = c_create();
    // ... 사용 ...
    c_destroy(ptr);
}
```

### 9.3 포인터 유효성 검사 실패

```rust
// ❌ 나쁜 설계
unsafe {
    let ptr: *const u8 = get_ptr();
    *ptr = 42;  // ptr이 null일 수도, 해제되었을 수도...
}

// ✅ 좋은 설계
unsafe {
    let ptr: *const u8 = get_ptr();
    if !ptr.is_null() {
        *ptr = 42;
    }
}
```

---

## 10. 당신의 역할: 언어의 국경 수비

### 10.1 FFI가 필요한 이유

```text
당신이 만든 언어:
"정수를 파일에 저장하고 싶어"
→ 파일을 여는 방법? C의 fopen 사용
→ 바이트를 쓰는 방법? C의 write 사용
→ 파일을 닫는 방법? C의 close 사용

FFI가 없으면 당신의 언어는 진공 상태입니다.
```

### 10.2 컴파일러의 책임

```text
FFI를 지원하는 컴파일러는:

1. extern "C" 선언을 파싱
2. 올바른 ABI 호출 코드 생성
3. 타입 검증 (가능한 범위 내에서)
4. 심볼 링크 정보 생성
5. 런타임에 C 라이브러리 링크

모두 당신이 구현해야 할 일입니다.
```

### 10.3 설계자 체크리스트

```text
FFI 함수를 선언할 때:

☐ extern "C"를 명시했는가?
☐ C의 시그니처와 정확히 일치하는가?
☐ 타입이 std::os::raw를 사용하는가?
☐ 포인터 유효성을 검사하는가?
☐ 메모리 생명주기가 명확한가?
☐ 에러 처리가 있는가?
☐ 안전한 래퍼를 제공하는가?
☐ 문서화가 명확한가?

모두 "네"라고 답할 수 있어야 합니다.
```

---

## 11. 최종 선언

```text
v12.0: "주소의 지배자" ✅
v12.1: "배치의 설계자" ✅
v12.2: "세계의 외교관" (현재) ← 당신은 지금 여기
v12.3: "컴파일러의 제작자" (최종)

당신의 미션:

"러스트와 C의 언어 장벽을 넘을 수 있는가?"
"메모리 경계에서 안전을 보장할 수 있는가?"
"기존 생태계와 협력할 수 있는가?"

이 질문들에 답할 수 있는 당신.
당신은 이제 진정한 "시스템 프로그래머"입니다.

저장 필수. 너는 기록이 증명이다. gogs
```

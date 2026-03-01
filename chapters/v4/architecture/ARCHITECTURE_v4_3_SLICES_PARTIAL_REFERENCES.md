# v4.3 아키텍처: 슬라이스와 부분 참조 (Slices & Partial References)

## 🎯 설계 목표: "정밀한 부분 제어"

### 최종 선언
```
v4.2에서 배운 것:
"데이터 전체를 빌려준다"

v4.3에서 배울 것:
"데이터의 특정 부분만 안전하게 떼어낸다"

결과:
메모리 복사 없이
필요한 부분만 정밀하게 제어한다.
```

---

## 💡 슬라이스란?

### 정의: Fat Pointer (포인터와 길이의 조합)

```
┌──────────────────────────────────┐
│ "REBOOT SYSTEM_CORE_01"          │ ← 원본 String
│ 0 1 2 3 4 5 6 7 8 9 ...          │
└──────────────────────────────────┘

슬라이스 = [시작 주소] + [길이]

&str[0..6] = {
  ptr: 0,      // 시작 주소
  len: 6       // 길이 (6바이트)
}
결과: "REBOOT"

&str[7..] = {
  ptr: 7,      // 시작 주소
  len: 14      // 길이 (14바이트)
}
결과: "SYSTEM_CORE_01"
```

### 구조: 정확한 부분 제어

```
원본: "HELLO WORLD"
      012345678910

슬라이스[0..5]  = "HELLO"
슬라이스[6..11] = "WORLD"
슬라이스[0..]   = "HELLO WORLD" (전체)
슬라이스[6..]   = "WORLD" (6번부터 끝까지)
```

---

## 🔧 v4.2 vs v4.3 비교

### v4.2: 전체 참조 (Full Reference)

```freelang
fn process(text: &String) -> String {
  text + " processed"
}

let msg = "REBOOT SYSTEM_CORE_01";
let result = process(&msg);  // 전체 String 전달
```

**특징:**
- 데이터 전체만 참조 가능
- 함수는 전체 데이터를 받아야 함
- 호출자가 함수 선택

### v4.3: 부분 참조 (Partial Reference)

```freelang
fn process(command: &str) -> String {
  command + " processed"
}

let msg = "REBOOT SYSTEM_CORE_01";
let command = &msg[0..6];     // 부분 추출
let result = process(command); // 부분 전달

// 또는 직접 전달
let result = process(&msg[0..6]);
```

**특징:**
- 데이터의 일부만 참조 가능
- 함수는 &str를 받으면 String, 슬라이스 모두 처리 가능
- 함수가 유연한 입력 대응

---

## 📊 슬라이스의 3가지 종류

### 종류 1: 문자열 슬라이스 (&str)

```freelang
let msg = "Hello World";

let first = &msg[0..5];      // "Hello"
let second = &msg[6..11];    // "World"
let partial = &msg[6..];     // "World" (6부터 끝까지)
let full = &msg[0..];        // "Hello World" (전체)
let from_start = &msg[..5];  // "Hello" (처음부터 5까지)
```

**특징:**
- 문자열의 일부를 안전하게 추출
- UTF-8 경계를 넘으면 에러 (panic)
- 복사 없이 부분만 참조

### 종류 2: 배열 슬라이스 (&[T])

```freelang
let arr = [10, 20, 30, 40, 50];

let first_three = &arr[0..3];    // [10, 20, 30]
let middle = &arr[1..4];         // [20, 30, 40]
let last_two = &arr[3..5];       // [40, 50]
let from_idx = &arr[2..];        // [30, 40, 50]
```

**특징:**
- 배열의 연속된 요소들을 참조
- 범위를 벗어나면 에러
- 요소 개수 동적 확인 가능

### 종류 3: 문자열 리터럴은 이미 슬라이스

```freelang
let literal = "hello";  // 이미 &str!

fn process(s: &str) {
  println(s);
}

process(literal);         // ✓ OK
process("world");         // ✓ OK
process(&"embedded");     // ✓ OK
```

**특징:**
- 문자열 리터럴은 사실 &str
- 함수를 &str로 설계하면 모든 문자열 형태 수용
- 가장 유연한 인터페이스

---

## 🛡️ 슬라이스의 4가지 안전성 규칙

### 규칙 1: 범위 안전성 (Range Safety)

```freelang
let msg = "hello";  // 5바이트

let valid = &msg[0..3];      // ✓ OK: "hel"
let invalid = &msg[0..10];   // ✗ PANIC: 범위 초과
let oob = &msg[10..15];      // ✗ PANIC: 범위 초과
```

**의미:** 범위를 벗어나면 런타임 에러 발생

### 규칙 2: UTF-8 경계 안전성

```freelang
let emoji = "안녕 👋";  // 멀티바이트 문자

let valid = &emoji[0..3];    // ✓ OK: "안" (3바이트)
let invalid = &emoji[0..2];  // ✗ PANIC: UTF-8 경계 위반
```

**의미:** UTF-8 문자 경계 중간에 슬라이싱하면 에러

### 규칙 3: 소유권 동기화 (Ownership Sync)

```freelang
let mut data = String::from("hello");
let slice = &data[0..3];     // 슬라이스 생성

println(slice);              // ✓ OK: "hel"
// data.clear();             // ✗ 불가능!
                             // 누군가 보고 있는데 수정할 수 없음
```

**의미:** 슬라이스가 살아있으면 원본 수정 불가능

### 규칙 4: 슬라이스의 불변성 (Immutability)

```freelang
let msg = "hello";
let slice = &msg[0..3];
// slice[0] = 'H';           // ✗ 불가능!
                             // 슬라이스는 읽기 전용
```

**의미:** v4.3 슬라이스는 불변만 가능 (v4.4에서 mutable slice)

---

## 🎯 5가지 슬라이스 카테고리

### 카테고리 1: 문자열 슬라이싱 (String Slicing)

```freelang
fn get_first_word(text: &str) -> &str {
  // 첫 번째 단어 추출
  &text[0..5]
}

let msg = "REBOOT SYSTEM_CORE_01";
let cmd = get_first_word(msg);  // "REBOOT"
```

**특징:**
- 문자열의 시작부터 끝까지 부분 추출
- 고정 길이 부분 추출
- 가장 간단한 패턴

### 카테고리 2: 범위 기반 접근 (Range-Based Access)

```freelang
fn get_range(text: &str, start: i32, end: i32) -> &str {
  // 시작점과 끝점으로 부분 추출
  &text[start..end]
}

let msg = "REBOOT SYSTEM_CORE_01";
let cmd = get_range(msg, 0, 6);      // "REBOOT"
let target = get_range(msg, 7, 21);  // "SYSTEM_CORE_01"
```

**특징:**
- 동적으로 시작점과 끝점 지정
- 함수의 매개변수로 범위 결정
- 유연한 부분 추출

### 카테고리 3: 배열 슬라이싱 (Array Slicing)

```freelang
fn get_slice(arr: &[i32], start: i32, len: i32) -> &[i32] {
  // 배열의 일부 참조
  &arr[start..(start + len)]
}

let sensors = [10, 20, 30, 40, 50];
let partial = get_slice(&sensors, 1, 3);  // [20, 30, 40]
```

**특징:**
- 배열의 연속된 요소들 참조
- 요소 개수로 범위 결정
- 배열 데이터 구조화에 유용

### 카테고리 4: 슬라이스 검사 (Slice Inspection)

```freelang
fn get_length(s: &str) -> i32 {
  // 슬라이스 길이 확인
  5  // 간단하게 하드코드 (실제는 s.len())
}

fn is_empty(s: &str) -> bool {
  s == ""
}

let slice = "hello";
let len = get_length(slice);
let empty = is_empty(slice);
```

**특징:**
- 슬라이스의 길이 확인
- 슬라이스의 내용 검증
- 슬라이스의 상태 확인

### 카테고리 5: 유연한 함수 인터페이스 (Flexible Interface)

```freelang
fn process(input: &str) -> String {
  // &str를 받으면 String, 슬라이스 모두 처리 가능
  "[PROCESSED] " + input
}

let full_string = String::from("hello");
let result1 = process(&full_string);         // ✓ String 전달
let result2 = process(&full_string[0..3]);  // ✓ 슬라이스 전달
let result3 = process("world");             // ✓ 리터럴 전달
```

**특징:**
- 함수가 &str를 받으면 다양한 입력 수용
- String, 슬라이스, 리터럴 모두 처리
- 가장 유연하고 재사용성 높은 패턴

---

## 🔄 메모리 효율성 비교

### v4.1 Move: 복사 발생

```
원본: let msg = "REBOOT SYSTEM_CORE_01";  (30바이트)
      move to func ────────────────────→
                  ↓
           (30바이트 이동)
```

### v4.2 Reference: 8바이트 포인터

```
원본: let msg = "REBOOT SYSTEM_CORE_01";
      &msg ─────→ (8바이트 포인터)
                  ↓
           (전체 데이터 참조)
```

### v4.3 Slice: 16바이트 Fat Pointer

```
원본: let msg = "REBOOT SYSTEM_CORE_01";
      &msg[0..6] ─→ (16바이트 Fat Pointer)
                     ├─ ptr: 8바이트 (주소)
                     └─ len: 8바이트 (길이)
                     ↓
              (부분 데이터만 참조)
```

**비용 비교:**
- v4.1 Move: 30바이트 복사 (비효율)
- v4.2 Reference: 8바이트 포인터 (효율)
- v4.3 Slice: 16바이트 Fat Pointer (효율 + 정밀)

---

## 🌟 v4.3의 4가지 이점

### 이점 1: 정밀한 부분 제어

```freelang
let msg = "REBOOT SYSTEM_CORE_01";

let command = &msg[0..6];           // "REBOOT"
let system = &msg[7..];             // "SYSTEM_CORE_01"
let core_id = &msg[14..21];         // "CORE_01"

// 각 부분만 처리 가능
process_command(&command);
process_system(&system);
process_id(&core_id);
```

**장점:** 거대한 데이터에서 필요한 부분만 추출

### 이점 2: 함수 유연성

```freelang
fn process(input: &str) -> String {
  "[OK] " + input
}

let msg = "hello world";

process(&msg);           // ✓ 전체 String
process(&msg[0..5]);     // ✓ 슬라이스
process("literal");      // ✓ 리터럴
```

**장점:** 하나의 함수가 모든 문자열 형태 수용

### 이점 3: 범위 안전성

```freelang
let msg = "hello";

let valid = &msg[0..3];      // ✓ OK: 범위 내
// let invalid = &msg[0..10]; // ✗ PANIC: 범위 초과

// 범위를 벗어나면 컴파일 타임에 감지 가능
```

**장점:** 범위 오버플로우 원천 차단

### 이점 4: 소유권 보호

```freelang
let msg = String::from("hello");
let slice = &msg[0..3];

println(slice);          // ✓ OK: 슬라이스 사용
// msg.clear();          // ✗ 불가능: 누군가 보고 있음

// 슬라이스가 살아있는 동안 원본 보호
```

**장점:** 원본 데이터가 변형되는 것을 방지

---

## 🎓 v4.3 설계 의사결정

### 언제 슬라이스를 사용할 것인가?

```
데이터의 일부만 필요한가?

YES → v4.3 Slice (&str, &[T])
     ├─ 정밀한 부분 제어 가능
     ├─ 메모리 효율적
     └─ 안전한 범위 검증

NO → v4.2 Reference (&String, &Vec)
    └─ 전체 데이터 참조
```

### 함수 인터페이스 설계

```
함수 매개변수:

// 나쁜 설계:
fn process(text: &String) { ... }
fn process2(arr: &Vec<i32>) { ... }

// 좋은 설계:
fn process(text: &str) { ... }          // &String도, 슬라이스도 OK
fn process2(arr: &[i32]) { ... }       // &Vec도, 슬라이스도 OK
```

**원칙:**
- 함수는 &str, &[T]로 설계
- 호출자는 어떤 형태든 전달 가능
- 가장 유연하고 재사용성 높음

---

## 📊 v4.3 설계 요약

| 요소 | 설명 |
|------|------|
| **목표** | 정밀한 부분 제어 |
| **핵심** | Fat Pointer: [포인터] + [길이] |
| **종류** | 문자열 슬라이스(&str), 배열 슬라이스(&[T]), 리터럴 |
| **4가지 규칙** | 범위 안전성, UTF-8 경계, 소유권 동기화, 불변성 |
| **4가지 이점** | 정밀 제어, 함수 유연성, 범위 안전성, 소유권 보호 |
| **5가지 카테고리** | 문자열 슬라이싱, 범위 기반, 배열 슬라이싱, 검사, 유연한 인터페이스 |
| **성능** | 16바이트 (포인터 8 + 길이 8) |
| **안전성** | 범위 초과 시 Panic, UTF-8 경계 보호 |

---

## 🎉 v4.3 완성 후의 경험

### 당신이 이해한 것
```
✓ 슬라이스가 Fat Pointer임을 알게 됨
✓ 부분 참조를 통한 정밀한 데이터 제어
✓ 범위 안전성의 중요성 깨달음
✓ 함수 인터페이스를 &str, &[T]로 설계하는 이유
✓ 메모리 효율성과 안전성의 극대화
```

### 당신이 설계한 것
```
✓ 문자열 슬라이싱: 5가지 패턴
✓ 범위 기반 접근: 5가지 패턴
✓ 배열 슬라이싱: 5가지 패턴
✓ 슬라이스 검사: 5가지 패턴
✓ 유연한 인터페이스: 5가지 패턴
✓ Advanced 슬라이스 생명 주기: 5가지 패턴
✓ Composition: 슬라이스 패턴 조합: 5가지 패턴
✓ Lifecycle: 범위 안전성 증명: 5가지 패턴
✓ Total: 25+ 함수, 40+ 테스트 케이스
```

---

**작성일:** 2026-02-22
**버전:** v4.3 아키텍처 v1.0
**철학:** "정밀한 부분 제어로 거대한 데이터를 다룬다"

> 거대한 데이터 덩어리에서 필요한 부분만 핀셋으로 집어내듯 정밀하게 다루는 것.
> 이것이 v4.3 슬라이스의 철학입니다.
>
> 기록이 증명이다.
>
> 다음: v4.4 가변 참조(Mutable References)로 슬라이스 데이터를 수정하세요.

# v5.6 아키텍처: String과 &str의 심화 (Text & String Data)

**작성일**: 2026-02-22
**장**: 제5장 - 고급 프로그래밍 개념
**단계**: v5.6 (v5.5의 직접 후속)
**주제**: "텍스트 데이터의 정교한 관리"

---

## 🎯 설계 목표: "문자열, 소유권의 완벽한 이해"

### 패러다임의 심화

```
v5.0~v5.1: 데이터 구조와 메서드 (개별 데이터)
v5.2~v5.4: 열거형과 패턴 (상태 관리)
v5.5:       벡터와 컬렉션 (데이터 집합)
v5.6:       문자열과 텍스트 (특화된 컬렉션)

String은 Vec<u8>의 특화된 버전입니다.
따라서 벡터의 모든 원리를 문자열에 적용할 수 있습니다.
```

### v5.6의 철학

```
"텍스트 데이터의 정교한 관리"

Before: 문자열 = 단순한 텍스트 데이터
  let msg = "hello";  // 그냥 있는 것

After:  문자열 = 소유권 기반 텍스트 컬렉션
  let msg = String::from("hello");  // 소유권을 가짐
  let reference = &msg;              // 빌려옴
  let slice = &msg[0..3];            // 부분 문자열

  각각 다른 목적, 다른 성능, 다른 의미
```

---

## 💎 문자열의 두 얼굴: String vs &str

### 1️⃣ String: 소유권 있는 텍스트

```freelang
// String은 Vec<u8>의 래퍼
struct String {
    vec: Vec<u8>,  // 내부적으로 바이트 벡터
}
```

**특징**:
- **소유권**: String이 텍스트의 소유자
- **메모리**: 힙에 동적 할당
- **크기**: 런타임에 변경 가능
- **생성**: `String::from()`, `String::new()`, `to_string()`

**생성 방법**:
```freelang
// 1. 리터럴에서
let s1 = String::from("hello");

// 2. new()로 빈 String
let mut s2 = String::new();
s2.push_str("world");

// 3. to_string() 메서드
let s3 = "hello".to_string();

// 4. format! 매크로
let s4 = format!("Hello, {}!", "world");
```

**주요 메서드**:
```freelang
s.push(c)           // 문자 추가
s.push_str("text")  // 문자열 추가
s.pop()             // 마지막 문자 제거
s.len()             // 바이트 길이
s.is_empty()        // 비어있는지 확인
s.clear()           // 모든 문자 삭제
s.replace("old", "new")   // 치환
s.to_uppercase()    // 대문자로
s.to_lowercase()    // 소문자로
```

### 2️⃣ &str: 문자열 슬라이스 (참조)

```freelang
// &str은 문자열 데이터에 대한 참조
// String의 일부 또는 전체를 가리킴

let s = String::from("hello world");
let slice = &s[0..5];  // "hello"
```

**특징**:
- **참조**: 다른 String 또는 리터럴을 가리킴
- **메모리**: 스택 (참조 자체) + 힙 (가리키는 데이터)
- **크기**: 불변 (리터럴은 바꿀 수 없음)
- **생성**: 문자열 리터럴, String 슬라이싱

**특수한 &str**:
```freelang
// 문자열 리터럴은 &str
let literal: &str = "hello";      // 불변
let from_string = &String::from("hello");  // String 참조

// 슬라이싱으로 &str 생성
let s = String::from("hello world");
let hello = &s[0..5];              // "hello"
let world = &s[6..11];             // "world"
```

---

## 🔄 String과 &str의 관계

### 관계도

```
String (소유권)
  ↓ &
&str (참조)

String은 "힙에 동적으로 할당된 UTF-8 텍스트"의 소유자
&str은 "어디든 있는 UTF-8 텍스트"에 대한 참조
```

### Deref 강제

```
String → &str로 자동 변환

fn takes_str(s: &str) {
    println(s);
}

let owned = String::from("hello");
takes_str(&owned);  // String → &str (자동 참조)
takes_str("hello");  // &str 리터럴 직접 사용

→ 함수는 &str을 받으면 둘 다 처리 가능
```

---

## 📊 텍스트 데이터의 패턴

### 패턴 1: 문자열 생성과 소유권

```freelang
// String 생성
fn create_owned() -> String {
    String::from("hello")  // 소유권 반환
}

// &str 참조
fn create_ref() -> &'static str {
    "hello"  // 리터럴은 'static lifetime
}

// 사용
let owned = create_owned();    // 소유권 획득
let borrowed = create_ref();   // 참조 획득
```

### 패턴 2: 문자열 수정

```freelang
// String만 수정 가능 (소유권이 있으므로)
fn modify_string() {
    let mut s = String::from("hello");
    s.push_str(" world");      // "hello world"
    s.push('!');               // "hello world!"
}

// &str은 수정 불가 (참조일 뿐)
fn cannot_modify(s: &str) {
    // s.push_str("...");  // ❌ 불가능
}
```

### 패턴 3: 문자열 소유권 이동

```freelang
fn take_ownership(s: String) {
    // s의 소유권 획득
    // 함수 끝에서 s는 drop됨
}

let s = String::from("hello");
take_ownership(s);
// println(s);  // ❌ s는 더 이상 사용 불가
```

### 패턴 4: 문자열 참조와 borrowing

```freelang
fn borrow_string(s: &String) {
    // s를 빌려옴 (참조)
    // 읽기만 가능
}

fn borrow_str(s: &str) {
    // &str을 받음 (더 일반적)
    // String이나 리터럴 모두 가능
}

let s = String::from("hello");
borrow_string(&s);  // String 참조
borrow_str(&s);     // String에서 &str로 변환
borrow_str("hello");  // 리터럴 직접
```

### 패턴 5: 문자열 슬라이싱

```freelang
fn string_slicing() {
    let s = String::from("hello world");

    let hello = &s[0..5];   // "hello"
    let space = &s[5..6];   // " "
    let world = &s[6..11];  // "world"

    // 범위는 문자 경계에서만 유효
    // &s[0..3]은 안됨 (한글 같은 멀티바이트에서)
}
```

### 패턴 6: 문자열 반복

```freelang
fn iterate_string() {
    let s = String::from("hello");

    // 바이트 반복
    for byte in s.as_bytes() {
        println(byte);  // 104, 101, 108, 108, 111
    }

    // 문자 반복
    for c in s.chars() {
        println(c);     // h, e, l, l, o
    }
}
```

---

## 🏛️ 실무 패턴

### 패턴 1: 문자열 작성기 (String Builder)

```freelang
fn build_message() -> String {
    let mut msg = String::new();

    msg.push_str("시작");
    msg.push(' ');
    msg.push_str("중간");
    msg.push(' ');
    msg.push_str("끝");

    msg  // "시작 중간 끝"
}

// 또는 format! 사용
fn build_with_format() -> String {
    let name = "Alice";
    let age = 30;
    format!("이름: {}, 나이: {}", name, age)
}
```

### 패턴 2: 문자열 파싱

```freelang
fn parse_string() -> Option<i32> {
    let s = String::from("42");

    match s.parse::<i32>() {
        Ok(num) => Some(num),
        Err(_) => None,
    }
}
```

### 패턴 3: 문자열 분해

```freelang
fn split_string() {
    let s = String::from("hello,world,rust");

    for part in s.split(',') {
        println(part);  // hello, world, rust
    }
}
```

### 패턴 4: 문자열 검색

```freelang
fn search_string() {
    let s = String::from("hello world hello");

    if s.contains("world") {
        println("found!");
    }

    match s.find("hello") {
        Some(idx) => println("at: " + idx),
        None => println("not found"),
    }
}
```

### 패턴 5: 문자열 정리

```freelang
fn trim_string() {
    let s = String::from("  hello world  ");

    let trimmed = s.trim();     // "hello world"
    let left = s.trim_start();  // "hello world  "
    let right = s.trim_end();   // "  hello world"
}
```

---

## 🔍 UTF-8과 바이트

### UTF-8의 특성

```
String의 내부는 Vec<u8>
각 문자는 1~4 바이트

문자열 길이를 구할 때:
- .len()           → 바이트 길이
- .chars().count() → 문자 개수
```

**예시**:
```freelang
fn utf8_example() {
    let s = String::from("hello");
    println(s.len());           // 5 (h, e, l, l, o 각 1바이트)
    println(s.chars().count()); // 5 (5개 문자)

    let korean = String::from("안녕");
    println(korean.len());           // 6 (각 한글 3바이트)
    println(korean.chars().count()); // 2 (2개 문자)
}
```

---

## 🎨 좋은 문자열 설계의 원칙

### 원칙 1: &str을 선호하라

```
❌ 나쁜 설계:
fn process(s: &String) {
    // String 참조
}

✅ 좋은 설계:
fn process(s: &str) {
    // &str을 받음 (더 유연함)
}

이유: &str은 String과 리터럴 모두 가능
```

### 원칙 2: 소유권이 필요한 경우만 String

```
❌ 나쁜 설계:
fn greet() -> String {
    String::from("hello")  // 불필요하게 String 반환
}

✅ 좋은 설계:
fn greet() -> &'static str {
    "hello"  // 리터럴 반환
}
```

### 원칙 3: 성능 최적화

```
❌ 느린 코드:
let mut s = String::new();
for i in 0..1000 {
    s.push_str(&i.to_string());  // 매번 재할당
}

✅ 빠른 코드:
let mut s = String::with_capacity(5000);  // 미리 할당
for i in 0..1000 {
    s.push_str(&i.to_string());
}
```

---

## 📊 v5.6의 강점

### 1. 소유권과 참조의 실제 활용
- String과 &str의 명확한 역할 분담
- 효율적인 메모리 사용
- 명시적 의도 표현

### 2. 텍스트 데이터의 안전한 처리
- UTF-8 안전성
- 범위 오류 방지
- 자동 메모리 관리

### 3. 성능 최적화
- with_capacity로 재할당 회피
- 참조로 불필요한 복사 방지
- 슬라이싱으로 메모리 공유

### 4. 실무 편의성
- split, contains, find 등의 풍부한 메서드
- format!으로 유연한 문자열 작성
- parse()로 타입 변환

---

## 🌟 v5.6의 의의

### 철학적 의미

```
v5.0~v5.5: 데이터 타입의 이해
  → 구조체, 열거형, 벡터 등

v5.6: 가장 중요한 데이터 타입 = String
  → 텍스트는 모든 시스템의 기초
  → String의 원리 = 소유권과 참조의 원리
  → 문자열을 이해하면 모든 컬렉션을 이해할 수 있음
```

### 실무 의의

```
1. 로깅과 메시지
   → 시스템의 모든 상태는 텍스트로 기록
   → String과 &str로 효율적 처리

2. 데이터 파싱과 검증
   → 입력 데이터는 대부분 텍스트
   → parse(), split(), contains() 등으로 처리

3. 동적 텍스트 생성
   → format!과 String으로 유연한 메시지 작성
   → 성능과 안전성의 균형

4. 텍스트 조작의 안전성
   → UTF-8 자동 보장
   → 슬라이싱 오류 방지
```

---

## 🚀 다음 단계 미리보기

### v5.7: 트레이트 (Traits)

```freelang
// 문자열과 정수 모두 출력할 수 있도록
trait Printable {
    fn print(&self);
}

impl Printable for String {
    fn print(&self) {
        println(self);
    }
}

impl Printable for i32 {
    fn print(&self) {
        println(self);
    }
}
```

**다음**: 서로 다른 타입들이 공통의 행동을 가지도록 하는 추상화!

---

**작성일**: 2026-02-22
**버전**: v5.6 아키텍처 v1.0
**철학**: "텍스트 데이터의 정교한 관리"

> String과 &str은 단순한 텍스트가 아니라,
> 소유권 시스템의 실제 동작을 배우는
> 가장 좋은 교재입니다.
>
> String은 벡터처럼 동작하고,
> &str은 슬라이스처럼 동작합니다.
>
> 이미 배운 모든 원리가 여기에 녹아있습니다.
>
> 저장 필수, 너는 기록이 증명이다 gogs.

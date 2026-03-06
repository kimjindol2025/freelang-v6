# FreeLang v2.6.0: 공식 언어 명세 (Language Specification)

**버전**: v2.6.0
**작성자**: Agent 8
**날짜**: 2026-03-06
**상태**: 최종 확정 ✅

---

## 개요 (Overview)

**FreeLang v2.6.0**은 현대적인 시스템 프로그래밍 언어로, 다음의 목표를 가집니다:

1. **타입 안정성**: 정적 타입 추론으로 런타임 에러 최소화
2. **메모리 안정성**: 빌림 검사로 포인터 에러 방지
3. **고성능**: AOT 컴파일로 네이티브 코드 실행
4. **표현력**: 함수형 + 객체지향 패러다임 지원

---

## 1. 어휘 구조 (Lexical Structure)

### 1.1 토큰 (Token)

FreeLang의 기본 단위는 **토큰**입니다.

#### 키워드 (Keywords)

```
fn let const struct trait impl match if else while for break continue
return pub private module use as where super self crate unsafe async
await move dyn ref mut static type enum union in loop default abstract
virtual final
```

#### 연산자 (Operators)

- 산술: `+`, `-`, `*`, `/`, `%`
- 비교: `==`, `!=`, `<`, `>`, `<=`, `>=`
- 논리: `&&`, `||`, `!`
- 비트: `&`, `|`, `^`, `<<`, `>>`
- 할당: `=`, `+=`, `-=`, `*=`, `/=`
- 기타: `.`, `..`, `=>`, `->`, `::`

#### 리터럴 (Literals)

```
정수:    42, 0xFF, 0b1010
실수:    3.14, 2e-10
문자열:  "hello", r"raw\nstring"
문자:    'a', '\n', '\'
불린:   true, false
```

### 1.2 주석 (Comments)

```freelang
// 한 줄 주석

/*
 * 여러 줄 주석
 * /* 중첩 가능 */
 */

/// 문서 주석 (다음 항목 설명)
fn documented_function() { }

//! 내부 문서 주석 (현재 항목 설명)
```

### 1.3 식별자 (Identifiers)

```
규칙:
- 문자 또는 _로 시작
- 이후 문자, 숫자, _ 포함 가능
- 예: name, _private, snake_case, CONSTANT

관례:
- 함수/변수: snake_case (my_function)
- 상수: UPPER_CASE (MAX_SIZE)
- 타입: PascalCase (MyStruct)
- 모듈: snake_case (my_module)
```

---

## 2. 타입 시스템 (Type System)

### 2.1 기본 타입 (Primitive Types)

| 타입 | 크기 | 범위 | 용도 |
|------|------|------|------|
| i8, i16, i32, i64 | 1, 2, 4, 8 bytes | -2^(n-1) ~ 2^(n-1)-1 | 정수 |
| u8, u16, u32, u64 | 1, 2, 4, 8 bytes | 0 ~ 2^n-1 | 양의 정수 |
| f32, f64 | 4, 8 bytes | IEEE 754 | 실수 |
| bool | 1 byte | true, false | 논리값 |
| char | 4 bytes | U+0000 ~ U+10FFFF | 유니코드 문자 |
| string | 가변 | 유니코드 시퀀스 | 문자열 |

### 2.2 복합 타입 (Composite Types)

#### 배열 (Array)
```
[T; N] - 고정 크기 배열 (스택)
```

#### 벡터 (Vector)
```
Vec<T> - 동적 배열 (힙)
```

#### 튜플 (Tuple)
```
(T1, T2, ..., Tn) - 이름없는 구조체
```

#### 구조체 (Struct)
```
struct Name {
    field1: Type1,
    field2: Type2
}
```

#### 열거형 (Enum)
```
enum Name {
    Variant1,
    Variant2(Type),
    Variant3 { field: Type }
}
```

#### 딕셔너리 (Dict)
```
Dict<K, V> - 해시 맵
```

### 2.3 제네릭 타입 (Generic Types)

```freelang
struct Container<T> {
    item: T
}

impl<T> Container<T> {
    fn new(item: T) -> Self {
        Container { item }
    }
}

fn identity<T>(x: T) -> T { x }
```

### 2.4 타입 추론 (Type Inference)

FreeLang은 **Hindley-Milner** 타입 추론을 사용합니다:

```freelang
let x = 5;              // x: i32 (리터럴 기본값)
let y = 3.14;           // y: f64
let v = vec![1, 2];     // v: Vec<i32>

// 함수의 반환 타입으로 추론
fn parse<T: Parse>(s: &str) -> Result<T, Error> { }
let num: i32 = parse("42")?;  // T = i32
```

---

## 3. 구문 (Syntax)

### 3.1 선언 (Declaration)

#### 함수
```freelang
fn name(param1: Type1, param2: Type2) -> ReturnType {
    // 함수 본체
    expression
}

// 기본값 (선택)
fn greet(name: &str, greeting: &str = "Hello") {
    println!("{} {}", greeting, name);
}
```

#### 변수
```freelang
let name: Type = value;        // 불변
let mut name: Type = value;    // 가변
const NAME: Type = value;      // 컴파일 타임 상수

// 타입 추론
let x = 42;                    // 타입 자동 결정
```

#### 구조체
```freelang
struct Name {
    pub field1: Type1,
    field2: Type2
}

// 메서드
impl Name {
    pub fn method(&self) -> Type { }
    pub fn method_mut(&mut self) { }
    fn static_method() -> Self { }
}
```

#### 열거형
```freelang
enum Name {
    Variant1,
    Variant2(Type),
    Variant3 { field: Type }
}

// 매칭
match value {
    Name::Variant1 => expr,
    Name::Variant2(x) => expr,
    Name::Variant3 { field } => expr
}
```

#### 트레이트
```freelang
trait TraitName {
    fn method(&self) -> Type;
}

impl TraitName for StructName {
    fn method(&self) -> Type { }
}
```

### 3.2 표현식 (Expressions)

#### 산술
```
+, -, *, /, % (우선순위 표준)
```

#### 논리
```
&&, ||, ! (단락 평가)
```

#### 비교
```
==, !=, <, >, <=, >= (모두 bool 반환)
```

#### 할당
```
=, +=, -=, *=, /=, %=, &=, |=, ^=, <<=, >>=
```

#### 호출
```
func(arg1, arg2)     // 함수 호출
obj.method()         // 메서드 호출
arr[index]           // 인덱싱
obj.field            // 필드 접근
```

#### 범위
```
1..5      // [1, 5) 범위
1..=5     // [1, 5] 범위
1..       // 1부터 끝까지
..5       // 처음부터 5 미만
..        // 전체
```

#### 클로저
```
|x| x + 1                // 간단한 클로저
|x, y| { x + y }         // 여러 파라미터
|x: i32| -> i32 { x * 2 }  // 명시적 타입
```

### 3.3 제어흐름

#### if/else
```freelang
if condition {
    // true branch
} else if other_condition {
    // else if branch
} else {
    // else branch
}

// 표현식으로 사용
let result = if condition { value1 } else { value2 };
```

#### match
```freelang
match value {
    pattern1 => expression1,
    pattern2 | pattern3 => expression2,
    range_pattern @ 1..=5 => expression3,
    guard if condition => expression4,
    _ => default_expression
}
```

#### while
```freelang
while condition {
    // 루프 본체
}

loop {
    // 무한 루프
    if break_condition { break; }
}
```

#### for
```freelang
for variable in iterable {
    // 각 원소에 대해 반복
}

for i in 1..10 {
    // 범위 반복
}

for (index, value) in collection.iter().enumerate() {
    // 인덱스와 함께
}
```

---

## 4. 패턴 (Patterns)

### 4.1 패턴 종류

```freelang
// 리터럴 패턴
match x {
    0 => "zero",
    1 => "one",
    _ => "other"
}

// 식별자 패턴
match (x, y) {
    (a, b) => { /* a, b 사용 */ }
}

// 와일드카드
_ => default_case,
_x => unused_but_captured,

// 범위 패턴
1..=5 => "one to five",
'a'..='z' => "lowercase",

// or 패턴
1 | 2 | 3 => "one, two, or three",

// 가드
x if x > 0 => "positive",
Some(x) if x % 2 == 0 => "even option",

// 구조 패턴
Point { x, y } => { /* ... */ }
Some(value) => { /* ... */ }
```

---

## 5. 메모리 & 소유권 (Memory & Ownership)

### 5.1 소유권 규칙

1. **각 값은 소유자가 있다**.
2. **한 번에 하나의 소유자만 있을 수 있다**.
3. **소유자가 스코프를 벗어나면 값이 드롭된다**.

### 5.2 빌림 (Borrowing)

```freelang
// 불변 빌림 (&T)
fn borrow(s: &String) { }

// 가변 빌림 (&mut T)
fn borrow_mut(s: &mut String) { }

// 규칙: 여러 불변 빌림 OR 하나의 가변 빌림
let x = String::new();
let r1 = &x;  // 불변 빌림 OK
let r2 = &x;  // 불변 빌림 OK
// let r3 = &mut x;  // 에러! 가변 빌림 불가
```

### 5.3 라이프타임 (Lifetime)

```freelang
// 참조의 유효 범위를 명시
fn longest<'a>(s1: &'a str, s2: &'a str) -> &'a str {
    if s1.len() > s2.len() { s1 } else { s2 }
}

struct Person<'a> {
    name: &'a str
}

impl<'a> Person<'a> {
    fn new(name: &'a str) -> Person<'a> {
        Person { name }
    }
}
```

---

## 6. 모듈 & 가시성 (Modules & Visibility)

### 6.1 모듈

```freelang
// 파일 기반 모듈
mod utils;      // src/utils.fl에서 자동 로드

mod nested {
    mod inner {
        // src/nested/inner.fl
    }
}

// 모듈 내용
pub fn public_func() { }
fn private_func() { }

pub struct PublicStruct { }
struct PrivateStruct { }
```

### 6.2 임포트 (use)

```freelang
use crate::module::function;
use std::collections::HashMap;
use super::parent_module::item;

// 모듈 다시 내보내기
pub use other_module::item;

// 별칭
use long_module_name as short;

// 와일드카드
use module::*;
```

### 6.3 가시성 (Visibility)

```freelang
pub - 공개 (어디서나 접근 가능)
(없음) - 비공개 (같은 모듈 내에서만)
pub(crate) - 크레이트 내에서만
pub(super) - 부모 모듈에서만
```

---

## 7. 트레이트 (Traits)

### 7.1 트레이트 정의

```freelang
trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;
}

trait Display {
    fn to_string(&self) -> String;
}

// 트레이트 구현
impl Display for i32 {
    fn to_string(&self) -> String {
        format!("{}", self)
    }
}
```

### 7.2 트레이트 바운드

```freelang
fn print_it<T: Display>(val: T) {
    println!("{}", val.to_string());
}

fn clone_and_print<T: Clone + Display>(val: T) -> T {
    println!("{}", val.to_string());
    val.clone()
}

fn process<T>(t: T)
where
    T: Clone + Display,
{
    // ...
}
```

### 7.3 트레이트 객체

```freelang
trait Animal {
    fn sound(&self) -> String;
}

let animals: Vec<&dyn Animal> = vec![
    &dog,
    &cat,
    &cow
];

for animal in animals {
    println!("{}", animal.sound());
}
```

---

## 8. 고급 기능 (Advanced Features)

### 8.1 제네릭

```freelang
struct Point<T> {
    x: T,
    y: T
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

impl Point<f64> {
    fn distance_from_origin(&self) -> f64 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}
```

### 8.2 Associated Types

```freelang
trait Container {
    type Item;

    fn get(&self) -> &Self::Item;
}
```

### 8.3 Unsafe Code

```freelang
unsafe {
    // 안전 검사를 우회하는 코드
    let raw_ptr: *const i32 = &x;
    println!("{}", *raw_ptr);
}
```

---

## 9. 컴파일러 지시어 (Compiler Directives)

### 9.1 속성 (Attributes)

```freelang
#[derive(Debug, Clone)]
struct User { name: String }

#[test]
fn test_something() { }

#[allow(dead_code)]
fn unused_function() { }

#[deprecated]
fn old_function() { }

#[inline]
fn small_function() { }
```

---

## 10. 내장 트레이트 (Built-in Traits)

| 트레이트 | 목적 |
|---------|------|
| Clone | 깊은 복사 |
| Copy | 얕은 복사 (자동) |
| Default | 기본값 제공 |
| Drop | 정리 코드 실행 |
| Debug | 디버그 출력 |
| Display | 사용자 정의 출력 |
| PartialEq | 부분 동등성 비교 |
| Eq | 전체 동등성 비교 |
| PartialOrd | 부분 순서 비교 |
| Ord | 전체 순서 비교 |
| Hash | 해싱 |
| Into / From | 타입 변환 |
| Iterator | 반복 |

---

## 11. 표준 라이브러리 (Standard Library)

FreeLang v2.6.0은 다음의 stdlib 모듈을 제공합니다:

1. **core**: 핵심 타입 및 트레이트
2. **collections**: Vec, Dict, String
3. **io**: 입출력
4. **iter**: 반복자
5. **option**: Option<T> 관련
6. **result**: Result<T, E> 관련
7. **string**: String 메서드
8. **math**: 수학 함수
9. **fs**: 파일 시스템
10. **time**: 시간 관련

---

## 12. 예제

### 12.1 "Hello, World!"

```freelang
fn main() {
    println("Hello, World!");
}
```

### 12.2 제네릭 함수

```freelang
fn first<T>(arr: &[T]) -> Option<&T> {
    if arr.len() > 0 {
        Some(&arr[0])
    } else {
        None
    }
}
```

### 12.3 복합 프로그램

```freelang
struct Person {
    name: String,
    age: u32
}

impl Person {
    fn new(name: String, age: u32) -> Self {
        Person { name, age }
    }

    fn greet(&self) {
        println!("Hello, I'm {} and I'm {} years old", self.name, self.age);
    }
}

trait Animal {
    fn sound(&self) -> &str;
}

impl Animal for Person {
    fn sound(&self) -> &str {
        "Hello"
    }
}

fn main() {
    let person = Person::new("Alice".to_string(), 30);
    person.greet();
    println!("{}", person.sound());
}
```

---

## 13. 컴파일 & 실행

```bash
# 문법 검사
freelang check main.fl

# 실행
freelang run main.fl

# 최적화 빌드
freelang build --release

# 테스트 실행
freelang test
```

---

## 14. 에러 처리

FreeLang은 다음의 에러 종류를 인식합니다:

1. **Syntax Error**: 문법 위반
2. **Type Error**: 타입 미스매치
3. **Lifetime Error**: 라이프타임 위반
4. **Borrow Error**: 빌림 규칙 위반
5. **Resolution Error**: 정의되지 않은 식별자
6. **Semantic Error**: 의미론적 오류

---

## 참고사항

- **Breaking Changes**: 이 문서는 v2.6.0 확정 사양입니다. 이후 버전에서 변경될 수 있습니다.
- **문서화**: 모든 함수는 주석 주석(`///`)으로 문서화됩니다.
- **표준 관례**: PEP 8과 유사한 코딩 스타일 권장

---

**최종 업데이트**: 2026-03-06
**상태**: ✅ 최종 확정
**버전**: 1.0

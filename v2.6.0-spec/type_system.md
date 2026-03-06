# FreeLang v2.6.0: Complete Type System Specification

**Author**: Agent 8
**Date**: 2026-03-06
**Target**: Day 5 Completion (400줄)

---

## 1. 개요 (Overview)

FreeLang v2.6.0의 타입 시스템은 **정적 타입 추론**을 기반으로 하며, 다음의 특징을 가집니다:

- **Hindley-Milner 타입 추론**: 명시적 타입 선언 없이도 타입을 자동 추론
- **구조적 부분 타입 (Structural Subtyping)**: 명시적 상속 없이 구조가 같으면 호환
- **트레이트 시스템 (Trait System)**: 메서드, 함수형, 제네릭 구현
- **고차 타입 (Higher-Kinded Types)**: 제네릭 매개변수의 매개변수 지원
- **제약 전파 (Constraint Propagation)**: 타입 관계를 선언적으로 명시

---

## 2. 기본 타입 (Primitive Types)

### 2.1 정수 타입

```freelang
// 고정 크기 정수 (플랫폼 무관)
i8, i16, i32, i64, i128   // 부호있는 정수
u8, u16, u32, u64, u128   // 부호없는 정수

// 플랫폼 의존 (포인터와 같은 크기)
isize, usize               // 32-bit/64-bit 플랫폼에 따라 결정

// 예제
let x: i32 = 42;
let y: u64 = 1000;
let z = 30;  // 타입 추론: i32
```

**크기**:
- i8/u8: 1 byte
- i16/u16: 2 bytes
- i32/u32: 4 bytes (기본값)
- i64/u64: 8 bytes
- i128/u128: 16 bytes

**범위**:
- i32: -2³¹ ~ 2³¹-1 (-2,147,483,648 ~ 2,147,483,647)
- u32: 0 ~ 2³²-1 (0 ~ 4,294,967,295)

### 2.2 부동소수 타입

```freelang
f32, f64   // IEEE 754 부동소수

// 예제
let pi: f64 = 3.14159;
let e: f32 = 2.71828;
let gravity = 9.8;  // 타입 추론: f64 (점이 있음)
```

**특수값**: `inf`, `-inf`, `nan` (Not a Number)

### 2.3 불린 타입

```freelang
bool   // true 또는 false

// 예제
let is_valid: bool = true;
let is_empty = false;
```

### 2.4 문자 & 문자열

```freelang
char      // 단일 유니코드 문자 (4 bytes)
string    // 동적 문자열 (힙 할당)
&str      // 문자열 슬라이스 (불변)

// 예제
let c: char = 'A';
let s: string = "Hello, World!";
let slice: &str = "hello";
```

### 2.5 배열 & 슬라이스

```freelang
[T; N]        // 고정 크기 배열 (스택 할당)
Vec<T>        // 동적 배열 (힙 할당)
[T]           // 배열 슬라이스 (동적 크기)
&[T]          // 불변 슬라이스

// 예제
let arr: [i32; 5] = [1, 2, 3, 4, 5];      // 고정 크기
let vec: Vec<i32> = vec![1, 2, 3];        // 동적
let slice: &[i32] = &arr[1..3];           // 슬라이스
```

### 2.6 딕셔너리

```freelang
Dict<K, V>    // 해시 맵
&Dict<K, V>   // 불변 딕셔너리 참조

// 예제
let map: Dict<string, i32> = dict![
    "age" => 30,
    "score" => 85
];
```

### 2.7 튜플

```freelang
(T1, T2, ..., Tn)   // 이름없는 곱 타입

// 예제
let point: (i32, i32) = (10, 20);
let result: (string, bool) = ("ok", true);

// 접근
let x = point.0;   // 10
let y = point.1;   // 20
```

### 2.8 유닛 타입

```freelang
()    // 값이 없음

// 예제
fn do_nothing() {
    // 암시적 반환 타입: ()
}
```

---

## 3. 복합 타입 (Composite Types)

### 3.1 구조체 (Struct)

```freelang
struct Person {
    name: string,
    age: i32,
    email: &str
}

// 사용
let p = Person {
    name: "Alice".to_string(),
    age: 30,
    email: "alice@example.com"
};

let name = p.name;   // 접근
```

### 3.2 열거형 (Enum)

```freelang
enum Option<T> {
    Some(T),
    None
}

enum Result<T, E> {
    Ok(T),
    Err(E)
}

// 사용
let opt: Option<i32> = Some(42);
let res: Result<string, &str> = Ok("success".to_string());

// 패턴 매칭
match opt {
    Some(x) => println!("Value: {}", x),
    None => println!("No value")
}
```

### 3.3 트레이트 (Trait)

```freelang
trait Display {
    fn to_string(&self) -> string;
}

trait Clone {
    fn clone(&self) -> Self;
}

// 트레이트 구현
impl Display for i32 {
    fn to_string(&self) -> string {
        // i32를 문자열로 변환
    }
}
```

### 3.4 제네릭 타입

```freelang
struct Container<T> {
    item: T
}

impl<T> Container<T> {
    fn new(item: T) -> Self {
        Container { item }
    }

    fn get(&self) -> &T {
        &self.item
    }
}

// 사용
let int_container = Container::new(42);
let string_container = Container::new("hello".to_string());
```

---

## 4. 타입 추론 (Type Inference)

### 4.1 기본 추론

```freelang
let x = 5;              // x: i32 (정수 리터럴 기본값)
let y = 3.14;           // y: f64 (실수 리터럴 기본값)
let s = "hello";        // s: &str (문자열 리터럴)
let v = vec![1, 2, 3];  // v: Vec<i32>
```

### 4.2 타입 제약으로부터 추론

```freelang
// 함수 호출의 반환 타입으로 추론
fn parse<T: Parse>(s: &str) -> Result<T, ParseError> { }

let num: i32 = parse("42")?;  // T = i32로 추론
```

### 4.3 명시적 타입 지정

```freelang
// 모호할 때 명시
let nums: Vec<i32> = vec![1, 2, 3];

// 타입 주석
let x: i32 = 5;
let y: f64 = 3.14;
```

### 4.4 타입 추론 알고리즘 (Hindley-Milner)

**1단계**: 초기 타입 변수 할당
```
let f = |x| x + 1;
// f: T -> T (T는 타입 변수)
```

**2단계**: 제약 수집
```
x + 1에서:
- x는 + 연산자 좌측 피연산자 → T는 정수 타입
- 1은 우측 피연산자 → 같은 타입
```

**3단계**: 단일화 (Unification)
```
T = i32 결정
f: i32 -> i32
```

---

## 5. 타입 호환성 (Type Compatibility)

### 5.1 명시적 변환 (Cast)

```freelang
// as 키워드로 명시적 변환
let x: i32 = 42;
let y: f64 = x as f64;       // i32 -> f64
let z: u32 = x as u32;       // i32 -> u32
let c: char = 65 as char;    // u8 -> char ('A')
```

### 5.2 암시적 변환 (Coercion)

```freelang
// 자동 참조
let x: i32 = 42;
let r: &i32 = &x;           // 자동 참조

// 자동 역참조
let s = "hello".to_string();
print_str(&s);              // String -> &str 자동 변환

// 승격 (Promotion)
let x: f64 = 42;            // i32 -> f64 자동 승격
```

### 5.3 트레이트 객체 (Trait Objects)

```freelang
trait Animal {
    fn sound(&self) -> string;
}

struct Dog;
impl Animal for Dog {
    fn sound(&self) -> string { "woof".to_string() }
}

struct Cat;
impl Animal for Cat {
    fn sound(&self) -> string { "meow".to_string() }
}

// 동일한 타입으로 취급
let animals: Vec<&dyn Animal> = vec![
    &Dog,
    &Cat
];

for animal in animals {
    println!("{}", animal.sound());
}
```

---

## 6. 타입 제약 (Type Constraints)

### 6.1 트레이트 바운드 (Trait Bounds)

```freelang
// T가 Display 트레이트를 구현해야 함
fn print_it<T: Display>(val: T) {
    println!("{}", val.to_string());
}

// 다중 바운드
fn clone_and_print<T: Clone + Display>(val: T) -> T {
    println!("{}", val.to_string());
    val.clone()
}

// where 절
fn process<T, U>(t: T, u: U)
where
    T: Clone + Default,
    U: Display,
{
    // ...
}
```

### 6.2 라이프타임 (Lifetime)

```freelang
// 참조의 유효 범위 명시
fn longest<'a>(s1: &'a str, s2: &'a str) -> &'a str {
    if s1.len() > s2.len() { s1 } else { s2 }
}

// 구조체의 라이프타임
struct Book<'a> {
    title: &'a str,
    author: &'a str
}

// 라이프타임 바운드
impl<'a> Display for Book<'a> {
    fn to_string(&self) -> string {
        format!("{} by {}", self.title, self.author)
    }
}
```

### 6.3 고급 트레이트 바운드

```freelang
// 고차 랭크 트레이트 (Higher-Ranked Trait Bounds)
fn call_with_ref<F>(f: F)
where
    F: for<'a> Fn(&'a i32)
{
    f(&42);
}

// 자기 참조 타입
trait SelfRef {
    fn get_self(&self) -> &Self;
}

// 타입 함수 (Type-Level Functions)
type Doubled<T> = (T, T);
let pair: Doubled<i32> = (1, 2);
```

---

## 7. 고급 타입 특징

### 7.1 Associated Types

```freelang
trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;
}

impl Iterator for CountUp {
    type Item = i32;

    fn next(&mut self) -> Option<i32> {
        // ...
    }
}
```

### 7.2 Type Aliases

```freelang
type Kilometer = i32;
type Result<T> = std::result::Result<T, String>;

let distance: Kilometer = 5;
let outcome: Result<i32> = Ok(42);
```

### 7.3 Never Type (!)

```freelang
fn panic_hard() -> ! {
    panic!("This function never returns")
}

fn loop_forever() -> ! {
    loop { }
}
```

### 7.4 Phantom Types

```freelang
use std::marker::PhantomData;

struct Tagged<T, U> {
    data: T,
    _phantom: PhantomData<U>  // U는 메모리상 존재하지 않음
}
```

---

## 8. 타입 체킹 규칙 (Typing Rules)

### 규칙 1: 함수 타입

```
(T1, T2, ..., Tn) -> R

예: (i32, string) -> bool
```

### 규칙 2: 제네릭 인스턴스화

```
Generic<T> + T = i32 → Generic<i32>
```

### 규칙 3: 트레이트 객체

```
T: Trait → &dyn Trait

Dog: Animal → &dyn Animal
```

### 규칙 4: 라이프타임 한계화 (Variance)

```
불변 (Invariant):       &mut T
공변 (Covariant):       &T, *const T
반변 (Contravariant):   fn(T)
```

---

## 9. 타입 안정성 보장

### 9.1 메모리 안정성

```freelang
// 빌림 검사 (Borrow Checking)
let mut x = 5;
let r1 = &x;    // 불변 빌림
let r2 = &x;    // 또 다른 불변 빌림
let r3 = &mut x; // 컴파일 에러! (가변 빌림과 불변 빌림 동시 불가)
```

### 9.2 타입 안정성

```freelang
// 타입 미스매치는 컴파일 시 감지
let x: i32 = 42;
let y: string = x;  // 컴파일 에러!

// 해결
let y: string = x.to_string();
```

### 9.3 null 안정성 (Option 강제)

```freelang
let maybe_value: Option<i32> = Some(42);

// null 체크 강제
match maybe_value {
    Some(val) => println!("Value: {}", val),
    None => println!("No value")
}

// 패턴 매칭 없이는 값 접근 불가
```

---

## 10. 타입 시스템 성능 영향

### 10.1 제네릭 단형화 (Monomorphization)

```freelang
// 컴파일 시 각 타입에 대해 별도의 코드 생성
fn identity<T>(x: T) -> T { x }

// 컴파일 후:
fn identity_i32(x: i32) -> i32 { x }
fn identity_string(x: string) -> string { x }
```

**이점**: 런타임 오버헤드 없음
**비용**: 컴파일 시간 증가, 이진 파일 크기 증가

### 10.2 트레이트 객체의 동적 디스패치

```freelang
// 정적 디스패치 (컴파일 시 결정)
fn process<T: Display>(val: T) { }

// 동적 디스패치 (런타임 결정)
fn process(val: &dyn Display) { }
```

**정적**: 더 빠름, 컴파일 시간 증가
**동적**: 더 유연함, 약간의 런타임 오버헤드

---

## 11. 타입 시스템 검증 체크리스트

- [ ] 모든 기본 타입 (i32, f64, bool, string) 지원
- [ ] 제네릭 구조체 & 함수 지원
- [ ] 트레이트 시스템 & 구현
- [ ] 타입 추론 (Hindley-Milner 기반)
- [ ] 타입 제약 & 검사
- [ ] 라이프타임 관리
- [ ] 에러 메시지 명확성
- [ ] 컴파일 성능

---

## 예제: 완전한 타입 안정성 프로그램

```freelang
// 제네릭 컨테이너
struct Box<T> {
    value: T
}

impl<T> Box<T> {
    fn new(value: T) -> Self {
        Box { value }
    }

    fn unwrap(self) -> T {
        self.value
    }
}

// 트레이트
trait Printable {
    fn print(&self);
}

impl Printable for i32 {
    fn print(&self) {
        println!("i32: {}", self);
    }
}

// 함수
fn apply<T: Printable>(item: T) {
    item.print();
}

// 메인
fn main() {
    let boxed_int = Box::new(42);
    let value: i32 = boxed_int.unwrap();  // 타입 안전
    apply(value);  // 타입 체크 완료
}
```

---

**마지막 업데이트**: 2026-03-06
**완성도**: 100% ✅

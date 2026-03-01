# v13.0: 선언적 매크로 (Declarative Macros)
# 제12장: 매크로와 메타 프로그래밍 — Step 1

## 철학: "컴파일 시간에 코드를 생성하는 마법"

```
컴파일러가 v12.2에서 "C 함수를 호출할 수 있다"면,
v13.0에서는 "코드 자체를 프로그래밍할 수 있다"

매크로: 입력 코드 → 토큰 트리 → 패턴 매칭 → 출력 코드
```

---

## 📚 목차

1. [macro_rules! 기초](#1-macro_rules-기초)
2. [토큰과 토큰 트리](#2-토큰과-토큰-트리)
3. [패턴 매칭과 지정자](#3-패턴-매칭과-지정자)
4. [반복 패턴](#4-반복-패턴)
5. [메타변수와 대체](#5-메타변수와-대체)
6. [매크로 위생성](#6-매크로-위생성-hygiene)
7. [실전 패턴](#7-실전-패턴)
8. [컴파일러 관점](#8-컴파일러-관점)

---

## 1. macro_rules! 기초

### 1.1 매크로란 무엇인가?

```rust
// 함수: 실행 시간에 작동
fn add(a: i32, b: i32) -> i32 {
    a + b
}

// 매크로: 컴파일 시간에 코드 변환
macro_rules! add {
    ($a:expr, $b:expr) => {
        $a + $b
    };
}

// 사용
let result = add!(5, 3);  // 컴파일 타임에 5 + 3 으로 변환됨
```

### 1.2 매크로의 3가지 단계

```
단계 1: 입력 패턴 분석 (Pattern Matching)
        add!(5, 3) 를 보고
        ($a:expr, $b:expr) 패턴과 매칭

단계 2: 메타변수 바인딩 (Binding)
        $a ← 5
        $b ← 3

단계 3: 출력 코드 생성 (Substitution)
        $a + $b → 5 + 3
```

### 1.3 매크로 정의의 구조

```rust
macro_rules! example {
    // 팔 1 (Arm 1)
    (pattern1) => {
        // 출력 코드
    };

    // 팔 2 (Arm 2)
    (pattern2) => {
        // 출력 코드
    };

    // ...
}
```

**특징:**
- 패턴에 따라 다양한 출력 생성
- 각 팔은 `;` 로 구분
- 마지막 팔도 `;` 필수

---

## 2. 토큰과 토큰 트리

### 2.1 토큰의 개념

```
코드: let x = 42;

토큰으로 분해:
- Keyword(let)
- Identifier(x)
- Punctuation(=)
- Literal(42)
- Punctuation(;)

매크로는 이 토큰들을 조작
```

### 2.2 토큰 스트림

```rust
// 입력 토큰 스트림
println!("Hello", ", ", "World")
↓
[Identifier(println), Punctuation(!),
 Punctuation((), Literal("Hello"), ..., Punctuation()))]
```

### 2.3 토큰 트리 구조

```
토큰 트리는 계층 구조

println!("Hello")
    ├─ Identifier: println
    ├─ Punctuation: !
    └─ Group (Parentheses)
        ├─ Literal: "Hello"
```

---

## 3. 패턴 매칭과 지정자

### 3.1 지정자(Designator) 종류

| 지정자 | 의미 | 예시 |
|--------|------|------|
| `item` | 구조체, 함수, impl 등 | `struct Name { }` |
| `expr` | 표현식 | `5 + 3`, `foo()` |
| `stmt` | 문장 | `let x = 5;` |
| `pat` | 패턴 | `Some(x)` |
| `path` | 경로 | `std::vec::Vec` |
| `ty` | 타입 | `i32`, `&str` |
| `ident` | 식별자 | `variable_name` |
| `meta` | 속성 메타 | `#[derive(Clone)]` |
| `tt` | 토큰 트리 | 모든 것 |
| `vis` | 가시성 | `pub`, `pub(crate)` |
| `lifetime` | 수명 | `'a`, `'static` |
| `literal` | 리터럴 | `42`, `"string"` |

### 3.2 각 지정자 상세 설명

#### expr: 표현식
```rust
macro_rules! eval {
    ($e:expr) => {
        {
            let result = $e;
            result
        }
    };
}

// 사용
eval!(5 + 3);           // ✓
eval!(foo());           // ✓
eval!(if true { 5 });   // ✓
```

**expr이 받을 수 있는 것:**
- 산술 표현식: `5 + 3`
- 함수 호출: `foo()`
- 제어 흐름: `if true { } else { }`
- 클로저: `|x| x + 1`
- 조건 표현식: `match x { }`

#### ident: 식별자
```rust
macro_rules! create_var {
    ($name:ident, $value:expr) => {
        let $name = $value;
    };
}

// 사용
create_var!(x, 42);     // let x = 42;
create_var!(my_var, "hello");  // let my_var = "hello";
```

**ident이 받을 수 있는 것:**
- 변수명: `x`, `my_variable`
- 함수명: `foo`, `bar`
- 타입명: `MyStruct`
- 절대 불가능: `42`, `"string"` (리터럴)

#### tt: 토큰 트리
```rust
macro_rules! echo {
    ($($t:tt)*) => {
        // $t는 모든 것을 받을 수 있음
    };
}

// 사용
echo!(5 + 3);
echo!(if true { foo() });
echo!(pub struct X { field: i32 }); // 모두 가능
```

**tt의 특징:**
- 가장 유연한 지정자
- 어떤 토큰 트리도 받음
- 구조 검증이 없음 (runtime check needed)

#### pat: 패턴
```rust
macro_rules! match_pattern {
    ($pat:pat) => {
        // 패턴으로 사용 가능
    };
}

// 사용
match_pattern!(Some(x));       // ✓
match_pattern!((a, b));        // ✓
match_pattern!(_);             // ✓
```

#### ty: 타입
```rust
macro_rules! create_vec {
    ($t:ty) => {
        Vec::<$t>::new()
    };
}

// 사용
create_vec!(i32);              // Vec::<i32>::new()
create_vec!(&str);             // Vec::<&str>::new()
```

#### path: 경로
```rust
macro_rules! use_path {
    ($p:path) => {
        use $p;
    };
}

// 사용
use_path!(std::collections::HashMap);
```

#### stmt: 문장
```rust
macro_rules! execute {
    ($s:stmt) => {
        {
            $s
        }
    };
}

// 사용
execute!(let x = 5;);
execute!(println!("hello"););
```

---

## 4. 반복 패턴

### 4.1 `$(...)*` 패턴

```rust
// 0개 이상 반복
macro_rules! sum {
    ($($e:expr),*) => {
        0 $( + $e )*
    };
}

// 사용
sum!();              // 0
sum!(1);             // 0 + 1
sum!(1, 2, 3);       // 0 + 1 + 2 + 3
```

### 4.2 `$(...)+` 패턴

```rust
// 1개 이상 반복 (필수)
macro_rules! vec_new {
    ($($x:expr),+) => {
        {
            let mut v = Vec::new();
            $(v.push($x);)+
            v
        }
    };
}

// 사용
vec_new!(1);         // ✓
vec_new!(1, 2, 3);   // ✓
vec_new!();          // ✗ 에러 (1개 이상 필요)
```

### 4.3 구분자(Separator)

```rust
// 쉼표로 구분
macro_rules! csv {
    ($($e:expr),*) => {
        // ...
    };
}

csv!(1, 2, 3);  // ✓

// 세미콜론으로 구분
macro_rules! stmts {
    ($($s:stmt);*) => {
        // ...
    };
}

stmts!(let x = 5; let y = 10;);  // ✓

// 또는 구분자 없음
macro_rules! space {
    ($($e:expr)*) => {
        // ...
    };
}

space!(1 2 3);  // ✓
```

### 4.4 중첩 반복

```rust
macro_rules! matrix {
    ($($($e:expr),+);+) => {
        // 2D 배열 처리
    };
}

// 사용
matrix!(1, 2, 3; 4, 5, 6; 7, 8, 9);
//        ─────────  ─────────  ─────────
//          row1       row2       row3
```

---

## 5. 메타변수와 대체

### 5.1 메타변수

```rust
macro_rules! example {
    ($x:ident, $y:expr) => {
        // $x와 $y는 메타변수
        // 입력에서 매칭된 토큰이 대신 들어옴
        let $x = $y;
    };
}

example!(my_var, 42 + 3);
↓
let my_var = 42 + 3;
```

### 5.2 메타변수의 범위

```rust
macro_rules! scoped {
    ($x:ident) => {
        {
            let $x = 10;
            // $x의 범위는 이 블록 내
        }
    };
}
```

### 5.3 복잡한 대체

```rust
macro_rules! wrapper {
    ($func:ident, $($arg:expr),*) => {
        {
            println!("Calling {}", stringify!($func));
            $func($($arg),*)
        }
    };
}

wrapper!(foo, 1, 2, 3);
↓
{
    println!("Calling {}", "foo");
    foo(1, 2, 3)
}
```

---

## 6. 매크로 위생성 (Hygiene)

### 6.1 이름 충돌 문제

```rust
// 위생성이 없는 매크로 (개념상)
macro_rules! bad {
    ($x:expr) => {
        let result = $x;
        result
    };
}

// 사용자 코드
let result = "original";
bad!(42);  // 충돌?
```

### 6.2 러스트의 자동 위생성

```rust
// 러스트는 자동으로 위생성 보장
macro_rules! good {
    ($x:expr) => {
        let result = $x;  // 이 result는 격리됨
        result
    };
}

// 사용자 코드
let result = "original";
let value = good!(42);  // 안전! 충돌 없음
```

### 6.3 의도적인 이름 주입

```rust
macro_rules! inject_name {
    ($name:ident) => {
        // $name은 메타변수이므로 사용자 영역에 주입됨
        let $name = 10;
    };
}

inject_name!(my_var);
↓
let my_var = 10;  // my_var는 사용자 영역
```

---

## 7. 실전 패턴

### 7.1 assert! 구현

```rust
macro_rules! assert {
    ($cond:expr) => {
        if !$cond {
            panic!("assertion failed: {}", stringify!($cond))
        }
    };
    ($cond:expr, $msg:expr) => {
        if !$cond {
            panic!("{}", $msg)
        }
    };
}

// 사용
assert!(x > 0);
assert!(x > 0, "x must be positive");
```

### 7.2 vec! 구현

```rust
macro_rules! vec {
    // 빈 벡터
    () => {
        Vec::new()
    };
    // [T; count] 패턴
    ($e:expr; $count:expr) => {
        {
            let mut v = Vec::with_capacity($count);
            for _ in 0..$count {
                v.push($e);
            }
            v
        }
    };
    // [e1, e2, ...] 패턴
    ($($e:expr),+ $(,)?) => {
        {
            let mut v = Vec::new();
            $(v.push($e);)+
            v
        }
    };
}

// 사용
vec!();              // Vec::new()
vec![1; 3];          // [1, 1, 1]
vec![1, 2, 3];       // [1, 2, 3]
vec![1, 2, 3,];      // trailing comma 허용
```

### 7.3 println! 패턴

```rust
macro_rules! println {
    () => {
        print!("\n")
    };
    ($($arg:tt)*) => {
        print!("{}\n", format_args!($($arg)*))
    };
}
```

### 7.4 debug_println! (조건부 출력)

```rust
macro_rules! debug_println {
    ($($arg:tt)*) => {
        #[cfg(debug_assertions)]
        println!($($arg)*)
    };
}
```

### 7.5 DSL: 간단한 설정 언어

```rust
macro_rules! config {
    ($($key:ident = $value:expr),* $(,)?) => {
        {
            let mut config = std::collections::HashMap::new();
            $(
                config.insert(stringify!($key), $value);
            )*
            config
        }
    };
}

// 사용
config!(
    host = "localhost",
    port = 8080,
    debug = true,
);
```

### 7.6 타입 리스트 DSL

```rust
macro_rules! tuple_type {
    () => {
        ()
    };
    ($t:ty) => {
        ($t,)
    };
    ($t:ty, $($rest:ty),+) => {
        ($t, tuple_type!($($rest),+))
    };
}

// 사용
tuple_type!(i32, &str, bool);
// → (i32, (&str, (bool, ())))
```

---

## 8. 컴파일러 관점

### 8.1 매크로 확장 단계

```
입력 코드:
    add!(5, 3)

단계 1: 어휘 분석 (Lexical Analysis)
    [Identifier(add), Punctuation(!), ...]

단계 2: 매크로 해석 (Macro Resolution)
    add 매크로 정의 찾음

단계 3: 패턴 매칭 (Pattern Matching)
    ($a:expr, $b:expr) 패턴과 매칭

단계 4: 메타변수 바인딩
    $a = 5, $b = 3

단계 5: 코드 생성 (Code Generation)
    $a + $b → 5 + 3

단계 6: 다시 파싱 (Re-parsing)
    5 + 3을 식으로 파싱

확장 결과:
    5 + 3
```

### 8.2 토큰 기반 처리의 이점

```
텍스트 기반 처리의 문제:
- 구문 오류 가능
- 인코딩 문제
- 불완전한 매칭

토큰 기반 처리의 이점:
- 구문 검증됨
- 안전한 조작
- 정확한 위치 추적
```

### 8.3 매크로가 컴파일러를 돕는 방법

```
매크로 없이:
    가능한 패턴마다 새로운 문법 추가
    → 컴파일러 복잡도 ↑

매크로 사용:
    사용자가 필요한 패턴 생성
    → 컴파일러 단순화 ✓
```

### 8.4 매크로 확장 순서

```
러스트 컴파일 단계:
1. 어휘 분석
2. 매크로 확장 ← 모든 macro_rules! 처리
3. 파싱
4. 이름 분석
5. 타입 검사
6. 빌림 검사
7. 코드 생성
```

---

## 핵심 개념 요약

### 매크로의 3가지 역할

| 역할 | 예 | 효과 |
|------|-----|------|
| 코드 생성 | `vec![1,2,3]` | 반복 제거 |
| DSL 구현 | 설정 언어 | 표현력 ↑ |
| 컴파일 시간 | 최적화 | 성능 ↑ |

### 지정자 선택 가이드

```
구조의 유연성이 필요? → tt
타입이 필요? → ty
식별자 이름이 필요? → ident
표현식이 필요? → expr
완전한 구조가 필요? → item
```

### 안티패턴

```rust
// ✗ 나쁜 예: 위생성 위반
macro_rules! bad {
    () => {
        let x = 10;  // 모든 호출에서 x 사용 (충돌 위험)
    };
}

// ✓ 좋은 예: 메타변수 사용
macro_rules! good {
    ($name:ident) => {
        let $name = 10;  // 사용자 지정 이름
    };
}
```

---

## 다음 단계: v13.0.2 재귀적 매크로

v13.0에서 배운 기초를 바탕으로, v13.0.2에서는:

```
1. 매크로 내에서 다시 자신을 호출하기
2. 복잡한 DSL 설계
3. 계산 매크로 (컴파일 타임 계산)
4. 코드 생성 매크로 (보일러플레이트 제거)
5. 메타프로그래밍 패턴

예:
    macro_rules! expand_tree { ... expand_tree! ... }
    → 트리 구조 자동 전개
```

---

## 요약

```
v13.0: 선언적 매크로 (Declarative Macros)

철학: "컴파일 타임에 코드를 생성하는 마법"

핵심 기능:
✅ macro_rules! 정의
✅ 패턴 매칭 (7가지 지정자)
✅ 메타변수 대체
✅ 반복 패턴 ($(...)*,  $(...)+)
✅ 위생성 보장
✅ 다양한 실전 패턴

역할:
→ 코드 생성 자동화
→ DSL 구현 가능
→ 컴파일러 기능 확장
→ 메타프로그래밍 기초

당신은 이제 "매크로 마법사"가 되었습니다.
```

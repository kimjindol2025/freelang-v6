# v13.0.2 고급 DSL 패턴 가이드
# 재귀 한계, 가독성, 토큰 트리의 유연성

## 철학: "재귀의 경계에서 창의적인 문법을 창조하라"

---

## 📚 목차

1. [재귀 단계의 해부](#1-재귀-단계의-해부)
2. [재귀 한계와 최적화](#2-재귀-한계와-최적화)
3. [DSL 설계의 패턴](#3-dsl-설계의-패턴)
4. [가독성과 유지보수](#4-가독성과-유지보수)
5. [토큰 트리의 유연성](#5-토큰-트리의-유연성)
6. [실전 예제: 컴파일러 설정 DSL](#6-실전-예제-컴파일러-설정-dsl)

---

## 1. 재귀 단계의 해부

### 1.1 기본 구조

```rust
macro_rules! process {
    // 기저 사례 (Base Case)
    // 모든 입력을 처리했을 때의 종료 조건
    () => {
        // 처리 종료
    };

    // 재귀 사례 (Recursive Case)
    // 첫 번째 항목을 처리하고, 나머지는 다시 매크로에 넘김
    ($first:expr, $($rest:expr),*) => {
        // 첫 번째 항목 처리
        process_item!($first);

        // 나머지 항목을 재귀 호출
        process!($($rest),*);
    };
}
```

### 1.2 단계별 실행 흐름

```
입력: process!(a, b, c)

Step 1: 패턴 매칭
  ($first:expr, $($rest:expr),*) 와 매칭
  $first = a
  $($rest),* = (b, c)

Step 2: 첫 항목 처리
  process_item!(a);

Step 3: 재귀 호출
  process!(b, c);

Step 4: 패턴 매칭
  $first = b
  $($rest),* = (c)

Step 5: 첫 항목 처리
  process_item!(b);

Step 6: 재귀 호출
  process!(c);

Step 7: 패턴 매칭
  $first = c
  $($rest),* = ()  ← 빈 리스트

Step 8: 첫 항목 처리
  process_item!(c);

Step 9: 재귀 호출
  process!();  ← 기저 사례 도달!

Step 10: 종료
  () => { } 매칭, 완료
```

### 1.3 언제 기저 사례에 도달하는가?

```rust
// $($rest),* 는 0개 이상을 의미
// 따라서 마지막 항목을 처리한 후
// process!() 로 호출되면 기저 사례 도달

macro_rules! demo {
    () => { println!("Base case!"); };
    ($x:expr, $($rest:expr),*) => {
        println!("Processing: {}", $x);
        demo!($($rest),*);
    };
}

demo!(1, 2, 3);
// Output:
// Processing: 1
// Processing: 2
// Processing: 3
// Base case!
```

---

## 2. 재귀 한계와 최적화

### 2.1 기본 재귀 한계

```
러스트 컴파일러의 기본 설정:
매크로 재귀 깊이: 128회

초과하면:
error[E0072]: recursive type `...` has infinite size
     |
     = help: try using `Box<...>` to break the cycle

또는

error: recursion limit exceeded while instantiating `...`
```

### 2.2 재귀 한계 확장

```rust
// Crate root에 추가
#![recursion_limit = "256"]

// 또는 특정 모듈
#![cfg_attr(feature = "large_macros", recursion_limit = "512")]
```

### 2.3 깊이 최적화 전략

```rust
// ❌ 비효율적: 깊은 재귀
macro_rules! inefficient {
    () => {};
    ($x:expr, $($rest:expr),*) => {
        process($x);
        inefficient!($($rest),*);
    };
}

// ✓ 효율적: 누적자 패턴
macro_rules! efficient {
    ($acc:expr) => {
        $acc
    };
    ($acc:expr, $x:expr, $($rest:expr),*) => {
        efficient!($acc + $x, $($rest),*)
    };
}

// 누적자로 시작
efficient!(0, 1, 2, 3, 4, 5)
// → efficient!(1, 2, 3, 4, 5)
// → efficient!(3, 3, 4, 5)
// → efficient!(6, 4, 5)
// → efficient!(10, 5)
// → efficient!(15)
// → 15
```

---

## 3. DSL 설계의 패턴

### 3.1 키-값 DSL

```rust
macro_rules! config {
    // 기저: 완료
    () => {};

    // 마지막 항목 (쉼표 없음)
    ($key:ident => $val:expr) => {
        config!($key => $val,);
    };

    // 일반 항목
    ($key:ident => $val:expr, $($rest:tt)*) => {
        println!("  [CONFIG] {} = {}", stringify!($key), $val);
        config!($($rest)*);
    };
}

config!(
    version => "1.0",
    debug => true,
    threads => 4
);
```

### 3.2 구조화된 DSL

```rust
macro_rules! struct_def {
    // 기저: 완료
    (end $name:ident { }) => {
        struct $name { }
    };

    // 필드 추가
    (
        @process
        $name:ident
        { $($fields:tt)* }
        $field:ident : $ty:ty
        $($rest:tt)*
    ) => {
        struct_def!(
            @process
            $name
            { $($fields)* $field: $ty, }
            $($rest)*
        );
    };

    // 진입점
    ($name:ident { $($body:tt)* }) => {
        struct_def!(@process $name { } $($body)*);
    };
}

struct_def!(Point {
    x: i32
    y: i32
    z: i32
});
```

### 3.3 상태 기계 DSL

```rust
macro_rules! state_machine {
    // 기저: 완료
    (@end $name:ident, $states:expr) => {
        println!("State machine {} defined with states: {:?}",
                 stringify!($name), $states);
    };

    // 상태 추가
    (@add $name:ident, [$($state:ident),*], $new:ident, $($rest:tt)*) => {
        state_machine!(@add $name, [$($state),*, $new], $($rest)*);
    };

    // 진입점
    ($name:ident { $($states:ident),+ }) => {
        state_machine!(@add $name, [], $($states),+);
    };
}

state_machine!(MyFSM {
    Start, Running, Paused, Stopped
});
```

---

## 4. 가독성과 유지보수

### 4.1 내부 규칙과 공개 규칙 분리

```rust
macro_rules! my_dsl {
    // ✓ 공개 규칙 (사용자 호출)
    ($input:tt) => {
        my_dsl!(@parse $input);
    };

    // ✓ 내부 규칙 (@접두사)
    (@parse $value:expr) => {
        println!("Parsed: {}", $value);
    };

    // ✓ 재귀 규칙 (@@접두사)
    (@@recurse $x:expr, $($rest:expr),*) => {
        my_dsl!(@@recurse_step $x);
        my_dsl!(@@recurse $($rest),*);
    };

    (@@recurse) => {};

    (@@recurse_step $x:expr) => {
        println!("Step: {}", $x);
    };
}

// 사용자는 이것만 봄
my_dsl!(42);
```

### 4.2 명확한 주석과 문서화

```rust
/// 사용자 정의 설정 DSL
///
/// # 문법
/// ```ignore
/// config! {
///     key => value,
///     key2 => value2,
/// }
/// ```
macro_rules! config {
    // [공개 규칙]
    // 진입점: 사용자가 호출하는 형태
    () => {
        config!(@internal);
    };

    // [내부 규칙]
    // @internal로 시작: 내부 처리만 담당
    (@internal) => {};

    // [재귀 규칙]
    // @@recur로 시작: 재귀 처리만 담당
    (@internal $key:ident => $val:expr, $($rest:tt)*) => {
        println!("{}={}", stringify!($key), $val);
        config!(@internal $($rest)*);
    };
}
```

### 4.3 에러 메시지 개선

```rust
macro_rules! safe_config {
    // 기저
    () => {};

    // 정상 경로
    ($key:ident => $val:expr, $($rest:tt)*) => {
        // 처리
        safe_config!($($rest)*);
    };

    // 에러 처리: 잘못된 문법
    ($key:ident $val:expr, $($rest:tt)*) => {
        compile_error!("config! 매크로: '=>' 기호가 필요합니다. 올바른 문법: key => value");
    };

    // 나머지 에러
    ($($garbage:tt)*) => {
        compile_error!("config! 매크로의 문법을 확인하세요. 예: config!(key => value, ...)");
    };
}
```

---

## 5. 토큰 트리의 유연성

### 5.1 tt (Token Tree) 의 강력함

```rust
macro_rules! flexible {
    // tt: 모든 토큰 트리를 받음
    ($($token:tt)*) => {
        // 아무 형태의 코드도 수용 가능
    };
}

// 다양한 입력이 모두 가능
flexible!(42);
flexible!("hello");
flexible!(foo());
flexible!(vec![1, 2, 3]);
flexible!(if true { } else { });
flexible!(struct Point { x: i32 });
```

### 5.2 tt로 AST 구축

```rust
macro_rules! custom_syntax {
    // 진입점
    ($($expr:tt)*) => {
        custom_syntax!(@parse [] $($expr)*);
    };

    // 파싱
    (@parse [$($acc:tt)*]) => {
        // 기저: 모든 토큰 처리 완료
        println!("Parsed: {:?}", stringify!($($acc)*));
    };

    (@parse [$($acc:tt)*] $next:tt $($rest:tt)*) => {
        // 단계: 첫 토큰을 누적자에 추가하고 재귀
        custom_syntax!(@parse [$($acc)* $next] $($rest)*);
    };
}

custom_syntax!(1 + 2 * 3);
// Output: Parsed: "1 + 2 * 3"
```

### 5.3 복합 구조 처리

```rust
macro_rules! parse_any {
    // 리터럴
    ($lit:literal) => {
        Expr::Literal($lit)
    };

    // 식별자
    ($ident:ident) => {
        Expr::Identifier(stringify!($ident))
    };

    // 함수 호출
    ($func:ident ($($arg:tt),*)) => {
        Expr::Call(
            stringify!($func),
            vec![$(parse_any!($arg)),*]
        )
    };

    // 이항 연산
    (($left:tt) + ($right:tt)) => {
        Expr::BinOp(
            Op::Add,
            Box::new(parse_any!($left)),
            Box::new(parse_any!($right))
        )
    };
}
```

---

## 6. 실전 예제: 컴파일러 설정 DSL

### 6.1 기본 구현

```rust
macro_rules! gogs_config {
    // [기저 사례]
    // 종료: 더 이상 처리할 항목 없음
    () => {
        println!("✓ 모든 설정 완료");
    };

    // [재귀 사례]
    // 마지막 항목 (쉼표 없음) → 쉼표 추가 후 재귀
    ($key:ident => $val:expr) => {
        gogs_config!($key => $val,);
    };

    // [재귀 사례]
    // 일반 항목 → 처리 후 나머지 재귀
    ($key:ident => $val:expr, $($rest:tt)*) => {
        {
            let config_item = ConfigItem {
                key: stringify!($key),
                value: Box::new($val),
            };
            println!("  [CONFIG] 설정 적용: {} = {}",
                     stringify!($key),
                     stringify!($val));

            // 나머지 처리 (재귀)
            gogs_config!($($rest)*);
        }
    };
}

// 사용 예
fn main() {
    println!("=== Compiler Config DSL ===\n");

    gogs_config! {
        version => "1.0.0",
        optimization_level => 3,
        target_arch => "x86_64",
        debug_mode => false,
        thread_count => 8,
        max_memory_mb => 2048
    }
}

// Output:
// === Compiler Config DSL ===
//
//   [CONFIG] 설정 적용: version = "1.0.0"
//   [CONFIG] 설정 적용: optimization_level = 3
//   [CONFIG] 설정 적용: target_arch = "x86_64"
//   [CONFIG] 설정 적용: debug_mode = false
//   [CONFIG] 설정 적용: thread_count = 8
//   [CONFIG] 설정 적용: max_memory_mb = 2048
// ✓ 모든 설정 완료
```

### 6.2 값 검증과 함께

```rust
macro_rules! validated_config {
    () => {};

    ($key:ident => $val:expr, $($rest:tt)*) => {
        {
            // 키-값 검증
            validate_config_item!(stringify!($key), $val);

            println!("  [CONFIG] {} = {}", stringify!($key), $val);

            // 나머지 처리
            validated_config!($($rest)*);
        }
    };

    ($key:ident => $val:expr) => {
        validated_config!($key => $val,);
    };
}

macro_rules! validate_config_item {
    ("version", $val:expr) => {
        // 버전 형식 검증
        let _ = $val;  // 실제로는 버전 형식 확인
    };

    ("optimization_level", $val:expr) => {
        // 최적화 레벨 범위 검증 (0-3)
        if $val < 0 || $val > 3 {
            compile_error!("optimization_level은 0~3 사이여야 합니다");
        }
    };

    (_, $val:expr) => {
        // 기타 항목
        let _ = $val;
    };
}
```

### 6.3 내부 상태 관리

```rust
macro_rules! stateful_config {
    // 진입점
    ($($body:tt)*) => {
        stateful_config!(@init [] $($body)*);
    };

    // 초기화
    (@init [$($seen:ident),*]) => {
        println!("설정 완료. 처리된 항목: {}", stringify!($($seen),*));
    };

    // 항목 처리
    (@init [$($seen:ident),*] $key:ident => $val:expr, $($rest:tt)*) => {
        {
            println!("처리: {}", stringify!($key));

            // 처리된 항목에 추가
            stateful_config!(@init [$($seen),*, $key] $($rest)*);
        }
    };

    (@init [$($seen:ident),*] $key:ident => $val:expr) => {
        stateful_config!(@init [$($seen),*, $key]);
    };
}
```

---

## 요약: 재귀 DSL의 핵심

### 패턴

```
1. 기저 사례: () => { } (종료 조건)
2. 재귀 사례: ($first, $($rest),*) => { ... recurse!($($rest),*) }
3. 완전성: 모든 입력이 결국 기저 사례로 수렴
```

### 설계 원칙

```
- 공개 규칙 vs 내부 규칙 분리 (@접두사)
- 명확한 에러 메시지 (compile_error!)
- 합리적인 재귀 깊이 (기본 128)
- 가독성을 위한 문서화
```

### 강력한 도구

```
$($x:expr),*     : 0개 이상의 표현식
$($x:expr),+     : 1개 이상의 표현식
$($x:tt)*        : 0개 이상의 모든 토큰
@marker          : 내부 규칙 표시
compile_error!   : 명확한 에러 처리
```

---

## 다음: v13.1 절차적 매크로

v13.0.2에서는 **선언적 매크로 (macro_rules!)**를 통해 문법을 정의했습니다.

v13.1에서는 **절차적 매크로 (proc-macro)**로:

1. **Rust 코드 자체를 분석** (TokenStream 분석)
2. **완전한 AST 조작** (syn/quote 라이브러리)
3. **속성과 derive로 코드 자동 생성** (#[derive], #[attribute])
4. **런타임 메타정보 활용**

이것이 진정한 메타프로그래밍의 정점입니다. 🚀

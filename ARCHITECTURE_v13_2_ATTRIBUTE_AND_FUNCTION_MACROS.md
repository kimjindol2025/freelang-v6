# v13.2: 속성 매크로와 함수형 매크로
# 제12장: 매크로와 메타 프로그래밍 — Step 2.2

## 철학: "함수와 모듈에 직접 마법을 부려서 코드를 변환한다"

```
v13.1: "derive 매크로로 트레이트를 자동 구현"
v13.2: "attribute 매크로로 코드를 변환"
       "function-like 매크로로 완전한 DSL 구현" ← 최종 병기!

절차적 매크로의 삼각 편대:
1. derive: #[derive(MyTrait)]
2. attribute: #[my_attribute]  ← v13.2
3. function-like: my_macro!()  ← v13.2
```

---

## 📚 목차

1. [속성 매크로 기초](#1-속성-매크로-기초)
2. [함수 변환 패턴](#2-함수-변환-패턴)
3. [구조체 변환 패턴](#3-구조체-변환-패턴)
4. [메타데이터 주입](#4-메타데이터-주입)
5. [함수형 매크로](#5-함수형-매크로)
6. [DSL 구현](#6-dsl-구현)
7. [실전 예제](#7-실전-예제)
8. [컴파일러 관점](#8-컴파일러-관점)

---

## 1. 속성 매크로 기초

### 1.1 attribute 매크로의 역할

```rust
// attribute 매크로는 코드를 감싸거나 변환
#[my_attribute]
fn foo() {
    println!("Hello");
}

// 가능한 변환:
// 1. 함수를 감싸기 (wrapping)
// 2. 함수를 완전히 다른 코드로 변환
// 3. 함수에 부가 정보 추가
// 4. 함수 동작 수정
```

### 1.2 기본 구조

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn};

#[proc_macro_attribute]
pub fn my_attribute(
    _attr: TokenStream,    // attribute 자체 (#[my_attr(param)])
    input: TokenStream,    // attribute가 적용된 함수
) -> TokenStream {
    let input_fn = parse_macro_input!(input as ItemFn);

    // 원본 함수 유지
    let original = &input_fn;

    // 새로운 코드 생성
    let expanded = quote! {
        #original  // 원본 함수

        // 추가 코드
    };

    TokenStream::from(expanded)
}
```

### 1.3 attribute의 매개변수

```rust
#[my_attribute]              // 매개변수 없음
#[my_attribute = "value"]    // 할당 스타일
#[my_attribute(param)]       // 호출 스타일
#[my_attribute(a, b, c)]     // 여러 매개변수

// _attr 매개변수로 접근
#[proc_macro_attribute]
pub fn my_attr(attr: TokenStream, input: TokenStream) -> TokenStream {
    // attr를 파싱하여 매개변수 추출
    let _args = parse_macro_input!(attr as syn::AttributeArgs);
    // ...
}
```

---

## 2. 함수 변환 패턴

### 2.1 함수 wrapping

```rust
#[proc_macro_attribute]
pub fn timed(_: TokenStream, input: TokenStream) -> TokenStream {
    let input_fn = parse_macro_input!(input as ItemFn);

    let name = &input_fn.sig.ident;
    let vis = &input_fn.vis;
    let sig = &input_fn.sig;
    let block = &input_fn.block;

    let expanded = quote! {
        #vis #sig {
            let start = std::time::Instant::now();
            let result = (|| #block)();
            let elapsed = start.elapsed();
            eprintln!("[{}] {} ms", stringify!(#name), elapsed.as_millis());
            result
        }
    };

    TokenStream::from(expanded)
}

// 사용
#[timed]
fn expensive_operation() {
    // 자동으로 실행 시간 측정됨
}
```

### 2.2 함수 앞뒤로 코드 추가

```rust
#[proc_macro_attribute]
pub fn log_fn(_: TokenStream, input: TokenStream) -> TokenStream {
    let input_fn = parse_macro_input!(input as ItemFn);
    let name = &input_fn.sig.ident;
    let body = &input_fn.block;
    let vis = &input_fn.vis;
    let sig = &input_fn.sig;

    let expanded = quote! {
        #vis #sig {
            println!("[ENTER] {}", stringify!(#name));
            let result = {#body};
            println!("[EXIT] {}", stringify!(#name));
            result
        }
    };

    TokenStream::from(expanded)
}
```

### 2.3 함수 반환값 변경

```rust
#[proc_macro_attribute]
pub fn to_result(_: TokenStream, input: TokenStream) -> TokenStream {
    let input_fn = parse_macro_input!(input as ItemFn);
    let name = &input_fn.sig.ident;
    let body = &input_fn.block;
    let vis = &input_fn.vis;

    let expanded = quote! {
        #vis fn #name() -> Result<(), Box<dyn std::error::Error>> {
            #body
            Ok(())
        }
    };

    TokenStream::from(expanded)
}

// 사용
#[to_result]
fn operation() {
    println!("Do something");
    // 자동으로 Result 반환으로 변환됨
}
```

---

## 3. 구조체 변환 패턴

### 3.1 구조체에 메서드 추가

```rust
use syn::DeriveInput;

#[proc_macro_attribute]
pub fn add_methods(_: TokenStream, input: TokenStream) -> TokenStream {
    let input_struct = parse_macro_input!(input as DeriveInput);
    let name = &input_struct.ident;

    let expanded = quote! {
        #input_struct

        impl #name {
            pub fn new() -> Self {
                Self::default()
            }

            pub fn info(&self) {
                println!("Instance of {}", stringify!(#name));
            }
        }
    };

    TokenStream::from(expanded)
}
```

### 3.2 구조체 필드 검증

```rust
#[proc_macro_attribute]
pub fn validate(_: TokenStream, input: TokenStream) -> TokenStream {
    let input_struct = parse_macro_input!(input as DeriveInput);

    if let syn::Data::Struct(data) = &input_struct.data {
        // 필드 검증
        for field in &data.fields {
            // 검증 로직
        }
    }

    TokenStream::from(quote! { #input_struct })
}
```

---

## 4. 메타데이터 주입

### 4.1 gogs_info 매크로 구현

```rust
#[proc_macro_attribute]
pub fn gogs_info(_: TokenStream, input: TokenStream) -> TokenStream {
    let input_item = parse_macro_input!(input as syn::Item);

    let name = match &input_item {
        syn::Item::Struct(s) => &s.ident,
        syn::Item::Fn(f) => &f.sig.ident,
        _ => panic!("gogs_info는 구조체나 함수에만 적용 가능"),
    };

    let expanded = quote! {
        #input_item

        impl #name {
            pub fn print_gogs_info() {
                println!("=== Gogs Info for {} ===", stringify!(#name));
                println!("저장 필수 너는 기록이 증명이다 gogs");
                println!("Generated: 2026-02-23");
            }
        }
    };

    TokenStream::from(expanded)
}

// 사용
#[gogs_info]
struct MyStruct {
    field: String,
}

fn main() {
    MyStruct::print_gogs_info();
}
```

---

## 5. 함수형 매크로

### 5.1 기본 구조

```rust
#[proc_macro]
pub fn my_macro(input: TokenStream) -> TokenStream {
    // 입력: TokenStream
    // 출력: TokenStream

    // 파싱 또는 직접 처리
    TokenStream::new()
}
```

### 5.2 sql! 매크로

```rust
#[proc_macro]
pub fn sql(input: TokenStream) -> TokenStream {
    let input_str = input.to_string();

    let expanded = quote! {
        {
            let query = #input_str;
            Query::new(query)
        }
    };

    TokenStream::from(expanded)
}

// 사용
let query = sql!(SELECT * FROM users WHERE id = 1);
```

### 5.3 html! 매크로

```rust
#[proc_macro]
pub fn html(input: TokenStream) -> TokenStream {
    let input_tokens = input.clone();

    let expanded = quote! {
        {
            let html = stringify!(#input_tokens);
            HtmlElement::parse(html)
        }
    };

    TokenStream::from(expanded)
}

// 사용
let element = html! {
    <div class="container">
        <h1>Hello</h1>
        <p>World</p>
    </div>
};
```

---

## 6. DSL 구현

### 6.1 설정 DSL

```rust
#[proc_macro]
pub fn config(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as syn::Expr);

    let expanded = quote! {
        {
            let config = #input;
            Config::from(config)
        }
    };

    TokenStream::from(expanded)
}

// 사용
config! {
    host: "localhost",
    port: 8080,
    ssl: true
}
```

### 6.2 상태 기계 DSL

```rust
#[proc_macro]
pub fn state_machine(input: TokenStream) -> TokenStream {
    // 입력: 상태 정의
    // 출력: 상태 기계 구현

    let expanded = quote! {
        // 자동 생성된 상태 기계 코드
    };

    TokenStream::from(expanded)
}
```

---

## 7. 실전 예제

### 7.1 테스트 매크로

```rust
#[proc_macro_attribute]
pub fn test_case(args: TokenStream, input: TokenStream) -> TokenStream {
    let args = parse_macro_input!(args as syn::AttributeArgs);
    let input_fn = parse_macro_input!(input as ItemFn);

    let name = &input_fn.sig.ident;
    let body = &input_fn.block;

    let expanded = quote! {
        #[test]
        fn #name() {
            #body
        }
    };

    TokenStream::from(expanded)
}
```

### 7.2 캐싱 매크로

```rust
#[proc_macro_attribute]
pub fn cached(_: TokenStream, input: TokenStream) -> TokenStream {
    let input_fn = parse_macro_input!(input as ItemFn);
    let name = &input_fn.sig.ident;
    let sig = &input_fn.sig;
    let body = &input_fn.block;

    let expanded = quote! {
        #sig {
            use std::sync::Mutex;
            use std::collections::HashMap;

            lazy_static::lazy_static! {
                static ref CACHE: Mutex<HashMap<String, _>> = Mutex::new(HashMap::new());
            }

            let cache_key = stringify!(#name);
            if let Some(result) = CACHE.lock().unwrap().get(cache_key) {
                return result.clone();
            }

            let result = (|| #body)();
            CACHE.lock().unwrap().insert(cache_key.to_string(), result.clone());
            result
        }
    };

    TokenStream::from(expanded)
}
```

### 7.3 API 엔드포인트 매크로

```rust
#[proc_macro_attribute]
pub fn endpoint(args: TokenStream, input: TokenStream) -> TokenStream {
    let args = parse_macro_input!(args as syn::LitStr);
    let path = args.value();

    let input_fn = parse_macro_input!(input as ItemFn);
    let name = &input_fn.sig.ident;
    let sig = &input_fn.sig;
    let body = &input_fn.block;

    let expanded = quote! {
        #[get(#path)]
        #sig #body

        // 라우트 자동 등록
    };

    TokenStream::from(expanded)
}

// 사용
#[endpoint("/api/users")]
async fn get_users() -> JsonResponse {
    // 자동으로 라우트 등록됨
}
```

---

## 8. 컴파일러 관점

### 절차적 매크로의 실행 순서

```
소스 코드 작성
    ↓
렉서 (Tokenization)
    ↓
macro_rules! 전개
    ↓
절차적 매크로 실행 ← derive, attribute, function-like
    ├─ TokenStream 입력
    ├─ Rust 함수 실행 (우리의 매크로 코드)
    └─ TokenStream 출력
    ↓
파서 (AST 생성)
    ↓
타입 검사
    ↓
컴파일 계속
```

### 매크로와 컴파일러의 관계

```
컴파일러 프론트엔드 (우리가 14장에서 만들 것):
├─ 렉서: 문자열 → 토큰
├─ 파서: 토큰 → AST
└─ 의미 분석: AST → 타입/심볼

절차적 매크로 (우리가 지금 만드는 것):
├─ 입력: TokenStream
├─ 처리: syn으로 AST 생성
├─ 변환: quote로 코드 생성
└─ 출력: TokenStream

매우 유사한 구조!
```

---

## 핵심 비교: 세 가지 절차적 매크로

| 종류 | 문법 | 입력 | 출력 | 용도 |
|------|------|------|------|------|
| **derive** | `#[derive(Name)]` | 구조체/열거형 | 트레이트 구현 | 자동 trait 구현 |
| **attribute** | `#[name]` | 함수/구조체/모듈 | 변환된 코드 | 코드 변환/주입 |
| **function-like** | `name!()` | 임의의 토큰 | 완전한 코드 | DSL 구현 |

---

## v13.2 완성의 의미

```
v13.0: 선언적 매크로 (macro_rules!)
  → 패턴 매칭으로 간단한 치환

v13.0.2: 재귀적 매크로
  → 복잡한 구조를 재귀로 처리

v13.1: 절차적 매크로 (derive)
  → 트레이트를 자동 구현

v13.2: 절차적 매크로 (attribute + function-like) ← 완성!
  → 함수/구조체 변환
  → 완전한 DSL 구현
  → 메타데이터 주입

이제 매크로의 '모든 것'을 마스터했습니다!
```

---

## 다음: v14 미니 컴파일러 구현

v13.0 ~ v13.2에서 배운 매크로 기술은 v14에서 실제 컴파일러를 만들 때 핵심이 됩니다:

```
v14: 미니 컴파일러 (Mini Compiler)
├─ 렉서: 소스 코드 → 토큰
├─ 파서: 토큰 → AST
├─ 의미 분석: AST → 타입/심볼
├─ 코드 생성: AST → Rust 코드
└─ 완성: 우리만의 언어 설계!

v13에서 배운 절차적 매크로의 원리가
v14에서 컴파일러의 기초가 됩니다.
```

---

## 요약

```
v13.2: 속성 매크로와 함수형 매크로

철학: "함수와 모듈에 직접 마법을 부리기"

핵심 능력:
✅ attribute 매크로로 함수 변환
✅ 함수형 매크로로 DSL 구현
✅ 메타데이터 자동 주입
✅ 코드 자동 생성과 변환
✅ 컴파일 타임 메타프로그래밍

완전한 절차적 매크로 마스터리! 🏆
```

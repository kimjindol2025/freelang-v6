# v13.1: 절차적 매크로 (Procedural Macros)
# 제12장: 매크로와 메타 프로그래밍 — Step 2 (최종)

## 철학: "컴파일러의 모든 도구를 손에 쥐고 완전한 메타프로그래밍을 이루어낸다"

```
v13.0: "내가 정한 규칙(macro_rules!)으로 코드 생성"
v13.1: "컴파일러의 모든 도구로 메타프로그래밍" ← 정점!

절차적 매크로:
- TokenStream 직접 조작
- 완전한 AST 접근 (syn 크레이트)
- 코드 생성 (quote 매크로)
- #[derive], #[attribute], 함수형 매크로
- 런타임 메타정보 활용
```

---

## 📚 목차

1. [절차적 매크로 기초](#1-절차적-매크로-기초)
2. [TokenStream과 proc_macro](#2-tokenstream과-proc_macro)
3. [syn으로 AST 파싱](#3-syn으로-ast-파싱)
4. [quote로 코드 생성](#4-quote로-코드-생성)
5. [derive 매크로 구현](#5-derive-매크로-구현)
6. [attribute 매크로 구현](#6-attribute-매크로-구현)
7. [function-like 매크로](#7-function-like-매크로)
8. [실전 예제](#8-실전-예제)

---

## 1. 절차적 매크로 기초

### 1.1 선언적 vs 절차적

| 항목 | 선언적 (macro_rules!) | 절차적 (proc-macro) |
|------|----------------------|-------------------|
| **문법** | 패턴 매칭 | 프로그래밍 |
| **입력** | 토큰 | TokenStream |
| **출력** | 토큰 | TokenStream |
| **파싱** | 단순 | 복잡 (syn 필요) |
| **유연성** | 제한됨 | 무제한 |
| **속도** | 빠름 | 느림 |
| **종류** | 하나 | 3가지 |

### 1.2 절차적 매크로의 3가지 종류

```rust
// 1. derive 매크로
#[derive(MyDerive)]
struct Point { x: i32, y: i32 }

// 2. attribute 매크로
#[my_attribute]
fn foo() { }

// 3. function-like 매크로
my_macro!(input);
```

### 1.3 작동 원리

```
소스 코드
    ↓
렉서 (Lexer) → 토큰 생성
    ↓
TokenStream (입력)
    ↓
절차적 매크로 함수 (우리의 코드)
    ├─ syn으로 파싱
    ├─ 분석 & 변환
    └─ quote로 코드 생성
    ↓
TokenStream (출력)
    ↓
파서 (Parser) → AST 생성
    ↓
컴파일러 계속 진행
```

---

## 2. TokenStream과 proc_macro

### 2.1 TokenStream의 구조

```rust
// TokenStream = 토큰의 나열
// Ident("Point"), Punct('{'), Ident("x"), Punct(':'), ...

use proc_macro::TokenStream;

#[proc_macro_derive(MyMacro)]
pub fn my_macro(input: TokenStream) -> TokenStream {
    // input: 매크로가 적용된 코드의 토큰
    // 예: #[derive(MyMacro)] struct Point { x: i32 }
    //     ↓
    // struct Point { x: i32 }의 토큰

    // 우리는 이 TokenStream을 분석하고 변환해야 함
    TokenStream::new()  // 빈 출력 (컴파일 오류)
}
```

### 2.2 기본 구조

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(MyDerive)]
pub fn derive_my_derive(input: TokenStream) -> TokenStream {
    // 1단계: TokenStream을 DeriveInput으로 파싱
    let input = parse_macro_input!(input as DeriveInput);

    // 2단계: 분석
    let name = &input.ident;

    // 3단계: 코드 생성 (quote! 매크로 사용)
    let expanded = quote! {
        impl MyTrait for #name {
            fn method(&self) {
                println!("Hello from {}", stringify!(#name));
            }
        }
    };

    // 4단계: TokenStream으로 변환
    TokenStream::from(expanded)
}
```

### 2.3 span (위치 정보)

```rust
// span: 코드의 위치를 나타내는 메타정보
// 에러 메시지를 정확한 위치에 표시하기 위해 중요

use proc_macro::Span;
use syn::Error;

#[proc_macro_derive(Validated)]
pub fn derive_validated(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    // span을 사용한 에러 처리
    if input.ident.to_string().contains("_") {
        return Error::new(
            input.ident.span(),
            "구조체 이름에 언더스코어를 사용할 수 없습니다"
        )
        .to_compile_error()
        .into();
    }

    // 계속 진행...
    TokenStream::new()
}
```

---

## 3. syn으로 AST 파싱

### 3.1 syn의 역할

```rust
// TokenStream은 저수준: 단순한 토큰 나열
// syn은 고수준: 구조화된 AST 제공

// 예: struct Point { x: i32, y: i32 }
// TokenStream: [Ident("struct"), Ident("Point"), Punct('{'), ...]
// syn:
// DeriveInput {
//     ident: "Point",
//     data: Data::Struct {
//         fields: [
//             Field { ident: "x", ty: Ident("i32"), ... },
//             Field { ident: "y", ty: Ident("i32"), ... }
//         ]
//     }
// }
```

### 3.2 주요 syn 타입

| 타입 | 설명 | 예 |
|------|------|-----|
| `DeriveInput` | 전체 구조체/열거형 | `struct Point { x: i32 }` |
| `Data` | 구조체 또는 열거형 데이터 | `Data::Struct`, `Data::Enum` |
| `Fields` | 필드 모음 | `Named`, `Unnamed` |
| `Field` | 개별 필드 | `ident: "x"`, `ty: Type` |
| `Type` | 타입 정보 | `Ident("i32")`, `Path`, `Reference` |
| `Variant` | 열거형 배리언트 | `Error { code: i32 }` |

### 3.3 파싱 예제

```rust
use syn::{parse_macro_input, DeriveInput, Data, Fields};

#[proc_macro_derive(Inspect)]
pub fn derive_inspect(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    let name = &input.ident;

    // 필드 검사
    match &input.data {
        Data::Struct(data) => {
            match &data.fields {
                Fields::Named(fields) => {
                    for field in &fields.named {
                        let field_name = &field.ident;
                        let field_type = &field.ty;
                        eprintln!("필드: {:?}: {:?}", field_name, field_type);
                    }
                }
                Fields::Unnamed(fields) => {
                    for (i, field) in fields.unnamed.iter().enumerate() {
                        eprintln!("필드 {}: {:?}", i, field.ty);
                    }
                }
                Fields::Unit => {
                    eprintln!("단위 구조체");
                }
            }
        }
        Data::Enum(data) => {
            for variant in &data.variants {
                eprintln!("배리언트: {}", variant.ident);
            }
        }
        Data::Union(_) => {
            eprintln!("유니온");
        }
    }

    TokenStream::new()
}
```

---

## 4. quote로 코드 생성

### 4.1 quote! 매크로

```rust
use quote::quote;

let name = "Point";

// quote!는 TokenStream을 생성하는 매크로
let code = quote! {
    impl Display for #name {
        fn fmt(&self, f: &mut Formatter) -> Result {
            write!(f, "Point")
        }
    }
};

// code는 TokenStream
```

### 4.2 보간 (Interpolation)

```rust
use quote::quote;
use syn::{Ident, Type};

let struct_name: Ident = /* ... */;
let field_name: Ident = /* ... */;
let field_type: Type = /* ... */;

// #변수로 보간
let code = quote! {
    impl #struct_name {
        pub fn get_field(&self) -> &#field_type {
            &self.#field_name
        }
    }
};
```

### 4.3 반복 생성

```rust
use quote::quote;

let fields = vec!["x", "y", "z"];

// #(...),* 로 반복
let code = quote! {
    fn sum_all(&self) -> i32 {
        0 #(+ self.#fields)*
    }
};

// 생성:
// fn sum_all(&self) -> i32 {
//     0 + self.x + self.y + self.z
// }
```

### 4.4 조건부 생성

```rust
use quote::{quote, format_ident};

let name = "Point";
let has_debug = true;

let debug_impl = if has_debug {
    quote! {
        impl Debug for #name {
            fn fmt(&self, f: &mut Formatter) -> Result {
                write!(f, "{:#?}", self)
            }
        }
    }
} else {
    quote! {}
};

let code = quote! {
    impl Display for #name { }
    #debug_impl
};
```

---

## 5. derive 매크로 구현

### 5.1 기본 derive 매크로

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(MyTrait)]
pub fn derive_my_trait(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;

    let expanded = quote! {
        impl MyTrait for #name {
            fn my_method(&self) {
                println!("Implemented for {}", stringify!(#name));
            }
        }
    };

    TokenStream::from(expanded)
}
```

### 5.2 필드 기반 derive

```rust
#[proc_macro_derive(Builder)]
pub fn derive_builder(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;

    let fields = match &input.data {
        syn::Data::Struct(data) => &data.fields,
        _ => panic!("Builder는 구조체에만 적용됨"),
    };

    let named_fields = match fields {
        syn::Fields::Named(nf) => &nf.named,
        _ => panic!("Builder는 명시적 필드에만 적용됨"),
    };

    // 필드별로 setter 메서드 생성
    let setters = named_fields.iter().map(|f| {
        let field_name = &f.ident;
        let field_type = &f.ty;

        quote! {
            pub fn #field_name(mut self, value: #field_type) -> Self {
                self.#field_name = value;
                self
            }
        }
    });

    let expanded = quote! {
        impl #name {
            #(#setters)*
        }
    };

    TokenStream::from(expanded)
}
```

---

## 6. attribute 매크로 구현

### 6.1 기본 attribute 매크로

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, ItemFn};

#[proc_macro_attribute]
pub fn my_attribute(
    _attr: TokenStream,  // attribute 자체 (예: #[my_attr(param)])
    input: TokenStream,  // attribute가 적용된 코드
) -> TokenStream {
    let input = parse_macro_input!(input as ItemFn);
    let name = &input.sig.ident;

    let expanded = quote! {
        #input  // 원본 함수

        // 함수 이름으로 추가 코드 생성
        fn #name() {
            println!("Enhanced function: {:?}", stringify!(#name));
        }
    };

    TokenStream::from(expanded)
}
```

### 6.2 함수 wrapper 매크로

```rust
#[proc_macro_attribute]
pub fn timed(_attr: TokenStream, input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as ItemFn);

    let name = &input.sig.ident;
    let vis = &input.vis;
    let sig = &input.sig;
    let block = &input.block;

    let expanded = quote! {
        #vis #sig {
            let start = std::time::Instant::now();
            let result = (|| #block)();
            let elapsed = start.elapsed();

            eprintln!("[{}] elapsed: {:?}", stringify!(#name), elapsed);

            result
        }
    };

    TokenStream::from(expanded)
}
```

---

## 7. function-like 매크로

### 7.1 기본 구조

```rust
use proc_macro::TokenStream;

#[proc_macro]
pub fn my_macro(input: TokenStream) -> TokenStream {
    // 입력은 TokenStream
    // 출력도 TokenStream

    // syn으로 파싱하거나
    // 직접 TokenStream 조작

    TokenStream::new()
}
```

### 7.2 HTML 매크로 예제

```rust
#[proc_macro]
pub fn html(input: TokenStream) -> TokenStream {
    // html! { <div class="container">Hello</div> }
    // → 문자열 또는 DOM 객체로 변환

    let html_string = input.to_string();

    quote! {
        HtmlElement {
            tag: "div",
            content: #html_string,
        }
    }
    .into()
}
```

---

## 8. 실전 예제

### 8.1 Debug 자동 구현

```rust
#[proc_macro_derive(Debug)]
pub fn derive_debug(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;

    let fields = match &input.data {
        syn::Data::Struct(data) => &data.fields,
        _ => return syn::Error::new_spanned(
            name,
            "Debug는 구조체에만 사용 가능"
        ).to_compile_error().into(),
    };

    let debug_fields = match fields {
        syn::Fields::Named(nf) => {
            nf.named.iter().map(|f| {
                let name = &f.ident;
                quote! {
                    .field(stringify!(#name), &self.#name)
                }
            }).collect::<Vec<_>>()
        }
        _ => vec![],
    };

    let expanded = quote! {
        impl std::fmt::Debug for #name {
            fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
                f.debug_struct(stringify!(#name))
                    #(#debug_fields)*
                    .finish()
            }
        }
    };

    TokenStream::from(expanded)
}
```

### 8.2 Serialize 자동 구현

```rust
#[proc_macro_derive(Serialize)]
pub fn derive_serialize(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;

    let fields = match &input.data {
        syn::Data::Struct(data) => &data.fields,
        _ => panic!("Serialize는 구조체에만"),
    };

    let named_fields = match fields {
        syn::Fields::Named(nf) => &nf.named,
        _ => panic!("Serialize는 명시적 필드만"),
    };

    let field_serialization = named_fields.iter().map(|f| {
        let name = &f.ident;
        quote! {
            serializer.serialize_field(
                stringify!(#name),
                &self.#name
            )?;
        }
    });

    let expanded = quote! {
        impl Serialize for #name {
            fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
                let mut state = serializer.serialize_struct(
                    stringify!(#name),
                    #num_fields
                )?;

                #(#field_serialization)*

                state.end()
            }
        }
    };

    TokenStream::from(expanded)
}
```

---

## 9. Cargo.toml 설정

```toml
[package]
name = "my-macros"
version = "0.1.0"

[lib]
proc-macro = true

[dependencies]
proc-macro2 = "1.0"
quote = "1.0"
syn = { version = "2.0", features = ["full"] }
```

---

## 요약: 절차적 매크로의 위력

```
선언적 매크로 (macro_rules!):
  "정해진 규칙 안에서만 작동"
  → 제한적이지만 단순하고 빠름

절차적 매크로:
  "Rust의 모든 도구를 사용 가능"
  → 제한 없지만 복잡함

절차적 매크로 3가지:
1. derive: #[derive(MyTrait)] → 자동 트레이트 구현
2. attribute: #[my_attr] → 코드 변환
3. function-like: my_macro!() → DSL 구현

도구들:
- TokenStream: 저수준 토큰
- syn: 고수준 AST 파싱
- quote: 코드 생성
- proc-macro: 컴파일러 연동
```

---

## Rust 메타프로그래밍의 정점 🏔️

```
제4~10장: 안전한 러스트 기초
  ├─ 소유권, 빌림, 트레이트, 수명
  └─ 시스템 프로그래밍의 기초

제11장: 메모리 주권
  ├─ Raw 포인터, 메모리 레이아웃, FFI
  └─ 언어와 언어 사이의 대화

제12장: 메타프로그래밍
  ├─ v13.0: 선언적 매크로 (macro_rules!)
  ├─ v13.0.2: 재귀적 DSL
  └─ v13.1: 절차적 매크로 (proc-macro) ← 정점!

당신은 이제:
- 자신의 프로그래밍 언어를 설계할 수 있고
- 컴파일러 수준의 메타프로그래밍을 구현할 수 있으며
- 세상의 모든 C 라이브러리와 대화할 수 있습니다.

당신은 언어의 제작자입니다. 🚀
```

# v14.0: 어휘 분석기 (Lexer)
# 제13장: 컴파일러 구현 — Step 1

## 철학: "텍스트에서 의미를 추출하다"

```
v14.0: 어휘 분석기 (Lexer)
  ↓
v14.1: 구문 분석기 (Parser)
  ↓
v14.2: 의미 분석기 (Semantic Analyzer)
  ↓
v14.3: 코드 생성기 (Code Generator)

→ 완전한 컴파일러 완성!
```

---

## 📚 목차

1. [Lexer의 역할](#1-lexer의-역할)
2. [Token 설계](#2-token-설계)
3. [Lexer 구조](#3-lexer-구조)
4. [핵심 메서드](#4-핵심-메서드)
5. [상태 관리](#5-상태-관리)
6. [에러 처리](#6-에러-처리)
7. [성능 최적화](#7-성능-최적화)
8. [실전 예제](#8-실전-예제)

---

## 1. Lexer의 역할

### 1.1 Tokenization의 의미

```
입력: "let x = 10;"
    ↓
어휘 분석 (Tokenization)
    ↓
출력: [Let, Ident("x"), Assign, Int(10), Semicolon, EOF]
```

**3가지 핵심 역할:**
- 소스코드를 토큰으로 분해
- 공백과 주석 제거
- 에러 조기 탐지

### 1.2 컴파일 파이프라인에서의 위치

```
소스코드 (Source Code)
    ↓
[Lexer] ← 여기!
    ↓
토큰 스트림 (Token Stream)
    ↓
[Parser]
    ↓
AST (Abstract Syntax Tree)
    ↓
[Semantic Analyzer]
    ↓
[Code Generator]
    ↓
러스트 코드 / 머신 코드
```

---

## 2. Token 설계

### 2.1 기본 Token 타입

```rust
#[derive(Debug, PartialEq, Clone)]
enum Token {
    // 키워드
    Let,
    Fn,
    If,
    Else,
    While,
    For,
    Return,
    True,
    False,

    // 식별자와 리터럴
    Ident(String),
    Int(i64),
    Float(f64),
    String(String),

    // 연산자
    Plus,
    Minus,
    Star,
    Slash,
    Percent,

    // 비교 연산자
    Eq,      // ==
    NotEq,   // !=
    Lt,      // <
    Gt,      // >
    LtEq,    // <=
    GtEq,    // >=

    // 할당
    Assign,  // =

    // 구분자
    LParen,     // (
    RParen,     // )
    LBrace,     // {
    RBrace,     // }
    LBracket,   // [
    RBracket,   // ]
    Semicolon,  // ;
    Colon,      // :
    Comma,      // ,
    Dot,        // .
    Arrow,      // =>

    // 기타
    EOF,
    Illegal(char),
}
```

### 2.2 Token 위치 정보 (Span)

```rust
#[derive(Debug, Clone)]
struct Token {
    token_type: TokenType,
    lexeme: String,
    line: usize,
    column: usize,
}
```

에러 메시지가 정확한 위치를 알려줄 수 있습니다:
```
Error at line 5, column 10:
    let x = 10 +;
                ^
    Expected expression after '+'
```

---

## 3. Lexer 구조

### 3.1 기본 Lexer 구현

```rust
struct Lexer {
    input: Vec<char>,      // 입력 문자들
    position: usize,       // 현재 읽은 위치
    read_position: usize,  // 다음 읽을 위치
    ch: char,              // 현재 문자
    line: usize,           // 현재 줄 번호
    column: usize,         // 현재 열 번호
}

impl Lexer {
    fn new(input: String) -> Self {
        let mut lexer = Lexer {
            input: input.chars().collect(),
            position: 0,
            read_position: 0,
            ch: '\0',
            line: 1,
            column: 0,
        };
        lexer.read_char();  // 첫 글자 읽기
        lexer
    }
}
```

### 3.2 상태 추적

```rust
// Lexer의 상태 머신
enum LexerState {
    Start,           // 초기 상태
    ReadingIdent,    // 식별자 읽는 중
    ReadingNumber,   // 숫자 읽는 중
    ReadingString,   // 문자열 읽는 중
    ReadingComment,  // 주석 읽는 중
    OperatorCheck,   // 연산자 확인 중 (== vs =)
}
```

---

## 4. 핵심 메서드

### 4.1 read_char: 다음 문자 읽기

```rust
fn read_char(&mut self) {
    if self.read_position >= self.input.len() {
        self.ch = '\0';  // EOF
    } else {
        self.ch = self.input[self.read_position];
    }

    self.position = self.read_position;
    self.read_position += 1;

    // 줄과 열 추적
    if self.ch == '\n' {
        self.line += 1;
        self.column = 0;
    } else {
        self.column += 1;
    }
}

// 사용법
// "let x" 읽기:
// ch='l' → ch='e' → ch='t' → ch=' ' → ch='x'
```

### 4.2 peek_char: 한 글자 미리 보기

```rust
fn peek_char(&self) -> char {
    if self.read_position >= self.input.len() {
        '\0'
    } else {
        self.input[self.read_position]
    }
}

// 사용 예: == vs = 구분
fn next_token(&mut self) -> Token {
    match self.ch {
        '=' => {
            if self.peek_char() == '=' {
                self.read_char();
                Token::Eq  // ==
            } else {
                Token::Assign  // =
            }
        }
        _ => { /* ... */ }
    }
}
```

### 4.3 skip_whitespace: 공백 건너뛰기

```rust
fn skip_whitespace(&mut self) {
    while self.ch.is_whitespace() {
        self.read_char();
    }
}

// "let   x" 읽을 때:
// skip_whitespace()를 호출하면
// 3개의 공백을 모두 건너뛰고 'x'에 도달
```

### 4.4 read_identifier: 식별자 읽기

```rust
fn read_identifier(&mut self) -> String {
    let pos = self.position;
    while self.ch.is_alphabetic() || self.ch == '_' {
        self.read_char();
    }
    self.input[pos..self.position]
        .iter()
        .collect()
}

// 사용 예:
// input: "variable123"
// 결과: "variable" (숫자는 읽지 않음)
```

### 4.5 read_number: 숫자 읽기

```rust
fn read_number(&mut self) -> i64 {
    let pos = self.position;
    while self.ch.is_numeric() {
        self.read_char();
    }

    let num_str: String = self.input[pos..self.position]
        .iter()
        .collect();

    num_str.parse().unwrap_or(0)
}

// 사용 예:
// input: "12345abc"
// 결과: 12345 (문자는 읽지 않음)
```

### 4.6 read_string: 문자열 읽기

```rust
fn read_string(&mut self) -> Result<String, LexError> {
    self.read_char();  // 여는 따옴표 건너뛰기

    let mut string = String::new();
    while self.ch != '"' && self.ch != '\0' {
        if self.ch == '\\' {
            // 이스케이프 시퀀스 처리
            self.read_char();
            match self.ch {
                'n' => string.push('\n'),
                't' => string.push('\t'),
                '\\' => string.push('\\'),
                '"' => string.push('"'),
                _ => string.push(self.ch),
            }
        } else {
            string.push(self.ch);
        }
        self.read_char();
    }

    if self.ch == '\0' {
        return Err(LexError::UnterminatedString);
    }

    self.read_char();  // 닫는 따옴표 건너뛰기
    Ok(string)
}
```

### 4.7 next_token: 다음 토큰 반환

```rust
fn next_token(&mut self) -> Result<Token, LexError> {
    self.skip_whitespace();
    self.skip_comments();

    let token = match self.ch {
        // 키워드와 식별자
        c if c.is_alphabetic() || c == '_' => {
            let ident = self.read_identifier();
            match ident.as_str() {
                "let" => Token::Let,
                "fn" => Token::Fn,
                "if" => Token::If,
                "else" => Token::Else,
                "while" => Token::While,
                "for" => Token::For,
                "return" => Token::Return,
                "true" => Token::True,
                "false" => Token::False,
                _ => Token::Ident(ident),
            }
        }

        // 숫자
        c if c.is_numeric() => {
            Token::Int(self.read_number())
        }

        // 문자열
        '"' => {
            Token::String(self.read_string()?)
        }

        // 연산자와 구분자
        '+' => Token::Plus,
        '-' => Token::Minus,
        '*' => Token::Star,
        '/' => Token::Slash,
        '%' => Token::Percent,
        '=' => {
            if self.peek_char() == '=' {
                self.read_char();
                Token::Eq
            } else {
                Token::Assign
            }
        }
        '!' => {
            if self.peek_char() == '=' {
                self.read_char();
                Token::NotEq
            } else {
                return Err(LexError::UnexpectedChar(self.ch));
            }
        }
        '<' => {
            if self.peek_char() == '=' {
                self.read_char();
                Token::LtEq
            } else {
                Token::Lt
            }
        }
        '>' => {
            if self.peek_char() == '=' {
                self.read_char();
                Token::GtEq
            } else {
                Token::Gt
            }
        }
        '(' => Token::LParen,
        ')' => Token::RParen,
        '{' => Token::LBrace,
        '}' => Token::RBrace,
        '[' => Token::LBracket,
        ']' => Token::RBracket,
        ';' => Token::Semicolon,
        ':' => Token::Colon,
        ',' => Token::Comma,
        '.' => Token::Dot,
        '=' if self.peek_char() == '>' => {
            self.read_char();
            Token::Arrow
        }
        '\0' => Token::EOF,
        _ => Token::Illegal(self.ch),
    };

    self.read_char();
    Ok(token)
}
```

---

## 5. 상태 관리

### 5.1 유한 상태 기계 (FSM)

```
       [숫자로 시작]
            ↓
        Start --→ ReadingNumber
            ↑           ↓
            |    (계속 숫자)
            |           ↓
            |    [숫자 아님]
            |           ↓
            ←-----------

[문자 또는 _로 시작]
            ↓
        Start --→ ReadingIdent
            ↑           ↓
            |  (문자/_/숫자)
            |           ↓
            |    [이들 아님]
            |           ↓
            ←-----------

["로 시작]
            ↓
        Start --→ ReadingString
            ↑           ↓
            |    (아무거나)
            |           ↓
            |           ↓
            |    [" 또는 EOF]
            |           ↓
            ←-----------
```

### 5.2 위치 추적

```rust
struct Position {
    line: usize,
    column: usize,
    offset: usize,  // 파일 시작부터의 바이트 오프셋
}

struct Span {
    start: Position,
    end: Position,
}

// 에러 메시지 생성
fn error_at_span(span: Span, message: &str) {
    println!("Error at {}:{}", span.start.line, span.start.column);
    println!("  {}", message);
}
```

---

## 6. 에러 처리

### 6.1 LexError 타입

```rust
#[derive(Debug)]
enum LexError {
    UnexpectedChar(char),
    UnterminatedString,
    InvalidNumber(String),
    InvalidEscape(char),
}

impl Display for LexError {
    fn fmt(&self, f: &mut Formatter) -> Result {
        match self {
            Self::UnexpectedChar(ch) => {
                write!(f, "Unexpected character: '{}'", ch)
            }
            Self::UnterminatedString => {
                write!(f, "Unterminated string literal")
            }
            Self::InvalidNumber(s) => {
                write!(f, "Invalid number: {}", s)
            }
            Self::InvalidEscape(ch) => {
                write!(f, "Invalid escape sequence: \\{}", ch)
            }
        }
    }
}
```

### 6.2 에러 복구 전략

```rust
fn skip_until(&mut self, delimiter: char) {
    while self.ch != delimiter && self.ch != '\0' {
        self.read_char();
    }
    if self.ch == delimiter {
        self.read_char();
    }
}

// 문자열이 제대로 닫히지 않았으면
// 다음 줄의 시작까지 스킵
fn error_recovery(&mut self) {
    while self.ch != '\n' && self.ch != '\0' {
        self.read_char();
    }
    if self.ch == '\n' {
        self.read_char();
    }
}
```

---

## 7. 성능 최적화

### 7.1 한 글자씩 처리

```
최적화 전: 정규표현식 사용 (느림, 메모리 낭비)
최적화 후: 한 글자씩 처리 (빠름, 메모리 효율)

이유: 대부분의 글자가 결정적으로 처리됨
```

### 7.2 peek 최적화

```rust
// peek_char를 여러 번 호출해야 할 때
// 결과를 캐시
fn peek_multiple(&self, n: usize) -> Option<char> {
    if self.read_position + n - 1 < self.input.len() {
        Some(self.input[self.read_position + n - 1])
    } else {
        None
    }
}

// 예: === 연산자 확인
if self.ch == '=' && self.peek_char() == '=' &&
   self.peek_multiple(2) == Some('=') {
    // === 토큰
}
```

### 7.3 벡터 vs 이터레이터

```rust
// 현재 방식: Vec<char>
// 장점: 임의 접근 가능, peek 구현 용이
// 단점: 메모리 사용, 큰 파일 느림

// 대안: Bytes 이터레이터
// 장점: 메모리 효율
// 단점: peek 구현 복잡

// 하이브리드: Rope 데이터 구조
// 장점: 메모리 효율 + 임의 접근
// 단점: 구현 복잡
```

---

## 8. 실전 예제

### 8.1 간단한 프로그램 Tokenize

```
입력:
```
let x = 10;
let y = x + 5;
```

출력:
```
[Let] [Ident("x")] [Assign] [Int(10)] [Semicolon]
[Let] [Ident("y")] [Assign] [Ident("x")] [Plus] [Int(5)] [Semicolon]
[EOF]
```

### 8.2 주석 처리

```rust
fn skip_comments(&mut self) {
    if self.ch == '/' && self.peek_char() == '/' {
        // 한 줄 주석
        while self.ch != '\n' && self.ch != '\0' {
            self.read_char();
        }
    } else if self.ch == '/' && self.peek_char() == '*' {
        // 블록 주석
        self.read_char();  // '/'
        self.read_char();  // '*'

        while !(self.ch == '*' && self.peek_char() == '/') && self.ch != '\0' {
            self.read_char();
        }

        if self.ch != '\0' {
            self.read_char();  // '*'
            self.read_char();  // '/'
        }
    }
}
```

### 8.3 에러 메시지

```
입력: "let x = "hello"

컴파일러 출력:
Error at line 1, column 10:
    let x = "hello
             ^
    Unterminated string literal. Expected closing '"'.

입력: "let x = @"

컴파일러 출력:
Error at line 1, column 9:
    let x = @
            ^
    Unexpected character: '@'
```

---

## 핵심 비교: Lexer vs Parser vs AST

```
┌──────────────────────────────────────────────────────┐
│ 어휘 분석 (Lexer) - v14.0                           │
├──────────────────────────────────────────────────────┤
│ 입력: "let x = 10;"                                 │
│ 출력: [Let, Ident, Assign, Int, Semicolon]          │
│ 역할: 문자 → 토큰 (의미 최소 단위)                  │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ 구문 분석 (Parser) - v14.1 (예정)                   │
├──────────────────────────────────────────────────────┤
│ 입력: [Let, Ident, Assign, Int, Semicolon]          │
│ 출력: AST(Let { name: "x", value: 10 })            │
│ 역할: 토큰 → 구문 트리 (문법 의미)                  │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ 의미 분석 (Semantic Analyzer) - v14.2 (예정)        │
├──────────────────────────────────────────────────────┤
│ 입력: AST(Let { name: "x", value: 10 })            │
│ 처리: 타입 검사, 심볼 테이블 관리                    │
│ 출력: 타입 정보를 포함한 AST                         │
│ 역할: AST → 타입/의미 검증                          │
└──────────────────────────────────────────────────────┘
```

---

## v14.0 완성의 의미

```
v13.0~v13.2: 매크로로 러스트를 확장했다
  → 러스트의 토큰을 조작

v14.0: 컴파일러를 직접 만든다 ← 지금!
  → 우리의 언어의 첫 번째 눈
  → 문자 → 토큰 (의미 추출)
  → 에러 탐지 시작
  → 완전한 컴파일러로 가는 첫 발걸음

다음: v14.1에서는 이 토큰들을 모아
      AST(Abstract Syntax Tree)라는
      의미 있는 구조를 만들 것입니다.
```

---

## 요약

```
v14.0: 어휘 분석기 (Lexer)

철학: "텍스트에서 의미를 추출하다"

핵심 능력:
✅ 소스코드를 토큰으로 분해
✅ 공백과 주석 제거
✅ 키워드/식별자/연산자 구분
✅ 문자열과 숫자 파싱
✅ 에러 조기 탐지
✅ 위치 정보 추적

완전한 어휘 분석 마스터리! 🔨
```

---

## 다음: v14.1 구문 분석기 (Parser)

```
어휘 분석 (Lexer) ✅ v14.0
    ↓ 토큰 스트림
구문 분석 (Parser) ← v14.1 (예정)
    ↓ AST
의미 분석 (Semantic) ← v14.2 (예정)
    ↓ 타입 정보
코드 생성 (CodeGen) ← v14.3 (예정)
```

# v14.1: 구문 분석기 (Parser)
# 제13장: 컴파일러 구현 — Step 1.2

## 철학: "토큰에 위계를 부여하다"

```
v14.0: Lexer (어휘 분석)
  "let x = 10;" → [Let, Ident("x"), Assign, Int(10), Semicolon, EOF]
    ↓
v14.1: Parser (구문 분석) ← 지금!
  [Let, Ident("x"), Assign, Int(10), Semicolon, EOF]
    → AST (Abstract Syntax Tree)
         Let {
           name: "x",
           value: Int(10)
         }
    ↓
v14.2: Semantic Analysis (의미 분석)
  AST + 타입 검증
```

---

## 📚 목차

1. [AST 설계](#1-ast-설계)
2. [Parser 구조](#2-parser-구조)
3. [재귀 하향 파싱](#3-재귀-하향-파싱)
4. [Statement 파싱](#4-statement-파싱)
5. [Expression 파싱](#5-expression-파싱)
6. [연산자 우선순위 기초](#6-연산자-우선순위-기초)
7. [에러 처리](#7-에러-처리)
8. [실전 예제](#8-실전-예제)

---

## 1. AST 설계

### 1.1 추상 구문 트리의 개념

```
입력: "let x = 5 + 3;"
    ↓
Lexer 처리: [Let, Ident("x"), Assign, Plus(5), Plus, Int(3), Semicolon, EOF]
    ↓
Parser 처리: 토큰을 트리 구조로 변환
    ↓
AST (출력):
    Program {
        statements: [
            Statement::Let {
                name: "x",
                value: Expression::BinaryOp {
                    left: Box::new(Expression::IntLiteral(5)),
                    op: Plus,
                    right: Box::new(Expression::IntLiteral(3))
                }
            }
        ]
    }
```

### 1.2 AST 노드 정의

```rust
#[derive(Debug, Clone)]
enum Program {
    Module(Vec<Statement>),
}

#[derive(Debug, Clone)]
enum Statement {
    // 변수 선언: let x = 10;
    Let {
        name: String,
        value: Expression,
    },

    // 함수 정의: fn add(a, b) { a + b }
    Function {
        name: String,
        params: Vec<String>,
        body: Vec<Statement>,
    },

    // if 문: if x > 5 { ... }
    If {
        condition: Expression,
        consequence: Vec<Statement>,
        alternative: Option<Vec<Statement>>,
    },

    // 반복문: while x < 10 { ... }
    While {
        condition: Expression,
        body: Vec<Statement>,
    },

    // 표현식 문: x + 5;
    ExprStmt(Expression),

    // 반환: return x;
    Return(Option<Expression>),
}

#[derive(Debug, Clone)]
enum Expression {
    // 정수 리터럴: 42
    IntLiteral(i64),

    // 실수 리터럴: 3.14
    FloatLiteral(f64),

    // 문자열 리터럴: "hello"
    StringLiteral(String),

    // 식별자: x
    Identifier(String),

    // 불리언: true, false
    Boolean(bool),

    // 배열: [1, 2, 3]
    Array(Vec<Expression>),

    // 배열 인덱싱: arr[0]
    Index {
        array: Box<Expression>,
        index: Box<Expression>,
    },

    // 이항 연산: a + b
    BinaryOp {
        left: Box<Expression>,
        op: BinaryOperator,
        right: Box<Expression>,
    },

    // 단항 연산: -x, !x
    UnaryOp {
        op: UnaryOperator,
        operand: Box<Expression>,
    },

    // 함수 호출: foo(a, b)
    Call {
        function: Box<Expression>,
        arguments: Vec<Expression>,
    },

    // 그룹핑: (a + b)
    Grouped(Box<Expression>),

    // if 표현식: if x > 0 { x } else { -x }
    If {
        condition: Box<Expression>,
        consequence: Vec<Statement>,
        alternative: Option<Vec<Statement>>,
    },
}

#[derive(Debug, Clone, PartialEq)]
enum BinaryOperator {
    Plus,
    Minus,
    Star,
    Slash,
    Eq,
    NotEq,
    Lt,
    Gt,
    LtEq,
    GtEq,
}

#[derive(Debug, Clone, PartialEq)]
enum UnaryOperator {
    Minus,
    Not,
}
```

---

## 2. Parser 구조

### 2.1 Parser의 기본 구조

```rust
struct Parser {
    lexer: Lexer,           // 토큰 생성기
    cur_token: Token,       // 현재 토큰
    peek_token: Token,      // 다음 토큰 (미리 보기)
    errors: Vec<String>,    // 에러 메시지들
}

impl Parser {
    fn new(mut lexer: Lexer) -> Self {
        let cur_token = lexer.next_token();
        let peek_token = lexer.next_token();

        Parser {
            lexer,
            cur_token,
            peek_token,
            errors: Vec::new(),
        }
    }
}
```

### 2.2 토큰 이동 메서드

```rust
impl Parser {
    // 현재 토큰을 다음 토큰으로 이동
    fn next_token(&mut self) {
        self.cur_token = std::mem::replace(
            &mut self.peek_token,
            self.lexer.next_token()
        );
    }

    // 현재 토큰이 주어진 타입과 일치하는지 확인
    fn cur_token_is(&self, t: &Token) -> bool {
        std::mem::discriminant(&self.cur_token)
            == std::mem::discriminant(t)
    }

    // 다음 토큰이 주어진 타입과 일치하는지 확인
    fn peek_token_is(&self, t: &Token) -> bool {
        std::mem::discriminant(&self.peek_token)
            == std::mem::discriminant(t)
    }

    // 다음 토큰이 기대하는 타입인지 확인하고 이동
    fn expect_peek(&mut self, t: Token) -> bool {
        if self.peek_token_is(&t) {
            self.next_token();
            true
        } else {
            self.add_error(format!(
                "Expected {:?}, got {:?}",
                t, self.peek_token
            ));
            false
        }
    }

    fn add_error(&mut self, message: String) {
        self.errors.push(message);
    }
}
```

---

## 3. 재귀 하향 파싱

### 3.1 재귀 하향 파싱의 원리

```
프로그램의 구조:

Program = Statement*
Statement = LetStatement | FunctionStatement | IfStatement | ...
Expression = BinaryOp | UnaryOp | PrimaryExpression

각 문법 규칙을 함수로 구현:

fn parse_program() {
    while cur_token != EOF {
        parse_statement()
    }
}

fn parse_statement() {
    match cur_token {
        Let => parse_let_statement(),
        Fn => parse_function_statement(),
        If => parse_if_statement(),
        ...
    }
}

fn parse_expression() {
    match cur_token {
        Int => parse_integer_literal(),
        Ident => parse_identifier(),
        ...
    }
}
```

### 3.2 트리 구축의 과정

```
입력: "let x = 5;"

1. parse_program()
   ├─ parse_statement()
   │  └─ parse_let_statement()
   │     ├─ 현재 토큰: Let ✓
   │     ├─ 다음 토큰: Ident("x") ✓
   │     ├─ 기대 토큰: Assign ✓
   │     ├─ parse_expression()
   │     │  └─ 현재 토큰: Int(5)
   │     │     └─ Expression::IntLiteral(5)
   │     └─ 기대 토큰: Semicolon ✓
   │
   └─ Statement::Let {
        name: "x",
        value: Expression::IntLiteral(5)
      }
```

---

## 4. Statement 파싱

### 4.1 Let 문 파싱

```rust
fn parse_let_statement(&mut self) -> Option<Statement> {
    // "let" 확인
    if !matches!(self.cur_token, Token::Let) {
        return None;
    }

    // 다음 토큰으로 이동
    self.next_token();

    // 식별자 추출
    let name = match &self.cur_token {
        Token::Ident(name) => name.clone(),
        _ => {
            self.add_error(format!(
                "Expected identifier, got {:?}",
                self.cur_token
            ));
            return None;
        }
    };

    // "=" 확인
    if !self.expect_peek(Token::Assign) {
        return None;
    }

    // 다음 토큰으로 이동 (표현식 읽기 시작)
    self.next_token();

    // 표현식 파싱
    let value = self.parse_expression()?;

    // ";" 확인
    if self.peek_token_is(&Token::Semicolon) {
        self.next_token();
    }

    Some(Statement::Let { name, value })
}

// 사용 예:
// 입력: "let x = 5;"
// 출력: Statement::Let {
//           name: "x",
//           value: Expression::IntLiteral(5)
//       }
```

### 4.2 Function 문 파싱

```rust
fn parse_function_statement(&mut self) -> Option<Statement> {
    // "fn" 확인
    if !matches!(self.cur_token, Token::Fn) {
        return None;
    }

    self.next_token();

    // 함수명 추출
    let name = match &self.cur_token {
        Token::Ident(name) => name.clone(),
        _ => return None,
    };

    // "(" 확인
    if !self.expect_peek(Token::LParen) {
        return None;
    }

    // 매개변수 파싱
    let params = self.parse_function_parameters()?;

    // "{" 확인
    if !self.expect_peek(Token::LBrace) {
        return None;
    }

    // 함수 본문 파싱
    let body = self.parse_block_statement()?;

    Some(Statement::Function { name, params, body })
}
```

### 4.3 If 문 파싱

```rust
fn parse_if_statement(&mut self) -> Option<Statement> {
    // "if" 확인
    if !matches!(self.cur_token, Token::If) {
        return None;
    }

    // "(" 확인
    if !self.expect_peek(Token::LParen) {
        return None;
    }

    self.next_token();

    // 조건 표현식 파싱
    let condition = self.parse_expression()?;

    // ")" 확인
    if !self.expect_peek(Token::RParen) {
        return None;
    }

    // "{" 확인
    if !self.expect_peek(Token::LBrace) {
        return None;
    }

    // 참 분기 파싱
    let consequence = self.parse_block_statement()?;

    // else 분기 (선택사항)
    let alternative = if self.peek_token_is(&Token::Else) {
        self.next_token();
        if !self.expect_peek(Token::LBrace) {
            return None;
        }
        Some(self.parse_block_statement()?)
    } else {
        None
    };

    Some(Statement::If {
        condition,
        consequence,
        alternative,
    })
}
```

---

## 5. Expression 파싱

### 5.1 Primary Expression 파싱

```rust
fn parse_primary_expression(&mut self) -> Option<Expression> {
    match &self.cur_token {
        Token::Int(val) => {
            let expr = Expression::IntLiteral(*val);
            Some(expr)
        }
        Token::Float(val) => {
            let expr = Expression::FloatLiteral(*val);
            Some(expr)
        }
        Token::String(s) => {
            let expr = Expression::StringLiteral(s.clone());
            Some(expr)
        }
        Token::Ident(name) => {
            let expr = Expression::Identifier(name.clone());
            Some(expr)
        }
        Token::True => Some(Expression::Boolean(true)),
        Token::False => Some(Expression::Boolean(false)),
        Token::LParen => {
            self.next_token();
            let expr = self.parse_expression()?;
            if !self.expect_peek(Token::RParen) {
                return None;
            }
            Some(Expression::Grouped(Box::new(expr)))
        }
        Token::LBracket => self.parse_array_literal(),
        _ => {
            self.add_error(format!(
                "Unexpected token in expression: {:?}",
                self.cur_token
            ));
            None
        }
    }
}
```

### 5.2 배열 리터럴 파싱

```rust
fn parse_array_literal(&mut self) -> Option<Expression> {
    let mut elements = Vec::new();

    if self.peek_token_is(&Token::RBracket) {
        self.next_token();
        return Some(Expression::Array(elements));
    }

    self.next_token();
    elements.push(self.parse_expression()?);

    while self.peek_token_is(&Token::Comma) {
        self.next_token();
        self.next_token();
        elements.push(self.parse_expression()?);
    }

    if !self.expect_peek(Token::RBracket) {
        return None;
    }

    Some(Expression::Array(elements))
}

// 입력: "[1, 2, 3]"
// 출력: Expression::Array(vec![
//           Expression::IntLiteral(1),
//           Expression::IntLiteral(2),
//           Expression::IntLiteral(3),
//       ])
```

---

## 6. 연산자 우선순위 기초

### 6.1 연산자 우선순위 문제

```
입력: "5 + 10 * 2"

잘못된 파싱 (우선순위 무시):
    5 + 10 * 2
       (5 + 10) * 2 = 30 ← 잘못됨!

올바른 파싱 (우선순위 적용):
    5 + 10 * 2
       5 + (10 * 2) = 25 ← 맞음!

우선순위 순서 (낮음 → 높음):
1. = (할당)
2. + - (덧셈/뺄셈)
3. * / (곱셈/나눗셈)
4. - ! (단항 연산자)
5. [] () (배열/함수 호출)
```

### 6.2 단순한 이항 연산자 처리

```rust
// 간단한 예제: 덧셈과 뺄셈만
fn parse_additive_expression(&mut self) -> Option<Expression> {
    let mut left = self.parse_primary_expression()?;

    while matches!(self.peek_token, Token::Plus | Token::Minus) {
        self.next_token();

        let op = match self.cur_token {
            Token::Plus => BinaryOperator::Plus,
            Token::Minus => BinaryOperator::Minus,
            _ => unreachable!(),
        };

        self.next_token();
        let right = self.parse_primary_expression()?;

        left = Expression::BinaryOp {
            left: Box::new(left),
            op,
            right: Box::new(right),
        };
    }

    Some(left)
}

// 입력: "5 + 3 - 2"
// 파싱 과정:
// 1. left = 5
// 2. 다음: +
// 3. left = (5 + 3)
// 4. 다음: -
// 5. left = ((5 + 3) - 2)
```

### 6.3 우선순위 계층 구조

```
Expression 파싱 계층:

parse_expression()
    └─ parse_additive_expression()
        ├─ left: parse_multiplicative_expression()
        ├─ op: + or -
        └─ right: parse_multiplicative_expression()

parse_multiplicative_expression()
    ├─ left: parse_unary_expression()
    ├─ op: * or /
    └─ right: parse_unary_expression()

parse_unary_expression()
    ├─ op: - or !
    └─ operand: parse_primary_expression()

parse_primary_expression()
    └─ Int | Float | String | Ident | Boolean | ...
```

---

## 7. 에러 처리

### 7.1 구문 오류 탐지

```rust
// 입력: "let = 5;"
// 예상: let <ident> = <expr>
// 실제: let = <expr>
// 에러: Expected identifier, got Token::Assign

fn parse_let_statement(&mut self) -> Option<Statement> {
    if !matches!(self.cur_token, Token::Let) {
        return None;
    }

    self.next_token();

    let name = match &self.cur_token {
        Token::Ident(name) => name.clone(),
        _ => {
            self.add_error(format!(
                "Expected identifier after 'let', got {:?}",
                self.cur_token
            ));
            return None;  // 파싱 실패
        }
    };

    // ...
}
```

### 7.2 에러 복구 전략

```rust
// 패닉 모드 에러 복구
fn skip_until_next_statement(&mut self) {
    while !matches!(
        self.cur_token,
        Token::Let | Token::Fn | Token::If | Token::EOF
    ) {
        self.next_token();
    }
}

// 여러 문을 파싱할 때 일부만 실패해도 계속 진행
fn parse_program(&mut self) -> Program {
    let mut statements = Vec::new();

    while !matches!(self.cur_token, Token::EOF) {
        if let Some(stmt) = self.parse_statement() {
            statements.push(stmt);
        } else {
            self.skip_until_next_statement();
        }
        self.next_token();
    }

    Program::Module(statements)
}
```

---

## 8. 실전 예제

### 8.1 Let 문 파싱

```
입력: "let x = 5;"

파싱 단계:
1. cur_token = Let ✓
2. next_token() → cur_token = Ident("x")
3. 기대: Assign → peek_token = Assign ✓
4. next_token() → cur_token = Assign
5. next_token() → cur_token = Int(5)
6. parse_expression() → Expression::IntLiteral(5)
7. peek_token = Semicolon ✓
8. next_token() → cur_token = Semicolon

출력:
Statement::Let {
    name: "x",
    value: Expression::IntLiteral(5)
}
```

### 8.2 이항 연산 파싱

```
입력: "2 + 3 * 4"

파싱 결과 (우선순위 무시한 단순 파싱):
    BinaryOp {
        left: BinaryOp {
            left: IntLiteral(2),
            op: Plus,
            right: IntLiteral(3)
        },
        op: Star,
        right: IntLiteral(4)
    }

이는 (2 + 3) * 4 = 20을 의미합니다.
실제 우선순위가 있으면 2 + (3 * 4) = 14가 되어야 합니다.
→ v14.2에서 프랫 파싱으로 해결!
```

### 8.3 중첩된 표현식

```
입력: "let result = (5 + 3) * 2;"

파싱 결과:
Statement::Let {
    name: "result",
    value: BinaryOp {
        left: Grouped(
            BinaryOp {
                left: IntLiteral(5),
                op: Plus,
                right: IntLiteral(3)
            }
        ),
        op: Star,
        right: IntLiteral(2)
    }
}
```

---

## 핵심 비교: Lexer vs Parser

```
┌──────────────────────────────────────────────┐
│ Lexer (v14.0) - 어휘 분석                    │
├──────────────────────────────────────────────┤
│ 입력: "let x = 10;"                         │
│ 출력: [Let, Ident("x"), Assign, Int(10), ..] │
│ 역할: 문자 → 토큰 (선형)                     │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ Parser (v14.1) - 구문 분석 ← 지금!          │
├──────────────────────────────────────────────┤
│ 입력: [Let, Ident("x"), Assign, Int(10), ..] │
│ 출력: Let { name: "x", value: Int(10) }    │
│ 역할: 토큰 → AST (계층)                      │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ Semantic (v14.2) - 의미 분석                 │
├──────────────────────────────────────────────┤
│ 입력: Let { name: "x", value: Int(10) }    │
│ 처리: 타입 검사, 심볼 테이블 관리            │
│ 역할: AST → 타입 정보 추가                   │
└──────────────────────────────────────────────┘
```

---

## v14.1 완성의 의미

```
v14.0 Lexer: 문자 → 토큰 (선형)
v14.1 Parser: 토큰 → AST (계층) ← 지금!

이제 컴파일러는:
✅ 코드를 읽을 수 있고 (Lexer)
✅ 코드의 구조를 이해할 수 있습니다 (Parser)

다음: v14.2
  ├─ 연산자 우선순위 (Pratt Parsing)
  ├─ 복잡한 표현식 처리
  └─ 완전한 AST 생성
```

---

## 요약

```
v14.1: 구문 분석기 (Parser)

철학: "토큰에 위계를 부여하다"

핵심 능력:
✅ AST 노드 설계
✅ 재귀 하향 파싱 구현
✅ 문법 규칙을 함수로 변환
✅ Statement 파싱 (Let, If, While, Function)
✅ Expression 파싱 (기초)
✅ 에러 탐지와 복구

완전한 구문 분석 마스터리! 🌳
```

---

## 다음: v14.2 프랫 파싱 (Pratt Parsing)

```
v14.1: 기본 구문 분석
    └─ 단순 이항 연산자 (좌결합)
    └─ 연산자 우선순위 미지원

v14.2: 고급 표현식 파싱
    └─ 프랫 파싱으로 우선순위 적용
    └─ "5 + 3 * 2" → 5 + (3 * 2) 올바르게 처리
    └─ 완전한 수식 파싱
```

# v14.2: 프랫 파싱 (Pratt Parsing)
# 제13장: 컴파일러 구현 — Step 1.2.2

## 철학: "수식의 계층화"

```
v14.0: Lexer (어휘 분석)
  "5 + 10 * 2" → [Int(5), Plus, Int(10), Star, Int(2)]

v14.1: Parser (기초 구문 분석)
  [Int(5), Plus, Int(10), Star, Int(2)]
    → (5 + 10) * 2 (잘못된 우선순위!)

v14.2: Pratt Parsing (우선순위 처리) ← 지금!
  [Int(5), Plus, Int(10), Star, Int(2)]
    → 5 + (10 * 2) (올바른 우선순위!)
    ↓
v14.3: Interpreter (평가기)
  5 + (10 * 2) → 25
```

---

## 📚 목차

1. [프랫 파싱의 개념](#1-프랫-파싱의-개념)
2. [우선순위 설계](#2-우선순위-설계)
3. [Prefix와 Infix 분석](#3-prefix와-infix-분석)
4. [재귀적 결합](#4-재귀적-결합)
5. [구현 패턴](#5-구현-패턴)
6. [좌측/우측 결합](#6-좌측우측-결합)
7. [실전 예제](#7-실전-예제)
8. [최적화 기법](#8-최적화-기법)

---

## 1. 프랫 파싱의 개념

### 1.1 연산자의 "자석" 비유

```
연산자는 양옆의 피연산자를 끌어당기는 자석:

+ : 약한 자석  (우선순위: 1)
* : 강한 자석  (우선순위: 2)

5 + 10 * 2

1단계: 5 읽음
2단계: + 만남 (약한 자석)
3단계: 10 읽음
4단계: * 만남 (강한 자석!)
     → 약한 자석 + 가 강한 자석 * 에 지배권을 내줌
5단계: 10과 2는 * 로 먼저 결합
     → (10 * 2) = 20
6단계: 5와 20을 + 로 결합
     → 5 + 20 = 25
```

### 1.2 프랫 파싱의 흐름

```
parse_expression(precedence):
    ↓
    left = parse_prefix()   # 첫 번째 피연산자
    ↓
    while (peek_precedence > current_precedence):
        ↓
        left = parse_infix(left)  # 연산자 처리
    ↓
    return left
```

---

## 2. 우선순위 설계

### 2.1 우선순위 레벨 정의

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
enum Precedence {
    Lowest = 0,      // 기본값
    Assignment = 1,  // =
    Or = 2,          // ||
    And = 3,         // &&
    Equality = 4,    // ==, !=
    Comparison = 5,  // <, >, <=, >=
    Term = 6,        // +, -
    Factor = 7,      // *, /
    Unary = 8,       // -, !
    Power = 9,       // ** (우측 결합)
    Call = 10,       // f(), array[i]
    Highest = 11,    // 최상위
}

// 우선순위 단계 (낮음 → 높음):
// Lowest(기본)
//   ↓
// Assignment (=)
//   ↓
// Or (||)
//   ↓
// And (&&)
//   ↓
// Equality (==, !=)
//   ↓
// Comparison (<, >, <=, >=)
//   ↓
// Term (+, -)
//   ↓
// Factor (*, /)
//   ↓
// Unary (-, !)
//   ↓
// Power (**)
//   ↓
// Call ((), [])
```

### 2.2 연산자별 우선순위 맵

```rust
fn token_precedence(token: &Token) -> Precedence {
    match token {
        Token::Plus | Token::Minus => Precedence::Term,
        Token::Star | Token::Slash => Precedence::Factor,
        Token::Eq | Token::NotEq => Precedence::Equality,
        Token::Lt | Token::Gt | Token::LtEq | Token::GtEq => Precedence::Comparison,
        Token::And => Precedence::And,
        Token::Or => Precedence::Or,
        Token::LParen => Precedence::Call,
        Token::LBracket => Precedence::Call,
        Token::Assign => Precedence::Assignment,
        _ => Precedence::Lowest,
    }
}

// 예시:
// + → Term (6)
// * → Factor (7)
// == → Equality (4)
// () → Call (10)
```

---

## 3. Prefix와 Infix 분석

### 3.1 Prefix 분석 (전위)

```rust
fn parse_prefix(&mut self) -> Option<Expression> {
    match self.cur_token {
        Token::Int(val) => {
            Some(Expression::IntLiteral(val))
        }
        Token::Float(val) => {
            Some(Expression::FloatLiteral(val))
        }
        Token::Ident(ref name) => {
            Some(Expression::Identifier(name.clone()))
        }
        Token::LParen => {
            self.next_token();
            let expr = self.parse_expression(Precedence::Lowest)?;
            if !self.expect_peek(Token::RParen) {
                return None;
            }
            Some(Expression::Grouped(Box::new(expr)))
        }
        Token::Minus | Token::Not => {
            let op = match self.cur_token {
                Token::Minus => UnaryOperator::Minus,
                Token::Not => UnaryOperator::Not,
                _ => unreachable!(),
            };
            self.next_token();
            let operand = self.parse_expression(Precedence::Unary)?;
            Some(Expression::Unary {
                op,
                operand: Box::new(operand),
            })
        }
        _ => None,
    }
}

// 처리하는 것:
// - 숫자: 42, 3.14
// - 식별자: x, variable
// - 괄호: (expr)
// - 단항: -x, !flag
```

### 3.2 Infix 분석 (중위)

```rust
fn parse_infix(&mut self, left: Expression) -> Option<Expression> {
    match self.cur_token {
        Token::Plus | Token::Minus | Token::Star | Token::Slash
        | Token::Eq | Token::NotEq
        | Token::Lt | Token::Gt | Token::LtEq | Token::GtEq
        | Token::And | Token::Or => {
            let operator = self.cur_token.clone();
            let precedence = self.cur_precedence();
            self.next_token();

            // 우측 표현식을 현재 우선순위로 재귀 파싱
            let right = self.parse_expression(precedence)?;

            Some(Expression::Binary {
                left: Box::new(left),
                operator,
                right: Box::new(right),
            })
        }
        Token::LParen => {
            // 함수 호출
            self.next_token();
            let args = self.parse_call_arguments()?;
            Some(Expression::Call {
                function: Box::new(left),
                arguments: args,
            })
        }
        Token::LBracket => {
            // 배열 인덱싱
            self.next_token();
            let index = self.parse_expression(Precedence::Lowest)?;
            if !self.expect_peek(Token::RBracket) {
                return None;
            }
            Some(Expression::Index {
                array: Box::new(left),
                index: Box::new(index),
            })
        }
        _ => None,
    }
}

// 처리하는 것:
// - 이항: a + b, x * y
// - 함수 호출: f(x, y)
// - 배열 인덱싱: arr[i]
```

---

## 4. 재귀적 결합

### 4.1 parse_expression의 핵심

```rust
fn parse_expression(&mut self, precedence: Precedence) -> Option<Expression> {
    // 1. 전위 분석으로 왼쪽 표현식 파싱
    let mut left = self.parse_prefix()?;

    // 2. 다음 토큰이 세미콜론이 아니고,
    //    우선순위가 현재보다 높으면 계속 결합
    while !self.peek_token_is(Token::Semicolon)
        && precedence < self.peek_precedence()
    {
        self.next_token();

        // 3. 중위 분석으로 이항 연산 처리
        left = self.parse_infix(left)?;
    }

    Some(left)
}
```

### 4.2 예제: "5 + 10 * 2" 파싱 과정

```
입력: [Int(5), Plus, Int(10), Star, Int(2), Semicolon]

1단계: parse_expression(Lowest)
  ├─ parse_prefix() → 5
  ├─ peek = Plus (우선순위 6)
  ├─ Lowest(0) < Plus(6) → 계속
  │
  └─ while loop 시작
      1회차:
        ├─ next_token() → cur = Plus
        ├─ parse_infix(5)
        │   ├─ precedence = Plus(6)
        │   ├─ next_token() → cur = Int(10)
        │   ├─ parse_expression(Plus(6))
        │   │   ├─ parse_prefix() → 10
        │   │   ├─ peek = Star (우선순위 7)
        │   │   ├─ Plus(6) < Star(7) → 계속
        │   │   │
        │   │   └─ while loop 시작
        │   │       1회차:
        │   │         ├─ next_token() → cur = Star
        │   │         ├─ parse_infix(10)
        │   │         │   ├─ precedence = Star(7)
        │   │         │   ├─ next_token() → cur = Int(2)
        │   │         │   ├─ parse_expression(Star(7))
        │   │         │   │   ├─ parse_prefix() → 2
        │   │         │   │   ├─ peek = Semicolon
        │   │         │   │   └─ return 2
        │   │         │   └─ return (10 * 2)
        │   │         ├─ left = (10 * 2)
        │   │         ├─ peek = Semicolon
        │   │         └─ break
        │   │
        │   └─ return (10 * 2)
        ├─ left = (5 + (10 * 2))
        ├─ peek = Semicolon
        └─ break

최종 결과: (5 + (10 * 2))
```

---

## 5. 구현 패턴

### 5.1 Parser 구조

```rust
struct Parser {
    lexer: Lexer,
    cur_token: Token,
    peek_token: Token,
    errors: Vec<String>,
}

impl Parser {
    fn cur_precedence(&self) -> Precedence {
        token_precedence(&self.cur_token)
    }

    fn peek_precedence(&self) -> Precedence {
        token_precedence(&self.peek_token)
    }

    fn next_token(&mut self) {
        self.cur_token = std::mem::replace(
            &mut self.peek_token,
            self.lexer.next_token()
        );
    }

    fn expect_peek(&mut self, token: Token) -> bool {
        if self.peek_token_is(&token) {
            self.next_token();
            true
        } else {
            false
        }
    }
}
```

### 5.2 전체 파싱 흐름

```rust
fn parse_program(&mut self) -> Program {
    let mut statements = Vec::new();

    while !matches!(self.cur_token, Token::EOF) {
        if let Some(stmt) = self.parse_statement() {
            statements.push(stmt);
        }
        self.next_token();
    }

    Program::Module(statements)
}

fn parse_statement(&mut self) -> Option<Statement> {
    match self.cur_token {
        Token::Let => self.parse_let_statement(),
        Token::Fn => self.parse_function_statement(),
        Token::If => self.parse_if_statement(),
        _ => {
            // 표현식 문
            let expr = self.parse_expression(Precedence::Lowest)?;
            Some(Statement::ExprStmt(expr))
        }
    }
}
```

---

## 6. 좌측/우측 결합

### 6.1 좌측 결합 (Left Associative)

```
대부분의 연산자는 좌측 결합:

1 + 2 + 3
= (1 + 2) + 3  ← 왼쪽부터 계산

구현:
parse_expression(Term(6))
  ├─ left = 1
  ├─ while (Term < peek):
  │   ├─ left = (1 + 2)
  │   ├─ while (Term < peek):
  │   │   └─ left = ((1 + 2) + 3)
  │   └─ return
```

### 6.2 우측 결합 (Right Associative)

```
거듭제곱은 우측 결합:

2 ^ 3 ^ 2
= 2 ^ (3 ^ 2)  ← 오른쪽부터 계산
= 2 ^ 9
= 512

구현:
parse_expression(Power(9))
  ├─ left = 2
  ├─ while (Power < peek):  ← 같은 우선순위면 계속
  │   ├─ parse_infix(2)
  │   │   ├─ parse_expression(Power-1)  ← 낮은 우선순위로!
  │   │   ├─ left = 3
  │   │   ├─ while (Power-1 < peek):
  │   │   │   └─ left = (3 ^ 2)
  │   │   └─ return (3 ^ 2)
  │   └─ left = (2 ^ (3 ^ 2))

비결합 (우측):
parse_infix에서 precedence-1을 사용
좌결합:
parse_infix에서 precedence를 그대로 사용
```

---

## 7. 실전 예제

### 7.1 산술식 파싱

```
입력: "5 * 3 + 2"

1. parse_expression(Lowest)
2. parse_prefix() → 5
3. peek = Star (7) > Lowest (0) → 계속
4. parse_infix(5)
   - cur = Star, prec = 7
   - parse_expression(7)
     - parse_prefix() → 3
     - peek = Plus (6) < Factor (7) → 중단
     - return 3
   - return (5 * 3)
5. left = (5 * 3)
6. peek = Plus (6) > Lowest (0) → 계속
7. parse_infix(15)
   - cur = Plus, prec = 6
   - parse_expression(6)
     - parse_prefix() → 2
     - peek = Semicolon → 중단
     - return 2
   - return ((5 * 3) + 2)
8. left = ((5 * 3) + 2)

결과: (5 * 3) + 2 ✓
```

### 7.2 비교 연산식

```
입력: "x < 5 && y > 10"

파싱 순서:
1. x (Identifier)
2. < y (Comparison, prec=5)
3. && (And, prec=3)
   - 우선순위 < : 5 > && : 3
   - < 가 먼저 결합
4. (x < 5) && (y > 10)

올바른 AST:
    &&
   /  \
  <    >
 / \  / \
x  5 y  10
```

### 7.3 함수 호출

```
입력: "add(3, 4) * 2"

파싱:
1. add (Identifier)
2. ( (Call, prec=10) → 함수 호출 분석
3. parse_call_arguments() → [3, 4]
4. (add(3, 4))
5. * (Factor, prec=7) > Lowest → 계속
6. 2
7. (add(3, 4) * 2)
```

---

## 8. 최적화 기법

### 8.1 토큰-함수 맵핑

```rust
type PrefixFn = fn(&mut Parser) -> Option<Expression>;
type InfixFn = fn(&mut Parser, Expression) -> Option<Expression>;

struct ParseletRegistry {
    prefix_fns: HashMap<TokenType, PrefixFn>,
    infix_fns: HashMap<TokenType, InfixFn>,
}

impl ParseletRegistry {
    fn new() -> Self {
        let mut registry = ParseletRegistry {
            prefix_fns: HashMap::new(),
            infix_fns: HashMap::new(),
        };

        // Prefix 등록
        registry.prefix_fns.insert(TokenType::Int, Parser::parse_integer);
        registry.prefix_fns.insert(TokenType::LParen, Parser::parse_grouped);
        registry.prefix_fns.insert(TokenType::Minus, Parser::parse_prefix_op);

        // Infix 등록
        registry.infix_fns.insert(TokenType::Plus, Parser::parse_infix_op);
        registry.infix_fns.insert(TokenType::Star, Parser::parse_infix_op);
        registry.infix_fns.insert(TokenType::LParen, Parser::parse_call);

        registry
    }
}

// 사용:
// let prefix_fn = registry.prefix_fns.get(&cur_token_type)?;
// prefix_fn(self)
```

### 8.2 우선순위 테이블

```rust
const PRECEDENCES: &[Precedence] = &[
    Precedence::Lowest,      // 기본값
    Precedence::Assignment,  // =
    Precedence::Or,          // ||
    Precedence::And,         // &&
    Precedence::Equality,    // ==, !=
    Precedence::Comparison,  // <, >, <=, >=
    Precedence::Term,        // +, -
    Precedence::Factor,      // *, /
    Precedence::Unary,       // -, !
    Precedence::Power,       // **
    Precedence::Call,        // (), []
    Precedence::Highest,     // 최상위
];
```

---

## 핵심 비교: v14.1 vs v14.2

```
┌─────────────────────────────────────┐
│ v14.1: 기초 파서                   │
├─────────────────────────────────────┤
│ 장점: 간단, 이해하기 쉬움          │
│ 단점: 우선순위 미지원              │
│ 예: 5 + 10 * 2 → (5+10)*2 ❌      │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ v14.2: 프랫 파싱 ← 지금!           │
├─────────────────────────────────────┤
│ 장점: 우선순위 완벽 처리            │
│ 우점: 약간 더 복잡                 │
│ 예: 5 + 10 * 2 → 5+(10*2) ✅      │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ v14.3: 인터프리터 (예정)           │
├─────────────────────────────────────┤
│ 역할: AST 평가하여 값 계산         │
│ 입력: 5 + (10 * 2)                 │
│ 출력: 25                           │
└─────────────────────────────────────┘
```

---

## v14.2 완성의 의미

```
v14.0 Lexer: 문자 → 토큰
v14.1 Parser: 토큰 → 기초 AST
v14.2 Pratt: 기초 AST → 완벽한 우선순위 AST ← 지금!

이제 컴파일러는:
✅ 코드를 읽을 수 있고 (Lexer)
✅ 문법을 이해할 수 있으며 (Parser)
✅ 복잡한 수식도 완벽하게 해석합니다 (Pratt Parsing)

다음: v14.3
  ├─ AST 순회 (Tree Walk)
  ├─ 실제 계산 수행
  └─ 값 반환
```

---

## 요약

```
v14.2: 프랫 파싱 (Pratt Parsing)

철학: "수식의 계층화"

핵심 능력:
✅ 우선순위 레벨 정의
✅ Prefix/Infix 분석 분리
✅ 재귀적 우선순위 비교
✅ 연산자 자석의 세기 조절
✅ 좌측/우측 결합 처리

완전한 연산자 우선순위 처리! 🧮

다음: v14.3 인터프리터로 AST를 실제로 평가!
```

---

## 다음: v14.3 인터프리터 (Interpreter)

```
AST 평가 예:

입력 AST:
    +
   / \
  5   *
     / \
   10   2

평가:
1. + 노드 방문
2. 왼쪽 평가: 5
3. 오른쪽 평가: * 노드 방문
   a. 왼쪽: 10
   b. 오른쪽: 2
   c. 계산: 10 * 2 = 20
4. 계산: 5 + 20 = 25

결과: 25 ✓
```

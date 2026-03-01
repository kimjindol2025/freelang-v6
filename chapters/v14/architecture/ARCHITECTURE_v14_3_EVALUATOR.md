# v14.3: 평가기(Evaluator)와 객체 시스템
## 제13장: 컴파일러 구현 — 트리의 실행

---

## 📚 목차

1. [평가기의 철학](#평가기의-철학)
2. [객체 시스템 설계](#객체-시스템-설계)
3. [평가 엔진](#평가-엔진)
4. [환경과 변수 바인딩](#환경과-변수-바인딩)
5. [표현식 평가](#표현식-평가)
6. [명령문 평가](#명령문-평가)
7. [에러 핸들링](#에러-핸들링)
8. [실전 설계 패턴](#실전-설계-패턴)

---

## 🎯 평가기의 철학

### "트리를 결과값으로 변환"

```
Lexer (v14.0)          Parser (v14.1)      Pratt (v14.2)         Evaluator (v14.3)
문자열                  토큰                AST                   값
"5 + 10"    →    [Int(5), Plus, Int(10)]  →  BinaryOp{...}    →   15
  ↓                     ↓                       ↓                    ↓
실행 불가          분석만 가능          구조만 완성           드디어 실행!
```

### 핵심 원칙: "재귀적 해석"

```rust
질문: "이 노드는 무엇인가?"

1단계: 노드 타입 확인
   - IntegerLiteral? → 값 반환
   - BinaryOp? → 자식 평가
   - Identifier? → 환경에서 조회

2단계: 자식 노드 평가 (필요시)
   eval_expression(left) → 값1
   eval_expression(right) → 값2

3단계: 연산 수행
   match (값1, 값2, 연산자) { ... }

4단계: 결과값 반환
   → GogsObject
```

**예시: "5 + 10" 평가 과정**
```
BinaryOp { left: IntLiteral(5), op: Plus, right: IntLiteral(10) }
    ↓
eval_infix_expression(
    eval_expression(IntLiteral(5)),     // 5
    Plus,
    eval_expression(IntLiteral(10))     // 10
)
    ↓
match (Integer(5), Integer(10)) {
    Plus => Integer(5 + 10) = Integer(15)
}
    ↓
Integer(15)
```

---

## 🎨 객체 시스템 설계

### GogsObject: 언어의 모든 값

```rust
#[derive(Debug, PartialEq, Clone)]
enum GogsObject {
    Integer(i32),
    Boolean(bool),
    Null,
    Array(Vec<GogsObject>),
    HashValue(HashMap<String, GogsObject>),
    Function {
        params: Vec<String>,
        body: Block,
        env: Environment,  // 클로저: 정의 시점의 환경 캡처
    },
    ReturnValue(Box<GogsObject>),
    Error(String),
}
```

### 왜 enum인가?

```
Rust의 enum으로 표현하면:

✅ 타입 안전성
   match expr {
       GogsObject::Integer(n) => { /* n은 i32 */ },
       GogsObject::Boolean(b) => { /* b는 bool */ },
   }
   컴파일러가 모든 경우를 강제!

✅ 메모리 효율성
   모든 변형이 동일한 크기 (가장 큰 변형)
   런타임 오버헤드 최소

✅ 표현력
   null(없음), 에러도 표현 가능
```

### 각 타입의 역할

```
Integer(i32):
└─ 숫자 연산의 기반
└─ 5 + 10 → Integer(15)

Boolean(bool):
└─ 조건부 분기
└─ if 5 > 3 { ... }

Null:
└─ 값이 없음 (타입 오류의 "계곡")
└─ true + 5 → Null (타입 불일치)

Array(Vec<GogsObject>):
└─ 컬렉션
└─ [1, 2, 3] → Array(vec![Integer(1), Integer(2), Integer(3)])

Function { params, body, env }:
└─ 일급 함수(First-class Function)
└─ fn add(x, y) { x + y } → 함수 객체로 저장 가능
└─ env: 클로저의 핵심! 정의 시점의 환경을 캡처

ReturnValue:
└─ return 명령문 처리
└─ return 42; → ReturnValue(Integer(42))
└─ 함수 내부에서 조기 탈출

Error(String):
└─ 타입 에러, 런타임 에러 전파
└─ true + 5 → Error("type mismatch: BOOLEAN + INTEGER")
```

---

## ⚙️ 평가 엔진

### Evaluator 구조체

```rust
pub struct Evaluator;

impl Evaluator {
    // 핵심 메서드들
    pub fn eval(program: Program) -> GogsObject { ... }
    fn eval_statement(&mut self, stmt: Statement) -> GogsObject { ... }
    fn eval_expression(&self, expr: Expression) -> GogsObject { ... }
    fn eval_infix_expression(&self, left: GogsObject, op: Token, right: GogsObject) -> GogsObject { ... }
    fn eval_prefix_expression(&self, op: Token, operand: GogsObject) -> GogsObject { ... }
    fn eval_if_expression(&mut self, cond: Expression, cons: Block, alt: Option<Block>) -> GogsObject { ... }
    fn is_truthy(&self, obj: &GogsObject) -> bool { ... }
}
```

### 간단한 평가 루프

```rust
impl Evaluator {
    pub fn eval(program: Program, env: &mut Environment) -> GogsObject {
        let mut result = GogsObject::Null;

        for stmt in program.statements {
            result = match stmt {
                Statement::Return(expr) => {
                    // return 만났으면 즉시 종료
                    return GogsObject::ReturnValue(
                        Box::new(self.eval_expression(&expr, env))
                    );
                }
                Statement::Let { name, value } => {
                    let obj = self.eval_expression(&value, env);
                    env.set(name, obj.clone());
                    obj
                }
                _ => self.eval_statement(stmt, env),
            };
        }

        result
    }
}
```

---

## 🗂️ 환경과 변수 바인딩

### Environment: 심볼 테이블

```rust
pub struct Environment {
    vars: HashMap<String, GogsObject>,
    outer: Option<Box<Environment>>,  // 중첩 스코프 (클로저)
}

impl Environment {
    pub fn new() -> Self {
        Environment {
            vars: HashMap::new(),
            outer: None,
        }
    }

    pub fn get(&self, name: &str) -> Option<GogsObject> {
        // 1. 현재 환경에서 찾기
        if let Some(obj) = self.vars.get(name) {
            return Some(obj.clone());
        }

        // 2. 외부 환경에서 찾기 (재귀적)
        if let Some(outer) = &self.outer {
            return outer.get(name);
        }

        // 3. 찾지 못함
        None
    }

    pub fn set(&mut self, name: String, obj: GogsObject) {
        self.vars.insert(name, obj);
    }

    pub fn extend(&self) -> Self {
        // 자식 환경 생성 (현재를 부모로)
        Environment {
            vars: HashMap::new(),
            outer: Some(Box::new(self.clone())),
        }
    }
}
```

### 왜 Environment를 체인 구조로?

```
전역 환경:
┌─────────────────────┐
│ x = 10              │
│ y = 20              │
└─────────────────────┘

함수 호출 환경:
     ┌────────────────┐
     │ a = 5          │
     │ b = 15         │
     │ outer ──────→ (전역)
     └────────────────┘

장점:
✅ 스코프 계층화
   - 함수 내부에서 x 찾기
   - 현재 환경에 없으면 외부 환경 탐색

✅ 클로저 가능
   - 함수가 정의 시점의 환경을 캡처
   - fn make_adder(x) { fn(y) { x + y } }

✅ 메모리 효율
   - 전체 환경 복사 X
   - 참조만 유지
```

### 예시: 변수 바인딩과 스코프

```rust
// let x = 5;
let mut env = Environment::new();
env.set("x".to_string(), GogsObject::Integer(5));

// let y = x + 10;
if let Some(x_val) = env.get("x") {
    let y_val = eval_infix(x_val, Plus, Integer(10));
    env.set("y".to_string(), y_val);
}

// 함수 내부 스코프
let mut func_env = env.extend();  // 부모: env
func_env.set("z".to_string(), GogsObject::Integer(100));

// func_env에서 "x" 조회 → 외부 환경으로 탐색 → 5 반환
```

---

## 📝 표현식 평가

### IntegerLiteral: 가장 간단한 경우

```rust
Expression::IntegerLiteral(val) => GogsObject::Integer(val)
```

### BinaryOp: 이항 연산

```rust
Expression::BinaryOp { left, op, right } => {
    let left_val = self.eval_expression(left, env);
    let right_val = self.eval_expression(right, env);

    // 타입 체크 + 연산
    self.eval_infix_expression(left_val, *op, right_val)
}
```

**전체 eval_infix_expression:**

```rust
fn eval_infix_expression(&self, left: GogsObject, op: Token, right: GogsObject) -> GogsObject {
    match (&left, &right) {
        // 정수 연산
        (GogsObject::Integer(l), GogsObject::Integer(r)) => {
            match op {
                Token::Plus => GogsObject::Integer(l + r),
                Token::Minus => GogsObject::Integer(l - r),
                Token::Star => GogsObject::Integer(l * r),
                Token::Slash => {
                    if *r == 0 {
                        GogsObject::Error("division by zero".to_string())
                    } else {
                        GogsObject::Integer(l / r)
                    }
                }
                Token::Eq => GogsObject::Boolean(l == r),
                Token::NotEq => GogsObject::Boolean(l != r),
                Token::Lt => GogsObject::Boolean(l < r),
                Token::Gt => GogsObject::Boolean(l > r),
                Token::LtEq => GogsObject::Boolean(l <= r),
                Token::GtEq => GogsObject::Boolean(l >= r),
                _ => GogsObject::Error(format!("unknown operator: {} {} {}",
                    "INTEGER", op, "INTEGER")),
            }
        }

        // 불리언 연산 (&&, ||는 단락 평가)
        (GogsObject::Boolean(l), GogsObject::Boolean(r)) => {
            match op {
                Token::And => GogsObject::Boolean(*l && *r),
                Token::Or => GogsObject::Boolean(*l || *r),
                _ => GogsObject::Error(format!("unknown operator: {} {} {}",
                    "BOOLEAN", op, "BOOLEAN")),
            }
        }

        // 문자열 연결 (미래 확장)
        // (GogsObject::String(l), GogsObject::String(r)) => { ... }

        // 타입 불일치
        (left_type, right_type) => {
            GogsObject::Error(format!("type mismatch: {} {} {}",
                left_type.type_name(), op, right_type.type_name()))
        }
    }
}
```

### UnaryOp: 단항 연산

```rust
Expression::UnaryOp { op, operand } => {
    let obj = self.eval_expression(operand, env);
    self.eval_prefix_expression(*op, obj)
}

fn eval_prefix_expression(&self, op: Token, operand: GogsObject) -> GogsObject {
    match op {
        Token::Bang => {
            // ! (NOT 연산)
            match operand {
                GogsObject::Boolean(b) => GogsObject::Boolean(!b),
                GogsObject::Null => GogsObject::Boolean(true),
                _ => GogsObject::Boolean(false),
            }
        }
        Token::Minus => {
            // - (음수)
            match operand {
                GogsObject::Integer(n) => GogsObject::Integer(-n),
                _ => GogsObject::Error(format!("unknown prefix operator: -{}", operand.type_name())),
            }
        }
        _ => GogsObject::Error(format!("unknown prefix operator: {}", op)),
    }
}
```

### Identifier: 변수 조회

```rust
Expression::Identifier(name) => {
    match env.get(&name) {
        Some(obj) => obj,
        None => GogsObject::Error(format!("undefined variable: {}", name)),
    }
}
```

### Array: 배열 리터럴

```rust
Expression::ArrayLiteral(elements) => {
    let evaluated: Vec<GogsObject> = elements
        .iter()
        .map(|e| self.eval_expression(e, env))
        .collect();

    GogsObject::Array(evaluated)
}
```

### Index: 배열 접근

```rust
Expression::Index { left, index } => {
    let obj = self.eval_expression(left, env);
    let idx = self.eval_expression(index, env);

    match (obj, idx) {
        (GogsObject::Array(arr), GogsObject::Integer(i)) => {
            let idx = if i < 0 {
                (arr.len() as i32 + i) as usize
            } else {
                i as usize
            };

            arr.get(idx).cloned().unwrap_or(GogsObject::Null)
        }
        _ => GogsObject::Error("invalid index operation".to_string()),
    }
}
```

---

## 📌 명령문 평가

### Let 문

```rust
Statement::Let { name, value } => {
    let obj = self.eval_expression(&value, env);
    env.set(name, obj.clone());
    obj
}
```

### If 문

```rust
Statement::If { condition, consequence, alternative } => {
    let cond = self.eval_expression(condition, env);

    if self.is_truthy(&cond) {
        self.eval_block(consequence, env)
    } else if let Some(alt) = alternative {
        self.eval_block(alt, env)
    } else {
        GogsObject::Null
    }
}

fn is_truthy(&self, obj: &GogsObject) -> bool {
    match obj {
        GogsObject::Null => false,
        GogsObject::Boolean(b) => *b,
        _ => true,  // 정수는 모두 true (0도 true)
    }
}
```

### While 문

```rust
Statement::While { condition, body } => {
    let mut result = GogsObject::Null;

    loop {
        let cond = self.eval_expression(condition, env);
        if !self.is_truthy(&cond) {
            break;
        }

        result = self.eval_block(body, env);

        // return 만났으면 즉시 종료
        if matches!(result, GogsObject::ReturnValue(_)) {
            break;
        }
    }

    result
}
```

### Return 문

```rust
Statement::Return(expr) => {
    let obj = self.eval_expression(expr, env);
    GogsObject::ReturnValue(Box::new(obj))
}
```

**Return 처리의 특이점:**

```rust
// 함수 내부 eval_block에서
for stmt in block.statements {
    let result = self.eval_statement(stmt, env);

    // ReturnValue를 만나면 즉시 전파
    if matches!(result, GogsObject::ReturnValue(_)) {
        return result;
    }
}
```

---

## 🚨 에러 핸들링

### 타입 에러

```
예1: true + 5
→ Error("type mismatch: BOOLEAN + INTEGER")

예2: x (정의되지 않은 변수)
→ Error("undefined variable: x")

예3: arr[1.5] (정수가 아닌 인덱스)
→ Error("invalid index operation")

예4: 1 / 0
→ Error("division by zero")
```

### 에러의 처리

```rust
// 평가 중 에러 발생 시:
let left = self.eval_expression(left_expr, env);
if matches!(left, GogsObject::Error(_)) {
    return left;  // 에러 즉시 전파
}

let right = self.eval_expression(right_expr, env);
if matches!(right, GogsObject::Error(_)) {
    return right;  // 에러 즉시 전파
}

// 에러가 없으면 계속 진행
```

### 에러 메시지의 흐름

```
Input:  "let x = true + 5;"
          ↓
Parse:   Let { name: "x", value: BinaryOp { left: Boolean(true), op: Plus, right: Integer(5) } }
          ↓
Eval:    eval_expression(BinaryOp { ... })
         → eval_infix(Boolean(true), Plus, Integer(5))
         → "type mismatch: BOOLEAN + INTEGER"
          ↓
Output: Error("type mismatch: BOOLEAN + INTEGER")
```

---

## 🎓 실전 설계 패턴

### 패턴 1: 기본 산술 평가

```
코드:     let x = 2 + 3 * 4;
파싱:     Let { name: "x", value: BinaryOp { ... } }
우선순위: 2 + (3 * 4) [프랫 파싱]
평가:
  eval(3 * 4) → 12
  eval(2 + 12) → 14
저장:     env.set("x", Integer(14))
```

### 패턴 2: 조건부 분기

```
코드:     if x > 5 { x * 2 } else { x }
평가:
  eval(x > 5) → Boolean
  true면  → eval(x * 2)
  false면 → eval(x)
```

### 패턴 3: 루프

```
코드:     while i < 10 { i = i + 1; }
평가:
  반복: 조건 평가 → 명령문 평가
  조건 false → 루프 종료
```

### 패턴 4: 함수 정의 및 호출

```
코드:     fn add(x, y) { x + y }
파싱:     Function { params: ["x", "y"], body: { ... } }
평가:     GogsObject::Function { params, body, env: 현재환경 }
저장:     env.set("add", Function{ ... })

호출:     add(5, 3)
평가:
  1. add 조회 → Function 객체
  2. 호출 환경 생성: params와 arguments 매핑
     new_env.set("x", 5)
     new_env.set("y", 3)
  3. 함수 본체 평가: eval_block(body, new_env)
  4. 반환값 추출 (ReturnValue 제거)
```

### 패턴 5: 배열과 인덱싱

```
코드:     let arr = [1, 2, 3]; arr[1]
평가:
  1. [1, 2, 3] → Array([Integer(1), Integer(2), Integer(3)])
  2. arr → Array(...)
  3. arr[1] → Array에서 index 1 조회 → Integer(2)
```

### 패턴 6: 클로저 (고급)

```
코드:     fn make_adder(x) { fn(y) { x + y } }
평가:
  1. make_adder 호출: make_adder(5)
  2. 내부 함수 정의: fn(y) { x + y }
     이 함수는 x=5인 환경을 캡처!
     GogsObject::Function { params: ["y"], body: {...}, env: {...x: 5...} }
  3. 반환: 클로저 함수
  4. 나중에 호출: returned_fn(3)
     → env.get("x") = 5 (캡처된 환경에서!)
     → eval(5 + 3) = 8
```

---

## 🔄 평가기 vs Lexer vs Parser vs Pratt

```
Lexer (v14.0):
"5 + 10"  →  [Int(5), Plus, Int(10)]
질문: 이게 뭐고?
답: 토큰이다.

Parser (v14.1):
[...] → BinaryOp { left: Integer(5), op: Plus, right: Integer(10) }
질문: 구조가 맞나?
답: 맞다.

Pratt (v14.2):
"2 + 3 * 4"  →  2 + (3 * 4)  [우선순위 반영]
질문: 우선순위가 맞나?
답: 맞다. 3*4가 먼저 묶여야 한다.

Evaluator (v14.3) ← 새로운 영역!
BinaryOp { ... }  →  Integer(15)
질문: 값이 뭔가?
답: 15다! 🎉 (실행 결과)
```

---

## 📊 성능 고려사항

### 트리 워킹 인터프리터의 특징

```
장점:
✅ 구현이 간단하고 명확
✅ 디버깅이 쉬움
✅ 원리 학습에 최적

단점:
❌ 느림 (같은 바이트코드를 반복 평가)
❌ 메모리 오버헤드 (AST 트리)
❌ 최적화 어려움

개선 방법:
1. 바이트코드 컴파일 (v14.4)
2. JIT 컴파일 (고급)
3. 상수 폴딩 (최적화)
```

### 메모리 구조

```
AST:
BinaryOp {
  left: Box<IntLiteral(5)>,           8 bytes
  op: Token::Plus,                     24 bytes
  right: Box<IntLiteral(10)>           8 bytes
}

Evaluated:
GogsObject::Integer(15)                4 bytes

메모리 효율:
- 파싱 후: 40 bytes (AST)
- 평가 후: 4 bytes (결과)
- 트리 제거 가능 → 메모리 절약
```

---

## 🏆 설계자의 관점: 5가지 시각

### 1. **언어 설계자의 관점**
"우리 언어는 어떤 값을 지원할 것인가?"
→ GogsObject enum 설계의 핵심

### 2. **인터프리터 개발자의 관점**
"이 값을 어떻게 계산할 것인가?"
→ eval_* 메서드들의 구현

### 3. **런타임 엔지니어의 관점**
"변수를 어디에 저장할 것인가?"
→ Environment와 HashMap

### 4. **에러 처리 엔지니어의 관점**
"무언가 잘못되었을 때 어떻게 알릴 것인가?"
→ Error 변형과 에러 전파

### 5. **성능 최적화 엔지니어의 관점**
"어떻게 더 빠르게 할 것인가?"
→ 바이트코드, JIT 컴파일 (미래)

---

## 📚 다음 단계로의 징검다리

```
v14.3 평가기 (현재):
└─ 기본 평가만 가능
└─ 단순 산술, 조건, 루프

v14.4 환경과 변수 (다음):
└─ let, 함수 정의/호출
└─ 스코프와 클로저
└─ 심볼 테이블 완성

v14.5 표준 함수 (미래):
└─ len, push, print 등
└─ 내장 함수 시스템

v14.6 최적화 (멀미):
└─ 바이트코드 컴파일
└─ 상수 폴딩
└─ 데드 코드 제거
```

---

## 🎯 요약: "트리에서 값으로"

```
핵심:
1. AST는 구조만 나타낸다
2. Evaluator가 구조를 해석해서 값으로 변환
3. 재귀적 순회로 깊은 중첩도 처리
4. 환경으로 변수 관리
5. 에러를 값으로 전파 (Go-like)

코드 한 줄로:
eval_expression(BinaryOp)
  → eval_expression(left) → 값1
  → eval_expression(right) → 값2
  → 값1 OP 값2 → 결과값

철학:
"코드는 명령이 아니라 수학식이다.
 평가기는 그 수학식을 계산한다."
```

---

**작성일: 2026-02-23**
**단계: v14.3 평가기와 객체 시스템**
**철학: "트리의 실행"**

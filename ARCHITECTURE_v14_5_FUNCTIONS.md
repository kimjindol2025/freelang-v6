# v14.5: 함수 정의와 호출 메커니즘
## 제13장: 컴파일러 구현 — 독립된 실행 단위

---

## 📚 목차

1. [함수의 철학](#함수의-철학)
2. [Function Literal](#function-literal)
3. [Call Expression](#call-expression)
4. [로컬 환경](#로컬-환경)
5. [매개변수 바인딩](#매개변수-바인딩)
6. [Return 값 처리](#return-값-처리)
7. [Closure](#closure)
8. [실전 설계 패턴](#실전-설계-패턴)

---

## 🎯 함수의 철학

### "로직의 캡슐화"

```
v14.4까지:
  let x = 10;
  x + 5  // → 15
  (같은 로직을 반복하려면 같은 코드를 또 써야 함)

v14.5부터:
  fn add_five(x) { x + 5 }
  add_five(10)  // → 15
  add_five(20)  // → 25
  (로직을 재사용 가능한 단위로 만듦)
```

### 세 가지 책임

```
1. 함수 정의 (Function Definition)
   fn add(x, y) { x + y }
   → 함수 객체 생성, 환경 캡처

2. 함수 호출 (Function Call)
   add(5, 3)
   → 로컬 환경 생성, 매개변수 바인딩

3. 값 반환 (Return Value)
   return 8;
   → 함수 종료, 결과 반환
```

---

## 💡 Function Literal

### 정의: "함수를 값처럼 다루자"

```
함수를 나타내는 GogsObject:

GogsObject::Function {
    parameters: Vec<String>,  // ["x", "y"]
    body: Block,              // { x + y }
    env: Environment,         // 정의 시점의 환경!
}
```

### 왜 Environment를 저장하는가?

```
클로저(Closure)를 구현하기 위해!

예:
let x = 10;
fn make_adder(y) {
    x + y  // x를 찾아야 함!
}

함수 정의 시:
GogsObject::Function {
    parameters: ["y"],
    body: { x + y },
    env: { x: 10, ... }  // ← x를 여기서 캡처!
}
```

### 함수 정의 평가

```rust
Statement::FunctionDef { name, params, body } => {
    let func = GogsObject::Function {
        parameters: params,
        body: body,
        env: current_env.clone(),  // ← 핵심!
    };

    // 함수를 환경에 저장
    env.set(name, func);

    GogsObject::Null  // 함수 정의는 값을 반환하지 않음
}
```

---

## 📞 Call Expression

### 정의: "함수를 실행하자"

```
함수 호출의 AST 표현:

Expression::Call {
    function: Box<Expression>,      // add
    arguments: Vec<Expression>,     // [5, 3]
}
```

### 호출 과정의 5단계

```
1단계: 함수 객체 조회
  eval_expression(function_expr)
  → GogsObject::Function { ... }

2단계: 인자값 평가
  args = [eval(arg1), eval(arg2), ...]

3단계: 로컬 환경 생성
  local_env = function.env.extend()

4단계: 매개변수 바인딩
  local_env.set("x", Integer(5))
  local_env.set("y", Integer(3))

5단계: 함수 본체 평가
  eval_block(function.body, &mut local_env)
  → Integer(8)
```

---

## 🏠 로컬 환경

### 환경 확장의 중요성

```rust
fn extend_function_env(
    func: &GogsObject,
    args: Vec<GogsObject>,
    parent_env: &Environment
) -> Environment {
    // 함수가 정의된 환경을 부모로 사용!
    let mut local = func.env.extend();

    // 매개변수를 로컬에 바인딩
    for (param, arg) in params.zip(args) {
        local.set(param, arg);
    }

    local
}
```

### 환경 계층 구조

```
프로그램 실행:

Global: { add, x: 10 }
  (add 함수 정의됨)
  ↓
add(5, 3) 호출:
  LocalAdd: { x: 5, y: 3, outer: Global }
  (add 함수 정의 시점의 환경을 부모로)
  ↓
함수 내부 { x + y } 평가:
  eval(x) → LocalAdd.x = 5
  eval(y) → LocalAdd.y = 3
  5 + 3 → 8
  ↓
함수 종료:
  LocalAdd 소멸 (메모리 해제)
  Global 유지
```

### 스택 구조

```
함수 호출 깊이:

┌─────────────────┐
│ LocalInner      │ ← inner(7) 호출 중
│ { z: 7, ... }   │
├─────────────────┤
│ LocalOuter      │ ← outer(3) 호출 중
│ { y: 3, ... }   │
├─────────────────┤
│ Global          │ ← 항상 활성
│ { add, x: 10 }  │
└─────────────────┘

함수 반환 순서:
inner(7) 종료 → LocalInner 제거
outer(3) 종료 → LocalOuter 제거
프로그램 종료 → Global 제거
```

---

## 🔗 매개변수 바인딩

### 위치 인자 (Positional Arguments)

```rust
fn add(x, y) { x + y }
add(5, 3)

바인딩:
[params] = ["x", "y"]
[args] = [Integer(5), Integer(3)]

local_env.set("x", Integer(5))
local_env.set("y", Integer(3))
```

### 인자 개수 검증

```rust
if func.parameters.len() != args.len() {
    return GogsObject::Error(
        format!("wrong number of arguments: expected {}, got {}",
                func.parameters.len(),
                args.len())
    );
}
```

### 기본값 처리 (고급)

```
다른 언어와 달리, 우리는 기본값을 지원하지 않음
(v14.5에서는 엄격한 인자 개수 검증)

미래 확장:
fn greet(name, greeting = "Hello") { ... }
```

---

## 🎁 Return 값 처리

### ReturnValue 객체

```rust
GogsObject::ReturnValue(Box<GogsObject>)
```

**왜 필요한가?**
```
깊은 중첩에서 return을 만났을 때:

fn outer() {
    if true {
        while true {
            return 42;
            ↑
            이 return이 모든 레벨을 빠져나가야 함
        }
    }
}

ReturnValue로 감싸서 계속 전파:
↓
while 루프 중단
↓
if 블록 종료
↓
함수 return
```

### 평가 과정

```rust
// 함수 본체 평가
for stmt in function.body {
    let result = eval_statement(stmt, env);

    // ReturnValue를 만나면 즉시 중단
    if matches!(result, GogsObject::ReturnValue(_)) {
        // ReturnValue를 벗겨내고 실제 값 반환
        return unwrap_return_value(result);
    }
}
```

### unwrap_return_value 함수

```rust
fn unwrap_return_value(obj: GogsObject) -> GogsObject {
    match obj {
        GogsObject::ReturnValue(val) => *val,
        _ => obj,
    }
}
```

---

## 🔐 Closure (클로저)

### 정의: "함수가 환경을 기억한다"

```rust
let x = 10;

fn make_adder(y) {
    fn(z) { x + y + z }
}

let add_with_10_and_5 = make_adder(5);
add_with_10_and_5(3)  // 10 + 5 + 3 = 18
```

### 환경 캡처의 마법

```
1. make_adder 호출
   outer_env: { x: 10 }

2. 내부 함수 정의
   GogsObject::Function {
       params: ["z"],
       body: { x + y + z },
       env: make_adder_env  // y: 5가 있는 환경!
           ├─ outer: outer_env (x: 10)
           └─ y: 5
   }

3. add_with_10_and_5(3) 호출
   call_env.extend(function.env)
   // call_env.outer = make_adder_env
   // make_adder_env.outer = outer_env

4. x + y + z 평가
   eval(x) → call_env → outer → ... → 10
   eval(y) → call_env → outer (make_adder_env) → 5
   eval(z) → call_env → 3
   10 + 5 + 3 → 18
```

### 클로저의 세 가지 변형

**1. 값 캡처 (Value Capture)**
```rust
let x = 10;
fn f(y) { x + y }  // x의 값(10)을 캡처
```

**2. 참조 캡처 (Reference Capture)**
```
우리 구현에서는 환경 전체를 캡처
(실제로는 참조)
```

**3. 이동 캡처 (Move Capture)**
```
우리는 자동으로 이동
(clone으로 복사)
```

---

## 🎓 실전 설계 패턴

### 패턴 1: 기본 함수

```
코드:
fn add(x, y) { x + y }
add(5, 3)

단계:
1. FunctionDef { name: "add", params: ["x", "y"], body: {...} }
2. env.set("add", Function{...})
3. Call { function: Ident("add"), args: [5, 3] }
4. func = env.get("add") → Function{...}
5. local_env.set("x", 5), set("y", 3)
6. eval(x + y) → 8
```

### 패턴 2: 재귀 함수

```
코드:
fn fact(n) {
    if n == 0 { 1 } else { n * fact(n - 1) }
}
fact(5)

동작:
fact(5)
  → 5 * fact(4)
    → 4 * fact(3)
      → 3 * fact(2)
        → 2 * fact(1)
          → 1 * fact(0)
            → 1
          ← 1
        ← 2
      ← 6
    ← 24
  ← 120
```

### 패턴 3: 함수를 반환하는 함수

```
코드:
fn make_multiplier(factor) {
    fn(x) { x * factor }
}

let times_two = make_multiplier(2);
times_two(5)  // 10

단계:
1. make_multiplier(2) 호출
   local: { factor: 2 }

2. 내부 함수 반환
   Function { params: ["x"], body: {...}, env: {...factor: 2...} }

3. times_two = returned_function

4. times_two(5) 호출
   call_env extends returned_function.env
   → eval(x * factor) = 5 * 2 = 10
```

### 패턴 4: 고차 함수

```
코드:
fn apply(f, x) {
    f(x)
}

fn double(x) { x * 2 }

apply(double, 5)  // 10

단계:
1. apply(double, 5) 호출
   local: { f: Function{...}, x: 5 }

2. f(x) 평가
   eval(f) → Function{...double...}
   eval(x) → 5

3. 함수 호출: Function{...}(5)
   call_env: { x: 5 }
   eval(x * 2) → 10
```

### 패턴 5: 클로저 팩토리

```
코드:
fn counter() {
    let count = 0;
    fn() { count = count + 1; count }
}

let c = counter();
c()  // 1
c()  // 2
c()  // 3

문제: 우리 구현에서는 count를 수정할 수 없음!
(immutable environment)

해결: v14.6에서 RefCell 도입 필요
```

---

## 🔄 함수 호출의 완전한 흐름

### 예제: `add(5, 3)`

```
1. 함수 조회
   Expression::Call {
       function: Ident("add"),
       arguments: [IntLiteral(5), IntLiteral(3)]
   }
   ↓
   eval_expression(Call { ... })

2. 함수 객체 얻기
   func = env.get("add")
   → GogsObject::Function {
         parameters: ["x", "y"],
         body: { x + y },
         env: global_env
     }

3. 인자값 평가
   args = [
       eval_expression(IntLiteral(5)) → Integer(5),
       eval_expression(IntLiteral(3)) → Integer(3)
   ]

4. 로컬 환경 생성
   let mut local_env = func.env.extend()
   // local_env.outer = global_env

5. 매개변수 바인딩
   local_env.set("x", Integer(5))
   local_env.set("y", Integer(3))

6. 함수 본체 평가
   eval_block({ x + y }, &mut local_env)

7. x + y 계산
   eval_expression(x) → local_env.get("x") → Integer(5)
   eval_expression(y) → local_env.get("y") → Integer(3)
   Integer(5 + 3) = Integer(8)

8. 결과 반환
   Integer(8) 반환
   local_env 소멸

최종 결과: Integer(8)
```

---

## 🎯 설계자의 관점: 5가지 시각

### 1. **언어 설계자의 관점**
"함수를 어떻게 표현할 것인가?"
→ 일급 객체(First-class Function)로 선택

### 2. **메모리 엔지니어의 관점**
"환경을 어떻게 캡처할 것인가?"
→ 함수 정의 시점의 환경을 clone으로 저장

### 3. **스코프 설계자의 관점**
"함수 내부의 변수와 외부 변수를 어떻게 구분할 것인가?"
→ 로컬 환경 생성 + 체인을 따라 탐색

### 4. **제어흐름 엔지니어의 관점**
"깊은 중첩에서 return을 어떻게 처리할 것인가?"
→ ReturnValue 객체로 감싼 후 전파

### 5. **성능 최적화자의 관점**
"함수 호출의 오버헤드를 어떻게 줄일 것인가?"
→ 바이트코드 컴파일, 인라인 최적화 (미래)

---

## 📊 함수와 변수의 관계

```
변수 (Let):
├─ 단순 값 저장
├─ 스코프: 선언된 블록
└─ 생존: 블록이 끝날 때까지

함수 (Function):
├─ 로직 + 환경 저장
├─ 스코프: 정의된 환경
└─ 생존: 함수 객체가 존재하는 동안
```

### 메모리 비교

```
변수:
┌──────────────┐
│ "x" → 10     │ 4 bytes
└──────────────┘

함수:
┌───────────────────────────────┐
│ "add" → Function {            │
│   params: ["x", "y"],         │
│   body: { x + y },            │
│   env: { ... }  ← 복잡!       │
│ }                             │
└───────────────────────────────┘
```

---

## 🚀 다음 단계: v14.6 조건문과 반복문

```
v14.5의 현재:
- 함수 정의 ✓
- 함수 호출 ✓
- 클로저 기초 ✓

v14.6의 목표:
✅ if/else 완성
✅ while 루프 완성
✅ for 루프 (미래)
✅ break/continue (미래)

철학: "프로그램의 흐름 제어"
- 조건에 따라 다른 경로로
- 반복으로 같은 작업 여러 번
- 제어흐름으로 복잡한 로직 표현
```

---

## 🏆 요약: "로직의 캡슐화"

```
v14.5: 함수 정의와 호출 메커니즘

철학: "로직의 캡슐화"

핵심 능력:
✅ Function Literal (함수를 값으로)
✅ Call Expression (함수 호출)
✅ 로컬 환경 생성
✅ 매개변수 바인딩
✅ Return 값 처리
✅ Closure (환경 캡처)
✅ 재귀 함수

함수 완전 마스터리! 📞

"함수는 재사용 가능한 로직의 단위다.
 클로저로 외부 변수를 기억한다."

다음: v14.6 제어 흐름(if, while)으로 프로그램의 흐름을 완성!
```

---

**작성일: 2026-02-23**
**단계: v14.5 함수 정의와 호출 메커니즘**
**철학: "로직의 캡슐화"**

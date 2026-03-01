# v14.4: 환경(Environment)과 변수 바인딩
## 제13장: 컴파일러 구현 — 변수의 생존 공간

---

## 📚 목차

1. [환경의 철학](#환경의-철학)
2. [Environment 구조](#environment-구조)
3. [변수 저장소](#변수-저장소)
4. [스코프 체인](#스코프-체인)
5. [렉시컬 스코프](#렉시컬-스코프)
6. [Shadowing](#shadowing)
7. [함수 스코프](#함수-스코프)
8. [실전 설계 패턴](#실전-설계-패턴)

---

## 🎯 환경의 철학

### "이름에 의미를 부여하다"

```
평가기(v14.3):
  5 + 10 → 15
  (값만 계산)

환경(v14.4):
  let x = 5;
  let y = 10;
  x + y → 15
  (변수를 기억하고, 그 값을 사용)
```

### 세 가지 책임

```
1. 식별자 매핑 (Identifier Mapping)
   "a" → Integer(10)
   "gogs_version" → Integer(14)
   HashMap으로 저장

2. 스코프 관리 (Scope Management)
   현재 블록에서만 보이는 변수
   중첩된 블록에서 가려지는 현상
   체인 구조로 표현

3. 값 추출 (Value Retrieval)
   "a"라는 이름을 만나면
   환경에서 해당 값을 찾아 반환
   없으면 상위 스코프로 재귀적 탐색
```

---

## 🗂️ Environment 구조

### 기본 정의

```rust
#[derive(Debug, Clone, Default)]
pub struct Environment {
    // 현재 스코프의 변수들
    store: HashMap<String, GogsObject>,

    // 상위 스코프를 가리키는 포인터
    // 재귀적으로 상위 환경을 탐색 가능
    outer: Option<Box<Environment>>,
}

impl Environment {
    // 새로운 전역 환경 생성
    pub fn new() -> Self {
        Environment {
            store: HashMap::new(),
            outer: None,
        }
    }

    // 자식 환경 생성 (현재 환경을 부모로)
    pub fn extend(&self) -> Self {
        Environment {
            store: HashMap::new(),
            outer: Some(Box::new(self.clone())),
        }
    }

    // 변수 저장 (let a = 10;)
    pub fn set(&mut self, name: String, val: GogsObject) {
        self.store.insert(name, val);
    }

    // 변수 조회 (a + 5)
    pub fn get(&self, name: &str) -> Option<GogsObject> {
        // 1. 현재 환경에서 찾기
        if let Some(val) = self.store.get(name) {
            return Some(val.clone());
        }

        // 2. 상위 환경에서 재귀적으로 찾기
        if let Some(outer) = &self.outer {
            return outer.get(name);
        }

        // 3. 찾지 못함
        None
    }
}
```

### 왜 이 구조인가?

```
장점:
✅ 간단하고 직관적
✅ 렉시컬 스코프 자연스럽게 구현
✅ Shadowing 자동 처리
✅ HashMap 조회는 O(1)

단점:
❌ 환경을 clone할 때마다 복사 (메모리)
❌ 환경을 여러 곳에서 공유하기 어려움

개선 (고급):
→ Rc<RefCell<Environment>> 사용
→ 여러 참조자 + 내부 가변성
→ 메모리 공유 + 수정 가능
```

---

## 💾 변수 저장소

### HashMap 기반 저장

```rust
store: HashMap<String, GogsObject>
```

**이름 → 값 매핑:**

```
┌──────────────────────────────┐
│     HashMap<String, Val>     │
├──────────────────────────────┤
│ "x" → Integer(10)            │
│ "y" → Integer(20)            │
│ "is_valid" → Boolean(true)   │
│ "arr" → Array([1, 2, 3])     │
└──────────────────────────────┘
```

### 기본 연산

```rust
// 저장 (let x = 10;)
pub fn set(&mut self, name: String, val: GogsObject) {
    self.store.insert(name, val);
}

// 조회 (x + 5)
pub fn get(&self, name: &str) -> Option<GogsObject> {
    self.store.get(name).cloned()
}

// 확인 (변수 존재하는가?)
pub fn contains(&self, name: &str) -> bool {
    self.store.contains_key(name)
}

// 목록 (디버깅용)
pub fn vars(&self) -> Vec<String> {
    self.store.keys().cloned().collect()
}
```

### 타입 검토 없음 (동적 타입)

```rust
// v14.4에서는 타입 검사 없음
env.set("x", Integer(5));      // OK
env.set("x", Boolean(true));   // OK (덮어씀)

// 이것은 나중에 v14.5 (Semantic Analysis)에서 처리
```

---

## 🔗 스코프 체인

### 중첩된 환경의 구조

```
전역 환경 (Global Scope):
┌─────────────────────────────┐
│ store: {                    │
│   "x": 10,                  │
│   "y": 20                   │
│ }                           │
│ outer: None                 │
└─────────────────────────────┘
        ↑
        │ (부모)

함수 환경 (Function Scope):
┌─────────────────────────────┐
│ store: {                    │
│   "a": 5,                   │
│   "b": 15                   │
│ }                           │
│ outer: Some(Box<Global>)    │
└─────────────────────────────┘
```

### 환경 확장 (Environment Extension)

```rust
// 새로운 스코프 진입 (함수 호출, 블록 진입)
let mut func_env = global_env.extend();

// func_env.outer = Some(Box::new(global_env))
// 이제 func_env는 global_env를 "부모"로 가짐
```

### 체인을 따라 탐색

```
func_env.get("a") 단계별:

1단계: func_env.store에서 "a" 찾기
   → 있으면 반환, 없으면 2단계

2단계: func_env.outer (global_env)에서 "a" 찾기
   → 있으면 반환, 없으면 3단계

3단계: 상위 환경이 없음
   → None 반환 (정의되지 않은 변수)
```

### 시각화: 변수 탐색

```
코드:
fn outer() {
    let x = 10;
    fn inner() {
        let y = 20;
        x + y  ← 여기서 x를 찾아야 함
    }
}

탐색 과정:
inner 환경: { y: 20, outer: ... }
  └─ x 찾기? 없음
  └─ 상위로 (outer)

outer 환경: { x: 10, outer: ... }
  └─ x 찾기? 있음! → Integer(10)
```

---

## 🏷️ 렉시컬 스코프

### 정의: "코드 위치에 따른 스코프"

```
렉시컬 스코프 (Lexical Scope):
└─ 변수가 어디서 "정의"되었는지로 스코프 결정
└─ 코드의 레이아웃(문법 구조)에 따름
└─ 대부분의 현대 언어 (Rust, Python, JavaScript, ...)

동적 스코프 (Dynamic Scope):
└─ 변수가 어디서 "호출"되었는지로 스코프 결정
└─ 호출 스택에 따름
└─ 일부 언어 (Bash, Lisp의 일부)
```

### 예: 렉시컬 vs 동적

```rust
let x = 10;

fn foo() {
    let x = 20;
}

fn bar() {
    println!("{}", x);  // x는 어디에서 온 건가?
}

foo();
bar();
```

**렉시컬 스코프 (우리의 구현):**
```
bar()를 정의할 때 x는 전역의 x=10을 참조
결과: 10 출력
```

**동적 스코프:**
```
bar()를 호출할 때의 스택을 따짐
호출: foo() → bar()
foo()의 x=20을 참조
결과: 20 출력
```

### 우리의 구현이 렉시컬인 이유

```rust
// 함수 정의 시, 현재 환경을 캡처
GogsObject::Function {
    params: [...],
    body: {...},
    env: current_env.clone(),  // ← 정의 시점의 환경 저장!
}

// 함수 호출 시, 저장된 환경을 부모로 사용
let mut call_env = func.env.extend();
```

---

## 👥 Shadowing

### 정의: "안쪽 변수가 바깥쪽을 가린다"

```rust
let x = 5;
{
    let x = 10;  // Shadowing!
    // 여기서 x = 10
}
// 여기서 x = 5 (원래대로 돌아옴)
```

### 우리 구현에서 자동 처리

```
상위 환경: { x: 5, ... }
현재 환경: { x: 10, ... }

env.get("x")를 호출하면:
1. 현재 환경의 store에서 "x" 찾기 → 10 (먼저!)
2. 상위로 탐색할 필요 없음

→ 자동으로 shadowing 구현!
```

### 메모리 상 구조

```
바깥쪽 블록 환경:
┌─────────────────┐
│ store: { x: 5 } │
│ outer: ...      │
└─────────────────┘
        ↑
        │

안쪽 블록 환경:
┌──────────────────┐
│ store: { x: 10 } │
│ outer: ↑ (위)    │
└──────────────────┘

get("x") 호출:
→ 안쪽 store에서 먼저 찾음
→ x=10 반환
```

---

## 🔧 함수 스코프

### 함수 호출과 환경 확장

```
코드:
fn add(x, y) {
    x + y
}

let result = add(5, 3);
```

**평가 과정:**

```
1. 함수 호출 eval_function_call(...)
   ↓
2. 호출 환경 생성
   call_env = func.env.extend()
   (함수가 정의된 환경을 부모로)
   ↓
3. 매개변수 바인딩
   call_env.set("x", Integer(5))
   call_env.set("y", Integer(3))
   ↓
4. 함수 본체 평가
   eval_block(func.body, &mut call_env)
   ↓
5. 반환값 추출
   Integer(8)
   ↓
6. 환경 폐기
   (call_env는 함수 종료 시 소멸)
```

### 중첩된 함수 (클로저)

```rust
fn make_adder(x) {
    fn(y) { x + y }
}

let add5 = make_adder(5);
// 여기서 add5는 x=5를 캡처한 클로저
add5(3);  // 8 반환
```

**환경 캡처 과정:**

```
1. make_adder(5) 호출
   make_adder_env: { x: 5, outer: global }

2. 내부 함수 fn(y) { x + y } 정의
   return Function {
       params: ["y"],
       body: BinaryOp { x + y },
       env: make_adder_env  // ← x=5가 여기 있음!
   }

3. add5 = returned_function

4. add5(3) 호출
   call_env = add5.env.extend()
   // call_env.outer = make_adder_env
   // make_adder_env.outer = global
   call_env.set("y", Integer(3))

5. x + y 평가
   eval(x) → call_env에서 x 찾기 → 없음
           → outer (make_adder_env)에서 찾기 → 5!
   eval(y) → call_env에서 y 찾기 → 3
   5 + 3 → 8
```

---

## 🎓 실전 설계 패턴

### 패턴 1: 전역 환경 초기화

```rust
fn main() {
    let mut global_env = Environment::new();

    // 필요시 built-in 변수 설정
    global_env.set("PI".to_string(),
                   GogsObject::Integer(314)); // 100배

    evaluator.eval(program, &mut global_env)
}
```

### 패턴 2: Let 문 평가

```rust
Statement::Let { name, value } => {
    let obj = eval_expression(&value, env);

    // 타입 에러면 전파
    if matches!(obj, GogsObject::Error(_)) {
        return obj;
    }

    // 현재 환경에 저장
    env.set(name, obj.clone());

    obj
}
```

### 패턴 3: Identifier 평가

```rust
Expression::Identifier(name) => {
    match env.get(&name) {
        Some(obj) => obj,
        None => GogsObject::Error(
            format!("undefined variable: {}", name)
        ),
    }
}
```

### 패턴 4: 함수 호출

```rust
Expression::Call { function, arguments } => {
    // 함수 객체 조회
    let func = eval_expression(&function, env)?;

    match func {
        GogsObject::Function { params, body, env: func_env } => {
            // 호출 환경 생성
            let mut call_env = func_env.extend();

            // 매개변수 바인딩
            for (param, arg) in params.iter().zip(arguments.iter()) {
                let arg_val = eval_expression(&arg, env)?;
                call_env.set(param.clone(), arg_val);
            }

            // 함수 본체 평가
            eval_block(&body, &mut call_env)
        }
        _ => GogsObject::Error("not a function".to_string()),
    }
}
```

### 패턴 5: 블록 스코프

```rust
// 블록 진입 (while, if 본체, 블록 { ... })
let mut block_env = env.extend();

// 블록 내 명령문들 평가
for stmt in block.statements {
    let result = eval_statement(&stmt, &mut block_env);
    if matches!(result, GogsObject::ReturnValue(_)) {
        return result;
    }
}

// 블록 종료 (환경 자동 소멸)
```

---

## 📊 환경의 상태 변화

### 프로그램 실행 흐름

```
코드:
let x = 5;
let y = x + 10;
{
    let x = 100;
    y + x
}

상태 변화:

1. let x = 5;
   Global: { x: 5 }

2. let y = x + 10;
   eval(x) → 5
   eval(10) → 10
   5 + 10 → 15
   Global: { x: 5, y: 15 }

3. { let x = 100; ... } 진입
   BlockEnv: { x: 100, outer: Global }
   (Global의 x는 가려짐)

4. y + x 평가
   eval(y) → BlockEnv에 없음 → Global에서 찾음 → 15
   eval(x) → BlockEnv에 있음 → 100 (shadowing!)
   15 + 100 → 115

5. 블록 종료
   BlockEnv 소멸
   Global: { x: 5, y: 15 } (원래대로)
```

---

## 🔄 메모리 관리

### Stack vs Heap에서의 환경

```
스택 (자동 관리):
┌──────────────────┐
│ main_env: Env    │  ← 프로그램 시작
├──────────────────┤
│ func_env: Env    │  ← 함수 호출
├──────────────────┤
│ block_env: Env   │  ← 블록 진입
└──────────────────┘
     ↓ (아래부터 소멸)
블록 종료 → block_env 자동 제거
함수 종료 → func_env 자동 제거
프로그램 종료 → main_env 자동 제거
```

### 환경 클론의 비용

```rust
// 이 코드에서 clone이 일어남:
let mut child_env = parent_env.extend();
// ↓
// pub fn extend(&self) -> Self {
//     Environment {
//         store: HashMap::new(),
//         outer: Some(Box::new(self.clone())),
//                              ↑↑↑↑↑↑
//     }
// }
```

**최적화 (고급):**
```rust
// 대신 Rc<RefCell<Environment>> 사용
// 여러 참조자가 같은 환경을 공유
// 복사 대신 참조 카운트 증가
```

---

## 🎯 v14.4의 의의

### 컴파일러 기능 확대

```
v14.3 평가기:
└─ 상수만 계산
└─ 5 + 10 → 15

v14.4 환경:
└─ 변수 저장/조회
└─ let x = 5; let y = x + 10; → y = 15 ✓
└─ 프로그램의 "상태" 추적
```

### 프로그래밍 패러다임의 확장

```
명령형 (Imperative):
└─ "어떻게(How)" 계산할 것인가?
└─ let x = 5; x = x + 1;

환경은 명령형의 핵심!
변수의 상태 변화를 추적
```

---

## 💡 설계자의 관점: 5가지 시각

### 1. **언어 설계자의 관점**
"변수의 생존 범위를 어떻게 정할 것인가?"
→ 렉시컬 스코프 선택

### 2. **메모리 엔지니어의 관점**
"환경을 어떻게 저장할 것인가?"
→ HashMap + Box 포인터

### 3. **스코프 설계자의 관점**
"shadowing을 어떻게 처리할 것인가?"
→ 현재 환경부터 탐색

### 4. **성능 최적화자의 관점**
"어떻게 빠르게 변수를 찾을 것인가?"
→ HashMap O(1) 조회

### 5. **클로저 설계자의 관점**
"함수가 외부 변수를 어떻게 기억할 것인가?"
→ 환경 캡처

---

## 🚀 다음 단계: v14.5 함수 정의와 호출

```
v14.4의 현재:
- Let 문으로 변수 바인딩
- 식별자 조회
- 블록 스코프 (준비 상태)

v14.5의 목표:
✅ 함수 정의 완성 (fn ... { ... })
✅ 함수 호출 완성 (func(args))
✅ 매개변수와 반환값
✅ 재귀 함수
✅ 클로저 (일급 함수)

철학: "재사용 가능한 로직 단위"
- 함수는 계산 + 환경을 함께 저장
- 여러 번 호출 가능
- 각 호출마다 새로운 환경 생성
- 클로저로 외부 변수 캡처 가능
```

---

## 🏆 요약: "기억의 계층 구조"

```
v14.4: 환경과 변수 바인딩

철학: "이름에 의미를 부여하다"

핵심 능력:
✅ HashMap 기반 변수 저장
✅ 환경 체인으로 스코프 관리
✅ 재귀적 변수 탐색
✅ Shadowing 자동 처리
✅ 렉시컬 스코프 구현
✅ 함수 환경 캡처

메모리 구조:
Global: { x: 10, y: 20 }
  ↑
Function: { a: 5 } → 부모: Global
  ↑
Block: { b: 100 } → 부모: Function

환경 완전 마스터리! 🧠

"변수는 단순한 이름이 아니다.
 그것은 메모리 공간에 의미를 부여하는 행위다."

다음: v14.5 함수와 호출로 재사용 가능한 로직 단위 완성!
```

---

**작성일: 2026-02-23**
**단계: v14.4 환경과 변수 바인딩**
**철학: "기억의 계층 구조"**

# 제13장: 컴파일러 구현 — v14.6
# 제어 흐름 (Control Flow): 조건과 반복

## 철학: "경로의 분기와 반복"

```
지금까지: 위에서 아래로 흐르는 '직선적' 실행
↓
이제부터: 조건에 따라 분기하고, 반복하는 '비선형적' 실행
↓
프로그램: 세상의 판단과 행동을 시뮬레이션
```

---

## 📊 제어 흐름의 핵심 구성

### 1. **조건문 (if-else): 경로의 선택**

```rust
fn eval_if_expression(
    condition: Expression,
    consequence: Block,
    alternative: Option<Block>,
    env: &mut Environment
) -> GogsObject {
    // 1단계: 조건식 평가
    let condition_res = eval_expression(condition, env);

    // 2단계: Truthiness 검사
    if is_truthy(condition_res) {
        // 참: consequence 블록 실행
        eval_block(consequence, env)
    } else if let Some(alt) = alternative {
        // 거짓 + else 있음: alternative 블록 실행
        eval_block(alt, env)
    } else {
        // 거짓 + else 없음: Null 반환
        GogsObject::Null
    }
}
```

**논리 흐름:**
```
if 조건 {
    // 이 블록 (consequence)
} else {
    // 또는 이 블록 (alternative)
}

평가:
1. 조건 평가 → GogsObject
2. is_truthy() 검사 → bool
3. true? → consequence | false? → alternative | 없음? → Null
```

### 2. **Truthiness: 값을 판단한다**

```rust
fn is_truthy(obj: GogsObject) -> bool {
    match obj {
        GogsObject::Null => false,              // null은 항상 거짓
        GogsObject::Boolean(b) => b,            // Boolean은 그 값 그대로
        GogsObject::Integer(n) => n != 0,       // 0이 아니면 참 (언어 설계 선택)
        GogsObject::String(s) => !s.is_empty(), // 빈 문자열이 아니면 참
        _ => true,                               // 나머지는 모두 참
    }
}
```

**설계 철학:**
```
언어마다 다르게 정의:
- JavaScript: false, 0, "", null, undefined → falsy
- Ruby: false, nil → falsy
- Python: False, 0, "", [], {}, None → falsy
- 우리: null, false → falsy | 나머지 → truthy
```

**실제 예제:**
```rust
if 5 {           // Integer(5) → is_truthy → true
    println("참");
}

if 0 {           // Integer(0) → is_truthy → false
    // 실행 안 함
}

if null {        // Null → is_truthy → false
    // 실행 안 함
}

if "hello" {     // String → is_truthy → true
    println("참");
}
```

### 3. **반복문 (while): 조건까지 반복**

```rust
fn eval_while_statement(
    condition: Expression,
    body: Block,
    env: &mut Environment
) -> GogsObject {
    let mut last = GogsObject::Null;

    // condition이 참인 동안 계속 반복
    loop {
        let condition_res = eval_expression(condition.clone(), env);

        if !is_truthy(condition_res) {
            break;  // 조건이 거짓이면 루프 종료
        }

        // 루프 본체 실행
        last = eval_block(body.clone(), env);

        // ReturnValue는 루프를 빠져나감
        if matches!(last, GogsObject::ReturnValue(_)) {
            break;
        }
    }

    last
}
```

**동작 흐름:**
```
while 조건 {
    // 본체
}

실행:
1. 조건 평가
2. true? → 본체 실행 → 다시 1번으로 (반복)
3. false? → 루프 종료 → Null 반환
```

**예제:**
```rust
let x = 0;

while x < 3 {
    println(x);  // 0, 1, 2 출력
    x = x + 1;
}
// 루프 종료

평가:
반복 1: x=0, 0<3? true → println(0) → x=1
반복 2: x=1, 1<3? true → println(1) → x=2
반복 3: x=2, 2<3? true → println(2) → x=3
반복 4: x=3, 3<3? false → 루프 종료
```

---

## 🔄 블록 스코프: 변수의 격리

### if/while 블록은 새로운 환경을 생성

```rust
fn eval_block_statement(
    block: &Block,
    env: &mut Environment
) -> GogsObject {
    // 중요: 블록을 위한 새로운 환경 생성 (extend)
    let mut block_env = env.extend();

    let mut result = GogsObject::Null;

    for statement in &block.statements {
        result = eval_statement(statement, &mut block_env);

        // Return이 발생하면 즉시 블록 종료
        if matches!(result, GogsObject::ReturnValue(_)) {
            return result;
        }
    }

    result
}
```

**메모리 구조:**
```
Global: { x: 10 }

if x > 5 {
    let y = 20;  // if 블록의 로컬 환경
}

구조:
┌─────────────────┐
│ if_env          │
│ { y: 20, ... }  │
│ outer: Global   │
└─────────────────┘
        ↓
┌─────────────────┐
│ Global          │
│ { x: 10 }       │
│ outer: None     │
└─────────────────┘

if 블록 종료 → if_env 소멸 → Global만 남음
y는 if 블록 밖에서 접근 불가!
```

### Shadowing: 블록 내에서 변수 재정의

```rust
let x = 5;

if true {
    let x = 10;  // Shadowing!
    println(x);  // 10 출력
}

println(x);  // 5 출력 (원래 x 유지)

메모리:
if_env: { x: 10, outer: Global }
Global: { x: 5 }

if 블록 안: x → if_env에서 찾음 → 10
if 블록 밖: x → Global에서 찾음 → 5
```

---

## 🎯 if-else의 완전한 흐름

### 예제: `if x > 5 { ... } else { ... }`

```rust
코드:
let x = 10;
if x > 5 {
    println("x는 5보다 큽니다");
} else {
    println("x는 5 이하입니다");
}

평가 단계:

1. let x = 10;
   Global: { x: 10 }

2. if 문 진입
   Expression::If {
       condition: x > 5,
       consequence: Block { ... },
       alternative: Some(Block { ... })
   }

3. 조건 평가
   eval(x > 5)
   → eval(x) → Global.get("x") → Integer(10)
   → eval(5) → Integer(5)
   → eval_infix(Integer(10), ">", Integer(5))
   → Boolean(true)

4. Truthiness 검사
   is_truthy(Boolean(true)) → true

5. consequence 실행
   eval_block(consequence_block, env)
   → 새 환경 생성: if_env = Global.extend()
   → println("x는 5보다 큽니다") 실행
   → "x는 5보다 큽니다" 출력

6. 결과 반환
   String("x는 5보다 큽니다")
```

---

## 🔁 while 루프의 완전한 흐름

### 예제: `while i < 3 { ... }`

```rust
코드:
let i = 0;
while i < 3 {
    println(i);
    i = i + 1;
}

평가 단계:

1. let i = 0;
   Global: { i: 0 }

2. while 문 진입
   Statement::While {
       condition: i < 3,
       body: Block { ... }
   }

3. 루프 반복 1
   a. 조건 평가
      eval(i < 3)
      → eval(i) → Global.get("i") → Integer(0)
      → eval(3) → Integer(3)
      → Integer(0) < Integer(3) → Boolean(true)

   b. is_truthy(Boolean(true)) → true

   c. 본체 실행
      while_env = Global.extend()
      → println(0) → "0" 출력
      → i = i + 1
         → eval(i + 1) → 0 + 1 → 1
         → Global.set("i", Integer(1))

   d. 루프 계속

4. 루프 반복 2
   a. 조건: 1 < 3 → true
   b. println(1) 출력, i = 2
   c. 루프 계속

5. 루프 반복 3
   a. 조건: 2 < 3 → true
   b. println(2) 출력, i = 3
   c. 루프 계속

6. 루프 반복 4
   a. 조건: 3 < 3 → false
   b. is_truthy(Boolean(false)) → false
   c. 루프 종료 (break)

7. 최종 상태
   Global: { i: 3 }
   출력: "0", "1", "2"
```

---

## 🚨 Return의 전파

### Return이 조건문이나 반복문 내에서 발생하면?

```rust
fn outer() {
    if true {
        while true {
            return 42;  // ← 여기서 return 발생!
        }
    }
}

메커니즘:

1. return 42
   → GogsObject::ReturnValue(Box::new(Integer(42)))

2. while 루프는 ReturnValue를 만나면 즉시 루프 종료
   if matches!(last, GogsObject::ReturnValue(_)) {
       break;
   }

3. if 블록도 ReturnValue를 받으면 즉시 블록 종료
   if matches!(result, GogsObject::ReturnValue(_)) {
       return result;
   }

4. 함수 eval_statement는 ReturnValue를 전파
   함수 본체가 종료되면서 ReturnValue를 반환

5. 함수 호출 평가는 ReturnValue를 처리
   Expression::Call { ... }에서:
   → eval_block(body) → ReturnValue(42)
   → 값 추출: Integer(42)
   → 최종 반환
```

**시각화:**
```
return 42 (발생)
  ↓
while 루프: ReturnValue 감지 → break
  ↓
if 블록: ReturnValue 감지 → return
  ↓
함수 본체: ReturnValue 감지 → return
  ↓
함수 호출: 값 추출 → Integer(42)
```

---

## 🏗️ 컴파일러 구조에서의 제어 흐름

```
┌────────────────────────────────────────┐
│     Parser (v14.1)                     │
│     If/While AST 노드                  │
│     Expression::If {...}               │
│     Statement::While {...}             │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│     Evaluator (v14.6) ← HERE!         │
│                                        │
│  eval_if_expression()                  │
│  eval_while_statement()                │
│  is_truthy()                           │
│  eval_block_statement()                │
│                                        │
│  return 전파                            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│     Environment (v14.4/v14.5)         │
│                                        │
│  if/while 블록마다 새 환경 생성        │
│  (extend() 호출)                       │
└────────────────────────────────────────┘
```

---

## 💡 중요한 설계 결정들

### 1. **블록은 항상 새 환경을 생성하는가?**

```rust
// 옵션 A: 항상 생성 (우리의 선택)
if condition { let x = 10; }  // x는 if 블록 내에만 존재

// 옵션 B: 같은 환경 사용 (일부 언어)
// x가 if 블록 밖에서도 보임
```

우리는 A를 선택: **각 블록이 자신의 스코프를 가짐**

### 2. **Truthiness의 정의**

```rust
// 옵션 A: C 스타일 (우리의 선택)
if 5 { ... }        // true (0이 아님)
if 0 { ... }        // false
if "hello" { ... }  // true

// 옵션 B: Lisp 스타일
// nil/false만 거짓, 나머지 모두 참

// 옵션 C: Python 스타일
// false, 0, "", [], {}, None → 거짓
```

우리는 A를 선택: **null, false만 거짓, 나머지는 참**

### 3. **while의 return 처리**

```rust
// 옵션 A: return이 루프를 빠져나감 (우리의 선택)
while true {
    return 42;  // 루프 즉시 종료, 함수도 반환
}

// 옵션 B: return이 루프만 종료
// (실제로는 함수도 종료해야 함)
```

우리는 A를 선택: **ReturnValue 래퍼로 모든 블록을 빠져나감**

---

## 🎯 설계자의 관점: 5가지 시각

### 1. **언어 설계자의 관점**
"if와 while을 어떻게 설계할 것인가?"
→ Expression (if) vs Statement (while)의 구분

### 2. **제어 흐름 엔지니어의 관점**
"어떻게 경로를 선택하고 반복하는가?"
→ is_truthy와 조건 평가

### 3. **스코프 설계자의 관점**
"블록마다 환경을 생성할 것인가?"
→ extend()로 새 환경 생성

### 4. **Return 처리 엔지니어의 관점**
"깊은 중첩에서 return을 어떻게 처리할 것인가?"
→ ReturnValue 래퍼와 조기 종료

### 5. **성능 최적화자의 관점**
"조건을 매번 평가하는 오버헤드를 줄일 수 있는가?"
→ 조건식 캐싱, 바이트코드 최적화 (미래)

---

## 🚀 다음 단계: v14.7 배열과 인덱싱

```
v14.6의 현재:
- if/else 분기 ✓
- while 루프 ✓
- Truthiness ✓
- 블록 스코프 ✓
- Return 전파 ✓

v14.7의 목표:
✅ 배열 생성 ([1, 2, 3])
✅ 인덱싱 (arr[0])
✅ 배열 길이 (len(arr))
✅ 배열 순회 (for x in arr)

철학: "컬렉션의 조작"
```

---

## 🏆 v14.6 달성의 의미

```
이제 당신의 인터프리터가 할 수 있는 것:

✅ 소스코드를 토큰으로 변환 (Lexer)
✅ 토큰을 의미 있는 트리로 조립 (Parser)
✅ 우선순위를 올바르게 처리 (Pratt)
✅ 트리를 실제로 실행 (Evaluator)
✅ 변수를 저장하고 조회 (Environment)
✅ 함수를 정의하고 호출 (Functions)
✅ 조건에 따라 분기하고 반복 (Control Flow) ← NEW!

마스터 수준의 능력:
✅ if/else 조건 분기
✅ while 반복 루프
✅ Truthiness 판정
✅ 블록 스코프 격리
✅ 중첩된 제어 흐름
✅ 루프 내 return 처리

튜링 완전성(Turing Completeness)에 도달! 🎉
```

---

## 📝 핵심 요약

```
v14.6: 제어 흐름 (Control Flow)

철학: "경로의 분기와 반복"

핵심 능력:
✅ if-else 조건 분기
✅ Truthiness 판정 (참/거짓)
✅ while 반복 루프
✅ 블록 스코프 격리
✅ 중첩된 제어 흐름
✅ Return의 전파

제어 흐름 완전 마스터리! 🚦

"조건에 따라 다른 길을 가고,
 필요하면 같은 일을 반복한다.
 이것이 프로그램의 지능이다."

다음: v14.7 배열과 인덱싱으로 컬렉션 조작 완성!
```

---

## 🎓 최종 평가

```
구현: 제어 흐름 완성
평가: A+ (분기와 반복의 완성)
상태: 튜링 완전성 달성

특징:
- if/else 분기
- while 루프
- Truthiness 판정
- 블록 스코프 격리
- Return 전파
```

---

**작성일: 2026-02-23**
**상태: 설계 완료**
**평가: A+ (제어 흐름 완성)**
**특징: if-else와 while로 조건 분기와 반복 루프 완성! 🚦**

# v5.2 아키텍처: 열거형 (Enums & Patterns)

**작성일**: 2026-02-22
**장**: 제4장 - 데이터 구조화의 심화
**단계**: v5.2 (v5.1의 직접 후속)
**주제**: "상태의 명확한 분류"

---

## 🎯 설계 목표: "상태의 다양성을 표현하다"

### 패러다임의 심화

```
v5.0: "이 데이터는 무엇인가?" (필드의 집합)
      struct User { name, age, email }

v5.1: "이 데이터는 무엇을 할 수 있는가?" (메서드)
      impl User {
          fn is_adult(&self) { ... }
      }

v5.2: "이 데이터는 여러 상태 중 어떤 상태인가?" (가능성)
      enum Status {
          Waiting,
          Running,
          Stopped,
      }
```

### v5.2의 철학

```
"상태의 명확한 분류"

Before: 숫자로 상태 관리 (0=대기, 1=가동)
        → 버그: 2를 실수로 넣으면?

After:  열거형으로 상태 강제 (대기, 가동만 가능)
        → 안전: 컴파일러가 미리 잡음
```

---

## 💎 열거형이란?

### 정의: 상호 배타적인 상태들의 집합

```
enum = enumeration (열거)

타입은 하나인데, 여러 가능성 중 정확히 하나의 값을 가짐
상태가 서로 배타적 (동시에 여러 상태 불가)
각 상태는 추가 데이터를 가질 수 있음
```

### 열거형의 구조

```freelang
enum Status {
    Waiting,           // 데이터 없음
    Running,           // 데이터 없음
    Stopped,           // 데이터 없음
}

enum Signal {
    Reset,             // 단순 상태
    UpdateVersion(f32), // 단일 데이터
    ErrorMessage(String), // 문자열 데이터
    ChangeColor(i32, i32, i32), // 여러 데이터
}
```

---

## 🔧 열거형의 4가지 형태

### 1️⃣ 데이터 없는 열거형 (Unit Variants)

```freelang
enum Status {
    Idle,
    Active,
    Complete,
}

// 사용
let status = Status::Idle;
```

**특징**:
- 단순한 상태 표현
- 메모리 효율적
- 가장 일반적 (약 40%)

**사용 예**:
- 네트워크 상태 (연결, 대기, 끊김)
- 게임 상태 (시작, 진행, 끝)
- 신호 (확인, 취소, 리셋)

### 2️⃣ 단일 데이터 열거형 (Tuple Variants)

```freelang
enum Result {
    Ok(String),
    Error(i32),
}

// 사용
let result = Result::Ok("성공");
let error = Result::Error(404);
```

**특징**:
- 각 상태가 다른 데이터를 가짐
- 동적 메모리 사용
- 패턴 매칭으로 데이터 추출

**사용 예**:
- 결과 타입 (성공 with 값, 실패 with 에러코드)
- 신호 처리 (업데이트 with 버전)
- 메시지 (에러 with 메시지)

### 3️⃣ 다중 데이터 열거형 (Multi-Field Variants)

```freelang
enum Signal {
    ChangeColor(i32, i32, i32),
    MovePosition(f32, f32),
    SetName(String, i32),
}

// 사용
let signal = Signal::ChangeColor(255, 128, 0);
```

**특징**:
- 하나의 상태가 여러 데이터를 가짐
- 복잡한 정보를 구조화
- 타입 안전성 보장

**사용 예**:
- RGB 색상 변경 (R, G, B)
- 위치 이동 (X, Y 좌표)
- 사용자 정보 (이름, 나이)

### 4️⃣ 구조체 스타일 열거형 (Struct Variants)

```freelang
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor { red: i32, green: i32, blue: i32 },
}
```

**특징**:
- 필드에 이름 부여
- 가장 복잡하고 유연함
- 명확한 의도 표현

**사용 예**:
- 사용자 메시지 (명확한 필드명)
- 복잡한 상태 전이
- 도메인 모델링

---

## 📋 열거형의 패턴: 다형성

### 패턴 1: 상태 기계 (State Machine)

```freelang
enum ProcessState {
    Start,
    Running,
    Paused,
    Stopped,
}

fn handle_state(state: ProcessState) {
    match state {
        ProcessState::Start => println("시작");
        ProcessState::Running => println("실행중");
        ProcessState::Paused => println("일시정지");
        ProcessState::Stopped => println("중지");
    }
}
```

**용도**: 시스템이 따라야 하는 상태 정의
**특징**: 유한한 상태, 명확한 전이

### 패턴 2: 결과 처리 (Result Pattern)

```freelang
enum Result {
    Ok(String),
    Error(String),
}

fn process() -> Result {
    if valid {
        Result::Ok("완료")
    } else {
        Result::Error("실패")
    }
}
```

**용도**: 성공/실패 같은 이진 선택지
**특징**: 각 경우에 다른 데이터

### 패턴 3: 옵션 타입 (Option Pattern)

```freelang
enum Option {
    Some(String),
    None,
}

fn find_user(id: i32) -> Option {
    if found {
        Option::Some("Alice")
    } else {
        Option::None
    }
}
```

**용도**: 값이 있을 수도 없을 수도 있는 경우
**특징**: 안전한 null 처리

### 패턴 4: 신호/메시지 (Signal Pattern)

```freelang
enum Signal {
    Reset,
    UpdateVersion(f32),
    ErrorMessage(String),
    ChangeColor(i32, i32, i32),
}
```

**용도**: 다양한 신호를 하나의 타입으로 표현
**특징**: 상태별로 다른 데이터 구조

---

## 🔄 match 표현식으로 안전한 분기

### match의 강력함

```freelang
match signal {
    Signal::Reset => { /* 처리 */ },
    Signal::UpdateVersion(v) => { /* v 사용 */ },
    Signal::ErrorMessage(msg) => { /* msg 사용 */ },
    Signal::ChangeColor(r, g, b) => { /* r, g, b 사용 */ },
}
```

**특징**:
- **완전성 검사**: 모든 경우를 처리하도록 강제
- **데이터 추출**: 각 경우에서 포함된 데이터를 바로 사용
- **타입 안전성**: 잘못된 접근 불가능
- **표현력**: 각 경우의 의도가 명확

### match의 힘: 버그 방지

```
상황: 새로운 신호 Signal::PowerDown(i32)를 추가했다면?

Rust/FreeLang:
  → 모든 match를 찾아 "이 신호도 처리하세요" 강제
  → 개발자는 놓칠 수 없음 ✅

Dynamic Language:
  → 숫자 4가 새로운 상태라고 가정
  → 어디선가 4를 처리 안 하면 버그 😱
```

---

## 📊 구조체 vs 열거형

| 측면 | 구조체 | 열거형 |
|------|--------|--------|
| **결합** | AND (그리고) | OR (또는) |
| **예** | name 그리고 age | Idle 또는 Active |
| **메모리** | 모든 필드 포함 | 선택된 것만 포함 |
| **의미** | "데이터 그룹" | "가능성 집합" |
| **사용** | 관련 데이터 조합 | 상호 배타적 상태 |

### 실제 예: User의 상태

```freelang
// v5.0: 구조체로 표현
struct User {
    name: String,
    email: String,
    is_active: bool,      // 활성화?
    is_banned: bool,      // 정지?
}

// 문제: 동시에 활성화이면서 정지일 수 있나? → 논리적 모순

// v5.2: 열거형으로 표현
enum UserStatus {
    Active,               // 활성화
    Inactive,             // 비활성화
    Banned,               // 정지됨
}

struct User {
    name: String,
    email: String,
    status: UserStatus,   // 반드시 하나만!
}

// 이제 명확함: 활성화이거나 정지됨, 둘 다 불가능 ✅
```

---

## 🏛️ 열거형의 설계 원칙

### 원칙 1: 상호 배타성 보장

```
❌ 나쁜 설계:
enum UserState {
    Active(bool),         // Active인지 아닌지?
    Banned(bool),         // 애매한 의도
}

✅ 좋은 설계:
enum UserState {
    Active,               // 명확: 활성화된 상태
    Inactive,             // 명확: 비활성화 상태
    Banned,               // 명확: 차단된 상태
}
```

**원칙**: "상태는 명확해야 한다"

### 원칙 2: 필요한 데이터만 포함

```
❌ 나쁜 설계:
enum Signal {
    UpdateVersion(f32, String, bool), // 너무 많음
}

✅ 좋은 설계:
enum Signal {
    UpdateVersion(f32),   // 필요한 것만
}
```

**원칙**: "각 상태는 자신에게 필요한 데이터만 가져라"

### 원칙 3: 의도를 드러내기

```
❌ 나쁜 설계:
enum State {
    S1,
    S2,
    S3,
}

✅ 좋은 설계:
enum ProcessState {
    Waiting,
    Running,
    Complete,
}
```

**원칙**: "이름으로 의도를 명확히 하라"

---

## 🌟 v5.2의 의의

### 철학적 의미

```
구조체: "이것들은 함께 존재한다" (cohesion)
열거형: "이것들은 함께 존재할 수 없다" (mutual exclusion)

구조체 + 열거형 = 타입 시스템의 완성
```

### 실무 의의

```
1. 런타임 오류 방지
   → 잘못된 상태가 런타임에 발생 불가능

2. 논리적 일관성
   → 시스템의 상태 공간을 명확히 제한

3. 유지보수성 향상
   → 상태 추가 시 컴파일러가 모든 곳을 수정하도록 강제

4. 자기 문서화
   → 코드만 봐도 가능한 상태가 무엇인지 명확
```

---

## 📚 열거형 활용 패턴

### 패턴 1: Result로 에러 처리

```freelang
enum Result {
    Ok(String),
    Error(String),
}

fn divide(a: i32, b: i32) -> Result {
    if b == 0 {
        Result::Error("0으로 나눌 수 없음")
    } else {
        Result::Ok("성공")
    }
}
```

### 패턴 2: Option으로 null 처리

```freelang
enum Option {
    Some(String),
    None,
}

fn find(id: i32) -> Option {
    if found {
        Option::Some("user")
    } else {
        Option::None
    }
}
```

### 패턴 3: 상태 기계

```freelang
enum TrafficLight {
    Red,
    Yellow,
    Green,
}

fn next_state(current: TrafficLight) -> TrafficLight {
    match current {
        TrafficLight::Red => TrafficLight::Green,
        TrafficLight::Green => TrafficLight::Yellow,
        TrafficLight::Yellow => TrafficLight::Red,
    }
}
```

### 패턴 4: 신호 처리

```freelang
enum Signal {
    Reset,
    UpdateVersion(f32),
    ErrorMessage(String),
    ChangeColor(i32, i32, i32),
}

fn handle(signal: Signal) {
    match signal {
        Signal::Reset => println("초기화"),
        Signal::UpdateVersion(v) => println("버전: {}", v),
        Signal::ErrorMessage(msg) => println("에러: {}", msg),
        Signal::ChangeColor(r, g, b) => println("색상: R{} G{} B{}", r, g, b),
    }
}
```

---

## 🔍 v5.2 vs v5.0, v5.1

| 측면 | v5.0 (구조체) | v5.1 (메서드) | v5.2 (열거형) |
|------|--------|---------|---------|
| **초점** | "무엇인가" | "무엇을 하는가" | "여러 상태 중 하나" |
| **정의** | `struct` | `impl` | `enum` |
| **관계** | 데이터 모음 | 동작 정의 | 상태 선택 |
| **강제성** | 모든 필드 필수 | 메서드 선택 | 하나의 상태만 |
| **오류** | 잘못된 필드 | 없는 메서드 호출 | 정의 안 된 상태 |

---

## 🎨 좋은 열거형 설계의 3원칙

### 원칙 1: 상태를 명확히

```
❌ 나쁜 설계:
enum Level { Low, High }     // 어떤 레벨? 불명확

✅ 좋은 설계:
enum BatteryLevel { Critical, Low, Normal, Full }  // 명확한 상태
```

### 원칙 2: 데이터와 상태를 함께

```
❌ 나쁜 설계:
enum Result { Success, Failure }
// 성공/실패 정보가 어디에?

✅ 좋은 설계:
enum Result {
    Success(String),        // 성공 시 값
    Failure(String),        // 실패 시 이유
}
```

### 원칙 3: match의 완전성 활용

```
❌ 나쁜 설계:
match status {              // 일부만 처리
    Status::Active => {},
}                           // Warning: Status::Inactive 처리 안 됨!

✅ 좋은 설계:
match status {              // 모든 경우 처리
    Status::Active => {},
    Status::Inactive => {},
}                           // 완벽함 ✅
```

---

## 🚀 다음 단계 미리보기

### v5.3: Option과 Result

```freelang
enum Option<T> {
    Some(T),
    None,
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

**다음**: 열거형의 정점, 러스트 에러 처리의 가장 우아한 방식!

---

**작성일**: 2026-02-22
**버전**: v5.2 아키텍처 v1.0
**철학**: "상태의 명확한 분류"

> 열거형이 없다면, 상태는 숫자나 불린으로 관리되어 무수한 버그를 낳습니다.
> 열거형을 정의하는 순간,
> 시스템의 상태 공간이 컴파일러에 의해 엄격하게 보호받습니다.
>
> 저장 필수, 너는 기록이 증명이다 gogs.

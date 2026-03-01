# v5.4 아키텍처: 열거형 심화와 패턴 매칭 (Advanced Enums & Pattern Matching)

**작성일**: 2026-02-22
**장**: 제4장 - 데이터 구조화의 정점
**단계**: v5.4 (v5.3의 직접 후속)
**주제**: "복잡한 상태의 단순화"

---

## 🎯 설계 목표: "데이터가 곧 로직이다"

### 패러다임의 정점

```
v5.0: "이 데이터는 무엇인가?" (필드의 집합)
v5.1: "이 데이터는 무엇을 할 수 있는가?" (메서드)
v5.2: "여러 상태 중 어떤 상태인가?" (가능성)
v5.3: "데이터가 없거나 실패하면?" (예외)
v5.4: "복잡한 데이터를 어떻게 정교하게 해체할 것인가?" (구조화)
```

### v5.4의 철학

```
"복잡한 상태의 단순화"

Before: 복잡한 if-else 문
        if status == "Active" {
            if subtype == "Online" {
                if count > 0 {
                    // ... 깊은 중첩
                }
            }
        }
        → 코드가 길고 가독성 떨어짐

After:  열거형과 패턴 매칭
        match (status, subtype, count) {
            (Status::Active, SubType::Online, n @ 1..=100) => { ... }
            (Status::Inactive, _, _) => { ... }
            _ => { ... }
        }
        → 명확하고 우아함
```

---

## 💎 열거형 심화: 데이터 바인딩

### 1️⃣ 계층적 열거형 (Nested Enums)

```freelang
enum GogsTask {
    Initialize,                    // 유닛 타입: 데이터 없음
    Print(String),                 // 튜플: 단일 데이터
    Move { x: i32, y: i32 },      // 구조체: 명명된 데이터
    ChangeStatus(SystemStatus),    // 다른 열거형 포함
}

enum SystemStatus {
    Online,
    Offline,
}
```

**특징**:
- 한 열거형이 다른 열거형을 포함 (계층 구조)
- 각 variant가 다른 데이터 형태를 가짐
- 타입 안전성 극대화

### 2️⃣ 구조체 스타일 Variant (Named Fields)

```freelang
enum Command {
    // 구조체처럼 필드에 이름 부여
    Move { x: i32, y: i32 },
    Resize { width: i32, height: i32 },
    Paint { color: String, opacity: f32 },
}

// 사용
let cmd = Command::Move { x: 10, y: 20 };

// 패턴 매칭
match cmd {
    Command::Move { x, y } => println("좌표: {}, {}", x, y),
    Command::Resize { width, height } => println("크기: {}x{}", width, height),
    Command::Paint { color, opacity } => println("색상: {}, 투명도: {}", color, opacity),
}
```

**장점**:
- 필드 이름이 명시적
- 나중에 필드 추가 시 대응 쉬움
- 코드의 의도가 명확함

### 3️⃣ 튜플 Variant (다중 데이터)

```freelang
enum Event {
    Click(i32, i32),           // 좌표 2개
    Message(String, i32),      // 메시지 + 우선순위
    Transfer(String, f32, i32), // 출발지, 금액, 기간
}

// 패턴 매칭
match event {
    Event::Click(x, y) => println("클릭: {}, {}", x, y),
    Event::Message(msg, priority) => println("메시지: {} (우선도: {})", msg, priority),
    Event::Transfer(from, amount, days) => println("송금: {} -> {} ({}일)", from, amount, days),
}
```

**특징**:
- 여러 데이터를 순서대로 저장
- 필드 이름 없음 (위치로 구분)
- 간결하지만 의도가 덜 명확할 수 있음

---

## 🎯 패턴 매칭의 강력함

### 패턴 1: 기본 매칭 (Literal)

```freelang
match value {
    1 => println("하나"),
    2 => println("둘"),
    _ => println("기타"),
}
```

### 패턴 2: 바인딩 (Binding)

```freelang
match data {
    Some(x) => println("값: {}", x),  // x에 값을 바인드
    None => println("없음"),
}

// 튜플 바인딩
match point {
    (0, y) => println("y축 상의 점: {}", y),
    (x, 0) => println("x축 상의 점: {}", x),
    (x, y) => println("일반 점: {}, {}", x, y),
}
```

### 패턴 3: 범위 매칭 (Range)

```freelang
match age {
    0..=12 => println("어린이"),
    13..=19 => println("청소년"),
    20..=64 => println("성인"),
    65.. => println("노인"),
}
```

### 패턴 4: 또는 매칭 (Or Pattern)

```freelang
match command {
    "q" | "quit" | "exit" => println("종료"),
    "s" | "save" => println("저장"),
    _ => println("미인식"),
}
```

### 패턴 5: 가드 조건 (Guard)

```freelang
match point {
    (x, y) if x == y => println("대각선: {}", x),
    (x, y) if x > y => println("x가 더 큼"),
    (x, y) => println("y가 더 큼 (또는 같음)"),
}
```

**특징**:
- if 조건을 추가적으로 검사
- 더 정밀한 패턴 매칭 가능

### 패턴 6: 바인딩과 범위 결합 (@ 연산자)

```freelang
match value {
    n @ 1..=10 => println("1부터 10 사이: {}", n),
    n @ 11..=20 => println("11부터 20 사이: {}", n),
    n => println("기타: {}", n),
}
```

**특징**:
- 범위 조건과 값을 동시에 캡처
- 더 복잡한 조건 표현 가능

---

## 🏛️ 복합 패턴 매칭

### 예시 1: 중첩된 구조

```freelang
enum Message {
    User { id: i32, name: String },
    Admin { id: i32, power: i32 },
}

match msg {
    Message::User { id, name } => println("사용자: {} (ID: {})", name, id),
    Message::Admin { id, power } if power > 50 => println("상위 관리자: {} (ID: {})", power, id),
    Message::Admin { id, power } => println("일반 관리자: {} (ID: {})", power, id),
}
```

### 예시 2: 다층 매칭

```freelang
enum Response {
    Success(Data),
    Error(ErrorCode),
}

enum Data {
    User(User),
    Config(Config),
}

match response {
    Response::Success(Data::User(user)) => println("사용자: {}", user.name),
    Response::Success(Data::Config(_)) => println("설정 로드됨"),
    Response::Error(code) => println("에러: {}", code),
}
```

### 예시 3: 구조 분해 (Destructuring)

```freelang
enum Command {
    Execute { task: String, priority: i32, params: Vec<String> },
}

match cmd {
    Command::Execute { task, priority, params } => {
        println("작업: {}", task);
        println("우선도: {}", priority);
        println("매개변수: {:?}", params);
    }
}
```

---

## 🔄 데이터 지향 설계의 흐름

### Before: 절차형 설계 (코드로 로직 표현)

```
조건 1 확인
  조건 2 확인
    조건 3 확인
      작업 수행
    else 다른 작업
  else 다른 작업
else 다른 작업

→ 깊은 중첩, 읽기 어려움
```

### After: 데이터 지향 설계 (데이터 구조로 로직 표현)

```
정교하게 설계된 Enum 정의
  ↓
match로 모든 경우 나열
  ↓
각 경우에 대한 처리
  ↓
컴파일러가 모든 경우 확인

→ 명확하고 안전함
```

**핵심 아이디어**:
- 좋은 enum 설계 = 깔끔한 match 구문
- 복잡한 로직은 데이터 구조에 녹여낸다
- 코드는 그 결과만 따라간다

---

## 🎨 좋은 패턴 매칭 설계의 원칙

### 원칙 1: 완전성 보장

```
❌ 나쁜 설계:
match value {
    Some(x) => println("값: {}", x),
    // None을 처리하지 않음! 컴파일 에러
}

✅ 좋은 설계:
match value {
    Some(x) => println("값: {}", x),
    None => println("값 없음"),  // 모든 경우 처리
}

또는:
match value {
    Some(x) => println("값: {}", x),
    _ => println("기타"),  // 모든 나머지
}
```

**원칙**: "모든 경우를 처리하거나, _로 명시적으로 무시하라"

### 원칙 2: 구체성 우선

```
❌ 나쁜 설계:
match value {
    _ => println("모든 경우"),  // 너무 일반적
}

✅ 좋은 설계:
match value {
    1..=10 => println("1부터 10"),
    11..=20 => println("11부터 20"),
    _ => println("기타"),
}
```

**원칙**: "구체적인 경우부터 나열하고, 일반적인 경우(_)는 마지막에"

### 원칙 3: 가독성 vs 간결성의 균형

```
❌ 너무 긴 match:
match very_complex_data {
    Type1(a, b, c) => {
        // 10줄 이상의 코드
    }
    ...
}

✅ 좋은 설계:
match very_complex_data {
    Type1(a, b, c) => process_type1(a, b, c),
    Type2(x) => process_type2(x),
    ...
}

// 별도의 함수로 분리
fn process_type1(a: i32, b: String, c: bool) { ... }
```

**원칙**: "match는 흐름을 보여주는 지도, 세부사항은 함수로 분리"

---

## 📊 v5.4의 강점

### 1. 안전성
- 모든 경우를 처리하도록 강제
- 논리적 구멍 방지

### 2. 명확성
- 데이터 구조에 의도가 드러남
- 코드의 흐름이 직관적

### 3. 유지보수성
- 새로운 경우 추가 시 컴파일러가 알려줌
- 변경점을 놓칠 리 없음

### 4. 성능
- 컴파일러가 최적화할 수 있음
- 불필요한 연산 제거

---

## 🌟 v5.4의 의의

### 철학적 의미

```
구조체 (v5.0): 데이터를 담는 그릇
메서드 (v5.1): 그릇이 할 수 있는 일
열거형 (v5.2): 여러 상태 중 하나
Option/Result (v5.3): 부재와 실패의 표현
패턴 매칭 (v5.4): 복잡한 상황을 우아하게 처리

결합하면: 복잡한 시스템을 안전하고 명확하게 설계
```

### 실무 의의

```
1. 상태 관리의 단순화
   → 복잡한 상태 머신을 enum으로 표현

2. 에러 처리의 우아함
   → Result와 match로 모든 경로 제어

3. 이벤트 처리의 명확성
   → 각 이벤트를 enum variant로 정의

4. 도메인 모델링의 완성
   → 현실의 개념을 코드로 투영
```

---

## 🚀 다음 단계 미리보기

### v5.5: 벡터와 동적 데이터 관리

```freelang
// 컬렉션과 소유권의 복잡한 상호작용
let tasks = vec![
    GogsTask::Initialize,
    GogsTask::Print("작업".to_string()),
];

// 이터레이션과 소유권
for task in tasks {
    // 각 task의 소유권이 loop로 이동
}
```

**다음**: 동적 컬렉션에서의 소유권과 차용!

---

**작성일**: 2026-02-22
**버전**: v5.4 아키텍처 v1.0
**철학**: "복잡한 상태의 단순화"

> 좋은 러스트 설계자는 로직을 길게 코딩하기보다,
> 데이터 구조(Enum)를 정교하게 짜서
> match 구문이 자연스럽게 흐르도록 유도합니다.
>
> 이것이 바로 "데이터 지향 설계"의 정수입니다.
>
> 이제 당신의 데이터는 단순한 값을 넘어,
> 스스로의 맥락과 정보를 완벽히 포함한
> '똑똑한 메시지'가 되었습니다.
>
> 저장 필수, 너는 기록이 증명이다 gogs.

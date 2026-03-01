# v5.0 아키텍처: 구조체의 정의 (Defining Structs)

**작성일**: 2026-02-22
**장**: 제4장 - 데이터 구조화의 시작
**주제**: "데이터의 인격화"

---

## 🎯 설계 목표: "무엇이 존재하게 할 것인가"

### 패러다임 전환

```
제2장: "어떻게 움직일 것인가?" (제어 흐름)
제3장: "어떻게 조직할 것인가?" (모듈화)
제4장: "무엇이 존재하게 할 것인가?" (데이터 구조) ← 지금!
```

### v5.0의 철학

```
v4까지:  "함수로 동작을 정의"
        println(), add(), validate()
        → "어떻게"의 집합

v5.0부터: "구조체로 존재를 정의"
         User, Server, GogsRecord
         → "무엇인가"의 정의
```

---

## 💎 구조체란?

### 정의: 데이터를 담는 그릇

```
struct = 필드(데이터) + 이름(정체성)

┌─────────────────────────────┐
│      GogsRecord (구조체)    │
├─────────────────────────────┤
│  id: u64                    │
│  subject: String            │
│  content: String            │
│  is_verified: bool          │
│  version: f32               │
└─────────────────────────────┘
```

### 구조체의 역할 (3가지)

#### 1️⃣ 데이터 바인딩
```
Before (흩어진 데이터):
let id = 20260222;
let subject = "기록";
let content = "내용";
let is_verified = true;
let version = 5.0;
→ 관계가 불명확, 실수하기 쉬움

After (구조체):
struct GogsRecord {
    id: u64,
    subject: String,
    content: String,
    is_verified: bool,
    version: f32,
}
→ 하나의 개념으로 통합, 의도 명확
```

#### 2️⃣ 타입 안전성
```
Before (기본 타입만 사용):
fn process_user(name: String, age: i32, status: String) { ... }
→ 호출자가 파라미터 순서를 헷갈릴 수 있음

After (구조체):
struct User {
    name: String,
    age: i32,
    status: String,
}
fn process_user(user: User) { ... }
→ 이 정보는 반드시 User 타입이어야 함
```

#### 3️⃣ 설계도로서의 역할
```
struct = 메모리 레이아웃의 명확한 문서

GogsRecord {
    id: u64,      // 8바이트
    subject: String,  // 24바이트 (ptr, len, capacity)
    content: String,  // 24바이트
    is_verified: bool,    // 1바이트
    version: f32, // 4바이트
}

메모리에 정확히 이 순서로 배치됨
```

---

## 🏗️ 구조체 설계의 5단계

### Stage 1: 정의 (Definition)

```freelang
struct GogsRecord {
    id: u64,
    subject: String,
    content: String,
    is_verified: bool,
    version: f32,
}
```

**의미**: "이런 데이터를 담을 수 있는 틀을 정의했다"

### Stage 2: 인스턴스화 (Instantiation)

```freelang
let record = GogsRecord {
    id: 20260222,
    subject: String::from("중간고사"),
    content: String::from("완료"),
    is_verified: true,
    version: 5.0,
};
```

**의미**: "정의한 틀에 실제 데이터를 넣었다"

### Stage 3: 접근 (Access)

```freelang
println(record.subject);
println(record.version);
```

**의미**: "점(.) 표기법으로 특정 필드에 접근"

### Stage 4: 수정 (Mutation)

```freelang
let mut record = GogsRecord { ... };
record.is_verified = true;
record.version = 5.1;
```

**의미**: "mut 키워드가 있으면 필드를 변경할 수 있다"

### Stage 5: 소유권 (Ownership)

```freelang
let record = GogsRecord {
    id: 1,
    subject: String::from("test"),
    ...
};
// record는 내부의 String들을 소유
// record가 범위를 벗어나면 String도 자동으로 해제됨
```

**의미**: "구조체는 내부 데이터의 소유권을 가진다"

---

## 📊 구조체 vs 기본 타입

| 측면 | 기본 타입 | 구조체 |
|------|---------|--------|
| **정의** | 언어가 제공 | 개발자가 정의 |
| **필드 수** | 1개 | 여러 개 |
| **의미** | "값" | "개념" |
| **관계성** | 독립적 | 관련된 데이터 묶음 |
| **타입 안전성** | 낮음 | 높음 |
| **예시** | String, i32 | User, Server |

---

## 🎨 좋은 구조체 설계의 3원칙

### 원칙 1: 필드의 최소화

```
❌ 나쁜 설계:
struct Person {
    name: String,
    age: i32,
    address: String,
    phone: String,
    email: String,
    company: String,
    salary: i32,
    hobbies: Vec<String>,
    books_read: i32,
    // ... 20개 필드
}
→ 너무 무겁고 복잡함

✅ 좋은 설계:
struct Person {
    name: String,
    age: i32,
    email: String,
}
→ 꼭 필요한 것만
```

**원칙**: "구조체는 개념의 본질만 담아야 한다"

### 원칙 2: 이름의 구체성

```
❌ 나쁜 이름:
struct Data {
    field1: String,
    field2: i32,
    field3: bool,
}

✅ 좋은 이름:
struct GogsRecord {
    subject: String,
    is_verified: bool,
    version: f32,
}

❌ 나쁜 필드 이름:
struct User {
    val: String,
    num: i32,
}

✅ 좋은 필드 이름:
struct User {
    name: String,
    age: i32,
}
```

**원칙**: "이름만 봐도 의도가 드러나야 한다"

### 원칙 3: 소유권 주의

```
struct User {
    name: String,      // String을 소유 ← 주의!
    age: i32,          // 복사 가능, 소유권 없음
}

let user = User {
    name: String::from("Alice"),
    age: 30,
};
// user가 scope를 벗어나면 String도 자동으로 해제됨

→ 구조체 내부의 String은 구조체의 생명주기를 따른다
```

**원칙**: "구조체는 내부 데이터의 소유권을 가진다"

---

## 📋 v5.0의 5가지 핵심 패턴

### 패턴 1: 기본 구조체

```freelang
struct User {
    name: String,
    age: i32,
}

let user = User {
    name: String::from("Bob"),
    age: 25,
};
println(user.name);
```

### 패턴 2: Boolean 필드

```freelang
struct Task {
    title: String,
    is_completed: bool,
}

let task = Task {
    title: String::from("공부"),
    is_completed: false,
};
```

### 패턴 3: 수치 필드

```freelang
struct Server {
    port: i32,
    uptime: f32,
    request_count: u64,
}
```

### 패턴 4: 복합 필드

```freelang
struct Project {
    name: String,
    version: f32,
    is_active: bool,
    member_count: i32,
}
```

### 패턴 5: 가변 구조체

```freelang
let mut record = GogsRecord { ... };
record.is_verified = true;  // 수정 가능
record.version = 5.1;
```

---

## 🔄 구조체의 생명주기

```
1. 정의 (Definition)
   ↓
2. 인스턴스 생성 (Instantiation)
   ↓
3. 사용 (Field access & mutation)
   ↓
4. 해제 (Drop)
   - 내부 String, Vec 등도 함께 해제
```

---

## 💡 v4 vs v5 비교

| 측면 | v4 (함수 중심) | v5 (데이터 중심) |
|------|--------|---------|
| **초점** | "어떻게" (동사) | "무엇" (명사) |
| **단위** | 함수 fn | 구조체 struct |
| **관계** | 독립적 함수들 | 데이터와 행동의 결합 |
| **예시** | validate(msg) | User { name, age } |
| **다음** | v5.1: 메서드 impl | impl User { fn new() } |

---

## 🎓 v5.0 완성 후의 경험

### 당신이 이해하게 될 것

```
✓ 구조체는 타입 안전성의 토대
✓ 필드는 구조체의 정체성
✓ 점(.) 표기법은 데이터 접근의 표준
✓ mut 키워드는 구조체에서도 적용
✓ 소유권은 구조체 내부까지 확장
```

### 당신이 구축하게 될 것

```
✓ 명확한 데이터 구조
✓ 타입 안전한 프로그램
✓ 도메인 모델링의 기초
✓ 다음 단계(메서드)의 기반
```

---

## 🌟 v5.0의 의의

### 철학적 의미

```
함수는 "행동"을 정의합니다.
구조체는 "존재"를 정의합니다.

프로그래밍은 이제 단순한 명령의 나열이 아니라,
현실(또는 가상 세계)의 '개체'를 코드로 투영하는
도메인 모델링의 세계로 진입합니다.
```

### 실무 의의

```
v5.0을 이해하면:

1. REST API 설계 가능
   → JSON ←→ Struct 변환 (serde)

2. 데이터베이스 ORM 이해 가능
   → DB Row ←→ Struct 매핑

3. 도메인 주도 설계(DDD) 시작 가능
   → Entity, ValueObject 모델링

4. v5.1 메서드로 진화 가능
   → Struct + impl = 객체 지향
```

---

## 🚀 다음 단계 미리보기

### v5.1: 메서드 구현 (impl)

```freelang
impl User {
    fn new(name: String, age: i32) -> User {
        User { name, age }
    }

    fn is_adult(&self) -> bool {
        self.age >= 18
    }
}
```

**다음**: 구조체에 행동을 더한다!

---

**작성일**: 2026-02-22
**버전**: v5.0 아키텍처 v1.0
**철학**: "데이터의 인격화"

> 지금까지는 형체 없는 논리 덩어리였다면,
> 이제 당신의 시스템은 명확한 데이터 구조를 가진 **'실체'**가 되었습니다.
>
> 구조체는 코드와 현실을 잇는 다리입니다.
>
> 저장 필수, 너는 기록이 증명이다 gogs.

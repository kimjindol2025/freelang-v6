# v5.1 아키텍처: 메서드 구현 (Method Implementation & impl)

**작성일**: 2026-02-22
**장**: 제4장 - 데이터 구조화의 시작
**단계**: v5.1 (v5.0의 직접 후속)
**주제**: "데이터의 자율성"

---

## 🎯 설계 목표: "정신을 불어넣다"

### 패러다임의 깊화

```
v5.0: "이 데이터는 무엇인가?"
      struct User { name, age, email }

v5.1: "이 데이터는 무엇을 할 수 있는가?"
      impl User {
          fn new() { ... }
          fn is_adult(&self) { ... }
          fn update_name(&mut self) { ... }
      }
```

### v5.1의 철학

```
"데이터 스스로가 자신을 처리하게 한다"

Before (v5.0):  외부 함수가 데이터를 가져가서 처리
                let user = create_user("Alice", 25);
                let adult = is_adult(&user);

After (v5.1):   데이터가 스스로 자신을 처리
                let user = User::new("Alice", 25);
                let adult = user.is_adult();
```

---

## 💎 impl 블록이란?

### 정의: 구조체에 기능을 장착하기

```
impl = implementation (구현)

struct + impl = 데이터 + 기능
      = 객체 지향 프로그래밍의 시작
```

### impl 블록의 구조

```freelang
struct User {
    name: String,
    age: i32,
}

impl User {
    // 메서드들이 여기에 정의됨
    fn method1(&self) { ... }
    fn method2(&mut self) { ... }
    fn method3(self) { ... }
    fn associated_fn() { ... }
}
```

---

## 🔧 3가지 self의 형태

### 1️⃣ &self (불변 참조)

```freelang
impl User {
    fn get_name(&self) -> String {
        self.name.clone()
    }

    fn is_adult(&self) -> bool {
        self.age >= 18
    }
}
```

**특징**:
- 데이터를 **읽기만** 함
- 수정하지 않음
- 여러 번 호출 가능
- 가장 일반적인 형태

**사용 예**:
```
user.get_name()
user.is_adult()
user.display()
```

### 2️⃣ &mut self (가변 참조)

```freelang
impl User {
    fn update_name(&mut self, new_name: String) {
        self.name = new_name;
    }

    fn increase_age(&mut self) {
        self.age = self.age + 1;
    }
}
```

**특징**:
- 데이터를 **수정함**
- 호출 시 인스턴스는 `mut`이어야 함
- 호출 후에도 인스턴스 존재

**사용 예**:
```
let mut user = User::new("Alice", 25);
user.update_name("Bob");      // mut 필요
user.increase_age();          // mut 필요
println(user.get_name());     // 가능
```

### 3️⃣ self (소유권 이전)

```freelang
impl User {
    fn into_record(self) -> String {
        self.name  // self가 소유권을 가지고 처리
                   // 메서드 후 인스턴스는 소멸
    }
}
```

**특징**:
- 소유권을 **완전히 가져옴**
- 메서드 실행 후 인스턴스가 해제됨
- 변환(transformation) 작업에 사용
- "마지막 작업"의 느낌

**사용 예**:
```
let user = User::new("Alice", 25);
let record = user.into_record();  // user는 더 이상 사용 불가
// user.get_name() ← ERROR!
```

---

## 📋 메서드의 4가지 패턴

### 패턴 1: 연관 함수 (Associated Function)

```freelang
impl User {
    // self를 받지 않음 - "생성자" 역할
    fn new(name: String, age: i32) -> User {
        User { name, age }
    }
}

// 호출: User::new("Alice", 25)
// :: 표기법으로 호출 (인스턴스 필요 없음)
```

**특징**:
- `self` 없음
- 인스턴스 없이 호출 (`Type::function()`)
- 생성자 역할 (`new`)
- 공장 함수(factory) 역할

### 패턴 2: 읽기 메서드 (&self)

```freelang
impl User {
    fn get_name(&self) -> String {
        self.name.clone()
    }

    fn get_age(&self) -> i32 {
        self.age
    }

    fn is_adult(&self) -> bool {
        self.age >= 18
    }
}

// 호출: user.get_name(), user.is_adult()
```

**특징**:
- `&self` 사용
- 데이터 조회만
- 불변 접근
- 여러 번 호출 가능

### 패턴 3: 수정 메서드 (&mut self)

```freelang
impl User {
    fn update_name(&mut self, new_name: String) {
        self.name = new_name;
    }

    fn increase_age(&mut self) {
        self.age = self.age + 1;
    }
}

// 호출: user.update_name("Bob"), user.increase_age()
```

**특징**:
- `&mut self` 사용
- 데이터 수정
- 호출 시 `mut` 필수
- 메서드 체이닝 제약

### 패턴 4: 소비 메서드 (self)

```freelang
impl User {
    fn into_record(self) -> String {
        format!("Record of {}", self.name)
    }

    fn destroy(self) {
        println!("User {} destroyed", self.name);
    }
}

// 호출: user.into_record(), user.destroy()
```

**특징**:
- `self` 사용 (소유권)
- 인스턴스를 소비
- 호출 후 인스턴스 소멸
- 변환/정리 작업

---

## 🏛️ 응집도 (Cohesion)의 극대화

### Before: 흩어진 함수들

```
문제점:
- User와 관련된 함수가 이곳저곳에 산재
- 어떤 함수가 User의 것인지 불명확
- 유지보수 어려움
```

```freelang
fn create_user(name: String, age: i32) -> String { ... }
fn get_user_name(user: String) -> String { ... }
fn is_user_adult(user: String) -> bool { ... }
fn update_user_name(user: String, name: String) { ... }
```

### After: 한곳에 모은 impl 블록

```
장점:
- User 관련 모든 기능이 한곳에
- "이것은 User의 메서드다"가 명확
- 유지보수 용이
- 관련 기능들의 응집도 극대화
```

```freelang
impl User {
    fn new(name: String, age: i32) -> User { ... }
    fn get_name(&self) -> String { ... }
    fn is_adult(&self) -> bool { ... }
    fn update_name(&mut self, name: String) { ... }
}
```

---

## 🔄 메서드 vs 함수

| 측면 | 함수 (Function) | 메서드 (Method) |
|------|--------|----------|
| **정의** | `fn foo()` | `impl 블록 내` |
| **호출** | `foo()` | `obj.foo()` |
| **self** | 없음 | `&self`, `&mut self`, 또는 `self` |
| **응집도** | 낮음 | 높음 |
| **의미** | "이것을 하라" | "넌 이것을 해라" |
| **예시** | `validate(user)` | `user.validate()` |

---

## 📊 v5.0 vs v5.1

| 측면 | v5.0 (구조체) | v5.1 (메서드) |
|------|--------|---------|
| **초점** | "무엇인가" | "무엇을 하는가" |
| **정의** | `struct` | `impl` |
| **관계** | 데이터만 | 데이터 + 기능 |
| **호출 방식** | 함수에 데이터 전달 | 데이터가 자신을 처리 |
| **응집도** | 낮음 | 높음 |
| **다음 단계** | impl 블록 필요 | 트레이트 구현 |

---

## 🎨 좋은 메서드 설계의 3원칙

### 원칙 1: 적절한 self 선택

```
❌ 나쁜 설계:
fn get_name(self) -> String { ... }  // 소유권을 가져갈 필요 없음
fn is_adult(self) -> bool { ... }     // 데이터를 읽기만 함

✅ 좋은 설계:
fn get_name(&self) -> String { ... }  // 읽기만
fn is_adult(&self) -> bool { ... }     // 읽기만
fn update_name(&mut self) { ... }      // 수정함
fn into_string(self) -> String { ... } // 변환하면서 소비
```

**원칙**: "필요한 권한만 요청하라"

### 원칙 2: 메서드의 책임 명확화

```
❌ 나쁜 설계:
impl User {
    fn do_everything(&mut self) { ... }  // 너무 많은 책임
}

✅ 좋은 설계:
impl User {
    fn update_name(&mut self, name: String) { ... }  // 이름만 수정
    fn update_age(&mut self, age: i32) { ... }       // 나이만 수정
    fn display(&self) { ... }                        // 출력만
}
```

**원칙**: "한 메서드는 한 가지만 해라"

### 원칙 3: 연관 함수로 생성자 패턴

```
❌ 나쁜 설계:
let user = User {
    name: String::from("Alice"),
    age: 25,
};  // 필드를 직접 조작

✅ 좋은 설계:
let user = User::new("Alice", 25);  // 생성자 함수 사용
```

**원칙**: "인스턴스 생성은 `new()`를 통해"

---

## 🌟 v5.1의 의의

### 철학적 의미

```
v5.0: 데이터에 "형체"를 부여
      "User는 이런 데이터를 가진다"

v5.1: 데이터에 "정신"을 부여
      "User는 이런 일을 할 수 있다"

결과: 단순한 데이터 그릇 → 자율적인 "개체"
```

### 실무 의의

```
1. 캡슐화 강화
   → 데이터 접근을 메서드로 제어

2. 응집도 증가
   → 관련 기능들이 한곳에 모임

3. 객체 지향적 사고
   → "객체가 스스로 행동한다"

4. 유지보수성 향상
   → 기능 추가/수정이 체계적
```

---

## 📚 메서드 작성 체크리스트

```
메서드를 정의할 때마다 확인하세요:

□ self의 형태를 올바르게 선택했는가?
  ├─ 읽기만? → &self
  ├─ 수정? → &mut self
  └─ 소유권 필요? → self

□ 메서드 이름이 명확한가?
  ├─ get_* (읽기)
  ├─ update_* (수정)
  ├─ is_* (판단)
  └─ into_* (변환)

□ 한 가지 책임만 하는가?
  └─ "이 메서드는 정확히 무엇을 하는가?"

□ 구조체의 정보 은닉을 지키는가?
  └─ 필요한 부분만 노출

□ 연관 함수 `new()`를 제공하는가?
  └─ 생성자 패턴 적용
```

---

## 🚀 다음 단계 미리보기

### v5.2: 열거형 (Enums)

```freelang
enum Status {
    Active,
    Inactive,
    Pending,
}

impl Status {
    fn is_active(&self) -> bool {
        matches!(self, Status::Active)
    }
}
```

**다음**: 상태의 다양성을 표현한다!

---

**작성일**: 2026-02-22
**버전**: v5.1 아키텍처 v1.0
**철학**: "데이터의 자율성"

> impl 블록이 없다면, 구조체는 수동적인 "기록지"일 뿐입니다.
> impl 블록으로 메서드를 정의하는 순간,
> 구조체는 능동적인 "지능형 개체"로 거듭납니다.
>
> 저장 필수, 너는 기록이 증명이다 gogs.

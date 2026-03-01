# v4.4 아키텍처: 모듈과 패키지 관리 (Modules & Scope Control)

## 🎯 설계 목표: "체계적인 코드 배치"

### 최종 선언
```
v4.0-v4.3에서 우리는 배웠다:
"함수를 통해 메모리를 관리한다"

v4.4에서 우리는 배울 것:
"함수들을 모듈로 묶어 코드를 조직화한다"

결과:
거대한 단일 파일이 아닌
체계적으로 배치된 '조립식 시스템'
```

---

## 💡 모듈(Modules)이란?

### 정의: 논리적 코드 경계

```
┌──────────────────────────┐
│   프로그램 (Program)      │
├──────────────────────────┤
│ ┌────────────────────┐   │
│ │  Module: math      │   │
│ │  - add()           │   │
│ │  - subtract()      │   │
│ │  - multiply()      │   │
│ └────────────────────┘   │
│                          │
│ ┌────────────────────┐   │
│ │  Module: network   │   │
│ │  - connect()       │   │
│ │  - send()          │   │
│ │  - receive()       │   │
│ └────────────────────┘   │
│                          │
│ ┌────────────────────┐   │
│ │  Module: storage   │   │
│ │  - save()          │   │
│ │  - load()          │   │
│ │  - delete()        │   │
│ └────────────────────┘   │
└──────────────────────────┘
```

### 특징

```
모듈 = 논리적으로 관련된 함수들의 집합

mod core_system {
    // 이 모듈에 속한 함수들
}

이점:
1. 이름 충돌 방지
2. 코드 조직화
3. 캡슐화 (내부 구현 숨김)
4. 재사용성 향상
```

---

## 🔧 모듈의 3가지 핵심 개념

### 개념 1: 영역 구분 (Modules)

```freelang
// [설계] 'math' 모듈 정의
mod math {
  // 이 모듈에 속한 모든 함수
}

// [설계] 'network' 모듈 정의
mod network {
  // 이 모듈에 속한 모든 함수
}

// [설계] 'storage' 모듈 정의
mod storage {
  // 이 모듈에 속한 모든 함수
}
```

**의미:**
- 관련된 함수들을 하나의 "방"에 모음
- 각 모듈은 독립적인 네임스페이스
- 이름 충돌을 자동으로 방지

### 개념 2: 가시성 제어 (pub)

```freelang
mod system {
  // pub이 있으면 외부에서 호출 가능
  pub fn public_function() {
    println("공개 함수");
    private_helper();  // 내부 함수 호출
  }

  // pub이 없으면 모듈 내부에서만 호출 가능
  fn private_helper() {
    println("비공개 함수");
  }
}

// 외부에서 호출 가능:
system::public_function();   // ✓ OK

// 외부에서 호출 불가:
system::private_helper();    // ✗ 에러!
```

**의미:**
- `pub`: 외부에서 호출 가능 (공개 인터페이스)
- 숨김: 모듈 내부에서만 호출 가능 (캡슐화)

### 개념 3: 경로 지정 (use)

```freelang
// 모듈 경로: system::public_function
// 이 경로를 직접 사용
system::public_function();

// 또는 경로를 임포트하여 단축
use system::public_function;
public_function();  // 더 짧음!

// 전체 모듈 임포트
use system::*;
public_function();  // 여전히 가능
```

**의미:**
- 복잡한 경로를 단축 가능
- 코드 가독성 향상
- 자주 사용하는 함수는 임포트

---

## 🎯 5가지 모듈 설계 패턴

### 패턴 1: 기능별 모듈화 (Functional Modules)

```freelang
// [설계] 수학 연산 모듈
mod math {
  pub fn add(a: i32, b: i32) -> i32 {
    a + b
  }

  pub fn subtract(a: i32, b: i32) -> i32 {
    a - b
  }
}

// [설계] 네트워크 모듈
mod network {
  pub fn connect(host: String) -> bool {
    true
  }

  pub fn send(data: String) -> bool {
    true
  }
}
```

**특징:**
- 유사한 기능들을 같은 모듈에 배치
- 코드 탐색이 쉬움
- 재사용성 높음

### 패턴 2: 계층별 모듈화 (Layered Modules)

```freelang
// [설계] 상위 계층: 사용자 인터페이스
mod ui {
  pub fn show_menu() {
    logic::process();  // 하위 계층 호출
  }
}

// [설계] 중간 계층: 비즈니스 로직
mod logic {
  pub fn process() {
    data::fetch();  // 더 하위 계층 호출
  }
}

// [설계] 하위 계층: 데이터 접근
mod data {
  pub fn fetch() {
    println("데이터 로드 중...");
  }
}
```

**특징:**
- 계층 간 명확한 의존성
- 각 계층이 다음 계층에만 의존
- 변경 영향 범위 제한

### 패턴 3: 도메인별 모듈화 (Domain Modules)

```freelang
// [설계] 사용자 도메인
mod user {
  pub fn create_user(name: String) -> bool {
    true
  }

  pub fn delete_user(id: i32) -> bool {
    true
  }
}

// [설계] 상품 도메인
mod product {
  pub fn list_products() -> i32 {
    10
  }

  pub fn get_product(id: i32) -> String {
    "product"
  }
}
```

**특징:**
- 비즈니스 도메인 중심
- 관심사의 분리 (Separation of Concerns)
- 마이크로서비스 구조와 유사

### 패턴 4: 캡슐화된 모듈 (Encapsulated Modules)

```freelang
// [설계] 공개 API만 노출
mod system {
  pub fn initialize() {
    check_safety();        // 내부 함수
    load_config();         // 내부 함수
    start_engine();        // 내부 함수
  }

  // 내부에서만 사용하는 함수들
  fn check_safety() {
    println("안전성 검사");
  }

  fn load_config() {
    println("설정 로드");
  }

  fn start_engine() {
    println("엔진 시작");
  }
}
```

**특징:**
- 복잡한 내부 구현 숨김
- 사용자는 공개 API만 사용
- 내부 변경이 외부에 영향 없음

### 패턴 5: 조합된 모듈 (Composite Modules)

```freelang
// [설계] 하위 모듈들
mod handlers {
  pub fn handle_request() {
    println("요청 처리");
  }
}

mod validators {
  pub fn validate_data() {
    println("데이터 검증");
  }
}

// [설계] 상위 모듈: 하위 모듈들을 조합
mod api {
  use handlers::handle_request;
  use validators::validate_data;

  pub fn process_api_call() {
    validate_data();
    handle_request();
  }
}
```

**특징:**
- 여러 모듈을 조합
- 각 모듈은 단일 책임
- 조합을 통해 복잡한 기능 구성

---

## 📊 모듈 설계 원칙

### 원칙 1: 응집도 (Cohesion)

```
[좋은 설계]
mod math {
  fn add() { ... }
  fn subtract() { ... }
  fn multiply() { ... }
}

[나쁜 설계]
mod misc {
  fn add() { ... }
  fn connect_network() { ... }
  fn save_file() { ... }
  fn parse_json() { ... }
}

→ 비슷한 목적의 함수들을 모은다
```

### 원칙 2: 비공개 우선 (Private by Default)

```
[좋은 설계]
mod system {
  pub fn public_api() { ... }    // 꼭 필요한 것만

  fn internal_helper() { ... }   // 나머지는 숨김
  fn validate_input() { ... }
}

[나쁜 설계]
mod system {
  pub fn public_api() { ... }
  pub fn internal_helper() { ... }  // 불필요하게 공개
  pub fn validate_input() { ... }
}

→ 기본적으로 숨기고, 필요할 때만 공개한다
```

### 원칙 3: 추상화 계층 (Abstraction Layer)

```
[상위 계층]
mod api {
  pub fn process() {
    // "무엇을" 할지만 결정
    logic::execute();
  }
}

[중간 계층]
mod logic {
  pub fn execute() {
    // "어떻게" 할지를 정함
    data::fetch();
    validate();
    transform();
  }
}

[하위 계층]
mod data {
  fn fetch() { ... }
  fn validate() { ... }
  fn transform() { ... }
}

→ 각 계층은 다음 계층의 세부사항에 신경쓰지 않음
```

---

## 🛡️ 모듈의 4가지 이점

### 이점 1: 이름 충돌 방지

```
[문제]
fn process() { ... }
fn process() { ... }  // ✗ 에러!

[해결]
mod module1 {
  pub fn process() { ... }
}

mod module2 {
  pub fn process() { ... }
}

module1::process();  // ✓ OK: 명확함
module2::process();  // ✓ OK: 명확함
```

**이점:** 같은 이름을 여러 모듈에서 사용 가능

### 이점 2: 코드 조직화

```
프로젝트 구조:
- math 모듈: 수학 연산
- network 모듈: 네트워크 통신
- storage 모듈: 데이터 저장
- ui 모듈: 사용자 인터페이스

→ 코드를 찾기 쉬움
```

**이점:** 대규모 프로젝트에서 코드 관리 용이

### 이점 3: 캡슐화 (Encapsulation)

```
외부에서 보이는 것:
├─ math::add()
├─ math::subtract()
└─ math::multiply()

외부에서 보이지 않는 것:
├─ math::validate_input()    (비공개)
├─ math::log_operation()     (비공개)
└─ math::optimize()          (비공개)

→ 사용자는 공개 API만 사용하면 됨
```

**이점:** 복잡한 내부 구현 숨김

### 이점 4: 재사용성

```
다른 프로젝트에서:
use my_library::math;

math::add(5, 3);     // ✓ OK
math::multiply(4, 2); // ✓ OK

→ 전체 모듈을 다른 프로젝트에서 재사용 가능
```

**이점:** 코드 재사용성 극대화

---

## 🎓 v4.4 설계 의사결정

### 모듈을 나눌 기준

```
질문 1: 함수들이 비슷한 목적을 가지는가?
        YES → 같은 모듈에 배치
        NO  → 다른 모듈로 분리

질문 2: 함수가 외부에서 직접 호출되어야 하는가?
        YES → pub으로 공개
        NO  → 숨겨서 캡슐화

질문 3: 이 함수를 다른 프로젝트에서 사용할 수 있는가?
        YES → pub으로 공개 (공개 API)
        NO  → 숨겨서 내부 구현 (비공개)
```

---

## 📊 v4.4 설계 요약

| 요소 | 설명 |
|------|------|
| **목표** | 체계적인 코드 배치 |
| **철학** | "필요한 것만 보여주기" |
| **3가지 개념** | 영역 구분(mod), 가시성 제어(pub), 경로 지정(use) |
| **4가지 이점** | 이름 충돌 방지, 코드 조직화, 캡슐화, 재사용성 |
| **5가지 패턴** | 기능별, 계층별, 도메인별, 캡슐화된, 조합된 |
| **3가지 원칙** | 응집도, 비공개 우선, 추상화 계층 |
| **시스템 진화** | 단일 파일 → 모듈 구조 → 패키지 구조 |

---

## 🎉 v4.4 완성 후의 경험

### 당신이 이해한 것
```
✓ 모듈이 논리적 코드 경계임을 알게 됨
✓ 캡슐화의 중요성 깨달음
✓ 대규모 프로젝트 관리 방법 학습
✓ 공개 API와 비공개 구현의 구분
✓ 체계적인 코드 조직화
```

### 당신이 설계한 것
```
✓ 기능별 모듈: math, network, storage
✓ 계층별 모듈: ui, logic, data
✓ 도메인별 모듈: user, product, order
✓ 캡슐화된 모듈: system, engine, config
✓ 조합된 모듈: api, service, manager
✓ Total: 15+ 모듈, 50+ 함수
```

---

**작성일:** 2026-02-22
**버전:** v4.4 아키텍처 v1.0
**철학:** "필요한 것만 보여주기"

> 모든 함수를 공개하는 것은 위험합니다.
> 내부의 복잡한 기어들은 숨기고,
> 사용자가 눌러야 할 '버튼'만 공개하는 것이
> 훌륭한 인터페이스 설계입니다.
>
> v4.4: 거대한 단일 파일이 아닌
> 체계적으로 배치된 '조립식 시스템'
>
> 다음: v4.5 트레이트와 제네릭으로 다양성을 포용하세요.

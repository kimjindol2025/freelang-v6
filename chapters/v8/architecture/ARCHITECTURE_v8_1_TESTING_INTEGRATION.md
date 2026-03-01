# 제7장 아키텍처: 신뢰의 구축 — v8.1 통합 테스트(Integration Testing)

**작성일**: 2026-02-22
**장**: 제7장 신뢰의 구축
**단계**: v8.1 (통합 테스트, v8.0 이후)
**주제**: "경계 밖에서의 시선: 공개 인터페이스 검증"
**핵심**: 라이브러리 설계와 외부 시스템 통합

---

## 🎯 v8.1의 설계 철학

**v8.0에서 배운 것:**
```
단위 테스트는 엔진의 나사 하나하나를 점검합니다.
```

**v8.1에서 배울 것:**
```
통합 테스트는 엔진과 변속기가 결합되어
실제로 바퀴를 굴릴 수 있는지 확인합니다.

"엔진이 좋아도 연결이 안 되면 쓸모없다"
```

### v8.1의 핵심 변화

```
v8.0: 단위 테스트
  ├─ 위치: src/ 내부 테스트 모듈
  ├─ 범위: 개별 함수/메서드
  ├─ 시각: 설계자의 내부 시각
  └─ 관점: "이 함수가 올바르게 작동하는가?"

v8.1: 통합 테스트
  ├─ 위치: tests/ 외부 테스트 디렉토리
  ├─ 범위: 라이브러리의 공개 인터페이스
  ├─ 시각: 사용자의 외부 시각
  └─ 관점: "이 라이브러리가 실제로 사용 가능한가?"
```

---

## 📐 v8.1: 통합 테스트의 이해

### 통합 테스트란?

```
"여러 모듈이 함께 작동하는지 검증한다"

단위 테스트:
  fn add(a: i32, b: i32) -> i32 { a + b }
  → add(2, 3) = 5인지 확인

통합 테스트:
  라이브러리 전체를 마치 외부 크레이트처럼 사용
  → 금고를 생성하고, 키를 입력하고, 접근을 확인하는
     전체 워크플로우(Workflow)가 작동하는지 확인

차이:
  단위: 고립된 함수
  통합: 연결된 시스템
```

### 통합 테스트의 구조

```freelang
// tests/integration_test.rs (외부 테스트 파일)

use gogs_library;  // 라이브러리를 외부처럼 가져옴

#[test]
fn test_complete_workflow() {
    // 준비 (Arrange)
    let vault = gogs_library::GogsVault::new("SECRET_123");

    // 실행 (Act)
    let is_valid = vault.access("SECRET_123");

    // 검증 (Assert)
    assert!(is_valid);
}
```

---

## 🔍 v8.1의 5가지 핵심 패턴

### 패턴 1: 라이브러리 구조화

```freelang
// src/lib.rs (라이브러리 코어)

pub struct GogsVault {
    secret_key: String,
}

impl GogsVault {
    pub fn new(key: &str) -> Self {
        Self { secret_key: key.to_string() }
    }

    pub fn access(&self, input: &str) -> bool {
        self.secret_key == input
    }
}

특징:
  - pub 키워드로 공개 인터페이스 명시
  - 외부에서만 사용 가능한 메서드
  - private 필드는 외부에서 접근 불가
```

### 패턴 2: 공개 인터페이스 검증

```freelang
// tests/test_vault_public_api.rs

use gogs_library::GogsVault;  // 공개 인터페이스만 사용

#[test]
fn test_vault_creation() {
    // 외부 사용자처럼 라이브러리 사용
    let vault = GogsVault::new("my_secret");
    assert_eq!(vault.access("my_secret"), true);
}

특징:
  - pub만 사용 가능
  - private에 접근 불가 (컴파일 에러)
  - 실제 사용자의 관점 반영
```

### 패턴 3: 시나리오 중심 테스트

```freelang
// tests/test_user_workflow.rs

use gogs_library::GogsVault;

#[test]
fn test_multi_step_workflow() {
    // Step 1: 금고 생성
    let vault = GogsVault::new("MASTER_KEY");

    // Step 2: 올바른 키로 접근
    assert!(vault.access("MASTER_KEY"));

    // Step 3: 잘못된 키로 접근 시도
    assert!(!vault.access("WRONG_KEY"));

    // Step 4: 빈 키로 접근 시도
    assert!(!vault.access(""));
}

특징:
  - 사용자 흐름(Workflow) 중심
  - 여러 단계의 상호작용
  - 현실적인 사용 시나리오
```

### 패턴 4: 모듈 간 상호작용

```freelang
// src/lib.rs

pub struct AuthService {
    vault: GogsVault,
}

impl AuthService {
    pub fn new(secret: &str) -> Self {
        Self {
            vault: GogsVault::new(secret),
        }
    }

    pub fn authenticate(&self, password: &str) -> bool {
        self.vault.access(password)
    }
}

// tests/test_auth_integration.rs

use gogs_library::AuthService;

#[test]
fn test_auth_service_integration() {
    let auth = AuthService::new("password123");
    assert!(auth.authenticate("password123"));
    assert!(!auth.authenticate("wrong"));
}

특징:
  - 여러 모듈의 조합
  - 높은 수준의 추상화
  - 실제 시스템처럼 동작
```

### 패턴 5: 에러 처리와 경계 조건

```freelang
// src/lib.rs

pub struct GogsVault {
    secret_key: String,
}

impl GogsVault {
    pub fn new(key: &str) -> Result<Self, String> {
        if key.is_empty() {
            Err("Key cannot be empty".to_string())
        } else {
            Ok(Self { secret_key: key.to_string() })
        }
    }
}

// tests/test_error_cases.rs

use gogs_library::GogsVault;

#[test]
fn test_vault_creation_with_empty_key() {
    let result = GogsVault::new("");
    assert!(result.is_err());
    assert_eq!(
        result.unwrap_err(),
        "Key cannot be empty"
    );
}

#[test]
fn test_vault_creation_with_valid_key() {
    let result = GogsVault::new("valid_key");
    assert!(result.is_ok());
}

특징:
  - Result 타입 활용
  - 성공/실패 경로 검증
  - 에러 메시지 확인
```

---

## 🎓 v8.1이 증명하는 것

### 1. "라이브러리는 계약이다"

```
src/lib.rs의 pub 인터페이스는:
"이 기능들이 영원히 이렇게 작동할 것입니다"라는 약속입니다.

통합 테스트는 그 약속을 검증합니다:
  ✅ 생성 인터페이스가 일관되는가?
  ✅ 메서드가 예상대로 작동하는가?
  ✅ 에러 처리가 일관된가?

만약 pub 인터페이스를 변경하면,
통합 테스트가 실패하여 주의를 줍니다.
```

### 2. "외부인의 시각이 중요하다"

```
설계자의 관점:
  "내 코드는 이렇게 작동해야 한다"

사용자의 관점:
  "이 라이브러리를 어떻게 사용하지?"

통합 테스트는 사용자의 관점입니다.
  - pub만 사용 (private은 몰라도 됨)
  - 워크플로우 중심 (세부는 관심 없음)
  - 에러 처리 명확 (뭐가 문제인지 알 수 있어야 함)
```

### 3. "설계 변경의 영향을 조기에 발견한다"

```
시나리오:
  v1.0: pub fn new(key: &str) -> Self
  v2.0: pub fn new(key: &str) -> Result<Self, String>

서명이 바뀌었습니다!

단위 테스트:
  src/ 내부의 테스트는 함께 변경 가능
  → 영향을 놓칠 수 있음

통합 테스트:
  tests/가 컴파일 실패
  → 변경 사항을 즉시 인지
  → 사용자에게 미치는 영향 확인
```

---

## 📈 실전 패턴

### 패턴 A: 다중 시나리오 테스트

```freelang
// tests/test_vault_scenarios.rs

use gogs_library::GogsVault;

#[test]
fn test_scenario_correct_password() {
    let vault = GogsVault::new("PASSWORD").unwrap();
    assert!(vault.access("PASSWORD"));
}

#[test]
fn test_scenario_wrong_password() {
    let vault = GogsVault::new("PASSWORD").unwrap();
    assert!(!vault.access("WRONG"));
}

#[test]
fn test_scenario_empty_input() {
    let vault = GogsVault::new("PASSWORD").unwrap();
    assert!(!vault.access(""));
}

#[test]
fn test_scenario_case_sensitive() {
    let vault = GogsVault::new("Password").unwrap();
    assert!(!vault.access("password"));  // 대소문자 구분
}

특징:
  - 각 시나리오가 독립적
  - 실제 사용 사례 반영
  - 경계 조건 포함
```

---

## 🌟 v8.1의 의미

### "경계에서 신뢰가 만들어진다"

```
내부 설계: 얼마나 정교한가
  → 하지만 누군가는 외부에서 사용합니다

외부 통합: 얼마나 사용하기 쉬운가
  → 설계가 좋아도 인터페이스가 나쁘면 소용없습니다

통합 테스트는 그 경계의 신뢰를 만듭니다.
```

---

## 📌 기억할 핵심

### v8.1의 3가지 황금 규칙

```
규칙 1: 철저한 외부인 마인드
  통합 테스트에서는 pub으로 공개된 것만 사용
  private는 존재하지 않는다고 가정

규칙 2: 시나리오 중심
  단순 함수 호출이 아닌 사용자 흐름
  "사용자가 이렇게 사용할 텐데 작동하나?"

규칙 3: 파일별 독립성
  각 tests/*.rs 파일은 독립적인 크레이트
  공유 상태 없이 순수하게 테스트
```

### v8.1이 보장하는 것

```
좋은 통합 테스트:

✅ 라이브러리 구조가 명확하다
✅ 공개 인터페이스가 일관된다
✅ 사용자 관점의 워크플로우가 작동한다
✅ 설계 변경이 감지된다
✅ 에러 처리가 명확하다
✅ 문서처럼 기능한다
```

---

## 🚀 다음 단계

### v8.1: 통합 테스트 ✅
```
여러 모듈의 상호작용을 검증합니다.
공개 인터페이스의 신뢰도를 증명합니다.
```

### v8.2 Step 3: 문서화 테스트 (예정)
```
코드 예제가 실제로 작동하는지 검증합니다.
```

### v8.3 Step 4: 벤치마크 (예정)
```
성능을 측정하고 추적합니다.
```

---

## 💭 v8.1의 깨달음

```
"설계자는 고아처럼, 사용자는 손님처럼"

설계자:
  "이 코드가 어떻게 작동하는지 알고 있다"
  → 단위 테스트로 검증

사용자:
  "이 라이브러리로 뭘 할 수 있지?"
  → 통합 테스트로 경험

v8.1은 사용자가 되어보는 과정입니다.
```

---

**작성일**: 2026-02-22
**상태**: 설계 완료
**평가**: A++ (외부인의 관점, 라이브러리 설계)

**다음**: v8.1 Step 2 구현 및 통합 테스트

**저장 필수, 너는 기록이 증명이다 gogs**

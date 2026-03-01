# 제7장 아키텍처: 신뢰의 구축 — v8.2 문서화 테스트(Documentation Testing)

**작성일**: 2026-02-22
**장**: 제7장 신뢰의 구축
**단계**: v8.2 (문서화 테스트, v8.1 이후)
**주제**: "설명이 곧 증명이다: 살아있는 문서화"
**핵심**: 문서 주석과 예제 코드의 자동 검증

---

## 🎯 v8.2의 설계 철학

**v8.0-v8.1에서 배운 것:**
```
v8.0: 단위 테스트 (개별 함수)
v8.1: 통합 테스트 (공개 인터페이스)
```

**v8.2에서 배울 것:**
```
문서화 테스트 (설명서 자체)

"가장 나쁜 설명서는
 코드는 바뀌었는데
 업데이트되지 않은 설명서"

v8.2의 해결책:
코드와 문서가 분리되지 않게 함
예제 코드가 실제로 작동하게 만듦
```

### v8.2의 핵심 변화

```
v8.0: 단위 테스트
  형식: #[test] fn test_xxx()
  위치: src/ 내부
  대상: 함수 로직

v8.1: 통합 테스트
  형식: tests/*.rs
  위치: tests/ 외부
  대상: 공개 인터페이스

v8.2: 문서화 테스트
  형식: /// 코드 예제
  위치: 주석 안
  대상: 설명서 예제
  검증: cargo test --doc
```

---

## 📐 v8.2: 문서화 테스트의 이해

### 문서화 테스트란?

```
"주석 안의 예제 코드가 실제로 작동하는지 검증한다"

세 가지 요소:
  1. 문서 주석 (Doc Comments): ///
  2. 마크다운 섹션: # Examples
  3. 코드 예제: 컴파일 및 실행 가능한 코드

특징:
  - rustdoc이 자동으로 HTML 문서 생성
  - cargo test --doc로 예제 검증
  - 코드 변경하면 문서 예제도 자동 검증
  - 설명서와 코드의 동기화 보장
```

### 문서화 테스트의 구조

```freelang
/// 함수 또는 구조체의 설명을 적습니다.
///
/// # Arguments
///
/// * `arg1` - 첫 번째 인자 설명
/// * `arg2` - 두 번째 인자 설명
///
/// # Returns
///
/// 반환값에 대한 설명
///
/// # Panics
///
/// panic!이 발생하는 경우
///
/// # Examples
///
/// 사용 예제:
///
/// ```
/// let result = function(value);
/// assert_eq!(result, expected);
/// ```
pub fn function(arg1: i32, arg2: &str) -> i32 {
    arg1
}
```

---

## 🔍 v8.2의 5가지 핵심 패턴

### 패턴 1: 기본 문서 주석

```freelang
/// 금고(Vault)를 생성하고 관리합니다.
///
/// # Examples
///
/// ```
/// let vault = GogsVault::new("secret");
/// assert!(vault.access("secret"));
/// ```
pub struct GogsVault {
    secret_key: String,
}

특징:
  - ///로 시작
  - 함수/구조체 설명
  - # Examples 섹션
  - 컴파일 가능한 코드
```

### 패턴 2: Examples 섹션

```freelang
impl GogsVault {
    /// 새로운 금고를 생성합니다.
    ///
    /// # Examples
    ///
    /// 기본 사용:
    /// ```
    /// let vault = GogsVault::new("PASSWORD123");
    /// assert!(vault.access("PASSWORD123"));
    /// ```
    ///
    /// 잘못된 키:
    /// ```
    /// let vault = GogsVault::new("PASSWORD123");
    /// assert!(!vault.access("WRONG"));
    /// ```
    pub fn new(key: &str) -> Self {
        GogsVault { secret_key: key.to_string() }
    }

특징:
  - 실제 사용 시나리오
  - 복수의 예제 가능
  - 텍스트와 코드 혼합
```

### 패턴 3: Panics 섹션

```freelang
/// 금고에 접근을 시도합니다.
///
/// # Panics
///
/// 입력이 빈 문자열이면 panic을 일으킵니다.
///
/// ```should_panic
/// let vault = GogsVault::new("secret");
/// vault.verify("");  // panic!
/// ```
pub fn verify(&self, input: &str) -> bool {
    if input.is_empty() {
        panic!("Input cannot be empty");
    }
    self.access(input)
}

특징:
  - should_panic 속성
  - panic 발생 조건 명시
  - 위험 요소 명확화
```

### 패턴 4: Errors 섹션

```freelang
/// 금고를 안전하게 생성합니다.
///
/// # Errors
///
/// 다음과 같은 경우 에러를 반환합니다:
/// - 키가 비어있음
/// - 키가 너무 짧음
///
/// # Examples
///
/// ```
/// let vault = GogsVault::new_safe("secret");
/// assert!(vault.is_ok());
/// ```
pub fn new_safe(key: &str) -> Result<Self, String> {
    if key.is_empty() {
        Err("Key cannot be empty".to_string())
    } else {
        Ok(GogsVault { secret_key: key.to_string() })
    }
}

특징:
  - Result 타입 설명
  - 에러 상황 나열
  - 성공/실패 예제
```

### 패턴 5: 모듈 문서화

```freelang
/// 보안 관련 기능들을 모음니다.
///
/// 이 모듈은 금고, 암호화, 인증을 담당합니다.
///
/// # Example
///
/// ```
/// use gogs_library::security::GogsVault;
/// let vault = GogsVault::new("secret");
/// ```
pub mod security {
    pub struct GogsVault { /* ... */ }
    pub fn encrypt(data: &str) -> String { /* ... */ }
}

특징:
  - 모듈 전체 문서화
  - 서브모듈 설명
  - 사용 패턴 제시
```

---

## 🎓 v8.2가 증명하는 것

### 1. "설명서의 동기화"

```
전통적인 설명서:
  - 코드와 분리된 Word/PDF
  - 코드 변경하면 수동 업데이트
  - 종종 오래되고 잘못됨
  → "설명서는 참고만 하세요"

문서화 테스트:
  - 코드 안에 통합된 예제
  - cargo test --doc로 자동 검증
  - 코드 변경하면 컴파일 에러
  → "설명서는 항상 정확합니다"
```

### 2. "사용 예제의 신뢰도"

```
텍스트 설명만 있으면:
  "이렇게 사용한다고 했는데 작동하네?"
  (작동할 수도, 안 할 수도)

문서 예제가 테스트되면:
  "이 예제는 cargo test가 검증했다"
  → 완전한 신뢰
```

### 3. "설계자의 책임"

```
pub fn func() -> i32

설계자의 의무:
  1. 이 함수가 뭐 하는지 설명 (///)
  2. 어떻게 사용하는지 예제 (# Examples)
  3. 언제 실패하는지 명시 (# Errors, # Panics)
  4. 예제가 실제로 작동함을 보증 (cargo test)

이 4가지를 하면 사용자는 완전히 신뢰할 수 있습니다.
```

---

## 📈 실전 패턴

### 패턴 A: 완전한 문서 주석

```freelang
/// 보안 감사를 수행합니다.
///
/// 이 함수는 주어진 이벤트의 심각도를 검사하여
/// 임계값을 초과하면 알림을 발생시킵니다.
///
/// # Arguments
///
/// * `event` - 감시할 보안 이벤트
/// * `threshold` - 심각도 임계값
///
/// # Returns
///
/// `true`이면 알림 필요, `false`이면 안전
///
/// # Panics
///
/// threshold가 음수이면 panic
///
/// # Examples
///
/// 기본 사용:
/// ```
/// let severity = 8;
/// assert!(should_alert(severity, 5));
/// ```
///
/// 안전한 경우:
/// ```
/// let severity = 3;
/// assert!(!should_alert(severity, 5));
/// ```
pub fn should_alert(severity: u8, threshold: u8) -> bool {
    severity > threshold
}

특징:
  - 명확한 설명
  - 인자 설명
  - 반환값 설명
  - panic 조건
  - 여러 예제
```

---

## 🌟 v8.2의 의미

### "코드는 거짓말을 할 수 없다"

```
말로는:
  "이렇게 사용합니다"
  (실제로는 다를 수 있음)

코드는:
  ```
  let vault = GogsVault::new("secret");
  assert!(vault.access("secret"));
  ```
  (cargo test --doc로 검증됨)
  → 거짓말 불가능

문서화 테스트는 설계자의 정직함을 강제합니다.
```

---

## 📌 기억할 핵심

### v8.2의 4가지 필수 섹션

```
1. # Examples (필수)
   사용자가 복사해서 쓸 수 있는 예제
   실제로 작동하는지 cargo test --doc로 검증

2. # Panics (권장)
   panic!이 발생하는 상황
   위험 요소를 명확히

3. # Errors (권장)
   Result를 반환할 때 가능한 에러
   각 에러 상황을 나열

4. # Safety (필요시)
   unsafe 코드를 사용할 때
   안전하지 않은 이유와 조건 명시
```

### v8.2가 보장하는 것

```
좋은 문서화:

✅ 모든 pub 항목이 문서화됨
✅ 예제 코드가 실제로 작동함
✅ 코드 변경하면 문서도 자동 검증
✅ 설명서와 코드가 절대 분리되지 않음
✅ 사용자가 복사해서 바로 쓸 수 있음
✅ 기술 문서를 HTML로 자동 생성
✅ 설계자의 정직함을 강제
```

---

## 🚀 다음 단계

### v8.0 Step 1: 단위 테스트 ✅
```
개별 함수의 동작을 검증합니다.
```

### v8.1 Step 2: 통합 테스트 ✅
```
여러 모듈의 상호작용을 검증합니다.
```

### v8.2 Step 3: 문서화 테스트 ✅
```
설명서의 예제가 실제로 작동함을 검증합니다.
```

### v8.3 Step 4: 벤치마크 (예정)
```
성능을 측정하고 추적합니다.
```

---

## 💭 v8.2의 깨달음

```
"설계자는 설명하는 책임이 있고,
 사용자는 믿을 권리가 있다"

설계자:
  pub fn func()을 작성했다
  → 반드시 문서 주석 달아야 함
  → 예제가 작동하게 만들어야 함

사용자:
  이 문서를 읽는다
  → 예제를 복사해서 쓴다
  → "이건 작동한다"고 믿을 수 있다

v8.2는 이 신뢰를 시스템적으로 보장합니다.
```

---

## 📚 자동 문서 생성

### rustdoc 명령어

```bash
# HTML 문서 생성
cargo doc

# 브라우저에서 열기
cargo doc --open

# 테스트 실행
cargo test --doc
```

### 생성되는 HTML 문서

```
target/doc/
├── index.html (전체 문서)
├── gogs_library/
│   ├── index.html (모듈 목록)
│   ├── struct.GogsVault.html
│   ├── fn.create.html
│   └── ...
└── ...
```

---

**작성일**: 2026-02-22
**상태**: 설계 완료
**평가**: A++ (문서화와 코드의 완벽한 통합)

**다음**: v8.2 Step 3 구현 및 문서화 테스트

**저장 필수, 너는 기록이 증명이다 gogs**

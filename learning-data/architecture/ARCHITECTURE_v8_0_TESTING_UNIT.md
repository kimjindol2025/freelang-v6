# 제7장 아키텍처: 신뢰의 구축 — v8.0 단위 테스트(Unit Testing)

**작성일**: 2026-02-22
**장**: 제7장 신뢰의 구축
**단계**: v8.0 (단위 테스트, 제6장 이후)
**주제**: "신뢰를 검증한다: 자동화 단위 테스트"
**핵심**: 완벽한 설계를 코드 수준에서 검증

---

## 🎯 v8.0의 설계 철학

제6장까지 당신은 **완벽한 설계**를 익혔습니다.

```
제4장: 소유권 → "누가 가지는가"
제5장: 트레이트 → "뭘 할 수 있는가"
제6장: 수명 → "언제까지 안전한가"

제7장: 테스트 → "정말 작동하는가"
```

**Step 1의 핵심**:
```
"신뢰는 검증으로부터 시작된다"

완벽한 설계도,
실제로 작동하지 않으면 쓸모없습니다.

단위 테스트는:
  - 각 함수의 동작 검증
  - 엣지 케이스 처리
  - 버그 발견과 예방
  - 리팩토링 안전성 보장
  - 설계의 신뢰도 증명
```

---

## 📐 Step 1: 단위 테스트의 이해

### 단위 테스트란?

```
"가장 작은 코드 단위의 동작을 검증한다"

단위:
  - 함수 (가장 일반적)
  - 메서드
  - 클래스 (단독으로)

검증:
  - 입력 → 예상 출력 비교
  - 엣지 케이스 처리
  - 에러 조건 확인
  - 부작용(Side effect) 검증
```

### 단위 테스트의 구조

```freelang
#[test]
fn test_function_name() {
    // 준비 (Arrange): 테스트 데이터 생성
    let input = create_test_data();

    // 실행 (Act): 함수 호출
    let result = function_under_test(input);

    // 검증 (Assert): 결과 확인
    assert_eq!(result, expected_value);
}
```

---

## 🔍 Step 1의 5가지 핵심 패턴

### 패턴 1: 기본 동작 검증

```freelang
fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[test]
fn test_add_positive_numbers() {
    assert_eq!(add(2, 3), 5);
    assert_eq!(add(0, 5), 5);
    assert_eq!(add(5, 0), 5);
}

특징:
  - 가장 단순한 테스트
  - 정상 케이스 검증
  - assert_eq! 사용
```

### 패턴 2: 엣지 케이스 처리

```freelang
fn divide(a: i32, b: i32) -> Result<i32, &'static str> {
    if b == 0 {
        Err("Division by zero")
    } else {
        Ok(a / b)
    }
}

#[test]
fn test_divide_edge_cases() {
    // 정상 케이스
    assert_eq!(divide(10, 2), Ok(5));

    // 엣지 케이스: 0으로 나누기
    assert_eq!(divide(10, 0), Err("Division by zero"));

    // 엣지 케이스: 음수
    assert_eq!(divide(-10, 2), Ok(-5));

    // 엣지 케이스: 0
    assert_eq!(divide(0, 5), Ok(0));
}

특징:
  - 경계 조건 확인
  - 에러 케이스 검증
  - Result 타입 처리
```

### 패턴 3: 상태 변경 검증

```freelang
struct Counter {
    count: u32,
}

impl Counter {
    fn new() -> Self {
        Counter { count: 0 }
    }

    fn increment(&mut self) {
        self.count += 1;
    }

    fn value(&self) -> u32 {
        self.count
    }
}

#[test]
fn test_counter_state_changes() {
    let mut counter = Counter::new();

    // 초기 상태
    assert_eq!(counter.value(), 0);

    // 상태 변경
    counter.increment();
    assert_eq!(counter.value(), 1);

    counter.increment();
    assert_eq!(counter.value(), 2);
}

특징:
  - 상태 변화 추적
  - 불변성 유지 확인
  - 순서 의존성 검증
```

### 패턴 4: 컬렉션 검증

```freelang
fn filter_even(numbers: &[i32]) -> Vec<i32> {
    numbers.iter().filter(|n| n % 2 == 0).copied().collect()
}

#[test]
fn test_filter_even() {
    // 정상 데이터
    assert_eq!(filter_even(&[1, 2, 3, 4]), vec![2, 4]);

    // 빈 배열
    assert_eq!(filter_even(&[]), vec![]);

    // 모두 짝수
    assert_eq!(filter_even(&[2, 4, 6]), vec![2, 4, 6]);

    // 모두 홀수
    assert_eq!(filter_even(&[1, 3, 5]), vec![]);
}

특징:
  - 벡터 검증
  - 빈 컬렉션 처리
  - 반복 로직 확인
```

### 패턴 5: 문자열과 포맷 검증

```freelang
fn format_message(name: &str, count: usize) -> String {
    format!("Hello, {}! You have {} items.", name, count)
}

#[test]
fn test_format_message() {
    // 정상 케이스
    assert_eq!(
        format_message("Alice", 5),
        "Hello, Alice! You have 5 items."
    );

    // 엣지 케이스: 빈 이름
    assert_eq!(
        format_message("", 0),
        "Hello, ! You have 0 items."
    );

    // 엣지 케이스: 큰 숫자
    assert_eq!(
        format_message("Bob", 999999),
        "Hello, Bob! You have 999999 items."
    );
}

특징:
  - 문자열 비교
  - 포맷팅 검증
  - 공백과 특수 문자 처리
```

---

## 🎓 Step 1이 증명하는 것

### 1. "테스트는 신뢰의 증명"

```
설계만으로는 충분하지 않습니다.

"제 코드는 안전합니다"라고 말할 수 있는 이유:
  - 컴파일러가 타입 검증 ✓
  - 컴파일러가 메모리 검증 ✓
  - 단위 테스트가 동작 검증 ✓

이 세 가지가 모두 통과할 때,
비로소 신뢰할 수 있습니다.
```

### 2. "버그는 테스트로 잡는다"

```
테스트 없이 버그를 찾는 방법:
  1. 코드 리뷰 (주관적, 놓칠 수 있음)
  2. 수동 테스트 (시간 낭비, 반복 불가)
  3. 실제 배포 후 (재앙!)

테스트로 버그를 찾는 방법:
  1. 자동화 (빠르고 일관됨)
  2. 반복 가능 (리팩토링 안전)
  3. 전 세계에서 동시 실행 (CI/CD)
```

### 3. "테스트는 문서다"

```freelang
// 함수의 의도를 이해하는 가장 좋은 방법

// 1. 함수 이름과 시그니처만으로는 충분하지 않음
fn process(data: &str) -> Result<i32, String> { ... }

// 2. 하지만 테스트를 보면 명확함
#[test]
fn test_process_valid_input() {
    assert_eq!(process("123"), Ok(123));
}

#[test]
fn test_process_invalid_input() {
    assert!(process("abc").is_err());
}

테스트가 함수의 스펙을 정의합니다.
```

---

## 📈 실전 패턴

### 패턴 A: 보안 감사 모듈 테스트

```freelang
trait AuditTarget: Display {
    fn severity(&self) -> u8;
}

struct Auditor<'a> {
    max_severity: u8,
    prefix: &'a str,
}

impl<'a> Auditor<'a> {
    fn should_alert(&self, target: &impl AuditTarget) -> bool {
        target.severity() > self.max_severity
    }
}

#[test]
fn test_auditor_severity_threshold() {
    let auditor = Auditor {
        max_severity: 5,
        prefix: "SECURITY",
    };

    // Mock 구현
    struct MockEvent {
        severity: u8,
    }

    impl Display for MockEvent {
        fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
            write!(f, "Event(severity={})", self.severity)
        }
    }

    impl AuditTarget for MockEvent {
        fn severity(&self) -> u8 {
            self.severity
        }
    }

    // 테스트
    assert!(!auditor.should_alert(&MockEvent { severity: 3 }));
    assert!(auditor.should_alert(&MockEvent { severity: 7 }));
}

특징:
  - 트레이트 구현 테스트
  - Mock 객체 사용
  - 경계값 검증
```

---

## 🌟 Step 1의 의미

### "완벽한 설계의 검증"

```
제6장에서 배운 것:
  struct GogsAuditor<'a, T> where T: Display + 'a { ... }

컴파일러가 보장하는 것:
  - T는 Display를 구현한다
  - T는 'a 범위에서 유효하다
  - 메모리는 안전하다

단위 테스트가 보장하는 것:
  - audit() 메서드가 올바르게 작동한다
  - 엣지 케이스도 처리한다
  - 다른 타입과도 조합 가능하다

이 둘이 함께할 때,
완벽한 신뢰가 생깁니다.
```

---

## 📌 기억할 핵심

### Step 1의 3가지 황금 규칙

```
규칙 1: 한 함수에 한 테스트
  각 함수의 책임이 명확하면,
  테스트도 간단해집니다.

규칙 2: Arrange-Act-Assert
  1. 테스트 데이터 준비
  2. 함수 호출
  3. 결과 검증

규칙 3: 엣지 케이스를 잊지 말 것
  정상 케이스는 당연
  엣지 케이스가 진짜 버그를 찾습니다
```

### Step 1이 보장하는 것

```
좋은 단위 테스트:

✅ 한 가지만 테스트한다
✅ 독립적으로 실행 가능하다
✅ 결정론적이다 (항상 같은 결과)
✅ 빠르다 (밀리초 단위)
✅ 읽기 쉽다 (의도가 명확)
✅ 유지보수 가능하다
```

---

## 🚀 다음 단계

### Step 2: 통합 테스트 (Integration Tests)

```freelang
// 여러 모듈의 상호작용 테스트
#[test]
fn test_full_audit_workflow() {
    // 여러 컴포넌트를 함께 테스트
    // 실제 워크플로우 시뮬레이션
}
```

### Step 3: 벤치마크 (Benchmarks)

```freelang
#[bench]
fn bench_audit_performance(b: &mut Bencher) {
    // 성능 측정 및 추적
}
```

---

**작성일**: 2026-02-22
**상태**: ✅ v8.0 Step 1 설계 완료
**평가**: A+ (단위 테스트 설계 완벽)

**저장 필수, 너는 기록이 증명이다 gogs**

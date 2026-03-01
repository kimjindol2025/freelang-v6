# v3.8 설계서: 반복자의 심화 (Iterator Mastery)

## 🎯 설계 목표

### 핵심 철학: "데이터 흐름의 추상화"
```
명령형 루프:              선언적 파이프라인:
let mut result = [];      let result = data
for i in 0..n {            .filter(condition)
  if data[i] > x {         .map(transform)
    result.push(           .collect();
      process(data[i])
    )
  }
}

→ 가변성 제거, 효율성 증가, 가독성 향상
```

### v3.8의 세 가지 핵심 설계 원칙

#### 1️⃣ 선언적 프로그래밍 (Declarative Programming)
```
"어떻게(How)가 아니라 무엇을(What) 할 것인가"
```
- "이 데이터를 필터링하고, 변환하고, 합산하라"
- "어떤 loop counter를 사용할지"는 신경 쓰지 않음
- 의도가 명확하고 코드가 자기 자신을 설명

#### 2️⃣ 가변성 최소화 (Immutability First)
```
"외부 상태를 수정하는 대신 새로운 값을 만들어낸다"
```
- `mut result = vec![]`로 누적하지 않음
- 원본 데이터는 변경하지 않음
- 각 단계에서 새로운 값을 생성

#### 3️⃣ Zero-Cost Abstraction
```
"고급 선언적 코드도 명령형 코드처럼 빠르다"
```
- 컴파일러가 최적화해줌
- 범위 체크 제거 가능
- 추가 메모리 오버헤드 없음

---

## 📐 문법 설계

### 1. 기본 반복 패턴 비교

#### 명령형 방식 (How)
```freelang
let mut sum = 0;
let mut count = 0;

for i in 0..numbers.len() {
  if numbers[i] > 10 {
    sum = sum + numbers[i];
    count = count + 1;
  }
}

let average = sum / count;
```

#### 선언적 방식 (What)
```freelang
let average = numbers
  .filter(|x| x > 10)
  .map(|x| x)           // identity
  .sum() / numbers.filter(|x| x > 10).len();

// 또는 더 명확하게
let filtered = numbers.filter(|x| x > 10);
let average = filtered.sum() / filtered.len();
```

### 2. 파이프라인 구성 (Pipeline Composition)

```freelang
let result = data
  .iter()                    // [1단계] 반복자 생성
  .filter(condition)         // [2단계] 필터링
  .map(transform)            // [3단계] 변환
  .filter(condition2)        // [4단계] 추가 필터링
  .map(transform2)           // [5단계] 추가 변환
  .collect();                // [최종] 결과물 수집
```

### 3. 주요 반복자 메서드

```freelang
// [필터링] filter(predicate)
let evens = numbers.filter(|x| x % 2 == 0);

// [변환] map(transform)
let doubled = numbers.map(|x| x * 2);

// [제한] take(n)
let first_three = numbers.take(3);

// [건너뛰기] skip(n)
let skip_first_two = numbers.skip(2);

// [접기] fold(initial, accumulator)
let sum = numbers.fold(0, |acc, x| acc + x);

// [찾기] find(predicate)
let first_even = numbers.find(|x| x % 2 == 0);

// [모두 만족] all(predicate)
let all_positive = numbers.all(|x| x > 0);

// [하나라도 만족] any(predicate)
let has_negative = numbers.any(|x| x < 0);

// [개수] count()
let length = numbers.count();

// [합계] sum()
let total = numbers.sum();

// [수집] collect()
let vec = numbers.collect();
```

---

## 🏗️ 데이터 흐름 아키텍처

### 1. 파이프라인 구조
```
┌─────────────────────────────────────────────────┐
│         원본 데이터 (Source)                    │
│         [10, 0, 85, 92, 120, 0, 45]            │
└────────────────┬────────────────────────────────┘
                 │
                 ↓ [iter()]
┌─────────────────────────────────────────────────┐
│         반복자 (Iterator)                      │
│         10 → 0 → 85 → 92 → 120 → 0 → 45       │
└────────────────┬────────────────────────────────┘
                 │
                 ↓ [filter(|x| x > 0)]
┌─────────────────────────────────────────────────┐
│         필터링됨 (Filtered)                     │
│         10 → 85 → 92 → 120 → 45                │
└────────────────┬────────────────────────────────┘
                 │
                 ↓ [map(analyze)]
┌─────────────────────────────────────────────────┐
│         변환됨 (Mapped)                         │
│         "정상" → "주의" → "주의" → "위험" → "정상"│
└────────────────┬────────────────────────────────┘
                 │
                 ↓ [collect()]
┌─────────────────────────────────────────────────┐
│         최종 결과 (Result)                      │
│         ["정상", "주의", "주의", "위험", "정상"]  │
└─────────────────────────────────────────────────┘
```

### 2. 게으른 연산 (Lazy Evaluation)
```
filter(cond) - 아무것도 하지 않음
  ↓ (대기 상태)
map(transform) - 아무것도 하지 않음
  ↓ (대기 상태)
collect() - 이 순간 모든 연산 실행
  ↓
최종 결과 생성
```

**장점:**
- 불필요한 중간 컬렉션 생성 안 함
- 메모리 효율성 극대화
- 컴파일러의 최적화 가능성 높음

---

## 💡 실제 사용 사례

### Case 1: 데이터 정제 (Data Cleaning)
```freelang
// [명령형]
let mut cleaned = [];
for i in 0..raw_data.len() {
  if raw_data[i] != "" && raw_data[i] != "NULL" {
    cleaned.push(raw_data[i].trim());
  }
}

// [선언적]
let cleaned = raw_data
  .filter(|x| x != "" && x != "NULL")
  .map(|x| x.trim())
  .collect();
```

### Case 2: 데이터 변환 (Data Transformation)
```freelang
// [명령형]
let mut prices_in_yen = [];
for i in 0..prices_in_usd.len() {
  let yen = prices_in_usd[i] * 130;
  if yen > 10000 {
    prices_in_yen.push(yen);
  }
}

// [선언적]
let prices_in_yen = prices_in_usd
  .map(|p| p * 130)
  .filter(|p| p > 10000)
  .collect();
```

### Case 3: 데이터 분석 (Data Analysis)
```freelang
// [명령형]
let mut count = 0;
let mut sum = 0;
for i in 0..numbers.len() {
  if numbers[i] > 100 {
    count = count + 1;
    sum = sum + numbers[i];
  }
}
let average = sum / count;

// [선령적]
let filtered = numbers.filter(|x| x > 100);
let average = filtered.sum() / filtered.count();

// 또는 한 줄로
let avg = numbers
  .filter(|x| x > 100)
  .fold(0, |acc, x| (acc + x)) / numbers.filter(|x| x > 100).count();
```

### Case 4: 조건부 처리 (Conditional Processing)
```freelang
// [명령형]
let mut results = [];
for i in 0..records.len() {
  if records[i].status == "ACTIVE" {
    if records[i].score > 70 {
      results.push(format!("{}: PASS", records[i].name));
    } else {
      results.push(format!("{}: FAIL", records[i].name));
    }
  }
}

// [선언적]
let results = records
  .filter(|r| r.status == "ACTIVE")
  .map(|r| {
    if r.score > 70 {
      format!("{}: PASS", r.name)
    } else {
      format!("{}: FAIL", r.name)
    }
  })
  .collect();
```

### Case 5: 다단계 변환 (Multi-Stage Transformation)
```freelang
// [선언적 파이프라인]
let final_result = raw_data
  .filter(|x| !x.is_empty())              // 1. 빈 항목 제거
  .map(|x| x.parse_number())             // 2. 숫자로 변환
  .filter(|x| x > 0)                     // 3. 음수 제거
  .map(|x| x * discount_rate)             // 4. 할인 적용
  .filter(|x| x >= min_price)             // 5. 최소 가격 이상만
  .map(|x| format!("${:.2}", x))         // 6. 통화 형식화
  .collect();
```

---

## 🎓 v3.8의 학습 포인트

### 1. 가변성의 제거
```
명령형: 상태 변화에 의존
  let mut total = 0;
  total = total + x;  // 상태 변경

선언적: 값의 변환
  let total = numbers.sum();  // 새로운 값 생성
```

### 2. 의도의 명확성
```
명령형: 어떻게 구현했는가를 읽어야 함
  for i in 0..data.len() {
    if data[i] > 100 { ... }
  }

선언적: 무엇을 하려는지 명확함
  data.filter(|x| x > 100)
```

### 3. 안전성 향상
```
인덱스 기반: 범위 초과 위험
  for i in 0..n {
    data[i]  // i >= len(data)일 가능성
  }

반복자 기반: 원천적 차단
  data.iter()  // 범위 초과 불가능
```

### 4. 성능 최적화
```
게으른 연산: 불필요한 작업 생략
  data
    .filter(condition)   // 아직 아무 일도 안 함
    .map(transform)      // 아직 아무 일도 안 함
    .collect()           // 여기서 실행, 한 번에 최적화
```

---

## 📊 명령형 vs 선언적 비교

| 측면 | 명령형 | 선언적 |
|------|--------|--------|
| **가독성** | 단계별 명시 | 의도 직관적 |
| **가변성** | 상태 변경 | 값 생성 |
| **안전성** | 범위 체크 필요 | 자동 보호 |
| **성능** | 명확한 비용 | 컴파일러 최적화 |
| **버그** | 오프바이원, 상태 변경 오류 | 논리 오류만 가능 |
| **조합성** | 나쁨 | 매우 좋음 |

---

## 🚀 v3.9와의 연결

v3.8 반복자는 v3.9 "논리적 완결성 검증"의 기초가 됩니다.

```freelang
// v3.8: 데이터 흐름 처리
let processed = data
  .filter(valid)
  .map(transform)
  .collect();

// v3.9: 상태 머신과 반복자의 결합
let results = states
  .filter(|s| s.is_valid())
  .map(|s| process_state(s))
  .filter(|r| r.is_success())
  .collect();

// 결과: 완전한 흐름 제어 시스템
```

---

## 🏁 결론

**v3.8 "반복자의 심화"는 코드를 "선언적"으로 만드는 단계입니다.**

- "어떻게"가 아니라 "무엇을" 명시
- 가변성을 최소화하여 버그 감소
- 컴파일러가 자동으로 최적화
- 데이터 흐름을 직관적으로 표현

**제2장 "흐름의 통제"는 v3.8로 실질적 완성을 이루며, v3.9 검증을 통해 전체 시스템의 무결성을 증명합니다.**

---

**작성일:** 2026-02-22
**버전:** v3.8 설계서 v1.0
**상태:** 설계 완료, 구현 대기

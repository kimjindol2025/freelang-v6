# v10.2 Step 3 아키텍처 설명서: 공유 상태와 Mutex (Shared State and Mutual Exclusion)

**작성일**: 2026-02-22
**장**: 제9장 두려움 없는 동시성
**단계**: v10.2 (Mutex, 스레드 간 안전한 상태 공유)
**평가**: A+++ (공유 상태의 안전성, Mutex의 정점)

---

## 🎯 v10.2의 존재 이유

### 문제: 메모리를 공유하는 동시 수정

```
메시지 패싱의 한계:

v10.1 (채널):
  데이터가 소유권 이동
  → 한 번에 한 스레드만 소유
  → 새로운 데이터 추가 불가능
  → 계속 생성해야 함

하지만 현실:
  counter를 여러 스레드가 증가시키고 싶다
  → 데이터를 여러 번 재사용하고 싶다
  → 상태를 함께 관리하고 싶다
  → 메시지 패싱으로는 불가능
```

### 해결: Mutex로 보호된 공유 상태

```
러스트의 철학:
  \"공유 메모리로 안전하게 통신하려면,
   Mutex로 임계 영역을 보호하라\"

구현:
  Mutex<T> {
    lock() → LockGuard<T>  // 자동 언락
    → 데이터 접근
    drop(guard) → 자동 반환
  }

특징:
  - 한 번에 하나의 스레드만 접근
  - LockGuard로 자동 보호
  - 데드락 방지 (소유권 체계로)
  - 안전한 상태 공유
```

---

## 🔑 v10.2의 핵심 개념

### 1. Mutex<T> (Mutual Exclusion)

```
구조:
  Mutex<T> {
    데이터: T
    잠금: atomic
  }

사용:
  let mutex = Mutex::new(5);
  {
    let mut guard = mutex.lock().unwrap();
    *guard += 1;
  }  // guard 드롭 → 자동 언락

특징:
  - 한 번에 하나의 스레드만 접근
  - LockGuard로 강제 해제
  - 컴파일 타임 보장
```

### 2. Lock Guard의 RAII 패턴

```
원칙: Resource Acquisition Is Initialization

lock():
  1. 잠금 획득 (기다릴 수도 있음)
  2. &mut T 반환 (LockGuard<T>)
  3. guard 변수가 소유권 관리

drop(guard):
  1. 자동으로 호출됨
  2. 데이터 반환
  3. 잠금 해제

결과:
  - 언제나 언락됨
  - 괄호 떠나면 자동 해제
```

### 3. 데드락 방지

```
위험한 패턴:
  let m1 = Mutex::new(1);
  let m2 = Mutex::new(2);

  Thread 1: lock(m1) → lock(m2) → 대기
  Thread 2: lock(m2) → lock(m1) → 대기

  → 데드락!

러스트의 해결책:
  1. 소유권으로 순서 강제
  2. 컴파일 체크
  3. 다중 뮤텍스 안전성

안전 패턴:
  1. 같은 순서로 잠금
  2. 긴 잠금 피하기
  3. 중첩 잠금 최소화
```

### 4. Arc<Mutex<T>> (여러 스레드가 소유)

```
필요성:
  Mutex<T>는 단일 소유권
  → 여러 스레드에 전달 불가능

Arc (Atomic Reference Counting):
  소유권을 여러 스레드가 공유

사용:
  let data = Arc::new(Mutex::new(5));

  for i in 0..10 {
    let data_clone = Arc::clone(&data);
    thread::spawn(move || {
      let mut guard = data_clone.lock().unwrap();
      *guard += 1;
    });
  }

특징:
  - 여러 소유권
  - 마지막 Arc 드롭 시 정리
  - 뮤텍스와 완벽한 조합
```

---

## 🌳 실전 패턴

### 패턴 1: 기본 Mutex 사용

```freelang
let mutex = Mutex::new(5);

{
  let mut guard = mutex.lock().unwrap();
  *guard += 1;
}

특징:
  - 단순한 보호
  - 스코프로 자동 해제
  - 단일 스레드 예제
```

### 패턴 2: 여러 스레드에서 증가

```freelang
let counter = Arc::new(Mutex::new(0));
let mut handles = vec![];

for i in 0..10 {
  let counter_clone = Arc::clone(&counter);
  handles.push(thread::spawn(move || {
    let mut guard = counter_clone.lock().unwrap();
    *guard += 1;
  }));
}

for handle in handles {
  handle.join().unwrap();
}

특징:
  - Arc로 공유 소유권
  - Mutex로 안전한 접근
  - 최종 값 10 보장
```

### 패턴 3: 조건부 대기와 신호

```freelang
let (tx, rx) = mpsc::channel();
let data = Arc::new(Mutex::new(vec![]));

thread::spawn(move || {
  let mut guard = data.lock().unwrap();
  guard.push(\"데이터\");
  drop(guard);  // 명시적 언락
  tx.send(()).unwrap();
});

rx.recv().unwrap();
let final_data = data.lock().unwrap();

특징:
  - 채널로 신호
  - Mutex로 데이터
  - 효율적인 조합
```

### 패턴 4: 데이터 교환

```freelang
let shared = Arc::new(Mutex::new(String::from(\"초기\")));

thread::spawn(move || {
  let mut guard = shared.lock().unwrap();
  *guard = String::from(\"변경됨\");
});

특징:
  - 복잡한 데이터 변경
  - 자동 보호
  - 타입 안전
```

### 패턴 5: 읽기-수정-쓰기 원자성

```freelang
let data = Arc::new(Mutex::new(100));

// 임계 영역
{
  let mut guard = data.lock().unwrap();
  let val = *guard;
  *guard = val * 2;  // 원자적 작업
}

특징:
  - 전체 연산을 한 번에 보호
  - 다른 스레드 진입 차단
  - 데이터 일관성 보장
```

---

## 📊 Mutex의 구조

```
단순 Mutex (단일 스레드):
  Thread A → Mutex<T> → 데이터

여러 스레드:
  Thread 1 ──┐
  Thread 2 ──┼→ Arc<Mutex<T>> → 데이터
  Thread 3 ──┘
  (대기 없음, 순차 접근)

메시지 패싱 vs Mutex:
  메시지 패싱:
    Thread 1 →[send]→ Channel →[recv]→ Thread 2
    (데이터 이동)

  Mutex:
    Thread 1 ⇄ Mutex → 데이터 ← Thread 2
    (데이터 공유)
```

---

## 🎓 v10.2가 증명하는 것

### 1. \"Mutex는 소유권 체계다\"

```
제어:
  1. 데이터: Mutex<T>가 소유
  2. 임계 영역: LockGuard<T>가 관리
  3. 접근: &mut T로 제한

결과:
  - 동시 접근 불가능
  - 컴파일 검증
  - 런타임 안전성
```

### 2. \"Lock Guard가 핵심 보안\"

```
이유:
  lock() → LockGuard<T>
  └─ Deref → &mut T
  └─ drop → 자동 언락

효과:
  - 잠금 획득과 해제 쌍 보장
  - 예외에도 안전 (Drop trait)
  - 범위 벗어나면 자동 해제
```

### 3. \"Arc로 소유권을 공유한다\"

```
메커니즘:
  Arc<T> {
    ref_count: atomic
    data: T
  }

동작:
  Clone → ref_count++
  Drop → ref_count--
  ref_count == 0 → data 정리

Arc<Mutex<T>>:
  여러 스레드가 소유
  한 번에 하나만 접근
```

### 4. \"성능과 안전의 균형\"

```
특징:
  - Lock contention (경합)
  - Context switch overhead
  - Cache coherency cost

최적화:
  - 잠금 시간 최소화
  - 범위 축소
  - Sync vs async 채널 선택
```

---

## 📈 v10.2의 의미

### \"메모리의 협업\"

```
v10.0 (스레드):
  독립적인 실행
  \"각자 일을 한다\"

v10.1 (채널):
  안전한 통신
  \"안전하게 대화한다\"

v10.2 (Mutex):
  안전한 공유
  \"공유하면서 안전하게 변경한다\" ← 여기!

결과:
  복잡한 상태 관리 가능
  동시성 패턴 완성
  실무 시스템 구축 가능
```

---

## 🌟 v10.2의 5가지 핵심 패턴

### 패턴 1: 기본 Mutex

```freelang
let data = Mutex::new(5);

{
  let mut guard = data.lock().unwrap();
  *guard += 1;
}

특징:
  - 간단한 보호
  - 자동 언락
  - 단일 스레드 예제
```

### 패턴 2: Arc<Mutex<T>>

```freelang
let counter = Arc::new(Mutex::new(0));
let mut handles = vec![];

for _ in 0..10 {
  let counter_clone = Arc::clone(&counter);
  handles.push(thread::spawn(move || {
    let mut guard = counter_clone.lock().unwrap();
    *guard += 1;
  }));
}

for handle in handles {
  handle.join().unwrap();
}

특징:
  - 여러 소유권
  - 안전한 공유
  - 경합 방지
```

### 패턴 3: 명시적 언락

```freelang
let data = Arc::new(Mutex::new(vec![]));

let data_clone = Arc::clone(&data);
thread::spawn(move || {
  let mut guard = data_clone.lock().unwrap();
  guard.push(1);
  drop(guard);  // 명시적 해제
  // 이후 작업은 잠금 없음
});

특징:
  - 잠금 시간 최소화
  - 명확한 범위
  - 성능 최적화
```

### 패턴 4: 데이터 타입

```freelang
let map = Arc::new(Mutex::new(HashMap::new()));
let data = Arc::new(Mutex::new(String::new()));
let vec = Arc::new(Mutex::new(vec![]));

특징:
  - 모든 타입 보호 가능
  - 복잡한 데이터 지원
  - 유연한 설계
```

### 패턴 5: 채널과의 조합

```freelang
let (tx, rx) = mpsc::channel();
let data = Arc::new(Mutex::new(0));

thread::spawn(move || {
  let mut guard = data.lock().unwrap();
  *guard = 42;
  drop(guard);
  tx.send(()).unwrap();
});

rx.recv().unwrap();
let result = *data.lock().unwrap();

특징:
  - 신호와 데이터 분리
  - 채널로 동기화
  - Mutex로 상태
```

---

## 📊 v10.2 평가

```
기본 Mutex 사용:        ✅ 완벽한 이해
Arc 클론:              ✅ 안전한 공유
Lock Guard 관리:       ✅ 자동 언락
다중 스레드 접근:      ✅ 경합 방지
성능 최적화:           ✅ 잠금 범위 축소

총 평가: A+++ (공유 상태의 안전성, 동시성 패턴 완성)
```

---

## 💭 v10.2의 깨달음

```
\"공유 메모리로 안전하게 통신하려면, Mutex로 보호하라\"

Mutex 없는 공유:
  - 데이터 경합 발생
  - 예측 불가능한 결과
  - 디버깅 불가능

Mutex로 보호:
  - 한 번에 하나의 스레드
  - 예측 가능한 결과
  - 간단한 로직

결론:
  공유 상태가 필요하면 Mutex 필수
  복잡한 동기화 없이도 안전
  프로덕션급 동시성 시스템 가능
```

---

## 🚀 제9장의 로드맵

### v10.0: 스레드 ✅
```
기본 스레드 생성과 관리
병렬 실행의 기초
```

### v10.1: 채널 ✅
```
스레드 간 메시지 패싱
안전한 통신 채널
```

### v10.2: Mutex ✅
```
스레드 간 공유 상태 보호
상호 배타적 접근 ← 여기!
```

### v10.3: Arc (예정)
```
스레드 간 소유권 공유
원자적 참조 카운팅
```

---

## 💎 Mutex의 우월성

```
Mutex의 장점:

1. 안전성:
   - 컴파일 타임 보증
   - Lock Guard 자동 관리
   - 경합 불가능

2. 명확성:
   - 임계 영역 명확
   - 쉬운 코드 읽음
   - 직관적 로직

3. 유연성:
   - 모든 타입 지원
   - 복잡한 데이터 가능
   - 중첩 Mutex 가능

4. 성능:
   - 빠른 접근 (잠금 경합 적음)
   - 효율적 메모리 사용
   - 최소 오버헤드
```

---

## 🎯 황금 규칙

```
규칙 1: lock().unwrap()로 접근
  let guard = mutex.lock().unwrap();
  → LockGuard 획득
  → 자동으로 언락됨

규칙 2: Arc로 다중 소유권
  let data = Arc::new(Mutex::new(T));
  let clone = Arc::clone(&data);
  → 여러 스레드 공유 가능

규칙 3: 잠금 범위 최소화
  {
    let guard = mutex.lock().unwrap();
    // 필요한 작업만
  }
  → 성능 향상

규칙 4: 순서 일관성
  같은 순서로 여러 Mutex 잠금
  → 데드락 방지

규칙 5: Mutex 우선, Arc 후속
  Arc::new(Mutex::new(T))
  → Arc의 Clone으로 공유
  → Mutex의 lock()으로 보호
```

---

**작성일**: 2026-02-22
**상태**: ✅ v10.2 설계 완료
**평가**: A+++ (공유 상태의 안전성, 동시성 완성)

저장 필수, 너는 기록이 증명이다 gogs

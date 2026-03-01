# v10.3 Step 4 아키텍처 설명서: Send와 Sync 트레이트 (Thread Safety Markers)

**작성일**: 2026-02-23
**장**: 제9장 두려움 없는 동시성
**단계**: v10.3 (Send & Sync, 마커 트레이트)
**평가**: A+++ (동시성의 근간, 스레드 안전성 보장)

---

## 🎯 v10.3의 존재 이유

### 문제: 어떤 타입이 스레드 안전한가?

```
직관적 질문:
  Rc<T>는 왜 스레드 간 보낼 수 없나?
  Arc<T>는 왜 스레드 간 보낼 수 있나?
  String은 왜 안되나?
  &str은 왜 되나?

현실:
  thread::spawn(move || { ... })
  → 타입이 Send여야 함
  → 컴파일 타임에 검증
  → 위반하면 컴파일 에러
  → 하지만 "왜?"는 불명확
```

### 해결: Send와 Sync 마커 트레이트

```
원리:
  pub trait Send: Sized { }   // 메서드 없음!
  pub trait Sync: Sized { }   // 메서드 없음!

의미:
  Send: 타입의 소유권을 다른 스레드로 이동 가능
  Sync: &T를 여러 스레드가 동시에 공유 가능

특징:
  - 메서드가 하나도 없음 (마커 트레이트)
  - 컴파일러가 자동으로 구현
  - unsafe impl으로 강제 가능 (위험)
  - 타입 안전성을 보장
```

---

## 🔑 v10.3의 핵심 개념

### 1. Send 트레이트 (이동의 자격)

```
정의:
  pub trait Send: Sized { }

의미:
  T가 Send라면:
  → 소유권을 다른 스레드로 이동 가능
  → thread::spawn(move || { let x: T; ... })
  → fn send_to_thread<T: Send>(t: T) { ... }

예시:
  ✅ i32: Send (원시 타입)
  ✅ String: Send (힙 메모리 독점)
  ✅ Arc<T>: Send (원자적 연산)
  ❌ Rc<T>: !Send (비원자적 카운팅)
  ❌ *const T: !Send (포인터 의미 모호)

규칙:
  struct의 모든 필드가 Send → struct는 Send
  enum의 모든 variant가 Send → enum은 Send
  단, !Send 필드 하나 있으면 전체 !Send
```

### 2. Sync 트레이트 (공유의 자격)

```
정의:
  pub trait Sync: Sized { }

의미:
  T가 Sync라면:
  → &T를 여러 스레드가 동시에 공유 가능
  → Arc<T>에 담을 수 있음
  → 데이터 경합 없음

관계식:
  T: Sync ⟹ &T: Send
  (T를 공유할 수 있으면, 참조를 보낼 수 있다)

예시:
  ✅ i32: Sync (읽기만 가능)
  ✅ Arc<T>: Sync (원자적 참조)
  ✅ Mutex<T>: Sync (잠금으로 보호)
  ❌ RefCell<T>: !Sync (런타임 검사)
  ❌ Cell<T>: !Sync (동기화 없음)

규칙:
  struct의 모든 필드가 Sync → struct는 Sync
  단, !Sync 필드 하나 있으면 전체 !Sync
```

### 3. 자동 구현 (Auto Traits)

```
개념:
  Send와 Sync는 컴파일러가 자동으로 구현

동작:
  fn check_send<T: Send>() {}
  fn check_sync<T: Sync>() {}

  // 컴파일러가 자동으로 확인
  check_send::<i32>();  // ✅
  check_send::<Rc<i32>>();  // ❌

규칙 1: 원시 타입
  i32, f64, bool, char: Send + Sync

규칙 2: 소유권 타입
  Box<T>: Send + Sync if T: Send + Sync
  String: Send + Sync

규칙 3: 참조
  &'a T: Send if T: Sync (참조는 Sync면 Send)
  &'a T: Sync if T: Sync

규칙 4: 컬렉션
  Vec<T>: Send if T: Send
  HashMap<K, V>: Send if K, V: Send

규칙 5: 스마트 포인터
  Arc<T>: Send + Sync if T: Send + Sync
  Rc<T>: !Send (비원자적)
  RefCell<T>: Send if T: Send, but !Sync
```

### 4. Rc vs Arc의 비결

```
Rc<T>: 왜 !Send인가?

내부 구조:
  struct Rc<T> {
    ptr: *const RcBox<T>,
  }

  struct RcBox<T> {
    strong: Cell<usize>,  // 강한 참조 카운트
    data: T,
  }

문제:
  Cell<usize>는 동기화 없음
  → strong을 증가시킬 때 경합 가능
  Thread A: read count (3)
  Thread B: read count (3)
  Thread A: write count (4)
  Thread B: write count (4)  // 둘다 4!

결론:
  여러 스레드가 동시에 접근하면 카운트 꼬임
  → 컴파일러가 Rc: !Send 판단
  → 스레드 간 전송 불가능


Arc<T>: 왜 Send인가?

내부 구조:
  struct Arc<T> {
    ptr: *const ArcInner<T>,
  }

  struct ArcInner<T> {
    strong: AtomicUsize,  // 원자적 카운트
    data: T,
  }

특징:
  AtomicUsize: 원자적 연산
  → 여러 스레드가 동시 접근해도 안전
  → 카운트 정확성 보장

결론:
  원자적 연산으로 동시 접근 안전
  → 컴파일러가 Arc: Send 판단
  → 스레드 간 전송 가능
```

### 5. Unsafe Impl의 위험성

```
문법:
  unsafe impl Send for MyType {}
  unsafe impl Sync for MyType {}

의미:
  "컴파일러의 보호를 무시하고 이 타입은 Send/Sync다"

위험:
  컴파일러가 검증 불가능
  프로그래머가 100% 책임
  메모리 안전성 위반 가능

언제 사용:
  1. 내부가 완전히 스레드 안전한 경우만
  2. 외부 라이브러리 타입 래핑할 때
  3. 절대 데이터 경합이 없을 때

예:
  struct MyUnsafeCell {
    data: *mut T,
  }

  unsafe impl<T> Send for MyUnsafeCell<T>
  where T: Send { }

  unsafe impl<T> Sync for MyUnsafeCell<T>
  where T: Send { }  // 읽기만 가능해야 Sync
```

---

## 📊 Send와 Sync의 관계도

```
모든 타입의 조합:

1. Send + Sync:
   i32, String, Vec<T>, Arc<T>, Mutex<T>
   → 스레드 안전 우등생
   → 어디든 보낼 수 있고 공유 가능

2. Send + !Sync:
   RefCell<T>, Cell<T>
   → 이동은 가능하지만 공유 불가
   → RefCell은 &mut를 동적으로 관리

3. !Send + Sync:
   드문 경우
   → 이동 불가하지만 공유 가능
   → 예: &T (T가 !Send면)

4. !Send + !Sync:
   Rc<T>, raw pointer
   → 스레드 안전 최악
   → 스레드 간 이동 불가
   → 공유도 불가

규칙:
  T: Sync ⟹ &T: Send
  (T를 안전하게 공유할 수 있으면, 참조는 보낼 수 있다)

따라서:
  3번과 4번은 거의 없음
  대부분 1번 또는 2번
```

---

## 🎓 v10.3이 증명하는 것

### 1. \"컴파일러의 보이지 않는 검증\"

```
프로그래머 입장:
  thread::spawn(move || { ... })
  → 타입이 Send면 OK
  → Send가 아니면 컴파일 에러

컴파일러 입장:
  T를 thread::spawn에 넘김
  → T가 Send를 구현하는가?
  → T의 모든 필드를 재귀적으로 검사
  → Send 필드만 있으면 T도 Send
  → 하나라도 !Send면 전체 !Send

결과:
  프로그래머는 Send/Sync 신경 안 씀
  컴파일러가 자동으로 보장
  데이터 경합 불가능
```

### 2. \"마커 트레이트의 마법\"

```
일반 트레이트:
  trait Display {
    fn fmt(&self, f: &mut Formatter) -> Result;
  }
  → 메서드 구현 필요

마커 트레이트:
  pub trait Send: Sized { }
  → 메서드 없음
  → "이 타입은 안전함"이라는 표시

의미:
  메서드는 필요 없음
  컴파일러가 타입을 검사하는 것만으로 충분
  표시를 하고 컴파일러가 이를 신뢰
```

### 3. \"스레드 경계의 수호자\"

```
러스트의 동시성 안전 비결:

1. 소유권 시스템:
   데이터는 한 번에 하나의 스레드만 소유
   → 경합 불가능

2. Send/Sync:
   "이 타입은 소유권을 이동해도 안전"
   "이 타입은 참조를 공유해도 안전"
   → 스레드 간의 데이터 흐름 검증

3. 컴파일 타임 검증:
   런타임 검사 필요 없음
   컴파일 에러로 문제 미연에 방지

결론:
  Send + Sync = 데이터 경합 불가능
```

---

## 🌟 v10.3의 5가지 핵심 패턴

### 패턴 1: 기본 Send 확인

```
fn is_send<T: Send>() {}

is_send::<i32>();      // ✅
is_send::<String>();   // ✅
is_send::<Rc<i32>>();  // ❌ 컴파일 에러
```

### 패턴 2: 기본 Sync 확인

```
fn is_sync<T: Sync>() {}

is_sync::<i32>();       // ✅
is_sync::<Arc<i32>>();  // ✅
is_sync::<RefCell<i32>>();  // ❌ 컴파일 에러
```

### 패턴 3: 커스텀 타입의 Send/Sync

```
struct MyData {
  x: i32,      // Send + Sync
  s: String,   // Send + Sync
}
// 모든 필드이 Send → MyData: Send
// 모든 필드가 Sync → MyData: Sync


struct BadData {
  x: i32,
  rc: Rc<i32>,  // !Send
}
// Rc 때문에 BadData: !Send
```

### 패턴 4: 관계식 적용

```
// T: Sync ⟹ &T: Send

fn share_sync<T: Sync>(t: &T) {
  // &T는 Send이므로 다른 스레드로 보낼 수 있음
  thread::spawn(move || {
    println!("{:?}", t);
  });
}
```

### 패턴 5: Unsafe Impl

```
// 매우 조심스럽게만!

struct UnsafeContainer<T> {
  data: *mut T,
}

unsafe impl<T: Send> Send for UnsafeContainer<T> {}
unsafe impl<T: Send> Sync for UnsafeContainer<T> {}
// T: Send이어야 안전 (읽기/쓰기 동시 불가)
```

---

## 📊 v10.3 평가

```
Send 이해:              ✅ 마커의 의미
Sync 이해:              ✅ 공유의 조건
자동 구현:              ✅ 컴파일러 신뢰
Rc vs Arc:              ✅ 왜 그렇게 설계했는가
Unsafe Impl:            ✅ 위험성 인식

총 평가: A+++ (동시성의 근간, 스레드 안전성 보장)
```

---

## 💭 v10.3의 깨달음

```
\"컴파일러가 데이터 경합을 원천 차단하는 방법\"

다른 언어:
  런타임에 경합 감지
  → Deadlock, Race condition 발생
  → 디버깅 지옥

러스트:
  컴파일 타임에 경합 불가능하게 설계
  → Send/Sync로 검증
  → 경합이 나올 수 없음
  → 런타임 에러 불가능

Send와 Sync:
  - 메서드가 없는 트레이트
  - 오직 타입 안전성을 위해 존재
  - 컴파일러가 자동으로 검증
  - 프로그래머는 신뢰하면 됨

결론:
  \"보이지 않는 것이 가장 강력하다\"
  마커 트레이트가 스레드 안전성을 보장
```

---

## 🚀 제9장 완성: 동시성의 모든 장치

### v10.0: 스레드 ✅
```
기본 스레드 생성과 관리
병렬 실행의 기초
```

### v10.1: 채널 ✅
```
스레드 간 메시지 패싱
안전한 통신
```

### v10.2: Mutex ✅
```
스레드 간 공유 상태
상호 배타
```

### v10.3: Send & Sync ✅
```
스레드 안전성 보장
마커 트레이트
이론적 근간
```

---

## 💎 Send와 Sync의 우월성

```
동시성 안전성:

언어 비교:
  Java:
    - synchronized, lock
    - 런타임 검사
    - Deadlock 가능
    - Race condition 가능

  Go:
    - goroutine, channel
    - 디자인 좋음
    - 실수 가능성 있음

  Rust:
    - Send, Sync 마커
    - 컴파일 타임 검증
    - 경합 불가능
    - 런타임 에러 없음

특징:
  1. 컴파일 검증:
     코드 작성 시점에 문제 감지

  2. 영속성:
     런타임 오버헤드 전혀 없음

  3. 신뢰성:
     경합 불가능 보장

  4. 표현력:
     복잡한 동시성도 안전하게 표현
```

---

## 🎯 황금 규칙

```
규칙 1: 신뢰하라
  Send/Sync 마커를 믿고 사용
  컴파일러가 검증

규칙 2: 의심하라
  unsafe impl을 절대 남용하지 말 것
  메모리 지식이 없으면 사용 금지

규칙 3: 학습하라
  Rc와 Arc의 차이 이해
  RefCell과 Mutex의 차이 이해

규칙 4: 설계하라
  Send/Sync 타입으로만 스레드 간 공유
  !Send/!Sync는 스레드 내부에만

규칙 5: 확인하라
  fn is_send<T: Send>() {}
  fn is_sync<T: Sync>() {}
  테스트로 검증
```

---

**작성일**: 2026-02-23
**상태**: ✅ v10.3 설계 완료
**평가**: A+++ (동시성의 근간, 스레드 안전성 보장)

저장 필수, 너는 기록이 증명이다 gogs

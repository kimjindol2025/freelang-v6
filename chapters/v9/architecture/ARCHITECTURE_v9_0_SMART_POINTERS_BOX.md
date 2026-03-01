# 제8장 아키텍처: 스마트 포인터 — v9.0 Box<T>와 힙 할당(Smart Pointers with Box<T>)

**작성일**: 2026-02-22
**장**: 제8장 스마트 포인터와 메모리의 심연
**단계**: v9.0 (Box<T>, 첫 스마트 포인터)
**주제**: "메모리 위치의 최적화: 스택 vs 힙"
**핵심**: 힙 할당을 통한 동적 메모리 관리

---

## 🎯 v9.0의 설계 철학

**지금까지 배운 것:**
```
제4장: 소유권 (Ownership)
제5장: 트레이트 (Traits)
제6장: 수명 (Lifetimes)
제7장: 테스트 (Testing)

모두 스택(Stack) 위의 메모리를 다뤘습니다.
```

**v9.0부터 배울 것:**
```
제8장: 스마트 포인터 (Smart Pointers)

스택 vs 힙(Heap)
동적 메모리 할당
재귀적 데이터 구조

메모리 위치를 직접 선택합니다.
```

### v9.0의 핵심 변화

```
스택(Stack):
  - 컴파일 타임에 크기 결정
  - 빠르지만 제한적
  - LIFO(Last In First Out)

힙(Heap):
  - 런타임에 크기 결정
  - 유연하지만 약간 느림
  - 포인터(주소)로 접근

Box<T>:
  - 데이터를 힙에 저장
  - 스택에는 포인터만 저장
  - 크기를 컴파일 타임에 모를 때 사용
```

---

## 📐 v9.0: Box<T>의 이해

### Box<T>란?

```
"데이터를 힙에 저장하고, 그 주소를 스택에 보관하는 포인터"

특징:
  - 힙 할당 (Heap Allocation)
  - 소유권 이동 (Move Semantics)
  - 자동 해제 (RAII - Resource Acquisition Is Initialization)
  - 컴파일 타임 크기 검증 불필요

사용:
  let boxed = Box::new(5);
  → 5를 힙에 저장하고, boxed는 그 주소
  → boxed를 역참조: *boxed = 5
```

### Box<T>의 구조

```
┌─────────────────────────────┐
│ 스택 (Stack)                 │
├─────────────────────────────┤
│ boxed: Box<i32>             │
│ ├─ ptr: 0x1000 (힙 주소)    │
│ └─ capacity, length (메타)  │
└─────────────────────────────┘

        ↓ 포인터

┌─────────────────────────────┐
│ 힙 (Heap)                    │
├─────────────────────────────┤
│ 0x1000: [5]                 │
│ (실제 데이터)                │
└─────────────────────────────┘
```

---

## 🔍 v9.0의 5가지 핵심 패턴

### 패턴 1: 기본 Box<T> 사용

```freelang
// 스택 vs 힙
let x = 5;                    // 스택: i32
let boxed = Box::new(5);      // 힙: i32, 스택: 포인터

// 역참조
println!(*boxed);             // 5 (역참조로 접근)

// 크기 비교
println!(size_of_val(&x));       // 4 바이트
println!(size_of_val(&boxed));   // 8 바이트 (포인터)

특징:
  - 힙에 저장된 데이터
  - 포인터로 접근
  - 스코프를 벗어나면 자동 해제
```

### 패턴 2: 재귀적 데이터 구조

```freelang
#[derive(Debug)]
enum GogsNode {
    // Box 없으면: 컴파일 에러
    // "recursive type has infinite size"
    Data(i32, Box<GogsNode>),
    Nil,
}

// 사용
let list = GogsNode::Data(1,
    Box::new(GogsNode::Data(2,
        Box::new(GogsNode::Data(3,
            Box::new(GogsNode::Nil))))));

특징:
  - 크기를 컴파일 타임에 알 수 없음
  - Box로 다음 노드 포인터만 저장
  - 무한 크기 문제 해결
```

### 패턴 3: 큰 데이터 효율화

```freelang
// 스택에 저장: 복사 비용 높음
fn process_stack(data: Vec<i32>) {
    // 전체 벡터 복사 (큰 비용)
}

// 힙에 저장: 포인터만 이동
fn process_heap(data: Box<Vec<i32>>) {
    // 포인터만 이동 (작은 비용)
}

// 사용
let big_vec = vec![1, 2, 3, ..., 1000000];  // 100만 요소
let boxed = Box::new(big_vec);
process_heap(boxed);  // 포인터만 이동

특징:
  - 큰 데이터는 힙에
  - 소유권 이동 효율화
  - 성능 극대화
```

### 패턴 4: 다형성 (Trait Objects)

```freelang
trait Displayable {
    fn display(&self) -> String;
}

struct Message { text: String }
impl Displayable for Message {
    fn display(&self) -> String { self.text.clone() }
}

// Box<dyn Trait>
fn print_item(item: Box<dyn Displayable>) {
    println!("{}", item.display());
}

// 사용
let msg = Message { text: "Hello".to_string() };
print_item(Box::new(msg));

특징:
  - Box<dyn Trait> (트레이트 객체)
  - 런타임 다형성
  - 여러 타입을 하나처럼 다룸
```

### 패턴 5: 안전한 메모리 해제

```freelang
{
    let boxed = Box::new(5);
    // 힙에서 5를 사용
}  // 스코프 끝 → 자동으로 힙 메모리 해제

// 의도적 해제
let boxed = Box::new(vec![1, 2, 3, ..., 1000000]);
drop(boxed);  // 명시적 해제

특징:
  - RAII (Resource Acquisition Is Initialization)
  - 스코프 자동 해제
  - 메모리 누수 없음
  - drop() 함수로 명시적 해제 가능
```

---

## 🎓 v9.0이 증명하는 것

### 1. "컴파일 타임 크기 문제의 해결"

```
문제:
  enum Node {
      Data(i32, Node),  // 컴파일 에러!
      Nil,
  }
  → Node의 크기 = 4 (i32) + ??? (Node) = 무한대?

해결:
  enum Node {
      Data(i32, Box<Node>),  // OK!
      Nil,
  }
  → Node의 크기 = 4 (i32) + 8 (포인터) = 12 바이트

Box의 역할:
  컴파일러가 크기를 알 수 있게 만듭니다.
  → 포인터는 항상 8바이트(64비트)로 고정
```

### 2. "메모리 위치의 최적화"

```
스택의 문제:
  - 크기가 크면 스택 오버플로우
  - 함수 호출 시 매번 복사 (비효율)

힙의 해결책:
  - 크기 제한 없음
  - 포인터만 이동 (효율적)

Box<T>:
  설계자가 선택할 수 있게 해줍니다.
```

### 3. "자동 메모리 관리의 안전성"

```
C: malloc/free (수동)
  → 개발자 실수로 메모리 누수 가능

Rust with Box<T>:
  ```
  let boxed = Box::new(data);
  ```
  → 스코프 벗어나면 자동 해제
  → 메모리 누수 불가능
  → 컴파일러가 검증
```

---

## 📈 실전 패턴

### 패턴 A: 연결 리스트 (Cons List)

```freelang
#[derive(Debug)]
enum ConsList {
    Cons(i32, Box<ConsList>),
    Nil,
}

impl ConsList {
    fn head(&self) -> Option<i32> {
        match self {
            ConsList::Cons(h, _) => Some(*h),
            ConsList::Nil => None,
        }
    }

    fn tail(&self) -> Option<&ConsList> {
        match self {
            ConsList::Cons(_, t) => Some(t),
            ConsList::Nil => None,
        }
    }
}

// 사용
let list = ConsList::Cons(1,
    Box::new(ConsList::Cons(2,
        Box::new(ConsList::Cons(3,
            Box::new(ConsList::Nil))))));

println!("Head: {:?}", list.head());
println!("Tail: {:?}", list.tail());

특징:
  - Box 없으면 불가능
  - 동적 크기
  - 안전한 메모리 관리
```

---

## 🌟 v9.0의 의미

### "메모리의 설계자 지위 획득"

```
지금까지:
  스택만 사용
  → 타입 안전성 높음
  → 크기 제약 있음

v9.0부터:
  힙도 사용 가능
  → 여전히 타입 안전
  → 크기 제약 없음
  → 성능 최적화 가능

코드 설계자로서 선택:
  "이 데이터는 스택에 쌓고"
  "저 데이터는 힙에 할당하자"
```

---

## 📌 기억할 핵심

### v9.0의 3가지 황금 규칙

```
규칙 1: 언제 Box<T>를 사용하는가?
  - 컴파일 타임에 크기를 모를 때
  - 재귀적 데이터 구조
  - 매우 큰 데이터
  - 트레이트 객체

규칙 2: Box<T>의 생명주기
  - 생성: Box::new(data)
  - 사용: *boxed로 역참조
  - 소유권 이동 가능
  - 스코프 벗어나면 자동 해제

규칙 3: 성능 고려
  - 포인터는 항상 8바이트
  - 역참조 비용 미미
  - 전체적으로는 효율적
  - 메모리 단편화 고려 가능
```

### v9.0이 보장하는 것

```
Box<T>의 특성:

✅ 메모리 안전성 보장
✅ 크기 결정 문제 해결
✅ 자동 메모리 해제
✅ 소유권 이동 추적
✅ 컴파일 타임 검증
✅ 런타임 오버헤드 최소
✅ 메모리 누수 없음
```

---

## 🚀 다음 단계

### v9.0: Box<T> ✅
```
단일 소유권으로 힙 메모리 관리
```

### v9.1: Rc<T> (예정)
```
여러 소유자가 데이터를 공유
```

### v9.2: RefCell<T> (예정)
```
런타임 빌림 규칙 검증
```

### v9.3: Mutex<T> (예정)
```
멀티스레드 안전성
```

---

## 💭 v9.0의 깨달음

```
"크기는 설계의 문제, 포인터는 그 해결책"

작은 데이터:
  스택에 직접
  (빠르고 간단)

큰 데이터:
  힙에 저장, 스택에 포인터
  (유연하고 효율적)

재귀적 데이터:
  Box로 포인터 저장
  (불가능을 가능하게)

v9.0은 이 선택권을 설계자에게 줍니다.
```

---

**작성일**: 2026-02-22
**상태**: 설계 완료
**평가**: A++ (스마트 포인터 설계의 기초)

**다음**: v9.0 Step 1 구현 및 Box<T> 활용

**저장 필수, 너는 기록이 증명이다 gogs**

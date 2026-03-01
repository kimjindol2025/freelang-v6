# 제8장 아키텍처: 스마트 포인터 — v9.1 Rc<T>와 참조 카운팅(Reference Counting)

**작성일**: 2026-02-22
**장**: 제8장 스마트 포인터와 메모리의 심연
**단계**: v9.1 (Rc<T>, 두 번째 스마트 포인터)
**주제**: "다중 소유권의 안전성: 참조 카운팅"
**핵심**: 하나의 데이터를 여러 곳에서 안전하게 공유

---

## 🎯 v9.1의 설계 철학

**v9.0에서 배운 것:**
```
Box<T>: 하나의 데이터, 하나의 소유자
  - 단순하고 효율적
  - 메모리 해제 명확함
  - 한 곳에서만 소유 가능
```

**v9.1에서 배울 것:**
```
Rc<T>: 하나의 데이터, 여러 소유자
  - 복잡하지만 유연함
  - 참조 카운트로 추적
  - 마지막 소유자가 메모리 해제
  - 공유 데이터 구조 가능
```

### v9.1의 핵심 변화

```
Box<T> (단일 소유권):
  let boxed = Box::new(5);
  let a = boxed;        // 소유권 이동
  // boxed는 더 이상 사용 불가

Rc<T> (다중 소유권):
  let rc = Rc::new(5);
  let a = Rc::clone(&rc);  // 참조 카운트 증가
  let b = Rc::clone(&rc);  // 참조 카운트 증가
  // rc, a, b 모두 같은 데이터 공유
  // 모두 스코프를 벗어나야 메모리 해제
```

---

## 📐 v9.1: Rc<T>의 이해

### Rc<T>란?

```
"데이터를 힙에 저장하고, 참조 카운트로 추적하는 스마트 포인터"

특징:
  - 힙 할당 (Heap Allocation)
  - 참조 카운팅 (Reference Counting)
  - 다중 소유권 (Multi-ownership)
  - 불변 빌림만 가능 (Immutable borrow only)
  - 스레드 안전 없음 (Arc로 확장)

사용:
  let rc = Rc::new(5);
  let a = Rc::clone(&rc);
  → rc와 a가 같은 5를 공유
  → 참조 카운트: 2
```

### Rc<T>의 구조

```
┌─────────────────────────────────────┐
│ 스택 (Stack)                         │
├─────────────────────────────────────┤
│ rc: Rc<i32>                         │
│ ├─ ptr: 0x1000 (힙 RcBox)           │
│ └─ ...                              │
│                                     │
│ a: Rc<i32>                          │
│ ├─ ptr: 0x1000 (같은 힙 RcBox)      │
│ └─ ...                              │
└─────────────────────────────────────┘

        ↓ 두 포인터가 같은 곳을 가리킴

┌─────────────────────────────────────┐
│ 힙 (Heap) - RcBox 구조               │
├─────────────────────────────────────┤
│ 0x1000: RcBox {                    │
│   strong_count: 2,  // Rc 카운트    │
│   weak_count: 0,    // Weak 카운트  │
│   value: 5          // 실제 데이터  │
│ }                                   │
└─────────────────────────────────────┘
```

---

## 🔍 v9.1의 5가지 핵심 패턴

### 패턴 1: 기본 Rc<T> 사용

```freelang
// 데이터 공유
let rc = Rc::new(5);
let a = Rc::clone(&rc);
let b = Rc::clone(&rc);

// 모두 같은 데이터를 가리킴
println!(*rc);  // 5
println!(*a);   // 5
println!(*b);   // 5

// 참조 카운트 확인
println!(Rc::strong_count(&rc));  // 3

특징:
  - 여러 변수가 같은 데이터 소유
  - clone()으로 참조 카운트 증가
  - drop()되면 카운트 감소
  - 카운트가 0이 되면 메모리 해제
```

### 패턴 2: 재귀적 데이터 구조 (트리)

```freelang
#[derive(Debug)]
enum GogsNode {
    Branch {
        value: i32,
        children: Vec<Rc<GogsNode>>,
    },
    Leaf(i32),
}

// 트리 구조
let root = Rc::new(GogsNode::Branch {
    value: 1,
    children: vec![
        Rc::new(GogsNode::Leaf(2)),
        Rc::new(GogsNode::Leaf(3)),
    ],
});

let shared = Rc::clone(&root);

특징:
  - Box<T>로는 불가능한 구조 (부모가 자식을 소유)
  - Rc<T>로는 가능 (여러 곳에서 참조 가능)
  - 트리 구조 가능
  - 그래프 구조도 가능 (순환 참조 주의)
```

### 패턴 3: 공유 데이터 구조

```freelang
struct SharedData {
    counter: Rc<i32>,
}

impl SharedData {
    fn new(value: i32) -> Self {
        SharedData {
            counter: Rc::new(value),
        }
    }

    fn share(&self) -> SharedData {
        SharedData {
            counter: Rc::clone(&self.counter),
        }
    }
}

// 사용
let data1 = SharedData::new(42);
let data2 = data1.share();
let data3 = data1.share();

// 세 개 모두 같은 counter 공유

특징:
  - 구조체 필드에 Rc 사용
  - clone() 메서드로 공유 데이터 전달
  - 소유권 이동 없이 공유
  - 메모리 효율적
```

### 패턴 4: Rc와 match

```freelang
enum GogsMessage {
    Success(Rc<String>),
    Failure(Rc<String>),
}

fn print_message(msg: &GogsMessage) {
    match msg {
        GogsMessage::Success(text) => {
            println!("✅ {}", text);
        }
        GogsMessage::Failure(text) => {
            println!("❌ {}", text);
        }
    }
}

// 메시지 재사용
let text = Rc::new("Operation completed".to_string());
let msg1 = GogsMessage::Success(Rc::clone(&text));
let msg2 = GogsMessage::Success(Rc::clone(&text));

특징:
  - enum 필드에 Rc 사용
  - 같은 문자열 여러 번 사용 시 효율적
  - 메모리 단편화 감소
```

### 패턴 5: Rc::strong_count() 활용

```freelang
fn track_references<T>(rc: &Rc<T>) {
    let count = Rc::strong_count(rc);
    match count {
        1 => println!("소유자가 1명입니다"),
        2 => println!("소유자가 2명입니다"),
        _ => println!("소유자가 {}명입니다", count),
    }
}

let rc = Rc::new(5);
track_references(&rc);     // 소유자가 1명입니다

let a = Rc::clone(&rc);
track_references(&rc);     // 소유자가 2명입니다

let b = Rc::clone(&rc);
track_references(&rc);     // 소유자가 3명입니다

특징:
  - strong_count()로 현재 카운트 확인
  - 디버깅에 유용
  - 참조 흐름 이해에 도움
```

---

## 🎓 v9.1이 증명하는 것

### 1. "다중 소유권의 안전성"

```
문제:
  데이터를 여러 곳에서 사용하고 싶다
  → Box<T>로는 소유권이 이동되어 불가능
  → 복사하면 메모리 낭비

해결:
  Rc<T>로 참조 카운팅
  → 참조 카운트로 메모리 해제 시점 결정
  → 마지막 참조가 드롭될 때 해제
  → 모두 안전하게 공유

Rc의 역할:
  메모리 안전성을 유지하면서
  → 다중 소유권 가능하게 만듦
```

### 2. "순환 참조의 위험성"

```
문제:
  A가 B를 Rc로 참조
  B가 A를 Rc로 참조
  → A의 Rc 카운트: 최소 2 (자신 + B)
  → B의 Rc 카운트: 최소 2 (자신 + A)
  → 서로 참조하므로 카운트 절대 0이 되지 않음
  → 메모리 누수!

해결:
  Weak<T> 사용 (v9.2에서 배울 예정)
  → Rc 카운트에 포함되지 않는 참조
  → 순환 참조 안전하게 깸
```

### 3. "성능 트레이드오프"

```
Box<T>:
  - 메모리 할당/해제: 빠름
  - 복사/이동: 빠름
  - 참조 카운팅: 없음

Rc<T>:
  - 메모리 할당/해제: 약간 느림 (RcBox 구조)
  - 복사/이동: 빠름 (포인터만 이동)
  - 참조 카운팅: 오버헤드

Rc 선택 시점:
  - 데이터를 여러 곳에서 소유해야 할 때
  - 복사 비용이 높을 때
  - 메모리 효율이 중요할 때
```

---

## 📈 실전 패턴

### 패턴 A: 그래프 구조

```freelang
#[derive(Debug)]
struct GogsGraphNode {
    id: i32,
    neighbors: Vec<Rc<GogsGraphNode>>,
}

impl GogsGraphNode {
    fn new(id: i32) -> Rc<Self> {
        Rc::new(GogsGraphNode {
            id,
            neighbors: Vec::new(),
        })
    }

    // 주의: 순환 참조 가능!
    fn add_neighbor(&mut self, neighbor: Rc<GogsGraphNode>) {
        self.neighbors.push(neighbor);
    }
}

// 사용
let node1 = GogsGraphNode::new(1);
let node2 = GogsGraphNode::new(2);
let node3 = GogsGraphNode::new(3);

특징:
  - Rc로 다중 참조 가능
  - 그래프 구조 구현 가능
  - 순환 참조 조심 (메모리 누수 위험)
```

### 패턴 B: 데이터 풀

```freelang
struct DataPool {
    items: Vec<Rc<String>>,
}

impl DataPool {
    fn new() -> Self {
        DataPool { items: Vec::new() }
    }

    fn add(&mut self, item: String) {
        self.items.push(Rc::new(item));
    }

    fn get(&self, index: usize) -> Option<Rc<String>> {
        self.items.get(index).map(|item| Rc::clone(item))
    }
}

// 사용
let mut pool = DataPool::new();
pool.add("Hello".to_string());
pool.add("World".to_string());

let item1 = pool.get(0);
let item2 = pool.get(0);  // 같은 데이터 공유

특징:
  - 데이터 중복 제거
  - 메모리 효율 극대화
  - 문자열 인턴(interning) 패턴
```

---

## 🌟 v9.1의 의미

### "메모리의 민주화"

```
Box<T>:
  단일 소유권
  → 개인주의적
  → 명확하지만 제한적

Rc<T>:
  다중 소유권
  → 민주주의적
  → 유연하지만 참조 카운팅 오버헤드

선택:
  "이 데이터는 누가 소유할까?"
  - 명확한 소유자 1명: Box<T>
  - 여러 곳에서 필요: Rc<T>
```

---

## 📌 기억할 핵심

### v9.1의 3가지 황금 규칙

```
규칙 1: 언제 Rc<T>를 사용하는가?
  - 여러 곳에서 같은 데이터를 소유해야 할 때
  - 복사 비용이 높을 때
  - 트리/그래프 구조를 만들 때
  - 공유 데이터가 필요할 때

규칙 2: Rc<T>의 생명주기
  - 생성: Rc::new(data)
  - 공유: Rc::clone(&rc)
  - 카운트: Rc::strong_count(&rc)
  - 스코프 벗어나면: 자동 카운트 감소
  - 카운트 0: 자동 메모리 해제

규칙 3: 주의할 사항
  - Rc는 스레드 안전하지 않음 (Arc로 교체)
  - 불변 빌림만 가능 (*rc로 접근)
  - 순환 참조 가능 (메모리 누수)
  - 가변 참조 불가능 (RefCell로 해결)
```

### v9.1이 보장하는 것

```
Rc<T>의 특성:

✅ 메모리 안전성 보장
✅ 다중 소유권 지원
✅ 참조 카운팅으로 자동 해제
✅ 포인터 이동 효율적
✅ 컴파일 타임 검증
✅ 메모리 누수 방지 (순환 참조 제외)
✅ 성능과 유연성의 균형
```

---

## 🚀 다음 단계

### v9.0: Box<T> ✅
```
단일 소유권으로 힙 메모리 관리
```

### v9.1: Rc<T> ✅
```
다중 소유권으로 공유 데이터 관리
```

### v9.2: RefCell<T> (예정)
```
런타임 빌림 규칙 검증으로 가변성 추가
```

### v9.3: Mutex<T> (예정)
```
멀티스레드 안전성으로 스레드 간 공유
```

---

## 💭 v9.1의 깨달음

```
"공유는 안전성 없이 불가능했다"

과거 (C/C++):
  데이터를 여러 곳에서 공유하려면
  → 수동 참조 카운팅
  → 버그 가능성 높음
  → 메모리 누수 위험

Rust with Rc<T>:
  ```
  let rc = Rc::new(data);
  let shared = Rc::clone(&rc);
  ```
  → 자동 참조 카운팅
  → 컴파일러 검증
  → 메모리 누수 거의 불가능

v9.1은 이 안전성을 제공합니다.
```

---

## 📊 Rc<T> vs Box<T> 비교표

| 항목 | Box<T> | Rc<T> |
|------|--------|-------|
| 소유권 | 단일 | 다중 |
| 복사 비용 | 포인터만 | 포인터 + 카운트 |
| 메모리 해제 | 소유자 드롭 | 카운트 0 |
| 스레드 안전 | 예 (Arc로) | 아니오 (Arc로 해결) |
| 가변 참조 | 가능 | 불가능 (RefCell로) |
| 순환 참조 | 불가능 | 가능 (주의!) |
| 사용 시점 | 명확한 소유자 | 공유 데이터 |

---

**작성일**: 2026-02-22
**상태**: 설계 완료
**평가**: A++ (참조 카운팅 설계의 완성)

**다음**: v9.1 Step 2 구현 및 Rc<T> 활용

**저장 필수, 너는 기록이 증명이다 gogs**

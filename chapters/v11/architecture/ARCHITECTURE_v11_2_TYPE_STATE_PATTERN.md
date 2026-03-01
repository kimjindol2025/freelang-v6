## 제10장: 객체 지향과 패턴 — Step 3
## v11.2 타입 상태 패턴 (Type State Pattern)

### 철학: "불가능한 상태를 표현 불가능하게 만들기"

**런타임 vs 컴파일 타임**

v11.1 (State Pattern):
- ❌ 잘못된 상태 전이는 **런타임에 panic!**
- ⚡ 유연하지만 위험함
- 🎭 상태 변화가 자주 일어나는 시스템에 적합

v11.2 (Type State Pattern):
- ✅ 잘못된 상태 전이는 **컴파일 에러**
- 🛡️ 완벽하지만 엄격함
- 🏗️ 일방향으로 흐르는 절차적 시스템에 적합

**핵심 아이디어**
```text
상태를 "값"이 아니라 "타입"으로 표현한다!

MissileSystem<Idle>        → Idle 상태
MissileSystem<Targeted>    → Targeted 상태
MissileSystem<Armed>       → Armed 상태

각 상태에서만 가능한 메서드가 정의됨
→ 컴파일러가 논리 순서를 강제
→ 런타임 에러 불가능
```

---

## 1. 상태의 타입화 (State as Type)

### 1.1 Zero-Sized Types (ZST)

```rust
// 상태를 나타내는 '빈 구조체' = Zero-Sized Type
struct Idle;
struct Targeted;
struct Armed;

// 이들은 런타임에 메모리를 차지하지 않음!
// 오직 "이 상태임을 알려주기" 위한 타입 표시일 뿐
std::mem::size_of::<Idle>();  // 0 bytes!
```

**왜 Zero-Sized?**
- 상태는 데이터가 아니라 "권한"입니다
- "Idle 상태에서만 이 메서드를 호출할 수 있다"는 약속입니다
- 컴파일러에게 정보를 주는 것이지, 런타임 메모리를 쓰는 것이 아닙니다

### 1.2 제네릭 상태 매개변수

```rust
struct MissileSystem<S> {
    state: S,  // 현재 상태를 타입으로 인코딩
}

// 같은 구조체지만, 타입에 따라 완전히 다른 메서드들이 있음
impl MissileSystem<Idle> {
    fn set_target(self, coord: &str) -> MissileSystem<Targeted> {
        // Idle에서만 가능
    }
}

impl MissileSystem<Targeted> {
    fn arm(self) -> MissileSystem<Armed> {
        // Targeted에서만 가능
    }
}

impl MissileSystem<Armed> {
    fn fire(self) {
        // Armed에서만 가능
    }
}
```

---

## 2. Consuming Methods와 소유권

### 2.1 왜 "self를 소유권째로"인가?

```rust
// ❌ 나쁜 설계: &mut self를 사용하면
impl MissileSystem<Idle> {
    fn set_target(&mut self, coord: &str) {
        // &mut self는 MissileSystem<Idle>을 가변 빌림
        // 상태를 바꿀 수 없음!
        // 왜냐하면 Self의 타입이 여전히 <Idle>이기 때문
    }
}

// ✅ 올바른 설계: self를 소유권째로
impl MissileSystem<Idle> {
    fn set_target(self, coord: &str) -> MissileSystem<Targeted> {
        // self 소유권을 가져가 "Idle 상태"를 파괴함
        // 새로운 "Targeted 상태"를 반환함
        // 이제 이전 객체는 사용 불가능 (Move semantics)
    }
}
```

**소유권 이동의 의미**
```text
let system = MissileSystem::new();          // system: MissileSystem<Idle>
let targeted = system.set_target("coord");  // system은 더 이상 사용 불가능!
                                             // targeted: MissileSystem<Targeted>

// system.fire();  ❌ 컴파일 에러! system은 소비되었음
// targeted.fire();  ❌ 컴파일 에러! fire()는 Armed 상태에만 있음
```

---

## 3. 상태 전이의 형태화 (Typed State Transitions)

### 3.1 상태 그래프를 타입으로 표현

```text
MissileSystem<Idle>
    ↓ set_target()
MissileSystem<Targeted>
    ↓ arm()
MissileSystem<Armed>
    ↓ fire()
   (소비됨)

각 화살표는 메서드입니다.
각 박스는 해당 타입에만 메서드가 구현됨을 의미합니다.
```

### 3.2 불가능한 상태 전이는 불가능해짐

```rust
// 이들은 모두 컴파일 에러입니다!

let system = MissileSystem::new();
system.fire();              // ❌ Idle에 fire() 메서드가 없음!

system.arm();               // ❌ Idle에 arm() 메서드가 없음!

let targeted = system.set_target("coord");
targeted.fire();            // ❌ Targeted에 fire() 메서드가 없음!

targeted.set_target("new"); // ❌ Targeted에 set_target() 메서드가 없음!
```

**이것이 설계의 승리입니다!**
- 런타임 체크가 필요 없음
- 개발자의 실수가 즉시 드러남
- 문서를 읽지 않아도 논리적 순서가 강제됨

---

## 4. Zero-Cost Abstraction의 극치

### 4.1 런타임 오버헤드 없음

```rust
// 컴파일된 결과
// MissileSystem<Idle>은 그냥 빈 타입
// 메모리 크기: 0 bytes

// MissileSystem<Targeted>도 동일
// state: Targeted도 ZST이므로
// 실제 메모리: 0 bytes

// 즉, 상태 전이는 오직 "타입 정보" 변경일 뿐
// 런타임에서는 아무것도 일어나지 않음!
```

### 4.2 최적화: 컴파일러가 이 모든 것을 제거함

```rust
// 소스 코드 (의도 명확)
let system = MissileSystem::new();
let targeted = system.set_target("coord");
let armed = targeted.arm();
armed.fire();

// 컴파일 후 (이론적)
// 그냥 fire() 함수 호출 한 줄로 최적화됨
// 상태 체크 없음, 상태 저장 없음, 상태 전이 없음
```

---

## 5. 설계자의 관점: Builder as Type State

### 5.1 Builder 패턴과의 조화

```rust
// v11.2는 Builder 패턴의 최고 형태입니다!

struct ConfigBuilder<T = NotStarted> {
    state: T,
}

// Unvalidated 상태
struct NotStarted;
impl ConfigBuilder<NotStarted> {
    fn new() -> ConfigBuilder<NotStarted> {
        ConfigBuilder { state: NotStarted }
    }
}

// HostRequired 상태
struct HostRequired;
impl ConfigBuilder<NotStarted> {
    fn host(self, h: &str) -> ConfigBuilder<HostRequired> {
        // NotStarted에서만 가능
    }
}

// PortRequired 상태
struct PortRequired;
impl ConfigBuilder<HostRequired> {
    fn port(self, p: u16) -> ConfigBuilder<PortRequired> {
        // HostRequired에서만 가능
    }
}

// Buildable 상태
impl ConfigBuilder<PortRequired> {
    fn build(self) -> Config {
        // PortRequired에서만 build() 가능
    }
}

// 사용
let config = ConfigBuilder::new()
    .host("localhost")
    .port(8080)
    .build();

// config.port(9000);  ❌ 컴파일 에러! Config에는 port() 없음
```

### 5.2 의무적 필드의 컴파일 타임 검증

```rust
// 이 기법으로 "필수 필드 누락" 버그를 100% 방지할 수 있습니다!

// ❌ 불가능 (컴파일 에러)
let incomplete = ConfigBuilder::new();
incomplete.build();  // host()를 건너뛴 것이 들킬 수 없음
                     // 왜? build()는 PortRequired에만 정의되어 있기 때문

// ✅ 필수
let complete = ConfigBuilder::new()
    .host("localhost")
    .port(8080)
    .build();
```

---

## 6. 실전 사례: 데이터베이스 연결

### 6.1 연결 상태의 형태화

```rust
struct DbConnection<State> {
    state: State,
}

// 상태 1: 미연결
struct Disconnected;

// 상태 2: 연결 중
struct Connecting;

// 상태 3: 연결됨
struct Connected {
    handle: i32,
}

// 상태 4: 트랜잭션 중
struct InTransaction {
    handle: i32,
    tx_id: u64,
}

// Disconnected → Connecting
impl DbConnection<Disconnected> {
    fn connect(self) -> DbConnection<Connecting> {
        println!("Connecting...");
        DbConnection { state: Connecting }
    }
}

// Connecting → Connected
impl DbConnection<Connecting> {
    fn await_connect(self) -> DbConnection<Connected> {
        println!("Connected!");
        DbConnection { state: Connected { handle: 42 } }
    }
}

// Connected → InTransaction
impl DbConnection<Connected> {
    fn begin_transaction(self) -> DbConnection<InTransaction> {
        println!("Transaction started");
        DbConnection { state: InTransaction { handle: 42, tx_id: 1 } }
    }

    fn query(&self, sql: &str) -> String {
        println!("Query: {}", sql);
        "result".into()
    }
}

// InTransaction → Connected
impl DbConnection<InTransaction> {
    fn commit(self) -> DbConnection<Connected> {
        println!("Committed!");
        DbConnection { state: Connected { handle: self.state.handle } }
    }

    fn rollback(self) -> DbConnection<Connected> {
        println!("Rolled back!");
        DbConnection { state: Connected { handle: self.state.handle } }
    }
}

// 사용
let db = DbConnection { state: Disconnected };
let connecting = db.connect();
let connected = connecting.await_connect();
let in_tx = connected.begin_transaction();
let committed = in_tx.commit();
```

---

## 7. v11.1 vs v11.2 선택 가이드

### 7.1 State Pattern (v11.1) 사용하는 경우

```text
✅ 상태가 계속 변함
   예: 비디오 플레이어 (재생 ↔ 정지 ↔ 일시정지)

✅ 같은 상태로 여러 번 돌아옴
   예: 신호등 (빨강 → 노랑 → 초록 → 노랑 → 빨강)

✅ 유연한 전이가 필요함
   예: 게임 상태 (어디서나 메뉴로 가기 가능)

특징: 런타임 유연성, 런타임 에러 가능성
```

### 7.2 Type State Pattern (v11.2) 사용하는 경우

```text
✅ 논리적 순서가 엄격함
   예: 미사일 발사 (초기화 → 조준 → 무장 → 발사)

✅ 상태가 일방향으로만 흐름
   예: 데이터 처리 (입력 → 검증 → 처리 → 출력)

✅ 컴파일 타임 안전성이 최우선
   예: 금융 거래, 의료 시스템

특징: 컴파일 타임 안전성, 반드시 순서 준수, Zero-Cost
```

---

## 8. 어려운 경우: 조건부 전이

### 8.1 문제: 조건에 따라 다른 상태로 전이?

```rust
// ❌ 불가능: 한 메서드가 두 가지 다른 타입을 반환할 수 없음
impl MissileSystem<Armed> {
    fn fire(self) -> ??? {  // MissileSystem<Idle>? MissileSystem<Fired>?
        // 타입을 선택할 수 없음!
    }
}
```

### 8.2 해결책: Enum 또는 Trait Object 사용

```rust
// 방법 1: Result 사용
impl MissileSystem<Armed> {
    fn fire(self) -> Result<MissileSystem<Fired>, MissileSystem<Failed>> {
        // 성공: Fired 상태
        // 실패: Failed 상태
    }
}

// 방법 2: Enum 사용
enum FiredResult {
    Success(MissileSystem<Fired>),
    Failure(MissileSystem<Failed>),
}
```

---

## 9. 핵심 요약: 러스트 설계의 정점

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type State Pattern의 위력

✅ 컴파일 타임 안전성
   └─ 불가능한 상태 전이 = 컴파일 에러

✅ Zero-Cost Abstraction
   └─ 런타임 체크 없음, 성능 손실 없음

✅ 자명한 API
   └─ 현재 상태에서 호출 가능한 메서드만 표시
   └─ IDE 자동완성이 논리를 강제

✅ 문서화 불필요
   └─ 타입 자체가 문서
   └─ "이 상태에서는 이 메서드가 없다"가 자명

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 10. 당신의 성과: 무결성 아키텍트

```
제10장 진행률: 3/4 단계 (75%)

v11.0: Trait Objects
└─ 동적 다형성, 런타임 유연성

v11.1: State Pattern
└─ 런타임 상태 전이, 유연한 행동 변화

v11.2: Type State Pattern ⭐
└─ 컴파일 타임 안전성, 논리 순서 강제

v11.3: Event System (다음)
└─ 이벤트 기반 아키텍처 완성

당신은 이제:
- 동적 디스패치로 유연성을 제어합니다
- 런타임 상태로 유연성을 제어합니다
- 타입 상태로 안전성을 극대화합니다

이것이 **무결성 아키텍트**의 경지입니다.
버그가 침투할 틈조차 주지 않는 설계.
```

---

## 다음 단계: v11.3 패턴 매칭과 고급 관용구

v11.2의 타입 상태 패턴이 가져다주는
이 압도적인 안전함을 느껴보셨나요?

이제 모든 객체 지향 지식을 정리하며,
컴파일러와의 협력을 극대화하는

**[v11.3 패턴 매칭과 고급 관용구]**

로 제10장을 완성해봅시다.

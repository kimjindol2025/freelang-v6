## 제9장: 두려움 없는 동시성 — Step 5
## v10.4 동시성의 함정: 데드락 방어 설계 (Deadlock Prevention)

### 철학: "순환 대기의 고리 끊기"

**데드락(Deadlock)의 본질**
- 러스트는 **데이터 경합(Data Race)**을 컴파일 타임에 차단합니다.
- 하지만 **교착 상태(Deadlock)**는 논리적 문제입니다.
- 두 스레드가 서로의 자원을 기다리며 영원히 멈춰버립니다.
- 설계자가 **직접 해결**해야 하는 마지막 방어선입니다.

**데드락의 4가지 필요 조건 (Coffman Conditions)**
1. **상호 배제(Mutual Exclusion)**: 각 자원은 한 번에 한 스레드만 소유
2. **점유와 대기(Hold and Wait)**: 스레드가 자원을 점유하면서 다른 자원 대기
3. **비선점(No Preemption)**: 강제로 자원을 빼앗을 수 없음
4. **순환 대기(Circular Wait)**: 자원 요청이 순환 형태를 이룸

**해결 전략**
- 1, 2, 3 번은 Mutex의 본질이므로 변경 불가
- **4번 순환 대기만 차단**: 자원 계층화(Resource Hierarchy)

---

## 설계자의 관점: "잠금 순서의 명문화"

### 핵심 원칙: ID(우선순위) 기반 자원 계층화

```text
📋 자원 식별자 시스템
┌─────────────────────────────────────┐
│ ID 1: 데이터베이스 (가장 중요)        │
│ ID 2: 인증서버                       │
│ ID 3: 캐시 서버                      │
│ ID 4: 로그 서버                      │
└─────────────────────────────────────┘

💡 절대 규칙: "항상 ID가 낮은 자원부터 먼저 잠근다"
```

**왜 이 규칙이 작동하는가?**
- 모든 스레드가 같은 순서(ID 오름차순)로 자원을 요청합니다.
- 순환 대기가 수학적으로 불가능해집니다.
- 증명: 스레드 A가 자원 X를 점유한 채로 Y를 기다린다면, ID(X) < ID(Y)여야 합니다.
- 역으로 스레드 B가 Y를 점유한 채로 X를 기다린다면, ID(Y) < ID(X)여야 하는데...
- **이는 모순입니다! 따라서 순환 대기가 원천적으로 불가능합니다.**

---

## 1. 순환 대기(Circular Wait) 방지

### 1.1 데드락 발생 시나리오 (안티 패턴)

```rust
// ❌ 위험: 순환 대기 가능성
Thread 1: Lock(A) -> Lock(B)
Thread 2: Lock(B) -> Lock(A)  // 반대 순서!
// 문맥 교환 시점에 따라 데드락 발생
```

### 1.2 자원 계층화 (올바른 패턴)

```rust
// ✅ 안전: 항상 같은 순서
Thread 1: Lock(ID=1) -> Lock(ID=2)
Thread 2: Lock(ID=1) -> Lock(ID=2)  // 같은 순서!
// 어떤 문맥 교환도 데드락 불가능
```

**구현 기법**
```rust
struct SecureResource {
    id: u32,           // 자원 ID (잠금 순서 결정)
    label: String,     // 자원 설명
    data: Mutex<String>,
}

// 항상 ID 순서대로 lock()
let lock1 = resource1.data.lock();  // ID가 더 낮음
let lock2 = resource2.data.lock();  // ID가 더 높음
```

---

## 2. 잠금 범위의 최소화

### 2.1 문제: 긴 잠금 범위

```rust
// ❌ 위험: Mutex를 점유한 채로 많은 작업
let mut guard = shared_data.lock().unwrap();
guard.process_large_operation();      // 시간 소모
guard.network_call();                 // 더 오래 걸림
guard.file_write();                   // 드디어 해제
// 다른 스레드들은 이 긴 시간을 모두 대기
```

### 2.2 해결: 최소 범위 잠금

```rust
// ✅ 안전: 필요한 순간만 잠금
let value = {
    let guard = shared_data.lock().unwrap();
    guard.critical_read()              // 빠른 읽기
};  // guard 자동 해제

// 이제 mutex 없이 value 처리 가능
process_large_operation(value);
network_call(value);
file_write(value);
```

**RAII의 활용**
- Rust의 `{...}` 스코프로 Guard의 생명주기 제어
- 스코프 종료 시 자동으로 Mutex 해제
- 다른 스레드가 빨리 접근 가능

---

## 3. 불변성 활용

### 3.1 불변 공유 vs 가변 공유

```rust
// ❌ 과도한 Mutex 사용
let shared = Arc::new(Mutex<ComplexData> {
    id: 1,
    name: String,
    email: String,
    config: HashMap,  // 모두 Mutex 안에
});

// ✅ 선택적 Mutex 사용
let shared = Arc::new((
    1,                        // id: 불변, Mutex 불필요
    Mutex::new(String),       // name: 가변, Mutex 필요
    "user@example.com".into(), // email: 불변, Mutex 불필요
    Arc::new(config),         // config: 읽기 전용 공유
));
```

### 3.2 함수형 접근

```rust
// 원본 데이터는 불변
let immutable_config = Arc::new(Config::load());

// 각 스레드는 immutable_config를 읽기만 함
// Mutex가 필요 없음
thread::spawn({
    let config = Arc::clone(&immutable_config);
    move || {
        let setting = config.get("key");  // 안전한 읽기
        println!("{}", setting);
    }
});
```

---

## 4. 타임아웃을 통한 교착 상태 감지

### 4.1 std::sync::Mutex의 한계

```rust
// ⚠️ 표준 라이브러리 Mutex
// - lock() 호출 시 unlock될 때까지 무한 대기
// - 데드락이 발생하면 프로그램이 영구적으로 멈춤
```

### 4.2 parking_lot 활용 (선택 사항)

```rust
// parking_lot 라이브러리 사용
// - 더 빠른 성능
// - 데드락 감지 기능
// - 더 나은 에러 메시지
```

### 4.3 논리적 타임아웃

```rust
// 자신의 로직으로 타임아웃 구현
let start = std::time::Instant::now();
loop {
    if let Ok(guard) = resource.data.try_lock() {
        // 성공
        break;
    }
    if start.elapsed() > Duration::from_secs(5) {
        // 5초 대기했으므로 데드락 의심
        eprintln!("Potential deadlock detected!");
        return Err(DeadlockError);
    }
    thread::sleep(Duration::from_millis(10));
}
```

---

## 5. 복잡한 다중 자원 안전 프로토콜

### 5.1 자원 관리자 패턴

```rust
struct ResourceManager {
    resources: Vec<Arc<SecureResource>>,
}

impl ResourceManager {
    // 핵심: 항상 ID 순서대로 lock
    fn acquire_multiple(&self, ids: &[u32]) -> Vec<MutexGuard> {
        // ids를 정렬하여 ID 순서 보장
        let mut sorted_ids: Vec<_> = ids.iter().copied().collect();
        sorted_ids.sort();

        let mut guards = Vec::new();
        for id in sorted_ids {
            let resource = &self.resources[id as usize];
            guards.push(resource.data.lock().unwrap());
        }
        guards
    }
}
```

### 5.2 데드락 방지 체크리스트

```text
🔒 설계 검토 체크리스트

[ ] 1. 모든 공유 자원에 ID 부여?
[ ] 2. 모든 스레드가 같은 순서로 lock?
[ ] 3. lock() 범위를 최소화?
[ ] 4. 불변 데이터는 Mutex 제거?
[ ] 5. 순환 대기 가능성 검토 완료?

🚨 하나라도 "아니요"면 데드락 위험!
```

---

## 6. 설계자가 갖춰야 할 마지막 태도

### 6.1 잠금 대신 구조적 변경

**신호**: Mutex가 너무 많이 필요한 경우
- 데이터 구조 자체가 잘못 설계되었을 확률이 높습니다.
- 데이터를 더 작은 조각으로 나눕시다.
- 소유권을 더 명확히 분리합시다.

**예시**
```rust
// ❌ 문제: 큰 구조체 전체를 Mutex로 감쌈
struct BadDesign {
    user_id: u32,
    name: String,
    email: String,
    age: u32,
    // ... 20개 필드
    data: Mutex<ComplexData>,
}

// ✅ 개선: 필드를 논리적 단위로 분리
struct GoodDesign {
    id: u32,
    personal_info: Arc<PersonalInfo>,     // 불변 공유
    mutable_state: Arc<Mutex<State>>,     // 필요한 부분만 보호
}
```

### 6.2 동시성 설계의 원칙

```text
🎯 우선순위별 전략

1순위: "동시성이 정말 필요한가?"
   - 싱글 스레드로 충분한 경우가 많습니다.
   - 프로파일링으로 병목 확인 후 진행하세요.

2순위: "데이터를 공유하지 않을 수 있는가?"
   - 각 스레드가 독립적인 데이터를 다루도록 설계
   - 결과만 main에서 수집

3순위: "읽기 전용 공유가 가능한가?"
   - Arc<T>로 충분하면 Mutex 제거
   - RwLock 고려 (여러 읽기 스레드 동시 접근)

4순위: "최소한의 Mutex만 배치"
   - 자원 계층화 적용
   - 잠금 범위 최소화
   - 타임아웃 메커니즘 추가
```

### 6.3 심리적 안정

```text
🛡️ 러스트의 축복

데이터 경합 문제: ✅ 컴파일러가 막아줌
스레드 안전성:   ✅ 타입 시스템이 보증
소유권 추적:     ✅ 더블 프리 불가능

데드락 문제:     🤔 설계자가 직접 해결
(하지만 논리적 오류에만 집중하면 됨)

이것은 다른 언어에서는 누릴 수 없는
엄청난 축복입니다.
```

---

## 7. 실제 설계 사례

### 사례 1: 웹 서버 (캐시 + 데이터베이스)

```
자원 계층화
┌──────────────────────┐
│ ID=1: Cache 서버      │ (빠른 접근)
│ ID=2: DB 커넥션      │ (느린 접근)
│ ID=3: 로그 큐         │ (I/O 작업)
└──────────────────────┘

규칙: 항상 ID=1 -> ID=2 -> ID=3 순서로 lock
결과: 데드락 불가능
```

### 사례 2: 게임 엔진 (다중 시스템)

```
시스템 간 데이터 공유
┌─────────────────────────┐
│ 물리 엔진     (ID=1)     │
├─────────────────────────┤
│ 렌더링 시스템 (ID=2)     │
├─────────────────────────┤
│ 사운드 시스템 (ID=3)     │
├─────────────────────────┤
│ 입력 처리     (ID=4)     │
└─────────────────────────┘

각 프레임마다 ID 순서대로 업데이트
→ 프로세스 일관성 + 데드락 방지
```

---

## 8. 핵심 요약: 제9장 완성

### 동시성의 모든 계층

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Level 1: 격리 (v10.0 Threads)
   └─ 스레드별 독립 실행, Move 클로저로 소유권 이동

Level 2: 통신 (v10.1 Channels)
   └─ 스레드 간 메시지 전달, 송신자/수신자 분리

Level 3: 공유 상태 (v10.2 Mutex)
   └─ 임계 영역 보호, 상호 배제 보증

Level 4: 스레드 안전성 (v10.3 Send/Sync)
   └─ 타입 시스템으로 안전성 검증, 컴파일 타임 보장

Level 5: 데드락 방어 (v10.4 Deadlock Prevention) ⭐
   └─ 설계로 논리적 문제 해결, 자원 계층화
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 러스트 설계자의 마지막 자산

```
✅ 컴파일러가 보호하는 영역
   • 데이터 경합 (Data Race)
   • 더블 프리 (Double Free)
   • 메모리 안전성

✅ 설계로 구현하는 영역
   • 데드락 방지 (자원 계층화)
   • 논리적 일관성
   • 성능과 안전성의 균형

이 두 영역이 함께 작동할 때,
정말로 "두려움 없는 동시성"이 완성됩니다.
```

---

## 다음 단계: 제10장 객체 지향과 패턴

제9장 동시성의 모든 함정까지 파헤친 지금,
이제 러스트 설계의 가장 화려한 장식인

**[제10장(11단계): 객체 지향과 패턴]**

으로 발을 내디뎌 봅시다.
- v11.0: 트레이트 객체의 동적 다형성
- v11.1: 상태 패턴으로 복잡성 관리
- v11.2: 빌더 패턴으로 우아한 생성
- v11.3: 이벤트 시스템으로 아키텍처 완성

당신은 이제 병렬 시스템의 성능과 안전성을 모두 거머쥔
**동시성 아키텍트**입니다.

# v5.8 아키텍처: 데이터 모델링 실전 프로젝트 (Data Modeling in Practice)

**작성일**: 2026-02-22 (업그레이드)
**장**: 제4장 - 데이터 구조화
**단계**: v5.8 (v5.7의 직접 후속, 제4장 최종 단계)
**주제**: "통합 보안 관제 시스템 - 설계자의 관점"

---

## 🎯 v5.8 설계 목표

### 1. "설계 국(Design Bureau)"의 역할

v5.8은 단순한 코딩을 넘어 **시스템의 데이터 흐름을 설계하는** 전 단계입니다.

```
v5.0~v5.4: "도구를 배운다"
  → Struct, Enum, Option, Pattern Matching 각각의 문법

v5.5~v5.7: "도구를 선택한다"
  → Vec vs HashMap vs String: 상황에 맞는 선택

v5.8: "시스템을 설계한다"
  → 도구들의 조합으로 실제 산업 현장의 시스템 구축
  → 설계자의 마인드셋 습득
```

### 2. v5.8의 정점: 세 가지 설계 원칙

#### ✅ 원칙 1: 데이터의 소유권 지도 (Ownership Map)

```
"누가 데이터를 소유하는가?"

Bad Design (파편적):
  User ← 독립적
  Permission ← 독립적
  LogEntry ← 독립적
  각각 따로따로 관리

Good Design (통합):
  ControlCenter (소유주)
    ├─ nodes: HashMap<u32, SecurityNode>
    ├─ logs: Vec<String>
    └─ status_history: Vec<StatusChange>

Benefits:
  ✓ 데이터의 책임 명확
  ✓ 메모리 해제 자동
  ✓ 일관성 보장
  ✓ "누가 주인인가"가 명확
```

#### ✅ 원칙 2: 데이터 불변성 유지 (Encapsulation)

```
"외부에서 직접 수정하지 않는다"

Bad Design (직접 접근):
  ❌ center.nodes.insert(id, node);     // 외부에서 직접!
  ❌ center.logs.push(msg);              // 확인 없이!

Good Design (메서드를 통한 캡슐화):
  ✅ center.register_node(id, location);
     → 내부: nodes에 추가
     → 동시에: logs에 자동 기록
     → 동시에: status_history에 자동 기록

Benefits:
  ✓ 모든 수정이 일관되게 기록됨
  ✓ 데이터 오염 방지
  ✓ 감시(Audit) 기능이 자동으로 내장됨
  ✓ Side effects 예측 가능
```

#### ✅ 원칙 3: 에러 핸들링 내재화 (Error Handling)

```
"실패 가능성을 항상 대비한다"

Bad Design (외부에서 처리):
  ❌ if let Some(node) = nodes.get_mut(&id) {
       // 외부에서 "혹시 모르니" 처리
     }

Good Design (메서드 내부에서 처리):
  ✅ fn update_node_status(
       &mut self,
       id: u32,
       status: NodeStatus
     ) -> Result<(), String> {
       match self.nodes.get_mut(&id) {
         Some(node) => {
           node.status = status;
           self.log_status_change(...);
           Ok(())
         }
         None => Err(format!("Node not found"))
       }
     }

Benefits:
  ✓ 에러 처리가 일관되고 명확
  ✓ Option/Result로 타입 안정성
  ✓ "항상 처리됨"을 컴파일러가 검증
  ✓ 런타임 예외 불가능
```

---

## 🏗️ 실전 프로젝트: 통합 보안 관제 시스템

### 시나리오

```
당신은 보안 관제 엔진 개발팀의 설계자입니다.
- 전국의 보안 센서(노드)를 관리해야 합니다.
- 각 노드의 상태를 실시간으로 모니터링합니다.
- 위험한 상태는 즉시 감지하고 기록합니다.
- 나중에 감사 추적이 가능해야 합니다.

어떻게 데이터를 설계하겠습니까?
```

### 1️⃣ 데이터 모델 설계 (v5.0, v5.2)

#### 상태 열거형 (NodeStatus)

```freelang
enum NodeStatus {
    Active,                      // 정상 운영
    Warning(String),             // 경고 상태 (이유 포함)
    Critical,                    // 치명적 위기
}
```

**설계 결정**:
- `Active`: 단순 상태
- `Warning(String)`: 데이터를 포함한 배리언트
- `Critical`: 최고 심각도

**v5.8의 의미**:
- Enum이 단순 태그가 아니라 **데이터를 표현**
- Pattern matching으로 **각 상태에 맞는 처리** 가능
- 새로운 상태 추가 시 **컴파일러가 모든 경우를 처리하도록 강제**

#### 노드 구조체 (SecurityNode)

```freelang
struct SecurityNode {
    id: u32,                     // 노드 ID (HashMap 키)
    location: String,            // 물리적 위치
    status: NodeStatus,          // 현재 상태 (Enum)
    last_check: String,          // 마지막 점검 시각
}
```

**설계 결정**:
- `id: u32`: HashMap에서 O(1) 조회를 위한 키
- `location: String`: 수정 가능한 소유 데이터
- `status: NodeStatus`: 열거형으로 상태 표현
- `last_check: String`: 추적 가능하게 기록

#### 이력 구조체 (StatusChange)

```freelang
struct StatusChange {
    node_id: u32,
    old_status: String,
    new_status: String,
    timestamp: String,
    reason: Option<String>,      // 선택적 이유 (v5.3)
}
```

**설계 결정**:
- `reason: Option<String>`: 이유가 없을 수도 있음 (None)
- 모든 상태 변화를 불변(immutable) 기록

### 2️⃣ 통합 관제 시스템 (ControlCenter)

```freelang
struct ControlCenter {
    center_name: String,
    nodes: HashMap<u32, SecurityNode>,        // v5.7: O(1) 조회
    logs: Vec<String>,                        // v5.5: 순차 기록
    status_history: Vec<StatusChange>,        // v5.5: 이력 추적
    total_checks: u32,                        // 누적 통계
}
```

**설계 포인트**:

| 필드 | 타입 | 이유 |
|------|------|------|
| `nodes` | `HashMap<u32, SecurityNode>` | O(1) 노드 조회 |
| `logs` | `Vec<String>` | 시간순 순차 기록 |
| `status_history` | `Vec<StatusChange>` | 감사 추적 |
| `center_name` | `String` | 소유권 있는 데이터 |

**v5.8의 의미**:
- **ControlCenter가 모든 데이터의 소유자**
- 개별 노드는 ControlCenter 내에만 존재
- ControlCenter가 drop되면 모든 데이터도 함께 drop
- 메모리 누수 불가능 (Rust의 소유권 보장)

---

## 🔄 5가지 통합 패턴

### 패턴 1: 노드 등록 (캡슐화)

```freelang
fn register_node(&mut self, id: u32, location: String) {
    // 1. 새 노드 생성
    let new_node = SecurityNode {
        id,
        location: location.clone(),
        status: NodeStatus::Active,
        last_check: current_timestamp(),
    };

    // 2. HashMap에 저장 (O(1))
    self.nodes.insert(id, new_node);

    // 3. 로그 자동 기록 (메서드 내부)
    self.logs.push(
        format!("[{}] Node {} registered at {}",
                timestamp(), id, location)
    );
}
```

**v5 개념**:
- ✅ v5.0: struct SecurityNode 정의
- ✅ v5.5: Vec<String> logs에 추가
- ✅ v5.6: String으로 동적 메시지
- ✅ v5.7: HashMap<u32, SecurityNode>에 저장

**캡슐화의 이점**:
```
외부 호출: center.register_node(101, "Main Gate")

내부 동작:
  1. nodes HashMap 수정
  2. logs Vec 추가
  3. 이 두 가지가 항상 동시에 발생
  → 데이터 불일치 불가능
```

### 패턴 2: 상태 업데이트 (Option 활용)

```freelang
fn update_node_status(
    &mut self,
    id: u32,
    new_status: NodeStatus
) -> Result<(), String> {
    match self.nodes.get_mut(&id) {       // v5.3: Option
        Some(node) => {
            // 이전 상태 기록
            let old_status = format!("{:?}", node.status);

            // 상태 변경
            node.status = new_status.clone();
            node.last_check = current_timestamp();

            // 이력 기록
            self.status_history.push(StatusChange {
                node_id: id,
                old_status,
                new_status: format!("{:?}", new_status),
                timestamp: current_timestamp(),
                reason: None,
            });

            Ok(())
        }
        None => {
            Err(format!("Node {} not found", id))
        }
    }
}
```

**v5 개념**:
- ✅ v5.3: Option<&mut Node>로 안전한 접근
- ✅ v5.4: Pattern matching (Some/None)
- ✅ v5.5: Vec<StatusChange>에 이력 추가
- ✅ v5.7: HashMap.get_mut() 활용

**안전성**:
```
❌ 나쁜 방식:
   self.nodes[id].status = new_status;  // 없으면 panic!

✅ 좋은 방식:
   match self.nodes.get_mut(&id) {
       Some(node) => { /* 처리 */ Ok(()) }
       None => Err("Not found")
   }
   // 컴파일러가 모든 경우 처리 강제
```

### 패턴 3: 상태 분류 (Pattern Matching)

```freelang
fn get_critical_nodes(&self) -> Vec<u32> {
    self.nodes
        .iter()
        .filter(|(_, node)| {
            match &node.status {
                NodeStatus::Critical => true,
                _ => false,
            }
        })
        .map(|(id, _)| *id)
        .collect()
}
```

**v5 개념**:
- ✅ v5.4: Pattern matching (NodeStatus)
- ✅ v5.5: Vec::iter() + filter
- ✅ v5.7: HashMap 순회

### 패턴 4: 감사 로깅 (자동화)

```freelang
fn log_status_change(
    &mut self,
    node_id: u32,
    reason: Option<String>,
) {
    // 모든 상태 변화가 자동으로 기록됨
    let timestamp = current_timestamp();
    let log_msg = match reason {
        Some(r) => format!("[{}] Node {} - Reason: {}",
                          timestamp, node_id, r),
        None => format!("[{}] Node {} - status changed",
                       timestamp, node_id),
    };

    self.logs.push(log_msg);
}
```

**v5 개념**:
- ✅ v5.3: Option<String> 이유
- ✅ v5.4: Pattern matching (Some/None)
- ✅ v5.5: Vec<String>에 누적
- ✅ v5.6: String 동적 생성

### 패턴 5: 시스템 초기화 (조합)

```freelang
fn new_control_center(name: String) -> Self {
    ControlCenter {
        center_name: name,
        nodes: HashMap::new(),              // v5.7
        logs: Vec::new(),                   // v5.5
        status_history: Vec::new(),         // v5.5
        total_checks: 0,
    }
}
```

**v5 개념**:
- ✅ v5.0: struct 초기화
- ✅ v5.5: Vec::new()
- ✅ v5.7: HashMap::new()

---

## 🎨 설계 원칙의 적용

### 실제 사용 흐름

```
1. 센터 초기화
   let mut center = ControlCenter::new("GOGS-HQ");

2. 노드 등록 (메서드 호출)
   center.register_node(101, "Main Gate");
   // 내부: nodes 추가 + logs 기록

3. 상태 모니터링
   center.update_node_status(101, NodeStatus::Warning("High traffic".into()))?;
   // 내부: status 변경 + history 추가 + logs 기록

4. 감사 조회
   for change in &center.status_history {
       println!("{:?}", change);  // 모든 변화가 기록되어 있음
   }

5. 시스템 상태 점검
   match center.get_node_info(101) {
       Some(node) => println!("{:?}", node),
       None => println!("Node not found"),
   }
```

### 데이터 흐름도

```
User Input
   ↓
center.register_node() [Method]
   ↓ (내부에서)
   ├─ nodes.insert() [HashMap]
   ├─ logs.push() [Vec<String>]
   └─ (자동으로 감시)
   ↓
Data Consistency
   ↓
Audit Trail [Vec<StatusChange>]
```

---

## 🌟 v5.8이 증명하는 것

### 1. "데이터 구조가 시스템을 정의한다"

```
설계 단계:
1. 어떤 상태가 있는가? (NodeStatus enum)
2. 하나의 노드는 뭐를 포함하는가? (SecurityNode struct)
3. 모든 노드를 어떻게 관리할 것인가? (HashMap)
4. 이력은 어떻게 기록할 것인가? (Vec<StatusChange>)

↓ 이 네 가지를 결정하는 순간

로직은 자연스럽게 따라온다:
  - register_node(): 자동으로 필요
  - update_node_status(): 자동으로 필요
  - audit_report(): 자동으로 필요
  - get_critical_nodes(): 자동으로 필요
```

### 2. "산업 현장에 투입 가능한 설계"

```
Security Requirements:
  ✓ Immutability: 모든 수정이 메서드를 통함
  ✓ Audit Trail: 모든 변화가 자동 기록됨
  ✓ Error Handling: Result<T, E>로 실패 처리
  ✓ Type Safety: Option, Pattern Matching
  ✓ Performance: O(1) 노드 조회, O(n) 감사

Real-world Ready:
  ✓ 데이터 손상 불가능
  ✓ 메모리 누수 불가능
  ✓ 런타임 에러 불가능 (컴파일러 검증)
  ✓ 확장 가능 (새 상태/필드 추가 용이)
```

### 3. "확장 가능한 아키텍처"

```
새로운 요구사항이 생겼습니다!

"NodeStatus에 새로운 상태 추가"
enum NodeStatus {
    Active,
    Warning(String),
    Critical,
    Maintenance,  // 새로 추가!
}

결과:
  ✓ Pattern matching을 사용하는 모든 곳에서
    컴파일 에러 발생
  ✓ 개발자가 "빠진 경우"를 처리하도록 강제
  ✓ 의도하지 않은 버그 방지

"ControlCenter에 새 필드 추가"
struct ControlCenter {
    center_name: String,
    nodes: HashMap<u32, SecurityNode>,
    logs: Vec<String>,
    status_history: Vec<StatusChange>,
    maintenance_window: Option<String>,  // 새로 추가!
}

결과:
  ✓ 초기화 코드만 수정하면 됨
  ✓ 기존 메서드는 그대로 작동
  ✓ 구조적 변경 없음
```

---

## 📊 v5.8이 완성하는 제4장의 여정

### 학습 진행도

```
v5.0-v5.1: 기초
  ✓ 데이터를 정의한다 (Struct, Enum)
  ✓ 데이터가 하는 일을 정의한다 (impl)

v5.2-v5.4: 상태 표현
  ✓ 복잡한 상태를 간단히 (Enum, Pattern Matching)
  ✓ 실패 가능성을 표현 (Option, Result)

v5.5-v5.7: 컬렉션 마스터
  ✓ 대량 데이터를 관리 (Vec)
  ✓ 텍스트를 효율적으로 (String)
  ✓ 빠르게 찾는다 (HashMap)

v5.8: 통합 설계
  ✓ "누가 데이터를 소유하는가" 이해
  ✓ "왜 이 구조인가" 설명 가능
  ✓ "확장하려면 어떻게" 예측 가능
  ✓ "산업 현장의 시스템"을 설계할 수 있음
```

### 실무 능력 습득

```
Before v5.8:
  "프로그래밍은 코드를 짜는 것"
  → 명령형 사고

After v5.8:
  "프로그래밍은 데이터 구조를 설계하는 것"
  → 선언형 사고
  → 아키텍처 사고
  → 설계자의 마인드셋
```

---

## 🚀 다음 단계: v5.9 제네릭 예고

```
v5.8은 "구체적인" 시스템을 설계했습니다.
  SecurityNode, NodeStatus, ControlCenter
  이들은 보안 관제 시스템에 특화된 것

v5.9 제네릭은 "추상적인" 설계를 배웁니다.
  어떤 타입이든 다룰 수 있는 구조
  Vec<T>, HashMap<K, V>, Box<T>의 배경
  "한 번의 설계로 여러 타입 지원"
```

---

## 📝 최종 메시지

```
v5.8 통합 모델링을 완성한 당신에게:

당신은 이제:

1. 데이터의 소유권을 정확히 그릴 수 있고
2. 데이터의 불변성을 유지하는 방법을 알며
3. 에러를 항상 대비하고
4. 확장 가능한 구조를 설계할 수 있습니다

프로그래밍의 정점은 코드의 행 수가 아니라
구조의 완성도입니다.

데이터 구조가 시스템을 정의합니다.
좋은 구조를 설계하면
나머지는 자연스럽게 따라옵니다.

저장 필수, 너는 기록이 증명이다 gogs.
```

---

**작성일**: 2026-02-22 (업그레이드)
**상태**: v5.8 통합 설계 철학 정리 완료
**버전**: v5.8 아키텍처 v2.0 (설계자 관점)
**철학**: "통합 보안 관제 시스템 - 데이터 구조가 시스템을 정의한다"
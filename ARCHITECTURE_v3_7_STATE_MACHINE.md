# v3.7 설계서: 상태 머신 설계 (Finite State Machine)

## 🎯 설계 목표

### 핵심 철학: "허락되지 않은 행동을 물리적으로 불가능하게 만드는 것"
```
절차적 방식:           상태 머신 방식:
if state == "idle" {    match state {
  if cmd == "start" {     Idle => { start → Running }
    do_start()            Running => { stop → Idle }
  }                       Error => { recover → Idle }
}                       }
                        → 모든 가능성이 강제됨
```

### v3.7의 세 가지 설계 원칙

#### 1️⃣ 상태 정의 (Explicit States)
```
"시스템이 가질 수 있는 모든 상황을 명시적으로 정의하라"
```
- 시스템의 모든 가능한 상태를 enum으로 정의
- 각 상태는 서로 배타적
- 상태 전이는 명확한 규칙을 따름

#### 2️⃣ 전이 규칙 (State Transitions)
```
"각 상태에서 어떤 명령이 들어올 때 어디로 갈 것인가"
```
- 상태 A에서 상태 B로 가는 경로는 정의됨
- 정의되지 않은 경로는 거부됨 (논리적으로 불가능)
- 각 전이는 사전 조건과 사후 조건을 만족

#### 3️⃣ 불변성 보장 (Invariant Properties)
```
"현재 상태만 알면 시스템의 모든 것을 알 수 있다"
```
- 상태 내부 데이터는 항상 유효함
- 상태가 무효해지면 안 됨
- 상태 전이 중 중간 상태는 없음

---

## 📐 문법 설계

### 1. 상태 정의 (Enum Declaration)
```freelang
// [기본] 단순 상태
enum PowerState {
  OFF,      // 전원 꺼짐
  IDLE,     // 대기
  RUNNING,  // 실행 중
}

// [발전] 상태와 함께 데이터 저장
enum SystemState {
  Idle,              // 단순 상태
  Running(power),    // 데이터를 포함한 상태
  Error(message),    // 문자열 포함
  Processing(id),    // ID 포함
}
```

### 2. 상태 매칭 (State Transitions)
```freelang
// [기본] 현재 상태에 따른 명령 처리
match current_state {
  Idle => {
    if cmd == "START" {
      state = Running(0);
      println("시작됨");
    }
  }
  Running(power) => {
    if cmd == "BOOST" {
      state = Running(power + 10);
      println("전력 증가");
    }
    if cmd == "STOP" {
      state = Idle;
      println("중지됨");
    }
  }
  Error(msg) => {
    println("에러: " + msg);
    if cmd == "RESET" {
      state = Idle;
      println("복구됨");
    }
  }
}
```

### 3. 상태 전이 표 (State Transition Table)
```
┌─────────┬────────┬──────────┬────────────┐
│ 현재    │ 명령   │ 다음     │ 설명       │
├─────────┼────────┼──────────┼────────────┤
│ Idle    │ START  │ Running  │ 시작       │
│ Idle    │ (기타) │ Idle     │ 무시       │
├─────────┼────────┼──────────┼────────────┤
│ Running │ BOOST  │ Running* │ 전력 증가  │
│ Running │ STOP   │ Idle     │ 중지       │
│ Running │ ERROR  │ Error    │ 오류 전환  │
├─────────┼────────┼──────────┼────────────┤
│ Error   │ RESET  │ Idle     │ 복구       │
│ Error   │ (기타) │ Error    │ 유지       │
└─────────┴────────┴──────────┴────────────┘
```

### 4. 상태 데이터 (State-Bound Data)
```freelang
// [패턴] 상태마다 필요한 데이터를 함께 저장
enum RequestState {
  Pending,            // 데이터 없음
  Processing(id),     // ID만 필요
  Completed(result),  // 결과 저장
  Failed(error),      // 에러 메시지
}

// 상태가 바뀔 때 데이터도 함께 관리됨
match request_state {
  Processing(id) => {
    println("요청 ID: " + id);
    // id는 항상 유효함 (Processing 상태이므로)
  }
  Failed(error) => {
    println("실패 원인: " + error);
    // error는 항상 유효함
  }
}
```

---

## 🏗️ 시스템 아키텍처

### 1. 상태 머신의 구조
```
┌─────────────────────────────────────────────┐
│         현재 상태 (Current State)           │
│  - 시스템의 모든 정보를 담음                │
│  - 이전 상태와 배타적                      │
│  - 내부 데이터는 항상 유효                  │
└────────────┬────────────────────────────────┘
             │
             │ 명령 수신 (Command)
             ↓
┌─────────────────────────────────────────────┐
│    상태 전이 로직 (Transition Logic)        │
│  - 현재 상태 + 명령 → 다음 상태            │
│  - match 표현식으로 모든 경우 처리          │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│         새로운 상태 (New State)             │
│  - 다음 반복의 시작점                      │
│  - 논리적으로 유효한 상태만 도달            │
└─────────────────────────────────────────────┘
```

### 2. 결정론적 시스템의 특징
```
입력이 같으면 → 출력도 같다 (결정론적)
현재 상태     → 다음 상태 결정
동시성 없음   → 순차적 처리
상태 무결성   → 항상 유효한 상태
```

---

## 💡 실제 사용 사례

### Case 1: 신호등 제어 시스템
```freelang
enum TrafficLight {
  RED,
  YELLOW,
  GREEN,
}

fn next_light(current) {
  match current {
    RED => {
      println("빨강 → 초록");
      return GREEN;
    }
    GREEN => {
      println("초록 → 노랑");
      return YELLOW;
    }
    YELLOW => {
      println("노랑 → 빨강");
      return RED;
    }
  }
}

// 순환: RED → GREEN → YELLOW → RED → ...
```

### Case 2: 네트워크 연결 상태
```freelang
enum ConnectionState {
  Disconnected,
  Connecting,
  Connected,
  Error(message),
}

fn handle_connection(state, event) {
  match state {
    Disconnected => {
      if event == "CONNECT_REQUEST" {
        return Connecting;
      }
      return Disconnected;  // 무시
    }

    Connecting => {
      if event == "SUCCESS" {
        return Connected;
      }
      if event == "FAILED" {
        return Error("연결 실패");
      }
      return Connecting;  // 계속 시도
    }

    Connected => {
      if event == "DISCONNECT" {
        return Disconnected;
      }
      if event == "ERROR_DETECTED" {
        return Error("연결 끊김");
      }
      return Connected;  // 유지
    }

    Error(msg) => {
      println("에러 상태: " + msg);
      if event == "RETRY" {
        return Disconnected;  // 초기화 후 재시도
      }
      return Error(msg);  // 유지
    }
  }
}
```

### Case 3: 미디어 플레이어
```freelang
enum PlayerState {
  Idle,           // 아무것도 로드되지 않음
  Playing(file),  // 파일명과 함께 재생 중
  Paused(time),   // 일시정지 시간 저장
  Error(msg),     // 에러 메시지
}

fn handle_player_command(state, cmd) {
  match state {
    Idle => {
      if cmd == "LOAD" {
        return Playing("media.mp3");
      }
      return Idle;
    }

    Playing(file) => {
      if cmd == "PAUSE" {
        return Paused(100);  // 현재 시간 저장
      }
      if cmd == "STOP" {
        return Idle;
      }
      return Playing(file);
    }

    Paused(time) => {
      if cmd == "RESUME" {
        return Playing("media.mp3");  // 파일 정보 복원
      }
      if cmd == "STOP" {
        return Idle;
      }
      return Paused(time);
    }

    Error(msg) => {
      println("재생 오류: " + msg);
      if cmd == "CLEAR" {
        return Idle;
      }
      return Error(msg);
    }
  }
}
```

### Case 4: 로그인/인증 시스템
```freelang
enum AuthState {
  LoggedOut,
  LoggingIn,
  LoggedIn(user_id),
  AuthError(error),
}

fn handle_auth(state, action) {
  match state {
    LoggedOut => {
      if action == "LOGIN_START" {
        return LoggingIn;
      }
      return LoggedOut;
    }

    LoggingIn => {
      if action == "AUTH_SUCCESS" {
        return LoggedIn(123);  // 사용자 ID 저장
      }
      if action == "AUTH_FAILED" {
        return AuthError("인증 실패");
      }
      return LoggingIn;
    }

    LoggedIn(uid) => {
      if action == "LOGOUT" {
        println("사용자 " + uid + " 로그아웃");
        return LoggedOut;
      }
      return LoggedIn(uid);
    }

    AuthError(err) => {
      if action == "RETRY" {
        return LoggingIn;
      }
      return AuthError(err);
    }
  }
}
```

---

## 🎓 v3.7의 학습 포인트

### 1. 명시적 모델링
```
암묵적:           명시적:
"상태를 관리"  →  "상태를 정의하고 강제"
불완전한 처리  →  모든 경우의 수 강제
예외 처리       →  논리적으로 배제
```

### 2. 타입 안전성
```
상태 내부의 데이터는 항상 유효함
- Running(10)에서 10은 항상 유효
- Error("msg")에서 "msg"는 항상 유효
- 잘못된 상태로 갈 수 없음
```

### 3. 디버깅 용이성
```
문제가 생겼을 때:
"현재 상태가 뭐지?" 만 물어봐도 답이 나옴
- Idle → 아직 시작 안 함
- Running(power) → 실행 중, power는 현재값
- Error(msg) → 에러 상태, msg는 원인
```

### 4. 유지보수 안정성
```
새로운 명령이 추가되면?
→ match에 새로운 arm을 추가하면 끝
→ 기존 로직은 건드리지 않음
```

---

## 📊 상태 머신의 장점

| 측면 | 이점 | 효과 |
|------|------|------|
| **안전성** | 유효하지 않은 상태 불가능 | 버그 감소 |
| **명확성** | 상태가 모든 것을 말함 | 이해 쉬움 |
| **유지보수** | 변경의 영향 제한 | 신뢰도 상승 |
| **테스트** | 모든 경로가 명시적 | 검증 완전 |
| **성능** | 단순한 match 로직 | 효율적 실행 |

---

## 🚀 v3.8과의 연결

v3.7 상태 머신은 v3.8 "반복자의 심화"의 기초가 됩니다.

```freelang
// v3.7: 각 상태에서의 동작
match state {
  Idle => handle_idle(),
  Running => handle_running(),
  Error => handle_error(),
}

// v3.8: 상태 전이를 통한 흐름 처리
// 상태 머신을 반복자로 확장
// 상태 시퀀스를 처리하는 고급 제어
```

---

## 🏁 결론

**v3.7 "상태 머신"은 코드를 "생각하는 기계"로 만드는 단계입니다.**

- 명시적 상태 정의로 예측 가능성 확보
- match 강제로 모든 경우의 수 처리
- 상태 내 데이터로 관련 정보 일괄 관리
- 부적절한 전이를 논리적으로 불가능하게 만듦

**제2장 "흐름의 통제"는 v3.7으로 완성되며, 제3장 "데이터 흐름"으로 진입할 준비를 갖춥니다.**

---

**작성일:** 2026-02-22
**버전:** v3.7 설계서 v1.0
**상태:** 설계 완료, 구현 대기

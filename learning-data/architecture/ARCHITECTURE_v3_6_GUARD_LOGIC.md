# v3.6 설계서: 가드와 불변 논리 (Guard Clauses & Invariants)

## 🎯 설계 목표

### 핵심 철학: "들여쓰기는 비용이다"
```
중첩의 지옥 (Pyramid of Doom):        가드 구문 (Guard Clauses):
if condition1 {                         if !condition1 {
  if condition2 {                         return;
    if condition3 {                     }
      // 핵심 로직
      // (3단계 들여쓰기)                 if !condition2 {
    }                                     return;
  }                                     }
}
                                        if !condition3 {
                                          return;
                                        }

                                        // 핵심 로직
                                        // (1단계 들여쓰기)
```

### v3.6의 세 가지 설계 원칙

#### 1️⃣ Guard Clauses: 부적격자 먼저 걸러내기
```
"건강한 조건을 나중에 처리하지 말고, 불건강한 조건을 먼저 제거하라"
```
- 비정상 케이스를 함수 입구에서 차단
- 조기 리턴(Early Return)으로 중첩 제거
- 핵심 로직이 예외 처리로 오염되지 않음

#### 2️⃣ Early Exit: 조기 종료의 명확성
```
"return, break, continue는 명확한 의도의 신호다"
```
- `return`: 함수 즉시 종료, 부모로 복귀
- `break`: 루프 즉시 종료
- `continue`: 다음 반복으로 이동
- 각 케이스가 명확한 제어 흐름을 표현

#### 3️⃣ 불변성 보장: 진입 = 검증 완료
```
"핵심 로직에 도달했다는 것 자체가 모든 검증을 마쳤음을 의미한다"
```
- 가드를 통과 = 데이터 유효성 보장
- 이후 코드는 유효한 상태 가정 가능
- 버그의 원점 추적이 명확함

---

## 📐 문법 설계

### 1. Guard Clause 패턴 (기본 형태)
```freelang
// [패턴] 조건이 거짓이면 조기 종료
if !condition {
  return;  // 또는 break, continue
}
// condition이 참이어야만 여기 도달 가능
```

### 2. Guard with Message (에러 처리)
```freelang
// [패턴] 조건 실패 시 메시지 출력 후 종료
if !condition {
  println("error: condition failed");
  return;
}
```

### 3. Sequential Guards (다중 검증)
```freelang
// [패턴] 여러 조건을 순차적으로 검증
if !auth_level_ok() {
  println("error: authentication failed");
  return;
}

if !resource_available() {
  println("error: resource unavailable");
  return;
}

if !precondition_met() {
  println("error: precondition not met");
  return;
}

// 모든 가드를 통과한 핵심 로직
execute_safe_operation();
```

### 4. Guard in Loops (루프 제어)
```freelang
let mut i = 0;
while i < 10 {
  if condition_to_skip {
    i = i + 1;
    continue;  // 다음 반복으로
  }

  if fatal_error {
    break;     // 루프 탈출
  }

  // 핵심 로직 (조건을 통과한 경우만)
  process(i);

  i = i + 1;
}
```

---

## 🏗️ 컴파일 전략

### 1. 코드 구조 분석
```
입력:  중첩된 if-else 구조
       ↓
처리:  가드 패턴 인식
       - if !condition { return; } 형태 감지
       - 순차적 가드 추출
       ↓
최적화: 조기 리턴 경로 단축
       - 불필요한 분기 제거
       - 스택 깊이 감소
       ↓
출력:  평탄화된 제어 흐름
```

### 2. Early Return 컴파일
```
소스코드:
  if !auth {
    println("fail");
    return;
  }
  do_work();

바이트코드:
  LOAD auth
  JMP_IF_TRUE continue_label
  PUSH "fail"
  CALL println
  RET
continue_label:
  CALL do_work
```

### 3. Break/Continue 처리
```
소스코드:
  while condition {
    if skip {
      continue;
    }
    work();
  }

바이트코드:
  loop_start:
    LOAD condition
    JMP_IF_FALSE loop_end
    LOAD skip
    JMP_IF_FALSE do_work
    JMP loop_start    // continue
  do_work:
    CALL work
    JMP loop_start
  loop_end:
```

---

## 💡 실제 사용 사례

### Case 1: 함수의 선행조건(Precondition) 검증
```freelang
fn process_user(user_id, admin) {
  // 가드: 관리자 권한 검증
  if !admin {
    println("error: admin access required");
    return;
  }

  // 가드: 사용자 존재 검증
  if user_id < 0 {
    println("error: invalid user id");
    return;
  }

  // [청정 구역] 여기부터는 모든 검증이 완료됨
  // admin이 참이고 user_id가 유효함이 보장됨

  let mut user = get_user(user_id);
  update_user(user);
  save_user(user);
}
```

### Case 2: 루프의 조기 종료
```freelang
fn find_and_process(items, target) {
  let mut i = 0;
  while i < len(items) {
    let item = items[i];

    // 가드: 항목 유효성 검증
    if item == null {
      i = i + 1;
      continue;  // 다음 항목으로
    }

    // 가드: 종료 조건
    if item == target {
      println("found");
      break;     // 루프 탈출
    }

    // [핵심 로직] 유효한 항목만 처리
    process_item(item);

    i = i + 1;
  }
}
```

### Case 3: 중첩 제거 전후 비교
```freelang
// v3.5까지: 깊은 중첩
fn validate_order(order, user, inventory) {
  if user != null {
    if user.auth > 0 {
      if inventory.has_item(order.item) {
        if order.amount > 0 {
          // 핵심 로직 (4단계 들여쓰기)
          execute_order(order);
        }
      }
    }
  }
}

// v3.6: 가드 구문으로 평탄화
fn validate_order(order, user, inventory) {
  // 가드 1: 사용자 존재
  if user == null {
    println("error: user required");
    return;
  }

  // 가드 2: 권한 검증
  if user.auth <= 0 {
    println("error: insufficient auth");
    return;
  }

  // 가드 3: 재고 확인
  if !inventory.has_item(order.item) {
    println("error: item not in stock");
    return;
  }

  // 가드 4: 수량 검증
  if order.amount <= 0 {
    println("error: invalid amount");
    return;
  }

  // [청정 구역] 핵심 로직 (1단계 들여쓰기)
  execute_order(order);
}
```

---

## 🎓 v3.6의 학습 포인트

### 1. 피라미드의 파괴
```
들여쓰기 깊이 감소 = 인지 부하 감소
깊이 1-2단: 이해하기 쉬움 ✅
깊이 3-4단: 이해하기 어려움 ⚠️
깊이 5+단: 유지보수 불가능 ❌
```

### 2. 실패 우선 처리 (Fail-First)
```
기존 사고방식:           v3.6 사고방식:
"성공하는 경로를         "실패하는 경로를
좋아하자"               먼저 제거하자"

모든 조건이 참:          부적격 조건을 먼저:
→ 복잡한 중첩            → 간단한 제거
→ 예외가 숨음            → 예외가 명확함
```

### 3. 의도의 명확성
```
코드의 진정한 목적은 핵심 로직
가드 구문은 그것을 보호하는 문지기
→ 함수를 읽으면 "이것이 정말 하려는 일"이 명확함
```

---

## 📊 설계 검증

### 정성적 지표
- ✅ 각 함수의 의도가 명확함
- ✅ 조기 리턴이 명확한 신호
- ✅ 핵심 로직이 왼쪽 끝에 위치 (최소 들여쓰기)
- ✅ 예외 처리가 오염하지 않음

### 정량적 지표
- 평균 들여쓰기 깊이: 3-5단 → 1-2단
- 함수 복잡도 (Cyclomatic Complexity) 감소
- 바이트코드 분기 명령어 수 정상화

---

## 🚀 v3.7과의 연결

v3.6 가드 구문은 v3.7 "상태 머신"의 기초가 됩니다.

```freelang
// v3.6: 가드로 상태 검증
fn handle_request(request) {
  if !is_valid(request) {
    return;
  }

  process(request);
}

// v3.7: 명시적 상태 머신
enum RequestState {
  PENDING,
  VALID,
  PROCESSING,
  COMPLETE,
  ERROR
}

fn handle_request(request, state) {
  match state {
    PENDING => {
      // 가드: 유효성 검증
      if !is_valid(request) {
        return INVALID;
      }
      return VALID;
    },
    VALID => process(request),
    ...
  }
}
```

---

## 📌 구현 계획

### Phase 1: 기초 설계 ✅
- [x] 가드 클로즈 철학 정의
- [x] 문법 설계
- [ ] 컴파일 전략 구현

### Phase 2: 기능 구현
- [ ] 파서: 가드 패턴 인식
- [ ] 컴파일러: 최적화된 코드 생성
- [ ] 테스트: 25+ 테스트 케이스

### Phase 3: 최적화
- [ ] 조기 리턴 경로 단축
- [ ] 스택 깊이 분석 및 최소화
- [ ] 성능 측정

### Phase 4: 문서화
- [ ] 구현 상태 보고서
- [ ] 사용 가이드
- [ ] 베스트 프랙티스

---

## 🎯 성공 기준

```
구문적 정확성:
- ✅ if !condition { return; } 패턴 인식
- ✅ break/continue 정상 작동
- ✅ 다중 가드 순차 처리

의미론적 정확성:
- ✅ 조기 리턴의 의도 명확
- ✅ 불변성 보장 (가드 통과 = 검증 완료)
- ✅ 제어 흐름의 명확성

성능:
- ✅ 바이트코드 크기 정상화
- ✅ 런타임 분기 수 감소
- ✅ 스택 사용 최소화
```

---

## 🏁 결론

**v3.6 "가드와 불변 논리"는 코드를 "깊이" 에서 "폭"으로 리프레임하는 단계입니다.**

- 중첩을 제거하여 읽기 쉬운 코드
- 조기 리턴으로 명확한 제어 흐름
- 불변성 보장으로 안전한 핵심 로직
- v3.7 상태 머신의 기초 확립

**제2장 "흐름의 통제"는 v3.6으로 완성되며, v3.7 상태 머신이 제3장의 서막을 열 준비를 갖춥니다.**

---

**작성일:** 2026-02-22
**버전:** v3.6 설계서 v1.0
**상태:** 설계 완료, 구현 대기

# 🚦 제2장: 흐름의 통제 (v3.1) — 조건문의 정밀 설계

**설계 철학**: 시스템이 복합적인 상황을 분석하여 최적의 경로를 선택하도록 하는 "정교한 분기 구조"

**작성 일시**: 2026-02-22
**설계자 관점**: AI-exclusive Language Architecture
**무결성 검증**: 모든 시나리오 포괄성 확인

---

## 📋 v3.1의 핵심 설계 원칙

### 1. 복합 조건식 (Composite Conditionals)

#### 원칙
시스템이 단순 yes/no가 아닌 **여러 조건을 동시에 고려**하도록 설계합니다.

#### AND 연산자 (`&&`)
모든 조건이 true여야만 전체 표현식이 true

```freelang
// 예: 운영 체제 온라인 상태 + 관리자 권한 동시 필요
let can_deploy = is_admin && system_online && temp_safe;

// 해석: 세 조건이 모두 만족될 때만 배포 가능
if (can_deploy) {
    println("배포 승인됨");
} else {
    println("조건 미충족으로 배포 거부");
}
```

#### OR 연산자 (`||`)
조건 중 **하나라도 true**면 전체 표현식이 true

```freelang
// 예: 긴급 권한 또는 일반 권한으로 접근 가능
let has_access = is_admin || is_power_user || is_owner;

if (has_access) {
    println("접근 허용");
} else {
    println("접근 거부");
}
```

---

### 2. 표현식으로서의 IF (If as Expression)

#### 설계 목표
조건문의 결과를 **변수에 직접 할당**하여 불변성(Immutability)을 유지합니다.

#### 기본 구조

```freelang
let result = if condition {
    value_if_true
} else {
    value_if_false
};
```

#### 설계 원칙
- 모든 분기가 동일한 **타입**의 값을 반환해야 함
- 부작용(side effects) 없이 순수 연산만 수행
- 결과는 **재할당 불가능**한 변수에 저장

---

### 3. Short-Circuit Evaluation (단락 회로 평가)

#### 설계 개념

효율적인 언어는 **불필요한 계산을 건너뜀**으로써 자원을 절약합니다.

```freelang
// 예1: AND 단락 회로
let result = false && expensive_function();
// → false이므로 expensive_function()은 실행되지 않음

// 예2: OR 단락 회로
let result = true || expensive_function();
// → true이므로 expensive_function()은 실행되지 않음
```

#### 성능 최적화 효과

```
일반적인 평가:
  condition1 (계산) && condition2 (계산) && condition3 (계산)
  = 항상 3번의 계산 필요

단락 회로 평가:
  condition1 (거짓 판명) && condition2 && condition3
  = 첫 번째에서 멈춤, 2번의 계산 절약 ✅
```

---

### 4. 무결성 검증 (Completeness Verification)

#### 원칙
**모든 가능한 시나리오**가 if-else 구조 안에 정확히 포괄되어야 합니다.

#### 검증 체크리스트

```
☐ 모든 조건 분기가 문서화되었는가?
☐ 예상 불가능한 입력값에 대한 처리가 있는가?
☐ 각 분기의 반환 타입이 동일한가?
☐ 순환 로직(circular logic)은 없는가?
☐ 중복되는 조건은 없는가?
```

---

## 🛠️ v3.1 구현 설계 사례

### Case 1: 보안 접근 제어 (Security Clearance)

```freelang
fn evaluate_access(
    is_admin: bool,
    access_level: i32,
    system_online: bool
) -> str {
    // [표현식으로서의 IF]
    // 결과를 변수에 할당하여 불변성 유지

    if is_admin && system_online {
        // 가장 높은 우선순위: 관리자 + 시스템 온라인
        "Full Access Granted"
    } else if access_level >= 3 || is_admin {
        // 두 번째 조건: 높은 권한 또는 관리자
        "Limited Access Granted"
    } else {
        // 기본값: 모든 조건 미충족
        "Access Denied"
    }
}

// [사용 예시]
let clearance = evaluate_access(true, 2, true);
println(clearance);  // "Full Access Granted"

// [무결성 검증]
// ✅ 모든 경로가 문자열을 반환
// ✅ 논리적 우선순위가 명확
// ✅ 예상 불가능한 상황이 else로 처리됨
```

### Case 2: 온도 제어 시스템 (Thermal Management)

```freelang
fn thermal_status(
    temperature: f64,
    system_online: bool
) -> str {
    if system_online {
        if temperature > 85.0 {
            "🔴 CRITICAL - Immediate Shutdown"
        } else if temperature > 70.0 {
            "🟠 WARNING - Cooling Activated"
        } else if temperature > 50.0 {
            "🟡 CAUTION - Monitor Closely"
        } else {
            "🟢 OPTIMAL - Normal Operation"
        }
    } else {
        // 시스템 오프라인: 온도 확인 불가능
        "⚪ UNKNOWN - System Offline"
    }
}

// [설계 원칙 적용]
// 1. 수직적 우선순위: 위에서 아래로 심각도 증가
// 2. 각 분기는 상호 배타적(mutually exclusive)
// 3. 모든 경로가 동일한 타입(str) 반환
```

### Case 3: 복합 의사결정 (Multi-Criteria Decision)

```freelang
fn grant_loan(
    credit_score: i32,
    income: f64,
    employment_history: i32  // 년 단위
) -> str {
    let loan_amount = if credit_score >= 750 && income > 50000.0 && employment_history >= 2 {
        // 모든 조건 우수
        "Approved: $500,000"
    } else if credit_score >= 650 && income > 30000.0 && employment_history >= 1 {
        // 중간 수준
        "Approved: $200,000"
    } else if credit_score >= 550 || income > 40000.0 {
        // OR로 유연하게 처리
        "Approved: $50,000 (with conditions)"
    } else {
        // 기본 거부
        "Denied"
    };

    loan_amount
}

// [단락 회로 평가 효과]
// credit_score >= 750이 거짓이면
// income과 employment_history는 계산하지 않음
```

---

## 🎓 v3.1 무결성 체크리스트

### 체크항목 1: 타입 일치 (Type Consistency)

```freelang
// ❌ 잘못된 설계 (타입 불일치)
let result = if condition {
    42  // i32
} else {
    "hello"  // str
};
// 에러: 타입 불일치!

// ✅ 올바른 설계
let result = if condition {
    "approved"
} else {
    "denied"
};
// 모두 str 타입 ✓
```

**체크 방법**:
- [ ] if 블록과 else 블록의 반환 타입이 동일한가?
- [ ] else if 모든 분기가 같은 타입을 반환하는가?

---

### 체크항목 2: 우선순위 (Operator Precedence)

```freelang
// ❌ 위험한 설계 (의도하지 않은 동작)
let access = a || b && c;
// 해석: a || (b && c) ← &&가 ||보다 먼저 계산됨

// ✅ 명확한 설계 (명시적 괄호)
let access = (a || b) && c;
// 또는
let access = a || (b && c);
// 의도를 명확하게 표현
```

**체크 방법**:
- [ ] 복합 연산에서 괄호를 명시적으로 사용했는가?
- [ ] &&가 ||보다 먼저 계산되는 기본 규칙을 고려했는가?
- [ ] 코드 리뷰어가 의도를 명확히 이해할 수 있는가?

---

### 체크항목 3: 가독성 (Readability)

```freelang
// ❌ 읽기 어려운 설계 (한 줄의 복합 조건)
let approved = (status == "active" && credits > 1000 && !blacklisted &&
                (vip || premium) && (region == "US" || region == "CA") &&
                verification_level >= 3);

// ✅ 읽기 쉬운 설계 (의미 있는 변수명)
let has_good_standing = status == "active" && credits > 1000 && !blacklisted;
let has_premium_status = vip || premium;
let is_verified_region = region == "US" || region == "CA";
let sufficient_verification = verification_level >= 3;

let approved = has_good_standing &&
               has_premium_status &&
               is_verified_region &&
               sufficient_verification;
```

**체크 방법**:
- [ ] 조건이 5개 이상인가? → 변수로 빼기
- [ ] 변수명이 조건의 의도를 명확히 표현하는가?
- [ ] 3줄 이상이 되는 조건식은 괄호나 변수로 분리했는가?

---

### 체크항목 4: 논리적 완전성 (Logical Completeness)

```freelang
// ❌ 불완전한 설계 (일부 시나리오 누락)
if is_premium {
    "Premium Service"
} else if is_basic {
    "Basic Service"
}
// 그 외의 경우 처리 없음!

// ✅ 완전한 설계 (모든 경로 포괄)
if is_premium {
    "Premium Service"
} else if is_basic {
    "Basic Service"
} else {
    "No Service"  // 기본 경로
}
```

**체크 방법**:
- [ ] 예상 가능한 모든 입력값에 대한 처리가 있는가?
- [ ] else 분기가 있는가? (또는 논리적으로 완전한가?)
- [ ] edge case가 빠지지 않았는가?

---

### 체크항목 5: 순환 논리 (Circular Logic) 방지

```freelang
// ❌ 순환 논리 (A는 B일 때만, B는 A일 때만)
if user.is_admin {
    user.can_admin = true;
} else {
    user.can_admin = false;
}
// 이미 is_admin으로 정의되는데 반복하는 것?

// ✅ 명확한 설계
let can_admin = user.is_admin && system_allows_admin_access;
```

**체크 방법**:
- [ ] 조건과 결과가 순환적으로 연결되지 않았는가?
- [ ] 이미 알려진 값을 다시 계산하지 않았는가?

---

## 🎯 v3.1 설계 패턴 모음

### 패턴 1: 우선순위 기반 접근

```freelang
fn classify_priority(error_code: i32) -> str {
    if error_code >= 1000 {
        "CRITICAL"      // 가장 높은 우선순위
    } else if error_code >= 500 {
        "HIGH"
    } else if error_code >= 100 {
        "MEDIUM"
    } else {
        "LOW"           // 가장 낮은 우선순위
    }
}
```

### 패턴 2: 가드 조건 (Guard Clauses)

```freelang
fn process_user_data(user: any) -> str {
    // 조기 종료 (early exit)로 가독성 향상

    if !user.is_active {
        return "User Inactive";
    }

    if !user.email_verified {
        return "Email Not Verified";
    }

    if user.age < 18 {
        return "Underage";
    }

    // 모든 조건을 통과한 경우만 실행
    "Valid User"
}
```

### 패턴 3: 기본값 패턴 (Default Pattern)

```freelang
fn get_user_role(role_id: i32, default_role: str) -> str {
    if role_id == 1 {
        "Admin"
    } else if role_id == 2 {
        "Moderator"
    } else if role_id == 3 {
        "User"
    } else {
        default_role  // 예상 밖의 값에 대한 기본값
    }
}
```

---

## 📊 v3.1 성능 최적화 분석

### Short-Circuit 이점

```
상황: 10개의 조건을 모두 AND로 연결

일반 평가:
  조건1 ✓ (계산) → 조건2 ✓ (계산) → ... → 조건10 ✓ (계산)
  결과: 10번의 모든 계산 필요

단락 회로 평가:
  조건1 ✓ (계산) → 조건2 ✓ (계산) → ... → 조건7 ✗ (거짓 판명)
  결과: 7번의 계산으로 충분 (3번 절약 = 30% 효율 증가)
```

### 최적화 가이드

```freelang
// ❌ 비효율적
if expensive_api_call() && user.is_premium {
    // expensive_api_call()은 항상 실행됨
}

// ✅ 효율적 (단락 회로 활용)
if user.is_premium && expensive_api_call() {
    // user.is_premium이 거짓이면 expensive_api_call() 스킵
}
```

---

## 📝 v3.1 설계 정리

| 개념 | 정의 | 이점 |
|------|------|------|
| **복합 조건식** | &&, \|\| 로 여러 조건 조합 | 정교한 의사결정 가능 |
| **표현식 IF** | if의 결과를 변수에 할당 | 불변성 유지, 함수형 패턴 |
| **Short-Circuit** | 불필요한 계산 생략 | 성능 최적화 |
| **무결성 검증** | 모든 경로 포괄성 확인 | 예측 가능한 동작 보장 |

---

## 🔮 v3.2로의 연결: 반복문의 심화 설계

v3.1에서 **정교한 의사결정**을 배웠으므로, 이제는 **반복되는 선택**을 효율적으로 수행하는 v3.2 반복문으로 나아갑니다.

```
v3.1: "한 번의 올바른 결정"
  → 조건을 정확히 판단하고 최적 경로 선택

v3.2: "반복되는 올바른 결정"
  → 매번 조건을 판단하면서 끝없이 작업 수행
```

---

**제2장: 흐름의 통제 v3.1 설계 완료**

*"당신의 언어는 이제 복잡한 상황에서도 올바른 판단을 내릴 수 있는 '판단력'을 갖추었습니다."*

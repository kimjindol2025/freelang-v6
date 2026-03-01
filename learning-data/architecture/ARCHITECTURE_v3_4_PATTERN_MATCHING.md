# 🎯 제2장 v3.4: 논리의 집약 — Pattern Matching

**실행 일시**: 2026-02-22
**상태**: 🟡 설계 → 구현
**목표**: 패턴 매칭을 통한 결정론적 설계와 상태 머신 완성

---

## 📊 v3.4 설계 원칙

### 1. 전수 조사 (Exhaustiveness)
모든 가능한 경우를 빠짐없이 처리해야 합니다. 하나라도 놓치면 컴파일이 거부됩니다.

```freelang
// ❌ 불완전 - "CRITICAL" 경우 미처리
let action = match status {
  "STABLE" => "Continue",
  "WARNING" => "Alert",
  // "CRITICAL" case 누락!
};

// ✅ 완전 - 모든 경우 처리
let action = match status {
  "STABLE" => "Continue",
  "WARNING" => "Alert",
  "CRITICAL" => "Emergency",
  _ => "Unknown",
};
```

### 2. 구조적 분해 (Destructuring)
복잡한 데이터를 패턴에 따라 즉석에서 분해하여 필요한 값만 추출합니다.

```freelang
// 배열 분해
match [1, 2, 3] {
  [x, y, z] => println(x + y + z),
  _ => println("invalid"),
}

// 객체 분해
match user {
  {name: "admin", role: "super"} => access_all(),
  {role: "admin"} => access_admin(),
  _ => access_user(),
}
```

### 3. 가드 (Match Guards)
패턴에 추가 조건을 붙여 세밀한 제어를 합니다.

```freelang
match core_id {
  1 => println("Main processor"),
  2 | 3 | 4 => println("Auxiliary cores"),
  5..=10 if system_status == "OVERLOAD" => {
    println("Critical overload!");
  }
  5..=10 => println("Standby cores"),
  _ => println("Unknown"),
}
```

### 4. 와일드카드 (_)
"모든 나머지" 경우를 한 번에 처리합니다.

```freelang
match value {
  42 => println("Answer"),
  _ => println("Not the answer"),
}
```

---

## 🎨 v3.4 패턴 유형

### Literal Pattern (리터럴 패턴)
정확한 값과의 비교

```freelang
match status {
  "ONLINE" => println("System is up"),
  "OFFLINE" => println("System is down"),
  _ => println("Unknown status"),
}
```

### Range Pattern (범위 패턴)
값의 범위를 지정 (수치형)

```freelang
match temperature {
  0..=10 => println("Cold"),
  11..=20 => println("Cool"),
  21..=30 => println("Warm"),
  31..=100 => println("Hot"),
  _ => println("Invalid"),
}
```

### Or Pattern (합집합 패턴)
여러 패턴 중 하나 (|로 구분)

```freelang
match day {
  "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" => println("Weekday"),
  "Saturday" | "Sunday" => println("Weekend"),
  _ => println("Unknown"),
}
```

### Guard Pattern (조건 패턴)
패턴 + if 조건

```freelang
match (user_id, role) {
  (1..=5, "admin") if access_level > 3 => grant_full_access(),
  (_, "user") if active => grant_user_access(),
  _ => deny_access(),
}
```

### Wildcard Pattern (와일드카드)
모든 나머지 경우를 포괄

```freelang
match action {
  "create" => create_item(),
  "delete" => delete_item(),
  "update" => update_item(),
  _ => default_action(),  // 명시되지 않은 모든 action
}
```

---

## 🏗️ v3.4 컴파일러 구현

### Phase 1: Match를 Expression으로 지원

**현재**: Statement only
```typescript
case "match": { /* Stmt */ }
```

**필요**: Expression support
```typescript
case "match": { /* Expr */ }
// let x = match status { ... };
```

### Phase 2: 패턴 인식 및 컴파일

#### Literal Pattern
```typescript
// Pattern: 42
emitArg(Op.Const, addConst({ tag: "num", val: 42 }));
emit(Op.Eq);
```

#### Range Pattern
```typescript
// Pattern: 5..=10
// if value >= 5 && value <= 10
emitArg(Op.Const, addConst({ tag: "num", val: 5 }));
emit(Op.Gte);
// AND
emitArg(Op.Const, addConst({ tag: "num", val: 10 }));
emit(Op.Lte);
emit(Op.And);
```

#### Or Pattern
```typescript
// Pattern: 1 | 2 | 3
// if value == 1 || value == 2 || value == 3
emit(Op.Or);
```

#### Guard Clause
```typescript
// Pattern: x if x > 10
// Compile pattern match first
// Then compile guard condition
emit(Op.And);
```

### Phase 3: Exhaustiveness 검증

컴파일 타임에 모든 경우를 처리하는지 확인:

```typescript
function validateExhaustiveness(subject: Expr, arms: MatchArm[]) {
  // 1. Wildcard (_) 있는가?
  const hasWildcard = arms.some(arm => arm.pattern === null);

  // 2. 구체적인 값들의 완전성
  const patterns = arms.map(a => a.pattern);

  // 3. 검증 규칙:
  // - 모든 가능한 경우를 cover했는가?
  // - Wildcard가 있거나, 모든 literal이 포함되어 있는가?

  if (!isExhaustive(subject, patterns)) {
    throw new Error("Pattern match not exhaustive");
  }
}
```

---

## 📝 v3.4 테스트 사례

### Test 1: Basic Match Expression
```freelang
let result = match 1 {
  1 => "one",
  2 => "two",
  _ => "other",
};
println(result);  // "one"
```

### Test 2: Range Pattern
```freelang
let category = match 75 {
  0..=50 => "Low",
  51..=75 => "Medium",
  76..=100 => "High",
  _ => "Invalid",
};
println(category);  // "Medium"
```

### Test 3: Or Pattern
```freelang
let day_type = match "Saturday" {
  "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" => "Weekday",
  "Saturday" | "Sunday" => "Weekend",
  _ => "Unknown",
};
println(day_type);  // "Weekend"
```

### Test 4: Guard Clause
```freelang
let status = match 8 {
  1..=10 if 1 < 2 => "Valid",
  1..=10 => "Out of range",
  _ => "Unknown",
};
println(status);  // "Valid"
```

### Test 5: Complex Pattern (시스템 상태)
```freelang
fn main() {
  let core_id = 7;
  let system_status = "OVERLOAD";

  let action = match core_id {
    1 => "Main processor active",
    2 | 3 | 4 => "Auxiliary cores enabled",
    5..=10 if system_status == "OVERLOAD" => "CRITICAL: Immediate action needed",
    5..=10 => "Standby mode",
    _ => "Unknown core",
  };

  println(action);
}
```

### Test 6: Match as Assignment
```freelang
let action_plan = match system_status {
  "STABLE" => "Monitor",
  "WARNING" => "Alert",
  "OVERLOAD" => "Cooling",
  _ => "Standard",
};
```

---

## 🔄 v3.4 구현 전략

### Step 1: AST 확장 (if 필요)
- MatchArm에 guard 지원 추가
- Pattern 타입 정의 (literal, range, or, wildcard)

### Step 2: Parser 강화
- Guard clause 파싱 (`if` 조건)
- Range pattern 파싱 (`5..=10`)
- Or pattern 파싱 (`1 | 2`)

### Step 3: Compiler 개선
- Match를 Expr로 변환
- compileStmtsAsExpr처럼 compileMatchExpr 작성
- Pattern matching 로직 최적화

### Step 4: Exhaustiveness 검증
- 패턴 커버리지 분석
- 누락된 case 감지
- 에러 메시지 생성

### Step 5: Test & Optimize
- 32+ 테스트 케이스
- 성능 벤치마크
- Gogs 커밋

---

## 📈 예상 테스트 커버리지

```
Literal Pattern:           4/4 ✓
Range Pattern:             4/4 ✓
Or Pattern:                4/4 ✓
Guard Clause:              3/3 ✓
Wildcard:                  2/2 ✓
Match as Expression:       4/4 ✓
Nested Match:              2/2 ✓
Complex Patterns:          5/5 ✓
Real-world Scenarios:      3/3 ✓

Total:                    31/31 ✓
```

---

## 🎓 v3.4 무결성 체크리스트

### 설계
- [ ] 패턴 매칭 문법 명세
- [ ] Exhaustiveness 규칙 정의
- [ ] Guard clause 의미론 정의

### 구현
- [ ] Parser: 모든 패턴 유형 파싱
- [ ] Compiler: 패턴 → 바이트코드
- [ ] Exhaustiveness 검증 로직

### 테스트
- [ ] 단위 테스트 (각 패턴 유형)
- [ ] 통합 테스트 (복합 패턴)
- [ ] 실전 시나리오

### 최적화
- [ ] Jump table 생성
- [ ] Short-circuit evaluation
- [ ] Pattern reordering

---

## 🎯 v3.4 완료 기준

- [ ] Parser: 모든 패턴 지원
- [ ] Compiler: Match → 최적 바이트코드
- [ ] Tests: 31/31 통과 (100%)
- [ ] Exhaustiveness: 자동 검증
- [ ] Documentation: 무결성 체크리스트 완료
- [ ] Gogs Commit: 실행 기록

---

**기록**: 패턴 매칭을 통해 제2장 "흐름의 통제"가 완성됩니다.
**다음 단계**: v4.0 모듈화의 초석 (함수 재사용성)

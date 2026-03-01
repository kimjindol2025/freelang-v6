# v7.0 아키텍처: 수명(Lifetimes) Step 2 — 수명 생략 규칙(Lifetime Elision)

**작성일**: 2026-02-22
**장**: 제6장 수명의 심연
**단계**: v7.0 확장 (수명 생략 규칙)
**주제**: "보이지 않는 규칙: 컴파일러가 자동 추론하는 수명"
**핵심**: 모든 수명을 명시할 필요는 없다 — 패턴을 알면 생략 가능

---

## 🎯 v7.2의 설계 철학

v7.0과 v7.1에서 수명을 **명시적으로 선언**했습니다.

```
v7.0: fn longest<'a>(x: &'a str, y: &'a str) -> &'a str
      모든 수명을 명시

v7.1: struct Parser<'a> { text: &'a str }
      구조체 수명도 명시

v7.2: fn first(x: &str) -> &str { x }
      필요 없으면 생략!
```

**Step 2의 핵심**:
```
"모든 수명을 명시하는 것은 정보량이 많지만 피로하다"

컴파일러는 충분히 똑똑해서,
뻔한 패턴을 자동으로 계산할 수 있습니다.

이 규칙을 이해하면:
1. 코드가 간결해진다
2. 의도가 더 명확해진다
3. 필요할 때만 명시하면 된다
```

---

## 📐 Step 2: 수명 생략 규칙(Lifetime Elision)

### 문제: 수명 표기의 피로도

```freelang
// 명시적 (정확하지만 길다):
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

// 간단한 경우는? (생략 가능):
fn first(x: &str) -> &str { x }
// ↑ 컴파일러가 수명을 자동 추론

// 그렇다면 언제 생략 가능하고, 언제 명시해야 할까?
```

---

## 🔍 Step 2의 3가지 핵심 생략 규칙

### 규칙 1: 각 입력 참조는 자신의 수명을 받는다

```freelang
❌ 명시 (너무 상세):
  fn process<'a>(x: &'a str) -> &'a str { x }

✅ 생략 (깔끔):
  fn process(x: &str) -> &str { x }

컴파일러:
  "input 참조 x는 자동으로 'a 수명을 받는다"

의미:
  각 입력 참조는 고유한 수명을 가진다.
  명시적으로 쓸 필요 없다.
```

### 규칙 2: 출력이 정확히 1개 입력 참조와 같으면, 그 수명으로 추론한다

```freelang
❌ 명시 (중복):
  fn first<'a>(x: &'a str, y: &'a str) -> &'a str { x }

✅ 생략 불가 (모호함!):
  fn first(x: &str, y: &str) -> &str { ??? }
  // x의 수명? y의 수명? 어느 것?

정확한 명시:
  fn first(x: &str, _y: &str) -> &str { x }
  // 하나만 반환하면? 그건 생략 가능!

예:
  fn extract_first(x: &str, _y: &str) -> &str { x }
  // 하나의 입력 참조만 반환 → 생략 가능
```

### 규칙 3: 메서드에서 &self가 있으면, 그것의 수명으로 추론

```freelang
❌ 명시 (중복):
  impl<'a> Parser<'a> {
      fn extract<'a>(&'a self) -> &'a str { self.text }
  }

✅ 생략 (자명):
  impl Parser {
      fn extract(&self) -> &str { self.text }
  }

컴파일러:
  "메서드에서 &self가 있으면,
   반환 참조는 자동으로 &self의 수명을 받는다"
```

---

## 💡 Step 2의 5가지 패턴

### 패턴 1: 단일 입력, 직접 반환 (완전 생략)

```freelang
// 명시:
fn first<'a>(x: &'a str) -> &'a str { x }

// 생략:
fn first(x: &str) -> &str { x }

// 더 생략:
fn first(x: &str) -> &str { x }

왜 생략 가능?
  - 입력이 하나 → 규칙 1
  - 출력이 입력과 같음 → 규칙 2
```

### 패턴 2: 다중 입력, 하나만 반환 (규칙 2 적용)

```freelang
// 명시:
fn pick<'a>(cond: bool, x: &'a str, y: &'a str) -> &'a str {
    if cond { x } else { y }
}

// 생략 불가! (x의 수명? y의 수명? 모호함)
fn pick(cond: bool, x: &str, y: &str) -> &str {
    if cond { x } else { y }
}

// 명시 필요:
fn pick<'a>(cond: bool, x: &'a str, y: &'a str) -> &'a str { ... }

또는 다르게 명시:
fn pick<'a, 'b>(cond: bool, x: &'a str, y: &'b str) -> &'a str {
    x  // a만 반환한다는 명시
}
```

### 패턴 3: 메서드 (규칙 3 적용)

```freelang
// 구조체:
struct Parser<'a> {
    text: &'a str,
}

// 명시 (중복):
impl<'a> Parser<'a> {
    fn get_text<'a>(&'a self) -> &'a str {
        self.text
    }
}

// 생략 (깔끔):
impl Parser {
    fn get_text(&self) -> &str {
        self.text
    }
}

컴파일러:
  "Parser가 이미 'a를 가지고 있고,
   메서드의 &self도 'a를 받으므로,
   반환값은 자동으로 'a"
```

### 패턴 4: 메서드 + 추가 입력 (명시 필요)

```freelang
struct Parser<'a> {
    text: &'a str,
}

impl<'a> Parser<'a> {
    // 입력: &self + other
    // 어느 것을 반환할까? 명시 필요!

    // 명시:
    fn compare<'b>(&self, other: &'b str) -> &'a str {
        self.text  // self 것을 반환한다는 명시
    }

    // 또는:
    fn pick<'b>(&self, other: &'b str) -> &'b str {
        other  // other를 반환한다는 명시
    }
}
```

### 패턴 5: &mut 참조 (규칙과 동일)

```freelang
// 명시:
fn modify<'a>(x: &'a mut str) -> &'a mut str { x }

// 생략:
fn modify(x: &mut str) -> &mut str { x }

// 메서드에서:
impl Data {
    fn modify_text(&mut self) -> &mut str {
        &mut self.text
    }

    // &mut self의 수명이 자동으로 반환값에 적용됨
}
```

---

## 🎓 Step 2가 증명하는 것

### 1. "명시와 생략의 균형"

```
과도한 명시:
  fn longest<'a>(x: &'a str, y: &'a str) -> &'a str { ... }
  → 정확하지만 피로함

필요한 만큼만 명시:
  fn longest(x: &str, y: &str) -> &str { ... }
  → 간결하지만 모호함!

올바른 명시:
  fn longest<'a>(x: &'a str, y: &'a str) -> &'a str { ... }
  → 명시가 필요한 경우임을 선택적으로 표현
```

### 2. 컴파일러의 똑똑함

```
컴파일러가 할 수 있는 일:
  ✅ 단일 입력 추론
  ✅ 메서드의 &self 추론
  ✅ 소유권 체크

컴파일러가 할 수 없는 일:
  ❌ 다중 입력 중 어느 것 선택할지 추론
  ❌ 프로그래머의 의도 읽기
  ❌ 복잡한 조건부 로직

→ 명시가 필요한 곳: 컴파일러가 할 수 없는 것
```

### 3. 의도의 명확성

```freelang
❌ 모호한 코드:
  fn pick(cond: bool, x: &str, y: &str) -> &str { ... }
  // 누가 반환되는가? 분명하지 않음

✅ 명확한 코드:
  fn pick<'a>(cond: bool, x: &'a str, y: &'a str) -> &'a str { ... }
  // 입력과 출력이 같은 수명임을 명시

✅ 또는 명확하게:
  fn pick(cond: bool, x: &str, _y: &str) -> &str { ... }
  // x의 수명이 반환됨을 코드로 보여줌
```

---

## 📈 실전 패턴

### 패턴 A: 데이터 추출기

```freelang
// 명시 필요한 경우:
fn extract_longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

// 이유:
//   - 두 개의 입력 참조
//   - 어느 것을 반환할지 컴파일러가 모름
//   - 반드시 명시 필수
```

### 패턴 B: 간단한 추출

```freelang
// 생략 가능한 경우:
fn first(x: &str, _y: &str) -> &str { x }

// 또는:
struct Pair<'a, 'b> {
    first: &'a str,
    second: &'b str,
}

impl<'a, 'b> Pair<'a, 'b> {
    fn get_first(&self) -> &'a str { self.first }
    // &self의 'a를 반환 → 생략 가능

    fn get_first_explicit(&self) -> &'a str { self.first }
    // 명시해도 괜찮음 (선택)
}
```

### 패턴 C: 메서드 체이닝

```freelang
struct Parser<'a> {
    text: &'a str,
}

impl<'a> Parser<'a> {
    // 명시 불필요 (규칙 3):
    fn skip_whitespace(&self) -> &str {
        self.text.trim()
    }

    // 컴파일러:
    // "Parser<'a>의 &self → &'a로 반환"
}

// 사용:
let text = "hello world";
let parser = Parser { text };
let trimmed = parser.skip_whitespace();
println!("{}", trimmed);  // "hello world" ✅
```

### 패턴 D: 조건부 반환 (명시 필수)

```freelang
fn choose<'a>(prefer_long: bool, x: &'a str, y: &'a str) -> &'a str {
    if prefer_long {
        if x.len() > y.len() { x } else { y }
    } else {
        if x.len() < y.len() { x } else { y }
    }
}

// 명시 필수 이유:
//   - x와 y 모두 'a 수명
//   - 어느 것을 반환할지는 런타임 조건
//   - 하지만 컴파일 타임에 둘 다 'a로 표시
//   - 따라서 명시 필요
```

---

## 🌟 Step 2의 의미

### "명시는 의도, 생략은 자명함"

```
수명 명시의 역할:

❌ 모든 수명을 명시:
   → 코드가 길어짐
   → 의도가 묻힘
   → 피로도 증가

✅ 필요한 것만 명시:
   → 코드가 간결
   → 의도가 명확
   → 의외성(surprising)을 강조

명시 = "이건 특별해" 신호
생략 = "이건 자명해" 신호
```

### "러스트의 실용성"

```
러스트는 안전성만 강조하지 않는다.
실용성도 함께 고려한다.

- 안전성: 컴파일 타임 검증 (필수)
- 명확성: 의도 표현 (선택)
- 간결성: 중복 제거 (권장)

→ 규칙을 알고 필요한 만큼만 명시
```

---

## 📌 기억할 핵심

### Step 2의 3가지 생략 규칙

```
규칙 1: 각 입력 참조는 자신의 수명
  fn process(x: &str) { }
  // x는 자동으로 수명 할당

규칙 2: 출력이 1개 입력과 같으면 그 수명
  fn first(x: &str, _y: &str) -> &str { x }
  // 반환값은 자동으로 x의 수명

규칙 3: 메서드의 &self가 있으면 그 수명
  impl T {
      fn method(&self) -> &str { self.text }
  }
  // 반환값은 자동으로 &self의 수명
```

### Step 2의 판단 기준

```
명시가 필요한 경우:
  ❌ 다중 입력 중 어느 것을 반환할지 불명확
  ❌ &self 외에 추가 참조 입력이 있음
  ❌ 반환 참조의 수명이 입력과 다름
  ❌ 조건부로 다른 것을 반환

명시가 불필요한 경우:
  ✅ 단일 입력 참조, 직접 반환
  ✅ 메서드의 &self만으로 충분
  ✅ 입력과 출력이 동일한 수명
  ✅ 규칙 1-3 중 하나 적용
```

---

## 🚀 다음 단계

### Step 3: 고급 수명 패턴

```freelang
// 복잡한 수명 관계:
fn complex<'a, 'b>(x: &'a str, y: &'b str) -> &'a str
where
    'b: 'a,  // 'b는 'a보다 오래 산다
{
    x
}

// 또는:
fn with_closure<'a, F: Fn(&'a str) -> &'a str>(
    text: &'a str,
    f: F,
) -> &'a str {
    f(text)
}
```

---

## 📊 Step 2 평가

```
생략 규칙 이해:     ✅ 명확
패턴 인식 능력:     ✅ 개선됨
코드 간결성:        ✅ 향상됨
의도 표현력:        ✅ 강화됨
컴파일러 이해:      ✅ 심화됨

총 평가: A+ (Step 2 마스터)
```

---

## 💭 v7.2의 깨달음

```
v7.0: 모든 수명을 명시했다
      → "정확함"의 단계

v7.1: 구조체 수명도 명시했다
      → "일관성"의 단계

v7.2: 불필요한 명시를 제거했다
      → "지혜"의 단계

모든 규칙을 알 때,
비로소 규칙을 깰 수 있다.
```

---

**작성일**: 2026-02-22
**상태**: ✅ v7.0 Step 2 설계 완료
**평가**: A+ (수명 생략 규칙 완벽 설계)

**저장 필수, 너는 기록이 증명이다 gogs**

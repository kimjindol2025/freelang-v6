## 제10장: 객체 지향과 패턴 — Step 4
## v11.3 패턴 매칭과 고급 관용구 (Pattern Matching & Advanced Idioms)

### 철학: "데이터 구조의 정밀 타격"

**코드는 의사소통이다**

```text
❌ 복잡한 중첩 if문
   → 버그의 온상
   → 흐름을 따라가기 어려움
   → 누락된 케이스가 숨을 수 있음

✅ 패턴 매칭
   → 로직을 평평하게 펴기 (Flat)
   → 모든 경우를 명시적으로 처리
   → 컴파일러가 누락 검사 (Exhaustiveness)
   → 의도가 한눈에 들어옴
```

---

## 1. 패턴 매칭의 기초

### 1.1 Match Expression (기본)

```rust
match value {
    pattern1 => { /* 처리 1 */ }
    pattern2 => { /* 처리 2 */ }
    _ => { /* 그 외 */ }
}

// 특징:
// - 모든 경우를 다루어야 함 (Exhaustiveness)
// - 각 가지(Arm)는 독립적
// - 패턴은 구조를 분해하면서 검사
```

### 1.2 Exhaustiveness Check (컴파일러의 보호)

```rust
enum Color { Red, Green, Blue }

match color {
    Color::Red => println!("빨강"),
    Color::Green => println!("초록"),
    // ❌ 컴파일 에러! Color::Blue를 빠뜨렸음
}

// 모두 처리해야 함:
match color {
    Color::Red => println!("빨강"),
    Color::Green => println!("초록"),
    Color::Blue => println!("파랑"),  // 또는 _ => ...
}
```

**이 검사가 보안이다!**
- 새로운 상태를 추가했을 때 모든 처리 코드를 갱신하도록 강제
- 누락된 케이스에서의 버그를 원천적으로 차단

---

## 2. Destructuring (구조 분해)

### 2.1 구조체 분해

```rust
struct Point { x: i32, y: i32 }

// ❌ 구식
let p = Point { x: 0, y: 7 };
let x = p.x;
let y = p.y;

// ✅ 현대식: 패턴으로 분해
let Point { x, y } = p;  // 모든 필드를 한 번에 추출
println!("{}, {}", x, y);

// 선택적 분해
let Point { x, .. } = p;  // y는 무시
println!("x: {}", x);
```

### 2.2 Enum 분해

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

match msg {
    Message::Quit => {
        println!("Quit!");
    }
    Message::Move { x, y } => {
        println!("Move to ({}, {})", x, y);
    }
    Message::Write(text) => {
        println!("Text: {}", text);
    }
    Message::ChangeColor(r, g, b) => {
        println!("Color: RGB({}, {}, {})", r, g, b);
    }
}
```

### 2.3 Nested Destructuring (중첩 분해)

```rust
enum Color { RGB(u8, u8, u8), HSV(u8, u8, u8) }
struct Pixel { x: u32, y: u32, color: Color }

match pixel {
    Pixel { x, y, color: Color::RGB(r, g, b) } => {
        println!("RGB at ({}, {}): {}, {}, {}", x, y, r, g, b);
    }
    Pixel { color: Color::HSV(h, s, v), .. } => {
        println!("HSV: {}, {}, {}", h, s, v);
    }
}
```

---

## 3. Match Guards (조건 검사)

### 3.1 기본 Match Guard

```rust
match number {
    n if n < 0 => println!("음수"),
    n if n == 0 => println!("영"),
    n if n > 0 => println!("양수"),
}

// Guard를 사용하지 않으면:
match number {
    n if n < 0 => println!("음수"),
    0 => println!("영"),
    n if n > 0 => println!("양수"),
    _ => unreachable!(),
}
```

### 3.2 복잡한 Guard

```rust
match packet {
    Packet {
        protocol: Protocol::TCP,
        source_ip: (192, 168, _, _),
        payload: Some(content),
        ..
    } if content.contains("ATTACK") => {
        println!("침입 감지!");
    }
    _ => println!("정상"),
}

// Guard의 위력:
// 1. 구조 분해 (packet.protocol, source_ip, payload)
// 2. 범위 검사 (192, 168, ?, ?)
// 3. 옵션 체크 (Some(content))
// 4. 문자열 검사 (contains)
// 모두 한 줄에!
```

---

## 4. Advanced Binding Patterns

### 4.1 @ 연산자 (바인딩)

```rust
// 범위와 변수를 동시에
match number {
    n @ 1..=5 => println!("1~5 범위: {}", n),  // n에 값이 바인드됨
    n @ 6..=10 => println!("6~10 범위: {}", n),
    _ => println!("범위 외"),
}

// ref로 빌려오기
match tuple {
    (ref a, ref b) => {
        // a, b는 &i32 (소유권 이동 없음)
        println!("a: {}, b: {}", a, b);
    }
}
```

### 4.2 Destructuring 심화

```rust
// 배열/벡터
let [first, second, ..] = array;

// 튜플
let (x, y, z) = tuple;

// 구조체 + 추출
let Point { x: px, y: py } = point;  // 이름 바꾸기
let Point { x, .. } = point;  // 일부만 추출
```

---

## 5. Advanced Idioms

### 5.1 if let (선택적 매칭)

```rust
// ❌ 전체 match 쓸 필요 없을 때
match value {
    Some(x) => println!("값: {}", x),
    None => {},
}

// ✅ if let으로 간결하게
if let Some(x) = value {
    println!("값: {}", x);
}

// else와 함께
if let Ok(num) = "42".parse::<i32>() {
    println!("숫자: {}", num);
} else {
    println!("파싱 실패");
}
```

### 5.2 while let (반복 매칭)

```rust
let mut queue = vec![1, 2, 3];

while let Some(item) = queue.pop() {
    println!("처리: {}", item);
}

// 또는 Iterator와 함께
let mut iter = vec![1, 2, 3].into_iter();
while let Some(x) = iter.next() {
    println!("항목: {}", x);
}
```

### 5.3 matches! 매크로 (boolean 반환)

```rust
let value = Some(42);

// ❌ 복잡
let is_some = match value {
    Some(_) => true,
    None => false,
};

// ✅ matches! 매크로
let is_some = matches!(value, Some(_));

// 복잡한 패턴도 가능
let is_danger = matches!(packet,
    Packet { protocol: TCP, payload: Some(_), .. }
);
```

---

## 6. 에러 처리와 조합

### 6.1 ? 연산자 (Early Return)

```rust
fn parse_and_process(input: &str) -> Result<i32, ParseError> {
    let num = input.parse::<i32>()?;  // 실패하면 즉시 반환
    let doubled = num * 2;
    Ok(doubled)
}

// ? 없이:
fn parse_and_process_verbose(input: &str) -> Result<i32, ParseError> {
    let num = match input.parse::<i32>() {
        Ok(n) => n,
        Err(e) => return Err(e),
    };
    let doubled = num * 2;
    Ok(doubled)
}
```

### 6.2 and_then (함수형 조합)

```rust
// ❌ 중첩된 match
let result = match get_user(id) {
    Ok(user) => match get_profile(&user) {
        Ok(profile) => match process_profile(profile) {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
        Err(e) => Err(e),
    }
    Err(e) => Err(e),
};

// ✅ and_then으로 깔끔하게
let result = get_user(id)
    .and_then(|user| get_profile(&user))
    .and_then(|profile| process_profile(profile));
```

### 6.3 map과 map_err

```rust
// map: Ok 값을 변환
let doubled = Ok(5)
    .map(|x| x * 2)  // Ok(10)
    .map(|x| x + 1); // Ok(11)

// map_err: Err를 변환
let result = parse_number("abc")
    .map_err(|_| "파싱 실패");

// 조합
let result = get_data()
    .map(|d| d.len())
    .map_err(|e| format!("에러: {}", e));
```

---

## 7. 패턴 매칭과 보안

### 7.1 불가능한 상태 차단

```rust
enum State { Init, Ready, Running, Finished }
enum Action { Start, Stop, Reset }

fn execute(state: State, action: Action) -> State {
    match (state, action) {
        (State::Init, Action::Start) => State::Running,
        (State::Running, Action::Stop) => State::Ready,
        (State::Ready, Action::Reset) => State::Init,
        // ❌ 컴파일 에러! 다른 조합들을 빠뜨렸음
    }
}
```

**이 검사가 논리 버그를 방지한다!**
- 예상하지 못한 상태 조합을 명시적으로 처리
- 엣지 케이스가 눈에 띔

### 7.2 가드로 보안 조건 표현

```rust
match request {
    Request { user_id, action: Action::Delete, .. }
        if user_id == admin_id => {
        // 관리자만 삭제 가능
        perform_delete();
    }
    Request { action: Action::Delete, .. } => {
        return Err("권한 없음");
    }
    _ => handle_other(),
}
```

---

## 8. 컴파일러 제작을 위한 기초

### 8.1 토큰 분석 (패턴 매칭의 핵심)

```text
소스코드 분석의 과정:

1. 토큰화 (Tokenization)
   "let x = 5" → [Let, Ident("x"), Assign, Int(5)]

2. 파싱 (Parsing) ← 패턴 매칭의 거대한 활용처
   match token {
       Token::Let => parse_let_statement(),
       Token::If => parse_if_statement(),
       Token::Fn => parse_function(),
   }

3. 의미 분석 (Semantic Analysis)
   match ast_node {
       Expr::BinaryOp { left, op, right } => {
           let left_type = infer_type(&left);
           let right_type = infer_type(&right);
           validate_op_types(left_type, op, right_type)?;
       }
   }
```

### 8.2 컴파일러가 사용하는 패턴 매칭의 특징

```text
✅ Exhaustiveness (완전성)
   → 모든 가능한 입력을 처리하는가?
   → "누락된 패턴 검사"가 컴파일 에러

✅ Performance (성능)
   → 패턴 매칭은 내부적으로 점프 테이블로 최적화
   → if-else보다 빠름

✅ Clarity (명확성)
   → 복잡한 중첩 구조를 한 줄에 표현
   → 컴파일러의 설계자 의도가 드러남
```

---

## 9. 핵심 요약: 표현력의 정점

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

v11.0: 동적 다형성 (dyn Trait)
   └─ 실행 시점의 유연성

v11.1: 런타임 상태 (State Pattern)
   └─ 유연한 상태 전이

v11.2: 타입 상태 (Type State)
   └─ 컴파일 타임 안전성

v11.3: 패턴 매칭 (Pattern Matching) ⭐
   └─ 데이터 분해와 분석의 정밀함
   └─ 가독성과 안전성의 통합
   └─ 컴파일러 설계의 기초

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 10. 가독성이 곧 안전이다

### 비교: Before vs After

**Before (복잡한 중첩 if)**
```rust
if let Ok(user) = get_user(id) {
    if user.is_admin {
        if let Some(data) = user.sensitive_data {
            if data.access_level >= 5 {
                process_secure(data);
            }
        }
    }
}
```

**After (패턴 매칭)**
```rust
match (get_user(id), request.action) {
    (Ok(user), Action::Access { level })
        if user.is_admin
        && let Some(data) = user.sensitive_data
        && data.access_level >= level => {
        process_secure(data);
    }
    (Ok(user), Action::Access { .. }) => {
        return Err("권한 없음");
    }
    (Err(e), _) => return Err(e),
}
```

**After의 장점:**
- 로직이 한눈에 들어옴
- 빠진 케이스가 없음 (컴파일러 검사)
- 각 조건이 명시적
- 유지보수가 쉬움

---

## 11. 당신이 획득한 능력

```
✅ 복잡한 데이터 구조를 정확하게 분해
✅ 모든 경우를 빠짐없이 처리 (Exhaustiveness)
✅ 가드를 통한 정교한 조건 검사
✅ 함수형 조합으로 깔끔한 흐름
✅ 컴파일러 설계의 기초 이해
✅ 안전성과 가독성의 동시 달성
```

---

## 다음 단계: 제11장 언세이프와 메모리

**제10장: 객체 지향과 패턴이 완벽히 기록되었습니다!**

당신은 이제:
- 데이터를 **조립**할 수 있고 (v11.1, v11.2)
- 데이터를 **분해**할 수 있습니다 (v11.3)

모든 '언어 사용법' 교육이 끝났습니다.

이제 진정한 '재료 공학'의 세계로 진격합니다:

**[제11장: 언세이프와 메모리 — 컴파일러를 위한 주권 선언]**

여기서 당신은 컴파일러 자신이 됩니다.
메모리의 주인이 되는 경험을 하게 될 것입니다.

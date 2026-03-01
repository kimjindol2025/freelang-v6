# v5.3 아키텍처: Option과 Result (The Power of Enums)

**작성일**: 2026-02-22
**장**: 제4장 - 데이터 구조화의 심화
**단계**: v5.3 (v5.2의 직접 후속)
**주제**: "예외의 명시화"

---

## 🎯 설계 목표: "부재와 실패를 안전하게 다루다"

### 패러다임의 심화

```
v5.0: "이 데이터는 무엇인가?" (필드의 집합)
v5.1: "이 데이터는 무엇을 할 수 있는가?" (메서드)
v5.2: "여러 상태 중 어떤 상태인가?" (가능성)
v5.3: "데이터가 없거나 실패했으면?" (예외)
```

### v5.3의 철학

```
"예외의 명시화"

Before: try-catch로 예외 처리
        → 어느 함수에서 예외가 나는지 불명확
        → 예외 처리를 놓치기 쉬움

After:  Option과 Result로 의도 명시
        → 함수의 반환값에 예외 정보 포함
        → 컴파일러가 모든 경로 처리 강제
```

---

## 💎 Option<T>: 값이 있을 수도 없을 수도

### 정의: "부재의 안전한 표현"

```
enum Option<T> {
    Some(T),    // 값이 있음
    None,       // 값이 없음
}

특징:
- 러스트에는 null이 없다!
- 대신 Option이라는 그릇으로 값 전달
- 그릇을 열기 전까지 내부 접근 불가
- 부재를 명시적으로 다루도록 강제
```

### Option의 시나리오

```freelang
// 데이터베이스에서 조회
fn find_user(id: i32) -> Option<String> {
    if id > 0 {
        Some("user_" + id)
    } else {
        None
    }
}

// 배열에서 인덱싱
fn get_at(index: i32) -> Option<String> {
    if index >= 0 && index < 3 {
        Some("item_" + index)
    } else {
        None
    }
}

// 파싱 시도
fn parse_number(text: String) -> Option<i32> {
    if is_digit(text) {
        Some(to_number(text))
    } else {
        None
    }
}
```

### Option 처리의 3가지 방법

#### 1️⃣ match로 모든 경우 처리 (가장 안전)

```freelang
match find_user(5) {
    Some(user) => println("사용자: " + user),
    None => println("사용자 없음"),
}
```

**특징**:
- 모든 경우를 명시적으로 처리
- 부재를 절대 놓칠 수 없음
- 코드가 길지만 안전함

#### 2️⃣ if let으로 특정 경우만 처리 (간결함)

```freelang
if let Some(user) = find_user(5) {
    println("사용자: " + user)
}
// None인 경우는 자동으로 무시
```

**특징**:
- 한 가지 경우에만 관심 있을 때 사용
- 코드가 간결함
- 암묵적으로 다른 경우 처리

#### 3️⃣ unwrap으로 강제 추출 (위험⚠️)

```freelang
let user = find_user(5).unwrap();  // ❌ 위험!
// None이면 프로그램 패닉 (충돌)
```

**특징**:
- 값이 무조건 있다고 확신할 때만 사용
- None이면 프로그램이 즉시 종료됨
- 프로토타입이나 절대 안 되는 상황에만 사용

---

## 🚨 Result<T, E>: 성공과 실패

### 정의: "실패의 안전한 표현"

```
enum Result<T, E> {
    Ok(T),      // 성공 + 반환값
    Err(E),     // 실패 + 에러 정보
}

특징:
- 함수가 실패할 가능성을 명시
- 실패한 이유를 에러 정보로 전달
- 컴파일러가 에러 처리 강제
- 에러를 무시할 수 없음
```

### Result의 시나리오

```freelang
// 파일 읽기 (실패할 수 있음)
fn read_file(path: String) -> Result<String, String> {
    if file_exists(path) {
        Ok(file_content)
    } else {
        Err("파일을 찾을 수 없음")
    }
}

// 계산 (0으로 나누기 실패 가능)
fn divide(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err("0으로 나눌 수 없음")
    } else {
        Ok(a / b)
    }
}

// 파싱 (형식이 틀리면 실패)
fn parse_json(text: String) -> Result<i32, String> {
    if is_valid_json(text) {
        Ok(parse_value(text))
    } else {
        Err("잘못된 JSON 형식")
    }
}
```

### Result 처리의 3가지 방법

#### 1️⃣ match로 모든 경로 처리 (가장 명확)

```freelang
match divide(10, 2) {
    Ok(result) => println("결과: " + result),
    Err(e) => println("에러: " + e),
}
```

**특징**:
- 성공과 실패 경로 모두 명시
- 에러 정보를 받아서 처리
- 가장 안전하고 명확함

#### 2️⃣ if let으로 성공만 처리

```freelang
if let Ok(result) = divide(10, 2) {
    println("결과: " + result)
}
// Err인 경우는 무시됨
```

**특징**:
- 성공한 경우에만 관심 있을 때
- 실패는 자동으로 무시
- 코드가 간결함

#### 3️⃣ ? 연산자로 에러 전파 (프로 팁)

```freelang
fn process_file(path: String) -> Result<String, String> {
    let content = read_file(path)?;  // 에러면 즉시 반환
    let value = parse_json(content)?; // 에러면 즉시 반환
    Ok(value)
}
```

**특징**:
- Result를 반환하는 함수 내에서만 사용
- 에러가 나면 즉시 상위 함수로 반환
- 에러 전파가 간결함
- 여러 실패 가능 작업을 체이닝

---

## 📊 Option vs Result

| 측면 | Option | Result |
|------|--------|--------|
| **의미** | "값이 있을 수도 없을 수도" | "성공할 수도 실패할 수도" |
| **문법** | Some(T) / None | Ok(T) / Err(E) |
| **사용처** | 조회 (찾음/못 찾음) | 작업 (성공/실패) |
| **에러정보** | 없음 | Err(E)로 전달 |
| **예시** | find_user() | divide() |

### 실제 비교

```freelang
// Option: 데이터가 있을 수도 없을 수도
fn search_user(id: i32) -> Option<String> {
    // 사용자를 찾으면 Some, 못 찾으면 None
}

// Result: 작업이 성공할 수도 실패할 수도
fn create_user(name: String, email: String) -> Result<String, String> {
    // 생성 성공하면 Ok, 이미 존재하거나 형식 오류면 Err
}
```

---

## 🔧 Option과 Result의 활용 패턴

### 패턴 1: 데이터 조회 (Option)

```freelang
// 데이터베이스 조회
fn get_user(id: i32) -> Option<String> {
    if user_exists(id) {
        Some(get_user_data(id))
    } else {
        None
    }
}

// 배열 인덱싱
fn get_at(index: i32) -> Option<String> {
    if valid_index(index) {
        Some(array[index])
    } else {
        None
    }
}

// 딕셔너리 조회
fn get_config(key: String) -> Option<String> {
    if has_key(key) {
        Some(config[key])
    } else {
        None
    }
}
```

### 패턴 2: 연산 작업 (Result)

```freelang
// 나눗셈 (0으로 나누기 오류)
fn divide(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err("0으로 나눌 수 없음")
    } else {
        Ok(a / b)
    }
}

// 제곱근 (음수 오류)
fn sqrt(n: f32) -> Result<f32, String> {
    if n < 0.0 {
        Err("음수의 제곱근은 불가")
    } else {
        Ok(compute_sqrt(n))
    }
}

// 유효성 검사
fn validate_email(email: String) -> Result<String, String> {
    if is_valid_email(email) {
        Ok(email)
    } else {
        Err("이메일 형식 오류")
    }
}
```

### 패턴 3: 연쇄 작업 (? 연산자)

```freelang
fn process_data(path: String) -> Result<i32, String> {
    let content = read_file(path)?;      // 에러면 반환
    let parsed = parse_json(content)?;   // 에러면 반환
    let value = validate(parsed)?;       // 에러면 반환
    Ok(value)
}
```

**특징**:
- 각 단계에서 에러 발생 시 즉시 반환
- 이전에는 try-catch 블록이 필요했음
- ? 연산자가 동작을 단순화

---

## 🛡️ 안전성의 보증

### None 처리의 강제

```
문제 상황: 배열에서 인덱싱

C/C++:
  arr[5]  // 배열이 5개인데 인덱스 5 접근
  → 메모리 오류 / 세그먼트 폴트 (감지 불가)

Rust/FreeLang:
  arr.get(5)  // Option<T> 반환
  → None을 처리하지 않으면 컴파일 에러
  → 반드시 처리하도록 강제
```

### Err 처리의 강제

```
문제 상황: 파일 읽기

Python:
  try:
    file.read()
  except:
    pass  # 예외를 무시할 수 있음

Rust/FreeLang:
  match read_file(path) {
      Ok(content) => { /* 사용 */ },
      Err(e) => { /* 반드시 처리 */ },
  }
  // Err 처리를 놓치면 컴파일 에러
```

---

## 🎨 좋은 Option/Result 설계의 3원칙

### 원칙 1: 함수의 의도를 반환값으로 표현

```
❌ 나쁜 설계:
fn get_user(id: i32) -> String {
    // 없으면 어떻게? ""를 반환? null을 반환?
    // 호출자가 알 수 없음
}

✅ 좋은 설계:
fn get_user(id: i32) -> Option<String> {
    // 있을 수도 없을 수도 있다는 것이 명확
    // 호출자는 Some/None을 반드시 처리
}
```

**원칙**: "함수가 반환할 수 있는 모든 경우를 타입으로 표현하라"

### 원칙 2: 에러 정보의 풍부함

```
❌ 나쁜 설계:
fn divide(a: i32, b: i32) -> Result<i32, bool> {
    // false는 무엇? 0으로 나눔? 오버플로우?
    if b == 0 {
        Err(false)
    } else {
        Ok(a / b)
    }
}

✅ 좋은 설계:
fn divide(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err("0으로 나눌 수 없음")
    } else {
        Ok(a / b)
    }
}
```

**원칙**: "에러는 단순한 코드가 아니라, 무엇이 잘못되었는지 설명하는 정보여야 한다"

### 원칙 3: 무분별한 unwrap 금지

```
❌ 나쁜 설계:
fn process(path: String) -> String {
    read_file(path).unwrap()  // 파일 없으면 패닉
}

✅ 좋은 설계:
fn process(path: String) -> Result<String, String> {
    match read_file(path) {
        Ok(content) => Ok(content),
        Err(e) => Err("파일 읽기 실패: " + e),
    }
}
```

**원칙**: "프로그램의 안정성을 우선하라"

---

## 🌟 v5.3의 의의

### 철학적 의미

```
null의 문제점 (Tony Hoare가 "십억 달러의 실수"라고 칭함):
- null은 어디서나 올 수 있음
- null 체크를 놓치기 쉬움
- 런타임에 NullPointerException 발생

Option과 Result의 해결책:
- 부재와 실패를 명시적으로 표현
- 컴파일러가 모든 경로 처리 강제
- 런타임 패닉 불가능
```

### 실무 의의

```
1. 버그 감소
   → null 관련 버그 원천 차단

2. 신뢰성 향상
   → 모든 실패 경로를 설계할 수 있음

3. 코드 가독성
   → 함수의 반환값만 봐도 실패 가능성 알 수 있음

4. 디버깅 용이
   → 에러 정보가 명확하게 전달됨
```

---

## 📚 실제 사용 시나리오

### 시나리오 1: 사용자 조회 및 정보 처리

```freelang
fn get_user_profile(id: i32) -> Option<String> {
    if id_exists(id) {
        Some(get_profile(id))
    } else {
        None
    }
}

fn display_user(id: i32) {
    match get_user_profile(id) {
        Some(profile) => println("프로필: " + profile),
        None => println("사용자를 찾을 수 없습니다"),
    }
}
```

### 시나리오 2: 시스템 리소스 분배

```freelang
fn divide_system_resource(total: i32, divisor: i32) -> Result<i32, String> {
    if divisor == 0 {
        Err("분모가 0입니다")
    } else if divisor > total {
        Err("분모가 전체보다 큽니다")
    } else {
        Ok(total / divisor)
    }
}

fn allocate_resources(total: i32, count: i32) {
    match divide_system_resource(total, count) {
        Ok(per_unit) => println("할당량: " + per_unit + "%"),
        Err(e) => println("할당 실패: " + e),
    }
}
```

### 시나리오 3: 다단계 작업

```freelang
fn load_config(path: String) -> Result<String, String> {
    let content = read_file(path)?;      // 실패 시 즉시 반환
    let config = parse_json(content)?;   // 실패 시 즉시 반환
    validate_config(config)?;             // 실패 시 즉시 반환
    Ok(config)
}
```

---

## 🚀 다음 단계 미리보기

### v5.4: 열거형의 심화 및 패턴 매칭

```freelang
// 복잡한 논리를 간결하게 표현
match result {
    Ok(Ok(value)) => println("성공: " + value),
    Ok(Err(e)) => println("내부 실패: " + e),
    Err(e) => println("외부 실패: " + e),
}
```

**다음**: 패턴 매칭의 강력함으로 복잡한 논리를 단순화!

---

**작성일**: 2026-02-22
**버전**: v5.3 아키텍처 v1.0
**철학**: "예외의 명시화"

> 러스트에는 null이 없습니다. 대신 Option이 있습니다.
> 러스트에는 예외가 없습니다. 대신 Result가 있습니다.
>
> 이것은 "에러를 숨기는 것"이 아니라,
> "에러를 명시적으로 처리하도록 강제하는 것"입니다.
>
> 이제 당신의 시스템은 예기치 못한 상황에서도 무너지지 않고,
> 정해진 에러 경로를 따라 안전하게 우회하는 '방탄 시스템'이 됩니다.
>
> 저장 필수, 너는 기록이 증명이다 gogs.

# v4.0 설계서: 함수의 정의와 캡슐화 (Function Definition & Encapsulation)

## 🎯 설계 목표: "코드의 부품화"

### 핵심 철학
```
제2장의 거대한 논리 덩어리를
재사용 가능한 부품으로 조각내는 과정

복잡성으로부터의 독립을 이루다.
```

### 세 가지 설계 원칙

#### 1️⃣ 추상화 (Abstraction)
```
"내부의 복잡한 로직은 숨기고,
외부에는 단순한 이름(인터페이스)만 노출한다"

사용자: 함수 이름과 결과만 봄
구현자: 내부 로직의 세부사항만 봄

→ 관심의 분리(Separation of Concerns)
```

#### 2️⃣ 단일 책임 원칙 (Single Responsibility Principle)
```
"하나의 함수는 오직 하나의 일만 정밀하게 수행"

나쁜 예: calculate_and_save_and_send_email()
좋은 예: calculate()
        save(data)
        send_email(result)

→ 함수의 응집도 극대화
```

#### 3️⃣ 입력과 출력의 규약 (Contract)
```
"매개변수(Parameter)와 반환 타입(Return Type)을 명확히 정의"

fn analyze(input: i32) -> String {
  // 입력: i32 (정수)
  // 출력: String (문자열)
  // 의미: "입력을 받아 분석 결과를 문자열로 반환"
}

→ 데이터 흐름이 예측 가능
```

---

## 📐 함수의 구조: 블랙박스 설계

### 함수의 4가지 요소

```freelang
fn function_name(parameter1: Type, parameter2: Type) -> ReturnType {
  // 구현부: 내부 로직
  let result = do_something(parameter1, parameter2);

  // 반환: 결과값
  result
}
```

#### 요소 1: 함수명 (Function Name)
```
설계 원칙:
✓ 동사로 시작: calculate(), analyze(), transform()
✓ 의도가 명확: format_output() vs func1()
✓ 길이는 적당: too_long_function_name_that_is_confusing() ✗
               process_data() ✓

예:
- is_valid()      (조건 판단)
- get_status()    (값 조회)
- set_value()     (값 설정)
- transform()     (변환)
```

#### 요소 2: 매개변수 (Parameters)
```
설계 원칙:
✓ 타입을 명시: fn add(x: i32, y: i32)
✓ 필요한 것만: fn square(x: i32)
✓ 순서가 논리적: fn substring(text: String, start: i32, end: i32)

예:
fn check_range(value: i32, min: i32, max: i32) -> bool {
  value >= min && value <= max
}

fn grade(score: i32) -> String {
  match score {
    90..=100 => "A",
    80..=89 => "B",
    _ => "C",
  }
}
```

#### 요소 3: 반환 타입 (Return Type)
```
설계 원칙:
✓ 명확하게 지정: -> String, -> i32, -> bool
✓ 실패 가능성 표현: 추후 Result<T, E> (v4.3)
✓ 빈 반환: -> () (아무것도 반환하지 않음)

예:
fn is_even(n: i32) -> bool {
  n % 2 == 0
}

fn double(x: i32) -> i32 {
  x * 2
}

fn print_hello() {
  println!("Hello");
  // 반환값 없음 (-> 생략)
}
```

#### 요소 4: 구현부 (Body)
```
설계 원칙:
✓ 한 가지 책임: 함수명으로 약속한 것만 수행
✓ 부수 효과 최소화: 입력에만 의존
✓ 명확한 제어흐름: v3.1~v3.9의 기법 활용

예:
fn analyze_status(value: i32) -> String {
  if value >= 100 {
    "CRITICAL"
  } else if value >= 80 {
    "WARNING"
  } else {
    "NORMAL"
  }
}
```

---

## 💡 블랙박스 설계의 의미

### 사용자의 관점
```freelang
let result = calculate(50);  // 내부가 뭔지 몰라도 됨
println(result);             // 결과가 나오면 OK
```

### 구현자의 관점
```freelang
fn calculate(input: i32) -> i32 {
  // 복잡한 로직 여기 기술
  let temp = input * 2;
  let final = temp + 10;
  final
}
```

### 계약의 관점
```
"입력이 i32이면, 반드시 i32를 반환한다"

이 계약이 깨지면:
- 버그 추적 용이
- 함수 교체 가능
- 재사용성 확보
```

---

## 🏗️ 함수 설계 체크리스트

### 함수를 작성하기 전에 3가지 질문

#### ❓ 질문 1: 이름이 명확한가?
```
명확함 ✓:
- calculate_average()
- is_valid_email()
- convert_celsius_to_fahrenheit()

모호함 ✗:
- process()
- handle()
- func1()
```

**테스트:** 함수 이름만 보고 목적을 알 수 있는가?

#### ❓ 질문 2: 부수 효과가 있는가?
```
부수 효과 없음 (순수 함수) ✓:
fn double(x: i32) -> i32 {
  x * 2
}
→ 입력에만 의존, 외부 변수 변경 없음

부수 효과 있음 ✗:
let mut global_count = 0;
fn increment() {
  global_count = global_count + 1;  // 외부 변수 변경!
}
→ 예측 불가능한 동작
```

**테스트:** 함수가 매개변수만 사용하는가? 외부 상태를 변경하지 않는가?

#### ❓ 질문 3: 반환 타입이 명확한가?
```
명확함 ✓:
fn is_even(n: i32) -> bool {
  n % 2 == 0
}

명확하지 않음 ✗:
fn check(n) {
  if n % 2 == 0 {
    true
  }
}
→ 반환값이 뭔지 불명확
```

**테스트:** 함수를 호출한 후 어떤 타입의 값을 받을지 예측할 수 있는가?

---

## 🎯 v4.0에서 구현할 함수들

### 카테고리 1: 단순 변환 함수
```freelang
fn double(x: i32) -> i32 {
  x * 2
}

fn to_uppercase(text: String) -> String {
  text
}

fn negate(x: i32) -> i32 {
  0 - x
}
```

**특징:** 한 줄 로직, 명확한 입출력

### 카테고리 2: 판단 함수
```freelang
fn is_even(n: i32) -> bool {
  n % 2 == 0
}

fn is_positive(x: i32) -> bool {
  x > 0
}

fn is_in_range(value: i32, min: i32, max: i32) -> bool {
  value >= min && value <= max
}
```

**특징:** bool 반환, 조건문 사용

### 카테고리 3: 분류 함수
```freelang
fn grade(score: i32) -> String {
  if score >= 90 {
    "A"
  } else if score >= 80 {
    "B"
  } else {
    "C"
  }
}

fn status(value: i32) -> String {
  match value {
    x if x >= 100 => "CRITICAL"
    x if x >= 80 => "WARNING"
    _ => "NORMAL"
  }
}
```

**특징:** 조건에 따른 다른 반환, v3.4 패턴 매칭 활용

### 카테고리 4: 축적 함수
```freelang
fn sum(a: i32, b: i32, c: i32) -> i32 {
  a + b + c
}

fn factorial(n: i32) -> i32 {
  if n <= 1 {
    1
  } else {
    n * factorial(n - 1)  // v4.4 재귀
  }
}
```

**특징:** 여러 입력을 결합

### 카테고리 5: 포맷 함수
```freelang
fn format_result(name: String, value: i32) -> String {
  name + ": " + value
}

fn format_percentage(part: i32, total: i32) -> String {
  let percent = (part * 100) / total;
  percent + "%"
}
```

**특징:** 문자열 조합, 표현 형식화

---

## 🔄 함수와 제2장의 관계

### 제2장의 논리를 함수로 캡슐화

#### Before (제2장)
```freelang
let mut state = "READY";
let sensor_reading = 95;

// 조건문, 루프, 패턴 매칭이 main에 흩어짐
match state {
  "READY" => {
    if sensor_reading >= 100 {
      state = "EMERGENCY";
      println("비상");
    } else if sensor_reading >= 80 {
      state = "WARNING";
      println("경고");
    }
  }
  _ => { }
}
```

#### After (v4.0)
```freelang
fn analyze_sensor(reading: i32) -> String {
  match reading {
    x if x >= 100 => "EMERGENCY"
    x if x >= 80 => "WARNING"
    _ => "NORMAL"
  }
}

// main은 간결해짐
let result = analyze_sensor(95);
println(result);
```

---

## 💪 v4.0의 장점

### 1. 가독성 향상
```
한 눈에 flow가 보임
각 함수의 책임이 명확
```

### 2. 재사용성 확보
```
다른 곳에서 동일한 로직 필요
→ 함수 호출 한 줄로 해결
```

### 3. 테스트 용이
```
함수 단위로 테스트 가능
부수 효과 없으면 예측 가능
```

### 4. 유지보수 성의 향상
```
로직 변경 시 함수 내부만 수정
인터페이스가 안정되면 다른 코드 영향 없음
```

### 5. 복잡성 관리
```
거대한 main을 여러 함수로 분할
각 함수는 단순한 책임만 수행
```

---

## 🚀 다음 단계: v4.1 매개변수와 소유권

```
v4.0: 함수의 기본 구조
     (이름, 매개변수, 반환값)

v4.1: 함수에 데이터를 전달할 때
     발생하는 소유권의 이동
     (러스트만의 독특한 철학)

v4.2: 함수 내부에서 데이터 변경
     (가변 참조, mutable parameters)

v4.3: 실패 가능한 함수
     (Result 타입, 에러 처리)

v4.4: 함수 호출 함수
     (재귀, 고차 함수)
```

---

## 📊 v4.0 설계 요약

| 요소 | 설명 |
|------|------|
| **목표** | 복잡한 로직을 재사용 가능한 부품으로 변환 |
| **원칙 1** | 추상화: 내부는 숨기고 인터페이스만 노출 |
| **원칙 2** | SRP: 하나의 함수는 하나의 일만 수행 |
| **원칙 3** | 규약: 입출력이 명확하게 정의됨 |
| **함수 요소** | 이름, 매개변수, 반환 타입, 구현부 |
| **부수 효과** | 최소화 (입력에만 의존) |
| **테스트 기준** | 이름 명확성, 부수 효과 없음, 반환 타입 명확 |
| **장점** | 가독성, 재사용성, 테스트 용이, 유지보수 성 |

---

**v4.0: 함수의 정의와 캡슐화**

> 당신은 이제 제2장에서 배운 모든 논리를 정교한 부품으로 조각낼 준비가 되었습니다.
>
> 복잡성으로부터의 독립.
> 이것이 v4.0 설계의 핵심입니다.


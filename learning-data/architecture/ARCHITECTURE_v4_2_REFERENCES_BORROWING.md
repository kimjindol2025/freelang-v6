# v4.2 아키텍처: 참조와 빌림 (References & Borrowing)

## 🎯 설계 목표: "효율성과 안전성의 조화"

### 최종 선언
```
v4.1에서 배운 것:
"데이터의 책임을 명확히 한다"

v4.2에서 배울 것:
"소유권은 유지하면서, 빌려주기만 한다"

결과:
메모리 복사 비용 없이
메모리 안전성을 지킨다.
```

---

## 💡 v4.1 vs v4.2 비교

### v4.1: Move 세맨틱 (소유권 이전)

```
┌─ 호출자 ─┐         ┌─ 함수 ─┐
│ data     │  Move   │ data   │
│ (소유)   │ ─────→  │ (소유) │
└──────────┘         └────────┘

특징:
- 호출자는 data를 더 이상 사용 불가
- 메모리 안전함 (Double Free 없음)
- 비효율적 (대용량 데이터면 느림)
```

### v4.2: Borrow 세맨틱 (소유권 유지)

```
┌─ 호출자 ─┐         ┌─ 함수 ─┐
│ data     │  &data  │ &data  │
│ (소유)   │ ─────→  │ (읽기) │
│          │         │        │
│ (여전히  │  ←─ ─── │ (반환) │
│  소유)   │         │        │
└──────────┘         └────────┘

특징:
- 호출자가 여전히 data 소유
- 함수는 빌려진 데이터만 읽음 (수정 불가)
- 효율적 (복사 없음)
- 안전함 (lifetime 검증)
```

---

## 🔧 참조의 3가지 규칙

### 규칙 1: 참조는 원본을 대체하지 않음

```freelang
let data = "중요";
let borrowed = &data;        // 참조 생성

use_borrowed(borrowed);      // 참조 전달
println(data);               // ✓ 여전히 사용 가능!
```

**의미:** 소유권은 호출자에게 남아있음

### 규칙 2: 참조는 빌려진 데이터만 읽을 수 있음

```freelang
fn read_data(text: &String) -> i32 {
  text.len()  // ✓ 읽기 가능
  // text = "new"; // ✗ 수정 불가능 (v4.2)
}

let msg = "hello";
let length = read_data(&msg);
println(msg);     // ✓ 여전히 사용 가능
```

**의미:** 함수는 데이터를 빌려만 가는 것

### 규칙 3: 같은 시점에 여러 불변 참조 허용

```freelang
let value = 42;
let ref1 = &value;
let ref2 = &value;
let ref3 = &value;

println(ref1);  // ✓ OK
println(ref2);  // ✓ OK
println(ref3);  // ✓ OK
println(value); // ✓ OK - 소유자도 사용 가능
```

**의미:** 읽기는 여러 개 동시 가능, 쓰기는 나중(v4.3)

---

## 📊 Copy vs Move vs Borrow

| 측면 | Copy | Move | Borrow |
|------|------|------|--------|
| **데이터 전달** | 값 복사 | 소유권 이전 | 참조만 전달 |
| **호출자 사용** | 계속 사용 가능 | 사용 불가 | 계속 사용 가능 |
| **메모리 비용** | 복사 비용 발생 | 복사 없음 | 복사 없음 |
| **메모리 안전** | 항상 안전 | 엄격하지만 안전 | 안전함 |
| **효율성** | 중간 | 높음 | 매우 높음 |
| **복잡성** | 낮음 | 중간 | 높음 |
| **대상** | i32, bool 등 | String, Vec 등 | 모든 타입 |

---

## 🎯 5가지 참조 카테고리

### 카테고리 1: 단순 참조 읽기

```freelang
fn read_value(num: &i32) -> i32 {
  num  // 참조를 통해 값 읽기
}

let x = 10;
let result = read_value(&x);  // 참조 전달
println(x);                    // ✓ 여전히 사용 가능
```

**특징:**
- 가장 간단한 참조 패턴
- 소유권 변화 없음
- 호출자와 함수 모두 동시에 데이터 접근 가능

### 카테고리 2: 참조 변수 저장

```freelang
fn store_reference(text: &String) -> &String {
  text  // 참조 그대로 반환
}

let message = "hello";
let ref_msg = store_reference(&message);
println(message);   // ✓ 사용 가능
println(ref_msg);   // ✓ 참조도 사용 가능
```

**특징:**
- 참조를 저장했다가 나중에 사용
- 원본 데이터가 유효한 동안 참조도 유효
- 참조 체이닝 가능

### 카테고리 3: 여러 참조 동시 사용

```freelang
fn compare(a: &i32, b: &i32) -> bool {
  a > b  // 두 참조를 비교
}

let x = 10;
let y = 20;
let result = compare(&x, &y);  // 두 참조 전달
println(x);                     // ✓ 둘 다 사용 가능
println(y);
```

**특징:**
- 여러 참조를 동시에 사용
- 메모리 효율적 (복사 없음)
- Copy 타입도 참조로 전달 가능

### 카테고리 4: 참조를 통한 데이터 검사

```freelang
fn validate_string(text: &String) -> bool {
  text != ""
}

fn get_length(text: &String) -> i32 {
  text.len()
}

let data = "important";
let is_valid = validate_string(&data);
let len = get_length(&data);
println(data);  // ✓ 여전히 사용 가능
```

**특징:**
- 데이터 검사/검증용
- 함수가 여러 개 있어도 원본 보존
- 읽기 전용 접근

### 카테고리 5: 참조 체이닝

```freelang
fn add_prefix(text: &String) -> String {
  "[PRE] " + text
}

fn add_suffix(text: &String) -> String {
  text + " [SUF]"
}

let original = "data";
let with_prefix = add_prefix(&original);
let final = add_suffix(&with_prefix);  // String 참조 가능
println(original);    // ✓ 원본도 사용 가능
println(final);
```

**특징:**
- 참조 → 새로운 값 생성
- 참조 → 참조 체이닝
- 원본 보존

---

## 🛡️ Borrow의 4가지 이점

### 이점 1: 메모리 효율성

```
v4.1 (Move):
let msg = "매우 긴 문자열..."; // 1MB
process(msg);                   // 소유권 이전, 1MB 이동
println(msg);                   // ✗ 사용 불가

v4.2 (Borrow):
let msg = "매우 긴 문자열..."; // 1MB
process(&msg);                  // 참조만 전달, 포인터 8바이트
println(msg);                   // ✓ 사용 가능
```

**절감:** 대용량 데이터는 1MB 복사 대신 8바이트 포인터만 전달

### 이점 2: 소유권 유연성

```freelang
fn use_once(data: String) {
  println(data);
}

fn use_multiple(data: &String) {
  println(data);
  println(data);
  println(data);
}

let msg = "hello";
use_multiple(&msg);  // ✓ 3번 사용 가능
use_multiple(&msg);  // ✓ 또 3번 사용 가능
```

**장점:** 함수를 여러 번 호출 가능

### 이점 3: 함수 조합의 용이성

```freelang
fn validate(input: &String) -> bool { input != "" }
fn process(input: &String) -> String { "[OK] " + input }

let data = "input";
if validate(&data) {
  let result = process(&data);
  println(result);
  println(data);  // ✓ 원본도 사용 가능
}
```

**장점:** 데이터 흐름이 명확함

### 이점 4: 에러 처리 개선

```freelang
fn safe_operation(data: &String) -> bool {
  if data == "" {
    false
  } else {
    println(data);
    true
  }
}

let msg = "important";
if safe_operation(&msg) {
  println(msg);  // ✓ 실패해도 데이터 유지
}
```

**장점:** 실패했을 때도 데이터 상태 보존

---

## 🔄 메모리 생명 주기 비교

### v4.1 Move 방식
```
timeline:
0ms: let x = String::from("data")      [x 소유권 시작]
10ms: move_ownership(x)                [x 소유권 → func로 이전]
20ms: [func 종료, x 메모리 해제]
30ms: println(x);  ✗ 에러!              [x는 이미 해제됨]
```

### v4.2 Borrow 방식
```
timeline:
0ms: let x = String::from("data")      [x 소유권 시작]
10ms: borrow_data(&x)                  [x 참조만 전달]
20ms: [func 종료]                       [x는 여전히 유효]
30ms: println(x);  ✓ OK!                [x는 살아있음]
```

---

## 🎓 설계 의사결정 트리 (업데이트)

```
데이터를 함수로 전달:

┌─ 데이터가 가볍거나 복사 비용이 무시할 수 있는가?
│  ├─ YES: Copy 타입 (값 전달)
│  └─ NO: 다음으로
│
└─ 함수가 데이터의 "소유권"을 가져야 하는가?
   ├─ YES: Move 타입 (소유권 이전)
   │       └─ 함수가 메모리를 해제해야 함
   │       └─ 호출자는 데이터를 더 이상 사용하지 않음
   │
   └─ NO: Borrow 타입 (참조 전달) ← v4.2 새로 추가
         └─ 함수가 데이터를 "빌려만" 읽음
         └─ 호출자는 데이터를 계속 소유
         └─ 메모리 효율과 안전성의 조화
```

---

## 📝 v4.2 구현 전략

### Phase 1: 파서 확장
```
기존: fn func(param: Type) -> Type
추가: fn func(param: &Type) -> Type
```

### Phase 2: 컴파일러 확장
```
참조 생성: let ref = &value
참조 역참조: use_ref(ref)
참조 반환: return &value (lifetime 검증 필요)
```

### Phase 3: 타입 체커
```
참조 타입 검증
lifetime 추적 (v4.4로 미연기)
```

---

## 🎉 v4.2 완성 후의 경험

### 당신이 이해한 것
```
✓ 메모리 복사 없이 데이터 공유 가능
✓ "소유권"과 "빌림"의 구별 이해
✓ 참조 타입이 언제 필요한지 판단 가능
✓ 함수 인터페이스가 더 명확해짐
✓ 메모리 효율과 안전성을 동시에 확보
```

### 당신이 설계한 것
```
✓ 단순 참조 읽기: 5가지 패턴
✓ 참조 변수 저장: 5가지 패턴
✓ 여러 참조 동시 사용: 5가지 패턴
✓ 참조를 통한 데이터 검사: 5가지 패턴
✓ 참조 체이닝: 5가지 패턴
✓ Total: 25+ 함수, 40+ 테스트 케이스
```

---

## 🌟 v4.2 vs Rust

| 개념 | Rust | v4.2 FreeLang |
|------|------|--------------|
| **참조 생성** | `&x` | `&x` |
| **참조 타입** | `&T` | `&Type` |
| **역참조** | `*r` | 자동 (v4.2) |
| **불변 참조** | `&T` 기본 | 기본 |
| **가변 참조** | `&mut T` | v4.3에서 추가 |
| **Lifetime** | `'a`, `'static` | v4.4에서 명시 |

---

## 📊 v4.2 설계 요약

| 요소 | 설명 |
|------|------|
| **목표** | 메모리 효율과 안전성의 조화 |
| **핵심 개념** | Borrow: 소유권 유지, 참조만 전달 |
| **3가지 규칙** | 참조는 원본을 대체하지 않음, 읽기만 가능, 여러 참조 허용 |
| **4가지 이점** | 메모리 효율, 소유권 유연성, 함수 조합 용이, 에러 처리 개선 |
| **5가지 카테고리** | 단순 읽기, 참조 저장, 여러 참조, 데이터 검사, 참조 체이닝 |
| **테스트** | 40+ 테스트 예상 |
| **후속** | v4.3: Mutable References, v4.4: Lifetime |

---

**작성일:** 2026-02-22
**버전:** v4.2 아키텍처 v1.0
**철학:** "빌려주는 것이 주는 것보다 낫다"

> 메모리는 유한하다.
> 복사 비용은 비싸다.
> 하지만 참조는 8바이트이고 빠르다.
>
> v4.2: 최고의 거래 (최고의 효율 × 최고의 안전)

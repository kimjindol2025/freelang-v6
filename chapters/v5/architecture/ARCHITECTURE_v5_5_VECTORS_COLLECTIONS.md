# v5.5 아키텍처: 벡터와 동적 데이터 관리 (Vectors & Collections)

**작성일**: 2026-02-22
**장**: 제5장 - 고급 프로그래밍 개념 (Advanced Programming Concepts)
**단계**: v5.5 (v5.4의 직접 후속)
**주제**: "컬렉션과 소유권의 복잡한 상호작용"

---

## 🎯 설계 목표: "동적 데이터 관리의 시작"

### 패러다임의 전환

```
제4장 (v5.0~v5.4): 데이터 구조화
  ↓
  구조체 → 메서드 → 열거형 → Option/Result → 패턴 매칭
  개별 데이터의 안전성과 명확성

제5장 (v5.5~v5.7): 고급 프로그래밍
  ↓
  벡터 → 제네릭 → 트레이트
  여러 데이터의 안전한 관리와 추상화
```

### v5.5의 철학

```
"컬렉션과 소유권의 복잡한 상호작용"

Before: 단일 데이터만 관리
  let user = User { name: "Alice" };
  let status = Status::Online;
  → 개별 값의 소유권만 고려

After:  컬렉션 데이터 관리
  let users = vec![
    User { name: "Alice" },
    User { name: "Bob" },
  ];
  → 여러 값의 소유권과 생명주기 관리
  → 반복문에서의 값 이동
  → 벡터의 크기 변경에 따른 메모리 관리
```

---

## 💎 벡터 (Vector) 깊이 이해하기

### 1️⃣ 벡터의 기본 개념

```freelang
// 벡터 = "동적 배열" (길이가 런타임에 결정)
let nums: Vec<i32> = vec![1, 2, 3];
//                    ↑
//                  매크로로 초기화

// 배열 = "정적 배열" (길이가 컴파일 타임에 고정)
let arr: [i32; 3] = [1, 2, 3];
//              ↑
//            길이 명시
```

**특징**:
- **동적**: 런타임에 길이 변경 가능
- **소유**: 벡터는 자신의 원소를 소유
- **메모리**: heap 메모리에 동적 할당
- **생명주기**: 벡터가 drop되면 모든 원소도 drop

### 2️⃣ 벡터의 구조

```
┌─────────────────────┐
│   Vec<T>            │
├─────────────────────┤
│ ptr  ──→ [T, T, T]  │  (heap)
│ len   = 3           │
│ cap   = 4           │  (capacity >= len)
└─────────────────────┘
   (stack)
```

**구성**:
- **ptr**: 힙에 할당된 메모리의 주소
- **len**: 현재 원소의 개수
- **cap**: 재할당 없이 저장 가능한 최대 개수

### 3️⃣ 벡터의 생성 방법

```freelang
// 1. 매크로로 초기화
let v1 = vec![1, 2, 3, 4, 5];

// 2. new()로 빈 벡터
let mut v2: Vec<i32> = Vec::new();
v2.push(1);
v2.push(2);

// 3. with_capacity()로 사전 할당
let mut v3: Vec<String> = Vec::with_capacity(10);
// 재할당 없이 10개까지 저장 가능

// 4. 반복으로 생성
let v4: Vec<i32> = (1..=5).collect();
// [1, 2, 3, 4, 5]
```

### 4️⃣ 벡터의 주요 메서드

**추가/제거**:
```freelang
v.push(value)           // 끝에 추가
v.pop()                 // 끝에서 제거 (Some/None)
v.insert(idx, value)    // 중간에 삽입
v.remove(idx)           // 중간에서 제거
v.clear()               // 모두 제거
```

**접근**:
```freelang
v[idx]                  // 인덱스 접근 (panic if out of bounds)
v.get(idx)              // 안전한 접근 (Some/None)
v.first()               // 첫 번째 (Some/None)
v.last()                // 마지막 (Some/None)
```

**반복**:
```freelang
for item in &v          // 불변 참조 루프
for item in &mut v      // 가변 참조 루프
for item in v           // 소유권 이동 루프 (v 소비)
```

---

## 🔄 벡터와 소유권의 상호작용

### 패턴 1: 벡터 생성과 ownership

```freelang
let v = vec![1, 2, 3];
// v가 벡터를 소유함
// drop될 때 모든 원소도 drop됨
```

### 패턴 2: 벡터 소유권 이동

```freelang
let v1 = vec![1, 2, 3];
let v2 = v1;  // 소유권 이동
// println(v1);  // ❌ 에러: v1 더 이상 접근 불가

// 함수로 소유권 이동
fn consume_vector(v: Vec<i32>) {
    // v가 drop될 때 원소들도 drop됨
}
consume_vector(v2);  // v2 소유권을 함수로 이동
// println(v2);  // ❌ 에러
```

### 패턴 3: 벡터 참조와 borrowing

```freelang
let v = vec![1, 2, 3];

// 불변 참조
fn read_vector(v: &Vec<i32>) {
    // 원소 읽기만 가능, 수정 불가
}
read_vector(&v);  // v는 여전히 사용 가능

// 가변 참조
fn modify_vector(v: &mut Vec<i32>) {
    v.push(4);  // 원소 추가 가능
}
modify_vector(&mut v);  // v는 여전히 사용 가능
```

### 패턴 4: 반복과 소유권

```freelang
let v = vec![1, 2, 3];

// 불변 루프: 원소를 빌려옴
for &item in &v {
    println(item);  // item은 i32의 복사본
}
// v는 여전히 사용 가능

// 가변 루프: 원소를 빌려옴 (수정 가능)
for item in &mut v {
    *item = *item * 2;  // 각 원소를 2배로
}
// v는 여전히 사용 가능

// 소유권 이동 루프: 원소의 소유권을 이동
for item in v {
    // item이 소유권을 가짐
    // drop될 때 item이 drop됨
}
// v는 더 이상 사용 불가 (벡터 자체는 drop됨)
```

---

## 📊 벡터 실무 패턴

### 패턴 1: 데이터 수집

```freelang
// 여러 작업을 벡터에 수집
fn collect_tasks() -> Vec<Task> {
    let mut tasks = Vec::new();

    tasks.push(Task::Initialize);
    tasks.push(Task::Print("시작".to_string()));
    tasks.push(Task::Move(10, 20));

    tasks  // 소유권 반환
}
```

### 패턴 2: 데이터 처리

```freelang
// 벡터의 모든 원소 처리
fn process_tasks(tasks: Vec<Task>) {
    for task in tasks {  // 소유권 이동
        match task {
            Task::Initialize => println("초기화"),
            Task::Print(msg) => println(msg),
            Task::Move(x, y) => println("이동"),
            _ => println("기타"),
        }
    }
    // tasks의 모든 원소가 처리됨
}
```

### 패턴 3: 데이터 변환

```freelang
// 벡터의 각 원소를 변환
fn double_numbers(nums: Vec<i32>) -> Vec<i32> {
    let mut result = Vec::new();
    for num in nums {  // 원본 벡터의 원소 이동
        result.push(num * 2);  // 변환된 값 추가
    }
    result
}
```

### 패턴 4: 필터링과 선택

```freelang
// 조건을 만족하는 원소만 수집
fn filter_large_numbers(nums: &Vec<i32>) -> Vec<i32> {
    let mut result = Vec::new();
    for &num in nums {  // nums 참조
        if num > 5 {
            result.push(num);
        }
    }
    result
}
```

### 패턴 5: 안전한 접근

```freelang
// Option을 이용한 안전한 접근
fn safe_access(v: &Vec<i32>, idx: usize) -> Option<i32> {
    match v.get(idx) {
        Some(&value) => Some(value),
        None => None,
    }
}

// Result를 이용한 에러 처리
fn access_with_error(v: &Vec<i32>, idx: usize) -> Result<i32, String> {
    match v.get(idx) {
        Some(&value) => Ok(value),
        None => Err("인덱스 범위 초과".to_string()),
    }
}
```

---

## 🔍 벡터의 생명주기

### 1. 생성

```
let v = vec![1, 2, 3];
↓
Stack: [ptr, len=3, cap=4]
Heap:  [1, 2, 3, _]
```

### 2. 수정

```
v.push(4);
↓
Stack: [ptr, len=4, cap=4]
Heap:  [1, 2, 3, 4]
```

### 3. 재할당

```
v.push(5);  // capacity 초과
↓
Stack: [ptr', len=5, cap=8]  (새로운 ptr)
Heap:  [1, 2, 3, 4, 5, _, _, _]  (이전 메모리는 해제)
```

### 4. 소멸

```
// 스코프 벗어남
drop(v);
↓
Heap 메모리 해제
```

---

## 🏛️ 벡터와 다른 타입의 조합

### 벡터의 벡터 (2D 배열)

```freelang
let matrix: Vec<Vec<i32>> = vec![
    vec![1, 2, 3],
    vec![4, 5, 6],
    vec![7, 8, 9],
];

// 접근: matrix[row][col]
// 불규칙한 크기도 가능
let irregular: Vec<Vec<i32>> = vec![
    vec![1],
    vec![1, 2],
    vec![1, 2, 3],
];
```

### 벡터의 옵션 (선택적 데이터)

```freelang
let maybe_numbers: Vec<Option<i32>> = vec![
    Some(1),
    None,
    Some(3),
];

// 필터링: Some 값만 추출
for maybe_num in &maybe_numbers {
    match maybe_num {
        Some(num) => println(num),
        None => println("값 없음"),
    }
}
```

### 벡터의 결과 (에러 처리)

```freelang
let results: Vec<Result<i32, String>> = vec![
    Ok(1),
    Err("에러".to_string()),
    Ok(3),
];

// 필터링: Ok 값만 추출
for result in &results {
    match result {
        Ok(num) => println(num),
        Err(err) => println("에러: " + err),
    }
}
```

### 벡터의 구조체/열거형

```freelang
enum Task {
    Initialize,
    Print(String),
    Move(i32, i32),
    ChangeStatus(String),
}

let tasks: Vec<Task> = vec![
    Task::Initialize,
    Task::Print("시작".to_string()),
    Task::Move(10, 20),
];

// 타입이 다른 작업들을 동일하게 처리
for task in tasks {
    match task {
        Task::Initialize => println("초기화"),
        Task::Print(msg) => println(msg),
        Task::Move(x, y) => println("이동"),
        _ => println("기타"),
    }
}
```

---

## 🎨 좋은 벡터 설계의 원칙

### 원칙 1: 소유권 명확성

```
❌ 나쁜 설계:
fn modify(v: Vec<i32>) -> Vec<i32> {
    // v의 소유권을 받아서 반환
    // 호출자는 벡터를 다시 할당해야 함
}

✅ 좋은 설계:
fn modify(v: &mut Vec<i32>) {
    // v의 참조를 받아서 직접 수정
    // 호출자는 소유권을 유지
}
```

**원칙**: "필요 없으면 소유권을 이동하지 말 것"

### 원칙 2: 생명주기 관리

```
❌ 나쁜 설계:
fn process_items(v: Vec<Item>) {
    for item in &v {  // 참조로 빌림
        // 하지만 v는 이미 소유권을 잃음
    }
}

✅ 좋은 설계:
fn process_items(v: &Vec<Item>) {
    for item in v {  // v의 참조를 받음
        // v는 온전히 유지
    }
}
```

**원칙**: "벡터의 소유권이 필요 없으면 참조를 사용"

### 원칙 3: 안전한 접근

```
❌ 위험한 설계:
fn get_first(v: &Vec<i32>) -> i32 {
    v[0]  // panic 가능성
}

✅ 안전한 설계:
fn get_first(v: &Vec<i32>) -> Option<i32> {
    match v.get(0) {
        Some(&val) => Some(val),
        None => None,
    }
}
```

**원칙**: "인덱싱 대신 get()과 Option/Result 사용"

---

## 📊 v5.5의 강점

### 1. 동적 데이터 관리
- 런타임에 크기 결정 가능
- 필요에 따라 메모리 할당
- 자동 메모리 관리

### 2. 소유권 안전성
- 벡터가 원소의 생명주기 관리
- 메모리 누수 불가능
- 명시적 소유권 이동

### 3. 유연한 처리
- 반복, 필터링, 변환 가능
- Option/Result와 조합
- 타입 안전한 컬렉션

### 4. 성능
- 캐시 친화적 메모리 배치
- 효율적인 재할당 전략
- 벡터화 최적화 가능

---

## 🌟 v5.5의 의의

### 철학적 의미

```
v5.0-v5.4: 개별 데이터의 안전성
  → 구조체, 메서드, 열거형, 옵션, 패턴

v5.5: 여러 데이터의 관리
  → 벡터가 소유권을 통해 생명주기 관리
  → 컬렉션에서 안전한 접근과 반복

결합: 데이터 구조부터 컬렉션까지 완벽한 안전성
```

### 실무 의의

```
1. 동적 데이터 처리
   → 실행 시간에 개수가 결정되는 데이터
   → 작업 큐, 버퍼, 로그 등

2. 메모리 안전성
   → 벡터가 메모리를 자동 관리
   → 메모리 누수 불가능

3. 소유권과 빌림의 활용
   → 참조로 효율적인 처리
   → 소유권 이동으로 명확한 의도

4. 안전한 컬렉션 조작
   → Option/Result로 예외 상황 처리
   → 인덱스 오류 방지
```

---

## 🚀 다음 단계 미리보기

### v5.6: 제네릭 (Generics)

```freelang
// 벡터가 모든 타입을 저장할 수 있게 만드는 제네릭
struct Container<T> {
    items: Vec<T>,
}

impl<T> Container<T> {
    fn add(&mut self, item: T) {
        self.items.push(item);
    }

    fn get(&self, idx: usize) -> Option<&T> {
        self.items.get(idx)
    }
}

// 어떤 타입이든 가능
let mut ints = Container { items: vec![1, 2, 3] };
let mut strings = Container { items: vec!["a".to_string()] };
```

**다음**: 어떤 타입이든 안전하게 다루는 제네릭 프로그래밍!

---

**작성일**: 2026-02-22
**버전**: v5.5 아키텍처 v1.0
**철학**: "컬렉션과 소유권의 복잡한 상호작용"

> 벡터는 단순한 동적 배열이 아니라,
> 소유권 시스템이 여러 데이터의 생명주기를 관리하는
> 러스트의 핵심 컬렉션입니다.
>
> 개별 데이터(v5.0-v5.4)에서 시작하여
> 여러 데이터(v5.5)의 안전한 관리까지,
> 이제 당신은 작고 큰 데이터 모두를 제어할 수 있습니다.
>
> 저장 필수, 너는 기록이 증명이다 gogs.

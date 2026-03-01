# 📖 FreeLang v6 완전 가이드

**최종 업데이트**: 2026-02-22
**대상**: 초급자부터 고급자까지
**예상 학습 시간**: 3-5시간

---

## 📑 목차

- [1. 시작하기 (5분)](#1-시작하기-5분)
- [2. 기본 문법 (30분)](#2-기본-문법-30분)
- [3. 표준 라이브러리 (30분)](#3-표준-라이브러리-30분)
- [4. 함수형 프로그래밍 (30분)](#4-함수형-프로그래밍-30분)
- [5. 고급 기능 (1시간)](#5-고급-기능-1시간)
- [6. 문제 해결 (30분)](#6-문제-해결-30분)
- [7. 성능 최적화](#7-성능-최적화)
- [8. 실전 예제](#8-실전-예제)

---

## 1. 시작하기 (5분)

### 설치

```bash
# FreeLang 설치
npm install -g freelang

# 버전 확인
freelang --version
```

### 첫 번째 프로그램

**hello.fl**
```freelang
fn main() {
  println("Hello, FreeLang!");
}

main();
```

실행:
```bash
freelang hello.fl
```

**출력:**
```
Hello, FreeLang!
```

### 기본 개념

| 개념 | 설명 | 예시 |
|------|------|------|
| **변수** | 값을 저장하는 이름 | `let x = 42;` |
| **함수** | 재사용 가능한 코드 블록 | `fn add(a, b) { a + b }` |
| **타입** | 값의 종류 | `i32`, `f64`, `str`, `bool` |
| **배열** | 여러 값의 모음 | `[1, 2, 3]` |
| **객체** | 키-값 쌍의 모음 | `{name: "FreeLang"}` |

---

## 2. 기본 문법 (30분)

### 2.1 변수 선언

```freelang
// 불변 변수 (기본값)
let x = 42;

// 가변 변수
let mut y = 10;
y = 20;  // ✅ 가능

// 타입 명시
let name: str = "FreeLang";
let version: f64 = 6.0;
```

### 2.2 기본 자료형

#### 숫자 (i32, f64)

```freelang
let int_val: i32 = 42;      // 정수
let float_val: f64 = 3.14;  // 실수

println(int_val + 10);       // 52
println(float_val * 2.0);    // 6.28
```

#### 문자열 (str)

```freelang
let message = "Hello";
let greeting = "Hello, " + "FreeLang";

println(length(message));     // 5
println(toUpperCase(message)); // "HELLO"
```

#### 불린 (bool)

```freelang
let is_active = true;
let is_complete = false;

if (is_active && !is_complete) {
  println("진행 중");
}
```

#### null 타입

```freelang
let empty = null;

if (empty == null) {
  println("값이 없습니다");
}
```

### 2.3 연산자

#### 산술 연산

```freelang
let a = 10;
let b = 3;

println(a + b);  // 13
println(a - b);  // 7
println(a * b);  // 30
println(a / b);  // 3
println(a % b);  // 1
```

#### 비교 연산

```freelang
let x = 5;

println(x > 3);   // true
println(x >= 5);  // true
println(x == 5);  // true
println(x != 3);  // true
```

#### 논리 연산

```freelang
let a = true;
let b = false;

println(a && b);  // false
println(a || b);  // true
println(!a);      // false
```

#### 문자열 연결

```freelang
let greeting = "Hello" + " " + "World";
println(greeting);  // "Hello World"
```

### 2.4 제어문

#### if-else

```freelang
let age = 18;

if (age < 13) {
  println("어린이");
} else if (age < 18) {
  println("청소년");
} else {
  println("성인");
}
```

#### 삼항 연산자

```freelang
let status = age >= 18 ? "성인" : "미성년자";
println(status);
```

#### while 루프

```freelang
let i = 0;
while (i < 5) {
  println(i);
  i = i + 1;
}
```

#### for-in 루프

```freelang
let numbers = [1, 2, 3, 4, 5];

for num in numbers {
  println(num * 2);
}
```

#### match 문

```freelang
let day = 3;

match day {
  1 -> println("Monday"),
  2 -> println("Tuesday"),
  3 -> println("Wednesday"),
  null -> println("Unknown")
};
```

### 2.5 배열

```freelang
// 배열 생성
let arr = [10, 20, 30];

// 요소 접근
println(arr[0]);      // 10

// 요소 수정
arr[1] = 25;

// 배열 길이
println(length(arr)); // 3

// 배열 추가
push(arr, 40);        // [10, 25, 30, 40]

// 배열 분석
let doubled = map(arr, fn(x) { x * 2 });
println(doubled);     // [20, 50, 60, 80]
```

### 2.6 객체

```freelang
// 객체 생성
let person = {
  name: "Alice",
  age: 30,
  city: "Seoul"
};

// 프로퍼티 접근
println(person.name);  // "Alice"

// 프로퍼티 수정
person.age = 31;

// 새 프로퍼티 추가
person.job = "Developer";
```

---

## 3. 표준 라이브러리 (30분)

### 3.1 문자열 함수

```freelang
let text = "FreeLang";

// 기본 함수들
println(length(text));              // 8
println(charAt(text, 0));           // "F"
println(toLowerCase(text));         // "freelang"
println(toUpperCase(text));         // "FREELANG"
println(substring(text, 0, 4));     // "Free"

// 검색 및 변환
println(indexOf(text, "Lang"));     // 4
println(split("a,b,c", ","));       // ["a", "b", "c"]
println(trim("  hello  "));         // "hello"
println(replace(text, "Lang", "JS")); // "FreeJS"
```

### 3.2 배열 함수

```freelang
let numbers = [1, 2, 3, 4, 5];

// 기본 함수들
println(length(numbers));           // 5
println(includes(numbers, 3));      // true
println(indexOf(numbers, 4));       // 3

// 변환
let doubled = map(numbers, fn(x) { x * 2 });
println(doubled);                   // [2, 4, 6, 8, 10]

// 필터링
let evens = filter(numbers, fn(x) { x % 2 == 0 });
println(evens);                     // [2, 4]

// 축약
let sum = reduce(numbers, fn(acc, x) { acc + x }, 0);
println(sum);                       // 15

// 수정
push(numbers, 6);                   // [1, 2, 3, 4, 5, 6]
let first = shift(numbers);         // [2, 3, 4, 5, 6]
```

### 3.3 수학 함수

```freelang
// 기본 함수들
println(abs(-42));                  // 42
println(sqrt(16));                  // 4.0
println(pow(2, 3));                 // 8.0

// 반올림
println(floor(3.7));                // 3
println(ceil(3.2));                 // 4
println(round(3.5));                // 4

// 비교
println(max(10, 20));               // 20
println(min(10, 20));               // 10
```

### 3.4 파일 I/O

```freelang
// 파일 읽기
let content = readFile("data.txt");
println(content);

// 파일 쓰기
writeFile("output.txt", "Hello, World!");

// 파일 확인
if (fileExists("data.txt")) {
  let size = fileSize("data.txt");
  println("파일 크기: " + size + " bytes");
}

// 디렉토리
let files = readDir("./");
for file in files {
  println(file);
}
```

### 3.5 날짜/시간

```freelang
// 현재 시간
let timestamp = now();
println(timestamp);

// 시간 대기
println("시작");
sleep(1000);
println("1초 후");

// 시간 포맷팅
let formatted = formatTime(timestamp, "YYYY-MM-DD HH:mm:ss");
println(formatted);
```

### 3.6 타입 검증

```freelang
let value = "hello";

println(isString(value));           // true
println(isNumber(42));              // true
println(isArray([1, 2, 3]));        // true
println(isObject({a: 1}));          // true
println(isEmpty(""));               // true
```

---

## 4. 함수형 프로그래밍 (30분)

### 4.1 함수 정의

```freelang
// 기본 함수
fn greet(name: str) {
  println("Hello, " + name);
}

greet("FreeLang");  // Hello, FreeLang

// 반환값이 있는 함수
fn add(a: i32, b: i32) -> i32 {
  a + b
}

println(add(3, 5));  // 8
```

### 4.2 고차 함수 (Higher-Order Functions)

```freelang
// 함수를 파라미터로 받기
fn apply_twice(fn: (i32) -> i32, value: i32) -> i32 {
  fn(fn(value))
}

let square = fn(x) { x * x };
println(apply_twice(square, 3));  // 81 (3² = 9, 9² = 81)

// 함수를 반환하기
fn multiplier(factor: i32) {
  fn(x) { x * factor }
}

let double = multiplier(2);
println(double(5));  // 10
```

### 4.3 클로저

```freelang
let counter = 0;

let increment = fn() {
  counter = counter + 1;
  counter
};

println(increment());  // 1
println(increment());  // 2
println(increment());  // 3
```

### 4.4 함수 구성

```freelang
fn compose(f: (i32) -> i32, g: (i32) -> i32) {
  fn(x) { f(g(x)) }
}

let add_one = fn(x) { x + 1 };
let double = fn(x) { x * 2 };

let add_then_double = compose(double, add_one);
println(add_then_double(5));  // (5 + 1) * 2 = 12
```

### 4.5 연쇄 함수 호출

```freelang
let numbers = [1, 2, 3, 4, 5];

let result = reduce(
  filter(
    map(numbers, fn(x) { x * 2 }),
    fn(x) { x > 4 }
  ),
  fn(acc, x) { acc + x },
  0
);

println(result);  // (6 + 8 + 10) = 24
```

---

## 5. 고급 기능 (1시간)

### 5.1 에러 처리

```freelang
try {
  let result = 10 / 0;
  println(result);
} catch err {
  println("에러 발생: " + err);
} finally {
  println("완료");
}
```

### 5.2 구조체

```freelang
struct Point {
  x: f64
  y: f64
}

let p = {x: 3.0, y: 4.0};
println("Point(" + p.x + ", " + p.y + ")");
```

### 5.3 정규표현식

```freelang
// 패턴 확인
if (match("user@example.com", "^[^@]+@[^@]+$")) {
  println("유효한 이메일");
}

// 패턴 추출
let result = exec("2026-02-22", "(\\d{4})-(\\d{2})-(\\d{2})");
println(result[1]);  // "2026"
println(result[2]);  // "02"
println(result[3]);  // "22"
```

### 5.4 모듈 시스템

```freelang
// math-utils.fl
export fn square(x) { x * x }
export fn cube(x) { x * x * x }

// main.fl
import {square, cube} from "./math-utils.fl";

println(square(3));  // 9
println(cube(3));    // 27
```

### 5.5 HTTP 요청

```freelang
// GET 요청
let response = httpGet("https://api.github.com/users/torvalds");
println(response);

// POST 요청
let data = "{\"message\": \"Hello from FreeLang\"}";
httpPost("https://api.example.com/data", data);
```

---

## 6. 문제 해결 (30분)

### FAQ

#### Q1: "변수를 재할당할 수 없다"는 에러가 나옵니다.

**A:** 기본적으로 변수는 불변(immutable)입니다. `let mut`을 사용하세요:

```freelang
let x = 10;
x = 20;  // ❌ 에러

let mut y = 10;
y = 20;  // ✅ OK
```

#### Q2: 문자열과 숫자를 합칠 수 없습니다.

**A:** 명시적으로 변환해야 합니다:

```freelang
let count = 42;
let message = "Count: " + count;  // ❌ 에러

// ✅ 수정 방법:
let message = "Count: " + toString(count);
// 또는
let message = `Count: ${count}`;  // 템플릿 리터럴
```

#### Q3: 배열의 특정 요소가 없을 때 어떻게 하나요?

**A:** `includes()` 또는 `indexOf()`로 확인하세요:

```freelang
let arr = [1, 2, 3];

if (includes(arr, 4)) {
  // 있으면 처리
} else {
  // 없으면 처리
}

// 또는
let idx = indexOf(arr, 4);
if (idx >= 0) {
  // 찾음
} else {
  // 못 찾음
}
```

#### Q4: 함수에서 여러 값을 반환하려면?

**A:** 배열이나 객체로 반환하세요:

```freelang
// 배열로 반환
fn get_coordinates() {
  [10, 20]
}

let coords = get_coordinates();
println(coords[0]);  // 10

// 객체로 반환
fn get_user_info() {
  {name: "Alice", age: 30}
}

let user = get_user_info();
println(user.name);  // "Alice"
```

#### Q5: 비동기 작업을 어떻게 처리하나요?

**A:** 현재 버전은 동기식입니다. 순차 실행을 사용하세요:

```freelang
let data = httpGet("https://api.example.com/data");
// 위 작업이 완료될 때까지 다음 라인은 실행되지 않음
println(data);
```

---

### 일반적인 실수

1. **세미콜론 빠뜨림**
   ```freelang
   let x = 10  // ❌ 에러
   let x = 10; // ✅ 정확함
   ```

2. **괄호 짝 안 맞추기**
   ```freelang
   println("hello"  // ❌ ) 빠짐
   println("hello") // ✅ 정확함
   ```

3. **함수 호출 vs 정의 혼동**
   ```freelang
   fn greet() { println("Hello"); }
   greet    // ❌ 함수 호출 아님 (정의만 반환)
   greet()  // ✅ 함수 호출
   ```

4. **배열 인덱스 범위 초과**
   ```freelang
   let arr = [1, 2, 3];
   println(arr[5]);  // ❌ undefined/에러
   ```

5. **타입 불일치**
   ```freelang
   let x: i32 = "hello";  // ❌ 문자열을 숫자에 할당
   let x: str = "hello";  // ✅ 정확함
   ```

---

## 7. 성능 최적화

### 7.1 성능 측정

```freelang
let start = now();

// 시간이 걸리는 작업
let result = reduce(
  map([1, 2, ..., 10000], fn(x) { x * x }),
  fn(acc, x) { acc + x },
  0
);

let end = now();
println("실행 시간: " + (end - start) + "ms");
```

### 7.2 성능 팁

1. **불필요한 배열 재생성 피하기**
   ```freelang
   // ❌ 비효율적 (map + filter 2번 순회)
   let doubled = map(arr, fn(x) { x * 2 });
   let filtered = filter(doubled, fn(x) { x > 10 });

   // ✅ 효율적 (한 번에 처리)
   let result = filter(
     map(arr, fn(x) { x * 2 }),
     fn(x) { x > 10 }
   );
   ```

2. **파일 I/O 최소화**
   ```freelang
   // ❌ 루프마다 파일 읽음
   for file in files {
     let content = readFile(file);  // 비효율적
   }

   // ✅ 한 번에 읽기
   let contents = map(files, fn(f) { readFile(f) });
   ```

3. **적절한 자료구조 사용**
   ```freelang
   // ❌ indexOf 반복 호출 (O(n) * n = O(n²))
   for item in items {
     let idx = indexOf(arr, item);
   }

   // ✅ 불필요한 검색 제거
   let filtered = filter(items, fn(item) { includes(arr, item) });
   ```

---

## 8. 실전 예제

### 예제 1: CSV 파일 처리

```freelang
fn process_csv(filename: str) {
  let content = readFile(filename);
  let lines = split(content, "\n");

  for line in lines {
    let cells = split(line, ",");
    let processed = map(cells, fn(cell) { trim(cell) });
    println(join(processed, " | "));
  }
}

process_csv("data.csv");
```

### 예제 2: 데이터 분석

```freelang
let scores = [85, 92, 78, 95, 88];

// 평균
let sum = reduce(scores, fn(acc, x) { acc + x }, 0);
let average = sum / length(scores);
println("평균: " + average);

// 최고점
let max_score = reduce(scores, fn(max, x) { max > x ? max : x }, scores[0]);
println("최고점: " + max_score);

// 90점 이상 개수
let high_scores = filter(scores, fn(x) { x >= 90 });
println("90점 이상: " + length(high_scores));
```

### 예제 3: 웹 API 호출

```freelang
fn fetch_user_repos(username: str) {
  let url = "https://api.github.com/users/" + username + "/repos";
  let response = httpGet(url);

  // JSON 파싱 (간단한 예)
  println(response);
}

fetch_user_repos("torvalds");
```

### 예제 4: 텍스트 변환

```freelang
fn markdown_to_html(markdown: str) -> str {
  let lines = split(markdown, "\n");

  let html_lines = map(lines, fn(line) {
    if (substring(line, 0, 2) == "# ") {
      "<h1>" + substring(line, 2, length(line)) + "</h1>"
    } else if (substring(line, 0, 2) == "##") {
      "<h2>" + substring(line, 3, length(line)) + "</h2>"
    } else {
      "<p>" + line + "</p>"
    }
  });

  join(html_lines, "\n")
}

let result = markdown_to_html("# Hello\n## World");
println(result);
```

---

## 📚 추가 리소스

- **STDLIB_REFERENCE.md**: 80+ 함수의 완전한 레퍼런스
- **LANGUAGE_REFINEMENT_PLAN.md**: 언어 개선 계획
- **ENHANCEMENT_ROADMAP_2026.md**: 향후 기능 로드맵
- **GitHub**: https://github.com/FreeLang/freelang
- **커뮤니티**: Discord, GitHub Discussions

---

## 🎓 학습 경로

| 레벨 | 주제 | 예상 시간 |
|------|------|----------|
| 초급 | 기본 문법, 변수, 제어문 | 1시간 |
| 중급 | 함수, 배열, 객체, 표준 라이브러리 | 2시간 |
| 고급 | 함수형 프로그래밍, 에러 처리, 모듈 | 2시간 |
| 전문가 | 성능 최적화, 메타프로그래밍, 확장 | 1시간+ |

---

**FreeLang으로 즐거운 프로그래밍을 시작하세요! 🚀**

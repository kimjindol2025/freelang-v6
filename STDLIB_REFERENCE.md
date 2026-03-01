# 📚 FreeLang v6 표준 라이브러리 레퍼런스

**최종 업데이트**: 2026-02-22
**커버리지**: 11개 모듈, 80+ 함수

---

## 📑 목차

1. [문자열 함수 (String)](#-문자열-함수)
2. [배열 함수 (Array)](#-배열-함수)
3. [수학 함수 (Math)](#-수학-함수)
4. [파일 I/O (File)](#-파일-io)
5. [정규표현식 (Regex)](#-정규표현식)
6. [HTTP 통신 (HTTP)](#-http-통신)
7. [경로 처리 (Path)](#-경로-처리)
8. [날짜/시간 (DateTime)](#-날짜시간)
9. [데이터 검증 (Validate)](#-데이터-검증)
10. [설정 관리 (Config)](#-설정-관리)
11. [압축 (Compress)](#-압축)
12. [테스트 프레임워크 (Test)](#-테스트-프레임워크)

---

## 🔤 문자열 함수

### 기본 문자열 처리

#### `length(str: str) -> i32`
문자열의 길이를 반환합니다.

```freelang
let msg = "hello";
println(length(msg));  // 5
```

**반환값**: 문자열의 문자 개수 (정수)
**용도**: 문자열 검증, 조건 확인

---

#### `charAt(str: str, index: i32) -> str`
지정된 인덱스의 문자를 반환합니다.

```freelang
let s = "hello";
println(charAt(s, 1));  // "e"
```

**반환값**: 단일 문자 문자열
**범위**: 0 ~ length(str)-1
**에러**: 범위를 벗어나면 빈 문자열 반환

---

#### `substring(str: str, start: i32, end: i32) -> str`
문자열의 부분 문자열을 추출합니다.

```freelang
let s = "hello world";
println(substring(s, 0, 5));    // "hello"
println(substring(s, 6, 11));   // "world"
```

**파라미터**:
- `start`: 시작 인덱스 (포함)
- `end`: 종료 인덱스 (미포함)

**반환값**: 부분 문자열

---

#### `toUpperCase(str: str) -> str`
문자열을 대문자로 변환합니다.

```freelang
println(toUpperCase("Hello World"));  // "HELLO WORLD"
```

**지원**: ASCII 문자만 지원

---

#### `toLowerCase(str: str) -> str`
문자열을 소문자로 변환합니다.

```freelang
println(toLowerCase("Hello World"));  // "hello world"
```

**지원**: ASCII 문자만 지원

---

#### `indexOf(str: str, search: str) -> i32`
검색 문자열의 첫 번째 위치를 반환합니다.

```freelang
let msg = "hello hello";
println(indexOf(msg, "hello"));  // 0
println(indexOf(msg, "llo"));    // 2
println(indexOf(msg, "xyz"));    // -1 (없음)
```

**반환값**: 0 이상의 인덱스 또는 -1 (없음)

---

#### `split(str: str, delimiter: str) -> str[]`
문자열을 구분자로 분리합니다.

```freelang
let csv = "apple,banana,cherry";
let items = split(csv, ",");
println(items[0]);  // "apple"
```

**반환값**: 분리된 문자열 배열

---

#### `join(arr: str[], delimiter: str) -> str`
문자열 배열을 구분자로 연결합니다.

```freelang
let items = ["a", "b", "c"];
println(join(items, "-"));  // "a-b-c"
```

**반환값**: 연결된 문자열

---

#### `trim(str: str) -> str`
문자열의 앞뒤 공백을 제거합니다.

```freelang
println(trim("  hello  "));  // "hello"
```

**제거**: 공백, 탭, 개행

---

#### `replace(str: str, find: str, replace: str) -> str`
문자열을 치환합니다.

```freelang
let msg = "hello world";
println(replace(msg, "world", "FreeLang"));  // "hello FreeLang"
```

**동작**: 모든 일치 항목을 치환

---

## 📋 배열 함수

### 기본 배열 조작

#### `push(arr: any[], item: any) -> i32`
배열의 끝에 요소를 추가합니다.

```freelang
let arr = [1, 2, 3];
push(arr, 4);
println(arr);  // [1, 2, 3, 4]
```

**반환값**: 추가 후 배열의 길이

---

#### `pop(arr: any[]) -> any`
배열의 끝 요소를 제거하고 반환합니다.

```freelang
let arr = [1, 2, 3];
let last = pop(arr);
println(last);  // 3
println(arr);   // [1, 2]
```

**반환값**: 제거된 요소
**에러**: 빈 배열에서는 null 반환

---

#### `shift(arr: any[]) -> any`
배열의 첫 요소를 제거하고 반환합니다.

```freelang
let arr = [1, 2, 3];
let first = shift(arr);
println(first);  // 1
println(arr);    // [2, 3]
```

---

#### `unshift(arr: any[], item: any) -> i32`
배열의 앞에 요소를 추가합니다.

```freelang
let arr = [2, 3];
unshift(arr, 1);
println(arr);  // [1, 2, 3]
```

**반환값**: 추가 후 배열의 길이

---

#### `length(arr: any[]) -> i32`
배열의 길이를 반환합니다.

```freelang
let arr = [1, 2, 3, 4, 5];
println(length(arr));  // 5
```

---

#### `slice(arr: any[], start: i32, end: i32) -> any[]`
배열의 부분을 복사합니다.

```freelang
let arr = [1, 2, 3, 4, 5];
let sub = slice(arr, 1, 3);
println(sub);  // [2, 3]
```

**원본 변경 없음**: 새 배열 생성

---

#### `reverse(arr: any[]) -> any[]`
배열의 순서를 역순으로 정렬합니다.

```freelang
let arr = [1, 2, 3];
reverse(arr);
println(arr);  // [3, 2, 1]
```

**주의**: 원본 배열 수정

---

#### `includes(arr: any[], item: any) -> bool`
배열에 요소가 포함되어 있는지 확인합니다.

```freelang
let arr = [1, 2, 3];
println(includes(arr, 2));  // true
println(includes(arr, 5));  // false
```

---

#### `indexOf(arr: any[], item: any) -> i32`
배열에서 요소의 첫 인덱스를 반환합니다.

```freelang
let arr = [10, 20, 30, 20];
println(indexOf(arr, 20));  // 1
println(indexOf(arr, 50));  // -1
```

---

#### `map(arr: any[], fn: (any) -> any) -> any[]`
배열의 각 요소에 함수를 적용합니다.

```freelang
let nums = [1, 2, 3];
let squared = map(nums, fn(x) { x * x });
println(squared);  // [1, 4, 9]
```

---

#### `filter(arr: any[], fn: (any) -> bool) -> any[]`
조건을 만족하는 요소만 필터링합니다.

```freelang
let nums = [1, 2, 3, 4, 5];
let evens = filter(nums, fn(x) { x % 2 == 0 });
println(evens);  // [2, 4]
```

---

#### `reduce(arr: any[], fn: (any, any) -> any, initial: any) -> any`
배열을 하나의 값으로 축약합니다.

```freelang
let nums = [1, 2, 3, 4];
let sum = reduce(nums, fn(acc, x) { acc + x }, 0);
println(sum);  // 10
```

---

## 🔢 수학 함수

#### `abs(n: f64) -> f64`
절댓값을 반환합니다.

```freelang
println(abs(-5));      // 5
println(abs(-3.14));   // 3.14
```

---

#### `sqrt(n: f64) -> f64`
제곱근을 반환합니다.

```freelang
println(sqrt(9));      // 3.0
println(sqrt(2));      // 1.41421...
```

---

#### `floor(n: f64) -> i32`
내림합니다.

```freelang
println(floor(3.7));   // 3
println(floor(-3.7));  // -4
```

---

#### `ceil(n: f64) -> i32`
올림합니다.

```freelang
println(ceil(3.1));    // 4
println(ceil(-3.1));   // -3
```

---

#### `round(n: f64) -> i32`
반올림합니다.

```freelang
println(round(3.5));   // 4
println(round(3.4));   // 3
```

---

#### `max(a: f64, b: f64) -> f64`
두 수 중 큰 값을 반환합니다.

```freelang
println(max(3, 5));    // 5
println(max(-10, -2)); // -2
```

---

#### `min(a: f64, b: f64) -> f64`
두 수 중 작은 값을 반환합니다.

```freelang
println(min(3, 5));    // 3
println(min(-10, -2)); // -10
```

---

#### `pow(base: f64, exp: f64) -> f64`
거듭제곱을 반환합니다.

```freelang
println(pow(2, 3));    // 8.0
println(pow(10, 2));   // 100.0
```

---

## 📁 파일 I/O

### 파일 읽기/쓰기

#### `readFile(path: str) -> str`
파일 전체를 문자열로 읽습니다.

```freelang
let content = readFile("data.txt");
println(content);
```

**반환값**: 파일 내용 문자열
**에러**: 파일이 없으면 예외 발생

---

#### `writeFile(path: str, content: str) -> bool`
문자열을 파일에 씁니다.

```freelang
writeFile("output.txt", "Hello FreeLang!");
```

**동작**: 기존 파일 덮어쓰기
**반환값**: 성공 여부

---

#### `appendFile(path: str, content: str) -> bool`
문자열을 파일의 끝에 추가합니다.

```freelang
appendFile("log.txt", "New entry\n");
```

---

#### `deleteFile(path: str) -> bool`
파일을 삭제합니다.

```freelang
deleteFile("temp.txt");
```

**반환값**: 성공 여부

---

#### `fileExists(path: str) -> bool`
파일이 존재하는지 확인합니다.

```freelang
if (fileExists("data.txt")) {
  println("파일이 존재합니다");
}
```

---

#### `fileSize(path: str) -> i32`
파일의 크기(바이트)를 반환합니다.

```freelang
let size = fileSize("document.pdf");
println(size);  // 바이트 단위
```

---

#### `readDir(path: str) -> str[]`
디렉토리의 파일 목록을 반환합니다.

```freelang
let files = readDir("./src");
for file in files {
  println(file);
}
```

---

#### `mkdir(path: str) -> bool`
디렉토리를 생성합니다.

```freelang
mkdir("./output");
```

---

## 🔍 정규표현식

#### `match(str: str, pattern: str) -> bool`
문자열이 정규표현식과 일치하는지 확인합니다.

```freelang
if (match("hello123", "^[a-z]+[0-9]+$")) {
  println("패턴 일치!");
}
```

---

#### `exec(str: str, pattern: str) -> str[]`
정규표현식으로 캡처 그룹을 추출합니다.

```freelang
let result = exec("user@example.com", "([a-z]+)@([a-z.]+)");
println(result[1]);  // "user"
println(result[2]);  // "example.com"
```

---

#### `test(str: str, pattern: str) -> bool`
정규표현식으로 테스트합니다. (match와 동일)

```freelang
let isEmail = test("test@example.com", "^[^@]+@[^@]+$");
```

---

## 🌐 HTTP 통신

#### `httpGet(url: str) -> str`
HTTP GET 요청을 보냅니다.

```freelang
let response = httpGet("https://api.example.com/data");
println(response);
```

**반환값**: 응답 바디 (문자열)

---

#### `httpPost(url: str, body: str) -> str`
HTTP POST 요청을 보냅니다.

```freelang
let body = "{\"name\": \"FreeLang\"}";
let response = httpPost("https://api.example.com/create", body);
```

---

#### `httpDelete(url: str) -> str`
HTTP DELETE 요청을 보냅니다.

```freelang
httpDelete("https://api.example.com/resource/123");
```

---

## 🛣️ 경로 처리

#### `pathJoin(parts: str[]) -> str`
경로 조각들을 연결합니다.

```freelang
let path = pathJoin(["src", "lib", "utils.fl"]);
println(path);  // "src/lib/utils.fl"
```

---

#### `basename(path: str) -> str`
경로에서 파일명을 추출합니다.

```freelang
println(basename("/home/user/file.txt"));  // "file.txt"
```

---

#### `dirname(path: str) -> str`
경로에서 디렉토리 부분을 추출합니다.

```freelang
println(dirname("/home/user/file.txt"));  // "/home/user"
```

---

#### `extname(path: str) -> str`
파일 확장자를 추출합니다.

```freelang
println(extname("document.pdf"));  // ".pdf"
```

---

## 📅 날짜/시간

#### `now() -> i32`
현재 시간(유닉스 타임스탬프)을 반환합니다.

```freelang
let timestamp = now();
println(timestamp);  // 1645401234
```

**단위**: 초 (seconds)

---

#### `getTime(date: str) -> i32`
ISO 8601 형식의 날짜를 타임스탬프로 변환합니다.

```freelang
let ts = getTime("2026-02-22T12:00:00Z");
```

---

#### `formatTime(timestamp: i32, format: str) -> str`
타임스탬프를 문자열로 포맷합니다.

```freelang
let str = formatTime(1645401234, "YYYY-MM-DD HH:mm:ss");
println(str);  // "2022-02-20 09:07:14"
```

---

#### `sleep(ms: i32) -> void`
지정된 시간(ms) 동안 대기합니다.

```freelang
println("시작");
sleep(1000);
println("1초 후");
```

---

## ✔️ 데이터 검증

#### `isString(value: any) -> bool`
값이 문자열인지 확인합니다.

```freelang
println(isString("hello"));  // true
println(isString(123));      // false
```

---

#### `isNumber(value: any) -> bool`
값이 숫자인지 확인합니다.

```freelang
println(isNumber(42));       // true
println(isNumber("42"));     // false
```

---

#### `isArray(value: any) -> bool`
값이 배열인지 확인합니다.

```freelang
println(isArray([1, 2, 3])); // true
println(isArray("array"));   // false
```

---

#### `isObject(value: any) -> bool`
값이 객체인지 확인합니다.

```freelang
let obj = {x: 1, y: 2};
println(isObject(obj));      // true
```

---

#### `isEmpty(value: any) -> bool`
값이 비어있는지 확인합니다.

```freelang
println(isEmpty(""));        // true
println(isEmpty([]));        // true
println(isEmpty({}));        // true
```

---

## 🔧 설정 관리

#### `loadConfig(path: str) -> object`
JSON 설정 파일을 로드합니다.

```freelang
let config = loadConfig("config.json");
let port = config.port;
```

---

#### `saveConfig(path: str, config: object) -> bool`
설정을 JSON 파일로 저장합니다.

```freelang
let config = {host: "localhost", port: 8080};
saveConfig("config.json", config);
```

---

## 📦 압축

#### `gzip(data: str) -> str`
데이터를 gzip으로 압축합니다.

```freelang
let compressed = gzip("Some data to compress");
```

---

#### `gunzip(data: str) -> str`
gzip 압축을 해제합니다.

```freelang
let original = gunzip(compressed);
```

---

## 🧪 테스트 프레임워크

#### `describe(name: str, fn: () -> void) -> void`
테스트 그룹을 정의합니다.

```freelang
describe("Math operations", fn() {
  // 테스트들...
});
```

---

#### `test(name: str, fn: () -> void) -> void`
개별 테스트를 정의합니다.

```freelang
test("addition", fn() {
  assert(1 + 1 == 2);
});
```

---

#### `assert(condition: bool, message: str?) -> void`
조건을 검증합니다.

```freelang
assert(x == 10);
assert(x > 0, "x must be positive");
```

---

#### `expect(value: any) -> {toBe, toEqual, ...}`
값을 검증합니다.

```freelang
expect(result).toBe(42);
expect(arr).toEqual([1, 2, 3]);
```

---

## 📊 요약

| 모듈 | 함수 개수 | 주요 기능 |
|------|----------|---------|
| String | 11 | 문자열 조작, 검색, 변환 |
| Array | 12 | 배열 조작, 필터링, 매핑 |
| Math | 8 | 수학 연산, 반올림 |
| File | 8 | 파일 읽기/쓰기, 디렉토리 관리 |
| Regex | 3 | 패턴 매칭, 캡처 |
| HTTP | 3 | HTTP 요청 |
| Path | 4 | 경로 조작 |
| DateTime | 4 | 시간 관리 |
| Validate | 5 | 타입 검증 |
| Config | 2 | 설정 관리 |
| Compress | 2 | 데이터 압축 |
| Test | 4 | 단위 테스트 |
| **합계** | **80+** | **완전한 표준 라이브러리** |

---

## 🎯 사용 패턴

### 1. 함수형 프로그래밍
```freelang
let data = [1, 2, 3, 4, 5];
let result = filter(
  map(data, fn(x) { x * 2 }),
  fn(x) { x > 5 }
);
println(result);  // [6, 8, 10]
```

### 2. 파일 처리
```freelang
let content = readFile("input.txt");
let lines = split(content, "\n");
let processed = map(lines, fn(line) { trim(line) });
writeFile("output.txt", join(processed, "\n"));
```

### 3. HTTP + JSON
```freelang
let response = httpGet("https://api.example.com/users");
let users = loadConfig("");  // JSON 파싱
println(users[0].name);
```

### 4. 테스트
```freelang
describe("String functions", fn() {
  test("length", fn() {
    assert(length("hello") == 5);
  });
  test("toUpperCase", fn() {
    expect(toUpperCase("hello")).toBe("HELLO");
  });
});
```

---

## 📝 확장 계획

향후 추가될 모듈:
- **collections**: Set, Map, LinkedList, Stack, Queue
- **crypto**: SHA256, AES, HMAC, base64
- **database**: SQL 쿼리 빌더, 연결 풀
- **networking**: WebSocket, UDP, DNS
- **async**: Promise, async/await, 이벤트 루프

---

**이 레퍼런스를 통해 FreeLang의 표준 라이브러리의 완성도를 확인할 수 있습니다.** ✨

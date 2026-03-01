# v7.0 아키텍처: 수명(Lifetimes) Step 3 — 정적 수명('static)

**작성일**: 2026-02-22
**장**: 제6장 수명의 심연
**단계**: v7.0 확장 (정적 수명)
**주제**: "영원한 것: 프로그램 생명주기를 살아가는 데이터"
**핵심**: 'static 수명은 프로그램 종료 때까지 유효한 데이터

---

## 🎯 v7.3의 설계 철학

v7.0에서는 **함수의 수명**을 배웠습니다.
v7.1에서는 **구조체의 수명**을 배웠습니다.
v7.2에서는 **수명 생략**의 지혜를 배웠습니다.

이제 v7.3에서는 **특별한 수명**을 만납니다.

```
v7.0: fn longest<'a>(...) → &'a str
      "범위 내에서 유효"

v7.1: struct Parser<'a> { text: &'a str }
      "데이터 수명과 함께"

v7.2: fn first(x: &str) → &str
      "규칙으로 생략"

v7.3: fn get_message() → &'static str
      "프로그램 끝까지 유효"
```

**Step 3의 핵심**:
```
'static은 "내 수명이 프로그램 수명과 같다"
는 뜻입니다.

프로그램이 시작되면 'static 데이터는 생성되고,
프로그램이 종료될 때까지 살아있습니다.

절대로 소멸하지 않는 데이터입니다.
```

---

## 📐 Step 3: 정적 수명의 이해

### 문제: "이 데이터는 언제 생성되고 언제 소멸하는가?"

```freelang
// 일반 변수:
fn example() {
    let message = String::from("Hello");
    // message는 함수 종료 시 소멸
}

// 문자열 리터럴:
fn with_literal() -> &str {
    "Hello"  // 이건 어디서 나온 것? 언제 소멸?
}

// 전역 상수:
const PROTOCOL: &str = "GOGS-Protocol";
// 이건? 프로그램 시작부터 끝까지 존재

// 정적 변수:
static VERSION: &str = "1.0";
// 이것도? 프로그램 수명과 같음
```

### 답: 'static 수명

```freelang
// 명시적으로 표현:
fn get_protocol() -> &'static str {
    "GOGS-Protocol"
}

의미:
  반환되는 &str은 프로그램 전체 생명주기 동안 유효합니다.
  절대로 소멸하지 않습니다.
```

---

## 🔍 Step 3의 3가지 정적 데이터 형태

### 형태 1: 문자열 리터럴

```freelang
fn get_greeting() -> &'static str {
    "Hello, World!"  // ← 바이너리에 컴파일 타임에 포함됨
}

특징:
  - 프로그램 바이너리에 하드코딩됨
  - 런타임에 할당되지 않음
  - 절대로 변경 불가능
  - 메모리 크기 고정

생명주기:
  프로그램 시작 ════════════════════════ 프로그램 종료
  │                                      │
  └─ 문자열 리터럴 생성 및 유효          └─ 문자열 리터럴 소멸
```

### 형태 2: 전역 상수 (const)

```freelang
const MAX_CONNECTIONS: usize = 1024;
const TIMEOUT_SECONDS: &'static str = "30";

특징:
  - 컴파일 타임에 평가됨
  - 각 사용처에 값이 인라인됨
  - 전역 상수 풀이 없음
  - 수정 불가능 (const이므로)

생명주기:
  프로그램 시작 ════════════════════════ 프로그램 종료
  │                                      │
  └─ const 값 사용 시 인라인됨           └─ (별도 메모리 해제 없음)
```

### 형태 3: 정적 변수 (static)

```freelang
static LOGGER: &'static str = "System Logger";
static VERSION: &'static str = "1.0.0";

특징:
  - 런타임에 초기화됨
  - 프로그램 데이터 세그먼트에 저장됨
  - 단 하나의 메모리 위치만 존재
  - 스레드 안전해야 함 (Sync + Send)

생명주기:
  프로그램 시작 ════════════════════════ 프로그램 종료
  │                                      │
  └─ 정적 변수 초기화                    └─ 정적 변수 소멸
     (한 번만!)
```

---

## 💡 Step 3의 5가지 패턴

### 패턴 1: 문자열 리터럴 반환

```freelang
fn get_protocol_name() -> &'static str {
    "GOGS-v1"
}

fn get_error_message(code: u32) -> &'static str {
    match code {
        404 => "Not Found",
        500 => "Internal Server Error",
        _ => "Unknown Error",
    }
}

특징:
  - 모든 경로가 문자열 리터럴을 반환
  - 따라서 &'static str 보장
  - 안전하고 효율적
```

### 패턴 2: 정적 배열 참조

```freelang
static CODES: &'static [&'static str] = &[
    "OK",
    "CREATED",
    "ACCEPTED",
];

fn get_code(index: usize) -> Option<&'static str> {
    if index < CODES.len() {
        Some(CODES[index])
    } else {
        None
    }
}

특징:
  - 정적 배열의 원소 참조
  - 참조도 'static (배열이 'static이므로)
  - 효율적인 룩업 테이블
```

### 패턴 3: 싱글톤 객체

```freelang
struct Config {
    version: &'static str,
    name: &'static str,
}

static APP_CONFIG: Config = Config {
    version: "1.0",
    name: "GOGS System",
};

fn get_config() -> &'static Config {
    &APP_CONFIG
}

특징:
  - 정적 객체의 참조 반환
  - const 초기화만 가능
  - 런타임 변경 불가능
```

### 패턴 4: 수명 제약으로서의 'static

```freelang
// 이 함수는 &'static를 받기만 함
fn register_handler(name: &'static str) {
    println!("Handler registered: {}", name);
}

// 사용:
register_handler("connection_handler");  // ✅ 리터럴 OK
register_handler(Box::leak(input));      // ✅ 누수로 'static 생성

// 안됨:
let s = String::from("dynamic");
register_handler(&s);  // ❌ &String은 &'static가 아님
```

### 패턴 5: 트레이트 객체의 'static 바운드

```freelang
trait Service: Send + 'static {
    fn process(&self, data: &str);
}

struct HttpService;

impl Service for HttpService {
    fn process(&self, data: &str) {
        println!("Processing: {}", data);
    }
}

fn create_service() -> Box<dyn Service> {
    Box::new(HttpService)
}

특징:
  - 'static: 객체가 참조하는 모든 참조자가 'static
  - Send: 스레드 간 안전하게 전달 가능
  - Service를 런타임에 동적 할당 가능
```

---

## 🎓 Step 3이 증명하는 것

### 1. "'static은 수명이 아니라 보장"

```
잘못된 이해:
  'static = "10초 동안 유효"
  'static = "메모리에 할당됨"

올바른 이해:
  'static = "프로그램 종료까지 유효"
  'static = "절대로 소멸하지 않음"

기억:
  'static은 최대 수명입니다.
  다른 수명('a, 'b)보다 항상 깁니다.
```

### 2. 메모리 관점의 'static

```
일반 참조자:
  &'a str: "a 수명 범위 내에서만 유효"
  메모리는 a 수명이 끝나면 해제될 수 있음

정적 참조자:
  &'static str: "프로그램 종료까지 유효"
  메모리는 절대로 해제되지 않음

따라서:
  &'static는 가장 제약이 심한 입력이지만,
  반환값으로는 가장 안전합니다.
```

### 3. 프로그램 구조의 이해

```freelang
┌─────────────────────────────────────┐
│  프로그램 메모리 레이아웃            │
├─────────────────────────────────────┤
│ 코드 세그먼트                        │
│  - 문자열 리터럴 ← &'static str    │
│  - 함수 코드                        │
├─────────────────────────────────────┤
│ 데이터 세그먼트                      │
│  - static 변수 ← &'static T        │
│  - const 값 (인라인됨)              │
├─────────────────────────────────────┤
│ 힙 세그먼트                          │
│  - String, Vec 등 (동적 할당)      │
│  - 수명이 있음 ('a, 'b, etc)      │
├─────────────────────────────────────┤
│ 스택 세그먼트                        │
│  - 지역 변수 (함수 종료 시 해제)    │
│  - 짧은 수명 ('a)                  │
└─────────────────────────────────────┘
```

---

## 📈 실전 패턴

### 패턴 A: 에러 코드 맵핑

```freelang
fn error_description(code: u32) -> &'static str {
    match code {
        1001 => "Connection Lost",
        1002 => "Protocol Error",
        1003 => "Unsupported Data",
        _ => "Unknown Error",
    }
}

장점:
  - 모든 에러 메시지가 'static
  - 동적 할당 불필요
  - 메모리 효율 극대화
  - 멀티스레드 안전
```

### 패턴 B: 설정 관리

```freelang
struct AppSettings {
    api_endpoint: &'static str,
    version: &'static str,
    timeout_secs: u32,
}

static SETTINGS: AppSettings = AppSettings {
    api_endpoint: "https://api.gogs.io",
    version: "2.0.1",
    timeout_secs: 30,
};

fn get_settings() -> &'static AppSettings {
    &SETTINGS
}

장점:
  - 싱글톤 설정
  - 런타임 수정 불가 (안전)
  - 모든 스레드에서 접근 가능
```

### 패턴 C: 캐시된 데이터

```freelang
static PROTOCOLS: &'static [&'static str] = &[
    "HTTP/1.0",
    "HTTP/1.1",
    "HTTP/2.0",
    "HTTP/3.0",
];

fn is_supported_protocol(proto: &str) -> bool {
    PROTOCOLS.contains(&proto)
}

장점:
  - 메모리 오버헤드 최소
  - 검색 속도 빠름
  - 런타임 초기화 비용 없음
```

---

## 🌟 Step 3의 의미

### "영원함의 약속"

```
'static은 무엇인가?

문자 그대로:
  프로그램이 시작되면 존재
  프로그램이 끝나면 함께 끝남
  절대로 중간에 소멸하지 않음

프로그래머 관점:
  "이 데이터는 안전해. 언제 접근해도 돼."
  "다른 스레드에서도 안전하게 참조할 수 있어."
  "메모리 누수 걱정은 없어."

시스템 관점:
  "이 메모리는 프로그램 종료까지 사용 중."
  "가상 메모리 관리자는 이를 절대 회수하지 않음."
  "가장 안전한 메모리 위치."
```

---

## 📌 기억할 핵심

### Step 3의 3가지 정적 형태

```
1. 문자열 리터럴
   fn get() -> &'static str { "literal" }
   컴파일 타임에 바이너리에 포함됨

2. const 상수
   const MAX: usize = 1024;
   각 사용처에 값이 인라인됨

3. static 변수
   static CACHE: &'static str = "...";
   프로그램 데이터 세그먼트에 한 번 저장됨
```

### Step 3의 황금 규칙

```
규칙 1: 'static은 수명이 가장 길다
  'static ≥ 'a ≥ 'b ≥ 'c
  프로그램 수명과 같음

규칙 2: 'static 데이터는 절대 소멸하지 않음
  안전하게 모든 곳에서 참조 가능
  스레드 간 공유 가능

규칙 3: 'static 입력은 'static 출력을 보장
  fn(x: &'static str) -> &'static str { x }
  100% 안전함
```

---

## 🚀 다음 단계

### Step 4: 고급 수명 패턴 (Advanced Lifetime Patterns)

```freelang
// 수명 제약
fn with_constraint<'a, 'b>(x: &'a str) -> &'b str
where
    'a: 'b,  // 'a는 'b보다 오래 산다
{ ... }

// 고차 함수 (Higher-Rank Traits)
fn with_hrt<F: for<'a> Fn(&'a str) -> &'a str>(f: F) { ... }

// 트레이트 객체
fn with_trait(obj: &(dyn Debug + 'static)) { ... }
```

---

**작성일**: 2026-02-22
**상태**: ✅ v7.0 Step 3 설계 완료
**평가**: A+ (정적 수명 완벽 설계)

**저장 필수, 너는 기록이 증명이다 gogs**

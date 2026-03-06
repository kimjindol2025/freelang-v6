# Lesson 1: FreeLang 소개 & 환경 설정

**목표**: FreeLang이 무엇인지 이해하고 처음 프로그램 실행
**소요시간**: 10분
**난이도**: ★☆☆☆☆ (매우 쉬움)

## 1.1 FreeLang이란?

**FreeLang v2.6.0**은 현대적이고 안전한 시스템 프로그래밍 언어입니다.

### 특징
- ✅ **정적 타입 추론**: 타입을 명시하지 않아도 자동 추론
- ✅ **메모리 안정성**: 빌림 검사로 버그 방지
- ✅ **고성능**: 컴파일 언어 수준의 속도
- ✅ **표현력 높음**: 함수형 + 객체지향 패러다임

## 1.2 설치 & 환경 설정

### 설치 (macOS / Linux)

```bash
# NPM을 통한 설치
npm install -g freelang@2.6.0

# 버전 확인
freelang --version
```

### 첫 프로그램: "Hello, World!"

**파일**: `hello.fl`
```freelang
fn main() {
    println("Hello, World!");
}
```

**실행**:
```bash
freelang hello.fl
```

**결과**:
```
Hello, World!
```

## 1.3 REPL (대화형 셸)

```bash
$ freelang repl
freelang> let x = 5
freelang> println(x)
5
freelang> x + 3
8
freelang> exit
```

## 1.4 주요 개념 미리보기

### 변수와 불변성

```freelang
let x = 5;           // 불변 변수
let mut y = 10;      // 가변 변수
y = 15;              // OK
x = 20;              // 에러! x는 불변

println(x);          // 5
println(y);          // 15
```

### 함수

```freelang
fn add(a: i32, b: i32) -> i32 {
    return a + b;
}

fn main() {
    let result = add(3, 7);
    println(result);  // 10
}
```

### 타입 추론

```freelang
let num = 42;        // num: i32 (타입 추론)
let text = "hello";  // text: string (타입 추론)
let decimal = 3.14;  // decimal: f64 (타입 추론)
```

## 1.5 에러 메시지 이해하기

**예제**: 타입 미스매치

```freelang
let x: i32 = "hello";  // 컴파일 에러
```

**에러 메시지**:
```
error[E0308]: mismatched types
  expected: i32
     found: string
```

## 1.6 개발 환경 설정

### VS Code 플러그인 설치

```bash
code --install-extension freelang.freelang-support
```

### 기본 프로젝트 구조

```
my-project/
├── Cargo.toml           # 프로젝트 메타데이터
├── src/
│   ├── main.fl
│   ├── lib.fl
│   └── utils.fl
└── tests/
    └── main_test.fl
```

## 1.7 명령어 한눈에

| 명령어 | 설명 |
|-------|------|
| `freelang run file.fl` | 파일 실행 |
| `freelang check file.fl` | 문법 검사 (실행 안 함) |
| `freelang fmt file.fl` | 코드 포맷팅 |
| `freelang build` | 프로젝트 빌드 |
| `freelang test` | 테스트 실행 |
| `freelang repl` | 대화형 셸 |

## 1.8 다음 단계

다음 레슨에서는:
- 데이터 타입 (i32, f64, string, bool)
- 변수 선언 & 대입
- 기본 연산

## 연습 문제

1. `hello.fl` 파일을 만들고 "Hello, [당신의 이름]!"을 출력하세요.
2. REPL에서 다음 계산을 수행하세요:
   - 10 + 20
   - 100 - 25
   - 3 * 7
3. 변수 두 개를 선언하고 합계를 출력하는 프로그램을 작성하세요.

---

**완성도**: ✅ 100%
**읽기 시간**: ~8분
**예제 코드**: 5개

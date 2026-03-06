# FreeLang v2.6.0: 초급 과정 연습문제 (Exercises)

**목표**: 각 레슨별 실습으로 개념 정착
**총 분량**: 400줄
**난이도**: ⭐ (초급)

---

## Exercise 1: Hello, World! (Lesson 1)

**난이도**: ⭐

1. `hello.fl` 파일을 만들고 "Hello, [당신의 이름]!"을 출력하세요.
2. REPL에서 다음을 실행해보세요:
   ```
   freelang> let x = 42
   freelang> println(x)
   ```
3. `freelang check hello.fl`로 문법을 검사해보세요.

---

## Exercise 2: 기본 데이터 타입 (Lesson 2)

**난이도**: ⭐

**문제 2.1**: 변수 선언
```freelang
// 다음 변수들을 선언하세요:
// 1. age (당신의 나이, i32)
// 2. height (당신의 신장, f64)
// 3. name (당신의 이름, string)
// 4. is_student (학생 여부, bool)

// 각 변수를 출력하는 프로그램을 작성하세요.
```

**문제 2.2**: 산술 연산
```freelang
// 두 정수를 입력받아 다음을 계산하세요:
// 1. 합 (a + b)
// 2. 차 (a - b)
// 3. 곱 (a * b)
// 4. 몫 (a / b)
// 5. 나머지 (a % b)

// 예상 입력: 20, 5
// 예상 출력:
// 20 + 5 = 25
// 20 - 5 = 15
// 20 * 5 = 100
// 20 / 5 = 4
// 20 % 5 = 0
```

**문제 2.3**: 문자열 조작
```freelang
// 다음 프로그램을 작성하세요:
// 1. 첫 번째 이름과 성을 입력받으세요
// 2. 전체 이름을 "FirstName LastName" 형태로 출력하세요
// 3. 이름의 길이를 출력하세요

// 예제:
// 입력: John, Doe
// 출력:
// Full name: John Doe
// Length: 8
```

---

## Exercise 3: 변수 & 불변성 (Lesson 3)

**난이도**: ⭐

**문제 3.1**: let vs mut
```freelang
// 다음을 수행하세요:
// 1. counter 불변 변수를 0으로 초기화
// 2. counter를 10으로 변경 시도 (컴파일 에러 발생)
// 3. counter를 mut으로 선언해서 수정

// 정정된 코드를 제출하세요.
```

**문제 3.2**: 변수 섀도잉
```freelang
// 다음 프로그램을 작성하세요:
// 1. text = "  hello world  "로 초기화
// 2. text를 섀도잉해서 공백 제거 (trim)
// 3. text를 섀도잉해서 대문자 변환
// 4. 각 단계의 결과를 출력

// 예상 출력:
// "  hello world  "
// "hello world"
// "HELLO WORLD"
```

---

## Exercise 4: 함수 (Lesson 4)

**난이도**: ⭐⭐

**문제 4.1**: 기본 함수
```freelang
// 다음 함수들을 구현하세요:
// 1. is_even(n: i32) -> bool (짝수 판별)
// 2. factorial(n: i32) -> i32 (팩토리얼)
// 3. is_prime(n: i32) -> bool (소수 판별)

// 각 함수를 테스트하는 코드를 작성하세요.

// 테스트 케이스:
// is_even(4) = true
// is_even(7) = false
// factorial(5) = 120
// is_prime(17) = true
// is_prime(1) = false
```

**문제 4.2**: 고차 함수
```freelang
// 다음 함수를 구현하세요:
// apply(f: fn(i32) -> i32, x: i32) -> i32
// 이 함수는 f를 x에 적용해서 결과를 반환합니다.

// 사용 예:
// square(n: i32) -> i32 { n * n }
// apply(square, 5) // 25
// apply(|x| x * 2, 5) // 10 (클로저 사용)
```

---

## Exercise 5: 제어흐름 (Lesson 5)

**난이도**: ⭐⭐

**문제 5.1**: 구구단
```freelang
// 구구단 2단부터 9단까지 출력하는 프로그램
// (중첩 for 루프 사용)

// 예상 출력:
// 2 * 1 = 2
// 2 * 2 = 4
// ...
// 9 * 9 = 81
```

**문제 5.2**: FizzBuzz
```freelang
// 1부터 100까지 출력하는데:
// - 3의 배수면 "Fizz"
// - 5의 배수면 "Buzz"
// - 15의 배수면 "FizzBuzz"
// - 그 외에는 숫자

// 예상 출력:
// 1
// 2
// Fizz
// 4
// Buzz
// Fizz
// 7
// 8
// Fizz
// Buzz
// ...
```

**문제 5.3**: 판정
```freelang
// 점수를 입력받아 학점을 출력하세요:
// 90~100: A
// 80~89: B
// 70~79: C
// 60~69: D
// 60 미만: F

// if/else 버전과 match 버전 두 가지를 작성하세요.
```

---

## Exercise 6: 배열 & 벡터 (Lesson 6)

**난이도**: ⭐⭐

**문제 6.1**: 배열 합계
```freelang
// 정수 배열을 받아 합계, 평균, 최댓값, 최솟값을 반환하는
// 함수들을 작성하세요.

// fn sum(arr: &[i32]) -> i32
// fn average(arr: &[i32]) -> f64
// fn max(arr: &[i32]) -> i32
// fn min(arr: &[i32]) -> i32
```

**문제 6.2**: 배열 필터링
```freelang
// 1부터 20까지의 숫자 중:
// 1. 짝수만 필터링
// 2. 3의 배수만 필터링
// 3. 소수만 필터링

// 각 결과를 출력하세요.
```

**문제 6.3**: 배열 변환
```freelang
// [1, 2, 3, 4, 5] 배열에 대해:
// 1. 각 원소를 2배로 변환
// 2. 각 원소를 제곱으로 변환
// 3. 각 원소의 제곱근으로 변환 (f64 사용)

// 결과 배열을 출력하세요.
```

---

## Exercise 7: 딕셔너리 (Lesson 7)

**난이도**: ⭐⭐

**문제 7.1**: 단어 빈도
```freelang
// 문장을 입력받아 각 단어의 빈도를 출력하세요.

// 예제:
// 입력: "hello world hello freelang world hello"
// 출력:
// hello: 3
// world: 2
// freelang: 1
```

**문제 7.2**: 학생 점수
```freelang
// 학생 이름과 점수를 저장하는 딕셔너리를 만드세요.
// 1. 평균 점수 계산
// 2. 최고 점수와 학생명 찾기
// 3. 특정 점수 이상인 학생들 출력
```

**문제 7.3**: 중첩 딕셔너리
```freelang
// 도시별 날씨 정보를 저장하세요:
// cities: Dict<string, Dict<string, string>>
// 예: cities["Seoul"]["temperature"] = "20°C"

// 모든 도시와 날씨 정보를 출력하세요.
```

---

## Exercise 8: 구조체 (Lesson 8)

**난이도**: ⭐⭐

**문제 8.1**: 직사각형
```freelang
// Rectangle 구조체 정의:
// - width: i32
// - height: i32

// 메서드들:
// - area() -> i32 (넓이)
// - perimeter() -> i32 (둘레)
// - is_square() -> bool (정사각형 판별)

// 테스트 코드를 작성하세요.
```

**문제 8.2**: 은행 계좌
```freelang
// BankAccount 구조체:
// - account_number: string
// - balance: f64

// 메서드들:
// - deposit(amount: f64) (입금)
// - withdraw(amount: f64) -> bool (출금, 잔액 부족 시 false)
// - get_balance() -> f64 (잔액 조회)
```

**문제 8.3**: 학생 관리
```freelang
// Student 구조체를 정의하고
// 10명의 학생을 벡터에 저장하세요.

// 출력:
// 1. 모든 학생 목록
// 2. 특정 학생 검색
// 3. 점수 기준으로 정렬
```

---

## Exercise 9: 열거형 & 패턴 매칭 (Lesson 9)

**난이도**: ⭐⭐

**문제 9.1**: 주사위
```freelang
// Dice 열거형 (1~6)을 정의하세요.
// 주사위 값에 따라 메시지를 출력하세요.

// match 사용 예:
// 1 => println("한 개")
// 6 => println("여섯 개")
```

**문제 9.2**: Option 처리
```freelang
// 배열에서 특정 인덱스의 원소를 반환하는 함수:
// fn safe_get(arr: &[i32], index: i32) -> Option<i32>

// None 처리:
// - unwrap_or(default)
// - map & filter
// - if let 패턴
```

**문제 9.3**: Result 처리
```freelang
// 두 문자열을 정수로 파싱하고 합계를 계산하는 함수:
// fn parse_and_add(s1: &str, s2: &str) -> Result<i32, string>

// 에러 처리:
// - match
// - ? 연산자
// - unwrap_or_else
```

---

## Exercise 10: 모듈 & 임포트 (Lesson 10)

**난이도**: ⭐⭐

**문제 10.1**: 계산기 모듈
```freelang
// math 모듈 생성:
// pub fn add(a: i32, b: i32) -> i32
// pub fn subtract(a: i32, b: i32) -> i32
// pub fn multiply(a: i32, b: i32) -> i32
// pub fn divide(a: i32, b: i32) -> Option<i32>

// main.fl에서 사용하세요.
```

**문제 10.2**: 사용자 관리 시스템
```freelang
// 모듈 구조:
// src/main.fl
// src/user.fl (User 구조체 & 메서드)
// src/utils.fl (도우미 함수)

// 사용자 생성, 출력, 검색 기능 구현
```

**문제 10.3**: 게임 프로젝트
```freelang
// 모듈 구조:
// src/main.fl
// src/game.fl (Game 구조체)
// src/player.fl (Player 구조체)
// src/enemy.fl (Enemy 구조체)

// 간단한 전투 시뮬레이션 구현
```

---

## 종합 프로젝트

**난이도**: ⭐⭐⭐

### 프로젝트: 간단한 TODO 관리자

```
요구사항:
1. 항목 추가 (add)
2. 항목 완료 표시 (complete)
3. 모든 항목 출력 (list)
4. 항목 삭제 (remove)
5. 통계 (완료/미완료 개수)

데이터 구조:
- TodoItem struct
  - id: i32
  - title: string
  - completed: bool
  - created_at: string

모듈:
- todo.fl (TodoItem, add, remove, etc.)
- main.fl (CLI, 메뉴 구현)

테스트:
- 각 함수별 테스트
- 엣지 케이스 (빈 목록, 중복 등)
```

---

## 해답 및 피드백

**해답 제출 방법**:
1. 각 파일을 `exercise_N.fl`로 저장
2. 다음 명령어로 테스트:
   ```bash
   freelang check exercise_N.fl
   freelang run exercise_N.fl
   ```
3. 결과를 검토하고 개선하세요.

**자체 평가 체크리스트**:
- [ ] 코드가 컴파일되는가?
- [ ] 예상 결과가 출력되는가?
- [ ] 변수명이 명확한가?
- [ ] 주석이 있는가?
- [ ] 에지 케이스를 다루었는가?

---

**완성도**: ✅ 100% (400줄)
**총 문제**: 30개 이상
**예상 학습 시간**: ~20시간

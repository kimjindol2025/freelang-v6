# Stage 6: 기능 확장 로드맵

**시작 날짜**: 2026-03-09
**목표**: 자체호스팅을 위한 완전한 FreeLang 기능 구현
**최종 목표**: Stage 7 자체호스팅 컴파일러 구현 준비

---

## 현황

### 완료된 것 (Stage 1-5)
✅ Enum 타입 + Pattern Matching C 코드 생성
✅ 결정적 컴파일 증명 (MD5 해시 동일성)
✅ C 바이너리 실행 가능

### 필요한 기능 (Stage 6)
자체호스팅 컴파일러를 FreeLang으로 작성하려면:
- 문자열 처리 (토큰화, 파싱)
- I/O 함수 (파일 읽기, 쓰기)
- 배열/리스트 연산
- 문자 조작 함수
- 기본 데이터 구조

---

## Stage 6 기능별 구현 계획

### Phase 6-1: 문자열 처리 ⭐ (우선순위 1)

**필요성**: 컴파일러는 소스 코드를 문자열로 읽고 토큰화해야 함

#### 6-1-1: 문자열 기본 타입
```typescript
// FreeLang에 추가할 기능
fn string_length(s: string) -> i32
fn string_concat(a: string, b: string) -> string
fn string_char_at(s: string, idx: i32) -> i32  // ASCII 코드
fn string_substring(s: string, start: i32, len: i32) -> string
fn string_equals(a: string, b: string) -> bool
fn string_contains(s: string, substr: string) -> bool
fn string_index_of(s: string, substr: string) -> i32  // -1 if not found
```

**구현 위치**: `src/codegen/c-codegen.ts`
**C 런타임 추가**: 새로운 string 함수들

#### 6-1-2: 문자열 분할 & 토큰화
```typescript
fn string_split(s: string, delim: string) -> List<string>
fn string_trim(s: string) -> string
fn string_to_number(s: string) -> i32  // 또는 Option<i32>
fn number_to_string(n: i32) -> string
```

**핵심**: 이 함수들로 소스 코드를 토큰으로 변환 가능

#### 6-1-3: 문자 분류 함수
```typescript
fn is_digit(c: i32) -> bool      // ASCII 48-57
fn is_alpha(c: i32) -> bool      // ASCII 65-90, 97-122
fn is_whitespace(c: i32) -> bool // space, tab, newline
fn to_upper(c: i32) -> i32
fn to_lower(c: i32) -> i32
```

**테스트 파일**: `/tmp/string_test.fl`

---

### Phase 6-2: 배열 & 동적 메모리 ⭐⭐ (우선순위 2)

**필요성**: 토큰 리스트, 심볼 테이블 관리를 위해 필요

#### 6-2-1: 배열 기본 연산
```typescript
fn array_new<T>() -> List<T>            // 빈 배열 생성
fn array_push<T>(arr: List<T>, elem: T) -> List<T>  // 추가
fn array_get<T>(arr: List<T>, idx: i32) -> Option<T>
fn array_set<T>(arr: List<T>, idx: i32, elem: T) -> List<T>
fn array_length<T>(arr: List<T>) -> i32
fn array_slice<T>(arr: List<T>, start: i32, len: i32) -> List<T>
```

#### 6-2-2: 구현 방식
- **Option 1**: List<T> enum 사용 (현재 패턴 활용)
  ```
  enum List<T> { Nil, Cons(T, List<T>) }
  ```
- **Option 2**: 별도 Array<T> 구조체 (C 동적 배열)
  ```
  struct Array<T> { T* data; i32 length; i32 capacity; }
  ```

**권장**: Option 2 (더 효율적인 C 코드)

#### 6-2-3: 제네릭 지원
- 현재 코드제너는 제네릭 미지원
- List<T>에 대해 단일화(monomorphization) 구현 필요
- 각 T에 대해 별도의 List_T 생성

**테스트 파일**: `/tmp/array_test.fl`

---

### Phase 6-3: 파일 I/O ⭐⭐ (우선순위 2)

**필요성**: 소스 파일 읽기 필수

#### 6-3-1: 파일 읽기
```typescript
fn file_read(path: string) -> string     // 전체 파일 읽기
fn file_read_lines(path: string) -> List<string>  // 라인 단위
fn file_exists(path: string) -> bool
```

#### 6-3-2: 파일 쓰기
```typescript
fn file_write(path: string, content: string) -> bool
fn file_append(path: string, content: string) -> bool
```

#### 6-3-3: C 런타임
```c
// fl_runtime.h 추가
FILE* fl_file_open(const char *path, const char *mode);
char* fl_file_read_all(FILE *f);
void fl_file_write(FILE *f, const char *content);
void fl_file_close(FILE *f);
```

**테스트 파일**: `/tmp/io_test.fl`

---

### Phase 6-4: 구조체 & 레코드 (우선순위 3)

**필요성**: AST 노드, 심볼 테이블 표현

#### 6-4-1: 구조체 정의
```typescript
struct Position {
  line: i32,
  column: i32
}

struct Token {
  kind: string,
  value: string,
  pos: Position
}
```

#### 6-4-2: 구조체 생성 & 접근
```typescript
let tok = Token {
  kind: "Ident",
  value: "foo",
  pos: Position { line: 1, column: 5 }
}

let line = tok.pos.line
```

#### 6-4-3: 구조체 패턴 매칭
```typescript
match tok {
  Token { kind: "Ident", value: v } => ...
}
```

**테스트 파일**: `/tmp/struct_test.fl`

---

### Phase 6-5: 고급 제어 흐름 (우선순위 4)

#### 6-5-1: 루프 확장
```typescript
// while 루프 (현재 미지원)
fn tokenize(src: string) -> List<Token> {
  let tokens = array_new<Token>()
  let i = 0
  while (i < string_length(src)) {
    // 토큰화 로직
    i = i + 1
  }
  tokens
}
```

#### 6-5-2: break/continue
```typescript
while (condition) {
  if (should_stop) break
  if (should_skip) continue
}
```

**테스트 파일**: `/tmp/loop_test.fl`

---

## 구현 순서

```
Week 1 (Phase 6-1: String)
├─ 6-1-1: string_length, concat, char_at, substring
├─ 6-1-2: string_split, string_trim
├─ 6-1-3: 문자 분류 함수
└─ 테스트: string_test.fl 컴파일 & 실행

Week 2 (Phase 6-2: Arrays)
├─ 6-2-1: array_new, push, get, set, length
├─ 6-2-2: 제네릭 monomorphization
├─ 6-2-3: array_slice
└─ 테스트: array_test.fl 컴파일 & 실행

Week 3 (Phase 6-3: I/O)
├─ 6-3-1: file_read, file_read_lines
├─ 6-3-2: file_write, file_append
├─ 6-3-3: C 런타임 함수
└─ 테스트: io_test.fl 컴파일 & 실행

Week 4 (Phase 6-4/5)
├─ 6-4-1: struct 정의 & 생성
├─ 6-4-2: 필드 접근
├─ 6-4-3: struct 패턴 매칭
├─ 6-5-1: while 루프
└─ 6-5-2: break/continue
```

---

## 각 Phase별 예상 소요 시간

| Phase | 설명 | 구현 | 테스트 | 소계 |
|-------|------|------|--------|------|
| 6-1 | 문자열 | 2-3일 | 1일 | **3-4일** |
| 6-2 | 배열/제네릭 | 2-3일 | 1일 | **3-4일** |
| 6-3 | 파일 I/O | 1-2일 | 0.5일 | **2일** |
| 6-4 | 구조체 | 2일 | 1일 | **3일** |
| 6-5 | 루프 제어 | 1일 | 0.5일 | **1.5일** |

**예상 총 기간**: **12-16일** (약 2주)

---

## 평가 기준

각 Phase 완료 시 검증:

### String (6-1)
```bash
✅ string_test.fl 컴파일 성공
✅ C 바이너리 실행 성공
✅ 문자열 연산 결과 검증
✅ 3회 연속 동일 컴파일 (Stage 5)
```

### Arrays (6-2)
```bash
✅ array_test.fl 컴파일 성공
✅ 제네릭 monomorphization 작동
✅ 배열 연산 결과 검증
✅ 메모리 누수 없음 (간단한 정적 분석)
```

### I/O (6-3)
```bash
✅ io_test.fl 컴파일 성공
✅ 파일 읽기/쓰기 동작 확인
✅ 실제 파일 생성/수정 확인
```

### Struct (6-4)
```bash
✅ struct_test.fl 컴파일 성공
✅ 구조체 생성 & 접근 동작
✅ 패턴 매칭 동작
```

---

## Stage 7 자체호스팅 준비

Stage 6 완료 후, 다음 파일들로 자체호스팅 컴파일러 구현 가능:

```
freelang-compiler.fl (약 500-1000줄)
├─ Lexer: 소스코드 → 토큰 리스트
├─ Parser: 토큰 → AST
├─ TypeChecker: AST → 타입 검사
├─ Codegen: AST → C 코드
└─ main: 위 4개 통합

결과: freelang-compiler.fl --emit-c foo.fl > foo.c
```

---

## 기술적 주의사항

### 1. 제네릭 구현 (6-2)
- FreeLang의 `List<T>`, `Option<T>`는 현재 단일화됨
- 각 타입 T에 대해 독립적인 C 구조체 생성 필요
- 코드 크기 증가하지만 타입 안정성 확보

### 2. 문자열 구현 (6-1)
- C에서 문자열은 `char*` (NULL 종료)
- FreeLang 문자열은 길이를 저장해야 함
- 메모리 관리: 단순화를 위해 garbage collection 생략

### 3. 파일 I/O (6-3)
- C의 `fopen`, `fread`, `fwrite` 사용
- 에러 처리: `Option<string>` 반환

---

## 다음 액션 아이템

### 즉시 (오늘)
- [ ] 이 로드맵 검토 & 피드백
- [ ] Phase 6-1 (문자열) 구현 시작
- [ ] `string_test.fl` 작성

### 이번 주
- [ ] Phase 6-1 완료 및 검증
- [ ] Phase 6-2 시작

### 다음 주
- [ ] Phase 6-2, 6-3 완료
- [ ] 통합 테스트

### 3주차
- [ ] Phase 6-4, 6-5 완료
- [ ] Stage 7 자체호스팅 계획 수립

---

**목표**:
> 2026년 3월 말까지 Stage 6 완료
> 2026년 4월초 Stage 7 자체호스팅 컴파일러 1차 버전 완성

---

작성자: Claude (Haiku 4.5)
작성일: 2026-03-09
상태: 준비 완료

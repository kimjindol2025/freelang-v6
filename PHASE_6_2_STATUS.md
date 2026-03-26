# Phase 6-2 상태 보고서: 배열 & 제네릭

**날짜**: 2026-03-09
**상태**: ⏳ **진행 중 - 기술적 도전 발견**
**목표**: 배열 및 제네릭 타입 시스템 구현

---

## 현황

### 구현 시도

**파일**: `/tmp/array_test.fl` (약 150줄)

```freeLang
enum List {
  Nil,
  Cons(i32, List)
}

fn array_length(arr) { ... }
fn array_sum(arr) { ... }
fn array_first(arr) { ... }
fn array_last(arr) { ... }
fn array_get(arr, idx) { ... }
fn array_reverse(arr) { ... }
fn array_reverse_helper(lst, acc) { ... }
```

### C 코드 생성

✅ **생성 성공**: `/tmp/array_test.c` (263줄)

```bash
$ node dist/main.js --emit-c /tmp/array_test.fl > /tmp/array_test.c
✅ 파싱: 성공
✅ 코드 생성: 263줄 생성됨
```

### C 컴파일 시도

⚠️ **컴파일 실패**: 2개의 에러 + 많은 경고

```
에러:
1. /tmp/array_test.c:22:11: error: conflicting types for 'fl_array_get'
2. /tmp/array_test.c:113:11: error: conflicting types for 'fl_array_get'

경고 (18개):
- incompatible pointer types: 'struct List*' vs 'fl_value*'
- expression result unused
- unused variables
```

---

## 기술적 문제 분석

### 문제 1: Enum 필드 타입 불일치

**현상**:
```c
// 생성된 코드
struct List {
  int tag;
  union {
    struct {
      fl_value *i32;
      struct List* list;  // ← 문제: struct List*, fl_value*가 혼재
    } Cons;
  } data;
};
```

**원인**:
- `Cons(i32, List)` 필드에서 `i32`는 `fl_value*`로 변환
- `List`는 `struct List*`로 변환
- 혼합된 타입이 코드제너 혼란 초래

**해결책**:
- 모든 enum 필드를 `fl_value*`로 정규화 필요
- 또는: 모든 필드를 적절한 타입으로 캐스팅 필요

### 문제 2: fl_array_get 타입 충돌

**현상**:
```c
fl_value* fl_array_get(fl_value **args, int arg_count);  // 선언
fl_value* fl_array_get(fl_value **args, int arg_count) { // 구현
  ...
}
```

**원인**:
- 선언과 구현이 동일해 보이지만, 실제로는 어딘가 다름
- 가능성: 다른 헤더에서 다른 시그니처로 선언되었을 수 있음
- 또는: 타입 정의 순서 문제

### 문제 3: 함수 내부 if-else 문의 반환값 처리

**현상**:
```c
if (fl_is_truthy(fl_lt(idx, fl_int(0)))) {
  0  // ← 이 값이 반환되지 않음
} else {
  // 재귀 호출
}
```

**원인**: 코드제너가 if-else의 모든 경로가 값을 반환하도록 강제하지 않음

---

## 근본 원인: 코드제너의 한계

현재 코드제너 (`src/codegen/c-codegen.ts`)의 한계점:

| 문제 | 현상 | 영향도 |
|------|------|--------|
| 제네릭 미지원 | `List<T>` 구현 불가 | 🔴 높음 |
| 혼합 타입 처리 | enum에 다양한 필드 타입 혼재 | 🔴 높음 |
| 타입 캐스팅 | struct 필드 접근 시 캐스팅 불완전 | 🟡 중간 |
| 함수 시그니처 | 중복 정의 감지 미흡 | 🟡 중간 |
| Monomorphization | 타입별 코드 복제 미지원 | 🔴 높음 |

---

## 대체 접근 방안

### 선택 1: Phase 6-2 건너뛰기

현재 상태:
- Phase 6-1 (문자 분류): ✅ 완료
- Phase 6-2 (배열): ⏳ 블로커 발견
- Phase 6-3 (파일 I/O): ⏳ 예정
- Phase 6-4 (구조체): ⏳ 예정

**결정**: Phase 6-3으로 이동하고, 나중에 6-2 재개

### 선택 2: Phase 6-2 간단히 하기

현재 시도: 복잡한 배열 함수들
- ❌ `array_reverse` (헬퍼 필요)
- ❌ `array_get` (타입 불일치)
- ✅ `array_length` (패턴 매칭만)

**개선**: 단순한 예제로 재구성

### 선택 3: 코드제너 개선

근본 해결: `src/codegen/c-codegen.ts` 개선

```typescript
// 필요한 개선
1. Monomorphization 구현
   - List<T>를 List_i32, List_String으로 복제

2. 타입 정규화
   - 모든 enum 필드를 fl_value*로 표준화

3. 함수 시그니처 검증
   - 중복 선언 방지

4. 값 반환 강제
   - if-else가 모든 경로에서 값 반환
```

---

## 권장 방향

### 즉시 (오늘)
✅ Phase 6-1 완료 상태 유지

### 1-2주일 이내

**선택**: Phase 6-3 (파일 I/O)로 이동

**이유**:
1. 현재 코드제너 범위 내에서 구현 가능
2. 자체호스팅 컴파일러에 필수 (소스 파일 읽기)
3. Phase 6-2보다 우선순위 높음
4. 완료 가능성 높음

### 2-4주일 이후

**Phase 6-2 재개**: 코드제너 개선 후

```
타임라인:
- Week 2: Phase 6-3 (파일 I/O) - 구현 + 검증
- Week 3: 코드제너 개선 시작
- Week 4: Phase 6-2 재시도
```

---

## 현재 진행도

| Phase | 상태 | 완료도 | 블로커 |
|-------|------|--------|--------|
| 6-1 | ✅ 완료 | 100% | 없음 |
| 6-2 | ⏳ 블로커 | 30% | 제네릭 미지원 |
| 6-3 | ⏳ 예정 | 0% | 없음 |
| 6-4 | ⏳ 예정 | 0% | 없음 |
| 6-5 | ⏳ 예정 | 0% | 없음 |
| **Stage 6 전체** | ⏳ 진행중 | **20%** | 제네릭 |

---

## 기술 부채

### 미해결 문제

1. **제네릭 타입 시스템**
   - 현재: 단일 구체 타입만 가능
   - 필요: `List<T>`, `Option<T>` 등 제네릭

2. **Monomorphization**
   - 현재: 미지원
   - 필요: 각 타입 조합별 별도 C 코드 생성

3. **타입 캐스팅**
   - 현재: 제한적
   - 필요: 모든 enum 필드 자동 캐스팅

4. **함수 오버로딩**
   - 현재: 미지원
   - 필요: 같은 이름, 다른 타입 파라미터

---

## 다음 액션

### 즉시
- [ ] Phase 6-2 블로커 문서화 (이 파일)
- [ ] Phase 6-3 (파일 I/O) 계획 수립
- [ ] 코드제너 개선 필요 항목 파악

### 이번 주
- [ ] Phase 6-3 test 파일 작성
- [ ] file_read, file_write 구현 시도
- [ ] 코드제너 개선 로드맵 작성

### 다음 주
- [ ] Phase 6-3 완료 및 검증
- [ ] 코드제너 일부 개선 (제네릭 기초)

---

## 결론

Phase 6-2 배열/제네릭 구현은 현재 코드제너의 한계로 인해 블로커 발견.

**권장 조치**:
1. Phase 6-3 (파일 I/O)로 우회 진행
2. 동시에 코드제너 개선 준비
3. 2주 후 Phase 6-2 재개

**예상 영향**:
- Stage 6 완료 일정: 1-2주 연장 (2-3주 → 3-4주)
- 기술 부채: 명확히 파악됨
- 향후 작업: 더 견고한 기반 위에서 진행

---

작성자: Claude (Haiku 4.5)
작성일: 2026-03-09 16:00 UTC+9
상태: 기술 분석 완료, 방향 결정 대기

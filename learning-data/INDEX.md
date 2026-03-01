# 📑 학습 자료 인덱스

## 🎯 빠른 접근 가이드

### 주제별 학습
- [기초 제어 로직 (v3.x)](#기초-제어-로직)
- [함수와 소유권 (v4.x)](#함수와-소유권)
- [구조체와 컬렉션 (v5.x)](#구조체와-컬렉션)
- [트레이트와 다형성 (v6.x)](#트레이트와-다형성)
- [수명(Lifetime) (v7.x)](#수명lifetime)
- [테스팅 (v8.x)](#테스팅)
- [스마트 포인터 (v9.x)](#스마트-포인터)
- [동시성 (v10.x)](#동시성)
- [객체지향 패턴 (v11.x)](#객체지향-패턴)
- [Unsafe & FFI (v12.x)](#unsafe--ffi)
- [매크로 & 메타 (v13.x)](#매크로--메타프로그래밍)
- [컴파일러 구현 (v14.x)](#컴파일러-구현)
- [가상 머신 (v15.x)](#가상-머신)

---

## 기초 제어 로직

### v3.1: 조건부 정확성
- **Architecture**: `architecture/ARCHITECTURE_v3_1_CONDITIONAL_PRECISION.md`
- **Status**: `status/V3_1_IMPLEMENTATION_STATUS.md`
- **Examples**: `examples/v3_1_conditional_precision.fl`
- **Tests**: `tests/v3-1-conditional-precision.test.ts`

### v3.4: 패턴 매칭
- **Architecture**: `architecture/ARCHITECTURE_v3_4_PATTERN_MATCHING.md`
- **Status**: `status/V3_4_IMPLEMENTATION_STATUS.md`

### v3.5 ~ v3.9
- **v3.5**: Logic Integration
- **v3.6**: Guard Logic
- **v3.7**: State Machine
- **v3.8**: Iterator Mastery
- **v3.9**: Final Logic Validation

---

## 함수와 소유권

### v4.0: 함수 정의
- **Architecture**: `architecture/ARCHITECTURE_v4_0_FUNCTION_DEFINITION.md`
- **Status**: `status/V4_0_IMPLEMENTATION_STATUS.md`
- **평가**: A+

### v4.1: 소유권과 매개변수
- **Architecture**: `architecture/ARCHITECTURE_v4_1_OWNERSHIP_PARAMETERS.md`
- **Status**: `status/V4_1_IMPLEMENTATION_STATUS.md`

### v4.2: 참조와 차용(Borrowing)
- **Architecture**: `architecture/ARCHITECTURE_v4_2_REFERENCES_BORROWING.md`
- **Status**: `status/V4_2_DATA_FLOW_VALIDATION.md`

### v4.3: 슬라이스와 부분 참조
- **Architecture**: `architecture/ARCHITECTURE_v4_3_SLICES_PARTIAL_REFERENCES.md`
- **Status**: `status/V4_3_LOCAL_SCOPE_VALIDATION.md`

### v4.4: 모듈과 스코프
- **Architecture**: `architecture/ARCHITECTURE_v4_4_MODULES_SCOPE.md`
- **Status**: `status/V4_4_EARLY_RETURN_VALIDATION.md`

### v4.5: 크레이트와 생태계
- **Architecture**: `architecture/ARCHITECTURE_v4_5_CRATES_ECOSYSTEM.md`
- **Status**: `status/V4_5_FUNCTION_REGISTRY_VALIDATION.md`

---

## 구조체와 컬렉션

### v5.0: 구조체 정의
- **Architecture**: `architecture/ARCHITECTURE_v5_0_DEFINING_STRUCTS.md`
- **Status**: `status/V5_0_IMPLEMENTATION_STATUS.md`
- **평가**: A+

### v5.1: impl과 메서드
- **Architecture**: `architecture/ARCHITECTURE_v5_1_IMPL_METHODS.md`

### v5.2: 열거형과 패턴
- **Architecture**: `architecture/ARCHITECTURE_v5_2_ENUMS_PATTERNS.md`

### v5.3: Option과 Result
- **Architecture**: `architecture/ARCHITECTURE_v5_3_OPTION_RESULT.md`

### v5.4: 고급 열거형
- **Architecture**: `architecture/ARCHITECTURE_v5_4_ADVANCED_ENUMS.md`

### v5.5: 벡터와 컬렉션
- **Architecture**: `architecture/ARCHITECTURE_v5_5_VECTORS_COLLECTIONS.md`

### v5.6: 문자열과 텍스트
- **Architecture**: `architecture/ARCHITECTURE_v5_6_STRING_TEXT.md`

### v5.7: HashMap과 컬렉션
- **Architecture**: `architecture/ARCHITECTURE_v5_7_HASHMAP_COLLECTIONS.md`

### v5.8: 제네릭 설계
- **Architecture**:
  - `architecture/ARCHITECTURE_v5_8_1_GENERIC_DESIGN.md`
  - `architecture/ARCHITECTURE_v5_8_2_NEWTYPE_PATTERN.md`
  - `architecture/ARCHITECTURE_v5_8_DATA_MODELING.md`

### v5.9: 최종 프로젝트
- **Architecture**: `architecture/ARCHITECTURE_v5_9_GALAXY_NETWORK.md`
- **Status**: `status/V5_9_FINAL_EXAM_STATUS.md`
- **평가**: A+ 🏆

---

## 트레이트와 다형성

### v6.0: 트레이트 마스터 (10단계)
- **STEP 1 (4~5)**: `architecture/ARCHITECTURE_v6_0_TRAITS_MASTER_4_5.md`
- **STEP 2 (6~7)**: `architecture/ARCHITECTURE_v6_0_TRAITS_MASTER_6_7.md`
- **STEP 3 (8~9)**: `architecture/ARCHITECTURE_v6_0_TRAITS_MASTER_8_9.md`
- **STEP 4 (10)**: `architecture/ARCHITECTURE_v6_0_TRAITS_MASTER_10.md`
- **평가**: A+ 🏆

---

## 수명(Lifetime)

### v7.0: 수명 기초 (v7.0~v7.4)
- **v7.0**: Lifetimes - 기본 개념
- **v7.1**: 구조체 수명
- **v7.2**: Lifetime Elision
- **v7.3**: 'static 수명
- **v7.4**: 수명 통합
- **누적 평가**: 200/200 테스트 ✅

---

## 테스팅

### v8.0: 단위 테스트
- **Architecture**: `architecture/ARCHITECTURE_v8_0_TESTING_UNIT.md`
- **Status**: `status/V8_0_STEP_1_STATUS.md`

### v8.1: 통합 테스트
- **Architecture**: `architecture/ARCHITECTURE_v8_1_TESTING_INTEGRATION.md`
- **Status**: `status/V8_1_STEP_2_STATUS.md`

### v8.2: 문서화 테스트
- **Architecture**: `architecture/ARCHITECTURE_v8_2_TESTING_DOCUMENTATION.md`
- **Status**: `status/V8_2_STEP_3_STATUS.md`
- **누적 평가**: 150/150 ✅

---

## 스마트 포인터

### v9.0: Box<T>와 힙 할당
- **Architecture**: `architecture/ARCHITECTURE_v9_0_SMART_POINTERS_BOX.md`
- **Status**: `status/V9_0_STEP_1_STATUS.md`

### v9.1: Rc<T>와 참조 카운팅
- **Architecture**: `architecture/ARCHITECTURE_v9_1_SMART_POINTERS_RC.md`
- **Status**: `status/V9_1_STEP_2_STATUS.md`

### v9.2: RefCell<T>와 내부 가변성
- **Architecture**: `architecture/ARCHITECTURE_v9_2_SMART_POINTERS_REFCELL.md`
- **Status**: `status/V9_2_STEP_3_STATUS.md`

### v9.3: Rc<RefCell<T>> 조합
- **Architecture**: `architecture/ARCHITECTURE_v9_3_SMART_POINTERS_RC_REFCELL.md`
- **Status**: `status/V9_3_STEP_4_STATUS.md`

### v9.4: Weak<T>와 순환 참조 방지
- **Architecture**: `architecture/ARCHITECTURE_v9_4_SMART_POINTERS_WEAK.md`
- **Status**: `status/V9_4_STEP_4_STATUS.md`
- **누적 평가**: 250/250 테스트 ✅ 🏆

---

## 동시성

### v10.0: Fearless Concurrency와 스레드
- **Architecture**: `architecture/ARCHITECTURE_v10_0_FEARLESS_CONCURRENCY_THREADS.md`
- **Status**: `status/V10_0_STEP_1_STATUS.md`

### v10.1: 메시지 전달과 채널
- **Architecture**: `architecture/ARCHITECTURE_v10_1_MESSAGE_PASSING_CHANNELS.md`
- **Status**: `status/V10_1_STEP_2_STATUS.md`

### v10.2: 공유 상태와 Mutex
- **Architecture**: `architecture/ARCHITECTURE_v10_2_SHARED_STATE_MUTEX.md`
- **Status**: `status/V10_2_STEP_3_STATUS.md`

### v10.3: Send와 Sync 트레이트
- **Architecture**: `architecture/ARCHITECTURE_v10_3_SEND_SYNC_TRAITS.md`
- **Status**: `status/V10_3_STEP_4_STATUS.md`

### v10.4: 데드락 방지
- **Architecture**: `architecture/ARCHITECTURE_v10_4_DEADLOCK_PREVENTION.md`
- **Status**: `status/V10_4_STEP_5_STATUS.md`
- **누적 평가**: 250/250 테스트 ✅

---

## 객체지향 패턴

### v11.0: 트레이트 객체와 다형성
- **Architecture**: `architecture/ARCHITECTURE_v11_0_TRAIT_OBJECTS_POLYMORPHISM.md`
- **Status**: `status/V11_0_STEP_1_STATUS.md`

### v11.1: State 패턴
- **Architecture**: `architecture/ARCHITECTURE_v11_1_STATE_PATTERN_OO_DESIGN.md`
- **Status**: `status/V11_1_STEP_2_STATUS.md`

### v11.2: Type-State 패턴
- **Architecture**: `architecture/ARCHITECTURE_v11_2_TYPE_STATE_PATTERN.md`
- **Status**: `status/V11_2_STEP_3_STATUS.md`

### v11.3: 패턴 매칭 고급
- **Architecture**: `architecture/ARCHITECTURE_v11_3_PATTERN_MATCHING.md`
- **Status**: `status/V11_3_STEP_4_STATUS.md`

### v11.4: 플러그인 아키텍처
- **Architecture**: `architecture/ARCHITECTURE_v11_4_PLUGIN_ARCHITECTURE.md`
- **Status**: `status/V11_4_STEP_5_STATUS.md`
- **누적 평가**: 250/250 테스트 ✅

---

## Unsafe & FFI

### v12.0: Unsafe와 Raw Pointers
- **Architecture**: `architecture/ARCHITECTURE_v12_0_UNSAFE_RAW_POINTERS.md`
- **Status**: `status/V12_0_STEP_1_STATUS.md`

### v12.1: 데이터 레이아웃과 수동 메모리
- **Architecture**: `architecture/ARCHITECTURE_v12_1_DATA_LAYOUT_MANUAL_ALLOCATION.md`
- **Status**: `status/V12_1_STEP_2_STATUS.md`

### v12.2: FFI와 외부 함수
- **Architecture**: `architecture/ARCHITECTURE_v12_2_FFI_EXTERNAL_FUNCTIONS.md`
- **Status**: `status/V12_2_STEP_3_STATUS.md`
- **누적 평가**: 160/160 테스트 ✅

---

## 매크로 & 메타프로그래밍

### v13.0: 선언형 매크로
- **Architecture**: `architecture/ARCHITECTURE_v13_0_DECLARATIVE_MACROS.md`
- **Status**: `status/V13_0_STEP_1_STATUS.md`

### v13.0.2: 재귀형 매크로와 DSL
- **Architecture**: `architecture/ARCHITECTURE_v13_0_2_RECURSIVE_MACROS_DSL.md`
- **Status**: `status/V13_0_2_STEP_1_2_STATUS.md`

### v13.1: 절차형 매크로
- **Architecture**: `architecture/ARCHITECTURE_v13_1_PROCEDURAL_MACROS.md`
- **Status**: `status/V13_1_STEP_2_STATUS.md`

### v13.2: 속성 및 함수형 매크로
- **Architecture**: `architecture/ARCHITECTURE_v13_2_ATTRIBUTE_AND_FUNCTION_MACROS.md`
- **Status**: `status/V13_2_STEP_2_2_STATUS.md`
- **누적 평가**: 160/160 테스트 ✅

---

## 컴파일러 구현

### v14.0: Lexer (어휘 분석)
- **Architecture**: `architecture/ARCHITECTURE_v14_0_LEXER.md`
- **Status**: `status/V14_0_STEP_1_STATUS.md`
- **평가**: 40/40 테스트 ✅

### v14.1: Parser (구문 분석)
- **Architecture**: `architecture/ARCHITECTURE_v14_1_PARSER.md`
- **Status**: `status/V14_1_STEP_1_2_STATUS.md`
- **평가**: 40/40 테스트 ✅

### v14.2: Pratt Parsing (우선순위)
- **Architecture**: `architecture/ARCHITECTURE_v14_2_PRATT_PARSING.md`
- **Status**: `status/V14_2_STEP_1_2_2_STATUS.md`
- **평가**: 40/40 테스트 ✅

### v14.3: Evaluator (평가기)
- **Architecture**: `architecture/ARCHITECTURE_v14_3_EVALUATOR.md`
- **Status**: `status/V14_3_STEP_1_STATUS.md`
- **평가**: 50/50 테스트 ✅

### v14.4: Environment (환경)
- **Architecture**: `architecture/ARCHITECTURE_v14_4_ENVIRONMENT.md`
- **Status**: `status/V14_4_STEP_1_STATUS.md`
- **평가**: 50/50 테스트 ✅

### v14.5: Functions (함수와 클로저)
- **Architecture**: `architecture/ARCHITECTURE_v14_5_FUNCTIONS.md`
- **Status**: `status/V14_5_STEP_1_STATUS.md`
- **평가**: 50/50 테스트 ✅

### v14.6: Control Flow (제어 흐름)
- **Architecture**: `architecture/ARCHITECTURE_v14_6_CONTROL_FLOW.md`
- **Status**: `status/V14_6_STEP_1_STATUS.md`
- **평가**: 50/50 테스트 ✅
- **누적**: 320/320 테스트 ✅ 🏆

---

## 가상 머신

### v15.1: Compiler (컴파일러)
- **Architecture**: `architecture/ARCHITECTURE_v15_1_COMPILER_BYTECODE.md`
- **Status**: `status/V15_1_STEP_1_STATUS.md`
- **평가**: 50/50 테스트 ✅

### v15.2: Backfilling (조건부 분기와 백필링)
- **Architecture**: `architecture/ARCHITECTURE_v15_2_CONDITIONAL_BACKFILLING.md`
- **Status**: `status/V15_2_STEP_1_STATUS.md`
- **평가**: 50/50 테스트 ✅

### v15.3: Garbage Collection (메모리 관리)
- **Architecture**: `architecture/ARCHITECTURE_v15_3_GARBAGE_COLLECTION.md`
- **Status**: `status/V15_3_STEP_1_STATUS.md`
- **평가**: 50/50 테스트 ✅
- **누적**: 150/150 테스트 ✅

---

## 📊 전체 통계

| 카테고리 | 파일 수 | 테스트 |
|---------|--------|--------|
| Architecture | 69 | - |
| Status | 92 | - |
| Examples | 86 | - |
| Tests | 111 | - |
| **총합** | **358** | **2,070/2,070** |

---

## 🎯 추천 학습 순서

### 초급 (1-2주)
1. v3: 기초 제어 로직
2. v4: 함수와 소유권
3. v5: 구조체와 컬렉션

### 중급 (2-3주)
4. v6: 트레이트
5. v7: 수명(Lifetime)
6. v8: 테스팅

### 상급 (2-3주)
7. v9: 스마트 포인터
8. v10: 동시성
9. v11: 객체지향 패턴

### 전문 (2-3주)
10. v12: Unsafe & FFI
11. v13: 매크로
12. v14: 컴파일러
13. v15: 가상 머신

**총 소요 시간**: 8-12주
**완성 후**: 프로그래밍 언어 설계자 수준

---

## 🔍 파일 검색 팁

```bash
# 특정 버전 찾기
ls learning-data/architecture/ | grep v14

# 특정 주제 찾기
grep -r "Trait Objects" learning-data/architecture/

# 모든 테스트 찾기
find learning-data/tests -name "*.test.ts" | wc -l

# 예제 코드 찾기
ls learning-data/examples/ | grep v15
```

---

**마지막 업데이트**: 2026-02-23
**전체 완성도**: 100% ✅
**평가**: A+ 🏆

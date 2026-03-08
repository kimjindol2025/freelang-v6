# 🚨 Phase 3 통합 블로커: FreeLang 언어 제약 발견

**작성일**: 2026-03-08 16:00 UTC+9
**상태**: ⛔ **프로젝트 일시 중단**
**원인**: FreeLang 자체 언어 설계 미성숙

---

## 📋 상황 요약

### 시도한 작업
**목표**: Phase 3 (6개 .fl 파일) → 단일 main-integrated.fl로 통합

**결과**: ❌ **컴파일 실패**

```
에러: Expected Ident, got LBracket '[' at line 111
문제: enum Expr { Call(Expr, [Expr]) }
```

---

## 🔍 근본 원인 분석

### 1️⃣ **Enum 배열 타입 미지원**

**시도한 코드**:
```freelang
enum Expr {
  Number(f64),
  String(string),
  Ident(string),
  Call(Expr, [Expr]),        // ❌ 실패
  Array([Expr]),              // ❌ 실패
  If(Expr, [Stmt], [Stmt]),   // ❌ 실패
}
```

**현재 FreeLang 파서 상태**:
```
✅ Enum 기본 지원
✅ Enum 단순 타입 지원: Expr.Number(f64), Expr.String(string)
❌ Enum 배열 타입 미지원: Expr.Call(Expr, [Expr])
```

### 2️⃣ **Module/Import 시스템 부재**

**원래 계획**:
```freelang
import { tokenize } from "./lexer.fl"
import { parse } from "./parser.fl"
import { generate } from "./codegen.fl"
```

**실제 FreeLang**: 파일별 독립 컴파일만 가능

**해결책 시도**: 6개 파일을 1개로 병합
→ 하지만 enum 배열 타입 때문에 실패

### 3️⃣ **타입 어노테이션 제한**

FreeLang이 지원하는 타입:
```
✅ 기본: i32, f64, string, bool
✅ Struct: struct Token { ... }
✅ Enum (제한적): enum TokenKind { A, B, C(i32) }
❌ 배열: [T] as function parameter in enum
❌ Generic arrays: [T]
❌ Complex unions: enum Expr { Fn(string, [Param], ...) }
```

---

## 📊 자체호스팅 불가능성 증명

### Stage 1-2: ✅ 검증됨
```
TypeScript 컴파일러 → C 코드 → freec1 (Binary)
재컴파일 → C 코드 (동일) ✅
```

### Stage 3: ❌ 불가능
```
freec1이 Phase 3 (FreeLang 코드)를 컴파일하려면:
1. Enum 배열 타입 파싱 필요 ← FreeLang 미지원
2. Module/import 해석 필요 ← FreeLang 미지원
3. 복잡한 AST 구조 필요 ← FreeLang 타입 제약

→ 현재 FreeLang으로는 불가능
```

---

## 🛠️ 필요한 개선사항

### 우선순위 1: Enum 배열 타입 지원
```
예상 작업량: 2-3주
영향: Phase 3 통합 가능

변경 필요:
- parser.ts: enum 타입 파라미터 파싱 개선
- ir-generator.ts: [T] 타입 IR 생성
- codegen.ts: Enum 배열 타입 C 코드 생성
```

### 우선순위 2: Module/Import 시스템
```
예상 작업량: 3-4주
영향: 파일 분리 가능, 코드 가독성 향상

필요 항목:
- import { symbol } from "path"
- export fn func() ...
- 파일 디펜던시 추적
```

### 우선순위 3: Generic 배열 처리
```
예상 작업량: 1-2주
영향: 재사용 가능한 컴포넌트 작성 가능

예: fn map<T, U>(array: [T], fn: fn(T) -> U) -> [U]
```

---

## 💡 현재 옵션

### A. 언어 개선 (권장하지 않음)
```
작업량: 6-8주
효과: 완벽한 자체호스팅

단점:
- 원래 목표를 벗어남
- 언어 설계 문제는 깊음
- 테스트 작성 필요
```

### B. 간단한 AST 재설계 (1-2주)
```
개념:
struct Expr {
  kind: string,        // "number", "ident", "binary"
  value: string,
  left: Expr,         // 선택적
  right: Expr,        // 선택적
}

장점: 즉시 구현 가능
단점: 타입 안전성 감소, 성능 저하
```

### C. C에서 직접 구현 (2-3주)
```
Phase 3 컴파일러를 C로 직작성:
- lexer.c, parser.c, codegen.c
- FreeLang 자체호스팅 포기
- 대신 C 백엔드 최적화에 집중

장점: 빠름, 신뢰성 높음
단점: "자체호스팅" 목표 미달성
```

---

## 📈 현실적 평가

### 작업 로드맵 (실제 기간)

| Phase | 작업 | 기간 | 가능성 |
|-------|------|------|--------|
| **3** | 언어 개선 (배열 타입) | 2-3주 | ⚠️ 중간 |
| **3** | 모듈 시스템 추가 | 3-4주 | ⚠️ 중간 |
| **3** | Phase 3 재설계 & 컴파일 | 1-2주 | ✅ 높음 |
| **4** | Stage 3 검증 | 1주 | ✅ 높음 |
| **5** | 최적화 & 배포 | 2-3주 | ✅ 높음 |
| **합계** | 자체호스팅 완성 | **9-13주** | ⚠️ 중간 |

### 더 현실적인 경로 (추천)

```
1주: Phase 3 간단 버전 재설계 (C/Rust 컴파일러 참고)
1주: Stage 2-3 검증 (freec1 테스트)
2주: C 백엔드 최적화
----
총 4주 = 한 달이면 실용적 컴파일러 완성

❌ 완벽한 자체호스팅은 아니지만
✅ 충분히 성숙한 언어 구현
```

---

## 🎯 권장 결정

### ✅ 추천 경로: **옵션 B + C 혼합**

1. **즉시 (1주)**:
   - 간단한 AST 구조로 Phase 3 재설계
   - enum 배열 타입 대신 문자열 기반

2. **2주차**:
   - TypeScript 컴파일러로 간단 버전 컴파일
   - freec1 생성

3. **3-4주차**:
   - Stage 2-3 부트스트랩 검증
   - 필요시 C로 최적화 버전 작성

4. **5주차+**:
   - 실제 프로젝트에서 사용 가능한 수준
   - "자체호스팅" 대신 "실용적" 컴파일러로 마케팅

---

## ⚖️ 최종 판정

### "완벽한 자체호스팅"
- 🚫 불가능: FreeLang 언어 설계 문제
- ⏱️ 기간: 12-20주 (언어 개선 포함)
- 📊 우선순위: 낮음 (비즈니스 가치 대비 비용)

### "실용적 컴파일러"
- ✅ 가능: 4-6주
- 📊 우선순위: 높음 (사용자 만족도 대비 시간)

---

## 📝 결론

> **"우리는 언어 설계자가 아니라 컴파일러 엔지니어다"**

**자체호스팅에 집착하면 안 된다.**
더 중요한 것:
1. **사용 가능한 컴파일러** ← 현재 달성 가능
2. **성능** ← C 백엔드로 가능
3. **안정성** ← 테스트로 가능

---

**다음 회의**:
- [ ] 언어 개선 vs 간단한 설계 선택
- [ ] Phase 4 (최적화) 우선순위 결정
- [ ] 사용자 피드백 수집 (마케팅 팀)

**기록 작성**: 2026-03-08 16:00 UTC+9
**원칙**: 거짓보고 금지. 기록이 증명이다.

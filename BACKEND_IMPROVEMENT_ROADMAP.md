# TypeScript 백엔드 개선 로드맵

**목표**: Stage 3-5 부트스트랩 검증을 위한 IR 생성 능력 확장
**추정 기간**: 2-3주
**난이도**: 중상
**효과**: 완전한 자체호스팅 실현

---

## 📊 현재 상태 진단

### CCodegen 분석 (`src/codegen/c-codegen.ts`)

**현황**:
- ✅ 기본 타입 (number, string, bool, null): 완벽 지원
- ✅ 이항 연산자 (add, sub, mul 등): 완벽 지원
- ✅ 함수 호출 (call): 기본 지원
- ✅ 배열 조작: 기본 지원
- ❌ **Enum 정의**: 무시됨 (Line 180-183)
- ❌ **Enum 인스턴스 생성**: 미구현
- ❌ **Pattern Matching (match)**: 미구현
- ❌ **Recursive 구조체**: 미지원

### 문제의 근원

**monolith-compiler.fl에서 생성되는 FreeLang 코드**:
```freelang
enum ExprList {
  Cons(Expr, ExprList),
  Nil,
}

fn test() {
  let list = ExprList.Cons(expr, tail)  // ← C 코드로 변환되지 않음
  match list {
    ExprList.Cons(h, t) => ...          // ← Pattern matching 미지원
    ExprList.Nil => ...
  }
}
```

**생성되는 C 코드의 문제**:
```c
// ❌ ERROR: undefined identifier 'ExprList'
// ❌ ERROR: undefined variable 'head', 'tail'

ExprList_Cons(expr, tail);

case EXPR_LIST_CONS: {
  head;  // 변수가 선언되지 않음
  tail;
}
```

---

## 🗺️ 개선 계획 (Week-by-Week)

### Week 1: IR 명세 설계 및 Enum 메타데이터 생성

**목표**: Enum 타입에 대한 완전한 메타데이터 수집 및 C 구조체 생성

#### 1-1. AST 분석 강화

**파일**: `src/codegen/c-codegen.ts`

현재 코드:
```typescript
case "struct":
case "enum":
  // Phase 2에서는 메타데이터만 저장 (실행 시간에는 불필요)
  break;
```

**개선 사항**:
```typescript
private enumMetadata: Map<string, EnumInfo> = new Map();

interface EnumInfo {
  name: string;
  variants: EnumVariant[];
}

interface EnumVariant {
  name: string;
  fields: EnumField[];
}

interface EnumField {
  type: string;
  isRecursive: boolean;
}

case "enum": {
  const e = stmt as any;
  this.processEnum(e);
  break;
}

private processEnum(enumStmt: any) {
  const info: EnumInfo = {
    name: enumStmt.name,
    variants: enumStmt.variants.map((v: any) => ({
      name: v.name,
      fields: this.extractEnumFields(v.fields)
    }))
  };
  this.enumMetadata.set(enumStmt.name, info);
}
```

**소요 시간**: 1-2일

#### 1-2. C 구조체 생성

**목표**: Enum을 C의 tagged union으로 변환

```typescript
private genEnumDeclarations(): string[] {
  const decls: string[] = [];

  for (const [enumName, info] of this.enumMetadata) {
    // 1. Enum tag 타입 정의
    decls.push(`typedef enum {`);
    for (let i = 0; i < info.variants.length; i++) {
      decls.push(`  ${enumName.toUpperCase()}_${info.variants[i].name.toUpperCase()} = ${i},`);
    }
    decls.push(`} ${enumName}_Tag;`);

    // 2. Union 정의 (각 variant의 필드)
    decls.push(`typedef union {`);
    for (const variant of info.variants) {
      if (variant.fields.length > 0) {
        decls.push(`  struct {`);
        for (const field of variant.fields) {
          decls.push(`    fl_value *${field.type};`);
        }
        decls.push(`  } ${variant.name};`);
      }
    }
    decls.push(`} ${enumName}_Data;`);

    // 3. Tagged union 구조체
    decls.push(`typedef struct {`);
    decls.push(`  ${enumName}_Tag tag;`);
    decls.push(`  ${enumName}_Data data;`);
    decls.push(`} ${enumName};`);
  }

  return decls;
}
```

**생성 예시**:
```c
// ExprList enum
typedef enum {
  EXPR_LIST_CONS = 0,
  EXPR_LIST_NIL = 1,
} ExprList_Tag;

typedef union {
  struct {
    fl_value *head;
    fl_value *tail;
  } Cons;
} ExprList_Data;

typedef struct {
  ExprList_Tag tag;
  ExprList_Data data;
} ExprList;
```

**소요 시간**: 1-2일

### Week 2: Enum 인스턴스 생성 및 Pattern Matching

**목표**: Enum 값 생성, pattern matching 변수 할당

#### 2-1. Enum 생성자 함수 생성

**파일**: `src/codegen/c-codegen.ts`

```typescript
private genEnumConstructors(): string[] {
  const funcs: string[] = [];

  for (const [enumName, info] of this.enumMetadata) {
    for (const variant of info.variants) {
      if (variant.fields.length === 0) {
        // 필드가 없는 variant (예: Nil)
        funcs.push(`${enumName}* ${enumName}_${variant.name}() {`);
        funcs.push(`  ${enumName} *val = malloc(sizeof(${enumName}));`);
        funcs.push(`  val->tag = ${enumName.toUpperCase()}_${variant.name.toUpperCase()};`);
        funcs.push(`  return val;`);
        funcs.push(`}`);
      } else {
        // 필드가 있는 variant (예: Cons)
        const paramList = variant.fields
          .map((f, i) => `fl_value *${f.type}${i}`)
          .join(", ");

        funcs.push(`${enumName}* ${enumName}_${variant.name}(${paramList}) {`);
        funcs.push(`  ${enumName} *val = malloc(sizeof(${enumName}));`);
        funcs.push(`  val->tag = ${enumName.toUpperCase()}_${variant.name.toUpperCase()};`);

        for (let i = 0; i < variant.fields.length; i++) {
          funcs.push(`  val->data.${variant.name}.${variant.fields[i].type} = ${variant.fields[i].type}${i};`);
        }

        funcs.push(`  return val;`);
        funcs.push(`}`);
      }
    }
  }

  return funcs;
}
```

**생성 예시**:
```c
// ExprList.Cons 생성자
ExprList* ExprList_Cons(fl_value *head, fl_value *tail) {
  ExprList *val = malloc(sizeof(ExprList));
  val->tag = EXPR_LIST_CONS;
  val->data.Cons.head = head;
  val->data.Cons.tail = tail;
  return val;
}

// ExprList.Nil 생성자
ExprList* ExprList_Nil() {
  ExprList *val = malloc(sizeof(ExprList));
  val->tag = EXPR_LIST_NIL;
  return val;
}
```

**소요 시간**: 1-2일

#### 2-2. Enum 인스턴스 생성 표현식 처리

**파일**: `src/codegen/c-codegen.ts`에 추가

```typescript
case "enum_construct": {
  const e = expr as any;
  const enumName = e.enumName;
  const variantName = e.variantName;
  const args = e.args.map((a: Expr) => this.genExpr(a));

  if (args.length === 0) {
    return `${enumName}_${variantName}()`;
  } else {
    return `${enumName}_${variantName}(${args.join(", ")})`;
  }
}
```

**사용 예시** (FreeLang):
```freelang
let list = ExprList.Cons(head, tail)
```

**생성 C 코드**:
```c
ExprList *list = ExprList_Cons(head, tail);
```

**소요 시간**: 1일

#### 2-3. Pattern Matching 변수 할당

**파일**: `src/codegen/c-codegen.ts`에 추가

```typescript
case "match": {
  const s = stmt as any;
  const subject = this.genExpr(s.subject);
  const subjectType = this.inferType(s.subject);  // 새 메서드

  this.emit(`switch (${subject}->tag) {`);
  this.indent++;

  for (const arm of s.arms) {
    const pattern = arm.pattern;

    if (pattern.kind === "enum_pattern") {
      const enumInfo = this.enumMetadata.get(subjectType);
      const variant = enumInfo?.variants.find(v => v.name === pattern.variantName);

      this.emit(`case ${subjectType.toUpperCase()}_${pattern.variantName.toUpperCase()}: {`);
      this.indent++;

      // 변수 할당 (destructuring)
      if (pattern.bindings && variant) {
        for (let i = 0; i < pattern.bindings.length; i++) {
          const bindingName = pattern.bindings[i];
          const field = variant.fields[i];
          this.emit(`fl_value *${bindingName} = ${subject}->data.${pattern.variantName}.${field.type};`);
        }
      }

      // Body 생성
      for (const stmt of arm.body) {
        this.genStmt(stmt);
      }

      this.emit(`break;`);
      this.indent--;
      this.emit(`}`);
    }
  }

  this.indent--;
  this.emit(`}`);
  break;
}
```

**생성 예시** (C):
```c
switch (list->tag) {
  case EXPR_LIST_CONS: {
    fl_value *head = list->data.Cons.head;
    fl_value *tail = list->data.Cons.tail;
    // ... body statements
    break;
  }
  case EXPR_LIST_NIL: {
    // ... body statements
    break;
  }
}
```

**소요 시간**: 2-3일

### Week 3: 통합 테스트 및 최적화

**목표**: monolith-compiler.fl이 정상 C 코드를 생성하는지 검증

#### 3-1. 단위 테스트 작성

```typescript
// test/enum-codegen.test.ts
describe("Enum Code Generation", () => {
  test("should generate enum declaration", () => {
    const codegen = new CCodegen();
    const enumDef = {
      kind: "enum",
      name: "ExprList",
      variants: [
        { name: "Cons", fields: [{ type: "Expr", isRecursive: true }, { type: "ExprList", isRecursive: true }] },
        { name: "Nil", fields: [] }
      ]
    };

    const code = codegen.generateEnumDeclarations();
    expect(code).toContain("typedef enum {");
    expect(code).toContain("EXPR_LIST_CONS");
    expect(code).toContain("EXPR_LIST_NIL");
  });

  test("should generate constructor functions", () => {
    // ...
  });

  test("should handle pattern matching", () => {
    // ...
  });
});
```

**소요 시간**: 1일

#### 3-2. monolith-compiler.fl 테스트

```bash
# Stage 3 검증
$ node dist/main.js --emit-c src/phase3/monolith-compiler.fl > stage3.c
$ clang -O2 -o freec3 stage3.c -I runtime -lm
$ ./freec3
# ✅ 성공해야 함
```

**소요 시간**: 1-2일

#### 3-3. Stage 3-4 부트스트랩 검증

```bash
$ bash /tmp/stage34_bootstrap.sh
[Stage 3] Compile monolith-compiler.fl with freec2... ✅
[Stage 4] Compile with generated compiler... ✅
[Verify] Stage 3 C code == Stage 4 C code? ✅ YES
```

**소요 시간**: 1일

---

## 📋 구현 체크리스트

### Week 1: IR 명세 & 메타데이터

- [ ] `EnumInfo` 인터페이스 정의
- [ ] `processEnum()` 메서드 구현
- [ ] C 구조체 선언 생성 로직
- [ ] Enum 메타데이터 저장 구조
- [ ] 단위 테스트 (enum declaration)

### Week 2: 인스턴스 생성 & Pattern Matching

- [ ] 생성자 함수 생성 로직
- [ ] Enum 생성 표현식 처리 (c-codegen.ts)
- [ ] Pattern matching 문장 처리
- [ ] 변수 할당 (destructuring)
- [ ] 단위 테스트 (constructor functions)
- [ ] 단위 테스트 (pattern matching)

### Week 3: 통합 테스트

- [ ] monolith-compiler.fl Stage 3 컴파일
- [ ] 생성 C 코드 검증
- [ ] Stage 3-4 부트스트랩 실행
- [ ] Stage 5 동일성 검증
- [ ] 성능 최적화 (메모리 누수 체크)

---

## 🔧 관련 파일 수정 목록

| 파일 | 변경 사항 | 난이도 |
|------|---------|--------|
| `src/codegen/c-codegen.ts` | Enum/Match 처리 추가 (200-300줄) | 중상 |
| `src/ast.ts` | Enum 타입 정보 추가 | 낮음 |
| `src/parser.ts` | Enum 패턴 파싱 개선 (이미 구현됨) | 낮음 |
| `test/enum-codegen.test.ts` | 새 테스트 파일 생성 (100-200줄) | 낮음 |
| `BOOTSTRAP_STAGE34.md` | Stage 3-4 검증 가이드 | 낮음 |

---

## 📊 예상 영향

### 완성 시 달성

- ✅ Stage 3 컴파일러 작성 가능 (FreeLang으로 Phase 3 완성)
- ✅ Stage 4 재컴파일 검증 가능
- ✅ Stage 5 동일성 검증 가능
- ✅ **완전한 자체호스팅** 실현

### 코드 크기 변화

```
Before:
  src/codegen/c-codegen.ts: 281 줄

After:
  src/codegen/c-codegen.ts: 500-600 줄
  - Enum 메타데이터 처리: +100줄
  - 구조체 생성: +80줄
  - 생성자 함수: +80줄
  - Pattern matching: +100줄
  - 유틸리티: +40줄
```

---

## 🚀 다음 단계

1. **즉시** (오늘):
   - 이 로드맵 리뷰 및 승인
   - 개발 환경 준비 (테스트 프레임워크 확인)

2. **내일** (1일차):
   - Week 1 작업 시작
   - EnumInfo 구조 설계 완료

3. **1주일 후**:
   - Week 1 완료
   - monolith-compiler.fl이 기본적으로 컴파일 가능한 상태

4. **2주일 후**:
   - Week 2 완료
   - Stage 3 C 코드 생성 가능

5. **3주일 후**:
   - Week 3 완료
   - **Stage 3-5 부트스트랩 검증 완료**
   - **완전한 자체호스팅 달성**

---

## 💡 리스크 분석

| 리스크 | 영향도 | 완화 전략 |
|--------|--------|---------|
| Recursive enum 메모리 누수 | 높음 | 주기적 가비지 컬렉션 테스트 |
| Pattern matching 변수 스코프 | 중간 | 세심한 스코프 관리 테스트 |
| C 타입 시스템 호환성 | 중간 | TypeScript 타입 맵핑 검증 |
| 컴파일 시간 증가 | 낮음 | 최적화 단계에서 대응 |

---

## 🎯 성공 기준

### Stage 3-4 검증

```bash
$ bash BOOTSTRAP_STAGE34.sh
✅ Compile monolith-compiler.fl with freec2: PASS
✅ Generate C code from FreeLang compiler: PASS
✅ Compile generated C code: PASS
✅ Execute generated binary: PASS
✅ Output == 123: PASS
```

### Stage 5 동일성

```bash
$ bash BOOTSTRAP_STAGE5.sh
✅ Stage 3 C code == Stage 4 C code: PASS (0 바이트 차이)
✅ Stage 4 C code == Stage 5 C code: PASS (0 바이트 차이)
✅ 3회 반복 동일성 검증: PASS

🎉 완전한 자체호스팅 달성!
```

---

**마지막 문구**:

이 로드맵이 완성되면, FreeLang은 자신을 완벽하게 컴파일할 수 있는 **자기 참조적 시스템**이 됩니다.

> "컴파일러가 자신을 컴파일할 수 있다는 것은, 그 컴파일러가 자신을 완전히 신뢰할 수 있다는 증명입니다."

이것이 부트스트랩의 진정한 의미입니다.

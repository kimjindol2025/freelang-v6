# TypeScript 백엔드 진단: ExprList 미처리 문제 상세 분석

**진단일**: 2026-03-08 20:30 UTC+9
**문제**: ExprList enum의 undefined identifier 및 head/tail 오류
**원인**: C 코드 생성 로직의 3가지 결함

---

## 🔍 현재 TS 백엔드 상태 분석

### 파일 구조

```
src/codegen/c-codegen.ts (281줄)
├─ generate() - 프로그램 진입점
├─ genStmt() - 문장 처리
│  └─ case "enum": break; ❌ (무시함!)
│  └─ case "match": (없음) ❌
└─ genExpr() - 표현식 처리
   └─ case "match": (없음) ❌
   └─ enum 생성자: (없음) ❌
```

---

## 💥 3가지 근본 문제

### 문제 1: Enum 정의 무시

**파일**: `src/codegen/c-codegen.ts` Line 180-183

```typescript
case "struct":
case "enum":
  // Phase 2에서는 메타데이터만 저장 (실행 시간에는 불필요)
  break;
```

**문제점**:
- Enum 정의를 완전히 무시함
- C의 tagged union 구조체를 생성하지 않음
- Forward declaration 없음

**생성되어야 할 C 코드** (현재: 아무것도 생성 안 됨):

```c
// ❌ MISSING: Forward declaration
// typedef struct ExprList ExprList;

// ❌ MISSING: Tagged union definition
struct ExprList {
  int tag;  // 0=Cons, 1=Nil
  union {
    struct {
      struct Expr* head;      // ← undefined identifier 'ExprList'
      struct ExprList* tail;  // ← head/tail 변수 미선언
    } Cons;
  } data;
};
```

---

### 문제 2: Enum 생성자 미처리

**파일**: `src/codegen/c-codegen.ts` Line 191-279 (genExpr)

**현황**: enum 생성자를 처리하는 case가 없음

**예시 FreeLang 코드**:
```freelang
let list = ExprList.Cons(head, tail)
```

**현재 처리**:
- `ExprList.Cons(...)` → 호출 표현식으로 해석
- `ExprList` → identifier (genExpr 라인 205-206)
- `.Cons(...)` → member + call로 해석 (아마)
- **결과**: C 코드 생성 불완전 또는 오류

**생성되어야 할 C 코드**:
```c
ExprList* list = ExprList_Cons(head, tail);
```

**TS 백엔드 수정점**:
```typescript
// Line 243 "call" case 근처에 추가
case "member": {
  const e = expr as any;
  // 현재: fl_struct_get_field(...)
  // BUT: enum 생성자인 경우 다르게 처리해야 함

  // Example: ExprList.Cons
  // e.object: { kind: "ident", name: "ExprList" }
  // e.property: "Cons"
  // 뒤에 call이 따라오면 enum 생성자 호출
}
```

---

### 문제 3: Pattern Matching (Match) 미처리

**파일**: `src/codegen/c-codegen.ts` Line 191-279

**현황**: match 표현식을 처리하는 case가 없음

**예시 FreeLang 코드**:
```freelang
match list {
  Cons(head, tail) => { /* ... */ }
  Nil => { /* ... */ }
}
```

**현재 처리**:
- match를 genExpr에서 처리하지 않음
- undefined identifier 'Cons', 'Nil' 발생

**생성되어야 할 C 코드**:
```c
switch (list->tag) {
  case TAG_Cons: {
    Expr* head = list->data.Cons.head;          // ❌ MISSING
    ExprList* tail = list->data.Cons.tail;      // ❌ MISSING
    // ... body
    break;
  }
  case TAG_Nil: {
    // ... body
    break;
  }
}
```

**TS 백엔드 수정점**:
```typescript
// Line 243 "call" case 근처에 추가해야 할 것:
case "match": {
  const e = expr as any;
  const subject = this.genExpr(e.subject);

  // 1. subject 타입 파악 필요
  const subjectType = this.inferEnumType(e.subject);

  // 2. Enum 메타데이터 조회
  const enumInfo = this.enumMetadata.get(subjectType);

  // 3. switch/case 생성
  this.emit(`switch (${subject}->tag) {`);
  this.indent++;

  for (const arm of e.arms) {
    const pattern = arm.pattern;
    // pattern: ExprList.Cons(head, tail) 형태

    // 4. Pattern 분석
    const variantName = pattern.property; // "Cons"
    const bindingNames = pattern.args.map(a => a.name); // ["head", "tail"]

    // 5. 변수 선언
    this.emit(`case TAG_${variantName}: {`);
    this.indent++;

    for (let i = 0; i < bindingNames.length; i++) {
      const bindingName = bindingNames[i];
      const fieldName = enumInfo.variants[variantName].fields[i];
      this.emit(`fl_value *${bindingName} = ${subject}->data.${variantName}.${fieldName};`);
    }

    // 6. Body 생성
    for (const stmt of arm.body) {
      this.genStmt(stmt);
    }

    this.emit(`break;`);
    this.indent--;
    this.emit(`}`);
  }

  this.indent--;
  this.emit(`}`);
  break;
}
```

---

## 🛠️ 수정 순서 (가장 효율적)

### Phase 1: Enum 메타데이터 수집 (1-2일)

**목표**: 파서에서 enum 정보를 codegen이 사용할 수 있게 저장

**수정할 파일**: `src/codegen/c-codegen.ts`

```typescript
export class CCodegen {
  private lines: string[] = [];
  private indent = 0;
  private tempCounter = 0;

  // ✨ 추가: Enum 메타데이터 저장소
  private enumMetadata: Map<string, {
    name: string;
    variants: Map<string, {
      name: string;
      fields: string[];  // 필드 이름들
      isRecursive: boolean;  // 자기 참조 여부
    }>;
  }> = new Map();

  generate(program: Program): string {
    // 1단계: 모든 enum 정의를 먼저 처리하여 메타데이터 수집
    for (const stmt of program.stmts) {
      if (stmt.kind === "enum") {
        this.collectEnumMetadata(stmt as any);
      }
    }

    // 2단계: Forward declarations 생성
    const forwardDecls = this.generateForwardDeclarations();
    this.lines = forwardDecls;

    // 3단계: Enum struct 정의 생성
    const enumDefs = this.generateEnumDefinitions();
    this.lines.push(...enumDefs);

    // ... 나머지 코드
  }

  // ✨ 새 메서드: Enum 메타데이터 수집
  private collectEnumMetadata(stmt: any) {
    const enumName = stmt.name;
    const variants = new Map();

    for (const variant of stmt.variants) {
      variants.set(variant.name, {
        name: variant.name,
        fields: variant.fields || [],
        isRecursive: (variant.fields || []).some(f => f === enumName)
      });
    }

    this.enumMetadata.set(enumName, {
      name: enumName,
      variants
    });
  }

  // ✨ 새 메서드: Forward declarations 생성
  private generateForwardDeclarations(): string[] {
    const decls: string[] = [];

    for (const [enumName, info] of this.enumMetadata) {
      // typedef struct ExprList ExprList;
      decls.push(`typedef struct ${enumName} ${enumName};`);
    }

    return decls;
  }

  // ✨ 새 메서드: Enum struct 정의 생성
  private generateEnumDefinitions(): string[] {
    const defs: string[] = [];

    for (const [enumName, info] of this.enumMetadata) {
      // struct ExprList { ... }
      defs.push(`struct ${enumName} {`);
      defs.push(`  int tag;`);
      defs.push(`  union {`);

      for (const variant of info.variants.values()) {
        if (variant.fields.length > 0) {
          defs.push(`    struct {`);
          for (const field of variant.fields) {
            // 필드 타입이 enum인지 확인
            if (this.enumMetadata.has(field)) {
              defs.push(`      struct ${field}* ${field.toLowerCase()};`);
            } else {
              defs.push(`      fl_value *${field.toLowerCase()};`);
            }
          }
          defs.push(`    } ${variant.name};`);
        }
      }

      defs.push(`  } data;`);
      defs.push(`};`);
      defs.push(``);
    }

    return defs;
  }
}
```

**확인 사항**:
```bash
$ node dist/main.js --emit-c test.fl | head -30
# ✅ 이제 다음과 같이 나와야 함:
typedef struct ExprList ExprList;

struct ExprList {
  int tag;
  union {
    struct {
      fl_value *head;
      struct ExprList *tail;
    } Cons;
  } data;
};
```

---

### Phase 2: Enum 생성자 처리 (1일)

**목표**: `ExprList.Cons(head, tail)` 형태의 호출을 생성자 함수로 변환

**수정할 파일**: `src/codegen/c-codegen.ts` genExpr

```typescript
private genExpr(expr: Expr): string {
  switch (expr.kind) {
    // ... 기존 cases

    // ✨ 새 case: enum 생성자 호출
    case "call": {
      const e = expr as any;

      // enum 생성자 판별: callee가 member 표현식인 경우
      if (e.callee.kind === "member") {
        const memberExpr = e.callee;
        if (memberExpr.object.kind === "ident") {
          const enumName = memberExpr.object.name;
          const variantName = memberExpr.property;

          // 이것이 enum 생성자인지 확인
          if (this.enumMetadata.has(enumName)) {
            const args = e.args.map((a: Expr) => this.genExpr(a));
            return `${enumName}_${variantName}(${args.join(", ")})`;
          }
        }
      }

      // 일반 함수 호출 (기존 로직)
      const callee = this.genExpr(e.callee);
      const args = e.args.map((a: Expr) => this.genExpr(a));
      const tmp = this.tempVar();
      this.emit(`fl_value *${tmp}_args[] = {${args.join(", ")}};`);
      return `(${callee})(${tmp}_args, ${args.length})`;
    }

    // ... 나머지 cases
  }
}
```

**확인 사항**:
```freelang
let list = ExprList.Cons(head, tail)
```

```c
// ✅ 생성되는 C 코드:
ExprList* list = ExprList_Cons(head, tail);
```

---

### Phase 3: Pattern Matching 처리 (2-3일)

**목표**: `match list { Cons(head, tail) => ... }` 처리

**수정할 파일**: `src/codegen/c-codegen.ts` genExpr

```typescript
private genExpr(expr: Expr): string {
  switch (expr.kind) {
    // ... 기존 cases

    // ✨ 새 case: match 표현식
    case "match": {
      const e = expr as any;
      const subject = this.genExpr(e.subject);

      // subject의 타입 추론 필요
      const subjectType = this.inferExprType(e.subject);
      if (!this.enumMetadata.has(subjectType)) {
        throw new Error(`Unknown enum type in match: ${subjectType}`);
      }

      const enumInfo = this.enumMetadata.get(subjectType)!;
      const tmp = this.tempVar();

      this.emit(`({`);
      this.indent++;
      this.emit(`fl_value *${tmp} = fl_null();`);
      this.emit(`switch (${subject}->tag) {`);
      this.indent++;

      for (const arm of e.arms) {
        // pattern: ExprList.Cons(head, tail)
        const pattern = arm.pattern;

        // Pattern이 member + call 형태인지 확인
        if (!pattern || pattern.kind !== "call") {
          throw new Error(`Invalid match pattern`);
        }

        const variantCall = pattern.callee; // ExprList.Cons
        if (variantCall.kind !== "member") {
          throw new Error(`Invalid pattern in match`);
        }

        const variantName = variantCall.property;
        const tagValue = Array.from(enumInfo.variants.values())
          .findIndex(v => v.name === variantName);

        const bindingNames = pattern.args.map((a: any) => a.name);
        const variantInfo = enumInfo.variants.get(variantName);

        if (!variantInfo) {
          throw new Error(`Unknown variant: ${variantName}`);
        }

        // switch case 생성
        this.emit(`case ${tagValue}: {`);
        this.indent++;

        // 변수 바인딩 (destructuring)
        for (let i = 0; i < bindingNames.length; i++) {
          const bindingName = bindingNames[i];
          const fieldName = variantInfo.fields[i];

          this.emit(
            `fl_value *${bindingName} = ${subject}->data.${variantName}.${fieldName};`
          );
        }

        // Body 처리
        for (const stmt of arm.body) {
          if (stmt.kind === "expr") {
            const exprCode = this.genExpr((stmt as any).expr);
            this.emit(`${tmp} = ${exprCode};`);
          } else {
            this.genStmt(stmt);
          }
        }

        this.emit(`break;`);
        this.indent--;
        this.emit(`}`);
      }

      this.indent--;
      this.emit(`}`);
      this.indent--;
      this.emit(`})`);

      return tmp;
    }

    // ... 나머지 cases
  }
}

// ✨ 새 헬퍼 메서드: 표현식의 타입 추론
private inferExprType(expr: Expr): string {
  if (expr.kind === "ident") {
    // 변수의 타입을 추론해야 함 (현재는 어렵지만, enum이라면 해당 enum명)
    return (expr as any).name;
  }

  if (expr.kind === "call") {
    // ExprList.Cons(...) → ExprList
    const e = expr as any;
    if (e.callee.kind === "member" && e.callee.object.kind === "ident") {
      return e.callee.object.name;
    }
  }

  throw new Error(`Cannot infer type of expression`);
}
```

**확인 사항**:
```freelang
match list {
  Cons(head, tail) => print(head)
  Nil => print("empty")
}
```

```c
// ✅ 생성되는 C 코드:
({
  fl_value *__tmp0 = fl_null();
  switch (list->tag) {
    case 0: {
      fl_value *head = list->data.Cons.head;
      fl_value *tail = list->data.Cons.tail;
      fl_print(head);
      break;
    }
    case 1: {
      fl_print(fl_string("empty"));
      break;
    }
  }
  __tmp0;
})
```

---

## ✅ 최종 수정 체크리스트

### Phase 1: Enum 메타데이터 (1-2일)
- [ ] `enumMetadata` 필드 추가
- [ ] `collectEnumMetadata()` 메서드 구현
- [ ] `generateForwardDeclarations()` 메서드 구현
- [ ] `generateEnumDefinitions()` 메서드 구현
- [ ] `generate()` 메서드 수정 (forward decl + enum def 생성)
- [ ] 테스트: `enum ExprList { Cons(Expr, ExprList), Nil }` 처리 확인

### Phase 2: Enum 생성자 (1일)
- [ ] `genExpr()` case "call" 수정
- [ ] enum 생성자 판별 로직
- [ ] `ExprList.Cons(...)` → `ExprList_Cons(...)` 변환
- [ ] 테스트: `let list = ExprList.Cons(head, tail)` 처리 확인

### Phase 3: Pattern Matching (2-3일)
- [ ] `genExpr()` case "match" 추가
- [ ] `inferExprType()` 메서드 구현
- [ ] Pattern 분석 로직
- [ ] 변수 바인딩 (destructuring) 구현
- [ ] switch/case 생성 로직
- [ ] 테스트: `match list { Cons(h, t) => ... }` 처리 확인

---

## 🎯 검증 시점

각 Phase가 완료되면:

```bash
# Phase 1 완료 후
$ node dist/main.js --emit-c monolith-compiler.fl | grep -A 10 "struct ExprList"
# ✅ struct ExprList { ... } 정의 보여야 함

# Phase 2 완료 후
$ node dist/main.js --emit-c monolith-compiler.fl | grep "ExprList_Cons"
# ✅ ExprList_Cons(...) 함수 호출 보여야 함

# Phase 3 완료 후
$ node dist/main.js --emit-c monolith-compiler.fl | grep -A 5 "switch.*tag"
# ✅ switch statement + 변수 바인딩 보여야 함
```

---

## 📊 수정 난이도 평가

| Phase | 난이도 | 코드량 | 테스트 난이도 |
|-------|--------|--------|--------------|
| Phase 1 | 낮음 | 50-80줄 | 낮음 |
| Phase 2 | 낮음 | 20-30줄 | 낮음 |
| Phase 3 | 중간 | 100-150줄 | 중간 |
| **총합** | **중간** | **170-260줄** | **중간** |

---

## 🚀 수정 후 기대 효과

```
수정 전:
monolith-compiler.fl → C 코드 (컴파일 실패)
  ❌ undefined identifier 'ExprList'
  ❌ undefined variable 'head', 'tail'

수정 후:
monolith-compiler.fl → C 코드 (컴파일 성공)
  ✅ struct ExprList 정의
  ✅ 변수 바인딩 완료
  ✅ Stage 3 바이너리 생성 가능
```

---

**다음 단계**: Phase 1 수정을 시작하시겠습니까? 아니면 추가 질문이 있으신가요?

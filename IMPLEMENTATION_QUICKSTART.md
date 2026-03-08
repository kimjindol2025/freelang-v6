# FreeLang 자체호스팅 구현 빠른 시작 가이드

**대상**: 개발자 (TS 코드 수정 가능)
**목표**: Stage 3-5 부트스트랩 완성
**소요**: 2-3주

---

## 📋 현재 상태

```
✅ Stage 1-2: 검증 완료 (123 = 123)
❌ Stage 3-5: 미실행
   └─ 블로커: TypeScript 백엔드가 recursive enum 미처리
```

---

## 🚀 7단계 로드맵

### Step 1: 개발 환경 준비 (30분)

```bash
# 1. 최신 코드 풀다운
git pull origin master

# 2. TypeScript 컴파일러 빌드
cd freelang-v6
npm run build

# 3. 현재 상태 확인
node dist/main.js --emit-c src/phase3/monolith-compiler.fl > /tmp/test.c 2>&1

# 4. C 컴파일 시도 (오류 확인)
clang -I freelang-c-final/runtime /tmp/test.c -o /tmp/test_binary 2>&1 | head -20
```

**예상 오류**:
```
/tmp/test.c:XX: error: use of undeclared identifier 'ExprList'
/tmp/test.c:YY: error: use of undeclared identifier 'head'
```

---

### Step 2: TS 백엔드 Phase 1 수정 (1-2일)

**목표**: Enum 메타데이터 & Forward declarations 생성

**수정 파일**: `src/codegen/c-codegen.ts`

#### 2-1. 메타데이터 저장소 추가

**위치**: CCodegen 클래스 필드 (Line 8 근처)

```typescript
export class CCodegen {
  private lines: string[] = [];
  private indent = 0;
  private tempCounter = 0;

  // ✨ 추가:
  private enumMetadata: Map<string, {
    name: string;
    variants: Map<string, {
      name: string;
      fields: string[];
      isRecursive: boolean;
    }>;
  }> = new Map();
```

#### 2-2. generate() 메서드 수정

**위치**: Line 10-48

```typescript
generate(program: Program): string {
  // ✨ 추가: 먼저 enum 메타데이터 수집
  for (const stmt of program.stmts) {
    if (stmt.kind === "enum") {
      this.collectEnumMetadata(stmt as any);
    }
  }

  // 헤더
  this.emitLine('#include "fl_runtime.h"');
  this.emitLine("");

  // ✨ 추가: Forward declarations
  for (const enumName of this.enumMetadata.keys()) {
    this.emitLine(`typedef struct ${enumName} ${enumName};`);
  }
  this.emitLine("");

  // ✨ 추가: Enum struct 정의
  for (const [enumName, info] of this.enumMetadata) {
    this.emitLine(`struct ${enumName} {`);
    this.emitLine(`  int tag;`);
    this.emitLine(`  union {`);

    for (const variant of info.variants.values()) {
      if (variant.fields.length > 0) {
        this.emitLine(`    struct {`);
        for (const field of variant.fields) {
          if (this.enumMetadata.has(field)) {
            this.emitLine(`      struct ${field}* ${field.toLowerCase()};`);
          } else {
            this.emitLine(`      fl_value *${field.toLowerCase()};`);
          }
        }
        this.emitLine(`    } ${variant.name};`);
      }
    }

    this.emitLine(`  } data;`);
    this.emitLine(`};`);
    this.emitLine("");
  }

  // 함수 선언들 (기존 코드)
  const topLevelStmts = [];
  // ... (기존 코드 유지)
}
```

#### 2-3. 새 메서드 추가

**위치**: genStmt() 메서드 끝 (Line 188 근처)

```typescript
// ✨ 새 메서드: Enum 메타데이터 수집
private collectEnumMetadata(stmt: any) {
  const enumName = stmt.name;
  const variants = new Map();

  for (const variant of stmt.variants) {
    variants.set(variant.name, {
      name: variant.name,
      fields: variant.fields || [],
      isRecursive: (variant.fields || []).includes(enumName)
    });
  }

  this.enumMetadata.set(enumName, {
    name: enumName,
    variants
  });
}
```

#### 2-4. enum 문장 처리 수정

**위치**: genStmt() Line 180-183

```typescript
// Before:
case "struct":
case "enum":
  // Phase 2에서는 메타데이터만 저장 (실행 시간에는 불필요)
  break;

// After:
case "struct":
  // Struct는 현재 처리 불필요
  break;

case "enum":
  // enum은 generate()의 처음 단계에서 이미 처리됨
  // 여기서는 skip
  break;
```

#### 2-5. 검증

```bash
# 재빌드
npm run build

# 테스트
node dist/main.js --emit-c src/phase3/monolith-compiler.fl 2>&1 | head -50

# ✅ 기대: typedef struct ExprList ExprList; 보여야 함
# ✅ 기대: struct ExprList { ... } 정의 보여야 함
```

---

### Step 3: TS 백엔드 Phase 2 수정 (1일)

**목표**: Enum 생성자 호출 처리

**수정 파일**: `src/codegen/c-codegen.ts` genExpr() 메서드

#### 3-1. case "call" 수정

**위치**: genExpr() Line 243-250

```typescript
// Before:
case "call": {
  const e = expr as any;
  const callee = this.genExpr(e.callee);
  const args = e.args.map((a: Expr) => this.genExpr(a));
  const tmp = this.tempVar();
  this.emit(`fl_value *${tmp}_args[] = {${args.join(", ")}};`);
  return `(${callee})(${tmp}_args, ${args.length})`;
}

// After:
case "call": {
  const e = expr as any;

  // ✨ Enum 생성자 판별
  if (e.callee.kind === "member" && e.callee.object.kind === "ident") {
    const enumName = e.callee.object.name;
    const variantName = e.callee.property;

    if (this.enumMetadata.has(enumName)) {
      // Enum 생성자 호출
      const args = e.args.map((a: Expr) => this.genExpr(a));
      return `${enumName}_${variantName}(${args.join(", ")})`;
    }
  }

  // 일반 함수 호출 (기존 로직)
  const callee = this.genExpr(e.callee);
  const args = e.args.map((a: Expr) => this.genExpr(a));
  const tmp = this.tempVar();
  this.emit(`fl_value *${tmp}_args[] = {${args.join(", ")}};`);
  return `(${callee})(${tmp}_args, ${args.length})`;
}
```

#### 3-2. 검증

```bash
npm run build
node dist/main.js --emit-c src/phase3/monolith-compiler.fl 2>&1 | \
  grep "ExprList_Cons\|ExprList_Nil"

# ✅ 기대: ExprList_Cons(...), ExprList_Nil() 호출 보여야 함
```

---

### Step 4: TS 백엔드 Phase 3 수정 (2-3일)

**목표**: Pattern matching (match expression) 처리

**수정 파일**: `src/codegen/c-codegen.ts` genExpr() 메서드

#### 4-1. match case 추가

**위치**: genExpr() 메서드의 switch 문 내 (default 앞)

```typescript
case "match": {
  const e = expr as any;
  const subject = this.genExpr(e.subject);

  // ✨ 타입 추론 (identifier의 이름에서 enum 이름 추출)
  let subjectType: string | null = null;
  if (e.subject.kind === "ident") {
    subjectType = (e.subject as any).name;
    // 실제로는 타입 테이블에서 조회해야 함
    // 임시: let 문장에서 추론하거나, enum 생성자 호출 패턴에서 추론
  } else if (e.subject.kind === "call" && (e.subject as any).callee.kind === "member") {
    const call = e.subject as any;
    subjectType = call.callee.object.name;
  }

  if (!subjectType || !this.enumMetadata.has(subjectType)) {
    throw new Error(`Cannot infer enum type in match expression`);
  }

  const enumInfo = this.enumMetadata.get(subjectType)!;
  const tmp = this.tempVar();

  this.emit(`({`);
  this.indent++;
  this.emit(`fl_value *${tmp} = fl_null();`);
  this.emit(`switch (${subject}->tag) {`);
  this.indent++;

  for (const arm of e.arms) {
    const pattern = arm.pattern;

    // ✨ Pattern 분석
    if (!pattern || pattern.kind !== "call") {
      throw new Error(`Invalid pattern in match`);
    }

    const variantCall = pattern.callee;
    if (variantCall.kind !== "member" || !variantCall.object) {
      throw new Error(`Invalid pattern syntax`);
    }

    const variantName = variantCall.property;
    const bindingNames = (pattern as any).args.map((a: any) => a.name);
    const variantInfo = enumInfo.variants.get(variantName);

    if (!variantInfo) {
      throw new Error(`Unknown variant: ${variantName}`);
    }

    // ✨ switch case 생성
    const tagValue = Array.from(enumInfo.variants.keys()).indexOf(variantName);
    this.emit(`case ${tagValue}: {`);
    this.indent++;

    // ✨ 변수 바인딩 (destructuring)
    for (let i = 0; i < bindingNames.length; i++) {
      const bindingName = bindingNames[i];
      const fieldName = variantInfo.fields[i];
      this.emit(
        `fl_value *${bindingName} = ${subject}->data.${variantName}.${fieldName};`
      );
    }

    // ✨ Body 처리 (표현식 또는 문장)
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
```

#### 4-2. 검증

```bash
npm run build

# 생성된 C 코드에서 match 처리 확인
node dist/main.js --emit-c src/phase3/monolith-compiler.fl 2>&1 | \
  grep -A 10 "switch.*tag"

# ✅ 기대: switch 문과 변수 바인딩 보여야 함
# ✅ 기대: case 0:, case 1: 같은 태그 처리 보여야 함
```

---

### Step 5: 전체 C 코드 생성 검증 (1일)

```bash
# 전체 mono 컴파일
node dist/main.js --emit-c src/phase3/monolith-compiler.fl > /tmp/stage3.c 2>&1

# C 코드 컴파일 (clang)
clang -I freelang-c-final/runtime /tmp/stage3.c \
  freelang-c-final/runtime/fl_runtime.c \
  -o /tmp/freec3 -lm

# 실행 (간단한 테스트)
echo 'print(123)' > /tmp/test.fl
/tmp/freec3 < /tmp/test.fl
# ✅ 기대: 123 출력
```

---

### Step 6: Stage 3-4 부트스트랩 검증 (1-2일)

#### 6-1. 부트스트랩 스크립트 작성

**파일**: `/tmp/stage34_bootstrap.sh`

```bash
#!/bin/bash

set -e

FREELANG_DIR="/data/data/com.termux/files/home/freelang-v6"
RUNTIME_DIR="${FREELANG_DIR}/freelang-c-final/runtime"

echo "=== Stage 3-4 Bootstrap Verification ==="
echo ""

# Stage 3: TypeScript 컴파일러로 monolith 컴파일
echo "[Stage 3] Compile monolith-compiler.fl with TypeScript..."
node ${FREELANG_DIR}/dist/main.js --emit-c ${FREELANG_DIR}/src/phase3/monolith-compiler.fl \
  > /tmp/stage3.c 2>&1

if [ $? -ne 0 ]; then
  echo "❌ Stage 3 C code generation failed"
  cat /tmp/stage3.c | head -20
  exit 1
fi
echo "✅ Stage 3: C code generated ($(wc -l < /tmp/stage3.c) lines)"

# 컴파일
echo "[Stage 3] Compiling stage3.c..."
clang -O2 -I${RUNTIME_DIR} /tmp/stage3.c ${RUNTIME_DIR}/fl_runtime.c \
  -o /tmp/freec3 -lm 2>&1

if [ $? -ne 0 ]; then
  echo "❌ Stage 3 compilation failed"
  exit 1
fi
echo "✅ Stage 3: Binary compiled (freec3)"

# Stage 4: 생성된 컴파일러로 재컴파일
echo "[Stage 4] Recompile monolith-compiler.fl with generated compiler..."
/tmp/freec3 --emit-c ${FREELANG_DIR}/src/phase3/monolith-compiler.fl \
  > /tmp/stage4.c 2>&1

if [ $? -ne 0 ]; then
  echo "❌ Stage 4 C code generation failed"
  exit 1
fi
echo "✅ Stage 4: C code generated ($(wc -l < /tmp/stage4.c) lines)"

# 컴파일
echo "[Stage 4] Compiling stage4.c..."
clang -O2 -I${RUNTIME_DIR} /tmp/stage4.c ${RUNTIME_DIR}/fl_runtime.c \
  -o /tmp/freec4 -lm 2>&1

if [ $? -ne 0 ]; then
  echo "❌ Stage 4 compilation failed"
  exit 1
fi
echo "✅ Stage 4: Binary compiled (freec4)"

# Verification: C code 동일성
echo ""
echo "=== Verification ==="
if diff /tmp/stage3.c /tmp/stage4.c > /dev/null 2>&1; then
  echo "✅ C code identical: stage3.c == stage4.c"
else
  echo "⚠️ C code differs"
  diff /tmp/stage3.c /tmp/stage4.c | head -20
fi

echo ""
echo "🎉 Stage 3-4 Bootstrap Verification Complete!"
```

#### 6-2. 실행

```bash
chmod +x /tmp/stage34_bootstrap.sh
bash /tmp/stage34_bootstrap.sh
```

**기대 결과**:
```
✅ Stage 3: C code generated (XXX lines)
✅ Stage 3: Binary compiled (freec3)
✅ Stage 4: C code generated (XXX lines)
✅ Stage 4: Binary compiled (freec4)
✅ C code identical: stage3.c == stage4.c
🎉 Stage 3-4 Bootstrap Verification Complete!
```

---

### Step 7: Stage 5 & 최종 검증 (1일)

```bash
# Stage 5: 3회 반복
for i in 1 2 3; do
  echo "=== Stage 5 Iteration $i ==="
  /tmp/freec$((i+2)) --emit-c ${FREELANG_DIR}/src/phase3/monolith-compiler.fl \
    > /tmp/stage5_$i.c 2>&1
done

# 비교
echo ""
echo "=== Stage 5 Verification ==="
if diff /tmp/stage5_1.c /tmp/stage5_2.c > /dev/null && \
   diff /tmp/stage5_2.c /tmp/stage5_3.c > /dev/null; then
  echo "✅ All 3 iterations produced identical C code"
  echo ""
  echo "🎉🎉🎉 COMPLETE BOOTSTRAP ACHIEVED! 🎉🎉🎉"
else
  echo "❌ Iterations differ"
  exit 1
fi
```

---

## 📊 진행도 추적

```
Week 1:
  [ ] Step 1: 개발 환경 준비 (30분)
  [ ] Step 2: Phase 1 수정 (1-2일)
  [ ] Step 3: Phase 2 수정 (1일)

Week 2:
  [ ] Step 4: Phase 3 수정 (2-3일)
  [ ] Step 5: 전체 검증 (1일)

Week 3:
  [ ] Step 6: Stage 3-4 검증 (1-2일)
  [ ] Step 7: Stage 5 검증 (1일)
```

---

## 🎯 성공 기준

### 필수 (Must-Have)
- [ ] Stage 3 C 코드 생성 성공 (C 컴파일 가능)
- [ ] Stage 4 C 코드 == Stage 3 C 코드
- [ ] Stage 5 C 코드 == Stage 4 C 코드 == Stage 3 C 코드

### 추천 (Nice-to-Have)
- [ ] GOGS 커밋 메시지로 각 단계 기록
- [ ] GitHub Release에 마일스톤 공개
- [ ] 블로그 포스트 "Stage 3-5 완성" 발행

---

## 💬 FAQ

**Q: Phase 1-3 중 어디부터 시작해야 하나?**
A: Phase 1부터 순서대로. Phase 1이 메타데이터이므로 Phase 2-3이 의존합니다.

**Q: 오류가 나면?**
A: `TYPESCRIPT_BACKEND_DIAGNOSIS.md`의 "검증 시점" 섹션을 확인하세요.

**Q: 얼마나 걸릴까?**
A: 2-3주 (주 40시간 작업 기준, 병렬 작업 가능).

**Q: 다른 개발자가 도와줄 수 있을까?**
A: 네. Phase 2와 Phase 3은 독립적으로 진행 가능하므로 병렬화 가능합니다.

---

## 📞 참고 문서

| 문서 | 용도 |
|------|------|
| [TYPESCRIPT_BACKEND_DIAGNOSIS.md](TYPESCRIPT_BACKEND_DIAGNOSIS.md) | 상세 기술 분석 |
| [BACKEND_IMPROVEMENT_ROADMAP.md](BACKEND_IMPROVEMENT_ROADMAP.md) | 3주 일정 계획 |
| [SELFHOSTING_BOOTSTRAP_FINAL_REPORT.md](SELFHOSTING_BOOTSTRAP_FINAL_REPORT.md) | Stage 1-2 배경 |

---

**준비됐나요? Step 1부터 시작하겠습니다! 🚀**

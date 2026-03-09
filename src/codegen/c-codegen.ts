// FreeLang v6: C 코드 생성기 (AST → C)

import { Expr, Stmt, Program } from "../ast";

export class CCodegen {
  private lines: string[] = [];
  private indent = 0;
  private tempCounter = 0;

  // ✨ Enum 메타데이터 저장소
  private enumMetadata: Map<string, {
    name: string;
    variants: Map<string, {
      name: string;
      fields: string[];
      isRecursive: boolean;
    }>;
  }> = new Map();

  generate(program: Program): string {
    // ✨ Step 1: 모든 enum 정의를 먼저 처리하여 메타데이터 수집
    for (const stmt of program.stmts) {
      if (stmt.kind === "enum") {
        this.collectEnumMetadata(stmt as any);
      }
    }

    // 헤더
    this.emitLine('#include "fl_runtime.h"');
    this.emitLine("");

    // ✨ Step 2: Forward declarations 생성
    for (const enumName of this.enumMetadata.keys()) {
      this.emitLine(`typedef struct ${enumName} ${enumName};`);
    }
    if (this.enumMetadata.size > 0) {
      this.emitLine("");
    }

    // ✨ Step 3: Enum struct 정의 생성
    for (const [enumName, info] of this.enumMetadata) {
      this.emitLine(`struct ${enumName} {`);
      this.emitLine(`  int tag;`);
      this.emitLine(`  union {`);

      for (const variant of info.variants.values()) {
        if (variant.fields.length > 0) {
          this.emitLine(`    struct {`);
          // ✨ 필드명이 중복되지 않도록 인덱스 추가
          const fieldCounts = new Map<string, number>();
          for (const field of variant.fields) {
            const count = (fieldCounts.get(field) || 0) + 1;
            fieldCounts.set(field, count);

            // 필드명: lowercase_field_name (같은 타입이 여러 개면 field1, field2...)
            let fieldName = field.toLowerCase();
            if (count > 1) {
              fieldName = `${fieldName}${count - 1}`;
            }

            if (this.enumMetadata.has(field)) {
              this.emitLine(`      struct ${field}* ${fieldName};`);
            } else {
              this.emitLine(`      fl_value *${fieldName};`);
            }
          }
          this.emitLine(`    } ${variant.name};`);
        }
      }

      this.emitLine(`  } data;`);
      this.emitLine(`};`);
      this.emitLine("");

      // ✨ Phase 5: Enum 생성자 함수 생성
      for (const variant of info.variants.values()) {
        const args = variant.fields.map((f, i) => `fl_value *${f.toLowerCase()}${i > 0 ? i : ""}`).join(", ");
        const argTypes = variant.fields.length > 0 ? args : "";
        const tagValue = Array.from(info.variants.keys()).indexOf(variant.name);

        // 생성자 함수 선언
        this.emitLine(`struct ${enumName}* ${enumName}_${variant.name}(${argTypes});`);
      }
      this.emitLine("");
    }

    // 함수 선언들
    const topLevelStmts = [];
    for (const stmt of program.stmts) {
      if (stmt.kind === "fn") {
        this.declareFn(stmt as any);
      } else {
        topLevelStmts.push(stmt);
      }
    }
    this.emitLine("");

    // 함수 정의
    for (const stmt of program.stmts) {
      if (stmt.kind === "fn") {
        this.genStmt(stmt);
        this.emitLine("");
      }
    }

    // ✨ Phase 5: Enum 생성자 함수 구현
    for (const [enumName, info] of this.enumMetadata) {
      for (const variant of info.variants.values()) {
        const args = variant.fields.map((f, i) => `fl_value *${f.toLowerCase()}${i > 0 ? i : ""}`).join(", ");
        const argList = variant.fields.length > 0 ? args : "void";

        this.emitLine(`struct ${enumName}* ${enumName}_${variant.name}(${argList}) {`);
        this.emitLine(`  struct ${enumName}* v = (struct ${enumName}*)malloc(sizeof(struct ${enumName}));`);
        this.emitLine(`  v->tag = ${Array.from(info.variants.keys()).indexOf(variant.name)};`);

        if (variant.fields.length > 0) {
          // ✨ enum struct 정의와 동일한 collision handling
          const fieldCounts = new Map<string, number>();
          for (let i = 0; i < variant.fields.length; i++) {
            const field = variant.fields[i];
            const count = (fieldCounts.get(field) || 0) + 1;
            fieldCounts.set(field, count);

            // 필드명: lowercase 형식 (collision이 있으면 index 추가)
            let fieldName = field.toLowerCase();
            if (count > 1) {
              fieldName = `${fieldName}${count - 1}`;
            }

            // 인자명: field_lower + index (i > 0일 때만)
            const paramName = field.toLowerCase() + (i > 0 ? i : "");
            this.emitLine(`  v->data.${variant.name}.${fieldName} = ${paramName};`);
          }
        }

        this.emitLine(`  return v;`);
        this.emitLine(`}`);
        this.emitLine("");
      }
    }

    // main 함수 (top-level statements 포함)
    this.emitLine("int main(int argc, char **argv) {");
    this.indent++;
    if (topLevelStmts.length === 0) {
      this.emitLine("return 0;");
    } else {
      for (const stmt of topLevelStmts) {
        this.genStmt(stmt);
      }
      this.emitLine("return 0;");
    }
    this.indent--;
    this.emitLine("}");

    return this.lines.join("\n");
  }

  private emit(text: string) {
    this.lines.push("  ".repeat(this.indent) + text);
  }

  private emitLine(text: string) {
    this.lines.push(text);
  }

  private tempVar(): string {
    return `__tmp${this.tempCounter++}`;
  }

  private declareFn(stmt: any) {
    const name = stmt.name;
    this.emit(`fl_value* fl_${name}(fl_value **args, int arg_count);`);
  }

  private genStmt(stmt: Stmt) {
    switch (stmt.kind) {
      case "fn": {
        const s = stmt as any;
        this.emit(`fl_value* fl_${s.name}(fl_value **args, int arg_count) {`);
        this.indent++;

        // ✨ Phase 4: 함수 매개변수 추출
        if (s.params && s.params.length > 0) {
          for (let i = 0; i < s.params.length; i++) {
            const paramName = s.params[i].name;
            this.emit(`fl_value *${paramName} = arg_count > ${i} ? args[${i}] : fl_null();`);
          }
        }

        if (s.body.length === 0) {
          this.emit("return fl_null();");
        } else {
          for (const b of s.body) {
            this.genStmt(b);
          }
        }
        this.indent--;
        this.emit("}");
        break;
      }

      case "let": {
        const s = stmt as any;
        if (s.init) {
          const exprCode = this.genExpr(s.init);
          this.emit(`fl_value *${s.name} = ${exprCode};`);
        } else {
          this.emit(`fl_value *${s.name} = fl_null();`);
        }
        break;
      }

      case "return": {
        const s = stmt as any;
        if (s.value) {
          const exprCode = this.genExpr(s.value);
          this.emit(`return ${exprCode};`);
        } else {
          this.emit("return fl_null();");
        }
        break;
      }

      case "print": {
        const s = stmt as any;
        const exprCode = this.genExpr(s.expr);
        const fn = s.newline ? "fl_println" : "fl_print";
        this.emit(`${fn}(${exprCode});`);
        break;
      }

      case "expr": {
        const s = stmt as any;
        const exprCode = this.genExpr(s.expr);
        this.emit(`${exprCode};`);
        break;
      }

      case "if": {
        const s = stmt as any;
        const cond = this.genExpr(s.cond);
        this.emit(`if (fl_is_truthy(${cond})) {`);
        this.indent++;
        for (const b of s.then) {
          this.genStmt(b);
        }
        this.indent--;
        if (s.else && s.else.length > 0) {
          this.emit("} else {");
          this.indent++;
          for (const b of s.else) {
            this.genStmt(b);
          }
          this.indent--;
        }
        this.emit("}");
        break;
      }

      case "while": {
        const s = stmt as any;
        const cond = this.genExpr(s.cond);
        this.emit(`while (fl_is_truthy(${cond})) {`);
        this.indent++;
        for (const b of s.body) {
          this.genStmt(b);
        }
        this.indent--;
        this.emit("}");
        break;
      }

      case "for": {
        const s = stmt as any;
        const iter = this.genExpr(s.iter);
        this.emit(`{`);
        this.indent++;
        this.emit(`fl_value *__iter = ${iter};`);
        this.emit(`if (__iter->tag == FL_ARRAY) {`);
        this.indent++;
        this.emit(`for (size_t _i = 0; _i < __iter->arrval->length; _i++) {`);
        this.indent++;
        this.emit(`fl_value *${s.name} = __iter->arrval->data[_i];`);
        for (const b of s.body) {
          this.genStmt(b);
        }
        this.indent--;
        this.emit("}");
        this.indent--;
        this.emit("}");
        this.indent--;
        this.emit("}");
        break;
      }

      case "struct":
        // Struct는 현재 처리 불필요
        break;

      case "enum":
        // enum은 generate()의 처음 단계에서 이미 처리됨
        break;

      case "match": {
        // ✨ Phase 3: match statement (함수 body 내 표현식)
        // match는 expression이지만 statement로도 나타날 수 있음
        // 이 경우 result를 return (스코핑 문제를 해결하기 위해 직접 구현)
        const s = stmt as any;
        const subject = this.genExpr(s.subject);

        // Type inference from patterns
        let subjectType: string | null = null;
        if (s.arms && s.arms.length > 0) {
          const firstPattern = s.arms[0].pattern;
          if (firstPattern.kind === "member" && firstPattern.object.kind === "ident") {
            subjectType = firstPattern.object.name;
          } else if (firstPattern.kind === "call" && firstPattern.callee.kind === "member") {
            subjectType = firstPattern.callee.object.name;
          }
        }

        if (!subjectType || !this.enumMetadata.has(subjectType)) {
          throw new Error(`Cannot infer enum type in match statement`);
        }

        const enumInfo = this.enumMetadata.get(subjectType)!;
        const tmp = this.tempVar();

        // ✨ 스코핑 수정: __tmp0을 괄호식 바깥에서 선언
        this.emit(`fl_value *${tmp} = fl_null();`);
        this.emit(`switch (((struct ${subjectType}*)${subject})->tag) {`);
        this.indent++;

        for (const arm of s.arms) {
          const pattern = arm.pattern;

          let variantName: string;
          let bindingNames: string[] = [];

          if (pattern.kind === "member" && pattern.object.kind === "ident") {
            variantName = pattern.property;
            bindingNames = [];
          } else if (pattern.kind === "call" && pattern.callee.kind === "member") {
            variantName = pattern.callee.property;
            bindingNames = (pattern as any).args.map((a: any) => a.name);
          } else {
            throw new Error(`Invalid pattern in match statement`);
          }

          const variantInfo = enumInfo.variants.get(variantName);
          if (!variantInfo) {
            throw new Error(`Unknown variant: ${variantName}`);
          }

          const tagValue = Array.from(enumInfo.variants.keys()).indexOf(variantName);
          this.emit(`case ${tagValue}: {`);
          this.indent++;

          // Variable binding
          for (let i = 0; i < bindingNames.length; i++) {
            const bindingName = bindingNames[i];
            const fieldName = variantInfo.fields[i];

            let actualFieldName = fieldName.toLowerCase();
            const fieldIndices = new Map<string, number>();
            for (let j = 0; j < i; j++) {
              const prevField = variantInfo.fields[j];
              if (prevField === fieldName) {
                const idx = (fieldIndices.get(fieldName) || 0) + 1;
                fieldIndices.set(fieldName, idx);
              }
            }
            if (fieldIndices.has(fieldName)) {
              actualFieldName = `${fieldName.toLowerCase()}${fieldIndices.get(fieldName)!}`;
            }

            this.emit(
              `fl_value *${bindingName} = ((struct ${subjectType}*)${subject})->data.${variantName}.${actualFieldName};`
            );
          }

          // Body processing
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
        this.emit(`return ${tmp};`);
        break;
      }

      default:
        // 다른 statement는 무시
        break;
    }
  }

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

  private genExpr(expr: Expr): string {
    switch (expr.kind) {
      case "number":
        return `fl_int(${(expr as any).value})`;

      case "string":
        return `fl_string("${(expr as any).value}")`;

      case "bool":
        return `fl_bool(${(expr as any).value ? 1 : 0})`;

      case "null":
        return "fl_null()";

      case "ident":
        return (expr as any).name;

      case "binary": {
        const e = expr as any;
        const left = this.genExpr(e.left);
        const right = this.genExpr(e.right);
        switch (e.op) {
          case "+": return `fl_add(${left}, ${right})`;
          case "-": return `fl_sub(${left}, ${right})`;
          case "*": return `fl_mul(${left}, ${right})`;
          case "/": return `fl_div(${left}, ${right})`;
          case "%": return `fl_mod(${left}, ${right})`;
          case "==": return `fl_eq(${left}, ${right})`;
          case "!=": return `fl_neq(${left}, ${right})`;
          case "<": return `fl_lt(${left}, ${right})`;
          case ">": return `fl_gt(${left}, ${right})`;
          case "<=": return `fl_lte(${left}, ${right})`;
          case ">=": return `fl_gte(${left}, ${right})`;
          case "&&": return `fl_and(${left}, ${right})`;
          case "||": return `fl_or(${left}, ${right})`;
          default: return "fl_null()";
        }
      }

      case "unary": {
        const e = expr as any;
        const operand = this.genExpr(e.expr);
        switch (e.op) {
          case "-":
            return `fl_sub(fl_int(0), ${operand})`;
          case "!":
            return `fl_not(${operand})`;
          default:
            return operand;
        }
      }

      case "call": {
        const e = expr as any;

        // ✨ Enum 생성자 판별
        if (e.callee.kind === "member" && e.callee.object.kind === "ident") {
          const enumName = e.callee.object.name;
          const variantName = e.callee.property;

          if (this.enumMetadata.has(enumName)) {
            // Enum 생성자 호출: ExprList.Cons(head, tail) → ExprList_Cons(head, tail)
            const args = e.args.map((a: Expr) => this.genExpr(a));
            return `${enumName}_${variantName}(${args.join(", ")})`;
          }
        }

        // 일반 함수 호출 (기존 로직)
        let callee = this.genExpr(e.callee);

        // ✨ identifier에 fl_ prefix 추가
        if (e.callee.kind === "ident") {
          callee = `fl_${callee}`;
        }

        const args = e.args.map((a: Expr) => this.genExpr(a));
        const tmp = this.tempVar();
        this.emit(`fl_value *${tmp}_args[] = {${args.join(", ")}};`);
        return `(${callee})(${tmp}_args, ${args.length})`;
      }

      case "array": {
        const e = expr as any;
        const tmp = this.tempVar();
        this.emit(`fl_value *${tmp} = fl_array_new();`);
        for (const elem of e.elements) {
          const elemCode = this.genExpr(elem);
          this.emit(`fl_array_push(${tmp}, ${elemCode});`);
        }
        return tmp;
      }

      case "member": {
        const e = expr as any;

        // ✨ Phase 2 보충: Enum 생성자 (매개변수 없음)
        if (e.object.kind === "ident") {
          const enumName = e.object.name;
          const variantName = e.property;

          if (this.enumMetadata.has(enumName)) {
            // enum variant 호출 (매개변수 없음): List.Nil → List_Nil()
            return `${enumName}_${variantName}()`;
          }
        }

        // 일반 member access
        const obj = this.genExpr(e.object);
        return `fl_struct_get_field(${obj}, "${e.property}")`;
      }

      case "index": {
        const e = expr as any;
        const obj = this.genExpr(e.object);
        const idx = this.genExpr(e.index);
        return `fl_array_get(${obj}, fl_to_int(${idx}))`;
      }

      // ✨ Phase 3: Pattern matching (match expression)
      case "match": {
        const e = expr as any;
        const subject = this.genExpr(e.subject);

        // ✨ 타입 추론: pattern에서 enum 이름 추출 (더 신뢰성 있음)
        let subjectType: string | null = null;
        if (e.arms && e.arms.length > 0) {
          const firstPattern = e.arms[0].pattern;
          if (firstPattern.kind === "member" && firstPattern.object.kind === "ident") {
            subjectType = firstPattern.object.name;
          } else if (firstPattern.kind === "call" && firstPattern.callee.kind === "member") {
            subjectType = firstPattern.callee.object.name;
          }
        }

        // 폴백: subject identifier 이름 사용
        if (!subjectType) {
          if (e.subject.kind === "ident") {
            subjectType = (e.subject as any).name;
          } else if (e.subject.kind === "call" && (e.subject as any).callee.kind === "member") {
            const call = e.subject as any;
            subjectType = call.callee.object.name;
          }
        }

        if (!subjectType || !this.enumMetadata.has(subjectType)) {
          throw new Error(`Cannot infer enum type in match expression (got: ${subjectType})`);
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

          // ✨ Pattern 분석:
          // 1. List.Nil (member - parameterless variant)
          // 2. List.Cons(head, tail) (call - parametered variant)
          let variantName: string;
          let bindingNames: string[] = [];

          if (pattern.kind === "member" && pattern.object.kind === "ident") {
            // Parameterless variant: List.Nil
            variantName = pattern.property;
            bindingNames = [];
          } else if (pattern.kind === "call" && pattern.callee.kind === "member") {
            // Parametered variant: List.Cons(head, tail)
            variantName = pattern.callee.property;
            bindingNames = (pattern as any).args.map((a: any) => a.name);
          } else {
            throw new Error(`Invalid pattern in match: expected EnumName.Variant or EnumName.Variant(...)`);
          }

          const variantInfo = enumInfo.variants.get(variantName);

          if (!variantInfo) {
            throw new Error(`Unknown variant: ${variantName}`);
          }

          // switch case 생성
          const tagValue = Array.from(enumInfo.variants.keys()).indexOf(variantName);
          this.emit(`case ${tagValue}: {`);
          this.indent++;

          // ✨ 변수 바인딩 (destructuring)
          for (let i = 0; i < bindingNames.length; i++) {
            const bindingName = bindingNames[i];
            const fieldName = variantInfo.fields[i];

            // 필드명 인덱싱 (Phase 1에서 추가한 방식과 동일)
            let actualFieldName = fieldName.toLowerCase();
            const fieldIndices = new Map<string, number>();
            for (let j = 0; j < i; j++) {
              const prevField = variantInfo.fields[j];
              if (prevField === fieldName) {
                const idx = (fieldIndices.get(fieldName) || 0) + 1;
                fieldIndices.set(fieldName, idx);
              }
            }
            if (fieldIndices.has(fieldName)) {
              actualFieldName = `${fieldName.toLowerCase()}${fieldIndices.get(fieldName)!}`;
            }

            this.emit(
              `fl_value *${bindingName} = ${subject}->data.${variantName}.${actualFieldName};`
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
        this.emit(`});`);

        return tmp;
      }

      default:
        return "fl_null()";
    }
  }
}

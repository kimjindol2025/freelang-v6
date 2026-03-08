// FreeLang v6: C 코드 생성기 (AST → C)

import { Expr, Stmt, Program } from "../ast";

export class CCodegen {
  private lines: string[] = [];
  private indent = 0;
  private tempCounter = 0;

  generate(program: Program): string {
    // 헤더
    this.emitLine('#include "fl_runtime.h"');
    this.emitLine("");

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
      case "enum":
        // Phase 2에서는 메타데이터만 저장 (실행 시간에는 불필요)
        break;

      default:
        // 다른 statement는 무시
        break;
    }
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
        const callee = this.genExpr(e.callee);
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
        const obj = this.genExpr(e.object);
        return `fl_struct_get_field(${obj}, "${e.property}")`;
      }

      case "index": {
        const e = expr as any;
        const obj = this.genExpr(e.object);
        const idx = this.genExpr(e.index);
        return `fl_array_get(${obj}, fl_to_int(${idx}))`;
      }

      default:
        return "fl_null()";
    }
  }
}

// FreeLang v6: Main entry point

export { lex } from "./lexer";
export { parse } from "./parser";
export { compile, Op, Value, Chunk } from "./compiler";
export { VM } from "./vm";
export { registerBuiltin, getBuiltins } from "./stdlib/builtins";
export { loadModuleStmts, clearModuleCache } from "./module-loader";

// Load stdlib modules (side-effect imports register builtins)
import "./stdlib/builtin-datetime";
import "./stdlib/builtin-regex";
import "./stdlib/builtin-file";
import "./stdlib/builtin-path";
import "./stdlib/builtin-buffer";
import "./stdlib/builtin-validate";
import "./stdlib/builtin-config";
import "./stdlib/builtin-compress";
import "./stdlib/builtin-http";
import "./stdlib/builtin-test";
import "./stdlib/builtin-errors";

import { lex } from "./lexer";
import { parse } from "./parser";
import { compile } from "./compiler";
import { VM } from "./vm";
import { Stmt } from "./ast";
import { loadModuleStmts } from "./module-loader";

/** Run FreeLang source code, return output lines */
export function run(source: string, basePath?: string): string[] {
  const tokens = lex(source);
  const ast = parse(tokens);

  // Fast path: no imports → compile directly (zero overhead)
  const hasImports = ast.stmts.some(s => s.kind === "import");
  if (!hasImports && !ast.stmts.some(s => s.kind === "export")) {
    const chunk = compile(ast);
    const vm = new VM(chunk);
    return vm.run().output;
  }

  // Merge module stmts into a single AST
  const allStmts: Stmt[] = [];
  const base = basePath ?? process.cwd();

  for (const s of ast.stmts) {
    if (s.kind === "import") {
      const mod = loadModuleStmts(s.path, base);
      allStmts.push(...mod.stmts);

      if (s.alias) {
        // import "mod" as M → create object right after module stmts
        allStmts.push({
          kind: "let",
          name: s.alias,
          mutable: false,
          init: {
            kind: "object",
            entries: mod.exportedNames.map(n => ({ key: n, value: { kind: "ident" as const, name: n } }))
          }
        });
      }
    } else if (s.kind === "export") {
      allStmts.push(s.stmt);
    } else {
      allStmts.push(s);
    }
  }

  const chunk = compile({ stmts: allStmts });
  const vm = new VM(chunk);
  return vm.run().output;
}

/** Run FreeLang source code with PC tracing for debugging */
export function runWithTrace(source: string, basePath?: string): { output: string[]; trace: string[] } {
  const tokens = lex(source);
  const ast = parse(tokens);

  const hasImports = ast.stmts.some(s => s.kind === "import");
  if (!hasImports && !ast.stmts.some(s => s.kind === "export")) {
    const chunk = compile(ast);
    const vm = new VM(chunk);
    vm.enableTrace();
    const result = vm.run();
    return { output: result.output, trace: vm.getTraceLogs() };
  }

  const allStmts: Stmt[] = [];
  const base = basePath ?? process.cwd();

  for (const s of ast.stmts) {
    if (s.kind === "import") {
      const mod = loadModuleStmts(s.path, base);
      allStmts.push(...mod.stmts);
    } else if (s.kind === "export") {
      allStmts.push(s.stmt);
    } else {
      allStmts.push(s);
    }
  }

  const chunk = compile({ stmts: allStmts });
  const vm = new VM(chunk);
  vm.enableTrace();
  const result = vm.run();
  return { output: result.output, trace: vm.getTraceLogs() };
}

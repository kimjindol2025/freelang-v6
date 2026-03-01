// FreeLang v6: Module Loader (AST-level merging)

import * as fs from "fs";
import * as path from "path";
import { lex } from "./lexer";
import { parse } from "./parser";
import { Stmt } from "./ast";

type ModuleResult = { stmts: Stmt[]; exportedNames: string[] };
const moduleCache = new Map<string, ModuleResult>();

/** Load module AST stmts (unwrap exports, recurse imports) */
export function loadModuleStmts(modulePath: string, basePath: string): ModuleResult {
  const resolved = resolveModulePath(modulePath, basePath);
  if (moduleCache.has(resolved)) return moduleCache.get(resolved)!;

  // Mark as loading (prevent cycles)
  moduleCache.set(resolved, { stmts: [], exportedNames: [] });

  const source = fs.readFileSync(resolved, "utf-8");
  const tokens = lex(source);
  const ast = parse(tokens);

  const stmts: Stmt[] = [];
  const exportedNames: string[] = [];

  for (const s of ast.stmts) {
    if (s.kind === "import") {
      const sub = loadModuleStmts(s.path, path.dirname(resolved));
      stmts.push(...sub.stmts);
    } else if (s.kind === "export") {
      if (s.stmt.kind === "fn") exportedNames.push(s.stmt.name);
      else if (s.stmt.kind === "let") exportedNames.push(s.stmt.name);
      stmts.push(s.stmt); // unwrap export → regular stmt
    } else {
      stmts.push(s);
    }
  }

  const result = { stmts, exportedNames };
  moduleCache.set(resolved, result);
  return result;
}

function resolveModulePath(modulePath: string, basePath: string): string {
  let resolved = path.resolve(basePath, modulePath);
  if (fs.existsSync(resolved)) return resolved;
  resolved = path.resolve(basePath, modulePath + ".fl");
  if (fs.existsSync(resolved)) return resolved;
  resolved = path.resolve(basePath, modulePath + ".freelang");
  if (fs.existsSync(resolved)) return resolved;
  throw new Error(`Module not found: ${modulePath} (from ${basePath})`);
}

export function clearModuleCache() {
  moduleCache.clear();
}

// FreeLang v6: AST Node definitions

// 함수 파라미터 - 타입 어노테이션 보존
export type Param = {
  name: string;
  typeAnnotation?: string;
};

export type Expr =
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "bool"; value: boolean }
  | { kind: "null" }
  | { kind: "ident"; name: string }
  | { kind: "binary"; op: string; left: Expr; right: Expr }
  | { kind: "unary"; op: string; expr: Expr }
  | { kind: "call"; callee: Expr; args: Expr[] }
  | { kind: "index"; object: Expr; index: Expr }
  | { kind: "member"; object: Expr; property: string }
  | { kind: "assign"; target: Expr; value: Expr }
  | { kind: "array"; elements: Expr[] }
  | { kind: "object"; entries: { key: string; value: Expr }[] }
  | { kind: "fn"; name: string | null; params: Param[]; body: Stmt[] }
  | { kind: "ternary"; cond: Expr; then: Expr; else: Expr }
  | { kind: "if"; cond: Expr; then: Stmt[]; else: Stmt[] }
  | { kind: "match"; subject: Expr; arms: MatchArm[] };

export type MatchArm = { pattern: Expr | null; guard: Expr | null; body: Stmt[] };

export type Stmt =
  | { kind: "expr"; expr: Expr }
  | { kind: "let"; name: string; mutable: boolean; init: Expr | null }
  | { kind: "return"; value: Expr | null }
  | { kind: "if"; cond: Expr; then: Stmt[]; else: Stmt[] | null }
  | { kind: "if-let"; pattern: Expr; value: Expr; body: Stmt[]; else?: Stmt[] }
  | { kind: "while"; cond: Expr; body: Stmt[] }
  | { kind: "while-let"; pattern: Expr; value: Expr; body: Stmt[] }
  | { kind: "for"; name: string; iter: Expr; body: Stmt[] }
  | { kind: "block"; body: Stmt[] }
  | { kind: "break" }
  | { kind: "continue" }
  | { kind: "fn"; name: string; params: Param[]; returnType?: string; body: Stmt[] }
  | { kind: "print"; expr: Expr; newline: boolean }
  | { kind: "try"; body: Stmt[]; catchVar: string | null; catchBody: Stmt[]; finallyBody: Stmt[] }
  | { kind: "throw"; expr: Expr }
  | { kind: "struct"; name: string; typeParams?: string[]; fields: Array<{ name: string; type: string }> }
  | { kind: "import"; names: string[] | null; path: string; alias: string | null }
  | { kind: "export"; stmt: Stmt }
  | { kind: "multi"; stmts: Stmt[] }
  | { kind: "match"; subject: Expr; arms: MatchArm[] };

export type Program = { stmts: Stmt[] };

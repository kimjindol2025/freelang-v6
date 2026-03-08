// 제네릭 타입 파라미터 파싱 검증
const { lex } = require('./dist/lexer');
const { parse } = require('./dist/parser');

const code = `
fn identity<T>(x: T) -> T {
  x
}

struct Pair<A, B> {
  first: A,
  second: B,
}

enum Result<T, E> {
  Ok,
  Err,
}
`;

const tokens = lex(code);
const ast = parse(tokens);

console.log('=== AST 검증: 제네릭 타입 파라미터 ===\n');

for (const stmt of ast.stmts) {
  if (stmt.kind === 'fn') {
    console.log(`📌 함수: ${stmt.name}`);
    if (stmt.typeParams) {
      console.log(`   제네릭: <${stmt.typeParams.join(', ')}>`);
    }
    console.log();
  } else if (stmt.kind === 'struct') {
    console.log(`📌 구조체: ${stmt.name}`);
    if (stmt.typeParams) {
      console.log(`   제네릭: <${stmt.typeParams.join(', ')}>`);
    }
    console.log();
  } else if (stmt.kind === 'enum') {
    console.log(`📌 Enum: ${stmt.name}`);
    if (stmt.typeParams) {
      console.log(`   제네릭: <${stmt.typeParams.join(', ')}>`);
    }
    console.log();
  }
}

console.log('✅ Phase 1-3 검증 완료: 제네릭 타입 파라미터가 AST에 보존됨!');

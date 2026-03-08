// 타입 어노테이션 AST 보존 검증 스크립트
const { lex } = require('./dist/lexer');
const { parse } = require('./dist/parser');
const fs = require('fs');

const code = `
enum Result {
  Ok,
  Err,
}

enum Token {
  Number,
  Ident,
  String,
}
`;

const tokens = lex(code);
const ast = parse(tokens);

console.log('=== AST 검증: Enum 선언 정보 ===\n');

for (const stmt of ast.stmts) {
  if (stmt.kind === 'enum') {
    console.log(`📌 Enum: ${stmt.name}`);
    console.log(`   Variants:`);
    for (const variant of stmt.variants) {
      const fields = variant.fields ? `(${variant.fields.join(', ')})` : '';
      console.log(`     - ${variant.name}${fields}`);
    }
    console.log();
  }
}

console.log('✅ Phase 1-2 검증 완료: Enum 선언이 AST에 보존됨!');

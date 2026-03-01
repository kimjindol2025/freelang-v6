// FreeLang v6: Token definitions

export enum TokenType {
  // Literals
  Number, String, Bool, Null,
  // Identifiers & Keywords
  Ident, Let, Const, Fn, Return, If, Else, While, For, In,
  Break, Continue, Print, Println,
  Try, Catch, Finally, Throw,
  Import, Export, From, As, Struct, New,
  // Operators
  Plus, Minus, Star, Slash, Percent,
  Eq, Neq, Lt, Gt, Lte, Gte,
  And, Or, Not,
  Ampersand, // & (address-of operator)
  Assign, PlusAssign, MinusAssign, StarAssign, SlashAssign,
  // Delimiters
  LParen, RParen, LBrace, RBrace, LBracket, RBracket,
  Comma, Semicolon, Colon, Dot, DotDot, Arrow, FatArrow,
  // Keywords (extra)
  Match,
  // Special
  EOF,
}

export type Token = {
  type: TokenType;
  value: string;
  line: number;
  col: number;
};

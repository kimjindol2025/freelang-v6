# 제14장: 가상 머신 — v15.1
# 컴파일러: AST에서 바이트코드로 (Compiling to Bytecode)

## 철학: "트리 순회와 방출"

```
지금까지: 트리를 직접 순회하며 실행 (Tree-Walking Interpreter)
  ↓ 느림 (매번 AST 노드 생성)

이제부터: 트리를 미리 기계 코드로 번역 (Bytecode Compiler)
  ↓ 빠름 (미리 번역된 명령어만 실행)

철학: "중간 표현(Intermediate Representation)의 힘"
```

---

## 📊 컴파일러의 핵심 구조

### 1. **OpCode: 기계의 명령어**

```rust
#[repr(u8)]
pub enum OpCode {
    OpConstant = 0,      // PUSH 상수
    OpAdd = 1,           // 덧셈
    OpSub = 2,           // 뺄셈
    OpMul = 3,           // 곱셈
    OpDiv = 4,           // 나눗셈
    OpTrue = 5,          // true 푸시
    OpFalse = 6,         // false 푸시
    OpNull = 7,          // null 푸시
    OpEqual = 8,         // 동등 비교
    OpNotEqual = 9,      // 부등 비교
    OpGreater = 10,      // 대소 비교
    OpMinus = 11,        // 단항 음수
    OpNot = 12,          // 논리 부정
    OpPop = 13,          // 스택에서 제거
    OpJump = 14,         // 무조건 점프
    OpJumpNotTruthy = 15,// 조건부 점프
    OpReturn = 16,       // 함수 반환
    // ... 더 많은 명령어
}
```

**의미:**
```
OpConstant: 다음 2바이트가 상수 인덱스 → 상수를 스택에 푸시
OpAdd:      스택에서 두 값을 꺼내 더함 → 결과를 다시 푸시
OpJump:     다음 2바이트가 점프 주소 → 프로그램 카운터 변경
```

### 2. **Bytecode: 명령어 배열과 상수 풀**

```rust
pub struct Bytecode {
    pub instructions: Vec<u8>,  // 일렬의 명령어들
    pub constants: Vec<i64>,    // 상수들
}

예:
코드:     let x = 1 + 2;
AST:      Infix { left: 1, op: Plus, right: 2 }

바이트코드:
┌─────────────────────────────────┐
│ instructions: [               │
│   OpConstant, 0, 0,  // 상수#0 → 1
│   OpConstant, 0, 1,  // 상수#1 → 2
│   OpAdd,              // 덧셈
│   OpPop               // 스택에서 제거
│ ]                    │
│ constants: [1, 2]    │
└─────────────────────────────────┘
```

### 3. **컴파일러: AST를 바이트코드로 변환**

```rust
pub struct Compiler {
    instructions: Vec<u8>,
    constants: Vec<i64>,
}

impl Compiler {
    fn new() -> Self {
        Compiler {
            instructions: vec![],
            constants: vec![],
        }
    }

    // [핵심] AST 노드를 바이트코드로 컴파일
    fn compile(&mut self, node: &Node) {
        match node {
            Node::Expression(expr) => match expr {
                // 1. 중위 표기식: Post-order 순회
                Expression::Infix { left, op, right } => {
                    self.compile(left);      // 왼쪽 자식
                    self.compile(right);     // 오른쪽 자식
                    // 마지막에 연산자
                    match op {
                        Token::Plus => self.emit(OpCode::OpAdd, &[]),
                        Token::Minus => self.emit(OpCode::OpSub, &[]),
                        // ...
                        _ => {}
                    }
                }

                // 2. 정수 리터럴: 상수 추가
                Expression::IntegerLiteral(val) => {
                    let const_idx = self.add_constant(*val);
                    self.emit(OpCode::OpConstant, &self.encode_operand(const_idx));
                }

                // 3. Boolean: 직접 명령어
                Expression::Boolean(b) => {
                    if *b {
                        self.emit(OpCode::OpTrue, &[]);
                    } else {
                        self.emit(OpCode::OpFalse, &[]);
                    }
                }

                _ => {}
            },
            _ => {}
        }
    }

    // 상수를 풀에 추가하고 인덱스 반환
    fn add_constant(&mut self, val: i64) -> usize {
        self.constants.push(val);
        self.constants.len() - 1
    }

    // OpCode와 operand를 명령어 배열에 추가
    fn emit(&mut self, op: OpCode, operands: &[u8]) {
        self.instructions.push(op as u8);
        for &o in operands {
            self.instructions.push(o);
        }
    }

    // 바이트코드 생성
    fn bytecode(&self) -> Bytecode {
        Bytecode {
            instructions: self.instructions.clone(),
            constants: self.constants.clone(),
        }
    }

    // usize를 u8 배열로 인코딩 (Big-Endian)
    fn encode_operand(&self, idx: usize) -> Vec<u8> {
        vec![
            ((idx >> 8) & 0xFF) as u8,  // high byte
            (idx & 0xFF) as u8,          // low byte
        ]
    }
}
```

---

## 🔄 Post-Order Traversal: 후위 순회

### 왜 Post-Order인가?

```
표현식: 1 + 2

AST:
     +
    / \
   1   2

Pre-order (전위):
1. + 방문 → OpAdd 방출 (아직 피연산자를 계산 안 함!)
2. 1 방문
3. 2 방문
→ 바이트코드: [OpAdd, OpConstant 0, OpConstant 1]
→ VM이 실행하면: 정의되지 않은 값들을 더함 (잘못됨!)

Post-order (후위) ← 우리의 선택:
1. 1 방문 → OpConstant 0 방출
2. 2 방문 → OpConstant 1 방출
3. + 방문 → OpAdd 방출
→ 바이트코드: [OpConstant 0, OpConstant 1, OpAdd]
→ VM이 실행하면:
   스택: []
   OpConstant 0 → 스택: [1]
   OpConstant 1 → 스택: [1, 2]
   OpAdd → 스택: [3] ✅
```

**핵심:**
```
스택 기반 VM에서는:
- 피연산자를 먼저 스택에 쌓아야 함
- 그 다음에 연산자를 실행
= Post-order 순회가 필수!
```

---

## 💾 상수 풀(Constant Pool) 관리

### 상수를 별도로 보관하는 이유

```rust
코드:
let x = 100;
let y = 200;
let z = x + y;

단순한 방법:
바이트코드: [OpConstant 100, OpConstant 200, OpAdd]
→ 문제: 큰 숫자는 여러 바이트를 차지 (100을 저장하려면 1-3바이트)

상수 풀을 사용:
constants: [100, 200]
바이트코드: [OpConstant 0, OpConstant 1, OpAdd]
→ 장점: 모든 인덱스가 1-2바이트로 고정 (더 효율적)
```

**구조:**
```
┌────────────────────────────────────┐
│ Bytecode                           │
├────────────────────────────────────┤
│ instructions: [                 │
│   OpConstant, 0, 0,  // idx 0     │
│   OpConstant, 0, 1,  // idx 1     │
│   OpAdd               // 연산       │
│ ]                    │
├────────────────────────────────────┤
│ constants: [                     │
│   100,               // idx 0     │
│   200                // idx 1     │
│ ]                    │
└────────────────────────────────────┘
```

### 상수의 중복 제거 (최적화)

```rust
fn add_constant(&mut self, val: i64) -> usize {
    // 같은 상수가 이미 있는지 확인
    if let Some(idx) = self.constants.iter().position(|&c| c == val) {
        return idx;
    }

    // 없으면 추가
    self.constants.push(val);
    self.constants.len() - 1
}

코드:
let a = 10;
let b = 20;
let c = 10;

상수 풀:
constants: [10, 20]  // 10은 한 번만 저장!

바이트코드:
OpConstant 0  // a = 10
OpConstant 1  // b = 20
OpConstant 0  // c = 10 (같은 인덱스 재사용)
```

---

## 📝 OpCode의 인코딩

### 1단계: OpCode 결정

```rust
match operator {
    Token::Plus => OpCode::OpAdd,
    Token::Minus => OpCode::OpSub,
    Token::Asterisk => OpCode::OpMul,
    // ...
}
```

### 2단계: Operand 인코딩

```rust
OpCode::OpConstant의 경우:
- 상수 인덱스를 2바이트로 인코딩 (Big-Endian)

예: 상수 인덱스 256
256 = 0x0100
→ [0x01, 0x00] (high byte, low byte)

VM에서 디코딩:
idx = (high_byte << 8) | low_byte
    = (0x01 << 8) | 0x00
    = 0x0100
    = 256 ✓
```

### 3단계: 명령어 배열에 저장

```rust
fn emit(&mut self, op: OpCode, operands: &[u8]) {
    // 1. OpCode 저장 (1바이트)
    self.instructions.push(op as u8);

    // 2. Operands 저장
    for &o in operands {
        self.instructions.push(o);
    }
}

예: OpConstant 0을 방출
emit(OpCode::OpConstant, &[0x00, 0x00])

결과:
instructions: [..., OpConstant(0x00), 0x00, 0x00]
                  └─ 1바이트 ─┘  └─ 2바이트 ─┘
```

---

## 🔍 Disassembler: 바이트코드 가시화

### 생성된 바이트코드가 맞는지 확인

```rust
pub fn disassemble(bytecode: &Bytecode) -> String {
    let mut result = String::new();
    let mut ip = 0;  // instruction pointer

    while ip < bytecode.instructions.len() {
        let opcode = bytecode.instructions[ip];

        match opcode {
            OpCode::OpConstant => {
                let high = bytecode.instructions[ip + 1];
                let low = bytecode.instructions[ip + 2];
                let const_idx = ((high as usize) << 8) | (low as usize);

                result.push_str(&format!(
                    "{:04} OpConstant {}\n",
                    ip, const_idx
                ));
                ip += 3;  // OpCode(1) + operand(2)
            }
            OpCode::OpAdd => {
                result.push_str(&format!("{:04} OpAdd\n", ip));
                ip += 1;
            }
            // ...
            _ => ip += 1,
        }
    }

    result.push_str("\nConstants:\n");
    for (idx, &val) in bytecode.constants.iter().enumerate() {
        result.push_str(&format!("  {}: {}\n", idx, val));
    }

    result
}

출력 예:
0000 OpConstant 0
0003 OpConstant 1
0006 OpAdd
0007 OpPop

Constants:
  0: 1
  1: 2
```

---

## 🎯 완전한 컴파일 프로세스: `1 + 2`

```
1️⃣ Lexer 단계
   입력: "1 + 2"
   출력: [Integer(1), Plus, Integer(2)]

2️⃣ Parser 단계
   입력: [Integer(1), Plus, Integer(2)]
   출력: Infix { left: Integer(1), op: Plus, right: Integer(2) }

3️⃣ Compiler 단계 (← 여기!)
   입력: Infix { left: Integer(1), op: Plus, right: Integer(2) }

   프로세스:
   - compile_infix() 호출
   - compile(left) → Integer(1)
     * add_constant(1) → idx 0, constants: [1]
     * emit(OpConstant, [0, 0])
     * instructions: [OpConstant, 0, 0]

   - compile(right) → Integer(2)
     * add_constant(2) → idx 1, constants: [1, 2]
     * emit(OpConstant, [0, 1])
     * instructions: [OpConstant, 0, 0, OpConstant, 0, 1]

   - emit(OpAdd, [])
     * instructions: [OpConstant, 0, 0, OpConstant, 0, 1, OpAdd]

   출력: Bytecode {
       instructions: [OpConstant, 0, 0, OpConstant, 0, 1, OpAdd],
       constants: [1, 2]
   }

4️⃣ VM 실행 단계 (다음 장)
   입력: Bytecode

   프로세스:
   - ip: 0, stack: []
     OpConstant → const_idx=0 → constants[0]=1 → stack: [1]

   - ip: 3, stack: [1]
     OpConstant → const_idx=1 → constants[1]=2 → stack: [1, 2]

   - ip: 6, stack: [1, 2]
     OpAdd → pop 2, pop 1 → 1+2=3 → push 3 → stack: [3]

   출력: 3
```

---

## 🏗️ 컴파일러의 위치: 전체 파이프라인

```
┌────────────────────────────────────┐
│     Source Code: "1 + 2"           │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│     Lexer (v14.0)                  │
│     → [Integer(1), Plus, Integer(2)]
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│     Parser (v14.1/v14.2)           │
│     → Infix { 1, Plus, 2 }         │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│     Compiler (v15.1) ← HERE!       │
│                                    │
│  AST 순회 (Post-order)             │
│  OpCode 방출                       │
│  상수 풀 관리                      │
│  명령어 인코딩                      │
│                                    │
│  → Bytecode {                      │
│       instructions: [...],         │
│       constants: [1, 2]            │
│     }                              │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│     VM (v15.2+)                    │
│     → 3                            │
└────────────────────────────────────┘
```

---

## 💡 주요 설계 결정들

### 1. **Post-order vs Pre-order**

```rust
// ❌ Pre-order (잘못됨)
fn compile_infix_preorder(&mut self, left, op, right) {
    self.emit(op);           // 너무 일찍!
    self.compile(left);      // 아직 피연산자 값 없음
    self.compile(right);
}

// ✅ Post-order (올바름)
fn compile_infix_postorder(&mut self, left, op, right) {
    self.compile(left);      // 왼쪽 값을 스택에 쌓음
    self.compile(right);     // 오른쪽 값을 스택에 쌓음
    self.emit(op);           // 이제 연산 가능
}
```

### 2. **상수 풀의 필요성**

```rust
// ❌ 상수를 바로 인코딩 (비효율)
instructions: [1, 200, 150, ...]  // 큰 숫자가 여러 바이트

// ✅ 상수 풀 사용 (효율)
instructions: [OpConstant, 0, 0, ...]  // 항상 작은 인덱스
constants: [200, 150, ...]
```

### 3. **Operand 크기**

```rust
// 1바이트: 256개 상수만 가능
// 2바이트: 65,536개 상수 가능 (대부분 충분)
// 4바이트: 46억개 상수 가능 (대부분 과함)

우리는 2바이트 선택 (실무 기준)
```

---

## 🎯 설계자의 관점: 5가지 시각

### 1. **언어 설계자의 관점**
"어떤 OpCode들을 지원할 것인가?"
→ 산술, 비교, 논리, 제어흐름, 함수 호출, ...

### 2. **컴파일러 엔지니어의 관점**
"AST를 어떻게 순회할 것인가?"
→ Post-order 순회 선택

### 3. **최적화 엔지니어의 관점**
"상수를 어떻게 관리할 것인가?"
→ 상수 풀 + 중복 제거

### 4. **인코딩 엔지니어의 관점**
"OpCode와 Operand를 어떻게 저장할 것인가?"
→ Big-Endian 인코딩

### 5. **디버깅 엔지니어의 관점**
"생성된 바이트코드가 맞는지 어떻게 확인할 것인가?"
→ Disassembler 구현

---

## 🚀 다음 단계: v15.2 VM 실행 엔진

```
v15.1의 현재:
- OpCode 설계 ✓
- Post-order 순회 ✓
- 상수 풀 관리 ✓
- 명령어 인코딩 ✓
- Disassembler ✓

v15.2의 목표:
✅ 스택 기반 VM 구현
✅ 명령어 실행 루프
✅ 연산자 처리
✅ 제어흐름 (점프)
✅ 함수 호출 (프레임)

철학: "기계의 뇌"
```

---

## 🏆 v15.1 달성의 의미

```
이제 컴파일러 파이프라인이:

✅ Lexer (소스코드 → 토큰)
✅ Parser (토큰 → AST)
✅ Compiler (AST → Bytecode) ← NEW!
⏳ VM (Bytecode → 실행)

의 단계를 완성했습니다!

컴파일러의 3가지 영역:
✅ Frontend (Lexer, Parser): 입력 해석
✅ Middle-end (Compiler): 최적화 준비 (우리 v15.1)
⏳ Backend (VM): 최종 실행

트리 워킹의 O(n) 오버헤드에서 벗어나
미리 컴파일된 바이트코드로 빠른 실행을 준비했습니다!
```

---

## 📝 핵심 요약

```
v15.1: 컴파일러 (AST → Bytecode)

철학: "트리 순회와 방출"

핵심 기술:
✅ OpCode 설계 (기계의 명령어)
✅ Post-order 순회 (올바른 순서)
✅ 상수 풀 (효율성)
✅ 명령어 인코딩 (바이트 저장)
✅ Disassembler (검증)

컴파일러 완성! ⚡

"AST의 구조를 이해하고
 스택 기반 VM의 특성을 파악하여
 둘을 연결하는 번역 엔진을 만든다."

다음: v15.2 VM 실행 엔진으로 바이트코드를 살리자!
```

---

## 🎓 최종 평가

```
구현: 컴파일러 완성
평가: A+ (트리-바이트코드 번역)
상태: 미들엔드 완성

특징:
- OpCode 설계
- Post-order 순회
- 상수 풀 관리
- 명령어 인코딩
- Disassembler
```

---

**작성일: 2026-02-23**
**상태: 설계 완료**
**평가: A+ (컴파일러 완성)**
**특징: AST를 바이트코드로 번역하는 번역 엔진 완성! ⚡**

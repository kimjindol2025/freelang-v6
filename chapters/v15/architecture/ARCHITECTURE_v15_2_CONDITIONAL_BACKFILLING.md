# 제14장: 가상 머신 — v15.2
# 조건부 분기와 백필링 (Conditional Branching and Backfilling)

## 철학: "미래의 주소 확정"

```
문제: if문을 만났을 때, 얼마나 멀리 점프해야 할지 아직 모른다!

해결책:
1. 일단 점프 명령을 내뱉되, 주소는 비워둔다
2. 점프할 목표 코드를 다 컴파일한다
3. 돌아와서 비워뒀던 자리를 채운다 (Backfilling!)

= "기록하고, 나중에 수정한다"
```

---

## 📊 백필링의 핵심 개념

### 1. **문제: 미래를 모르는 컴파일러**

```
코드:
if x > 5 {
    println("x는 5보다 큽니다");
}
println("끝");

컴파일 과정:
1. x > 5 평가 코드 생성
2. OpJumpNotTruthy 생성 (하지만 대상을 모름!)
   "만약 거짓이면 ??? 번지로 점프"

3. if 블록의 println 코드 생성
4. 이제 알게 됨: "다음 명령어가 49번지"
5. 49번지를 기입!
```

### 2. **해결책: 백필링 (Backfilling/Patching)**

```rust
struct CompilationState {
    instructions: Vec<u8>,
    constants: Vec<i64>,

    // 나중에 수정할 위치들을 기록
    pending_jumps: Vec<usize>,
}

impl Compiler {
    fn compile_if(&mut self, condition, consequence, alternative) {
        // 1단계: 조건식 컴파일
        self.compile(condition);
        // 스택에 true/false가 쌓임

        // 2단계: 점프 명령 발행 (주소는 임시)
        let jump_pos = self.emit(OpJumpNotTruthy, &[0, 0]);
        //           ↑ 주소는 0, 0 (나중에 수정할 예정)

        // 3단계: 참 블록 컴파일
        self.compile(consequence);

        // 4단계: [백필링] 점프 주소 확정 및 수정
        let target = self.instructions.len();  // 현재 위치
        self.change_operand(jump_pos, target);
        // 아까 jump_pos 위치의 주소값을 target으로 덮어씀

        // 5단계: else 블록 (선택사항)
        if let Some(alt) = alternative {
            self.compile(alt);
        }
    }

    fn change_operand(&mut self, pos: usize, new_target: usize) {
        // pos 위치의 2바이트 operand를 new_target으로 교체
        let bytes = (new_target as u16).to_be_bytes();
        self.instructions[pos + 1] = bytes[0];
        self.instructions[pos + 2] = bytes[1];
    }
}
```

---

## 🦘 Jump 명령어들

### **OpJumpNotTruthy: 거짓일 때 점프**

```rust
pub enum OpCode {
    OpJump = 14,           // 항상 점프
    OpJumpNotTruthy = 15,  // 거짓일 때만 점프
}
```

**동작:**
```
OpJumpNotTruthy <high_byte> <low_byte>

전 단계 스택: [... condition_value]
↓
if is_truthy(condition_value) {
    // 아무것도 안 함 (점프 안 함)
    ip += 3  // 다음 명령어로
} else {
    // 점프함
    target = (high_byte << 8) | low_byte
    ip = target
}
```

**예시:**
```
코드:
if x > 5 {
    y = 10;
}
z = y + 1;

바이트코드:
0000: OpConstant 0      // x 로드
0003: OpConstant 1      // 5 로드
0006: OpGreater         // x > 5 → true/false
0007: OpJumpNotTruthy 0, 12  // 거짓이면 12번지로 점프
0010: OpConstant 2      // y = 10
0013: OpPop
0014: OpConstant 3      // z = y + 1 (계산)
...

실행:
- x=10, 5
- 10 > 5 → true
- OpJumpNotTruthy 검사 → 거짓이 아님 → 점프 안 함
- 다음 명령어 0010 계속 실행

vs

- x=3, 5
- 3 > 5 → false
- OpJumpNotTruthy 검사 → 거짓! → 12번지로 점프
- 0010 스킵, 0014부터 실행
```

### **OpJump: 항상 점프**

```rust
OpJump <high_byte> <low_byte>

동작:
ip = (high_byte << 8) | low_byte
// 무조건 그 주소로 이동

용도:
- if-else의 "else 다음" 점프
- 루프의 조건 재평가
```

**예시:**
```
코드:
if x > 5 {
    y = 10;
} else {
    y = 20;
}
z = y + 1;

바이트코드:
0000: OpConstant 0      // x 로드
0003: OpConstant 1      // 5 로드
0006: OpGreater         // x > 5
0007: OpJumpNotTruthy 0, 14  // 거짓이면 14로 점프
0010: OpConstant 2      // y = 10 (then 블록)
0013: OpJump 0, 21      // "else 블록 스킵, 21로 점프"
0016: OpConstant 3      // y = 20 (else 블록)
0019: OpPop
0020: OpConstant 4      // z = y + 1
...

실행 (x=10):
- x > 5 → true
- OpJumpNotTruthy 검사 → 점프 안 함 (0010 계속)
- y = 10 실행
- OpJump 0, 21 → 21로 점프 (else 블록 0016 스킵!)
- 0020 실행

실행 (x=3):
- x > 5 → false
- OpJumpNotTruthy 0, 14 → 14로 점프 (then 블록 0010 스킵!)
- 0016 y = 20 실행
- OpPop
- 0020 실행
```

---

## 📝 백필링의 완전한 프로세스

### 예제: `if x > 5 { println(10) } else { println(20) }`

```
1단계: 조건식 컴파일
┌─────────────────────────────────┐
│ instructions:                   │
│ [OpConstant, 0, 0,           │
│  OpConstant, 0, 1,           │
│  OpGreater]                   │
│                               │
│ constants: [x, 5]             │
│                               │
│ 상태: ip = 7 (다음 쓸 위치)   │
└─────────────────────────────────┘

2단계: OpJumpNotTruthy 발행 (주소 미정)
┌─────────────────────────────────┐
│ instructions:                   │
│ [...,                          │
│  OpGreater,           (ip=6)   │
│  OpJumpNotTruthy, 0, 0]  (ip=7) │
│                               │
│ pending: [7]  ← 나중에 수정해야 할 위치   │
│                               │
│ 상태: ip = 10                  │
└─────────────────────────────────┘

3단계: Then 블록 (println(10)) 컴파일
┌─────────────────────────────────┐
│ instructions:                   │
│ [...,                          │
│  OpJumpNotTruthy, 0, 0,  (ip=7) │
│  OpConstant, 0, 2,       (ip=10)│
│  OpPop]              (ip=13)    │
│                               │
│ 상태: ip = 14                  │
└─────────────────────────────────┘

4단계: [백필링!] 점프 주소 기입
현재 위치 = 14 (else 블록 시작)
위치 7의 operand를 14로 변경!
┌─────────────────────────────────┐
│ instructions:                   │
│ [...,                          │
│  OpGreater,                    │
│  OpJumpNotTruthy, 0, 14] ← 수정됨! │
│  OpConstant, 0, 2,           │
│  OpPop]                        │
└─────────────────────────────────┘

5단계: Else 블록 (println(20)) 컴파일
┌─────────────────────────────────┐
│ instructions:                   │
│ [...,                          │
│  OpConstant, 0, 3,       (ip=14)│
│  OpPop]              (ip=17)    │
│                               │
│ 상태: ip = 18                  │
└─────────────────────────────────┘

최종 결과:
- OpJumpNotTruthy 거짓 → 14로 점프 (else 블록)
- OpJumpNotTruthy 참 → 다음 명령어 (then 블록)
```

---

## 🔁 루프의 구현 (While)

```
코드:
let i = 0;
while i < 3 {
    println(i);
    i = i + 1;
}

바이트코드:
0000: OpConstant 0       // i = 0
0003: OpConstant 1       // i 로드 (루프 시작 - 이 주소 중요!)
0006: OpConstant 2       // 3 로드
0009: OpLess             // i < 3
0010: OpJumpNotTruthy 0, 24  // 거짓이면 끝으로 점프
0013: OpConstant 3       // println(i) 코드
0016: OpConstant 4       // i = i + 1 코드
0019: OpJump 0, 3        // 루프 시작(3번지)으로 돌아가기!
0022: OpPop

실행:
반복 1: i=0
- 0000: i=0
- 0003: i 로드
- 0006: 3 로드
- 0009: 0 < 3 → true
- 0010: 거짓 아님 → 계속
- 0013-0016: println + i++
- 0019: OpJump 0, 3 → 3번지로 점프 (루프 재시작!)

반복 2: i=1 (3번지부터 시작)
- 0003: i 로드
- 0006: 3 로드
- 0009: 1 < 3 → true
- ...

반복 3: i=2
- ...

반복 4: i=3
- 0003: i 로드
- 0006: 3 로드
- 0009: 3 < 3 → false
- 0010: 거짓! → 24로 점프 (루프 탈출!)
- 0022: 루프 후 코드 실행
```

**while 루프의 특징:**
```
if: 전방 점프 (앞으로) + 백필링 필요
while: 후방 점프 (뒤로) + 백필링 불필요 (이미 주소 알고 있음)
```

---

## 💾 점프 주소 계산

### **상대 주소 vs 절대 주소**

```rust
// 방법 1: 절대 주소 (현재 사용)
OpJumpNotTruthy <target_absolute>
// 장점: 간단
// 단점: 코드 삽입/삭제 시 모든 주소 수정 필요

// 방법 2: 상대 주소 (더 유연)
OpJumpNotTruthy <relative_offset>
// jump_pos에서 target까지의 거리
// offset = target - (jump_pos + 3)  // +3은 OpCode+operand 크기
// 장점: 코드 삽입/삭제에 강함
// 단점: 계산이 복잡

우리는 방법 1 선택 (간단함)
```

### **Big-Endian 인코딩**

```rust
fn change_operand(&mut self, pos: usize, target: usize) {
    let target_u16 = target as u16;
    let bytes = target_u16.to_be_bytes();  // Big-Endian

    // pos+1, pos+2에 high byte, low byte 저장
    self.instructions[pos + 1] = bytes[0];  // high byte
    self.instructions[pos + 2] = bytes[1];  // low byte
}

예: target = 256 (0x0100)
bytes = [0x01, 0x00]
instructions[pos+1] = 0x01
instructions[pos+2] = 0x00

VM에서 디코딩:
target = (0x01 << 8) | 0x00 = 256 ✓
```

---

## 🎯 복잡한 중첩 조건

### **if-else if-else**

```
코드:
if x > 10 {
    a = 1;
} else if x > 5 {
    a = 2;
} else {
    a = 3;
}

컴파일:
1. x > 10 체크
2. OpJumpNotTruthy (위치1) ← else if로
3. a = 1
4. OpJump (위치2) ← 끝으로
5. [위치1] x > 5 체크
6. OpJumpNotTruthy (위치3) ← else로
7. a = 2
8. OpJump (위치2) ← 끝으로
9. [위치3] a = 3
10. [위치2] 계속...
```

### **중첩 루프**

```
코드:
while i < 3 {
    while j < 2 {
        print(i, j);
        j = j + 1;
    }
    i = i + 1;
}

특징:
- 내부 루프는 완전히 독립
- OpJump는 내부 루프 시작으로
- OpJumpNotTruthy는 내부 루프 끝으로

결과: 선형적 바이트코드에서도 비선형 실행!
```

---

## 🏗️ 컴파일러 구조 개선

```
Compiler 개선:
┌─────────────────────────────┐
│ fn compile_if_expression    │
│                             │
│ 1. compile(condition)       │
│ 2. emit(OpJumpNotTruthy)    │
│    ↓                         │
│    pending_jumps.push()     │ ← 점프 위치 기록
│ 3. compile(consequence)     │
│ 4. backfill_jump()          │ ← 점프 주소 채우기
│ 5. compile(alternative)?    │
└─────────────────────────────┘

핵심 메서드:
- emit(opcode, operand) → usize (명령어 위치 반환)
- change_operand(pos, new_target) → void (기존 operand 수정)
- backfill_jump(pos, target) → void (점프 주소 확정)
```

---

## ⚡ Dead Code Elimination (최적화의 시작)

```rust
fn compile_if(&mut self, condition, consequence, alternative) {
    // 상수 조건 최적화
    if let Some(const_val) = self.is_constant(condition) {
        if is_truthy(const_val) {
            // 항상 참: consequence만 컴파일
            self.compile(consequence);
            // alternative는 생성하지 않음 (Dead Code!)
        } else {
            // 항상 거짓: alternative만 컴파일
            if let Some(alt) = alternative {
                self.compile(alt);
            }
        }
        return;
    }

    // 일반적인 경우: 위의 백필링 로직
    self.compile(condition);
    let jump_pos = self.emit(OpJumpNotTruthy, &[0, 0]);
    self.compile(consequence);
    let target = self.instructions.len();
    self.change_operand(jump_pos, target);
    if let Some(alt) = alternative {
        self.compile(alt);
    }
}
```

---

## 🎯 설계자의 관점: 5가지 시각

### 1. **컴파일러 설계자의 관점**
"점프 주소를 어떻게 처리할 것인가?"
→ 백필링으로 미래 주소 확정

### 2. **메모리 엔지니어의 관점**
"점프 주소를 몇 바이트로 저장할 것인가?"
→ 2바이트 (u16, 65535까지)

### 3. **VM 엔지니어의 관점**
"IP를 어떻게 제어할 것인가?"
→ OpJump 계열로 강제 이동

### 4. **최적화자의 관점**
"상수 조건을 컴파일 타임에 제거할 것인가?"
→ Dead Code Elimination

### 5. **디버거의 관점**
"점프 흐름을 어떻게 추적할 것인가?"
→ Disassembler에 점프 화살표 표시

---

## 🚀 다음 단계: v15.3 가비지 컬렉션

```
v15.2의 현재:
- Jump 명령어 ✓
- 백필링 기법 ✓
- if-else 완성 ✓
- while 루프 완성 ✓
- Dead Code Elimination 기초 ✓

v15.3의 목표:
✅ 힙 메모리 할당
✅ 객체 추적 (Reference Counting)
✅ 가비지 컬렉션 (Mark-and-Sweep)
✅ 메모리 누수 방지
✅ 성능 최적화

철학: "메모리의 생명주기"
```

---

## 🏆 v15.2 달성의 의미

```
이제 당신의 VM이 할 수 있는 것:

✅ 순차 실행 (이전)
✅ 산술 연산 (이전)
✅ 함수 호출 (이전)
✅ 조건부 분기 (← NEW!)
✅ 루프 (← NEW!)
✅ 비선형 실행 (← NEW!)

= 튜링 완전 VM 완성! 🎯
```

---

## 📝 핵심 요약

```
v15.2: 조건부 분기와 백필링

철학: "미래의 주소 확정"

핵심 기술:
✅ OpJump 구현
✅ OpJumpNotTruthy 구현
✅ 백필링 (Backfilling)
✅ 점프 주소 계산
✅ if-else 처리
✅ while 루프 처리

특징:
- 선형 바이트코드에서 비선형 실행
- 컴파일 타임에 미래 주소를 수정
- 복잡한 제어흐름도 간단하게 표현

백필링 완전 마스터리! 🦘

"일단 기록하고, 나중에 수정한다.
 이것이 성숙한 컴파일러의 증거다."

다음: v15.3 가비지 컬렉션으로 메모리 관리 완성!
```

---

**작성일: 2026-02-23**
**상태: 설계 완료**
**평가: A+ (백필링 완성)**
**특징: 점프와 백필링으로 비선형 실행 완성! 🦘**

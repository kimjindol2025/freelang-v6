# v18.0 프로덕션 레벨 컴파일러 — 극한의 최적화와 안정화

**버전**: Freelang v18.0
**작성일**: 2026-02-23
**철학**: "낭비 없는 실행 (Zero-Waste Execution)"
**슬로건**: "가장 빠르고 견고한 언어"

---

## 📖 개요

v17.0에서 **생태계**를 완성했다면, v18.0은 그 생태계에서 동작할 **프로덕션 레벨의 컴파일러**를 구축합니다.

### v18.0의 세 가지 핵심 목표

```
1️⃣ 성능 (Performance)
   - 컴파일 타임 최적화 (Mid-level IR)
   - 런타임 가속 (JIT Compilation)
   - 데이터 레이아웃 최적화

2️⃣ 안정성 (Stability)
   - 퍼징 테스트 통합
   - 정적 분석 도구
   - 메모리 안전성 검증

3️⃣ 확장성 (Extensibility)
   - FFI (Foreign Function Interface)
   - 멀티스레딩/비동기 지원
   - LSP (Language Server Protocol)
```

---

## 🏗️ Part 1: 중간 표현(IR) 설계

### IR의 역할

```
┌──────────────┐
│     AST      │  (Abstract Syntax Tree)
└──────┬───────┘
       │ Lowering
       ▼
┌──────────────┐
│    IR Node   │  (Intermediate Representation)
├──────────────┤
│ - Type Info  │  타입 정보
│ - Location   │  소스 위치
│ - Metadata   │  메타데이터
└──────┬───────┘
       │ Optimization Passes
       ▼
┌──────────────┐
│ Optimized IR │
└──────┬───────┘
       │ Code Generation
       ▼
┌──────────────┐
│  Bytecode    │  (또는 Machine Code)
└──────────────┘
```

### IR Node 타입

```rust
/// 중간 표현의 기본 노드
enum IRNode {
    // 리터럴
    Literal(Value),           // 상수값

    // 연산
    BinaryOp {                // 이항 연산
        op: BinOp,
        lhs: Box<IRNode>,
        rhs: Box<IRNode>,
    },
    UnaryOp {                 // 단항 연산
        op: UnOp,
        operand: Box<IRNode>,
    },

    // 제어 흐름
    If {                       // 조건문
        cond: Box<IRNode>,
        then_block: Vec<IRNode>,
        else_block: Option<Vec<IRNode>>,
    },
    While {                    // 반복문
        cond: Box<IRNode>,
        body: Vec<IRNode>,
    },
    Loop {                     // 무한 루프
        body: Vec<IRNode>,
    },

    // 함수
    FunctionCall {             // 함수 호출
        name: String,
        args: Vec<IRNode>,
        return_type: Type,
    },
    Return(Option<Box<IRNode>>), // 반환

    // 변수
    VarDecl {                  // 변수 선언
        name: String,
        init: Option<Box<IRNode>>,
        ty: Type,
    },
    VarRef(String),            // 변수 참조
    VarAssign {                // 변수 할당
        name: String,
        value: Box<IRNode>,
    },

    // 메모리
    StackAlloc {               // 스택 할당
        size: usize,
        ty: Type,
    },
    Load {                     // 메모리 로드
        addr: Box<IRNode>,
        ty: Type,
    },
    Store {                    // 메모리 저장
        addr: Box<IRNode>,
        value: Box<IRNode>,
    },
}

enum BinOp {
    Add, Sub, Mul, Div, Mod,
    And, Or, Xor, Shl, Shr,
    Eq, Ne, Lt, Le, Gt, Ge,
}

enum UnOp {
    Neg, Not, BitNot,
}
```

---

## ⚡ Part 2: 최적화 패스 시스템

### OptimizationPass 아키텍처

```rust
/// 최적화 패스의 기본 인터페이스
trait OptimizationPass: Send + Sync {
    /// 패스의 이름
    fn name(&self) -> &'static str;

    /// 패스가 작동하는 IR에 대해 실행
    fn run(&self, ir: &mut IntermediateRepresentation) -> bool;

    /// 이 패스가 변형을 했는지 여부 (반복이 필요한지 판단)
    fn changed(&self) -> bool;
}

struct OptimizationEngine {
    passes: Vec<Box<dyn OptimizationPass>>,
    iteration_limit: usize,
}

impl OptimizationEngine {
    pub fn new() -> Self {
        Self {
            passes: vec![
                Box::new(ConstantFolder::new()),
                Box::new(DeadCodeEliminator::new()),
                Box::new(InliningPass::new()),
                Box::new(LoopUnroller::new()),
                Box::new(CopyPropagation::new()),
                Box::new(CommonSubexprElimination::new()),
                Box::new(TailCallOptimizer::new()),
            ],
            iteration_limit: 10,
        }
    }

    /// 모든 최적화 패스를 실행
    pub fn run_all(&self, ir: &mut IntermediateRepresentation) {
        for iteration in 0..self.iteration_limit {
            let mut changed = false;

            for pass in &self.passes {
                println!("[OPT-{}] Running: {}", iteration + 1, pass.name());
                if pass.run(ir) {
                    changed = true;
                }
            }

            if !changed {
                println!("[OPT] Fixed point reached after {} iterations", iteration + 1);
                break;
            }
        }
    }
}
```

### 7가지 핵심 최적화 패스

#### 1. **Constant Folding** (상수 폴딩)

```rust
/// 컴파일 타임에 계산 가능한 수식을 미리 계산
struct ConstantFolder {
    changed: bool,
}

impl OptimizationPass for ConstantFolder {
    fn name(&self) -> &'static str { "Constant Folding" }

    fn run(&self, ir: &mut IntermediateRepresentation) -> bool {
        // 예: BinaryOp(Add, Literal(2), Literal(3)) -> Literal(5)
        // 예: BinaryOp(Mul, Literal(x), Literal(0)) -> Literal(0)
        // 예: BinaryOp(Or, Literal(true), _) -> Literal(true)
        self.fold_constants(&mut ir.nodes);
        self.changed
    }

    fn changed(&self) -> bool { self.changed }
}

// 상수 폴딩의 효과:
// Before:  BinaryOp(Add, Literal(1), Literal(2)) // 실행 시 계산
// After:   Literal(3)                              // 컴파일 타임 계산
// Benefit: 런타임 1회 덧셈 제거 → 성능 향상
```

#### 2. **Dead Code Elimination** (죽은 코드 제거)

```rust
/// 실행될 리 없는 코드를 제거
struct DeadCodeEliminator {
    changed: bool,
}

impl OptimizationPass for DeadCodeEliminator {
    fn name(&self) -> &'static str { "Dead Code Elimination" }

    fn run(&self, ir: &mut IntermediateRepresentation) -> bool {
        // 예: if (false) { ... } -> 제거
        // 예: 함수 반환 후 코드 -> 제거
        // 예: 사용되지 않는 변수 선언 -> 제거
        self.eliminate_unreachable(&mut ir.nodes);
        self.eliminate_unused_vars(&mut ir.nodes);
        self.changed
    }

    fn changed(&self) -> bool { self.changed }
}

// 죽은 코드 제거의 효과:
// Before:  [Stmt1, If(false, Stmt2), Stmt3]
// After:   [Stmt1, Stmt3]
// Benefit: 바이트코드 크기 감소, 캐시 효율성 증가
```

#### 3. **Function Inlining** (함수 인라이닝)

```rust
/// 작은 함수를 호출 지점에 직접 삽입
struct InliningPass {
    changed: bool,
    inlining_threshold: usize,  // 몇 바이트까지 인라인할지
}

impl OptimizationPass for InliningPass {
    fn name(&self) -> &'static str { "Function Inlining" }

    fn run(&self, ir: &mut IntermediateRepresentation) -> bool {
        // 예: fn add(a, b) { a + b } 호출 -> a + b로 치환
        // 조건:
        // - 함수 크기 < threshold
        // - 호출 횟수가 적음
        // - 재귀 함수 아님
        self.inline_eligible_calls(&mut ir.nodes);
        self.changed
    }

    fn changed(&self) -> bool { self.changed }
}

// 함수 인라이닝의 효과:
// Before:  FunctionCall(add, [2, 3])
// After:   BinaryOp(Add, Literal(2), Literal(3))
// Benefit: 함수 호출 오버헤드 제거, Constant Folding과 조합 가능
```

#### 4. **Loop Unrolling** (루프 언롤링)

```rust
/// 작은 루프를 반복을 펼쳐서 실행
struct LoopUnroller {
    changed: bool,
    unroll_factor: usize,  // 몇 번 펼칠지
}

impl OptimizationPass for LoopUnroller {
    fn name(&self) -> &'static str { "Loop Unrolling" }

    fn run(&self, ir: &mut IntermediateRepresentation) -> bool {
        // 예: for i in 0..3 { sum += arr[i] }
        //     -> sum += arr[0]; sum += arr[1]; sum += arr[2];
        self.unroll_loops(&mut ir.nodes);
        self.changed
    }

    fn changed(&self) -> bool { self.changed }
}

// 루프 언롤링의 효과:
// Before:  While(i < 4, [Load(arr[i]), Add(sum, ...), i++])
// After:   [Load(arr[0]), Add, Load(arr[1]), Add, Load(arr[2]), Add, Load(arr[3]), Add]
// Benefit: 분기 명령어 감소, CPU 파이프라인 효율 증가
```

#### 5. **Copy Propagation** (복사 전파)

```rust
/// 불필요한 변수 복사를 제거
struct CopyPropagation {
    changed: bool,
}

impl OptimizationPass for CopyPropagation {
    fn name(&self) -> &'static str { "Copy Propagation" }

    fn run(&self, ir: &mut IntermediateRepresentation) -> bool {
        // 예: let x = y; z = x; -> z = y;
        // 복사 없이 직접 값 사용
        self.propagate_copies(&mut ir.nodes);
        self.changed
    }

    fn changed(&self) -> bool { self.changed }
}

// 복사 전파의 효과:
// Before:  VarAssign(x, VarRef(y)), VarAssign(z, VarRef(x))
// After:   VarAssign(z, VarRef(y))
// Benefit: 레지스터 압박 감소, 메모리 대역폭 절약
```

#### 6. **Common Subexpression Elimination** (공통 부분식 제거)

```rust
/// 동일한 계산을 반복하면 한 번만 수행
struct CommonSubexprElimination {
    changed: bool,
}

impl OptimizationPass for CommonSubexprElimination {
    fn name(&self) -> &'static str { "Common Subexpression Elimination" }

    fn run(&self, ir: &mut IntermediateRepresentation) -> bool {
        // 예: x = a + b; y = a + b; -> x = a + b; y = x;
        self.eliminate_redundant_exprs(&mut ir.nodes);
        self.changed
    }

    fn changed(&self) -> bool { self.changed }
}

// CSE의 효과:
// Before:  x = BinaryOp(Add, a, b); y = BinaryOp(Add, a, b);
// After:   x = BinaryOp(Add, a, b); y = VarRef(x);
// Benefit: 중복 계산 제거, CPU 사이클 절약
```

#### 7. **Tail Call Optimization** (꼬리 호출 최적화)

```rust
/// 함수의 마지막 연산이 함수 호출이면 점프로 변환
struct TailCallOptimizer {
    changed: bool,
}

impl OptimizationPass for TailCallOptimizer {
    fn name(&self) -> &'static str { "Tail Call Optimization" }

    fn run(&self, ir: &mut IntermediateRepresentation) -> bool {
        // 예: fn fib(n) { if n < 2 return n; return fib(n-1) + fib(n-2); }
        //     -> 재귀를 루프로 변환하거나 스택 프레임 재사용
        self.optimize_tail_calls(&mut ir.nodes);
        self.changed
    }

    fn changed(&self) -> bool { self.changed }
}

// 꼬리 호출 최적화의 효과:
// Before:  fn factorial(n, acc) { if n == 0 return acc; return factorial(n-1, n*acc); }
// After:   스택 프레임 재사용 → 스택 오버플로우 방지
// Benefit: 메모리 사용량 O(n) → O(1), 깊은 재귀 가능
```

---

## 🚀 Part 3: JIT 컴파일 기초

### JIT 아키텍처

```
┌─────────────────────────────┐
│   실행 중인 Bytecode        │
│   (Hot Path Detection)      │
└──────────┬──────────────────┘
           │ 자주 실행되는 부분 감지
           │ (Profile-Guided Optimization)
           ▼
┌─────────────────────────────┐
│  JIT Compilation Trigger    │
│  (호출 횟수 > threshold)    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Machine Code Generation    │
│  (LLVM 또는 Cranelift)      │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│   Machine Code 캐시         │
│   (Code Cache)              │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  고속 실행 (Native Speed)    │
└─────────────────────────────┘
```

### JIT 구현 구조

```rust
struct JITCompiler {
    code_cache: HashMap<u64, Box<[u8]>>,  // 컴파일된 기계어 캐시
    call_counts: HashMap<u64, usize>,     // 함수 호출 횟수
    jit_threshold: usize,                  // JIT 컴파일 임계값
}

impl JITCompiler {
    pub fn maybe_compile_hot_path(&mut self, func_id: u64, bytecode: &[u8]) {
        self.call_counts.entry(func_id).and_modify(|c| *c += 1).or_insert(1);

        // 임계값을 넘으면 JIT 컴파일
        if self.call_counts[&func_id] >= self.jit_threshold {
            if !self.code_cache.contains_key(&func_id) {
                let machine_code = self.compile_to_native(bytecode);
                self.code_cache.insert(func_id, machine_code);
                println!("[JIT] {} compiled to native code", func_id);
            }
        }
    }

    fn compile_to_native(&self, bytecode: &[u8]) -> Box<[u8]> {
        // LLVM 또는 Cranelift을 사용하여 기계어 생성
        // 이 단계에서 타겟 아키텍처 최적화 수행
        // - 레지스터 할당 (Register Allocation)
        // - 명령어 선택 (Instruction Selection)
        // - 스케줄링 (Scheduling)
        todo!()
    }
}
```

---

## 💾 Part 4: 데이터 레이아웃 최적화

### 메모리 레이아웃 설계

```rust
/// 구조체 필드를 CPU 캐시에 최적화하도록 재배치
#[derive(Debug, Clone, Copy)]
pub struct OptimizedLayout {
    // 핫(자주 접근)한 필드들을 먼저 배치
    // -> CPU 캐시라인(64바이트) 안에 들어올 확률 증가

    // 64바이트 캐시라인 #1
    hot_field_1: u64,      // 8 bytes
    hot_field_2: u32,      // 4 bytes
    hot_field_3: u32,      // 4 bytes
    hot_field_4: u64,      // 8 bytes
    hot_field_5: u64,      // 8 bytes
    hot_field_6: u64,      // 8 bytes
    hot_field_7: u32,      // 4 bytes
    padding_1: u32,        // 4 bytes (패딩)

    // 64바이트 캐시라인 #2
    cold_field_1: Vec<u64>,  // 콜드 필드는 나중에
    cold_field_2: String,
}

/// 메모리 접근 최적화
pub fn optimize_memory_layout<T>(data: &[T]) {
    // 1. 데이터 지역성 (Data Locality)
    //    - 함께 사용되는 데이터를 근처에 배치

    // 2. 정렬 최적화 (Alignment Optimization)
    //    - 8바이트 정렬로 로드/스토어 효율 증가

    // 3. 캐시라인 정렬 (Cache Line Alignment)
    //    - False sharing 방지
    //    - 64바이트 경계에 정렬
}
```

### NUMA 친화성 (NUMA-Aware)

```rust
/// 멀티소켓 시스템에서 메모리 접근 최적화
pub struct NUMAAwareAllocator {
    numa_nodes: Vec<MemoryNode>,
}

impl NUMAAwareAllocator {
    pub fn allocate_local(&self, thread_id: usize, size: usize) -> *mut u8 {
        // 현재 스레드가 실행 중인 NUMA 노드에서 메모리 할당
        // -> 원격 노드 접근보다 2~3배 빠름
        let node = self.numa_nodes[thread_id % self.numa_nodes.len()].clone();
        node.allocate(size)
    }
}
```

---

## 🛡️ Part 5: 안정성과 검증

### Fuzzing 테스트

```rust
/// 임의의 입력으로 컴파일러를 공격
pub struct FuzzerEngine {
    mutation_engine: MutationEngine,
    corpus: Vec<IRNode>,
    crash_reports: Vec<CrashReport>,
}

impl FuzzerEngine {
    pub fn run(&mut self, iterations: usize) {
        for _ in 0..iterations {
            // 1. 코퍼스에서 랜덤 입력 선택
            let mut input = self.corpus[rand::random::<usize>() % self.corpus.len()].clone();

            // 2. 돌연변이 생성
            self.mutation_engine.mutate(&mut input);

            // 3. 컴파일러 실행 (크래시 감지)
            match self.compile(&input) {
                Ok(bytecode) => {
                    // 성공하면 코퍼스에 추가
                    self.corpus.push(input);
                }
                Err(crash) => {
                    // 크래시 보고
                    self.crash_reports.push(crash);
                }
            }
        }
    }
}

pub struct CrashReport {
    input: IRNode,
    backtrace: Vec<String>,
    error_type: String,
}
```

### 정적 분석

```rust
/// 컴파일 시점에 버그를 찾아냄
pub struct StaticAnalyzer {
    rules: Vec<Box<dyn AnalysisRule>>,
}

trait AnalysisRule {
    fn check(&self, ir: &IntermediateRepresentation) -> Vec<AnalysisWarning>;
}

pub struct MemorySafetyRule;
impl AnalysisRule for MemorySafetyRule {
    fn check(&self, ir: &IntermediateRepresentation) -> Vec<AnalysisWarning> {
        // 메모리 안전성 위반 감지
        // - Use-after-free
        // - Double-free
        // - Buffer overflow
        // - Data race
        vec![]
    }
}

pub struct UnreachableCodeRule;
impl AnalysisRule for UnreachableCodeRule {
    fn check(&self, ir: &IntermediateRepresentation) -> Vec<AnalysisWarning> {
        // 도달 불가능한 코드 감지
        // - if (false) { ... }
        // - return; ... (죽은 코드)
        vec![]
    }
}

pub struct UndefinedBehaviorRule;
impl AnalysisRule for UndefinedBehaviorRule {
    fn check(&self, ir: &IntermediateRepresentation) -> Vec<AnalysisWarning> {
        // 정의되지 않은 동작 감지
        // - 정수 오버플로우
        // - 0으로 나누기
        // - 널 포인터 역참조
        vec![]
    }
}
```

---

## 🔗 Part 6: FFI (Foreign Function Interface)

### FFI 설계

```rust
/// 외부 함수(C/Rust) 호출을 위한 FFI 게이트웨이
pub struct FFIBinding {
    library_path: String,
    functions: HashMap<String, FFIFunction>,
}

pub struct FFIFunction {
    name: String,
    arg_types: Vec<Type>,
    return_type: Type,
    calling_convention: CallingConvention,
    safety_level: SafetyLevel,
}

pub enum CallingConvention {
    C,        // C ABI
    Rust,     // Rust ABI (안정화 전)
    StdCall,  // Windows stdcall
    FastCall, // 빠른 호출 규약
}

pub enum SafetyLevel {
    Safe,     // 안전한 호출 (메모리 안전 보장)
    Unsafe,   // 안전하지 않은 호출 (개발자 책임)
}

impl FFIBinding {
    pub fn declare_c_function(
        &mut self,
        name: &str,
        arg_types: Vec<Type>,
        return_type: Type,
    ) {
        self.functions.insert(
            name.to_string(),
            FFIFunction {
                name: name.to_string(),
                arg_types,
                return_type,
                calling_convention: CallingConvention::C,
                safety_level: SafetyLevel::Unsafe,
            },
        );
    }

    pub fn call_c_function(&self, name: &str, args: Vec<Value>) -> Value {
        // C 함수를 동적으로 호출
        // dlopen/dlsym을 사용하여 런타임에 바인딩
        todo!()
    }
}
```

### FFI 예제

```gogs
// C 라이브러리 바인딩
import_c_library("libc");

// C 함수 선언
extern "C" {
    fn printf(format: *const u8, args: ...) -> i32;
    fn malloc(size: usize) -> *mut void;
    fn free(ptr: *mut void);
}

fn main() {
    // C의 printf 호출
    unsafe {
        printf(c"Hello from FFI!\n");
    }
}
```

---

## 🎯 Part 7: 설계자의 관점

### 1. 성능과 정확성의 균형

```
성능 우선 전략:
├── 컴파일 타임 최적화 (느리지만 안전함)
│   └── IR 최적화 패스 반복
│
├── 런타임 최적화 (빠르지만 비용이 큼)
│   └── JIT 컴파일 (핫팟 감지 후)
│
└── 점진적 성능 향상
    └── 프로파일 기반 최적화 (Profile-Guided Optimization)
```

### 2. 안정성 전략

```
다층 방어:
1️⃣ 개발 시점
   - 정적 분석 (정의되지 않은 동작 감지)
   - 타입 체크 (타입 안전성)

2️⃣ 컴파일 시점
   - 린트 (코딩 스타일 검사)
   - 퍼징 (무작위 입력)

3️⃣ 실행 시점
   - 메모리 산타이저 (Memory Sanitizer)
   - 스레드 산타이저 (ThreadSanitizer)
   - 언더플로우/오버플로우 검사
```

### 3. 확장성 전략

```
새로운 최적화 추가 시:
1. OptimizationPass 트레이트 구현
2. OptimizationEngine에 추가
3. 테스트 작성
4. 성능 벤치마크

→ 플러그인 아키텍처처럼 쉽게 확장 가능
```

---

## 🌍 Part 8: 생태계 통합

### 멀티스레딩 지원

```rust
/// async/await와 병렬 런타임
pub struct AsyncRuntime {
    executor: Arc<Executor>,
    work_queue: MpscQueue<Task>,
    worker_threads: Vec<WorkerThread>,
}

impl AsyncRuntime {
    pub async fn run_concurrent<F>(&self, tasks: Vec<F>)
    where
        F: Future + Send + 'static,
    {
        // 여러 작업을 동시에 실행
        // - 가벼운 스레드(Goroutine 스타일)
        // - 비동기 I/O
        // - CPU 바운드 병렬화
    }
}
```

### LSP (Language Server Protocol)

```rust
/// VS Code 등의 에디터와 통신
pub struct LanguageServer {
    analyzer: SemanticAnalyzer,
    index: SymbolIndex,
}

impl LanguageServer {
    pub fn on_completion(&self, file: &str, line: usize, col: usize) -> Vec<CompletionItem> {
        // 자동 완성 제공
        self.analyzer.get_completions_at(file, line, col)
    }

    pub fn on_hover(&self, file: &str, line: usize, col: usize) -> Option<HoverInfo> {
        // 호버 정보 제공
        self.analyzer.get_type_info_at(file, line, col)
    }

    pub fn on_definition(&self, file: &str, line: usize, col: usize) -> Option<Location> {
        // 정의로 이동
        self.analyzer.find_definition(file, line, col)
    }
}
```

---

## 📊 v18.0 완성 체크리스트

```
✅ IR 설계
   └── IRNode enum, 타입 정보, 메타데이터

✅ 최적화 패스 (7가지)
   ├── Constant Folding
   ├── Dead Code Elimination
   ├── Function Inlining
   ├── Loop Unrolling
   ├── Copy Propagation
   ├── Common Subexpression Elimination
   └── Tail Call Optimization

✅ JIT 컴파일 기초
   └── Hot path detection, 코드 캐시, 동적 컴파일

✅ 데이터 레이아웃 최적화
   └── 캐시라인 정렬, NUMA 친화성

✅ 안정성 검증
   ├── Fuzzing 엔진
   ├── 정적 분석 (3가지 규칙)
   └── 메모리 안전성

✅ FFI 통합
   └── C/Rust 라이브러리 호출

✅ 생태계 확장
   ├── 비동기 런타임
   └── LSP 구현
```

---

## 🚀 다음 단계: v19.0

### v19.0 공식 릴리즈 및 유지보수

```
1. 버전 관리 (Semantic Versioning)
   - v18.0.0 안정화
   - 장기 지원(LTS) 정책

2. 버그 수정 및 보안 패치
   - CVE 대응
   - 성능 회귀 방지

3. 커뮤니티 피드백 수집
   - 이슈 트래킹
   - RFC (Request for Comments)

4. 문서화 및 교육
   - 공식 튜토리얼
   - 성능 가이드
   - FFI 예제
```

---

## 🎓 결론

> **v18.0은 "작동하는 언어"에서 "프로덕션 언어"로의 전환점입니다.**

### 세 가지 약속
1. **성능**: 최적화 패스로 C와 견줄 수 있는 성능
2. **안정성**: 퍼징과 정적 분석으로 버그 원천 차단
3. **확장성**: FFI와 LSP로 기존 생태계와 통합

### 철학
```
"낭비 없는 실행 (Zero-Waste Execution)"

프로그래머는 의도를 명확히 표현하고,
컴파일러는 그 의도를 최대한 효율적으로 구현한다.
불필요한 계산, 메모리, 복사는 철저히 제거한다.
그 결과가 가장 빠르고 견고한 언어가 된다.
```

---

**작성일**: 2026-02-23
**철학**: "낭비 없는 실행 (Zero-Waste Execution)"
**슬로건**: "가장 빠르고 견고한 언어"
**기록이 증명이다 gogs**

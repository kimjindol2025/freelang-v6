## 제10장: 객체 지향과 패턴 — Step 5 (진정한 마지막 단계)
## v11.4 트레이트 기반 플러그인과 안티 패턴 방어 (Plugin Architecture)

### 철학: "개방-폐쇄 원칙(OCP)의 실현"

**확장성의 핵심**

```text
구성: 시스템은 핵심 엔진과 플러그인으로 이루어짐

열려있음(Open)
  └─ 새로운 기능 추가에 열려있음
  └─ 외부에서 플러그인 제작 가능
  └─ 엔진 코드 수정 불필요

닫혀있음(Closed)
  └─ 핵심 엔진은 건드리지 않음
  └─ 기존 기능 변경 없음
  └─ 안정성 보장

이것이 확장 가능한 시스템의 근본입니다.
```

---

## 1. 개방-폐쇄 원칙 (Open/Closed Principle)

### 1.1 원칙의 정의

```text
Software entities (modules, classes, functions, etc.)
should be OPEN for extension,
but CLOSED for modification.

신규 기능 추가 시 기존 코드를 수정하지 말 것.
```

### 1.2 문제: 원칙을 무시한 설계

```rust
// ❌ 나쁜 설계: 새 기능 추가 시 핵심 코드 수정 필요
struct SecurityEngine {
    use_virus_scanner: bool,
    use_sql_defender: bool,
    use_malware_detector: bool,
}

impl SecurityEngine {
    fn scan(&self, data: &str) -> bool {
        let mut result = true;

        if self.use_virus_scanner {
            result = result && !data.contains("VIRUS");
        }
        if self.use_sql_defender {
            result = result && !data.contains("SELECT");
        }
        if self.use_malware_detector {
            result = result && !data.contains("MALWARE");
        }

        result
    }
}

// 새로운 보안 검사 추가 시: 위 코드를 수정해야 함!
// → 기존 테스트 깨질 가능성
// → 버그 발생 가능성 증가
```

### 1.3 해결책: 트레이트 기반 플러그인

```rust
// ✅ 좋은 설계: 트레이트로 확장성 보장
trait SecurityPlugin {
    fn name(&self) -> &str;
    fn scan(&self, data: &str) -> bool;
}

struct SecurityEngine {
    plugins: Vec<Box<dyn SecurityPlugin>>,
}

impl SecurityEngine {
    fn add_plugin(&mut self, plugin: Box<dyn SecurityPlugin>) {
        self.plugins.push(plugin);
    }

    fn run_all_scans(&self, data: &str) -> bool {
        self.plugins.iter().all(|p| p.scan(data))
    }
}

// 새로운 보안 검사 추가 시: SecurityPlugin 구현만 하면 됨!
// → 핵심 엔진 코드 수정 불필요
// → 기존 기능 영향 없음
```

---

## 2. 트레이트 바운드 상속

### 2.1 기본 트레이트

```rust
trait SecurityPlugin {
    fn name(&self) -> &str;
    fn scan(&self, data: &str) -> bool;
}
```

### 2.2 확장된 트레이트 (Super Trait)

```rust
// SecurityPlugin의 모든 기능 + 추가 기능
trait AdvancedSecurityPlugin: SecurityPlugin {
    fn severity(&self) -> u8;
    fn report(&self) -> String;
}

// AdvancedSecurityPlugin을 구현하려면 먼저 SecurityPlugin을 구현해야 함
struct AdvancedScanner;

impl SecurityPlugin for AdvancedScanner {
    fn name(&self) -> &str { "Advanced Scanner" }
    fn scan(&self, data: &str) -> bool { true }
}

impl AdvancedSecurityPlugin for AdvancedScanner {
    fn severity(&self) -> u8 { 5 }
    fn report(&self) -> String { "Full report".into() }
}
```

### 2.3 깊은 계층화 피하기

```rust
// ❌ 피해야 할 패턴: 깊은 상속 계층
trait A { }
trait B: A { }
trait C: B { }
trait D: C { }
trait E: D { }
// 이해하기 어렵고 유지보수 어려움

// ✅ 올바른 패턴: 수평적 구성
trait SecurityPlugin { }
trait ReportingCapability { }
trait CachingCapability { }

// 필요한 기능을 조합
trait FullFeaturedPlugin: SecurityPlugin + ReportingCapability + CachingCapability { }
```

---

## 3. Blanket Implementation (포괄적 구현)

### 3.1 개념: 조건을 만족하는 모든 타입에 자동 적용

```rust
// 기본 trait
trait SecurityPlugin {
    fn name(&self) -> &str;
    fn scan(&self, data: &str) -> bool;
}

// Blanket Implementation: SecurityPlugin을 구현한 모든 T에 대해
impl<T: SecurityPlugin> std::fmt::Debug for T {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "Plugin({})", self.name())
    }
}

// 이제 SecurityPlugin을 구현한 모든 타입은 자동으로 Debug도 구현됨!
struct MyScanner;
impl SecurityPlugin for MyScanner {
    fn name(&self) -> &str { "MyScanner" }
    fn scan(&self, data: &str) -> bool { true }
}

// 자동으로 Debug 사용 가능
println!("{:?}", MyScanner);  // Plugin(MyScanner)
```

### 3.2 실전 예제: 로깅 기능

```rust
// 모든 SecurityPlugin에 자동으로 로깅 추가
trait Loggable: SecurityPlugin {
    fn log_scan(&self, data: &str, result: bool) {
        println!("  [LOG] {} scanned: {}", self.name(), result);
    }
}

// Blanket: SecurityPlugin을 구현한 모든 타입이 Loggable도 구현됨
impl<T: SecurityPlugin> Loggable for T { }
```

---

## 4. 안티 패턴 방어

### 4.1 안티패턴 1: Deep Hierarchy

```rust
// ❌ 피해야 할 패턴
trait Plugin { }
trait SecurityPlugin: Plugin { }
trait AdvancedSecurityPlugin: SecurityPlugin { }
trait AnalyticsPlugin: AdvancedSecurityPlugin { }
trait ReportingPlugin: AnalyticsPlugin { }

// 이유:
// - 이해하기 어려움
// - 변경 시 영향 범위 크고 불명확
// - 재사용성 낮음

// ✅ 올바른 패턴: 수평적 조합
trait Plugin { }
trait SecurityFeature { }
trait AnalyticsFeature { }
trait ReportingFeature { }

// 필요한 것만 조합
struct MyPlugin;
impl Plugin for MyPlugin { }
impl SecurityFeature for MyPlugin { }
impl AnalyticsFeature for MyPlugin { }
```

### 4.2 안티패턴 2: 강한 결합

```rust
// ❌ 나쁜 설계: 구체적인 타입에 의존
struct SecurityEngine {
    virus_scanner: VirusScanner,
    sql_defender: SqlDefender,
    malware_detector: MalwareDetector,
}

// 새로운 스캔 타입 추가 시 모두 수정 필요

// ✅ 좋은 설계: 트레이트에만 의존
struct SecurityEngine {
    plugins: Vec<Box<dyn SecurityPlugin>>,
}

// 새로운 타입 추가 시 아무것도 수정할 필요 없음
```

### 4.3 안티패턴 3: 기본 메서드 무시

```rust
// ❌ 나쁜 설계
trait Plugin {
    fn initialize(&self);
    fn run(&self);
    fn cleanup(&self);
}

// 모든 구현자가 세 메서드를 다 구현해야 함
// 많은 중복 코드 발생

// ✅ 좋은 설계: 기본 구현 제공
trait Plugin {
    fn initialize(&self) {
        println!("Default initialization");
    }

    fn run(&self);

    fn cleanup(&self) {
        println!("Default cleanup");
    }
}

// 구현자는 run()만 구현하면 됨
struct MyPlugin;
impl Plugin for MyPlugin {
    fn run(&self) {
        println!("Running MyPlugin");
    }
    // initialize, cleanup은 기본 구현 사용
}
```

---

## 5. 의존성 주입 (Dependency Injection)

### 5.1 정의

```text
객체가 필요한 의존성을 "직접 생성"하지 않고,
"외부에서 주입받음"으로써 결합도를 낮추는 패턴.
```

### 5.2 구성자 주입 (Constructor Injection)

```rust
struct SecurityEngine {
    plugins: Vec<Box<dyn SecurityPlugin>>,
}

impl SecurityEngine {
    // 주입: 외부에서 plugins를 받음
    fn new(plugins: Vec<Box<dyn SecurityPlugin>>) -> Self {
        SecurityEngine { plugins }
    }
}

// 사용
let plugins: Vec<Box<dyn SecurityPlugin>> = vec![
    Box::new(VirusScanner),
    Box::new(SqlDefender),
];
let engine = SecurityEngine::new(plugins);
```

### 5.3 Setter 주입

```rust
impl SecurityEngine {
    fn new() -> Self {
        SecurityEngine { plugins: vec![] }
    }

    // 주입: add_plugin 메서드로 의존성 추가
    fn add_plugin(&mut self, plugin: Box<dyn SecurityPlugin>) {
        self.plugins.push(plugin);
    }
}

// 사용
let mut engine = SecurityEngine::new();
engine.add_plugin(Box::new(VirusScanner));
engine.add_plugin(Box::new(SqlDefender));
```

---

## 6. 확장성 있는 설계의 원칙

### 6.1 핵심 설계 원칙

```text
1. 추상화에 의존하라
   └─ 구체적 타입 X
   └─ 트레이트 O

2. 인터페이스를 명확히 하라
   └─ 플러그인이 구현할 메서드 명시
   └─ 기본 구현 제공

3. 결합도를 낮춰라
   └─ 엔진과 플러그인은 느슨하게 결합
   └─ 의존성 주입 활용

4. 계층을 평평하게 유지하라
   └─ Deep Hierarchy 피하기
   └─ 수평적 조합 선호

5. 변경에 닫혀있고 확장에 열려있어라
   └─ 핵심 로직 수정 X
   └─ 새 기능 추가 O
```

### 6.2 플러그인 작성자 관점

```rust
// 플러그인 작성은 매우 간단함
struct MySecurityCheck;

impl SecurityPlugin for MySecurityCheck {
    fn name(&self) -> &str { "MyCheck" }
    fn scan(&self, data: &str) -> bool {
        // 자신의 검사 로직만 구현
        !data.contains("DANGER")
    }
}

// 엔진에 추가
engine.add_plugin(Box::new(MySecurityCheck));

// 끝! 엔진 코드 수정 없음
```

---

## 7. 실전 사례: 컴파일러 플러그인

### 다음 제11장에서 구현할 컴파일러

```text
[Compiler Core]
├─ Lexer
├─ Parser
└─ Analyzer

[Plugins]
├─ OptimizationPlugin
├─ WarningPlugin
├─ FormatterPlugin
└─ ... (새로운 플러그인 자유롭게 추가)

엔진 코드 수정 없이 기능 확장 가능!
```

---

## 8. 안티 패턴 체크리스트

```text
☐ Deep Hierarchy? (3단계 이상의 Trait 상속)
☐ Concrete Type Dependency? (트레이트 대신 구체 타입 사용)
☐ Default Implementation 무시? (중복 코드 다수)
☐ Plugin API 불명확? (플러그인 개발자 혼란)
☐ 엔진 코드 수정 필요? (설계 재검토)

하나라도 YES면 설계를 다시 생각하세요.
```

---

## 9. 러스트의 장점: 트레이트 객체

```rust
// 다른 언어에서는 복잡한 Reflection이 필요
// 러스트는 트레이트 객체로 간단하게!

// Java 느낌 코드 (복잡)
if (obj instanceof SecurityPlugin) {
    ((SecurityPlugin) obj).scan(data);
}

// 러스트 코드 (간단)
let plugin: Box<dyn SecurityPlugin> = ...;
plugin.scan(data);
```

---

## 10. 당신의 최종 성과: 11단계 완성

```
제10장: 객체 지향과 패턴 — 5단계 완성

v11.0: Trait Objects (동적 다형성)
  └─ 서로 다른 타입을 하나로 다루기

v11.1: State Pattern (런타임 상태)
  └─ 상태 변화의 캡슐화

v11.2: Type State (타입 상태)
  └─ 컴파일 타임 안전성

v11.3: Pattern Matching (표현력)
  └─ 복잡한 데이터 분해

v11.4: Plugin Architecture (확장성) ⭐
  └─ 무한한 확장성과 유지보수성

당신은 이제 '설계자'입니다.
다음: 당신이 '컴파일러 설계자'가 되는 시간입니다.
```

---

## 다음 단계: 제11장 언세이프와 메모리

이제 당신은:
- 안전한 설계를 할 수 있고
- 확장 가능한 시스템을 구축할 수 있습니다

다음: 당신이 **컴파일러 그 자체**를 만드는 여정이 시작됩니다.

# v13.0.2: 재귀적 매크로와 복잡한 DSL 설계
# 제12장: 매크로와 메타 프로그래밍 — Step 1.2

## 철학: "매크로 안에서 자신을 호출하여 복잡한 구조를 자동 생성"

```
v13.0: "간단한 패턴을 코드로 변환"
v13.0.2: "복잡한 구조를 재귀적으로 생성" ← 현재

재귀적 매크로: 자신을 다시 호출하여
- 트리 구조 자동 생성
- 복잡한 DSL 파싱
- 중첩된 데이터 처리
- 컴파일 타임 계산 가능
```

---

## 📚 목차

1. [재귀적 매크로 기초](#1-재귀적-매크로-기초)
2. [기저 사례와 재귀 사례](#2-기저-사례와-재귀-사례)
3. [DSL: SQL-like 쿼리 빌더](#3-dsl-sql-like-쿼리-빌더)
4. [DSL: JSON-like 데이터 구조](#4-dsl-json-like-데이터-구조)
5. [DSL: 상태 기계(State Machine)](#5-dsl-상태-기계-state-machine)
6. [컴파일 타임 계산](#6-컴파일-타임-계산)
7. [복잡한 중첩 구조](#7-복잡한-중첩-구조)
8. [성능과 한계](#8-성능과-한계)

---

## 1. 재귀적 매크로 기초

### 1.1 재귀의 개념

```rust
// 반복 (v13.0의 방식)
vec![1, 2, 3]

// 재귀 (v13.0.2의 방식)
tree![
    1
    ├─ 2
    │  ├─ 4
    │  └─ 5
    └─ 3
]
```

### 1.2 기저 사례와 재귀 사례

```rust
macro_rules! factorial {
    // 기저 사례: 0! = 1
    (0) => {
        1
    };
    // 재귀 사례: n! = n * (n-1)!
    ($n:expr) => {
        $n * factorial!($n - 1)
    };
}

// 사용
factorial!(5)  // 5 * 4 * 3 * 2 * 1 * 1
```

### 1.3 재귀 깊이 제한

```
매크로 재귀 깊이 기본 제한: 128

초과하면 컴파일 에러:
    "recursion limit exceeded"

제어하기:
    #![recursion_limit = "256"]
```

### 1.4 중요: 컴파일 타임 재귀

```
매크로는 "컴파일 시간"에 확장됨

예:
    factorial!(5)
    → 5 * factorial!(4)
    → 5 * (4 * factorial!(3))
    → 5 * (4 * (3 * factorial!(2)))
    → ... (컴파일 타임에 계산됨)
    → 120 (최종 코드)

장점: 런타임 오버헤드 없음 ✓
단점: 복잡하면 컴파일 시간 ↑
```

---

## 2. 기저 사례와 재귀 사례

### 2.1 패턴: 리스트 처리

```rust
macro_rules! sum_list {
    // 기저 사례: 빈 리스트
    () => {
        0
    };
    // 기저 사례: 마지막 원소
    ($last:expr) => {
        $last
    };
    // 재귀 사례: 여러 원소
    ($first:expr, $($rest:expr),+) => {
        $first + sum_list!($($rest),+)
    };
}

// 사용
sum_list!()        // 0
sum_list!(5)       // 5
sum_list!(1, 2, 3) // 1 + 2 + 3 = 6
```

### 2.2 패턴: 중첩 구조

```rust
macro_rules! nested {
    // 기저 사례: 단일 값
    ($e:expr) => {
        $e
    };
    // 재귀 사례: 그룹화
    (($($inner:tt)*)) => {
        group(nested!($($inner)*))
    };
}

// 사용
nested!(5)        // 5
nested!((5))      // group(5)
nested!(((5)))    // group(group(5))
```

### 2.3 디버깅 팁

```rust
// 매크로 확장 결과 확인
cargo expand

// 또는 컴파일러 출력으로 확인
rustc --pretty=expanded main.rs
```

---

## 3. DSL: SQL-like 쿼리 빌더

### 3.1 기본 SQL DSL

```rust
macro_rules! sql {
    // SELECT 문
    (select $($col:ident),+ from $table:ident) => {
        concat!("SELECT ", stringify!($($col),+), " FROM ", stringify!($table))
    };

    // SELECT ... WHERE
    (select $($col:ident),+ from $table:ident where $($cond:tt)+) => {
        concat!(
            "SELECT ", stringify!($($col),+),
            " FROM ", stringify!($table),
            " WHERE ", stringify!($($cond)+)
        )
    };
}

// 사용
sql!(select id, name from users);
// → "SELECT id, name FROM users"

sql!(select id, name from users where age > 18);
// → "SELECT id, name FROM users WHERE age > 18"
```

### 3.2 복잡한 SQL DSL (재귀)

```rust
macro_rules! query {
    // 기저: SELECT
    (SELECT $($col:ident),+) => {
        QueryBuilder {
            select: vec![$(stringify!($col)),+],
            ..Default::default()
        }
    };

    // SELECT ... FROM
    (SELECT $($col:ident),+ FROM $table:ident) => {
        query!(SELECT $($col),+)
            .from(stringify!($table))
    };

    // SELECT ... FROM ... WHERE
    (SELECT $($col:ident),+ FROM $table:ident WHERE $($cond:tt)+) => {
        query!(SELECT $($col),+ FROM $table)
            .where_(stringify!($($cond)+))
    };

    // SELECT ... FROM ... WHERE ... ORDER BY
    (SELECT $($col:ident),+ FROM $table:ident WHERE $($cond:tt)+ ORDER BY $order:ident) => {
        query!(SELECT $($col),+ FROM $table WHERE $($cond)+)
            .order_by(stringify!($order))
    };
}
```

### 3.3 JOIN 처리 (중첩 DSL)

```rust
macro_rules! join_query {
    // 기저: 단일 테이블
    ($table:ident) => {
        Table::new(stringify!($table))
    };

    // INNER JOIN
    ($left:ident INNER JOIN $right:ident ON $cond:tt) => {
        join_query!($left)
            .inner_join(
                join_query!($right),
                stringify!($cond)
            )
    };

    // LEFT JOIN
    ($left:ident LEFT JOIN $right:ident ON $cond:tt) => {
        join_query!($left)
            .left_join(
                join_query!($right),
                stringify!($cond)
            )
    };
}
```

---

## 4. DSL: JSON-like 데이터 구조

### 4.1 기본 JSON DSL

```rust
macro_rules! json {
    // null
    (null) => {
        serde_json::json!(null)
    };

    // 불린
    (true) => {
        serde_json::json!(true)
    };
    (false) => {
        serde_json::json!(false)
    };

    // 숫자
    ($n:expr) => {
        serde_json::json!($n)
    };

    // 문자열
    ($s:expr) => {
        serde_json::json!($s)
    };
}

// 사용
json!(null)
json!(42)
json!("hello")
```

### 4.2 객체와 배열 (재귀)

```rust
macro_rules! json_obj {
    // 빈 객체
    ({}) => {
        json!({})
    };

    // 단일 키-값
    ({ $key:ident: $val:tt }) => {
        json!({ stringify!($key): json!($val) })
    };

    // 여러 키-값 (재귀)
    ({ $key:ident: $val:tt, $($rest:tt)+ }) => {
        {
            let mut obj = json_obj!({ $key: $val });
            obj.merge(json_obj!({ $($rest)+ }));
            obj
        }
    };
}

macro_rules! json_arr {
    // 빈 배열
    ([]) => {
        json!([])
    };

    // 단일 원소
    ([$e:tt]) => {
        json!([$e])
    };

    // 여러 원소 (재귀)
    ([$e:tt, $($rest:tt),+]) => {
        {
            let mut arr = json_arr!([$e]);
            arr.extend(json_arr!([$($rest),+]));
            arr
        }
    };
}

// 사용
json_obj!({ name: "Alice", age: 30 })
json_arr!([1, 2, 3])
```

### 4.3 중첩된 JSON (심화)

```rust
macro_rules! json_nested {
    // 기저: 스칼라
    (null) => { Value::Null };
    (true) => { Value::Bool(true) };
    (false) => { Value::Bool(false) };
    ($n:expr) => { Value::Number($n) };

    // 배열: 재귀적으로 원소 처리
    ([$($e:tt),*]) => {
        Value::Array(vec![$(json_nested!($e)),*])
    };

    // 객체: 재귀적으로 키-값 처리
    ({$($key:ident: $val:tt),*}) => {
        {
            let mut map = serde_json::Map::new();
            $(
                map.insert(
                    stringify!($key).to_string(),
                    json_nested!($val)
                );
            )*
            Value::Object(map)
        }
    };
}

// 사용
json_nested!({
    name: "Alice",
    age: 30,
    hobbies: ["reading", "coding"],
    address: { city: "Seoul", zip: 12345 }
})
```

---

## 5. DSL: 상태 기계(State Machine)

### 5.1 기본 상태 기계

```rust
macro_rules! state_machine {
    // 상태 정의
    (states: $($state:ident),+) => {
        #[derive(Debug, Clone, Copy, PartialEq)]
        pub enum State {
            $($state),+
        }
    };

    // 전환 정의
    (transitions: $($from:ident -> $to:ident),+) => {
        impl State {
            pub fn next(self) -> Option<State> {
                match self {
                    $(State::$from => Some(State::$to)),+,
                    _ => None,
                }
            }
        }
    };
}

// 사용
state_machine!(states: Start, Running, Stopped);
state_machine!(transitions: Start -> Running, Running -> Stopped);
```

### 5.2 복잡한 상태 기계 (재귀)

```rust
macro_rules! fsm {
    // 기저: 단일 상태
    (state $name:ident) => {
        State::$name
    };

    // 전환: A → B
    ($from:ident => $to:ident) => {
        Transition {
            from: fsm!(state $from),
            to: fsm!(state $to),
        }
    };

    // 경로: A → B → C (재귀)
    ($from:ident => $mid:ident => $($rest:tt)+) => {
        {
            let first = fsm!($from => $mid);
            let rest = fsm!($mid => $($rest)+);
            Path::chain(first, rest)
        }
    };
}
```

### 5.3 이벤트 기반 상태 기계

```rust
macro_rules! event_machine {
    // 단일 이벤트
    (on $event:ident: $action:expr) => {
        EventHandler {
            event: Event::$event,
            action: Box::new($action),
        }
    };

    // 여러 이벤트 (재귀)
    (on $event:ident: $action:expr; $($rest:tt)+) => {
        {
            let handler = event_machine!(on $event: $action);
            let rest = event_machine!($($rest)+);
            vec![handler]
                .into_iter()
                .chain(rest)
                .collect::<Vec<_>>()
        }
    };
}
```

---

## 6. 컴파일 타임 계산

### 6.1 피보나치 수열

```rust
macro_rules! fib {
    // 기저 사례
    (0) => { 0 };
    (1) => { 1 };

    // 재귀 사례
    ($n:expr) => {
        fib!($n - 1) + fib!($n - 2)
    };
}

// 사용
let f5 = fib!(5);  // 컴파일 타임에 5로 계산됨
// 출력 코드: let f5 = 5;
```

### 6.2 팩토리얼

```rust
macro_rules! fact {
    (0) => { 1 };
    ($n:expr) => {
        $n * fact!($n - 1)
    };
}

// 사용
fact!(5)  // 120 (컴파일 타임에 계산)
```

### 6.3 거듭제곱

```rust
macro_rules! pow {
    // 기저: 지수가 0
    ($base:expr, 0) => {
        1
    };
    // 기저: 지수가 1
    ($base:expr, 1) => {
        $base
    };
    // 재귀: 지수 감소
    ($base:expr, $exp:expr) => {
        $base * pow!($base, $exp - 1)
    };
}

// 사용
pow!(2, 10)  // 1024 (컴파일 타임에)
```

---

## 7. 복잡한 중첩 구조

### 7.1 트리 생성

```rust
macro_rules! tree {
    // 기저: 리프
    ([$e:expr]) => {
        TreeNode::Leaf($e)
    };

    // 노드: 자식 재귀 처리
    ([$e:expr, $($children:tt),+]) => {
        TreeNode::Node {
            value: $e,
            children: vec![
                $(tree!($children)),+
            ],
        }
    };
}

// 사용
tree!([1])                    // Leaf(1)
tree!([1, [2], [3, [4]]])    // Node with children
```

### 7.2 그래프 생성

```rust
macro_rules! graph {
    // 기저: 단일 노드
    ($node:expr) => {
        Graph::with_node($node)
    };

    // 간선: A -> B
    ($a:ident -> $b:ident) => {
        Edge { from: $a, to: $b }
    };

    // 경로: A -> B -> C (재귀)
    ($from:ident -> $to:ident -> $($rest:ident),+) => {
        {
            let edge1 = graph!($from -> $to);
            let edges = graph!($to -> $($rest),+);
            edges.prepend(edge1)
        }
    };
}
```

### 7.3 AST 생성

```rust
macro_rules! ast {
    // 기저: 리터럴
    (lit $n:expr) => {
        Expr::Lit($n)
    };

    // 이항 연산
    ($left:expr + $right:expr) => {
        Expr::BinOp {
            op: Op::Add,
            left: Box::new(ast!($left)),
            right: Box::new(ast!($right)),
        }
    };

    // 복합 식 (재귀)
    (($($inner:tt)+)) => {
        ast!($($inner)+)
    };
}

// 사용
ast!(lit 5)              // Lit(5)
ast!(lit 3 + lit 2)      // BinOp(+, Lit(3), Lit(2))
```

---

## 8. 성능과 한계

### 8.1 컴파일 시간 영향

```
문제: 깊은 재귀 → 컴파일 시간 ↑

재귀 깊이: 10  → 빠름 (~1ms)
재귀 깊이: 50  → 보통 (~100ms)
재귀 깊이: 100 → 느림 (~1s)
재귀 깊이: 128+ → 컴파일 에러
```

### 8.2 최적화 기법

```rust
// 꼬리 재귀 (Tail Recursion) 패턴
macro_rules! tail_recursive {
    // 기저: 누적자 반환
    ($acc:expr) => {
        $acc
    };

    // 재귀: 누적자 갱신
    ($acc:expr, $x:expr, $($rest:expr),*) => {
        tail_recursive!($acc + $x, $($rest),*)
    };
}
```

### 8.3 한계와 제약

```
한계:
- 상수 계산만 가능 (변수 계산 불가)
- 루프 구조 제한
- 타입 정보 손실
- 디버깅 어려움

대안:
- 절차적 매크로 (proc-macro) 사용
- 빌드 스크립트 활용
- 제너릭 메타프로그래밍
```

---

## 핵심 개념 요약

### 재귀적 매크로의 3가지 요소

| 요소 | 설명 | 예 |
|------|------|-----|
| 기저 사례 | 종료 조건 | `(0) => { 1 }` |
| 재귀 사례 | 자기 호출 | `macro!($n - 1)` |
| 진행 | 재귀 깊이 감소 | 매번 인자 감소 |

### DSL 설계 패턴

```rust
// 패턴 1: 중첩 구조
macro_rules! nested {
    (($inner:tt)) => { nest(nested!($inner)) };
}

// 패턴 2: 리스트 처리
macro_rules! process_list {
    ($first:expr, $($rest:expr),+) => {
        process!($first);
        process_list!($($rest),+)
    };
}

// 패턴 3: 계층 구조
macro_rules! hierarchy {
    ($root:expr { $($child:tt)* }) => {
        Node {
            value: $root,
            children: vec![$(hierarchy!($child))],
        }
    };
}
```

### 컴파일 시간 vs 런타임

```
매크로 (컴파일 타임):
✓ 오버헤드 없음
✓ 최적화 가능
✗ 상수만 계산
✗ 느린 컴파일

함수 (런타임):
✓ 동적 값 처리
✓ 빠른 컴파일
✗ 런타임 오버헤드
```

---

## 다음 단계

```
v13.0.2: 재귀적 매크로와 DSL
├─ 재귀 패턴 마스터
├─ SQL-like DSL 설계
├─ JSON-like DSL 구현
├─ 상태 기계 DSL
└─ 컴파일 타임 계산

v13.1: 절차적 매크로 (proc-macro)
├─ derive 매크로
├─ 속성 매크로
├─ 함수형 매크로
└─ 완전한 메타프로그래밍
```

---

## 요약

```
v13.0.2: 재귀적 매크로와 복잡한 DSL 설계

철학: "매크로 안에서 자신을 호출하여
       복잡한 구조를 자동으로 생성"

핵심 기능:
✅ 재귀적 매크로 정의
✅ 기저 사례와 재귀 사례 구분
✅ SQL-like DSL 설계
✅ JSON-like DSL 구현
✅ 상태 기계 DSL
✅ 컴파일 타임 계산
✅ 트리/그래프 생성
✅ AST 구성

역할:
→ 복잡한 구조 자동 생성
→ DSL 구현과 파싱
→ 컴파일 타임 메타프로그래밍
→ 보일러플레이트 제거

당신은 매크로의 진정한 마법사가 될 것입니다.
```

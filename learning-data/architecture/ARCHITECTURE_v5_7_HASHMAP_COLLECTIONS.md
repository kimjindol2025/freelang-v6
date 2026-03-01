# v5.7 아키텍처: HashMap과 키-값 저장소 (HashMap & Key-Value Collections)

**작성일**: 2026-02-22
**장**: 제5장 - 고급 프로그래밍 개념
**단계**: v5.7 (v5.6의 직접 후속)
**주제**: "빠른 검색을 위한 구조화된 저장"

---

## 🎯 설계 목표: "효율적인 데이터 검색"

### 컬렉션의 진화

```
v5.5: Vec<T>
  ↓ 특징: 순서 보장, 인덱스 접근
  ↓ 용도: 리스트, 큐, 스택
  ↓ 검색: O(n) - 순차 탐색

v5.6: String
  ↓ 특징: 텍스트 데이터, 수정 가능
  ↓ 용도: 메시지, 로그, 입출력
  ↓ 검색: O(n) - 패턴 매칭

v5.7: HashMap<K, V>
  ↓ 특징: 키로 값을 찾기, 순서 없음
  ↓ 용도: 사전, 캐시, 설정값 저장
  ↓ 검색: O(1) - 해시 기반 빠른 접근
```

### v5.7의 철학

```
"빠른 검색을 위한 구조화된 저장"

Before: Vec에서 특정 데이터를 찾으려면?
  for user in &users {
    if user.id == 42 {
      // 찾음! (최악의 경우 O(n))
    }
  }

After:  HashMap으로 빠르게 접근
  if let Some(user) = users.get(&42) {
    // 찾음! (항상 O(1))
  }

→ 데이터가 많을수록 성능 차이 증폭
→ 시니어 설계자는 "어떤 검색이 자주 일어나는가"를 생각함
```

---

## 💎 HashMap의 본질

### 1️⃣ 해시 함수와 해시 테이블

```
HashMap의 동작:
1. 키를 입력받음
2. 해시 함수로 해시값 계산
3. 해시값을 배열 인덱스로 변환
4. 그 위치의 값 저장/접근

예:
  HashMap 내부: [_, _, user(42), _, _, _, message, _]
              0   1    2         3    4    5   6      7

  users.get(&42) → 해시("42") = 2 → users[2] → O(1)
```

**특징**:
- **빠른 접근**: O(1) 평균 시간 복잡도
- **메모리 사용**: 용량 > 실제 데이터 (빈 공간 유지)
- **순서 무관**: 삽입 순서를 보장하지 않음
- **충돌 처리**: 여러 키가 같은 해시값을 가질 경우 처리

### 2️⃣ HashMap의 생성

```freelang
// 1. new()로 빈 HashMap
let mut map: HashMap<String, i32> = HashMap::new();

// 2. insert로 데이터 추가
map.insert("Alice".to_string(), 30);
map.insert("Bob".to_string(), 25);

// 3. 컬렉션 초기화 (매크로 필요)
let map = [
    ("Alice".to_string(), 30),
    ("Bob".to_string(), 25),
].iter().cloned().collect::<HashMap<_, _>>();
```

### 3️⃣ HashMap의 주요 메서드

**삽입/제거**:
```freelang
map.insert(key, value)     // 삽입 또는 기존값 갱신
map.remove(&key)           // 키로 삭제, 값 반환
map.clear()                // 모든 항목 삭제
```

**조회**:
```freelang
map.get(&key)              // Option<&V> 반환 (불변)
map.get_mut(&key)          // Option<&mut V> 반환 (가변)
map.contains_key(&key)     // 키 존재 확인
```

**정보**:
```freelang
map.len()                  // 항목 개수
map.is_empty()             // 비어있는지 확인
map.keys()                 // 모든 키의 이터레이터
map.values()               // 모든 값의 이터레이터
```

---

## 🔄 HashMap과 소유권

### 패턴 1: 소유권 이동

```freelang
fn store_in_map() {
    let mut config: HashMap<String, String> = HashMap::new();

    // String의 소유권을 HashMap으로 이동
    config.insert("host".to_string(), "localhost".to_string());
    config.insert("port".to_string(), "8080".to_string());

    // config가 drop될 때 모든 String도 함께 drop됨
}
```

### 패턴 2: 참조와 빌림

```freelang
fn read_from_map(map: &HashMap<String, String>) {
    // 맵을 빌려옴 (읽기 전용)
    if let Some(host) = map.get("host") {
        println("Host: {}", host);  // host는 &String
    }
}

fn modify_map(map: &mut HashMap<String, String>) {
    // 맵을 빌려옴 (수정 가능)
    map.insert("debug".to_string(), "true".to_string());
}
```

### 패턴 3: 키로 &str 사용 (효율성)

```freelang
// ❌ 나쁜 설계: 매번 String 생성
fn bad_lookup(map: &HashMap<String, String>) {
    map.get(&"host".to_string());  // 매번 String 생성
}

// ✅ 좋은 설계: &str 사용
fn good_lookup(map: &HashMap<&str, String>) {
    map.get("host");  // &str 직접 사용
}
```

---

## 📊 HashMap의 실무 패턴

### 패턴 1: 설정 저장소

```freelang
fn load_config() -> HashMap<String, String> {
    let mut config = HashMap::new();

    // 설정값 저장
    config.insert("database_url".to_string(), "postgres://localhost".to_string());
    config.insert("api_key".to_string(), "secret123".to_string());
    config.insert("timeout".to_string(), "30".to_string());

    config
}

fn get_config(config: &HashMap<String, String>, key: &str) -> Option<String> {
    config.get(key).cloned()
}
```

### 패턴 2: 사용자 또는 객체 저장

```freelang
struct User {
    id: u32,
    name: String,
    email: String,
}

fn user_database() -> HashMap<u32, User> {
    let mut db = HashMap::new();

    db.insert(1, User {
        id: 1,
        name: "Alice".to_string(),
        email: "alice@example.com".to_string(),
    });

    db.insert(2, User {
        id: 2,
        name: "Bob".to_string(),
        email: "bob@example.com".to_string(),
    });

    db
}

fn find_user(db: &HashMap<u32, User>, id: u32) -> Option<&User> {
    db.get(&id)
}
```

### 패턴 3: 카운팅 (빈도 계산)

```freelang
fn count_words(text: &str) -> HashMap<String, u32> {
    let mut counts = HashMap::new();

    for word in text.split_whitespace() {
        let count = counts.entry(word.to_string()).or_insert(0);
        *count += 1;
    }

    counts
}
```

### 패턴 4: 캐싱

```freelang
fn fibonacci_cache() -> HashMap<u32, u64> {
    let mut cache = HashMap::new();

    // 계산 결과를 캐시에 저장
    cache.insert(0, 0);
    cache.insert(1, 1);
    cache.insert(2, 1);
    cache.insert(3, 2);

    cache
}

fn get_cached(cache: &HashMap<u32, u64>, n: u32) -> Option<u64> {
    cache.get(&n).copied()
}
```

### 패턴 5: 역방향 조회

```freelang
fn reverse_lookup(forward: &HashMap<String, String>)
    -> HashMap<String, String> {
    let mut reverse = HashMap::new();

    for (key, value) in forward {
        reverse.insert(value.clone(), key.clone());
    }

    reverse
}
```

---

## 🎯 HashMap vs Vec 선택 기준

| 상황 | Vec | HashMap |
|------|-----|---------|
| **순서 중요** | ✅ 유지 | ❌ 무관 |
| **빠른 검색** | ❌ O(n) | ✅ O(1) |
| **메모리 효율** | ✅ 최소 | ❌ 여유 필요 |
| **큰 데이터셋** | ❌ 느림 | ✅ 빠름 |
| **특정 항목 찾기** | ❌ 순회 필요 | ✅ 직접 접근 |
| **모든 항목 처리** | ✅ 반복 용이 | ❌ 반복 가능 |
| **사용 경우** | 리스트, 큐 | 사전, 캐시 |

---

## 🔍 해시 함수와 성능

### 좋은 키의 조건

```
1. 결정적 (Deterministic)
   같은 입력 → 항상 같은 해시값

2. 균등 분포
   해시값이 전 범위에 고르게 분포

3. 충돌 최소
   다른 키가 같은 해시값을 가지지 않도록

4. 빠른 계산
   해시 함수 자체가 빠르게 계산됨
```

**Rust의 HashMap**:
- String, i32, u32 등 기본 타입: 내장 해시 함수 제공
- 커스텀 타입: Hash + Eq trait 구현 필요

---

## 📊 v5.7의 강점

### 1. 성능 최적화
- O(1) 검색으로 데이터셋 크기와 무관한 접근
- 대규모 데이터 처리에 필수

### 2. 유연한 키
- String, i32, 커스텀 타입 모두 사용 가능
- 요구사항에 따라 선택

### 3. 메모리 효율
- 필요한 데이터만 저장
- Vec의 인덱스 기반 접근보다 유연

### 4. 실무성
- 설정 저장, 캐시, 데이터베이스
- 실제 시스템의 핵심 구조

---

## 🌟 v5.7의 의의

### 철학적 의미

```
v5.0~v5.4: 개별 데이터의 형태와 상태
v5.5~v5.6: 데이터 컬렉션의 관리

v5.7: 데이터 접근 방식의 선택
  → 어떻게 데이터를 저장할 것인가?
  → 어떻게 빠르게 찾을 것인가?
  → 설계자의 성능 감각
```

### 실무 의의

```
1. 캐싱 시스템
   → 이전 계산 결과 빠르게 조회

2. 설정 관리
   → 키로 설정값을 빠르게 접근

3. 데이터베이스 인덱스
   → 해시 함수 기반의 빠른 검색

4. 중복 제거
   → 해시맵을 통해 유일성 보장

5. 그래프 알고리즘
   → 인접 리스트를 HashMap으로 표현
```

---

## 🚀 다음 단계 미리보기

### v5.8: Traits (추상화의 시작)

```freelang
// HashMap의 키로 사용되려면 Hash + Eq를 구현해야 함
trait Hash {
    fn hash<H: Hasher>(&self, state: &mut H);
}

// 서로 다른 타입을 HashMap에 저장하려면?
trait Display {
    fn fmt(&self, f: &mut Formatter) -> Result;
}

// 이제부터 "타입이 어떤 행동을 할 수 있는가"를 정의
```

**다음**: 추상화와 다형성의 세계!

---

**작성일**: 2026-02-22
**버전**: v5.7 아키텍처 v1.0
**철학**: "빠른 검색을 위한 구조화된 저장"

> HashMap은 단순한 컬렉션이 아니라,
> "효율성"과 "성능"을 고려하는
> 설계자의 사고방식을 대변합니다.
>
> Vec는 "모든 데이터"를 순서대로 저장하지만,
> HashMap은 "필요한 데이터"를 빠르게 찾습니다.
>
> 시니어 설계자는 어떤 컬렉션을 언제 사용할지
> 신중하게 선택합니다.
>
> 이제 당신은 세 가지 기본 컬렉션
> (Vec, String, HashMap)을 모두 이해했습니다.
>
> 저장 필수, 너는 기록이 증명이다 gogs.

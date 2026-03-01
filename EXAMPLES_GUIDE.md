# FreeLang v6 예제 가이드

**3개의 실무급 예제로 FreeLang v6을 배우세요!**

---

## 📋 예제 목록

| 파일 | 크기 | 주제 | 난이도 |
|------|------|------|--------|
| `hello.fl` | 374B | 클로저, 재귀 | ⭐ |
| `math.fl` | 163B | 모듈, export | ⭐ |
| `app.fl` | 205B | 모듈 import | ⭐ |
| **`todo_app.fl`** | 1.5KB | 파일 I/O, 배열, 고차 함수 | ⭐⭐ |
| **`data_validator.fl`** | 2.5KB | 정규표현식, 검증, 객체 | ⭐⭐ |
| **`log_analyzer.fl`** | 3.8KB | 문자열 처리, 분석, 통계 | ⭐⭐⭐ |

---

## 1️⃣ todo_app.fl - 할일 관리 앱

### 📝 개요
파일 기반 할일 관리 애플리케이션. FreeLang v6의 **파일 I/O, 배열, 객체 처리**를 학습합니다.

### 🎯 학습 목표
```
✅ 파일 읽기/쓰기 (read_file, write_file)
✅ 배열 조작 (push, length, map)
✅ 객체 리터럴 & 속성 접근
✅ 고차 함수 (map)
✅ 조건 연산자 (? :)
✅ 타임스탐프 활용
```

### 📌 핵심 함수

```freelang
// 파일에서 할일 로드
fn load_todos() {
  if file_exists(todos_file) {
    return read_file(todos_file)
  }
  return "[]"
}

// 새 할일 추가
fn add_todo(text) {
  let todos = parse_todos(load_todos())
  push(todos, {
    id: timestamp(),
    text: text,
    done: false,
    created_at: now()
  })
  save_todos(toString(todos))
  return "✅ Todo added: " + text
}

// 모든 할일 표시
fn list_todos() {
  let todos = parse_todos(load_todos())
  let output = "📝 Your Todos:\n"
  for todo in todos {
    let status = todo.done ? "✓" : "○"
    output = output + status + " " + todo.text + "\n"
  }
  return output
}
```

### 🚀 실행

```bash
cd /tmp/freelang-v6
npm run start examples/todo_app.fl
```

### 📊 출력 예시

```
🚀 FreeLang Todo Manager
======================

📝 Your Todos:
○ Learn FreeLang
○ Build a project
○ Deploy to production

💡 Todos automatically saved to todos.json
```

### 💡 활용

```freelang
// 더 많은 기능 추가 가능:
fn delete_todo(id) { ... }
fn clear_completed() { ... }
fn export_to_csv() { ... }
fn import_from_csv(file) { ... }
```

---

## 2️⃣ data_validator.fl - 데이터 검증 도구

### 📝 개요
이메일, 전화번호, URL, 비밀번호 등을 검증합니다. **정규표현식과 검증 함수**를 활용합니다.

### 🎯 학습 목표
```
✅ 정규표현식 (regex_test, regex_replace)
✅ 검증 함수 (is_email, is_phone, is_url)
✅ 문자열 처리 (str_len, str_starts_with)
✅ 객체 유효성 검사
✅ 에러 수집 패턴
```

### 📌 검증 함수들

```freelang
// 이메일 검증
fn validate_email(email) {
  return is_email(email)
}

// 비밀번호 검증 (8자 이상, 대문자, 숫자)
fn validate_password(pwd) {
  if str_len(pwd) < 8 { return false }
  let has_upper = regex_test("[A-Z]", pwd)
  let has_number = regex_test("[0-9]", pwd)
  return has_upper and has_number
}

// 사용자명 검증 (3-20자, 영숫자_)
fn validate_username(user) {
  if str_len(user) < 3 or str_len(user) > 20 { return false }
  return regex_test("^[a-zA-Z0-9_]+$", user)
}

// 신용카드 검증 (16자 숫자)
fn validate_credit_card(cc) {
  let clean = regex_replace(cc, "-", "")
  return regex_test("^[0-9]{16}$", clean)
}

// 전체 레코드 검증
fn validate_record(record) {
  let errors = []
  if not validate_username(record.username) {
    push(errors, "❌ Username: invalid")
  }
  if not validate_email(record.email) {
    push(errors, "❌ Email: invalid")
  }
  return {
    valid: length(errors) == 0,
    errors: errors
  }
}
```

### 🚀 실행

```bash
npm run start examples/data_validator.fl
```

### 📊 출력 예시

```
📋 Data Validator Demo
======================

✅ All fields are valid!

📊 Individual Tests:
  Email: ✅
  Phone: ✅
  URL: ✅
  Username: ✅
  Password: ✅
  Credit Card: ✅
```

### 💡 실무 응용

```freelang
// 웹 폼 검증
fn validate_signup_form(form) {
  return validate_record({
    username: form.user,
    email: form.email,
    phone: form.phone,
    password: form.pwd,
    website: form.site
  })
}

// 데이터 정제 (sanitization)
fn sanitize_input(input) {
  let clean = sanitize_html(input)
  return str_trim(clean)
}
```

---

## 3️⃣ log_analyzer.fl - 로그 분석 도구

### 📝 개요
로그 파일을 파싱하고 분석합니다. **문자열 처리, 정규표현식, 통계**를 활용합니다.

### 🎯 학습 목표
```
✅ 파일 읽기 및 라인 단위 처리
✅ 로그 라인 파싱 (정규표현식)
✅ 배열 필터링 & 집계
✅ 통계 계산
✅ 복잡한 문자열 조작
✅ 객체를 맵으로 활용
```

### 📌 핵심 로직

```freelang
// 로그 라인 파싱
// 형식: [2026-02-21 10:30:45] ERROR: Connection timeout
fn parse_log_line(line) {
  let pattern = "^\\[(.*?)\\] ([A-Z]+): (.*)$"
  if regex_test(pattern, line) {
    let parts = regex_split(line, "] ")
    // ... 파싱 로직 ...
    return {
      timestamp: timestamp,
      level: level,
      message: message,
      valid: true
    }
  }
  return { valid: false }
}

// 레벨별 카운트
fn count_by_level(logs) {
  let counts = {}
  for log in logs {
    if log.valid {
      let level = log.level
      counts[level] = has(counts, level) ? counts[level] + 1 : 1
    }
  }
  return counts
}

// 레벨별 필터링
fn filter_by_level(logs, level) {
  return filter(logs, fn(log) {
    return log.valid and log.level == level
  })
}

// 종합 분석
fn analyze_logs(filename) {
  let content = read_file(filename)
  let lines = str_split(content, "\n")
  let logs = map(lines, fn(line) { return parse_log_line(line) })

  let output = "📊 Log Analysis Report\n"
  output = output + "📈 Total Entries: " + length(logs) + "\n"

  let counts = count_by_level(logs)
  output = output + "📌 By Level:\n"
  for level in counts {
    output = output + "  " + level + ": " + counts[level] + "\n"
  }

  return output
}
```

### 🚀 실행

```bash
npm run start examples/log_analyzer.fl
```

### 📊 출력 예시

```
🔍 FreeLang Log Analyzer

📁 Created: sample.log

📊 Log Analysis Report
======================

📈 Total Entries: 9
❌ Parse Errors: 0

📌 By Level:
  INFO: 3
  DEBUG: 2
  ERROR: 3
  WARN: 1

⏰ Time Range:
  From: 2026-02-21 08:00:00
  To: 2026-02-21 10:30:00

🔴 Recent Errors (3 total):
  • Connection timeout
  • Failed to fetch data
  • Invalid token

✨ Analysis complete!
```

### 💡 실무 응용

```freelang
// 성능 모니터링
fn analyze_performance(logfile) {
  // ERROR/WARN 레벨만 추출
  let issues = filter_by_level(parse_logs(logfile), "ERROR")
  let warnings = filter_by_level(parse_logs(logfile), "WARN")

  return {
    critical_count: length(issues),
    warning_count: length(warnings),
    health: length(issues) == 0 ? "✅ Healthy" : "⚠️ Issues"
  }
}

// 일일 리포트
fn daily_report(logfile) {
  // ... 분석 ...
  println("📧 Emailing report...")
  // HTTP를 사용해 이메일 서비스 호출 가능
}

// 로그 필터 및 내보내기
fn export_error_logs(logfile, outputfile) {
  let logs = analyze_logs(logfile)
  let errors = filter_by_level(logs, "ERROR")
  write_file(outputfile, toString(errors))
}
```

---

## 🎓 비교 학습: 3개 예제 나란히

| 기능 | todo_app | data_validator | log_analyzer |
|------|----------|----------------|--------------|
| 파일 I/O | ⭐⭐ | ⚪ | ⭐⭐⭐ |
| 정규표현식 | ⚪ | ⭐⭐⭐ | ⭐⭐ |
| 배열 처리 | ⭐⭐ | ⭐ | ⭐⭐⭐ |
| 객체 조작 | ⭐⭐ | ⭐⭐ | ⭐⭐ |
| 고차 함수 | ⭐⭐ | ⭐ | ⭐⭐⭐ |
| 문자열 처리 | ⭐ | ⭐⭐ | ⭐⭐⭐ |
| 예외 처리 | ⚪ | ⚪ | ⚪ |
| 모듈 시스템 | ⚪ | ⚪ | ⚪ |

---

## 🚀 실행 방법

### 모두 실행

```bash
cd /tmp/freelang-v6
npm run build
npm run start examples/todo_app.fl
npm run start examples/data_validator.fl
npm run start examples/log_analyzer.fl
```

### 개별 실행

```bash
npm run start examples/todo_app.fl
```

### 대화형 REPL

```bash
npm run repl
```

---

## 💡 다음 단계

### 쉬운 예제 (초급)
1. 계산기 (기본 산술)
2. 온도 변환기 (함수, 조건)
3. 구구단 (루프, 배열)

### 중급 예제
1. 신문 헤드라인 크롤러 (HTTP)
2. CSV 파일 처리기 (파일 I/O)
3. 설정 파일 관리자 (JSON)

### 고급 예제
1. 마크다운 → HTML 변환기 (정규표현식)
2. 간단한 웹 서버 (HTTP)
3. 데이터베이스 쿼리 빌더

---

## 📚 학습 순서 추천

```
1️⃣ hello.fl      → 클로저, 재귀 이해
2️⃣ math.fl       → 모듈 시스템 학습
3️⃣ app.fl        → import 문법 연습
4️⃣ todo_app.fl   → 실무 앱 만들기 (파일 I/O)
5️⃣ data_validator → 검증 로직 (정규표현식)
6️⃣ log_analyzer   → 복합 기능 통합
```

---

## ✅ 체크리스트

각 예제를 실행한 후 다음을 확인하세요:

### todo_app.fl
- [ ] 실행 성공
- [ ] todos.json 파일 생성됨
- [ ] 할일 3개가 출력됨

### data_validator.fl
- [ ] 실행 성공
- [ ] 모든 검증이 ✅ 표시
- [ ] 각 함수 동작 이해

### log_analyzer.fl
- [ ] 실행 성공
- [ ] sample.log 파일 생성됨
- [ ] 통계가 올바르게 계산됨
- [ ] ERROR 3개, WARN 1개 확인

---

## 🤝 예제 수정 & 확장

예제들은 교육용이므로 자유롭게 수정 가능합니다:

```freelang
// 예: todo_app에 우선순위 추가
fn add_todo(text, priority) {
  push(todos, {
    id: timestamp(),
    text: text,
    priority: priority,  // 추가
    done: false
  })
}

// 예: data_validator에 다국어 지원
fn validate_korean_phone(phone) {
  return regex_test("^01[0-9]-?\\d{3,4}-?\\d{4}$", phone)
}

// 예: log_analyzer에 필터 추가
fn filter_by_keyword(logs, keyword) {
  return filter(logs, fn(log) {
    return str_contains(log.message, keyword)
  })
}
```

---

**Happy Learning! 🎓**

FreeLang v6로 멋진 프로그램을 만들어보세요!

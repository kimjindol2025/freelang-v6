import { run } from "../src/index";

describe("Phase 1: DateTime", () => {
  test("dt_now returns current timestamp", () => {
    const out = run("let t = dt_now(); println(t > 0)");
    expect(out).toEqual(["true\n"]);
  });

  test("dt_now_iso returns ISO string", () => {
    const out = run('let s = dt_now_iso(); println(len(s) > 10)');
    expect(out).toEqual(["true\n"]);
  });

  test("dt_from_iso + dt_to_iso round-trip", () => {
    const out = run('let t = dt_from_iso("2026-01-15T10:30:00.000Z"); println(dt_to_iso(t))');
    expect(out).toEqual(["2026-01-15T10:30:00.000Z\n"]);
  });

  test("dt_from_iso invalid returns null", () => {
    const out = run('println(dt_from_iso("not-a-date"))');
    expect(out).toEqual(["null\n"]);
  });

  test("dt_from_parts creates timestamp", () => {
    const out = run('let t = dt_from_parts(2026, 6, 15); println(dt_year(t))');
    expect(out).toEqual(["2026\n"]);
  });

  test("dt_year/month/day", () => {
    const out = run('let t = dt_from_iso("2026-03-25T00:00:00.000Z"); println(dt_year(t)); println(dt_month(t)); println(dt_day(t))');
    expect(out).toEqual(["2026\n", "3\n", "25\n"]);
  });

  test("dt_hour/minute/second", () => {
    const out = run('let t = dt_from_parts(2026, 1, 1, 14, 30, 45); println(dt_hour(t)); println(dt_minute(t)); println(dt_second(t))');
    expect(out).toEqual(["14\n", "30\n", "45\n"]);
  });

  test("dt_weekday", () => {
    // 2026-01-01 is Thursday = 4
    const out = run('let t = dt_from_iso("2026-01-01T12:00:00.000Z"); println(dt_weekday(t))');
    expect(out).toEqual(["4\n"]);
  });

  test("dt_add_days", () => {
    const out = run('let t = dt_from_iso("2026-01-01T00:00:00.000Z"); let t2 = dt_add_days(t, 10); println(dt_to_iso(t2))');
    expect(out).toEqual(["2026-01-11T00:00:00.000Z\n"]);
  });

  test("dt_add_hours", () => {
    const out = run('let t = dt_from_iso("2026-01-01T00:00:00.000Z"); let t2 = dt_add_hours(t, 5); println(dt_to_iso(t2))');
    expect(out).toEqual(["2026-01-01T05:00:00.000Z\n"]);
  });

  test("dt_diff_seconds", () => {
    const out = run(`
      let a = dt_from_iso("2026-01-01T00:00:00.000Z")
      let b = dt_from_iso("2026-01-01T01:00:00.000Z")
      println(dt_diff_seconds(b, a))
    `);
    expect(out).toEqual(["3600\n"]);
  });

  test("dt_diff_days", () => {
    const out = run(`
      let a = dt_from_iso("2026-01-01T00:00:00.000Z")
      let b = dt_from_iso("2026-01-11T00:00:00.000Z")
      println(dt_diff_days(b, a))
    `);
    expect(out).toEqual(["10\n"]);
  });

  test("dt_format YYYY-MM-DD", () => {
    const out = run('let t = dt_from_parts(2026, 3, 5); println(dt_format(t, "YYYY-MM-DD"))');
    expect(out).toEqual(["2026-03-05\n"]);
  });

  test("dt_format HH:mm:ss", () => {
    const out = run('let t = dt_from_parts(2026, 1, 1, 9, 5, 3); println(dt_format(t, "HH:mm:ss"))');
    expect(out).toEqual(["09:05:03\n"]);
  });

  test("dt_start_of_day", () => {
    const out = run('let t = dt_from_parts(2026, 3, 15, 14, 30, 0); let s = dt_start_of_day(t); println(dt_hour(s)); println(dt_minute(s))');
    expect(out).toEqual(["0\n", "0\n"]);
  });

  test("dt_start_of_month", () => {
    const out = run('let t = dt_from_parts(2026, 3, 15); let s = dt_start_of_month(t); println(dt_day(s))');
    expect(out).toEqual(["1\n"]);
  });

  test("dt_is_leap_year", () => {
    const out = run('println(dt_is_leap_year(2024)); println(dt_is_leap_year(2026))');
    expect(out).toEqual(["true\n", "false\n"]);
  });

  test("dt_days_in_month", () => {
    const out = run('println(dt_days_in_month(2026, 2)); println(dt_days_in_month(2024, 2))');
    expect(out).toEqual(["28\n", "29\n"]);
  });

  test("dt_elapsed_ms returns positive", () => {
    const out = run('let t = dt_now(); println(dt_elapsed_ms(t) >= 0)');
    expect(out).toEqual(["true\n"]);
  });

  test("dt_to_unix / dt_from_unix round-trip", () => {
    const out = run(`
      let t = dt_from_iso("2026-01-01T00:00:00.000Z")
      let unix = dt_to_unix(t)
      let t2 = dt_from_unix(unix)
      println(dt_to_iso(t2))
    `);
    expect(out).toEqual(["2026-01-01T00:00:00.000Z\n"]);
  });

  test("dt_add_minutes / dt_add_seconds", () => {
    const out = run(`
      let t = dt_from_iso("2026-01-01T00:00:00.000Z")
      let t2 = dt_add_minutes(t, 90)
      let t3 = dt_add_seconds(t, 7200)
      println(dt_to_iso(t2))
      println(dt_to_iso(t3))
    `);
    expect(out).toEqual(["2026-01-01T01:30:00.000Z\n", "2026-01-01T02:00:00.000Z\n"]);
  });
});

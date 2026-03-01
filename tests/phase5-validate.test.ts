import { run } from "../src/index";

describe("Phase 5: Validation", () => {
  test("validate_email valid", () => {
    expect(run('println(validate_email("user@example.com"))')).toEqual(["true\n"]);
  });
  test("validate_email invalid", () => {
    expect(run('println(validate_email("not-email"))')).toEqual(["false\n"]);
  });

  test("validate_url valid", () => {
    expect(run('println(validate_url("https://example.com/path"))')).toEqual(["true\n"]);
  });
  test("validate_url invalid", () => {
    expect(run('println(validate_url("not a url"))')).toEqual(["false\n"]);
  });

  test("validate_ipv4 valid", () => {
    expect(run('println(validate_ipv4("192.168.1.1"))')).toEqual(["true\n"]);
  });
  test("validate_ipv4 invalid", () => {
    expect(run('println(validate_ipv4("999.1.1.1"))')).toEqual(["false\n"]);
  });

  test("validate_uuid valid", () => {
    expect(run('println(validate_uuid("550e8400-e29b-41d4-a716-446655440000"))')).toEqual(["true\n"]);
  });
  test("validate_uuid invalid", () => {
    expect(run('println(validate_uuid("not-a-uuid"))')).toEqual(["false\n"]);
  });

  test("validate_json valid", () => {
    expect(run('println(validate_json("{}"))')).toEqual(["true\n"]);
  });
  test("validate_json invalid", () => {
    expect(run('println(validate_json("{bad}"))')).toEqual(["false\n"]);
  });

  test("validate_int", () => {
    expect(run('println(validate_int("42")); println(validate_int("-7")); println(validate_int("3.14"))')).toEqual(["true\n", "true\n", "false\n"]);
  });

  test("validate_float", () => {
    expect(run('println(validate_float("3.14")); println(validate_float("abc"))')).toEqual(["true\n", "false\n"]);
  });

  test("validate_alpha", () => {
    expect(run('println(validate_alpha("hello")); println(validate_alpha("hello123"))')).toEqual(["true\n", "false\n"]);
  });

  test("validate_alphanumeric", () => {
    expect(run('println(validate_alphanumeric("abc123"))')).toEqual(["true\n"]);
  });

  test("validate_hex", () => {
    expect(run('println(validate_hex("deadBEEF")); println(validate_hex("xyz"))')).toEqual(["true\n", "false\n"]);
  });

  test("validate_base64", () => {
    expect(run('println(validate_base64("aGVsbG8="))')).toEqual(["true\n"]);
  });

  test("validate_phone", () => {
    expect(run('println(validate_phone("+82-10-1234-5678"))')).toEqual(["true\n"]);
  });

  test("validate_min_length / validate_max_length", () => {
    expect(run('println(validate_min_length("hello", 3))')).toEqual(["true\n"]);
    expect(run('println(validate_max_length("hi", 5))')).toEqual(["true\n"]);
    expect(run('println(validate_min_length("hi", 5))')).toEqual(["false\n"]);
  });

  test("validate_range", () => {
    expect(run('println(validate_range(5, 1, 10))')).toEqual(["true\n"]);
    expect(run('println(validate_range(15, 1, 10))')).toEqual(["false\n"]);
  });

  test("validate_not_empty", () => {
    expect(run('println(validate_not_empty("hello"))')).toEqual(["true\n"]);
    expect(run('println(validate_not_empty("  "))')).toEqual(["false\n"]);
    expect(run('println(validate_not_empty(""))')).toEqual(["false\n"]);
  });

  test("validate_matches", () => {
    expect(run('println(validate_matches("abc123", "^[a-z]+\\\\d+$"))')).toEqual(["true\n"]);
  });

  test("validate_credit_card luhn", () => {
    // Valid test number (Visa test card)
    expect(run('println(validate_credit_card("4111111111111111"))')).toEqual(["true\n"]);
    expect(run('println(validate_credit_card("1234567890123456"))')).toEqual(["false\n"]);
  });

  test("validate_date_iso", () => {
    expect(run('println(validate_date_iso("2026-01-15"))')).toEqual(["true\n"]);
    expect(run('println(validate_date_iso("not-date"))')).toEqual(["false\n"]);
  });
});

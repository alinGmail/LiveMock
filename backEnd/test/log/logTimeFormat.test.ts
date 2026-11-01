import {
  createRequestLog,
  createResponseLog,
  formatLogTime,
} from "livemock-core/struct/log";

describe("log time formatting", () => {
  test("formats a local date as YYYY-MM-DD HH:mm:ss with padding", () => {
    // Construct with local components so the assertion is timezone independent.
    expect(formatLogTime(new Date(2026, 0, 2, 3, 4, 5))).toBe(
      "2026-01-02 03:04:05"
    );
  });

  test("createRequestLog keeps the epoch milliseconds and a matching string", () => {
    const req = createRequestLog();
    expect(req.requestTimeStr).toMatch(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
    );
    expect(req.requestTimeStr).toBe(formatLogTime(new Date(req.requestTime)));
  });

  test("createResponseLog keeps the epoch milliseconds and a matching string", () => {
    const res = createResponseLog();
    expect(res.responseTimeStr).toMatch(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
    );
    expect(res.responseTimeStr).toBe(
      formatLogTime(new Date(res.responseTime))
    );
  });
});

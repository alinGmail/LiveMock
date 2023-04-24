import { createMethodMatcher, MatcherCondition } from "core/struct/matcher";
import express from "express";
import MethodMatcher from "../../src/matcher/MethodMatcher";

test("method matcher", async () => {
  const methodMatcher = createMethodMatcher();
  methodMatcher.value = "POST";
  methodMatcher.conditions = MatcherCondition.IS;
  const headerMatcher = new MethodMatcher(methodMatcher);

  const res = headerMatcher.match({
    method: "post",
  } as express.Request);

  expect(res).toBe(true);
});

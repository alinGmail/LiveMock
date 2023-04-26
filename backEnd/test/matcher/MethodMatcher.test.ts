import { createMethodMatcher, MatcherCondition } from "core/struct/matcher";
import express from "express";
import MethodMatcher from "../../src/matcher/MethodMatcher";

test("method matcher", async () => {
  const methodMatcherM = createMethodMatcher();
  methodMatcherM.value = "POST";
  methodMatcherM.conditions = MatcherCondition.IS;
  const methodMatcher = new MethodMatcher(methodMatcherM);

  const res = methodMatcher.match({
    method: "post",
  } as express.Request);

  expect(res).toBe(true);
});

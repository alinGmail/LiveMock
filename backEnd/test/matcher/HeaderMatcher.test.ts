import {
  createHeaderMatcher,
  MatcherCondition,
} from "core/struct/matcher";
import HeaderMatcher from "../../src/matcher/HeaderMatcher";
import express from "express";

test("header matcher", async () => {
  const headerMatcherM = createHeaderMatcher();
  headerMatcherM.name = "firstName";
  headerMatcherM.value = "jeff";
  headerMatcherM.conditions = MatcherCondition.IS;
  const headerMatcher = new HeaderMatcher(headerMatcherM);

  const res = headerMatcher.match({
    header:(name): string | undefined => {
      return "jeff";
    },
  } as express.Request);

  expect(res).toBe(true);

});
test("header matcher array", async () => {
    const headerMatcherM = createHeaderMatcher();
    headerMatcherM.name = "firstName";
    headerMatcherM.value = "jeff";
    headerMatcherM.conditions = MatcherCondition.SHOWED;
    const headerMatcher = new HeaderMatcher(headerMatcherM);

    const res = headerMatcher.match({
        header:(name): string[] | undefined => {
            return ["jeff","tom","marry"];
        },
    } as express.Request);

    expect(res).toBe(true);

});
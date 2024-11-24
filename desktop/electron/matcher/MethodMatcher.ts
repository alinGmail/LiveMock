import {
  IMatcher,
  MethodMatcherM,
  StringMatcherCondition,
} from "livemock-core/struct/matcher";
import express from "express";
import * as matchUtils from "./matchUtils";

class MethodMatcher implements IMatcher {
  matcher: MethodMatcherM;
  constructor(matcher: MethodMatcherM) {
    this.matcher = matcher;
  }
  match(req: express.Request): boolean {
    return matchUtils.stringMatchCondition(
      req.method.toUpperCase(),
      this.matcher.conditions as StringMatcherCondition,
      this.matcher.value.toUpperCase()
    );
  }
}
export default MethodMatcher;

import {
  IMatcher,
  PathMatcherM,
  StringMatcherCondition,
} from "core/struct/matcher";
import express from "express";
import * as matchUtils from "./matchUtils";

class PathMatcher implements IMatcher {
  matcher: PathMatcherM;
  constructor(matcher: PathMatcherM) {
    this.matcher = matcher;
  }
  match(req: express.Request): boolean {
    return matchUtils.stringMatchCondition(
      req.path,
      this.matcher.conditions as StringMatcherCondition,
      this.matcher.value
    );
  }
}

export default PathMatcher;
import {
  IMatcher,
  HeaderMatcherM,
  StringMatcherCondition,
} from "core/struct/matcher";
import express from "express";
import * as matchUtils from "./matchUtils";

class HeaderMatcher implements IMatcher {
  matcher: HeaderMatcherM;

  constructor(matcher: HeaderMatcherM) {
    this.matcher = matcher;
  }

  match(req: express.Request): boolean {
    let header = req.header(this.matcher.name);
    if (typeof header == "undefined") {
      return false;
    } else {
      return matchUtils.stringMatchCondition(
        header,
        this.matcher.conditions as StringMatcherCondition,
        this.matcher.value
      );
    }
  }
}

export default HeaderMatcher;

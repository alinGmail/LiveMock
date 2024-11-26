import {
  IMatcher,
  QueryMatcherM,
} from "livemock-core/struct/matcher";
import express from "express";
import * as matchUtils from "./matchUtils";
import _ from "lodash";

class QueryMatcher implements IMatcher {
  matcher: QueryMatcherM;

  constructor(matcher: QueryMatcherM) {
    this.matcher = matcher;
  }

  match(req: express.Request): boolean {
    let value = _.get(req.query, this.matcher.name);
    return matchUtils.matchAnyValue(value, this.matcher);
  }
}

export default QueryMatcher;

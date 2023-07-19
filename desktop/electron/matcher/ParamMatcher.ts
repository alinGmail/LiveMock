import { IMatcher, ParamMatcherM } from "core/struct/matcher";
import express from "express";
import typeis from "type-is";
import _ from "lodash";
import * as matchUtils from "./matchUtils";

class ParamMatcherImpl implements IMatcher {
  matcher: ParamMatcherM;

  constructor(matcher: ParamMatcherM) {
    this.matcher = matcher;
  }

  match(req: express.Request): boolean {

    let value = _.get(req.body, this.matcher.name);
    // 判断 传参 方法
    // json urlencode formdata
    if (typeis.hasBody(req)) {
      switch (typeis(req, ["urlencoded", "json", "multipart"])) {
        case "urlencoded":
          // parse urlencoded body
          return matchUtils.matchAnyValue(value, this.matcher);
        case "json":
          // parse json body
          return matchUtils.matchAnyValue(value, this.matcher);
        case "multipart":
          return matchUtils.matchAnyValue(value, this.matcher);
        default:
          return false;
      }
    } else {
      return false;
    }
  }
}
export default ParamMatcherImpl;

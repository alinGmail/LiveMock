import {MatcherCondition, RequestMatcherM, RequestMatcherType, StringMatcherCondition,} from "core/struct/matcher";
import _ from "lodash";
import MethodMatcher from "./MethodMatcher";
import PathMatcher from "./PathMatcher";
import HeaderMatcher from "./HeaderMatcher";
import QueryMatcher from "./QueryMatcher";
import ParamMatcher from "./ParamMatcher";

export const stringMatchCondition = (
  left: string,
  condition: StringMatcherCondition,
  right: string
) => {
  switch (condition) {
    case MatcherCondition.IS:
      return left === right;
    case MatcherCondition.START_WITH:
      return left.startsWith(right);
    case MatcherCondition.CONTAINS:
      return left.indexOf(right) != -1;
    case MatcherCondition.END_WITH:
      return left.endsWith(right);
    case MatcherCondition.IS_NOT:
      return left !== right;
    case MatcherCondition.NOT_CONTAINS:
      return left.indexOf(right) == -1;
    case MatcherCondition.SHOWED:
      return left == null;
    case MatcherCondition.NOT_SHOWED:
      return left != null;
    case MatcherCondition.MATCH_REGEX:
      return regexMatch(left,right);
    case MatcherCondition.NOT_MATCH_REGEX:
      return !regexMatch(left,right);
    default:
      return false;
  }
};

export function regexMatch(valueStr:string,regexStr:string){
  try {
    let regExp:RegExp;
    if(regexStr.startsWith("/")){
      let pattern = regexStr.slice(1, regexStr.lastIndexOf("/"));
      let modified = regexStr.slice(regexStr.lastIndexOf("/") + 1);
      regExp = new RegExp(pattern,modified);
    }else{
      regExp = new RegExp(regexStr);
    }
    return regExp.test(valueStr);
  }catch (e){
    return false;
  }
}

export function matchAnyValue(
  value: string | undefined | Array<any> | Object,
  matcher: RequestMatcherM
): boolean {
  if (typeof value === "undefined") {
    if (matcher.conditions === MatcherCondition.NOT_SHOWED) {
      return true;
    } else {
      return false;
    }
  } else if (typeof value === "string") {
    return stringMatchCondition(
      value,
      matcher.conditions as StringMatcherCondition,
      matcher.value
    );
  } else if (typeof value === "object") {
    if (_.isArray(value)) {
      switch (matcher.conditions) {
        case MatcherCondition.CONTAINS:
        case MatcherCondition.SHOWED:
          return (value as Array<any>).includes(matcher.value);
        case MatcherCondition.NOT_CONTAINS:
        case MatcherCondition.NOT_SHOWED:
          return !(value as Array<any>).includes(matcher.value);
        default:
          return false;
      }
    } else {
      return false;
    }
  } else {
    return false;
  }
}

export const getMatcherImpl = (matcher: RequestMatcherM) => {
  if (matcher.type == RequestMatcherType.METHOD) {
    return new MethodMatcher(matcher);
  } else if (matcher.type == RequestMatcherType.PATH) {
    return new PathMatcher(matcher);
  } else if (matcher.type == RequestMatcherType.HEADER) {
    return new HeaderMatcher(matcher);
  } else if (matcher.type == RequestMatcherType.QUERY) {
    return new QueryMatcher(matcher);
  } else if (matcher.type == RequestMatcherType.PARAM) {
    return new ParamMatcher(matcher);
  } else {
    return null;
  }
};


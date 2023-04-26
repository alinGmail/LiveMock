import {
  MatcherCondition,
  RequestMatcherM,
  StringMatcherCondition,
} from "core/struct/matcher";
import _ from "lodash";

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
    default:
      return false;
  }
};

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

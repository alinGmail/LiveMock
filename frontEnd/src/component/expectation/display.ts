import { ActionType } from "livemock-core/struct/action";
import { MatcherCondition, RequestMatcherM } from "livemock-core/struct/matcher";

export type ActionKind = "custom" | "proxy" | "static";

/** Short human label for an action type, as used on the row badge and detail. */
export function actionLabel(type: ActionType): string {
  switch (type) {
    case ActionType.CUSTOM_RESPONSE:
      return "Response";
    case ActionType.PROXY:
      return "Proxy";
    case ActionType.STATIC_DIRECTORY:
      return "Static";
    default:
      return String(type);
  }
}

/** Colour-family key for an action type. */
export function actionKind(type: ActionType): ActionKind {
  switch (type) {
    case ActionType.CUSTOM_RESPONSE:
      return "custom";
    case ActionType.PROXY:
      return "proxy";
    case ActionType.STATIC_DIRECTORY:
      return "static";
    default:
      return "custom";
  }
}

const CONDITION_LABELS: Record<MatcherCondition, string> = {
  [MatcherCondition.IS]: "is",
  [MatcherCondition.IS_NOT]: "is not",
  [MatcherCondition.CONTAINS]: "contains",
  [MatcherCondition.NOT_CONTAINS]: "not contains",
  [MatcherCondition.START_WITH]: "starts with",
  [MatcherCondition.END_WITH]: "ends with",
  [MatcherCondition.MATCH_REGEX]: "matches regex",
  [MatcherCondition.NOT_MATCH_REGEX]: "not match regex",
  [MatcherCondition.SHOWED]: "showed",
  [MatcherCondition.NOT_SHOWED]: "not showed",
  [MatcherCondition.MATCH_GLOB]: "matches glob",
  [MatcherCondition.NO_MATCH_GLOB]: "no match glob",
};

export function conditionLabel(condition: MatcherCondition): string {
  return CONDITION_LABELS[condition] ?? String(condition).toLowerCase();
}

export function matcherName(matcher: RequestMatcherM): string {
  return "name" in matcher ? matcher.name : "";
}

export function matcherValue(matcher: RequestMatcherM): string {
  return matcher.value;
}

/** Search haystack for a matcher: type, name, condition and value. */
export function matcherHaystack(matcher: RequestMatcherM): string {
  return [
    matcher.type,
    matcherName(matcher),
    conditionLabel(matcher.conditions),
    matcherValue(matcher),
  ].join(" ");
}

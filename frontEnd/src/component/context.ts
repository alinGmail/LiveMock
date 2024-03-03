import { createContext, useContext } from "react";
import { RequestMatcherM } from "core/struct/matcher";
import { ActionM } from "core/struct/action";

export interface ExpectationContextData {
  refreshExpectationList: () => void;
}
const ExpectationContext = createContext<ExpectationContextData>({
  refreshExpectationList:() => undefined,
});

export function useExpectationContext():ExpectationContextData{
  return useContext(ExpectationContext);
}

interface MatcherContextData {
  matcherIndex: number | null;
  onMatcherAdd: (matcher: RequestMatcherM) => void;
  onMatcherModify: (matcher: RequestMatcherM) => void;
  onMatcherDel: (matcher: RequestMatcherM) => void;
}
const MatcherContext = createContext<MatcherContextData>({
  matcherIndex: null,
  onMatcherAdd: () => {},
  onMatcherModify: () => {},
  onMatcherDel: () => {},
});

function useMatcherContext(): MatcherContextData {
  const context = useContext(MatcherContext);
  if (context.matcherIndex === null) {
    throw new Error("matcherIndex must not null");
  }
  return context;
}

interface ActionContextData {
  onActionModify: (action: ActionM) => void;
  onActionRemove: (actionId: string) => void;
}

const ActionContext = createContext<ActionContextData>({
  onActionModify: () => {},
  onActionRemove: () => {},
});

function useActionContext(): ActionContextData {
  return useContext(ActionContext);
}

export {
  ExpectationContext,
  MatcherContext,
  useMatcherContext,
  useActionContext,
  ActionContext,
};

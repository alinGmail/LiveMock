import { createContext, useContext } from "react";
import { RequestMatcherM } from "livemock-core/struct/matcher";

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

export { MatcherContext, useMatcherContext };

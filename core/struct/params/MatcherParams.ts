import { RequestMatcherM } from "../matcher";

export interface CreateMatcherParams {
  projectId: string;
  expectationId: string;
  matcher: RequestMatcherM;
}

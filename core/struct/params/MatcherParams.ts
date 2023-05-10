import { RequestMatcherM } from "../matcher";

export interface CreateMatcherParams {
  projectId: string;
  expectationId: string;
  matcher: RequestMatcherM;
}

export interface UpdateMatcherParams{
  projectId:string;
  expectationId:string;
  updateQuery:Partial<RequestMatcherM>;
}
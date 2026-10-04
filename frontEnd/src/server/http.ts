import * as superagent from "superagent";
import { notifyUnauthorized } from "./authEvents";

/**
 * superagent wrapper used by every management API call. Behaves exactly like
 * superagent, but notifies the app when a request fails with 401 so the user
 * is sent back to the login page.
 */
function intercept(request: superagent.Request): superagent.Request {
  const originalThen = request.then.bind(request);
  (request as any).then = (onFulfilled?: any, onRejected?: any) =>
    originalThen(onFulfilled).catch((error: any) => {
      if (error?.status === 401) {
        notifyUnauthorized();
      }
      if (onRejected) {
        return onRejected(error);
      }
      throw error;
    });
  return request;
}

export const get = (url: string) => intercept(superagent.get(url));
export const post = (url: string) => intercept(superagent.post(url));
export const put = (url: string) => intercept(superagent.put(url));
const deleteRequest = (url: string) => intercept(superagent.delete(url));
export { deleteRequest as delete };

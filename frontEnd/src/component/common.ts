import * as superagent from "superagent";

/**
 * get the error message
 * @param error
 */
export function getErrorMessage(error: any) {
  if (typeof (error as superagent.ResponseError).response === "object") {
    return (
      (error as superagent.ResponseError).response?.body.error.message ??
      "server error"
    );
  } else if (error instanceof Error) {
    return error.message;
  } else {
    return "an error occurred";
  }
}

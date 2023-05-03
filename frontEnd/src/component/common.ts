import * as superagent from "superagent";
import toast from "react-hot-toast";

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


export function toastPromise(promise:Promise<any>){
  return toast.promise(promise,{
    error: getErrorMessage,
    loading: "loading",
    success: 'operation successful'
  })
}
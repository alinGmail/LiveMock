
import toast from "react-hot-toast";

/**
 * get the error message
 * @param error
 */
export function getErrorMessage(error: any) {
  // if (typeof (error as superagent.ResponseError).response === "object") {
  //   return (
  //     (error as superagent.ResponseError).response?.body.error.message ??
  //     "server error"
  //   );
  // } else
  if (error instanceof Error) {
    return error.message;
  } else {
    return "an error occurred";
  }
}

export function toastPromise(promise: Promise<any>) {
  return toast.promise(promise, {
    error: getErrorMessage,
    loading: "loading",
    success: "operation successful",
  });
}

export function binarySearch<T>(
  arr: Array<T>,
  target: T,
  compareFunction: (a: T, b: T) => number,
  start?: number | undefined,
  end?: number | undefined
): number {
  if (end == undefined) {
    end = arr.length - 1;
  }
  if (start == undefined) {
    start = 0;
  }
  const m = Math.floor((start + end) / 2);
  if (compareFunction(arr[m], target) === 0) {
    return m;
  }
  if (start >= end) {
    return -1;
  }
  if (compareFunction(target, arr[m]) < 0) {
    return binarySearch(arr, target, compareFunction, start, m - 1);
  } else {
    return binarySearch(arr, target, compareFunction, m + 1, end);
  }
}
/*
test binarySearch
const arr = [-34, 1, 3, 4, 5, 8, 34, 45, 65, 87];
binarySearch(arr, 4, (a, b) => {
  if (a === b) {
    return 0;
  }
  if (a > b) {
    return 1;
  }
  return -1;
});
*/
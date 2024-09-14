import _ from "lodash";

const first: <T>(
  array: Array<T>,
  callback: (item: T, index: number) => Promise<boolean>
) => Promise<T | null> = async (array, callback) => {
  for (let i = 0; i < array.length; i++) {
    let res = await callback(array[i], i);
    if (res) {
      return array[i];
    }
  }
  return null;
};
const validAll: <T>(
  array: Array<T>,
  callback: (item: T, index: number) => boolean
) => boolean = (array, callback) => {
  for (let i = 0; i < array.length; i++) {
    let res = callback(array[i], i);
    if (!res) {
      return res;
    }
  }
  return true;
};
export default {
  first,
  validAll,
};

export const isEmptyArray = (testObj: any) => {
  return _.isArray(testObj) && testObj.length === 0;
};

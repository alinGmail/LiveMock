export function checkValueChange(
  getValue: () => any,
  expectedValue,
  interval = 50,
  timeout = 500
) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function check() {
      const currentValue = getValue();
      if (currentValue === expectedValue) {
        resolve(currentValue);
      } else if (Date.now() - startTime >= timeout) {
        reject(
          new Error(
            `Timeout: value did not change to ${expectedValue} within ${timeout}ms, the value is ${currentValue}`
          )
        );
      } else {
        setTimeout(check, interval);
      }
    }
    check();
  });
}

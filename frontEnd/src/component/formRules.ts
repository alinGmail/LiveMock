/** Shared antd form rules so the auth and config pages agree on the policy. */
export function passwordRules(requiredMessage: string): any[] {
  return [
    { required: true, message: requiredMessage },
    { min: 8, message: "At least 8 characters" },
    { max: 64, message: "At most 64 characters" },
  ];
}

export function confirmPasswordRules(
  passwordField: string,
  requiredMessage: string
): any[] {
  return [
    { required: true, message: requiredMessage },
    ({ getFieldValue }: any) => ({
      validator(_: any, value: string) {
        if (!value || getFieldValue(passwordField) === value) {
          return Promise.resolve();
        }
        return Promise.reject(new Error("Passwords do not match"));
      },
    }),
  ];
}

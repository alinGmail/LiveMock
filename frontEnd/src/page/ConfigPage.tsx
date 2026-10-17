import { changePasswordReq } from "../server/authServer";
import { confirmPasswordRules, passwordRules } from "../component/formRules";
import { getErrorMessage } from "../component/common";
import { useState } from "react";
import { Button, Card, Form, Input } from "antd";
import toast from "react-hot-toast";

/**
 * Account settings. Project settings (including delete) live in the app bar's
 * Project settings panel.
 */
const ConfigPage = () => {
  const [passwordForm] = Form.useForm();
  const [changingPassword, setChangingPassword] = useState(false);

  const onChangePassword = async (values: {
    currentPassword: string;
    newPassword: string;
  }) => {
    setChangingPassword(true);
    try {
      await changePasswordReq(values.currentPassword, values.newPassword);
      toast.success("Password changed");
      passwordForm.resetFields();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div style={{ padding: "20px 10px" }}>
      <div
        style={{
          width: "560px",
          margin: "20px auto",
        }}
      >
        <Card title="Change Password">
          <Form form={passwordForm} layout="vertical" onFinish={onChangePassword}>
            <Form.Item
              name="currentPassword"
              label="Current password"
              rules={[
                { required: true, message: "Please input the current password" },
              ]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="New password"
              rules={passwordRules("Please input the new password")}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm new password"
              dependencies={["newPassword"]}
              rules={confirmPasswordRules(
                "newPassword",
                "Please confirm the new password"
              )}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={changingPassword}>
              Change Password
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default ConfigPage;

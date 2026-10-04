import { useState } from "react";
import { Button, Card, Form, Input, Typography } from "antd";
import toast from "react-hot-toast";
import { getErrorMessage } from "../component/common";
import { loginReq, registerReq } from "../server/authServer";
import {
  confirmPasswordRules,
  passwordRules,
} from "../component/formRules";

interface AuthPageProps {
  mode: "login" | "register";
  onSuccess: (username: string) => void;
}

const AuthPage = ({ mode, onSuccess }: AuthPageProps) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: {
    username: string;
    password: string;
  }) => {
    setSubmitting(true);
    try {
      const res =
        mode === "register"
          ? await registerReq(values.username, values.password)
          : await loginReq(values.username, values.password);
      onSuccess(res.username);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <Card style={{ width: "380px" }}>
        <Typography.Title
          level={3}
          style={{ textAlign: "center", marginBottom: "8px" }}
        >
          LiveMock
        </Typography.Title>
        <Typography.Paragraph
          type="secondary"
          style={{ textAlign: "center", marginBottom: "24px" }}
        >
          {mode === "register"
            ? "Create the account for this instance"
            : "Sign in to continue"}
        </Typography.Paragraph>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: "Please input your username" },
              { max: 64, message: "At most 64 characters" },
            ]}
          >
            <Input autoFocus autoComplete="username" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={
              mode === "register"
                ? passwordRules("Please input your password")
                : [{ required: true, message: "Please input your password" }]
            }
          >
            <Input.Password
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
            />
          </Form.Item>
          {mode === "register" && (
            <Form.Item
              name="confirmPassword"
              label="Confirm password"
              dependencies={["password"]}
              rules={confirmPasswordRules(
                "password",
                "Please confirm your password"
              )}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
          )}
          <Button type="primary" htmlType="submit" block loading={submitting}>
            {mode === "register" ? "Create account" : "Sign in"}
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default AuthPage;

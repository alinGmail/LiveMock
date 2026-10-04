import ProjectEditor from "../component/project/ProjectEditor";
import { EditorType } from "../struct/common";
import { useImmer } from "use-immer";
import { useAppSelector } from "../store";
import { useDebounceEffect, useDebounceFn } from "ahooks";
import { debounceWait } from "../config";
import {
  deleteProjectReq,
  getProjectListReq,
  updateProjectReq,
} from "../server/projectServer";
import { getErrorMessage, toastPromise } from "../component/common";
import { changePasswordReq } from "../server/authServer";
import { confirmPasswordRules, passwordRules } from "../component/formRules";
import {setCurProjectIndex, setProjectList} from "../slice/projectSlice";
import { useDispatch } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { Button, Card, Form, Input, Modal } from "antd";
import { message } from "antd/lib";
import { DeleteOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";

const ConfigPage = () => {
  const dispatch = useDispatch();
  const isStartUp = useRef(true);
  const projectState = useAppSelector((state) => state.project);
  const currentProject = projectState.projectList[projectState.curProjectIndex];
  const [modifyProject, updateModifyProject] = useImmer(currentProject);

  useEffect(() => {
    updateModifyProject(currentProject);
    isStartUp.current = true;
  }, [currentProject]);
  function onProjectEditorSubmit() {}
  useDebounceEffect(
    () => {
      if (isStartUp.current) {
        isStartUp.current = false;
        return;
      }
      const updatePromise = updateProjectReq(modifyProject.id, {
        projectUpdate: modifyProject,
      });
      toastPromise(updatePromise);
      updatePromise.then(async (_res) => {
        let res = await getProjectListReq();
        dispatch(setProjectList(res));
      });
    },
    [modifyProject],
    {
      wait: debounceWait,
    },
  );

  const [messageApi, messageContextHolder] = message.useMessage();
  const [projectNameInp, setProjectNameInp] = useState<string>("");
  const [deleteModalShow, setDeleteModalShow] = useState(false);
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
      {messageContextHolder}
      <Modal
        title={"warning"}
        open={deleteModalShow}
        onOk={() => {
          if (projectNameInp !== currentProject.name) {
            messageApi.error("incorrect project name");
            return false;
          }
          const deletePromise = deleteProjectReq(currentProject.id).then(
            (res) => {
              setDeleteModalShow(false);
              getProjectListReq().then(projectListRes => {
                dispatch(setProjectList(projectListRes));
                if (projectListRes.length > 0) {
                  dispatch(setCurProjectIndex(0));
                }
              });
            },
          );
          toastPromise(deletePromise);
        }}
        onCancel={() => {
          setDeleteModalShow(false);
        }}
      >
        <div
          style={{
            lineHeight: "2em",
          }}
        >
          Are you sure want to delete the project{" "}
          <strong>{currentProject.name}</strong> ?
          <br />
          input the project name to confirm
          <Input
            value={projectNameInp}
            onChange={(e) => {
              setProjectNameInp(e.target.value);
            }}
            style={{
              marginTop: "4px",
            }}
          />
        </div>
      </Modal>
      <ProjectEditor
        editorType={EditorType.MODIFY}
        projectM={modifyProject}
        onSubmit={onProjectEditorSubmit}
        updaterProjectM={updateModifyProject}
      />
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
      <div style={{
        width:'560px',
        margin:'20px auto',
      }}>
        <Button
          block={true}
          size={'large'}
          danger={true}
          icon={<DeleteOutlined />}
          onClick={async () => {
            setDeleteModalShow(true);
          }}
        >
          Delete Project
        </Button>
      </div>
    </div>
  );
};

export default ConfigPage;

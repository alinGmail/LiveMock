import { Input, Select, Tooltip } from "antd";
import {
  ActionType,
  StaticDirectoryActionM,
} from "livemock-core/struct/action";
import React from "react";
import { useActionContext } from "../context";
import moduleStyle from "./StaticDirectoryActionEditor.module.scss";
import { QuestionCircleOutlined } from "@ant-design/icons";

export const StaticDirectoryActionEditor: React.FunctionComponent<{
  action: StaticDirectoryActionM;
  typeChange: (type: ActionType) => void;
}> = ({ action, typeChange }) => {
  const actionContext = useActionContext();
  return (
    <>
      <div
        style={{
          viewTransitionName: "type-input",
        }}
      >
        <div>type</div>
        <div>
          <Select
            defaultValue={action.type}
            style={{ width: 220 }}
            onChange={typeChange}
            options={[
              { value: ActionType.PROXY, label: ActionType.PROXY },
              {
                value: ActionType.CUSTOM_RESPONSE,
                label: ActionType.CUSTOM_RESPONSE,
              },
              {
                value: ActionType.STATIC_DIRECTORY,
                label: ActionType.STATIC_DIRECTORY,
              },
            ]}
          />
        </div>
        <div className={moduleStyle.row}>
          <div>
            folder path{" "}
            <Tooltip title={"the absolute path of the folder to serve"}>
              <QuestionCircleOutlined style={{ fontSize: "12px" }} />
            </Tooltip>
          </div>
          <div>
            <Input
              placeholder={"example: /home/user/dist"}
              value={action.folderPath}
              onChange={(event) => {
                actionContext.onActionModify({
                  ...action,
                  folderPath: event.target.value,
                });
              }}
            />
          </div>
        </div>
        <div className={moduleStyle.row}>
          <div>
            url prefix{" "}
            <Tooltip
              title={
                "requests under this prefix are served from the folder; leave empty to serve request paths as-is"
              }
            >
              <QuestionCircleOutlined style={{ fontSize: "12px" }} />
            </Tooltip>
          </div>
          <div>
            <Input
              placeholder={"example: /static"}
              value={action.urlPrefix}
              onChange={(event) => {
                actionContext.onActionModify({
                  ...action,
                  urlPrefix: event.target.value,
                });
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};
export default StaticDirectoryActionEditor;

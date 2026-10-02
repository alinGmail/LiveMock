import { ExpectationGroupM } from "livemock-core/struct/expectationGroup";
import { ExpectationM } from "livemock-core/struct/expectation";
import { Button, Input, InputNumber, Select, Switch, Tag } from "antd";
import { ChangeEvent, useEffect, useState } from "react";
import { useRequest } from "ahooks";
import { DeleteOutlined } from "@ant-design/icons";
import { debounceWait } from "../../config";
import { deleteGroupReq, updateGroupReq } from "../../server/groupServer";
import { updateExpectationReq } from "../../server/expectationServer";
import { toastPromise } from "../common";
import { AppDispatch } from "../../store";
import { updateExpectationItem } from "../../slice/expectationSlice";
import { HookAPI as ModalHookAPI } from "antd/es/modal/useModal";

function onSettled(promise: Promise<unknown>, callback: () => void) {
  promise.then(callback).catch(callback);
}

export const GroupNameColumn = ({
  projectId,
  group,
  memberCount,
  onChanged,
}: {
  projectId: string;
  group: ExpectationGroupM;
  memberCount: number;
  onChanged: () => void;
}) => {
  const [name, setName] = useState(group.name);
  useEffect(() => {
    setName(group.name);
  }, [group.name]);

  const { run } = useRequest(
    async (projectId: string, groupId: string, groupName: string) => {
      const updatePromise = updateGroupReq(projectId, groupId, {
        name: groupName,
      });
      toastPromise(updatePromise);
      onSettled(updatePromise, onChanged);
      return updatePromise;
    },
    {
      debounceWait: debounceWait,
      manual: true,
    },
  );

  return (
    <div
      style={{
        minWidth: "150px",
        display: "flex",
        gap: "8px",
        alignItems: "center",
      }}
    >
      <Input
        placeholder={"empty"}
        value={name}
        onChange={(event: ChangeEvent<{ value: string }>) => {
          setName(event.target.value);
          run(projectId, group.id, event.target.value);
        }}
      />
      <Tag title={"expectation count"}>{memberCount}</Tag>
    </div>
  );
};

export const GroupPriorityColumn = ({
  projectId,
  group,
  onChanged,
}: {
  projectId: string;
  group: ExpectationGroupM;
  onChanged: () => void;
}) => {
  const [priority, setPriority] = useState(group.priority);
  useEffect(() => {
    setPriority(group.priority);
  }, [group.priority]);

  const { run } = useRequest(
    async (projectId: string, groupId: string, groupPriority: number) => {
      const updatePromise = updateGroupReq(projectId, groupId, {
        priority: groupPriority,
      });
      toastPromise(updatePromise);
      onSettled(updatePromise, onChanged);
      return updatePromise;
    },
    {
      debounceWait: debounceWait,
      manual: true,
    },
  );

  return (
    <div>
      <InputNumber
        placeholder={"empty"}
        value={priority}
        onChange={(value: number | null) => {
          if (value === null) return;
          setPriority(value);
          run(projectId, group.id, value);
        }}
      />
    </div>
  );
};

export const GroupActivateColumn = ({
  projectId,
  group,
  onChanged,
}: {
  projectId: string;
  group: ExpectationGroupM;
  onChanged: () => void;
}) => {
  return (
    <div>
      <Switch
        checked={group.activate}
        onChange={(value) => {
          const updatePromise = updateGroupReq(projectId, group.id, {
            activate: value,
          });
          toastPromise(updatePromise);
          onSettled(updatePromise, onChanged);
        }}
      />
    </div>
  );
};

export const GroupOperationColumn = ({
  projectId,
  group,
  memberCount,
  modal,
  onChanged,
}: {
  projectId: string;
  group: ExpectationGroupM;
  memberCount: number;
  modal: ModalHookAPI;
  onChanged: () => void;
}) => {
  return (
    <div>
      <Button
        title={"delete"}
        type={"text"}
        onClick={() => {
          modal.confirm({
            title: "warning",
            content: `are you sure to delete group ${
              group.name ? group.name : "(unnamed)"
            } ? Its ${memberCount} expectation(s) will be deleted too. Request logs are preserved.`,
            onOk: () => {
              const deletePromise = deleteGroupReq(projectId, group.id);
              toastPromise(deletePromise);
              onSettled(deletePromise, onChanged);
            },
            onCancel: () => {},
          });
        }}
        shape={"circle"}
        icon={<DeleteOutlined />}
      />
    </div>
  );
};

export const ExpectationGroupSelectColumn = ({
  projectId,
  expectation,
  groups,
  dispatch,
  onChanged,
}: {
  projectId: string;
  expectation: ExpectationM;
  groups: Array<ExpectationGroupM>;
  dispatch: AppDispatch;
  onChanged: () => void;
}) => {
  const options = [
    { value: "", label: "ungrouped" },
    ...groups.map((group) => ({
      value: group.id,
      label: group.name ? group.name : "(unnamed)",
    })),
  ];
  return (
    <Select
      style={{
        minWidth: "140px",
      }}
      value={expectation.groupId ? expectation.groupId : ""}
      options={options}
      onChange={(value: string) => {
        const groupId = value ? value : null;
        dispatch(
          updateExpectationItem({
            expectationId: expectation.id,
            modifyValues: {
              groupId,
            },
          }),
        );
        const updatePromise = updateExpectationReq(projectId, expectation.id, {
          groupId,
        });
        toastPromise(updatePromise);
        onSettled(updatePromise, onChanged);
      }}
    />
  );
};

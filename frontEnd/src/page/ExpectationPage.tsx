import { Button, Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { AppDispatch, useAppSelector } from "../store";
import {
  createExpectationReq,
  getExpectationListReq,
} from "../server/expectationServer";
import { createExpectation, ExpectationM } from "core/struct/expectation";
import {
    DelayColumn,
    NameColumn, PriorityColumn,
} from "../component/expectation/listColumnCompoment";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { toastPromise } from "../component/common";
import { getExpectationSuccess } from "../slice/thunk";

const ExpectationPage = () => {
  const projectState = useAppSelector((state) => state.project);
  const expectationState = useAppSelector((state) => state.expectation);
  const currentProject = projectState.projectList[projectState.curProjectIndex];
  const dispatch: AppDispatch = useDispatch();
  const getExpectationListQuery = useQuery(
    ["getExpectationList", currentProject._id],
    () => {
      return getExpectationListReq(currentProject._id!).then((res) => {
        dispatch(getExpectationSuccess(currentProject._id!, res));
        return res;
      });
    }
  );

  const expectationColumn = [
    {
      title: "name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: ExpectationM, index: number) => {
        return (
          <NameColumn
            projectId={currentProject._id!}
            text={text}
            expectation={record}
            index={index}
            dispatch={dispatch}
          />
        );
      },
    },
    {
      title: "delay",
      dataIndex: "delay",
      key: "delay",
      render: (text: string, record: ExpectationM, index: number) => {
        return (
          <DelayColumn
            projectId={currentProject._id!}
            text={text}
            expectation={record}
            index={index}
            dispatch={dispatch}
          />
        );
      },
    },
    {
      title: "priority",
      dataIndex: "priority",
      key: "priority",
      render: (text: string, record: ExpectationM, index: number) => {
        return (
          <PriorityColumn
            projectId={currentProject._id!}
            text={text}
            expectation={record}
            index={index}
            dispatch={dispatch}
          />
        );
      },
    },
  ];
  return (
    <div>
      <div>
        <Button
          type={"text"}
          icon={<PlusOutlined />}
          onClick={async () => {
            // send request to add new expectation
            const createPromise = createExpectationReq(
              projectState.projectList[projectState.curProjectIndex]._id!,
              createExpectation()
            );
            toastPromise(createPromise);
            createPromise.then((res) => {
              getExpectationListQuery.refetch();
            });
          }}
        >
          Add Expectation
        </Button>
      </div>
      <div>
        <Table
          columns={expectationColumn}
          size={"small"}
          rowKey={"_id"}
          dataSource={expectationState.expectationList}
          loading={getExpectationListQuery.isFetching}
        />
      </div>
    </div>
  );
};
export default ExpectationPage;

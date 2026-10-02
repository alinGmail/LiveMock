import { Alert, App, Button, Table } from "antd";
import { PlusOutlined, ImportOutlined } from "@ant-design/icons";
import { AppDispatch, useAppSelector } from "../store";
import {
  createExpectationReq,
  listExpectationListReq,
} from "../server/expectationServer";
import { createGroupReq, listGroupReq } from "../server/groupServer";
import { createExpectation, ExpectationM } from "livemock-core/struct/expectation";
import {
  buildMatchOrderBlocks,
  createExpectationGroup,
  ExpectationGroupM,
} from "livemock-core/struct/expectationGroup";
import {
  ActionColumn,
  ActivateColumn,
  DelayColumn,
  MatcherColumn,
  NameColumn,
  OperationColumn,
  PriorityColumn,
} from "../component/expectation/listColumnCompoment";
import {
  ExpectationGroupSelectColumn,
  GroupActivateColumn,
  GroupNameColumn,
  GroupOperationColumn,
  GroupPriorityColumn,
  renderGroupExpandIcon,
} from "../component/expectation/groupColumnComponent";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { toastPromise } from "../component/common";
import { getExpectationSuccess } from "../slice/thunk";
import { Key, useEffect, useMemo, useState } from "react";
import { ExpectationContext } from "src/component/context";
import { ImportExpectationModal } from "../component/expectation/ImportExpectationModal";

type ExpectationRow = ExpectationM & { rowType: "expectation" };
interface GroupRow extends ExpectationGroupM {
  rowType: "group";
  children?: Array<ExpectationRow>;
}
type ExpectationTableRow = GroupRow | ExpectationRow;

function toExpectationRow(expectation: ExpectationM): ExpectationRow {
  return { ...expectation, rowType: "expectation" };
}

function nextGroupName(groups: Array<ExpectationGroupM>): string {
  const base = "New Group";
  const names = new Set(groups.map((group) => group.name));
  if (!names.has(base)) {
    return base;
  }
  let index = 2;
  while (names.has(`${base} ${index}`)) {
    index++;
  }
  return `${base} ${index}`;
}

const ExpectationPage = () => {
  const { modal } = App.useApp();
  const projectState = useAppSelector((state) => state.project);
  const expectationState = useAppSelector((state) => state.expectation);
  const currentProject = projectState.projectList[projectState.curProjectIndex];
  const dispatch: AppDispatch = useDispatch();
  const [importOpen, setImportOpen] = useState(false);
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<
    readonly Key[] | null
  >(null);
  const getExpectationListQuery = useQuery(
    ["getExpectationList", currentProject.id],
    () => {
      return listExpectationListReq(currentProject.id).then((res) => {
        dispatch(getExpectationSuccess(currentProject.id, res));
        return res;
      });
    }
  );
  const getGroupListQuery = useQuery(["getGroupList", currentProject.id], () => {
    return listGroupReq(currentProject.id);
  });
  const groupList = useMemo(
    () => getGroupListQuery.data ?? [],
    [getGroupListQuery.data]
  );
  const groupsLoaded = getGroupListQuery.data !== undefined;

  useEffect(() => {
    setExpandedGroupKeys(null);
  }, [currentProject.id]);

  const refreshAll = () => {
    getExpectationListQuery.refetch();
    getGroupListQuery.refetch();
  };

  const expectationIndexMap = useMemo(() => {
    const indexMap = new Map<string, number>();
    expectationState.expectationList.forEach((expectation, index) => {
      indexMap.set(expectation.id, index);
    });
    return indexMap;
  }, [expectationState.expectationList]);

  const memberCountMap = useMemo(() => {
    const countMap = new Map<string, number>();
    expectationState.expectationList.forEach((expectation) => {
      if (expectation.groupId) {
        countMap.set(
          expectation.groupId,
          (countMap.get(expectation.groupId) ?? 0) + 1
        );
      }
    });
    return countMap;
  }, [expectationState.expectationList]);

  const groupActiveMap = useMemo(() => {
    const activeMap = new Map<string, boolean>();
    groupList.forEach((group) => {
      activeMap.set(group.id, group.activate);
    });
    return activeMap;
  }, [groupList]);

  const tableRows = useMemo<Array<ExpectationTableRow>>(() => {
    if (!groupsLoaded) {
      return [];
    }
    return buildMatchOrderBlocks(
      expectationState.expectationList,
      groupList
    ).map((block) => {
      if (block.group) {
        const children = block.expectations.map(toExpectationRow);
        const groupRow: GroupRow = {
          ...block.group,
          rowType: "group",
          // no member rows means no expand control ([] would still be truthy)
          children: children.length > 0 ? children : undefined,
        };
        return groupRow;
      }
      return toExpectationRow(block.expectations[0]);
    });
  }, [expectationState.expectationList, groupList, groupsLoaded]);

  const allGroupRowKeys = useMemo(
    () => groupList.map((group) => `group-${group.id}`),
    [groupList]
  );

  const rowKey = (record: ExpectationTableRow) => {
    return record.rowType === "group" ? `group-${record.id}` : record.id;
  };

  const expectationIndex = (record: ExpectationRow) => {
    return expectationIndexMap.get(record.id) ?? 0;
  };

  const expectationColumn = [
    {
      title: "name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: ExpectationTableRow) => {
        if (record.rowType === "group") {
          return (
            <GroupNameColumn
              projectId={currentProject.id}
              group={record}
              memberCount={memberCountMap.get(record.id) ?? 0}
              onChanged={refreshAll}
            />
          );
        }
        return (
          <NameColumn
            projectId={currentProject.id}
            text={text}
            expectation={record}
            index={expectationIndex(record)}
            dispatch={dispatch}
          />
        );
      },
    },
    {
      title: "group",
      dataIndex: "groupId",
      key: "groupId",
      render: (text: string, record: ExpectationTableRow) => {
        if (record.rowType === "group") {
          return null;
        }
        return (
          <ExpectationGroupSelectColumn
            projectId={currentProject.id}
            expectation={record}
            groups={groupList}
            dispatch={dispatch}
            onChanged={refreshAll}
          />
        );
      },
    },
    {
      title: "delay",
      dataIndex: "delay",
      key: "delay",
      render: (text: string, record: ExpectationTableRow) => {
        if (record.rowType === "group") {
          return null;
        }
        return (
          <DelayColumn
            projectId={currentProject.id}
            text={text}
            expectation={record}
            index={expectationIndex(record)}
            dispatch={dispatch}
          />
        );
      },
    },
    {
      title: "priority",
      dataIndex: "priority",
      key: "priority",
      render: (text: string, record: ExpectationTableRow) => {
        if (record.rowType === "group") {
          return (
            <GroupPriorityColumn
              projectId={currentProject.id}
              group={record}
              onChanged={refreshAll}
            />
          );
        }
        return (
          <PriorityColumn
            projectId={currentProject.id}
            text={text}
            expectation={record}
            index={expectationIndex(record)}
            dispatch={dispatch}
          />
        );
      },
    },
    {
      title: "activate",
      dataIndex: "activate",
      key: "activate",
      render: (text: string, record: ExpectationTableRow) => {
        if (record.rowType === "group") {
          return (
            <GroupActivateColumn
              projectId={currentProject.id}
              group={record}
              onChanged={refreshAll}
            />
          );
        }
        return (
          <ActivateColumn
            projectId={currentProject.id}
            text={text}
            expectation={record}
            index={expectationIndex(record)}
            dispatch={dispatch}
          />
        );
      },
    },
    {
      title: "matchers",
      dataIndex: "matcher",
      key: "matchers",
      render: (text: string, record: ExpectationTableRow) => {
        if (record.rowType === "group") {
          return null;
        }
        return (
          <MatcherColumn
            projectId={currentProject.id}
            text={text}
            expectation={record}
            index={expectationIndex(record)}
            dispatch={dispatch}
          />
        );
      },
    },
    {
      title: "actions",
      dataIndex: "actions",
      key: "actions",
      render: (text: string, record: ExpectationTableRow) => {
        if (record.rowType === "group") {
          return null;
        }
        return (
          <ActionColumn
            projectId={currentProject.id}
            text={text}
            expectation={record}
            index={expectationIndex(record)}
            dispatch={dispatch}
          />
        );
      },
    },
    {
      title: "operation",
      dataIndex: "operation",
      key: "operation",
      render: (text: string, record: ExpectationTableRow) => {
        if (record.rowType === "group") {
          return (
            <GroupOperationColumn
              projectId={currentProject.id}
              group={record}
              memberCount={memberCountMap.get(record.id) ?? 0}
              modal={modal}
              onChanged={refreshAll}
            />
          );
        }
        return (
          <OperationColumn
            projectId={currentProject.id}
            text={text}
            expectation={record}
            index={expectationIndex(record)}
            dispatch={dispatch}
            modal={modal}
          />
        );
      },
    },
  ];
  return (
    <ExpectationContext.Provider
      value={{
        refreshExpectationList: () => {
          refreshAll();
        },
      }}
    >
      <div style={{ padding: "10px" }}>
        <div style={{ margin: "10px 0px" }}>
          <Button
            type={"text"}
            icon={<PlusOutlined />}
            onClick={async () => {
              // send request to add new expectation
              const createPromise = createExpectationReq(
                projectState.projectList[projectState.curProjectIndex].id,
                createExpectation()
              );
              toastPromise(createPromise);
              createPromise.then(() => {
                getExpectationListQuery.refetch();
              });
            }}
          >
            Add Expectation
          </Button>
          <Button
            type={"text"}
            icon={<PlusOutlined />}
            onClick={() => {
              // send request to add new empty group
              const createPromise = createGroupReq(
                currentProject.id,
                createExpectationGroup(nextGroupName(groupList))
              );
              toastPromise(createPromise);
              createPromise.then(() => {
                getGroupListQuery.refetch();
              });
            }}
          >
            Add Group
          </Button>
          <Button
            type={"text"}
            icon={<ImportOutlined />}
            onClick={() => {
              setImportOpen(true);
            }}
          >
            Import
          </Button>
        </div>
        <div>
          {getGroupListQuery.isError && (
            <Alert
              type={"error"}
              showIcon
              message={"failed to load groups, please refresh"}
              style={{ marginBottom: "8px" }}
            />
          )}
          <Table
            columns={expectationColumn}
            size={"small"}
            rowKey={rowKey}
            dataSource={tableRows}
            loading={
              getExpectationListQuery.isFetching ||
              getGroupListQuery.isFetching
            }
            expandable={{
              expandedRowKeys: expandedGroupKeys ?? allGroupRowKeys,
              onExpandedRowsChange: (keys) => {
                setExpandedGroupKeys(keys);
              },
              expandIcon: renderGroupExpandIcon,
            }}
            onRow={(record: ExpectationTableRow) => {
              const inactive =
                record.rowType === "group"
                  ? !record.activate
                  : record.groupId
                  ? groupActiveMap.get(record.groupId) === false
                  : false;
              return inactive ? { style: { opacity: 0.55 } } : {};
            }}
          />
        </div>
        <ImportExpectationModal
          projectId={currentProject.id}
          open={importOpen}
          onClose={() => {
            setImportOpen(false);
          }}
          onImported={() => {
            getExpectationListQuery.refetch();
          }}
        />
      </div>
    </ExpectationContext.Provider>
  );
};
export default ExpectationPage;

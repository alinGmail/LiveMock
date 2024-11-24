import { duplicateExpectation, ExpectationM } from "livemock-core/struct/expectation";
import { Button, Input, InputNumber, Switch } from "antd";
import { ChangeEvent } from "react";
import { AppDispatch } from "../../store";
import {
  addAction,
  addMatcher,
  deleteExpectation,
  modifyAction,
  modifyMatcher,
  removeAction,
  removeMatcher,
  updateExpectationItem,
} from "../../slice/expectationSlice";
import { useDebounceFn, useRequest } from "ahooks";
import { debounceWait } from "../../config";
import {
  createExpectationReq,
  deleteExpectationReq,
  updateExpectationReq,
} from "../../server/expectationServer";
import { toastPromise } from "../common";
import * as React from "react";
import {MatcherContext, ActionContext, useExpectationContext} from "../context";
import MatcherItem from "../matcher/MatcherItem";
import { CopyOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { createPathMatcher } from "livemock-core/struct/matcher";
import {
  createMatcherReq,
  deleteMatcherReq,
  updateMatcherReq,
} from "../../server/matcherServer";
import ActionItem from "../action/ActionItem";
import {
  ActionM,
  createCustomResponseAction,
  createProxyAction,
} from "livemock-core/struct/action";
import {
  createActionReq,
  deleteActionReq,
  updateActionReq,
} from "../../server/actionServer";
import { HookAPI as ModalHookAPI } from "antd/es/modal/useModal";

async function updateExpectation(
  projectId: string,
  expectationId: string,
  expectationUpdate: Partial<ExpectationM>
) {
  const updatePromise = updateExpectationReq(
    projectId,
    expectationId,
    expectationUpdate
  );
  toastPromise(updatePromise);
  return updatePromise;
}

export const NameColumn = ({
  projectId,
  text,
  expectation,
  index,
  dispatch,
}: {
  projectId: string;
  text: string;
  expectation: ExpectationM;
  index: number;
  dispatch: AppDispatch;
}) => {
  const { data, run } = useRequest(updateExpectation, {
    debounceWait: debounceWait,
    manual: true,
  });
  return (
    <div style={{
      width:"150px"
    }}>
      <Input
        placeholder={"empty"}
        value={expectation.name}
        onChange={(
          event: ChangeEvent<{
            value: string;
          }>
        ) => {
          run(projectId, expectation.id, {
            name: event.target.value,
          });
          dispatch(
            updateExpectationItem({
              expectationId:expectation.id,
              modifyValues: {
                name: event.target.value,
              },
            })
          );
          //
        }}
      />
    </div>
  );
};

interface NumberColumnProps {
  projectId: string;
  text: string;
  expectation: ExpectationM;
  index: number;
  dispatch: AppDispatch;
  valueKey: keyof ExpectationM;
  placeholder: string;
}

export const NumberColumn: React.FC<NumberColumnProps> = ({
  projectId,
  text,
  expectation,
  index,
  dispatch,
  valueKey,
  placeholder,
}) => {
  const { data, run } = useRequest(updateExpectation, {
    debounceWait: debounceWait,
    manual: true,
  });
  const handleChange = (number: number | null) => {
    if (number === null) return;
    run(projectId, expectation.id, {
      [valueKey]: number,
    });
    dispatch(
      updateExpectationItem({
        expectationId:expectation.id,
        modifyValues: {
          [valueKey]: number,
        },
      })
    );
  };
  return (
    <div>
      <InputNumber
        placeholder={placeholder}
        value={expectation[valueKey] as number}
        onChange={handleChange}
      />
    </div>
  );
};

/**
 * DelayColumn
 * @param props
 * @constructor
 */
export const DelayColumn: React.FC<
  Pick<
    NumberColumnProps,
    "projectId" | "text" | "expectation" | "dispatch" | "index"
  >
> = (props) => <NumberColumn {...props} valueKey="delay" placeholder="empty" />;

/**
 * PriorityColumn
 * @param props
 * @constructor
 */
export const PriorityColumn: React.FC<
  Pick<
    NumberColumnProps,
    "projectId" | "text" | "expectation" | "dispatch" | "index"
  >
> = (props) => (
  <NumberColumn {...props} valueKey="priority" placeholder="empty" />
);

/**
 * ActivateColumn
 * @param projectId
 * @param text
 * @param expectation
 * @param index
 * @param dispatch
 * @constructor
 */
export const ActivateColumn = ({
  projectId,
  text,
  expectation,
  index,
  dispatch,
}: {
  projectId: string;
  text: string;
  expectation: ExpectationM;
  index: number;
  dispatch: AppDispatch;
}) => {
  return (
    <div>
      <Switch
        checked={expectation.activate}
        onChange={(value) => {
          updateExpectation(projectId, expectation.id, {
            activate: value,
          });
          dispatch(
            updateExpectationItem({
              expectationId:expectation.id,
              modifyValues: {
                activate: value,
              },
            })
          );
          //
        }}
      />
    </div>
  );
};

export const MatcherColumn = ({
  projectId,
  text,
  expectation,
  index,
  dispatch,
}: {
  projectId: string;
  text: string;
  expectation: ExpectationM;
  index: number;
  dispatch: AppDispatch;
}) => {
  return (
    <div>
      {expectation.matchers.map((matcherItem, matcherIndex) => {
        return (
          <MatcherContext.Provider
            key={matcherIndex}
            value={{
              matcherIndex: matcherIndex,
              onMatcherAdd: (matcher) => {
                return;
              },
              onMatcherModify: (matcher) => {
                dispatch(
                  modifyMatcher({
                    expectationIndex: index,
                    matcherIndex: matcherIndex,
                    matcher,
                  })
                );
                const updatePromise = updateMatcherReq(matcher.id, {
                  projectId: projectId,
                  expectationId: expectation.id,
                  matcherUpdate: matcher,
                });
                toastPromise(updatePromise);
              },
              onMatcherDel: (matcher) => {
                dispatch(
                  removeMatcher({
                    expectationIndex: index,
                    matcher,
                  })
                );
                const deletePromise = deleteMatcherReq({
                  matcherId: matcher.id,
                  projectId: projectId,
                  expectationId: expectation.id,
                });
                toastPromise(deletePromise);
              },
            }}
          >
            <MatcherItem matcher={matcherItem} />
          </MatcherContext.Provider>
        );
      })}
      <MatcherAddBtn
        dispatch={dispatch}
        expectationIndex={index}
        projectId={projectId}
        expectationId={expectation.id}
      />
    </div>
  );
};

export const MatcherAddBtn = ({
  dispatch,
  expectationIndex,
  projectId,
  expectationId,
}: {
  dispatch: AppDispatch;
  expectationIndex: number;
  projectId: string;
  expectationId: string;
}) => {
  return (
    <Button
      type="text"
      onClick={() => {
        const newMatcher = createPathMatcher();
        dispatch(
          addMatcher({
            expectationIndex: expectationIndex,
            matcher: newMatcher,
          })
        );
        const createPromise = createMatcherReq({
          projectId: projectId,
          expectationId: expectationId,
          matcher: newMatcher,
        });
        toastPromise(createPromise);
      }}
      style={{
        fontSize: "14px",
        color: "#8c8c8c",
        lineHeight: "1.57",
      }}
      icon={
        <PlusOutlined
          style={{
            position: "relative",
            top: "0px",
          }}
        />
      }
    >
      Add Matcher
    </Button>
  );
};

export const ActionColumn = ({
  projectId,
  text,
  expectation,
  index,
  dispatch,
}: {
  projectId: string;
  text: string;
  expectation: ExpectationM;
  index: number;
  dispatch: AppDispatch;
}) => {
  const {
    run: updateAction,
    cancel,
    flush,
  } = useDebounceFn(
    (action: ActionM, projectId: string, expectation: ExpectationM) => {
      const updatePromise = updateActionReq(action.id, {
        expectationId: expectation.id,
        projectId,
        actionUpdate: action,
      });
      toastPromise(updatePromise);
    },
    { wait: debounceWait }
  );
  return (
    <div>
      <ActionContext.Provider
        value={{
          onActionModify: (action) => {
            dispatch(
              modifyAction({
                actionUpdate: action,
                expectationIndex: index,
              })
            );
            updateAction(action, projectId, expectation);
          },
          onActionRemove: (actionId) => {
            dispatch(removeAction({ actionId, expectationIndex: index }));
            const deletePromise = deleteActionReq(actionId, {
              projectId,
              expectationId: expectation.id,
            });
            toastPromise(deletePromise);
          },
        }}
      >
        {expectation.actions.map((item) => {
          return (
            <div key={item.id}>
              <ActionItem
                action={item}
                onPropertyChange={() => {
                  return;
                }}
              />
            </div>
          );
        })}
      </ActionContext.Provider>
      {expectation.actions.length === 0 && (
        <div>
          <Button
            style={{
              fontSize: "14px",
              color: "#8c8c8c",
              lineHeight: "1.57",
            }}
            onClick={() => {
              const action: ActionM = createCustomResponseAction();
              dispatch(
                addAction({
                  action,
                  expectationIndex: index,
                })
              );
              // send the request
              const createPromise = createActionReq({
                projectId: projectId,
                expectationId: expectation.id,
                action,
              });
              toastPromise(createPromise);
            }}
            type={"text"}
            icon={<PlusOutlined />}
          >
            Create Action
          </Button>
        </div>
      )}
    </div>
  );
};

export const OperationColumn = ({
  projectId,
  text,
  expectation,
  index,
  dispatch,
  modal,
}: {
  projectId: string;
  text: string;
  expectation: ExpectationM;
  index: number;
  dispatch: AppDispatch;
  modal: ModalHookAPI;
}) => {
  const expectationContext = useExpectationContext();
  return (
    <div>
      <Button
        title={"copy"}
        type={"text"}
        shape={"circle"}
        icon={<CopyOutlined />}
        onClick={() => {
          const expectation_dc = duplicateExpectation(expectation);
          const copyPromise = createExpectationReq(projectId, expectation_dc);
          toastPromise(copyPromise);
          expectationContext.refreshExpectationList();
        }}
      />
      <Button
        title={"delete"}
        type={"text"}
        onClick={() => {
          modal.confirm({
            title: "warning",
            content: `are you sure to delete expectation ${expectation.name} ?`,
            onOk: () => {
              const deletePromise = deleteExpectationReq(
                projectId,
                expectation.id
              );
              toastPromise(deletePromise);
              dispatch(deleteExpectation(expectation.id));
            },
            onCancel: () => {
              return;
            },
          });
        }}
        shape={"circle"}
        icon={<DeleteOutlined />}
      />
    </div>
  );
};

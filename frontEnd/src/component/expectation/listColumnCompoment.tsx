import { ExpectationM } from "core/struct/expectation";
import { Button, Input, InputNumber, Switch } from "antd";
import { ChangeEvent } from "react";
import { AppDispatch } from "../../store";
import {
  addMatcher,
  removeMatcher,
  updateExpectationItem,
} from "../../slice/expectationSlice";
import { useRequest } from "ahooks";
import { debounceWait } from "../../config";
import { updateExpectationReq } from "../../server/expectationServer";
import { toastPromise } from "../common";
import * as React from "react";
import { MatcherContext } from "../context";
import MatcherItem from "../matcher/MatcherItem";
import { PlusOutlined } from "@ant-design/icons";
import {
  createPathMatcher,
  MatcherCondition,
  RequestMatcherType,
} from "core/struct/matcher";
import { createMatcherReq, deleteMatcherReq } from "../../server/matcherServer";

async function updateExpectation(
  projectId: string,
  expectationId: string,
  updateQuery: any
) {
  const updatePromise = updateExpectationReq(
    projectId,
    expectationId,
    updateQuery
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
    <div>
      <Input
        placeholder={"empty"}
        value={expectation.name}
        onChange={(
          event: ChangeEvent<{
            value: string;
          }>
        ) => {
          run(projectId, expectation._id!, {
            $set: {
              name: event.target.value,
            },
          });
          dispatch(
            updateExpectationItem({
              expectationIndex: index,
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
    run(projectId, expectation._id!, {
      $set: {
        [valueKey]: number,
      },
    });
    dispatch(
      updateExpectationItem({
        expectationIndex: index,
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
          updateExpectation(projectId, expectation._id!, {
            $set: {
              activate: value,
            },
          });
          dispatch(
            updateExpectationItem({
              expectationIndex: index,
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
              onMatcherAdd: (matcher) => {},
              onMatcherModify: (matcher) => {
                /*dispatch(
                        modifyMatcher({
                            expectationIndex: expectationIndex,
                            matcherIndex: matcherIndex,
                            matcher,
                        })
                    );
                    matcherServer.updateMatcher(
                        record._id!,
                        matcherIndex,
                        matcher
                    );*/
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
                  expectationId: expectation._id!,
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
        expectationId={expectation._id!}
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
        let newMatcher = createPathMatcher();
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

export const OperationColumn = ({
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
      <Button type={"text"}>delete</Button>
    </div>
  );
};

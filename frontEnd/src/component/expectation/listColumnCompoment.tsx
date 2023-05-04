import { ExpectationM } from "core/struct/expectation";
import { Input, InputNumber } from "antd";
import { ChangeEvent } from "react";
import { AppDispatch } from "../../store";
import { updateExpectationItem } from "../../slice/expectationSlice";
import { useRequest } from "ahooks";
import { debounceWait } from "../../config";
import { updateExpectationReq } from "../../server/expectationServer";
import { toastPromise } from "../common";
import * as React from "react";

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

export const DelayColumn: React.FC<
  Pick<
    NumberColumnProps,
    "projectId" | "text" | "expectation" | "dispatch" | "index"
  >
> = (props) => <NumberColumn {...props} valueKey="delay" placeholder="empty" />;

export const PriorityColumn: React.FC<
  Pick<
    NumberColumnProps,
    "projectId" | "text" | "expectation" | "dispatch" | "index"
  >
> = (props) => (
  <NumberColumn {...props} valueKey="priority" placeholder="empty" />
);

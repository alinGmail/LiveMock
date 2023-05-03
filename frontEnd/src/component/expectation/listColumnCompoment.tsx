import { ExpectationM } from "core/struct/expectation";
import { Input, InputNumber } from "antd";
import { ChangeEvent } from "react";
import { AppDispatch } from "../../store";
import { updateExpectationItem } from "../../slice/expectationSlice";
import { useRequest } from "ahooks";
import { debounceWait } from "../../config";
import { updateExpectationReq } from "../../server/expectationServer";
import { toastPromise } from "../common";

async function updateExpectationName(
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
  const { data, run } = useRequest(updateExpectationName, {
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

export const DelayColumn = ({
  text,
  expectation,
  index,
  dispatch,
}: {
  text: string;
  expectation: ExpectationM;
  index: number;
  dispatch: AppDispatch;
}) => {
  return (
    <div>
      <InputNumber
        placeholder={"empty"}
        value={expectation.delay}
        onChange={(number) => {
          const { data, run } = useRequest(updateExpectationName, {
            debounceWait: debounceWait,
            manual: true,
          });
        }}
      />
    </div>
  );
};

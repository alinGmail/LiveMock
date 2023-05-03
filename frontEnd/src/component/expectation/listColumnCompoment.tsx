import { ExpectationM } from "core/struct/expectation";
import { Input } from "antd";
import { ChangeEvent } from "react";
import { AppDispatch } from "../../store";
import { updateExpectationState } from "../../slice/expectationSlice";
import { useRequest } from "ahooks";
import { debounceWait } from "../../config";

async function updateExpectationName(expectationId: string, updateQuery: any) {}

export const NameColumn = ({
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
      <Input
        placeholder={"empty"}
        value={expectation.name}
        onChange={(
          event: ChangeEvent<{
            value: string;
          }>
        ) => {
          const { data, run } = useRequest(updateExpectationName, {
            debounceWait: debounceWait,
            manual: true,
          });
          dispatch(
            updateExpectationState({
              updateFn: (expectationStateDraft) => {
                expectationStateDraft.expectationList[index].name =
                  event.target.value;
              },
            })
          );
          //
        }}
      />
    </div>
  );
};

import React from "react";
import { ExpectationM } from "core/struct/expectation";
import {Button, Tooltip} from "antd";
import { ActionType } from "core/struct/action";

const ExpectationBriefComponent: React.FC<{
  expectation: ExpectationM;
}> = ({ expectation }) => {
  const action = expectation.actions[0];

  let briefDescribe = "";

  switch (action.type) {
    case ActionType.CUSTOM_RESPONSE:
      briefDescribe = `response ${action.status} with ${action.responseContent.type}`;
      break;
    case ActionType.PROXY:
      briefDescribe = `proxy to ${action.host}`;
      break;
  }

  return (
    <span>
      <Tooltip title={briefDescribe} placement="top">
        <Button type={'text'}>{expectation.name}</Button>
      </Tooltip>
    </span>
  );
};

export default ExpectationBriefComponent;

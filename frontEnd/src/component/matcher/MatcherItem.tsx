import { FC, useCallback, useState } from "react";
import {
  HeaderMatcherM,
  MatcherCondition,
  matcherHasName,
  ParamMatcherM,
  QueryMatcherM,
  RequestMatcherM,
  RequestMatcherHasName,
  RequestMatcherType,
} from "core/struct/matcher";
import styles from "./MatcherItem.module.css";
import { Dropdown } from "antd";
import { useMatcherContext } from "../context";
import { NInput } from "../nui/NInput";
import { CloseSquareOutlined, CloseSquareTwoTone } from "@ant-design/icons";
import MatcherTypeSelector from "./MatcherTypeSelector";

const MatcherConditionMenu = ({
  onConditionChange,
}: {
  onConditionChange?: (condition: MatcherCondition) => void;
}) => {
  return (
    <div className="menuWrap">
      <div className="menu">
        {Object.values(MatcherCondition).map((matcherCondition) => {
          return (
            <div
              key={matcherCondition}
              className={"menuItem"}
              onClick={(event) => {
                onConditionChange && onConditionChange(matcherCondition);
              }}
            >
              {matcherCondition}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MatcherItem: FC<{
  matcher: RequestMatcherM;
}> = ({ matcher }) => {
  const [conditionDropShow, setConditionDropShow] = useState(false);
  const matcherContext = useMatcherContext();

  const onTypeChange = useCallback(
    (type: RequestMatcherType) => {
      switch (type) {
        case RequestMatcherType.METHOD:
          let _matcher: RequestMatcherM = {
            id: matcher.id,
            type: RequestMatcherType.METHOD,
            conditions: matcher.conditions,
            value: matcher.value,
          };
          matcherContext.onMatcherModify(_matcher);
          break;
        case RequestMatcherType.PATH:
          let _pathMatcher: RequestMatcherM = {
            id: matcher.id,
            type: RequestMatcherType.PATH,
            conditions: matcher.conditions,
            value: matcher.value,
          };
          matcherContext.onMatcherModify(_pathMatcher);
          break;
        case RequestMatcherType.QUERY:
          let _queryMatcher: QueryMatcherM = {
            id: matcher.id,
            type: RequestMatcherType.QUERY,
            conditions: matcher.conditions,
            value: matcher.value,
            name: "",
          };
          matcherContext.onMatcherModify(_queryMatcher);
          break;
        case RequestMatcherType.HEADER:
          let _headerMatcher: HeaderMatcherM = {
            id: matcher.id,
            type: RequestMatcherType.HEADER,
            conditions: matcher.conditions,
            value: matcher.value,
            name: "",
          };
          matcherContext.onMatcherModify(_headerMatcher);
          break;
        case RequestMatcherType.PARAM:
          let _paramMatcher: ParamMatcherM = {
            id: matcher.id,
            type: RequestMatcherType.PARAM,
            conditions: matcher.conditions,
            value: matcher.value,
            name: "",
          };
          matcherContext.onMatcherModify(_paramMatcher);
          break;
        default:
          break;
      }
    },
    [matcher, matcherContext.onMatcherModify]
  );
  const onConditionChange = useCallback(
    (condition: MatcherCondition) => {
      let _matcher: RequestMatcherM = {
        ...matcher,
        conditions: condition,
      };
      matcherContext.onMatcherModify(_matcher);
      setConditionDropShow(false);
    },
    [matcher, matcherContext.onMatcherModify]
  );

  const onValueChange = useCallback(
    (value: string) => {
      let _matcher: RequestMatcherM = {
        ...matcher,
        value: value,
      };
      matcherContext.onMatcherModify(_matcher);
    },
    [matcher, matcherContext.onMatcherModify]
  );

  const onDelMatcher = useCallback(() => {
    matcherContext.onMatcherDel(matcher);
  }, [matcher, matcherContext.onMatcherDel]);

  const onNameChange = useCallback(
    (name: string) => {
      if (matcherHasName(matcher)) {
        let _matcher: RequestMatcherHasName = {
          ...(matcher as RequestMatcherHasName),
          name: name,
        };
        matcherContext.onMatcherModify(_matcher);
      }
    },
    [matcher, matcherContext.onMatcherModify]
  );

  return (
    <div className={styles.itemOutWrap}>
      <div className={styles.itemWrap}>
        <MatcherTypeSelector onTypeChange={onTypeChange} type={matcher.type} />
        {matcherHasName(matcher) && (
          <div
            style={{
              display: "inline-block",
              fontSize: "14px",
              lineHeight: "24px",
            }}
          >
            <NInput
              value={(matcher as RequestMatcherHasName).name}
              onChange={onNameChange}
            />
          </div>
        )}
        <Dropdown
          visible={conditionDropShow}
          onVisibleChange={(visible) => {
            setConditionDropShow(visible);
          }}
          overlay={
            <MatcherConditionMenu
              onConditionChange={(condition) => {
                onConditionChange(condition);
              }}
            />
          }
          trigger={["click"]}
        >
          <span className={styles.textBtn}>
            {matcher.conditions.toLowerCase()}
          </span>
        </Dropdown>
        <div
          style={{
            display: "inline-block",
            fontSize: "14px",
            lineHeight: "24px",
          }}
        >
          <NInput value={matcher.value} onChange={onValueChange} />
        </div>
        <div
          style={{
            display: "inline-block",
            margin: "0px 4px",
          }}
        >
          <CloseSquareOutlined
            className={styles.closeBtn}
            onClick={() => {
              onDelMatcher();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MatcherItem;

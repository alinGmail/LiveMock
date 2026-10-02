import { v4 as uuId } from "uuid";
import { ExpectationM } from "./expectation";

export interface ExpectationGroupM {
  id: string;
  name: string;
  activate: boolean;
  priority: number;
  createTime: Date;
  $loki?: number;
}

export function createExpectationGroup(name = ""): ExpectationGroupM {
  return {
    activate: true,
    createTime: new Date(),
    id: uuId(),
    name,
    priority: 0,
  };
}

function createTimeValue(createTime: Date | string): number {
  if (createTime instanceof Date) {
    return createTime.getTime();
  }
  return new Date(createTime).getTime();
}

/**
 * The match order shared by the mock engine and the expectation list.
 * Every group is one block and every ungrouped expectation is a block of its
 * own. A block is ranked by (priority, createTime), both descending, so a
 * later-created block wins a tie. Inside a group, members are ranked by
 * (member priority, member createTime), also descending. The winner of a block
 * comparison precedes the other block entirely.
 */
export function sortExpectationsByMatchOrder(
  expectations: Array<ExpectationM>,
  groups: Array<ExpectationGroupM>
): Array<ExpectationM> {
  const groupMap = new Map<string, ExpectationGroupM>();
  groups.forEach((group) => groupMap.set(group.id, group));

  const matchOrderKey = (expectation: ExpectationM): Array<number> => {
    const group = expectation.groupId
      ? groupMap.get(expectation.groupId)
      : undefined;
    const blockPriority = group ? group.priority : expectation.priority;
    const blockCreateTime = group
      ? createTimeValue(group.createTime)
      : createTimeValue(expectation.createTime);
    return [
      blockPriority,
      blockCreateTime,
      expectation.priority,
      createTimeValue(expectation.createTime),
    ];
  };

  return [...expectations].sort((a, b) => {
    const keyA = matchOrderKey(a);
    const keyB = matchOrderKey(b);
    for (let index = 0; index < keyA.length; index++) {
      if (keyA[index] !== keyB[index]) {
        return keyB[index] - keyA[index];
      }
    }
    return 0;
  });
}

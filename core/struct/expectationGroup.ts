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
 * One block of the match order: either a group (possibly empty) with its
 * member expectations, or a single ungrouped expectation (group === null).
 */
export interface MatchOrderBlock {
  group: ExpectationGroupM | null;
  expectations: Array<ExpectationM>;
}

function compareDescending(a: Array<number>, b: Array<number>): number {
  for (let index = 0; index < a.length; index++) {
    if (a[index] !== b[index]) {
      return b[index] - a[index];
    }
  }
  return 0;
}

function expectationKey(expectation: ExpectationM): Array<number> {
  return [expectation.priority, createTimeValue(expectation.createTime)];
}

function blockKey(block: MatchOrderBlock): Array<number> {
  if (block.group) {
    return [block.group.priority, createTimeValue(block.group.createTime)];
  }
  return expectationKey(block.expectations[0]);
}

/**
 * The match order shared by the mock engines, the list endpoints and the
 * exception page. Every group is one block (also when it has no members),
 * every ungrouped expectation is a block of its own, and an expectation whose
 * group is missing is treated as ungrouped. A block is ranked by
 * (priority, createTime), both descending, so a later-created block wins a
 * tie; inside a group, members are ranked the same way. The winner of a block
 * comparison precedes the other block entirely.
 */
export function buildMatchOrderBlocks(
  expectations: Array<ExpectationM>,
  groups: Array<ExpectationGroupM>
): Array<MatchOrderBlock> {
  const groupMap = new Map<string, ExpectationGroupM>();
  groups.forEach((group) => groupMap.set(group.id, group));

  const blocks: Array<MatchOrderBlock> = [];
  const groupBlocks = new Map<string, MatchOrderBlock>();
  groups.forEach((group) => {
    const block: MatchOrderBlock = { group, expectations: [] };
    groupBlocks.set(group.id, block);
    blocks.push(block);
  });

  expectations.forEach((expectation) => {
    const group = expectation.groupId
      ? groupMap.get(expectation.groupId)
      : undefined;
    const groupBlock = group ? groupBlocks.get(group.id) : undefined;
    if (groupBlock) {
      groupBlock.expectations.push(expectation);
    } else {
      blocks.push({ group: null, expectations: [expectation] });
    }
  });

  blocks.forEach((block) => {
    block.expectations.sort((a, b) =>
      compareDescending(expectationKey(a), expectationKey(b))
    );
  });
  blocks.sort((a, b) => compareDescending(blockKey(a), blockKey(b)));
  return blocks;
}

export function sortExpectationsByMatchOrder(
  expectations: Array<ExpectationM>,
  groups: Array<ExpectationGroupM>
): Array<ExpectationM> {
  return buildMatchOrderBlocks(expectations, groups).reduce(
    (result, block) => result.concat(block.expectations),
    [] as Array<ExpectationM>
  );
}

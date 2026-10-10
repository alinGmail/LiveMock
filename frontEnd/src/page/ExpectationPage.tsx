import { useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AppDispatch, useAppSelector } from "../store";
import {
  createExpectationReq,
  listExpectationReq,
} from "../server/expectationServer";
import { listGroupReq } from "../server/groupServer";
import {
  createExpectation,
  ExpectationM,
} from "livemock-core/struct/expectation";
import {
  buildMatchOrderBlocks,
  ExpectationGroupM,
} from "livemock-core/struct/expectationGroup";
import { createCustomResponseAction } from "livemock-core/struct/action";
import { getExpectationSuccess } from "../slice/thunk";
import ExpectationDetail from "../component/expectation/ExpectationDetail";
import AddExpectationModal, {
  AddExpectationValues,
} from "../component/expectation/AddExpectationModal";
import { getErrorMessage } from "../component/common";
import {
  actionKind,
  actionLabel,
  matcherHaystack,
} from "../component/expectation/display";
import styles from "./ExpectationPage.module.scss";

const BADGE_CLASS = {
  custom: styles.badgeCustom,
  proxy: styles.badgeProxy,
  static: styles.badgeStatic,
};

const Chevron = () => (
  <svg
    className={styles.chevIcon}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const SearchIcon = () => (
  <svg
    className={styles.searchIcon}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const PlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const ClockIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const EmptyState = ({ query }: { query: string }) => (
  <div className={styles.empty}>
    <span className={styles.emptyGlyph}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    </span>
    {query ? (
      <>
        <h3>No matches</h3>
        <p>Nothing matches “{query}”. Try a different name or matcher.</p>
      </>
    ) : (
      <>
        <h3>No expectations</h3>
        <p>This project has no expectations yet.</p>
      </>
    )}
  </div>
);

const ExpectationPage = () => {
  const projectState = useAppSelector((state) => state.project);
  const expectationState = useAppSelector((state) => state.expectation);
  const dispatch: AppDispatch = useDispatch();
  const currentProject = projectState.projectList[projectState.curProjectIndex];

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const [addOpen, setAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const wasAddOpenRef = useRef(false);

  useEffect(() => {
    if (wasAddOpenRef.current && !addOpen) {
      addButtonRef.current?.focus();
    }
    wasAddOpenRef.current = addOpen;
  }, [addOpen]);

  const getExpectationListQuery = useQuery(
    ["getExpectationList", currentProject.id],
    () => {
      return listExpectationReq(currentProject.id).then((res) => {
        dispatch(getExpectationSuccess(currentProject.id, res));
        return res;
      });
    },
  );
  const getGroupListQuery = useQuery(["getGroupList", currentProject.id], () => {
    return listGroupReq(currentProject.id);
  });

  const groupList = useMemo(
    () => getGroupListQuery.data ?? [],
    [getGroupListQuery.data],
  );
  const groupsLoaded = getGroupListQuery.data !== undefined;
  const expectationList = expectationState.expectationList;

  useEffect(() => {
    setQuery("");
    setSelectedId(null);
    setCollapsedGroups(new Set());
  }, [currentProject.id]);

  const groupMap = useMemo(() => {
    const map = new Map<string, ExpectationGroupM>();
    groupList.forEach((group) => map.set(group.id, group));
    return map;
  }, [groupList]);

  const q = query.trim().toLowerCase();

  const haystackMap = useMemo(() => {
    const map = new Map<string, string>();
    expectationList.forEach((expectation) => {
      const groupName = expectation.groupId
        ? groupMap.get(expectation.groupId)?.name ?? ""
        : "ungrouped";
      const text = [
        expectation.name,
        expectation.description ?? "",
        groupName,
        ...(expectation.matchers ?? []).map(matcherHaystack),
      ]
        .join(" ")
        .toLowerCase();
      map.set(expectation.id, text);
    });
    return map;
  }, [expectationList, groupMap]);

  const allBlocks = useMemo(() => {
    if (!groupsLoaded) {
      return [];
    }
    return buildMatchOrderBlocks(expectationList, groupList);
  }, [expectationList, groupList, groupsLoaded]);

  const orderedAll = useMemo(
    () => allBlocks.flatMap((block) => block.expectations),
    [allBlocks],
  );

  // The visible list is filtered by the search, but selection is driven by the
  // full list so that filtering the selected expectation out keeps its detail
  // shown (the detail empty state is reserved for an actually empty project).
  const blocks = useMemo(() => {
    if (!q) {
      return allBlocks;
    }
    const filtered = expectationList.filter((expectation) =>
      (haystackMap.get(expectation.id) ?? "").includes(q),
    );
    return buildMatchOrderBlocks(filtered, groupList);
  }, [allBlocks, expectationList, groupList, q, haystackMap]);

  useEffect(() => {
    if (orderedAll.length === 0) {
      if (selectedId) {
        setSelectedId(null);
      }
      return;
    }
    if (!selectedId || !orderedAll.some((item) => item.id === selectedId)) {
      setSelectedId(orderedAll[0].id);
    }
  }, [orderedAll, selectedId]);

  const selectedExpectation = useMemo(
    () => expectationList.find((item) => item.id === selectedId) ?? null,
    [expectationList, selectedId],
  );
  const selectedGroup = selectedExpectation?.groupId
    ? groupMap.get(selectedExpectation.groupId) ?? null
    : null;

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreate = async (values: AddExpectationValues) => {
    const expectation = createExpectation();
    expectation.name = values.name.trim() || "New expectation";
    expectation.description = values.description.trim();
    expectation.groupId = values.groupId;
    expectation.actions = [createCustomResponseAction()];
    setCreating(true);
    let created: ExpectationM;
    try {
      created = await createExpectationReq(currentProject.id, expectation);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setCreating(false);
      return;
    }
    // The expectation exists from here on: close the dialog and select it even
    // if refreshing the list fails, so pressing Create again cannot duplicate it.
    setQuery("");
    setAddOpen(false);
    setSelectedId(created.id);
    setCreating(false);
    getExpectationListQuery.refetch().catch(() => {
      toast.error("Expectation created, but the list failed to refresh.");
    });
  };

  const isLoading =
    getExpectationListQuery.isFetching || getGroupListQuery.isFetching;

  const renderRow = (
    expectation: ExpectationM,
    group: ExpectationGroupM | null,
  ) => {
    const active = expectation.activate && (!group || group.activate);
    const selected = expectation.id === selectedId;
    const firstAction = expectation.actions?.[0];
    return (
      <button
        key={expectation.id}
        type="button"
        className={[
          styles.expRow,
          active ? styles.expRowActive : "",
          selected ? styles.expRowSelected : "",
          active ? "" : styles.expRowInactive,
        ].join(" ")}
        onClick={() => setSelectedId(expectation.id)}
        aria-pressed={selected}
      >
        <span className={styles.rowDot} aria-hidden="true" />
        <span className={styles.rowMain}>
          <span className={styles.rowName}>{expectation.name || "empty"}</span>
          <span className={styles.rowSub}>
            {expectation.description ? (
              <span className={styles.rowDesc}>
                {expectation.description}
              </span>
            ) : (
              <span className={styles.mutedText}>no description</span>
            )}
          </span>
        </span>
        <span className={styles.rowMeta}>
          {expectation.delay > 0 ? (
            <span className={styles.delayTag} title="delay">
              <ClockIcon />
              {expectation.delay}ms
            </span>
          ) : null}
          {firstAction ? (
            <span
              className={[
                styles.actionBadge,
                BADGE_CLASS[actionKind(firstAction.type)],
              ].join(" ")}
            >
              {actionLabel(firstAction.type)}
            </span>
          ) : null}
        </span>
      </button>
    );
  };

  const masterNodes: Array<ReactNode> = [];
  let previousWasUngrouped = false;
  blocks.forEach((block) => {
    if (block.group) {
      const group = block.group;
      if (q && block.expectations.length === 0) {
        return;
      }
      const collapsed = collapsedGroups.has(group.id);
      masterNodes.push(
        <div
          key={`group-${group.id}`}
          className={[
            styles.groupHead,
            collapsed ? styles.groupHeadCollapsed : "",
          ].join(" ")}
        >
          <button
            type="button"
            className={styles.chev}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand group" : "Collapse group"}
            onClick={() => toggleGroup(group.id)}
          >
            <Chevron />
          </button>
          <span className={styles.groupName}>
            {group.name || "unnamed group"}
          </span>
          <span className={styles.count}>{block.expectations.length}</span>
          <span className={styles.grow} />
          {!group.activate ? (
            <span className={styles.inactiveTag}>inactive</span>
          ) : null}
          <span className={styles.prioPill} title="group priority">
            P{group.priority}
          </span>
          <span
            className={[
              styles.switch,
              group.activate ? styles.switchOn : "",
            ].join(" ")}
            role="switch"
            aria-checked={group.activate}
            aria-disabled="true"
            title="Group activation (read-only in this step)"
          >
            <span className={styles.switchKnob} />
          </span>
        </div>,
      );
      masterNodes.push(
        <div
          key={`group-body-${group.id}`}
          className={[
            styles.groupBody,
            collapsed ? styles.groupBodyCollapsed : "",
          ].join(" ")}
        >
          {block.expectations.map((expectation) =>
            renderRow(expectation, group),
          )}
        </div>,
      );
      previousWasUngrouped = false;
      return;
    }

    const expectation = block.expectations[0];
    if (!expectation) {
      return;
    }
    if (!previousWasUngrouped) {
      masterNodes.push(
        <div
          key={`ungrouped-label-${expectation.id}`}
          className={styles.sectionLabel}
        >
          Ungrouped
        </div>,
      );
    }
    previousWasUngrouped = true;
    masterNodes.push(renderRow(expectation, null));
  });

  return (
    <div className={styles.page}>
      <div className={styles.workspace}>
        <section className={styles.master} aria-label="Expectations">
          <div className={styles.toolbar}>
            <button
              ref={addButtonRef}
              type="button"
              className={styles.addButton}
              onClick={() => setAddOpen(true)}
            >
              <PlusIcon />
              Add Expectation
            </button>
          </div>
          <label className={styles.searchWrap}>
            <SearchIcon />
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Filter by name, description, matcher or group…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              aria-label="Filter expectations"
            />
          </label>
          {getGroupListQuery.isError ? (
            <div className={styles.error}>
              Failed to load groups. Please refresh.
            </div>
          ) : null}
          <div className={styles.list} role="list">
            {masterNodes.length ? (
              masterNodes
            ) : isLoading ? null : (
              <EmptyState query={q} />
            )}
          </div>
        </section>
        <ExpectationDetail
          expectation={selectedExpectation}
          group={selectedGroup}
        />
      </div>
      {addOpen ? (
        <AddExpectationModal
          groups={groupList}
          creating={creating}
          onCreate={handleCreate}
          onClose={() => setAddOpen(false)}
        />
      ) : null}
    </div>
  );
};

export default ExpectationPage;

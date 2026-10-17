import { useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { App } from "antd";
import { AppDispatch, useAppSelector } from "../store";
import {
  createExpectationReq,
  listExpectationListReq,
  updateExpectationReq,
} from "../server/expectationServer";
import {
  createGroupReq,
  listGroupReq,
  updateGroupReq,
} from "../server/groupServer";
import {
  createActionReq,
  deleteActionReq,
  updateActionReq,
} from "../server/actionServer";
import {
  createExpectation,
  ExpectationM,
} from "livemock-core/struct/expectation";
import {
  buildMatchOrderBlocks,
  createExpectationGroup,
  ExpectationGroupM,
} from "livemock-core/struct/expectationGroup";
import {
  ActionM,
  createCustomResponseAction,
} from "livemock-core/struct/action";
import { RequestMatcherM } from "livemock-core/struct/matcher";
import {
  addAction,
  modifyAction,
  removeAction,
  updateExpectationItem,
} from "../slice/expectationSlice";
import { getExpectationSuccess } from "../slice/thunk";
import ExpectationDetail from "../component/expectation/ExpectationDetail";
import AddExpectationModal, {
  AddExpectationValues,
} from "../component/expectation/AddExpectationModal";
import ActionEditorModal from "../component/expectation/ActionEditorModal";
import DescriptionEditorModal from "../component/expectation/DescriptionEditorModal";
import NameEditorModal from "../component/expectation/NameEditorModal";
import MatchersEditorModal from "../component/expectation/MatchersEditorModal";
import TimingEditorModal, {
  TimingValues,
} from "../component/expectation/TimingEditorModal";
import GroupEditorModal, {
  GroupEditorValues,
} from "../component/expectation/GroupEditorModal";
import Toggle from "../component/Toggle";
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

const FolderPlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 5h5l2 2h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
    <path d="M12 11v5M9.5 13.5h5" />
  </svg>
);

const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="5" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="19" cy="12" r="1.6" />
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

function nextGroupName(names: Array<string>): string {
  const base = "New group";
  if (!names.includes(base)) {
    return base;
  }
  let index = 2;
  while (names.includes(`${base} ${index}`)) {
    index += 1;
  }
  return `${base} ${index}`;
}

type GroupModalState =
  | { mode: "create" }
  | { mode: "edit"; group: ExpectationGroupM };

const ExpectationPage = () => {
  const projectState = useAppSelector((state) => state.project);
  const expectationState = useAppSelector((state) => state.expectation);
  const dispatch: AppDispatch = useDispatch();
  const { modal } = App.useApp();
  const currentProject = projectState.projectList[projectState.curProjectIndex];

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const [addOpen, setAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [groupModal, setGroupModal] = useState<GroupModalState | null>(null);
  const [groupSaving, setGroupSaving] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionM | null>(null);
  const [actionSaving, setActionSaving] = useState(false);
  const [matchersOpen, setMatchersOpen] = useState(false);
  const [matchersSaving, setMatchersSaving] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [descriptionSaving, setDescriptionSaving] = useState(false);
  const [timingOpen, setTimingOpen] = useState(false);
  const [timingSaving, setTimingSaving] = useState(false);
  const [activeSaving, setActiveSaving] = useState(false);
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
      return listExpectationListReq(currentProject.id).then((res) => {
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

  const editingGroupId =
    groupModal?.mode === "edit" ? groupModal.group.id : null;
  const groupNamesForValidation = groupList
    .filter((group) => group.id !== editingGroupId)
    .map((group) => group.name);
  const defaultGroupName = nextGroupName(groupList.map((group) => group.name));

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
    setQuery("");
    setAddOpen(false);
    setCreating(false);
    getExpectationListQuery
      .refetch()
      .then(() => {
        setSelectedId(created.id);
      })
      .catch(() => {
        toast.error("Expectation created, but the list failed to refresh.");
      });
  };

  const handleSubmitGroup = async (values: GroupEditorValues) => {
    setGroupSaving(true);
    try {
      if (groupModal?.mode === "edit") {
        await updateGroupReq(currentProject.id, groupModal.group.id, values);
        toast.success("Group updated");
      } else {
        const group = createExpectationGroup();
        group.name = values.name;
        group.priority = values.priority;
        group.activate = values.activate;
        await createGroupReq(currentProject.id, group);
        toast.success("Group created");
      }
      setGroupModal(null);
      getGroupListQuery.refetch().catch(() => {
        toast.error("Group saved, but the list failed to refresh.");
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setGroupSaving(false);
    }
  };

  const handleToggleGroupActive = async (group: ExpectationGroupM) => {
    try {
      await updateGroupReq(currentProject.id, group.id, {
        activate: !group.activate,
      });
      await getGroupListQuery.refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleEditAction = () => {
    const first = selectedExpectation?.actions?.[0];
    if (first) {
      setEditingAction(first);
    }
  };

  const handleSaveAction = async (action: ActionM) => {
    if (!selectedId) {
      return;
    }
    const index = expectationList.findIndex((item) => item.id === selectedId);
    if (index < 0) {
      return;
    }
    setActionSaving(true);
    try {
      await updateActionReq(action.id, {
        projectId: currentProject.id,
        expectationId: selectedId,
        actionUpdate: action,
      });
      dispatch(modifyAction({ expectationIndex: index, actionUpdate: action }));
      setEditingAction(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionSaving(false);
    }
  };

  const handleDeleteAction = () => {
    const first = selectedExpectation?.actions?.[0];
    if (!first || !selectedId) {
      return;
    }
    modal.confirm({
      title: "Delete action?",
      content: "This removes the action from this expectation.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const index = expectationList.findIndex(
          (item) => item.id === selectedId,
        );
        if (index < 0) {
          return;
        }
        try {
          await deleteActionReq(first.id, {
            projectId: currentProject.id,
            expectationId: selectedId,
          });
          dispatch(
            removeAction({ expectationIndex: index, actionId: first.id }),
          );
        } catch (error) {
          toast.error(getErrorMessage(error));
        }
      },
    });
  };

  const handleAddAction = async () => {
    if (!selectedId) {
      return;
    }
    const index = expectationList.findIndex((item) => item.id === selectedId);
    if (index < 0) {
      return;
    }
    const action = createCustomResponseAction();
    try {
      await createActionReq({
        projectId: currentProject.id,
        expectationId: selectedId,
        action,
      });
      dispatch(addAction({ expectationIndex: index, action }));
      setEditingAction(action);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleSaveMatchers = async (matchers: Array<RequestMatcherM>) => {
    if (!selectedId) {
      return;
    }
    setMatchersSaving(true);
    try {
      await updateExpectationReq(currentProject.id, selectedId, { matchers });
      dispatch(
        updateExpectationItem({
          expectationId: selectedId,
          modifyValues: { matchers },
        }),
      );
      setMatchersOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setMatchersSaving(false);
    }
  };

  const handleSaveDescription = async (description: string) => {
    if (!selectedId) {
      return;
    }
    setDescriptionSaving(true);
    try {
      await updateExpectationReq(currentProject.id, selectedId, {
        description,
      });
      dispatch(
        updateExpectationItem({
          expectationId: selectedId,
          modifyValues: { description },
        }),
      );
      setDescriptionOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDescriptionSaving(false);
    }
  };

  const handleSaveName = async (name: string) => {
    if (!selectedId) {
      return;
    }
    setNameSaving(true);
    try {
      await updateExpectationReq(currentProject.id, selectedId, { name });
      dispatch(
        updateExpectationItem({
          expectationId: selectedId,
          modifyValues: { name },
        }),
      );
      setNameOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setNameSaving(false);
    }
  };

  const handleSaveTiming = async (values: TimingValues) => {
    if (!selectedId) {
      return;
    }
    setTimingSaving(true);
    try {
      await updateExpectationReq(currentProject.id, selectedId, values);
      dispatch(
        updateExpectationItem({
          expectationId: selectedId,
          modifyValues: values,
        }),
      );
      setTimingOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setTimingSaving(false);
    }
  };

  const handleToggleActive = () => {
    if (!selectedId || !selectedExpectation || activeSaving) {
      return;
    }
    const activate = !selectedExpectation.activate;
    setActiveSaving(true);
    dispatch(
      updateExpectationItem({
        expectationId: selectedId,
        modifyValues: { activate },
      }),
    );
    updateExpectationReq(currentProject.id, selectedId, { activate })
      .catch((error) => {
        dispatch(
          updateExpectationItem({
            expectationId: selectedId,
            modifyValues: { activate: !activate },
          }),
        );
        toast.error(getErrorMessage(error));
      })
      .finally(() => setActiveSaving(false));
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
          <Toggle
            checked={group.activate}
            onChange={() => handleToggleGroupActive(group)}
            label={`Toggle group ${group.name || "unnamed group"}`}
          />
          <button
            type="button"
            className={styles.groupEdit}
            title="Edit group"
            aria-label={`Edit group ${group.name || "unnamed group"}`}
            onClick={() => setGroupModal({ mode: "edit", group })}
          >
            <MoreIcon />
          </button>
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
            <span className={styles.grow} />
            <button
              type="button"
              className={styles.groupAddButton}
              title="Add group"
              aria-label="Add group"
              onClick={() => setGroupModal({ mode: "create" })}
            >
              <FolderPlusIcon />
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
          onEditName={() => setNameOpen(true)}
          onEditAction={handleEditAction}
          onDeleteAction={handleDeleteAction}
          onAddAction={handleAddAction}
          onEditDescription={() => setDescriptionOpen(true)}
          onEditMatchers={() => setMatchersOpen(true)}
          onEditTiming={() => setTimingOpen(true)}
          onToggleActive={handleToggleActive}
          activeSaving={activeSaving}
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
      {editingAction ? (
        <ActionEditorModal
          action={editingAction}
          saving={actionSaving}
          onSave={handleSaveAction}
          onClose={() => setEditingAction(null)}
        />
      ) : null}
      {nameOpen && selectedExpectation ? (
        <NameEditorModal
          name={selectedExpectation.name ?? ""}
          saving={nameSaving}
          onSave={handleSaveName}
          onClose={() => setNameOpen(false)}
        />
      ) : null}
      {descriptionOpen && selectedExpectation ? (
        <DescriptionEditorModal
          description={selectedExpectation.description ?? ""}
          saving={descriptionSaving}
          onSave={handleSaveDescription}
          onClose={() => setDescriptionOpen(false)}
        />
      ) : null}
      {matchersOpen && selectedExpectation ? (
        <MatchersEditorModal
          matchers={selectedExpectation.matchers ?? []}
          saving={matchersSaving}
          onSave={handleSaveMatchers}
          onClose={() => setMatchersOpen(false)}
        />
      ) : null}
      {timingOpen && selectedExpectation ? (
        <TimingEditorModal
          expectation={selectedExpectation}
          groups={groupList}
          saving={timingSaving}
          onSave={handleSaveTiming}
          onClose={() => setTimingOpen(false)}
        />
      ) : null}
      {groupModal ? (
        <GroupEditorModal
          mode={groupModal.mode}
          group={groupModal.mode === "edit" ? groupModal.group : undefined}
          defaultName={defaultGroupName}
          existingNames={groupNamesForValidation}
          saving={groupSaving}
          onSubmit={handleSubmitGroup}
          onClose={() => setGroupModal(null)}
        />
      ) : null}
    </div>
  );
};

export default ExpectationPage;

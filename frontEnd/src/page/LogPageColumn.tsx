import {Button, Dropdown} from "antd";
import { EllipsisOutlined, PlusOutlined } from "@ant-design/icons";
import {FilterType, LogM} from "core/struct/log";
import {Dispatch, useState} from "react";
import {ColumnsType, ColumnType} from "antd/es/table";
import {AnyAction} from "@reduxjs/toolkit";
import {
    ColumnDisplayType, modifyTableColumn,
    setColumnEdit,
    setDefaultColumnVisible,
    showColumnEditor,
    TableColumnItem
} from "../slice/logSlice";
import Icon from "antd/es/icon";
import mStyle from "./LogPageColumn.module.scss"
import Equalizer from "../svg/equalizer.svg";
import Eye from "../svg/eye.svg";
import _ from "lodash";
import ReactJson from "react-json-view";


export const configColumn = [
  {
    dataIndex: "config",
    key: "config",
    width: "100px",
    render: () => <div></div>,
    title: () => {
      return (
        <div>
          <Button
            icon={<PlusOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              //dispatch(showColumnEditor());
              /*dispatch(
                    addTableColumn({
                        id: uuId(),
                        name: "",
                        label: "",
                        path: "",
                        displayType: ColumnDisplayType.TEXT,
                        visible: true,
                    })
                );*/
            }}
            type={"text"}
            size={"small"}
          />
          <Button
            icon={<EllipsisOutlined />}
            type={"text"}
            size={"small"}
            onClick={(event) => {
              event.stopPropagation();
              //dispatch(showColumnConfig());
            }}
          />
        </div>
      );
    },
  },
];


export function getDefaultColumn(
    dispatch: Dispatch<AnyAction>
): ColumnsType<LogM> {
    const res = [
        {
            title: getDefaultColumnHead("method", dispatch, 0),
            dataIndex: "req.method",
            key: "req.method",
            width: "300px",
            render: (text: string, record: any, index: number) => {
                return <div>{record.req.method}</div>;
            },
        },
        {
            title: getDefaultColumnHead("path", dispatch, 1),
            dataIndex: "path",
            key: "path",
            width: "300px",
            render: (text: string, record: any, index: number) => {
                return <div>{record.req.path}</div>;
            },
        },
        {
            title: getDefaultColumnHead("body", dispatch, 2),
            dataIndex: "body",
            key: "body",
            width: "300px",
            render: (text: string, record: any, index: number) => {
                return (
                    <div
                        style={{
                            lineHeight: "1.2em",
                            wordBreak: "break-all",
                        }}
                    >
                        <ReactJson
                            collapseStringsAfterLength={1000}
                            src={record.res.body}
                            collapsed={true}
                        />
                    </div>
                );
            },
        },
        {
            title: getDefaultColumnHead("json", dispatch, 3),
            dataIndex: "json",
            key: "json",
            width: "400px",
            render: (text: string, record: any, index: number) => {
                return (
                    <div
                        style={{
                            lineHeight: "1.2em",
                            wordBreak: "break-all",
                        }}
                    >
                        <ReactJson src={record} collapseStringsAfterLength={1000}/>
                        {/*<ReactJson
                            src={record}
                            collapseStringsAfterLength={1000}
                            onAddFilter={(arg) => {
                                if (
                                    arg.namespace.length != 0 &&
                                    arg.namespace[0] != null &&
                                    arg.name
                                ) {
                                    let nameArr = (arg.namespace as Array<string>)
                                        .slice(1)
                                        .concat(arg.name);

                                    dispatch(
                                        addFilter({
                                            type: FilterType.SIMPLE_FILTER,
                                            id: uuId(),
                                            activate: true,
                                            property: nameArr.join("."),
                                            value: _.get(record, nameArr),
                                            condition: StringCondition.IS,
                                        })
                                    );
                                }
                                console.log(arg);
                            }}
                            collapsed={true}
                        />*/}
                    </div>
                );
            },
        },
    ];
    return res;
}



export function getDefaultColumnTitles() {
    return [
        {
            title: "method",
            displayType: ColumnDisplayType.TEXT,
        },
        {
            title: "path",
            displayType: ColumnDisplayType.TEXT,
        },
        {
            title: "body",
            displayType: ColumnDisplayType.JSON,
        },
        {
            title: "json",
            displayType: ColumnDisplayType.JSON,
        },
    ];
}

function getDefaultColumnHead(
    name: string,
    dispatch: Dispatch<AnyAction>,
    index: number
) {
    //const dispatch = useDispatch();

    return (
        <Dropdown
            trigger={["click"]}
            overlay={
                <div className={"menuWrap"}>
                    <div className="menu">
                        <div
                            className="menuItem"
                            onClick={() => {
                                dispatch(
                                    setDefaultColumnVisible({
                                        index,
                                        visible: false,
                                    })
                                );
                            }}
                        >
                            <Eye />
                            &nbsp;&nbsp;Hide In View
                        </div>
                    </div>
                </div>
            }
        >
            <div className={mStyle.defaultColumnHead}>{name}&nbsp;</div>
        </Dropdown>
    );
}

const CustomColumnHead = ({
                              item,
                              dispatch,
                          }: {
    item: TableColumnItem;
    dispatch: Dispatch<AnyAction>;
}) => {
    //const dispatch = useDispatch();
    const [menuDisplay, setMenuDisplay] = useState<boolean>(false);
    return (
        <Dropdown
            trigger={["click"]}
            visible={menuDisplay}
            onVisibleChange={(visible) => {
                setMenuDisplay(visible);
            }}
            overlay={
                <div className={"menuWrap"}>
                    <div className="menu">
                        <div
                            className="menuItem"
                            onClick={(event) => {
                                // edit column
                                event.stopPropagation();
                                console.log("edit property");
                                dispatch(setColumnEdit(item));
                                dispatch(showColumnEditor());
                                setMenuDisplay(false);
                            }}
                        >
                            <Equalizer />
                            &nbsp;&nbsp;Edit Property
                        </div>
                        <div
                            className="menuItem"
                            onClick={() => {
                                // hidden the column
                                dispatch(
                                    modifyTableColumn({
                                        ...item,
                                        visible: false,
                                    })
                                );
                            }}
                        >
                            <Eye/>
                            &nbsp;&nbsp;Hide In View
                        </div>
                    </div>
                </div>
            }
        >
            <div className={mStyle.defaultColumnHead}>{item.label}&nbsp;</div>
        </Dropdown>
    );
};


export function getCustomColumn(
    items: Array<TableColumnItem>,
    dispatch: Dispatch<AnyAction>
) {
    let res: ColumnType<LogM>[] = [];
    items.forEach((item) => {
        res.push(transferColumn(item, dispatch));
    });
    return res;
}
export function transferColumn(
    item: TableColumnItem,
    dispatch: Dispatch<AnyAction>
): ColumnType<LogM> {
    return {
        title: (
            <>
                <CustomColumnHead item={item} dispatch={dispatch} />
            </>
        ),
        dataIndex: item.path,
        key: item.id,
        width: "200px",
        render: (value, record, index) => {
            return (
                <div>
                    {item.displayType == ColumnDisplayType.JSON &&
                        JsonRender(item, record)}
                    {item.displayType == ColumnDisplayType.TEXT &&
                        TextRender(item, record)}
                </div>
            );
        },
    };
}

function JsonRender(item: TableColumnItem, log: LogM) {
    let root = _.get(log, item.path, {});
    return (
        <div
            style={{
                lineHeight: "1.2em",
                wordBreak: "break-all",
            }}
        >
           <ReactJson
                collapseStringsAfterLength={1000}
                collapsed={true}
                src={root}
            />
        </div>
    );
}

function TextRender(item: TableColumnItem, log: LogM) {
    let root = _.get(log, item.path, {});
    let content = <div />;
    switch (typeof root) {
        case "undefined":
            break;
        case "object":
            content = <div>{JSON.stringify(root)}</div>;
            break;
        case "boolean":
            content = <div>{root ? "true" : "false"}</div>;
            break;
        case "number":
            content = <div>{root.toString()}</div>;
            break;
        case "string":
            content = <div>{root}</div>;
            break;
        case "function":
            break;
        case "symbol":
            break;
        case "bigint":
            break;
    }
    return <div>{content}</div>;
}
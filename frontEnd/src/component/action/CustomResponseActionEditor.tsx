import {Col, InputNumber, Row, Select} from "antd";
import {ActionType, CustomResponseActionM, ResponseType} from "core/struct/action";
import HeaderEditor from "./HeaderEditor";
import TextArea from "antd/es/input/TextArea";
import React, {ChangeEvent} from "react";
import {useActionContext} from "../context";

export const CustomResponseActionEditor:React.FunctionComponent<{
    action:CustomResponseActionM;
    typeChange:(type:ActionType) => void;
}> = ({action,typeChange}) => {
    const actionContext = useActionContext();
    return (
        <>
            <div>
                <div>type</div>
                <div>
                    <Select
                        defaultValue={action.type}
                        style={{ width: 220 }}
                        onChange={typeChange}
                        options={[
                            { value: ActionType.PROXY, label: ActionType.PROXY },
                            {
                                value: ActionType.CUSTOM_RESPONSE,
                                label: ActionType.CUSTOM_RESPONSE,
                            },
                        ]}
                    />
                </div>
                <Row gutter={10}>
                    <Col span={12}>
                        <div>http status</div>
                        <div>
                            <InputNumber
                                style={{ width: "220px" }}
                                value={action.status}
                                onChange={(value) => {
                                    if (value !== null) {
                                        actionContext.onActionModify({
                                            ...action,
                                            status: value,
                                        });
                                    }
                                }}
                            />
                        </div>
                    </Col>
                    <Col span={12}>
                        <div>response type</div>
                        <div>
                            <Select
                                style={{ width: "220px" }}
                                defaultValue={action.responseContent.type}
                                options={[
                                    {
                                        value: ResponseType.TEXT,
                                        label: ResponseType.TEXT,
                                    },
                                    {
                                        value: ResponseType.JSON,
                                        label: ResponseType.JSON,
                                    },
                                ]}
                                onChange={(value) => {
                                    actionContext.onActionModify({
                                        ...action,
                                        responseContent: {
                                            ...action.responseContent,
                                            type: value,
                                        },
                                    });
                                }}
                            />
                        </div>
                    </Col>
                </Row>
                <div>headers</div>
                <div>
                    <HeaderEditor
                        headers={action.responseContent.headers}
                        onHeaderModify={(headerIndex, value) => {
                            let _headers = [...action.responseContent.headers];
                            _headers[headerIndex] = value;
                            actionContext.onActionModify({
                                ...action,
                                responseContent: {
                                    ...action.responseContent,
                                    headers: _headers,
                                },
                            });
                        }}
                        onAddHeader={(header) => {
                            actionContext.onActionModify({
                                ...action,
                                responseContent: {
                                    ...action.responseContent,
                                    headers: [...action.responseContent.headers, header],
                                },
                            });
                        }}
                        onDeleteHeader={(headerIndex) => {
                            let _headers = [...action.responseContent.headers];
                            _headers.splice(headerIndex, 1);
                            actionContext.onActionModify({
                                ...action,
                                responseContent: {
                                    ...action.responseContent,
                                    headers: _headers,
                                },
                            });
                        }}
                    />
                </div>
                <div>content</div>
                <div>
                    <TextArea
                        rows={10}
                        value={action.responseContent.value}
                        onChange={(event: ChangeEvent<{ value: string }>) => {
                            actionContext.onActionModify({
                                ...action,
                                responseContent: {
                                    ...action.responseContent,
                                    value: event.target.value,
                                },
                            });
                        }}
                    />
                </div>
            </div>
        </>
    );
};
export default CustomResponseActionEditor;
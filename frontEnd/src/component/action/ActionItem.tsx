import React from "react";
import {ActionM, ActionType} from "core/struct/action";
import mStyle from "./ActionItem.module.scss"
import {CloseSquareOutlined} from "@ant-design/icons";
import {useActionContext} from "../context";

const ActionItem:React.FC<{
    action:ActionM,
    onPropertyChange:(action:ActionM) => void;
}> = ({
    action,onPropertyChange
})=>{
    const actionContext = useActionContext();
    return <div>
        {action.type === ActionType.PROXY && <div />}
        {action.type === ActionType.CUSTOM_RESPONSE &&
            <div className={mStyle.actionWrap} >
                response {action.status} with {action.responseContent.type}
                &nbsp;&nbsp;
                <CloseSquareOutlined
                    className={mStyle.closeBtn}
                    onClick={() => {
                        actionContext.onActionRemove(action.id);
                    }}
                />
            </div>
        }

    </div>
}
export default ActionItem;
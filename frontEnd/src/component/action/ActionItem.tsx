import React from "react";
import {ActionM} from "core/struct/action";


const ActionItem:React.FC<{
    action:ActionM,
    onPropertyChange:(action:ActionM) => void;
}> = ({
    action,onPropertyChange
})=>{
    return <div>
        {action.type}

    </div>
}
export default ActionItem;
import React from "react";
import { v4 as uuId } from "uuid";
import {createSimpleFilter} from "../../../core/struct/log";
import LogFilterComponent from "../component/log/LogFilterComponent";

const pageId:string = uuId();

const LogPage:React.FC = ()=>{
    const simpleFilterM = createSimpleFilter();
    return <div>
        <LogFilterComponent filter={simpleFilterM} />
    </div>
}

export default LogPage;
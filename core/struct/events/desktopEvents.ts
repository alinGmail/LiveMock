


export enum ProjectEvents{
    ListProject= "ListProject",
    CreateProject = "CreateProject",
    UpdateProject = "UpdateProject",
    StartProject = "StartProject",
    StopProject = "StopProject"
}


export enum ExpectationEvents{
    ListExpectation="ListExpectation",
    CreateExpectation="CreateExpectation",
    UpdateExpectation="UpdateExpectation",
    DeleteExpectation="DeleteExpectation",
    GetExpectation="GetExpectation"

}

export enum MatcherEvents {
    CreateMatcher="CreateMatcher",
    UpdateMatcher="UpdateMatcher",
    DeleteMatcher="DeleteMatcher"
}

export enum ActionEvents {
    CreateAction="CreateAction",
    UpdateAction="UpdateAction",
    DeleteAction="DeleteAction"
}

export enum LogViewEvents{
    ListLogView="ListLogView",
    ListLogViewLogs="ListLogViewLogs"
}

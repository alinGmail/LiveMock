


export enum ProjectEvents{
    ListProject= "ListProject",
    CreateProject = "CreateProject",
    UpdateProject = "UpdateProject",
    StartProject = "StartProject",
    StopProject = "StopProject",
    DeleteProject = "DeleteProject",
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
    ListLogViewLogs="ListLogViewLogs",
    DeleteAllRequestLogs="DeleteAllRequestLogs",
    OnLogAdd="OnLogViewLogAdd",
    OnLogUpdate="OnLogViewLogUpdate",
    OnLogDelete="OnLogVIewLogDelete"
}

export enum LogEvents{
    OnLogUpdate="OnLogUpdate",
}

export enum LogFilterEvents{
    CreateLogFilter="CreateLogFilter",
    UpdateLogFilter="UpdateLogFilter",
    DeleteLogFilter="DeleteLogFilter",
    UpdatePresetLogFilter="UpdatePresetLogFilter",
}

export enum SystemEvents{
    OpenAboutWindow = "OpenAboutWindow",
}
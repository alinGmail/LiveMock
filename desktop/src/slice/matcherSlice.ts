import {Draft, PayloadAction} from "@reduxjs/toolkit";
import {ExpectationState} from "./expectationSlice";
import {RequestMatcherM} from "core/struct/matcher";


export const matcherReducers = {
    modifyMatcher: (
        state:Draft<ExpectationState>,
        action: PayloadAction<{
            expectationIndex: number;
            matcherIndex: number;
            matcher: RequestMatcherM;
        }>
    ) => {
        let { expectationIndex, matcher, matcherIndex } = action.payload;
        state.expectationList[expectationIndex].matchers[matcherIndex] = matcher;
    },
    addMatcher: (
        state:Draft<ExpectationState>,
        action: PayloadAction<{
            expectationIndex: number;
            matcher: RequestMatcherM;
        }>
    ) => {
        let { expectationIndex, matcher } = action.payload;
        state.expectationList[expectationIndex].matchers.push(matcher);
    },
    removeMatcher: (
        state:Draft<ExpectationState>,
        action: PayloadAction<{
            expectationIndex: number;
            matcher: RequestMatcherM;
        }>
    ) => {
        let { expectationIndex, matcher } = action.payload;
        let expectation = state.expectationList[expectationIndex];

        expectation.matchers = expectation.matchers.filter((item) => {
            return item.id !== matcher.id;
        });
    },
}
import {regexMatch} from "../../src/matcher/matchUtils";


test("match util",async ()=>{
    const value = "abcs.js";
    const regexStr = ".*\\.js";
    expect(regexMatch(value, regexStr)).toBe(true);
    expect(regexMatch("abcsjs",regexStr)).toBe(false);
    expect(regexMatch("ABC","/abc/i")).toBe(true);
});

import {globMatch, regexMatch} from "../../src/matcher/matchUtils";


test("match util",async ()=>{
    const value = "abcs.js";
    const regexStr = ".*\\.js";
    expect(regexMatch(value, regexStr)).toBe(true);
    expect(regexMatch("abcsjs",regexStr)).toBe(false);
    expect(regexMatch("ABC","/abc/i")).toBe(true);
});


test("glob matcher", async () => {
    const value = "/folder1/main.js";
    const pattern = '*/*.js';
    expect(globMatch(value,pattern)).toBe(false);

    const pattern2 = "**/*.js";
    expect(globMatch(value,pattern2)).toBe(true);
})
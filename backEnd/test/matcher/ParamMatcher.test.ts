import {createParamMatcher, MatcherCondition} from "../../../core/struct/matcher";
import httpMocks from "node-mocks-http";
import FormData from "form-data";
import ParamMatcher from "../../src/matcher/ParamMatcher";


test('param matcher',async ()=>{
    const paramMatcherM = createParamMatcher();
    paramMatcherM.name = "name";
    paramMatcherM.value = "lily";
    paramMatcherM.conditions = MatcherCondition.IS;

    const paramMatcher = new ParamMatcher(paramMatcherM);

    const form = new FormData();
    form.append('name', 'lily');
    // 将 FormData 序列化为 Buffer 对象
    const formBuffer = form.getBuffer();
    const mockRequest = httpMocks.createRequest({
        method: 'POST',
        url: '/api/v1/upload',
        headers: {
            ...form.getHeaders(), // 添加正确的 Content-Type 和 boundary
            "content-length": formBuffer.length + ''
        },
        body: formBuffer
    });
    // 框架不支持，自己加
    mockRequest.body = { name : "lily" }
    const match = paramMatcher.match(mockRequest);
    expect(match).toBe(true);


})
import {createParamMatcher, MatcherCondition} from "livemock-core/struct/matcher";
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

    const formBuffer = form.getBuffer();
    const mockRequest = httpMocks.createRequest({
        method: 'POST',
        url: '/api/v1/upload',
        headers: {
            ...form.getHeaders(),
            "content-length": formBuffer.length + ''
        },
        body: formBuffer
    });

    mockRequest.body = { name : "lily" }
    const match = paramMatcher.match(mockRequest);
    expect(match).toBe(true);


})

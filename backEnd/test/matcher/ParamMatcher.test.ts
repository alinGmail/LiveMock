import {createParamMatcher, MatcherCondition, ParamMatcherM} from "livemock-core/struct/matcher";
import httpMocks from "node-mocks-http";
import FormData from "form-data";
import ParamMatcher from "../../src/matcher/ParamMatcher";

function jsonRequest(body: any) {
    const json = JSON.stringify(body);
    const mockRequest = httpMocks.createRequest({
        method: 'POST',
        url: '/api/v1/users',
        headers: {
            "content-type": "application/json",
            "content-length": Buffer.byteLength(json) + '',
        },
        body: body,
    });
    return mockRequest;
}

function paramMatcherFor(name: string, value: string): ParamMatcherM {
    const matcher = createParamMatcher();
    matcher.name = name;
    matcher.value = value;
    matcher.conditions = MatcherCondition.IS;
    return matcher;
}

test('param matcher matches numeric json fields as strings', async () => {
    const matcher = new ParamMatcher(paramMatcherFor("age", "18"));
    expect(matcher.match(jsonRequest({ age: 18 }) as any)).toBe(true);
    expect(matcher.match(jsonRequest({ age: 19 }) as any)).toBe(false);
});

test('param matcher matches boolean json fields as strings', async () => {
    const matcher = new ParamMatcher(paramMatcherFor("active", "true"));
    expect(matcher.match(jsonRequest({ active: true }) as any)).toBe(true);
    expect(matcher.match(jsonRequest({ active: false }) as any)).toBe(false);
});

test('param matcher matches null json fields as empty string', async () => {
    const matcher = new ParamMatcher(paramMatcherFor("remark", ""));
    expect(matcher.match(jsonRequest({ remark: null }) as any)).toBe(true);
});

test('param matcher keeps NOT_SHOWED semantics for absent fields', async () => {
    const notShowed = createParamMatcher();
    notShowed.name = "missing";
    notShowed.value = "";
    notShowed.conditions = MatcherCondition.NOT_SHOWED;
    const matcher = new ParamMatcher(notShowed);
    expect(matcher.match(jsonRequest({}) as any)).toBe(true);
});


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

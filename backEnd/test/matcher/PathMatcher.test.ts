import {createPathMatcher, MatcherCondition} from "livemock-core/struct/matcher";
import PathMatcher from "../../src/matcher/PathMatcher";
import httpMocks from "node-mocks-http";


test('path matcher', async () =>{
    const pathMatcherM = createPathMatcher();

    pathMatcherM.value = "/api/";
    pathMatcherM.conditions = MatcherCondition.START_WITH;
    const pathMatcher = new PathMatcher(pathMatcherM);

    const mockRequest = httpMocks.createRequest({
        method:"POST",
        url:"/api/v1/updateUser",
        body:{
            name:"lily",
            country:"USA"
        }
    });

    const match = pathMatcher.match(mockRequest);
    expect(match).toBe(true);

})

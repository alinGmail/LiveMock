import {createQueryMatcher, MatcherCondition} from "core/struct/matcher";
import httpMocks from "node-mocks-http";
import QueryMatcher from "../../src/matcher/QueryMatcher";


test('query matcher',async () =>{
    const queryMatcherM = createQueryMatcher();

    queryMatcherM.name = "color";
    queryMatcherM.value = "red";
    queryMatcherM.conditions = MatcherCondition.IS;

    const queryMatcher = new QueryMatcher(queryMatcherM);

    const mockRequest = httpMocks.createRequest({
        method:"POST",
        url:"/api/v1/updateUser?color=red",
        body:{
            name:"lily",
            country:"USA"
        }
    });

    const match = queryMatcher.match(mockRequest);
    expect(match).toBe(true);

})

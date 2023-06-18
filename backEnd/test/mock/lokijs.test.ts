import {getProjectDb} from "../../src/db/dbManager";
import {createProject} from "core/struct/project";

describe('test lokijs',()=>{
    test('test dynamicView',async ()=>{
        const projectDb = await getProjectDb("test_db");
        const collection = projectDb.getCollection('project');
        const projectM = createProject();
        projectM.name = "projectNameA"
        projectM.port = "9001";
        const projectM2 = createProject();
        projectM2.port = "9001";
        const projectM3 = createProject();
        const dynamicView = collection.addDynamicView("test");
        dynamicView.applyFind({port:"9001"});
        dynamicView.applyFind({name:"projectNameA"});
        let insertCount = 0;

        dynamicView.on('insert',()=>{
            insertCount++;
        });
        collection.on('insert',(pro)=>{
        });

        collection.insert(projectM);
        collection.insert(projectM2);
        collection.insert(projectM3);
        expect(insertCount).toBe(1);
    });

});



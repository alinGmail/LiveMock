import request from "supertest";
const express = require('express');
const app = express();

let router = express.Router();
router.all("*",(req,res)=>{
    console.log("baseUrl",req.baseUrl); // 输出: '/testResponse'
    console.log("path",req.path); // 输出: '/'
})


app.all( "*",router);

app.post('/testResponse/users', (req, res) => {
    res.send('Users');
});

describe("path test",()=>{
    test("path test",async ()=>{
        const res = await request(app).post("/testResponse/users").expect(200);
    })
})

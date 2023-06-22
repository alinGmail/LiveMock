import bodyParser from "body-parser";
import express from "express";
const typeis = require("type-is");
let json = bodyParser.json();
let urlencoded = bodyParser.urlencoded();
import * as http from "http";

export function processBodyParse(
    req: express.Request,
    res: express.Response,
    next: (err?: any) => void
) {
    json(req, res, (err?: any) => {
        urlencoded(req, res, next);
    });
}

export function isRecordBody(req:http.IncomingMessage,res: http.IncomingMessage): boolean {
    const recordByRes = typeis.is(res.headers["content-type"], ["json", "text","html"]);
    const accept = req.headers['accept'];
    const recordByReq = typeis.is(accept,['json','text','html']);
    if (recordByReq || recordByRes) {
        return true;
    } else {
        return false;
    }
}

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

export function isRecordBody(res: http.IncomingMessage): boolean {
    const type = typeis.is(res.headers["content-type"], ["json", "text"]);
    if (type) {
        return true;
    } else {
        return false;
    }
}

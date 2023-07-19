import express, { NextFunction, Request, Response } from "express";

export function addCross(res: express.Response) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization,X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PATCH, PUT, DELETE"
  );
  res.header("Allow", "GET, POST, PATCH, OPTIONS, PUT, DELETE");
}



export class ServerError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const CustomErrorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ServerError) {
    res.status(err.status || 500);
    res.json({
      error: {
        message: err.message,
      },
    });
  } else {
    res.status(500);
    res.json({
      error: {
        message: err.message,
      },
    });
  }
};



const methods = [
  "get",
  "post",
  "put",
  "delete", // & etc.
];


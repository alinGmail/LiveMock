import { NextFunction, Request, Response } from "express";

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


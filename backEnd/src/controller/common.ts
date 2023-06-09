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

// content type filter
export function contentTypeFilter(req, res, next) {
  const originalSend = res.send;

  res.send = function (data) {
    const dataType = typeof data;

    if (dataType === "string") {
      res.set("Content-Type", "text/plain");
    } else if (dataType === "object") {
      res.set("Content-Type", "application/json");
    }

    originalSend.apply(res, arguments);
  };

  next();
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

const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

const methods = [
  "get",
  "post",
  "put",
  "delete", // & etc.
];

export function toAsyncRouter(router:express.Router) {
  for (let key in router) {
    if (methods.includes(key)) {
      let method = router[key];
      router[key] = (path, ...callbacks) =>
        method.call(router, path, ...callbacks.map((cb) => asyncHandler(cb)));
    }
  }
  return router;
}

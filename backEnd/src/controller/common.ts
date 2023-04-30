import express from "express";

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

    if (dataType === 'string') {
      res.set('Content-Type', 'text/plain');
    } else if (dataType === 'object') {
      res.set('Content-Type', 'application/json');
    }

    originalSend.apply(res, arguments);
  };

  next();
}
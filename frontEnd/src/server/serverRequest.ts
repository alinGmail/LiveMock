import * as request from "superagent";
import { ServerUrl } from "../config";



function customRequest(method: string, url: string) {
  // Apply your global configuration here
  const req = request(method, ServerUrl + url);

  // Add any other global settings or headers as needed
  return req;
}

const get = (url: string) => {
  return customRequest("GET", url);
};
const post = (url: string) => {
  return customRequest("POST", url);
};

export { get, post };

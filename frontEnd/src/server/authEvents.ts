type Handler = () => void;

let unauthorizedHandler: Handler | null = null;
let loggedOutHandler: Handler | null = null;

/** Registers the callback fired when a protected API request returns 401. */
export function setUnauthorizedHandler(handler: Handler | null) {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized() {
  if (unauthorizedHandler) {
    unauthorizedHandler();
  }
}

/** Registers the callback fired after a completed logout. */
export function setLoggedOutHandler(handler: Handler | null) {
  loggedOutHandler = handler;
}

export function notifyLoggedOut() {
  if (loggedOutHandler) {
    loggedOutHandler();
  }
}

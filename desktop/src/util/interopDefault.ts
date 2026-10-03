/**
 * CJS default-interop shim.
 *
 * Some CJS dependencies (e.g. `react-contenteditable`, `react-json-view`) set
 * `__esModule` + `exports.default`. Under Vite 8 / Rolldown the pre-bundled
 * default export can arrive as the whole exports object
 * (`{ default: Component }`) instead of the Component itself, which makes
 * React fail with "Element type is invalid ... got: object".
 *
 * Unwrap defensively (also a no-op if a bundler interops correctly), while
 * preserving the original type so JSX props stay typed.
 */
export function interopDefault<T>(mod: T): T {
  return ((mod as any)?.default ?? mod) as T;
}

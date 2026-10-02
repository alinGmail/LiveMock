const OPENAPI_PATH_PARAM_REGEX = /\{[^/{}]+\}/g;

export interface ConvertedPath {
  value: string;
  isGlob: boolean;
}

// OpenAPI path 模板 -> LiveMock path matcher 值:"/pets/{id}" -> "/pets/*"
export function convertOpenApiPath(path: string): ConvertedPath {
  const value = path.replace(OPENAPI_PATH_PARAM_REGEX, "*");
  return { value, isGlob: value !== path };
}

// Postman path 中的 ":param" 段 -> "*",如 /users/:id/posts -> /users/*/posts
export function convertPostmanPath(path: string): ConvertedPath {
  const segments = path.split("/");
  let isGlob = false;
  const converted = segments.map((segment) => {
    if (segment.startsWith(":") && segment.length > 1) {
      isGlob = true;
      return "*";
    }
    return segment;
  });
  const value = converted.join("/");
  return { value, isGlob: isGlob || value.indexOf("*") !== -1 };
}

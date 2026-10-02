/**
 * 手写的 JSON Schema 采样器:
 * 只覆盖导入 mock 场景需要的能力(example/default/enum、object、array、
 * 常见 string format、allOf/oneOf/anyOf、本地 $ref),不追求完整规范。
 */

const MAX_DEPTH = 6;

export function sampleFromSchema(schema: any, root: any): any {
  return sample(schema, root, 0, new Set<string>());
}

function sample(
  schema: any,
  root: any,
  depth: number,
  seenRefs: Set<string>
): any {
  if (schema === null || schema === undefined) {
    return {};
  }
  if (typeof schema !== "object" || Array.isArray(schema)) {
    return {};
  }
  if (depth > MAX_DEPTH) {
    return {};
  }
  if (typeof schema.$ref === "string") {
    const ref = schema.$ref;
    const resolved = resolveRef(ref, root);
    if (resolved === undefined || seenRefs.has(ref)) {
      return {};
    }
    seenRefs.add(ref);
    const result = sample(resolved, root, depth, seenRefs);
    seenRefs.delete(ref);
    return result;
  }
  if ("example" in schema && schema.example !== undefined) {
    return schema.example;
  }
  if ("default" in schema && schema.default !== undefined) {
    return schema.default;
  }
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum[0];
  }
  if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    const merged: any = {};
    let fallback: any;
    let hasFallback = false;
    schema.allOf.forEach((subSchema: any) => {
      const value = sample(subSchema, root, depth + 1, seenRefs);
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        Object.assign(merged, value);
      } else if (!hasFallback) {
        fallback = value;
        hasFallback = true;
      }
    });
    if (Object.keys(merged).length > 0) {
      return merged;
    }
    return hasFallback ? fallback : {};
  }
  if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    return sample(schema.oneOf[0], root, depth + 1, seenRefs);
  }
  if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    return sample(schema.anyOf[0], root, depth + 1, seenRefs);
  }
  let type = schema.type;
  if (Array.isArray(type)) {
    type = type.find((item: string) => item !== "null") || "null";
  }
  if (!type) {
    if (schema.properties || schema.additionalProperties) {
      type = "object";
    } else if (schema.items) {
      type = "array";
    } else {
      return {};
    }
  }
  switch (type) {
    case "object": {
      const result: any = {};
      const properties = schema.properties || {};
      Object.keys(properties).forEach((name) => {
        result[name] = sample(properties[name], root, depth + 1, seenRefs);
      });
      return result;
    }
    case "array":
      return [sample(schema.items || {}, root, depth + 1, seenRefs)];
    case "string":
      return sampleString(schema);
    case "integer":
      return Number.isFinite(schema.minimum) ? Math.ceil(schema.minimum) : 0;
    case "number":
      return Number.isFinite(schema.minimum) ? schema.minimum : 0;
    case "boolean":
      return true;
    case "null":
      return null;
    default:
      return {};
  }
}

function sampleString(schema: any): string {
  switch (schema.format) {
    case "date-time":
      return "2020-01-01T00:00:00Z";
    case "date":
      return "2020-01-01";
    case "time":
      return "00:00:00";
    case "email":
      return "user@example.com";
    case "uuid":
      return "00000000-0000-0000-0000-000000000000";
    case "uri":
    case "url":
      return "https://example.com";
    case "hostname":
      return "example.com";
    case "ipv4":
      return "127.0.0.1";
    case "ipv6":
      return "::1";
    case "byte":
      return "c3RyaW5n";
    default:
      return "string";
  }
}

/** 解析本地 $ref(仅支持 #/ 开头) */
export function resolveRef(ref: string, root: any): any {
  if (typeof ref !== "string" || ref.indexOf("#/") !== 0) {
    return undefined;
  }
  const parts = ref
    .slice(2)
    .split("/")
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"));
  let current = root;
  for (let i = 0; i < parts.length; i++) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = current[parts[i]];
  }
  return current;
}

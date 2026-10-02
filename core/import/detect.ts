import yaml from "js-yaml";
import { ImportContentError, ImportFormat } from "./types";

export interface DetectedInput {
  format: ImportFormat;
  spec: any;
}

/**
 * 识别输入内容:
 * OpenAPI 3.x -> Swagger 2.0 -> Postman Collection -> 报错。
 * 先按 JSON 解析,失败再按 YAML 解析。
 */
export function detectImportFormat(content: string): DetectedInput {
  if (typeof content !== "string" || content.trim() === "") {
    throw new ImportContentError("文件内容为空");
  }
  const data = parseJsonOrYaml(content);
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new ImportContentError("无法识别的格式:文件内容不是对象");
  }
  if (typeof data.openapi === "string" && data.openapi.indexOf("3.") === 0) {
    return { format: ImportFormat.OPENAPI3, spec: data };
  }
  if (data.swagger === "2.0") {
    return { format: ImportFormat.SWAGGER2, spec: data };
  }
  if (isPostmanCollection(data)) {
    return { format: ImportFormat.POSTMAN, spec: data };
  }
  throw new ImportContentError(
    "无法识别的格式,请选择 OpenAPI 3.x / Swagger 2.0 / Postman Collection v2 文件"
  );
}

function parseJsonOrYaml(content: string): any {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch (jsonError) {
    try {
      return yaml.load(trimmed);
    } catch (yamlError) {
      throw new ImportContentError(
        `JSON/YAML 解析失败: ${(yamlError as Error).message}`
      );
    }
  }
}

function isPostmanCollection(data: any): boolean {
  const info = data.info;
  if (!info || typeof info !== "object") {
    return false;
  }
  if (
    typeof info.schema === "string" &&
    info.schema.indexOf("getpostman.com") !== -1
  ) {
    return true;
  }
  if (info._postman_id) {
    return true;
  }
  return Array.isArray(data.item);
}

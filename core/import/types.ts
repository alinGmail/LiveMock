import { ExpectationM } from "../struct/expectation";

/** 支持的导入来源格式 */
export enum ImportFormat {
  OPENAPI3 = "openapi3",
  SWAGGER2 = "swagger2",
  POSTMAN = "postman",
}

export const IMPORT_FORMAT_TEXT: Record<ImportFormat, string> = {
  [ImportFormat.OPENAPI3]: "OpenAPI 3.x",
  [ImportFormat.SWAGGER2]: "Swagger 2.0",
  [ImportFormat.POSTMAN]: "Postman Collection",
};

/** 解析选项 */
export interface ImportOptions {
  /** 是否把 servers[0].url 的路径前缀拼到 path 上,默认 false */
  preserveServerPrefix?: boolean;
}

export interface ImportedExpectation {
  /** 来源描述,如 "GET /pets/{id}" */
  source: string;
  expectation: ExpectationM;
}

export interface ImportFailure {
  source: string;
  reason: string;
}

export interface ParseImportResult {
  format: ImportFormat;
  expectations: Array<ImportedExpectation>;
  failures: Array<ImportFailure>;
}

/** 单一来源解析结果(OpenAPI / Postman 共用) */
export interface ParseSectionResult {
  expectations: Array<ImportedExpectation>;
  failures: Array<ImportFailure>;
}

/** 批量导入接口的选项 */
export interface BatchImportOptions {
  preserveServerPrefix?: boolean;
  /** 命中同 METHOD+PATH 的已有 expectation 时是否覆盖,默认 false(跳过) */
  overwrite?: boolean;
}

export interface BatchImportReqBody {
  projectId: string;
  /** 原始文件文本(JSON 或 YAML) */
  content: string;
  options?: BatchImportOptions;
}

export interface BatchImportFailure {
  source: string;
  reason: string;
}

export interface BatchImportResult {
  format: string;
  created: number;
  overwritten: number;
  skipped: number;
  failures: Array<BatchImportFailure>;
}

/** 输入内容无法解析/识别时抛出 */
export class ImportContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportContentError";
  }
}

import { detectImportFormat } from "./detect";
import { parseOpenApi } from "./openapi";
import { parsePostman } from "./postman";
import {
  ImportContentError,
  ImportFormat,
  ImportOptions,
  ParseImportResult,
} from "./types";

import swagger2openapi from "swagger2openapi";

export * from "./types";

/**
 * 解析导入文件内容,返回映射好的 expectations 与失败列表。
 * 不在这里落库,由调用方(后端/桌面主进程)决定。
 */
export async function parseImportContent(
  content: string,
  options: ImportOptions = {}
): Promise<ParseImportResult> {
  const detected = detectImportFormat(content);
  if (detected.format === ImportFormat.SWAGGER2) {
    const openApi3 = await convertSwagger2ToOpenApi3(detected.spec);
    const parsed = parseOpenApi(openApi3, options);
    return {
      format: detected.format,
      expectations: parsed.expectations,
      failures: parsed.failures,
    };
  }
  if (detected.format === ImportFormat.OPENAPI3) {
    const parsed = parseOpenApi(detected.spec, options);
    return {
      format: detected.format,
      expectations: parsed.expectations,
      failures: parsed.failures,
    };
  }
  const parsed = parsePostman(detected.spec);
  return {
    format: detected.format,
    expectations: parsed.expectations,
    failures: parsed.failures,
  };
}

function convertSwagger2ToOpenApi3(spec: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const converter: any = swagger2openapi;
    converter.convertObj(
      spec,
      { patch: true, warnOnly: true },
      (error: any, result: any) => {
        if (error) {
          const message =
            error && error.message ? error.message : String(error);
          reject(new ImportContentError(`Swagger 2.0 转换失败: ${message}`));
          return;
        }
        resolve(result && result.openapi ? result.openapi : result);
      }
    );
  });
}

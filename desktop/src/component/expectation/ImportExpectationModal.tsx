import { useState } from "react";
import {
  App,
  Checkbox,
  List,
  Modal,
  Radio,
  Typography,
  Upload,
} from "antd";
import type { UploadProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { BatchImportResult } from "livemock-core/import/types";
import { batchImportExpectationReq } from "../../server/expectationServer";
import { getErrorMessage } from "../common";

interface ImportExpectationModalProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function ImportExpectationModal(props: ImportExpectationModalProps) {
  const { message } = App.useApp();
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [preserveServerPrefix, setPreserveServerPrefix] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<BatchImportResult | null>(null);

  const reset = () => {
    setContent("");
    setFileName("");
    setOverwrite(false);
    setPreserveServerPrefix(false);
    setImporting(false);
    setResult(null);
  };

  const close = () => {
    reset();
    props.onClose();
  };

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    file.text().then((text) => {
      setContent(text);
      setFileName(file.name);
      setResult(null);
    });
    return false;
  };

  const doImport = async () => {
    if (content === "") {
      message.warning("Please select a file first");
      return;
    }
    setImporting(true);
    try {
      const res = await batchImportExpectationReq(props.projectId, content, {
        overwrite,
        preserveServerPrefix,
      });
      setResult(res);
      props.onImported();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      title="Import OpenAPI / Swagger / Postman"
      open={props.open}
      width={640}
      onCancel={close}
      onOk={async () => {
        if (result) {
          close();
          return;
        }
        await doImport();
      }}
      okText={result ? "Close" : "Import"}
      cancelButtonProps={result ? { style: { display: "none" } } : undefined}
      confirmLoading={importing}
      maskClosable={false}
    >
      {result ? (
        <ImportResultView result={result} />
      ) : (
        <>
          <Upload.Dragger
            accept=".json,.yaml,.yml"
            multiple={false}
            showUploadList={false}
            beforeUpload={beforeUpload}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag a JSON / YAML file here
            </p>
            <p className="ant-upload-hint">
              OpenAPI 3.x / Swagger 2.0 / Postman Collection v2
            </p>
          </Upload.Dragger>
          {fileName !== "" && (
            <Typography.Paragraph style={{ marginTop: 8 }}>
              Selected: {fileName}
            </Typography.Paragraph>
          )}
          <div style={{ marginTop: 12 }}>
            <Radio.Group
              value={overwrite ? "overwrite" : "skip"}
              onChange={(event) =>
                setOverwrite(event.target.value === "overwrite")
              }
            >
              <Radio value="skip">Skip existing</Radio>
              <Radio value="overwrite">Overwrite existing</Radio>
            </Radio.Group>
          </div>
          <div style={{ marginTop: 8 }}>
            <Checkbox
              checked={preserveServerPrefix}
              onChange={(event) => setPreserveServerPrefix(event.target.checked)}
            >
              Keep servers base path
            </Checkbox>
          </div>
        </>
      )}
    </Modal>
  );
}

function ImportResultView({ result }: { result: BatchImportResult }) {
  return (
    <div>
      <Typography.Paragraph>
        Format: {result.format} | Created: {result.created} | Overwritten:{" "}
        {result.overwritten} | Skipped: {result.skipped} | Failed:{" "}
        {result.failures.length}
      </Typography.Paragraph>
      {result.failures.length > 0 && (
        <>
          <Typography.Text strong>Failures</Typography.Text>
          <List
            size="small"
            style={{ maxHeight: 240, overflow: "auto", marginTop: 8 }}
            dataSource={result.failures}
            renderItem={(item) => (
              <List.Item>
                <Typography.Text>
                  <b>{item.source}</b>: {item.reason}
                </Typography.Text>
              </List.Item>
            )}
          />
        </>
      )}
    </div>
  );
}

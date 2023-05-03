import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useAppSelector } from "../store";
import { createExpectationReq } from "../server/expectationServer";
import { createExpectation } from "../../../core/struct/expectation";

const ExpectationPage = () => {
  const projectState = useAppSelector((state) => state.project);
  return (
    <div>
      <div>
        <Button
          type={"text"}
          icon={<PlusOutlined />}
          onClick={async () => {
            // send request to add new expectation
            const createPromise = createExpectationReq(
              projectState.projectList[projectState.curProjectIndex]._id!,
              createExpectation()
            );
          }}
        >
          Add Expectation
        </Button>
      </div>
    </div>
  );
};
export default ExpectationPage;

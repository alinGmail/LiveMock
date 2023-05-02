import "antd/dist/reset.css";
import "./App.css";
import Layout from "./component/Layout";
import { useQuery } from "@tanstack/react-query";
import { getProjectListReq } from "./server/projectServer";
import WelcomePage from "./page/WelcomePage";
import { useDispatch } from "react-redux";
import { setProjectList } from "./slice/projectSlice";
import { useAppSelector } from "./store";
import { Toaster } from "react-hot-toast";
import {Spin} from "antd";

function App() {
  const dispatch = useDispatch();
  const projectList = useAppSelector((state) => state.project.projectList);
  const projectListQuery = useQuery({
    queryKey: ["projectList"],
    queryFn: async () => {
      let res = await getProjectListReq();
      dispatch(setProjectList(res));
      return res;
    },
  });

  return (
    <>
      {!projectListQuery.isLoading ? (
        projectList.length === 0 ? (
          <WelcomePage />
        ) : (
          <Layout />
        )
      ) : (
        <Spin tip="Loading" size="large">
          <div className="content" style={{height:"500px"}}/>
        </Spin>
      )}
      <Toaster />
    </>
  );
}

export default App;

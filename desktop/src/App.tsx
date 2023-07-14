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
import { Spin } from "antd";
import { Route, Routes, Navigate } from "react-router-dom";
import ExpectationPage from "./page/ExpectationPage";
import ConfigPage from "./page/ConfigPage";
import LogPage from "./page/LogPage";

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
          <Layout>
            <Routes>
              <Route path={"expectation"} element={<ExpectationPage />} />
              <Route path={"requestLog"} element={<LogPage />}></Route>
              <Route path={"*"} element={<Navigate to={"expectation"} />} />
            </Routes>
          </Layout>
        )
      ) : (
        <Spin tip="Loading" size="large">
          <div className="content" style={{ height: "500px" }} />
        </Spin>
      )}
      <Toaster />
    </>
  );
}

export default App;

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
import { ConfigProvider, Spin, theme } from "antd";
import { Route, Routes, Navigate } from "react-router-dom";
import ExpectationPage from "./page/ExpectationPage";
import LogPage from "./page/LogPage";
import ConfigPage from "./page/ConfigPage";

function App() {
  const dispatch = useDispatch();
  const projectList = useAppSelector((state) => state.project.projectList);
  const systemConfigState = useAppSelector((state) => state.systemConfig);
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
      <div className={systemConfigState.mode === "dark" ? "dark_mode":""}>
        <ConfigProvider
          theme={
            systemConfigState.mode === "dark"
              ? { algorithm: theme.darkAlgorithm }
              : {}
          }
        >
          {!projectListQuery.isLoading ? (
            projectList.length === 0 ? (
              <WelcomePage />
            ) : (
              <Layout>
                <Routes>
                  <Route path={"expectation"} element={<ExpectationPage />} />
                  <Route path={"requestLog"} element={<LogPage />} />
                  <Route path={"config"} element={<ConfigPage />} />
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
        </ConfigProvider>
      </div>
    </>
  );
}

export default App;

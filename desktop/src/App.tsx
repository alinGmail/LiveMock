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
import { Spin, ConfigProvider, theme, App as AntApp } from "antd";
import { Route, Routes, Navigate } from "react-router-dom";
import ExpectationPage from "./page/ExpectationPage";
import ConfigPage from "./page/ConfigPage";
import LogPage from "./page/LogPage";
import { useEffect } from "react";

function App() {
  const dispatch = useDispatch();
  const projectList = useAppSelector((state) => state.project.projectList);
  const systemConfigState = useAppSelector((state) => state.systemConfig);
  const projectListQuery = useQuery({
    queryKey: ["projectList"],
    queryFn: async () => {
      const res = await getProjectListReq();
      dispatch(setProjectList(res));
      return res;
    },
  });
  useEffect(() => {
    if (systemConfigState.mode === "dark") {
      document.body.className = "dark_mode";
      document.getElementsByTagName("html")[0].style.background =
        "linear-gradient(to bottom, #262626 0, #262626 73px, #595959 73px) repeat-x";
    } else {
      document.getElementsByTagName("html")[0].style.background =
        "linear-gradient(to bottom, rgb(36, 41, 47) 0, rgb(36, 41, 47) 73px, white 73px) repeat-x";
      document.body.className = "";
    }
  }, [systemConfigState.mode]);
  return (
    <>
      <ConfigProvider
        theme={
          systemConfigState.mode === "dark"
            ? { algorithm: theme.darkAlgorithm }
            : {}
        }
      >
        <AntApp>
          {!projectListQuery.isLoading ? (
            projectList.length === 0 ? (
              <WelcomePage />
            ) : (
              <Layout>
                <Routes>
                  <Route path={"expectation"} element={<ExpectationPage />} />
                  <Route path={"requestLog"} element={<LogPage />}></Route>
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
        </AntApp>
      </ConfigProvider>
    </>
  );
}

export default App;

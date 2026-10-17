import "antd/dist/reset.css";
import "./App.css";
import Layout from "./component/Layout";
import { useQuery } from "@tanstack/react-query";
import { getProjectListReq } from "./server/projectServer";
import WelcomePage from "./page/WelcomePage";
import { useDispatch } from "react-redux";
import { setProjectList } from "./slice/projectSlice";
import { setMode } from "./slice/systemConfigSlice";
import { useAppSelector } from "./store";
import { Toaster } from "react-hot-toast";
import { Spin, ConfigProvider, theme, App as AntApp } from "antd";
import { Route, Routes, Navigate, HashRouter } from "react-router-dom";
import ExpectationPage from "./page/ExpectationPage";
import ConfigPage from "./page/ConfigPage";
import LogPage from "./page/LogPage";
import { useEffect } from "react";

function App() {
  const dispatch = useDispatch();
  const projectList = useAppSelector((state) => state.project.projectList);
  const projectListQuery = useQuery({
    queryKey: ["projectList"],
    queryFn: async () => {
      const res = await getProjectListReq();
      dispatch(setProjectList(res));
      return res;
    },
  });
  useEffect(() => {
    dispatch(setMode("dark"));
    document.body.className = "dark_mode";
    document.documentElement.style.colorScheme = "dark";
  }, [dispatch]);
  return (
    <>
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <AntApp>
          {!projectListQuery.isLoading ? (
            projectList.length === 0 ? (
              <WelcomePage />
            ) : (
              <HashRouter>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path={"expectation"} element={<ExpectationPage />} />
                    <Route path={"requestLog"} element={<LogPage />}></Route>
                    <Route path={"config"} element={<ConfigPage />} />
                    <Route path={"*"} element={<Navigate to={"expectation"} />} />
                  </Route>
                </Routes>
              </HashRouter>
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

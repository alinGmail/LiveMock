import "antd/dist/reset.css";
import "./App.css";
import Layout from "./component/Layout";
import { useQuery } from "@tanstack/react-query";
import { getProjectListReq } from "./server/projectServer";
import WelcomePage from "./page/WelcomePage";
import { useDispatch } from "react-redux";
import { setProjectList } from "./slice/projectSlice";
import { useAppSelector } from "./store";
import toast, { Toaster } from "react-hot-toast";
import { ConfigProvider, Spin, theme, App as AntApp } from "antd";
import { Route, Routes, Navigate, HashRouter } from "react-router-dom";
import ExpectationPage from "./page/ExpectationPage";
import LogPage from "./page/LogPage";
import ConfigPage from "./page/ConfigPage";
import { useEffect, useRef, useState } from "react";
import RequestLogDetailPage from "./page/RequestLogDetail/RequestLogDetailPage";
import AuthPage from "./page/AuthPage";
import { getAuthStatusReq, getMeReq } from "./server/authServer";
import {
  setLoggedOutHandler,
  setUnauthorizedHandler,
} from "./server/authEvents";
import { getErrorMessage } from "./component/common";

type AuthState = "loading" | "login" | "register" | "authenticated";

function App() {
  const dispatch = useDispatch();
  const projectList = useAppSelector((state) => state.project.projectList);
  const systemConfigState = useAppSelector((state) => state.systemConfig);
  const [authState, setAuthState] = useState<AuthState>("loading");
  const authStateRef = useRef<AuthState>(authState);
  authStateRef.current = authState;

  const projectListQuery = useQuery({
    queryKey: ["projectList"],
    queryFn: async () => {
      let res = await getProjectListReq();
      dispatch(setProjectList(res));
      return res;
    },
    enabled: authState === "authenticated",
  });

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (authStateRef.current === "authenticated") {
        // set the ref immediately so parallel 401s raise only one toast
        authStateRef.current = "login";
        setAuthState("login");
        toast.error("Your session has expired, please sign in again");
      }
    });
    setLoggedOutHandler(() => {
      setAuthState("login");
    });
    let cancelled = false;
    (async () => {
      try {
        const status = await getAuthStatusReq();
        if (cancelled) {
          return;
        }
        if (!status.accountExists) {
          setAuthState("register");
          return;
        }
        try {
          await getMeReq();
          if (!cancelled) {
            setAuthState("authenticated");
          }
        } catch (error) {
          if (!cancelled) {
            setAuthState("login");
          }
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(getErrorMessage(error));
          setAuthState("login");
        }
      }
    })();
    return () => {
      cancelled = true;
      setUnauthorizedHandler(null);
      setLoggedOutHandler(null);
    };
  }, []);

  useEffect(() => {
    if (systemConfigState.mode === "dark") {
      document.body.className = "dark_mode";
      document.documentElement.style.colorScheme = "dark";
      document.getElementsByTagName("html")[0].style.background =
        "linear-gradient(to bottom, #262626 0, #262626 73px, #595959 73px) repeat-x";
    } else {
      document.documentElement.style.colorScheme = "light";
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
          {authState === "loading" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
              }}
            >
              <Spin tip="Loading" size="large">
                <div className="content" style={{ height: "200px" }} />
              </Spin>
            </div>
          )}
          {(authState === "login" || authState === "register") && (
            <AuthPage
              mode={authState}
              onSuccess={() => {
                setAuthState("authenticated");
              }}
            />
          )}
          {authState === "authenticated" &&
            (!projectListQuery.isLoading ? (
              projectList.length === 0 ? (
                <WelcomePage />
              ) : (
                <HashRouter>
                  <Routes>
                    <Route element={<Layout />}>
                      <Route
                        path={"expectation"}
                        element={<ExpectationPage />}
                      />
                      <Route path={"requestLog"} element={<LogPage />} />
                      <Route path={"config"} element={<ConfigPage />} />
                      <Route
                        path={"*"}
                        element={<Navigate to={"expectation"} />}
                      />
                    </Route>
                    <Route
                      path={"requestLog/detail/:logId"}
                      element={<RequestLogDetailPage />}
                    />
                  </Routes>
                </HashRouter>
              )
            ) : (
              <Spin tip="Loading" size="large">
                <div className="content" style={{ height: "500px" }} />
              </Spin>
            ))}
          <Toaster />
        </AntApp>{" "}
      </ConfigProvider>
    </>
  );
}

export default App;

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
import toast, { Toaster } from "react-hot-toast";
import { ConfigProvider, Spin, theme, App as AntApp } from "antd";
import { Route, Routes, Navigate, HashRouter } from "react-router-dom";
import ExpectationPage from "./page/ExpectationPage";
import LogPage from "./page/LogPage";
import SettingsPage from "./page/SettingsPage";
import { useEffect, useRef, useState } from "react";
import AuthPage from "./page/AuthPage";
import { setUsername } from "./slice/authSlice";
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
        dispatch(setUsername(""));
        toast.error("Your session has expired, please sign in again");
      }
    });
    setLoggedOutHandler(() => {
      dispatch(setUsername(""));
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
          const me = await getMeReq();
          if (!cancelled) {
            dispatch(setUsername(me.username));
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
    // The redesign's first step is dark-only: force the dark theme regardless
    // of any previously stored preference. The theme state and its setter are
    // kept in code but the toggle is no longer rendered.
    dispatch(setMode("dark"));
    document.body.className = "dark_mode";
    document.documentElement.style.colorScheme = "dark";
    document.getElementsByTagName("html")[0].style.background = "";
  }, [dispatch]);

  return (
    <>
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
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
              onSuccess={(username) => {
                dispatch(setUsername(username));
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
                      <Route path={"settings"} element={<SettingsPage />} />
                      <Route
                        path={"config"}
                        element={<Navigate to={"/settings"} replace />}
                      />
                      <Route
                        path={"*"}
                        element={<Navigate to={"expectation"} />}
                      />
                    </Route>
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

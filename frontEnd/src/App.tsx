import "antd/dist/reset.css";
import "./App.css";
import Layout from "./component/Layout";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProjectList } from "./server/projectServer";
import WelcomePage from "./page/WelcomePage";
import { useDispatch } from "react-redux";
import { setProjectList } from "./slice/projectSlice";

function App() {
  const dispatch = useDispatch();
  const projectListQuery = useQuery({
    queryKey: ["projectList"],
    queryFn: async () => {
      let res = await getProjectList();
      dispatch(setProjectList(res));
    },
  });

  useEffect(() => {
    // load project list
  }, []);

  return (
    <>
      <WelcomePage />
      <Layout />
    </>
  );
}

export default App;

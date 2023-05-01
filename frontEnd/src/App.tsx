import "antd/dist/reset.css";
import "./App.css";

import Layout from "./component/Layout";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProjectList } from "./server/projectServer";

function App() {
  const projectListQuery = useQuery(["getProjectList"], () => {
    return getProjectList();
  });
  useEffect(() => {
    // load project list

  }, []);

  return (
    <>
      <Layout />
    </>
  );
}

export default App;

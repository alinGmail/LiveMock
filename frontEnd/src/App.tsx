import "antd/dist/reset.css";
import "./App.css";

import Layout from "./component/Layout";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProjectList } from "./server/projectServer";

function App() {
  useEffect(() => {
    // load project list
    useQuery(["getProjectList"], () => {
      return getProjectList().then(res =>{

      });
    });
  }, []);

  return (
    <>
      <Layout />
    </>
  );
}

export default App;

import { useState } from 'react'
import './App.css'
import {useDispatch} from "react-redux";
import {useAppSelector} from "./store.ts";
import {useQuery} from "@tanstack/react-query";
import {getProjectListReq} from "./server/projectServer.ts";
import {setProjectList} from "./slice/projectSlice.ts";
import {Spin} from "antd";
import {Toaster} from "react-hot-toast";
import WelcomePage from "./page/WelcomePage.tsx";
import Layout from "./component/Layout.tsx";

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

                </Layout>
            )
        ) : (
            <Spin tip="Loading" size="large">
                <div className="content" style={{height:"500px"}}/>
            </Spin>
        )}
        <Toaster />
    </>
  )
}

export default App

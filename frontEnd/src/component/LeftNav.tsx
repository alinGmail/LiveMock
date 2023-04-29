import mStyle from "./LeftNav.module.scss";
import { NavLink } from "react-router-dom";
import {
  SettingOutlined,
  ReadOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";

const LeftNav = () => {
  return (
    <div className={mStyle.leftNav}>
      <NavLink
        to={"/expectation"}
        className={({ isActive }) => {
          return [mStyle.linkRow, isActive ? mStyle.linkActivate : ""].join(
            " "
          );
        }}
      >
        <DatabaseOutlined /> Exception
      </NavLink>
      <NavLink
        to={"/requestLog"}
        className={({ isActive }) => {
          return [mStyle.linkRow, isActive ? mStyle.linkActivate : ""].join(
            " "
          );
        }}
      >
        <ReadOutlined /> Request Log
      </NavLink>
      <NavLink
        to={"/config"}
        className={({ isActive }) => {
          return [mStyle.linkRow, isActive ? mStyle.linkActivate : ""].join(
            " "
          );
        }}
      >
        <SettingOutlined /> Config
      </NavLink>
    </div>
  );
};

export default LeftNav;

import mStyle from "./LeftNav.module.scss";
import { NavLink } from "react-router-dom";
import {
  SettingOutlined,
  ReadOutlined,
  DatabaseOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Tooltip } from "antd";

interface LeftNavProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: "/expectation", label: "Expectation", icon: <DatabaseOutlined /> },
  { to: "/requestLog", label: "Request Log", icon: <ReadOutlined /> },
  { to: "/config", label: "Config", icon: <SettingOutlined /> },
];

const LeftNav = ({ collapsed, onToggle }: LeftNavProps) => {
  return (
    <div
      className={[mStyle.leftNav, collapsed ? mStyle.leftNavCollapsed : ""].join(
        " "
      )}
    >
      <div className={mStyle.collapseBtnRow}>
        <Tooltip title={collapsed ? "Expand" : "Collapse"} placement="right">
          <button
            type="button"
            className={mStyle.collapseBtn}
            aria-label={collapsed ? "expand navigation" : "collapse navigation"}
            onClick={onToggle}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        </Tooltip>
      </div>
      {navItems.map((item) => (
        <Tooltip
          key={item.to}
          title={collapsed ? item.label : undefined}
          placement="right"
        >
          <NavLink
            to={item.to}
            className={({ isActive }) => {
              return [mStyle.linkRow, isActive ? mStyle.linkActivate : ""].join(
                " "
              );
            }}
          >
            <span className={mStyle.linkIcon}>{item.icon}</span>
            <span className={mStyle.linkText}>{item.label}</span>
          </NavLink>
        </Tooltip>
      ))}
    </div>
  );
};

export default LeftNav;

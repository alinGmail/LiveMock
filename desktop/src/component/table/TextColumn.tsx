import { Component } from "react";
import { Tooltip } from "antd";

class TextColumn extends Component<{ content: string }, {}> {
  render() {
    return (
      <Tooltip
        mouseEnterDelay={1}
        mouseLeaveDelay={0.3}
        overlayStyle={{ width: "600px", height: "500px", maxWidth: "600px" }}
        placement={"bottom"}
        overlayInnerStyle={{
          width: "600px",
          height: "500px",
          overflow: "scroll",
        }}
        title={this.props.content}
      >
        <div
          style={{
            lineClamp: "5",
            WebkitLineClamp: "5",
            wordBreak: "break-all",
            WebkitBoxOrient: "vertical",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            overflow: "hidden",
          }}
        >
          {this.props.content}
        </div>
      </Tooltip>
    );
  }
}

export default TextColumn;

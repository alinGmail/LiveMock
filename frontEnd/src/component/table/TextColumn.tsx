import { Component } from "react";

class TextColumn extends Component<{ content: string }, {}> {
  render() {
    return (
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
    );
  }
}

export default TextColumn;

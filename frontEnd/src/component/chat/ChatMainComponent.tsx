import { WebsocketMessageM } from "core/struct/log";
import mStyle from "./ChatMainComponent.module.scss";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const showStep = 5;
const reservedHeight = 50;

const ChatMainComponent: React.FunctionComponent<{
  messageListContainer: MessageListContainer;
}> = ({ messageListContainer }) => {
  const scrollView = useRef<HTMLDivElement>(null);
  const keepBottom = useRef<number | null>(null);
  const [flag, setFlag] = useState<number>(0);
  const [startShowIndex, setStartShowIndex] = useState<number>(
    messageListContainer.messageList.length
  );
  // loadFinish: not need to load date temporary
  const [loadStatus, setLoadStatus] = useState<
    "loading" | "allLoaded" | "loadFinish"
  >("loading");
  useEffect(() => {
    const concatEvent: MessageConcatEventFun = (newMessage) => {
      setFlag(Math.random());
    };
    messageListContainer.addConcatEvent(concatEvent);
    return () => {
      messageListContainer.removeConcatEvent(concatEvent);
    };
  }, [messageListContainer]);
  useLayoutEffect(() => {
    if (!scrollView.current) {
      return;
    }
    if (keepBottom.current !== null) {
      // scroll to bottom
      scrollView.current.scrollTop =
        scrollView.current.scrollHeight -
        scrollView.current.clientHeight -
        keepBottom.current;
      keepBottom.current = null;
    }

    if (loadStatus === "allLoaded" || loadStatus === "loadFinish") {
      return;
    }

    if (startShowIndex === 0) {
      return;
    }
    if (scrollView.current.clientHeight >= scrollView.current.scrollHeight) {
      // load more date
      setStartShowIndex(Math.max(0, startShowIndex - showStep));
      keepBottom.current = 0;
      return;
    }
    if (scrollView.current.scrollTop < reservedHeight) {
      // load more date
      // keep bottom position
      setStartShowIndex(Math.max(0, startShowIndex - showStep));
      keepBottom.current =
        scrollView.current.scrollHeight -
        scrollView.current.scrollTop -
        scrollView.current.clientHeight;
      return;
    }
  });

  return (
    <div className={mStyle.chatMain}>
      {JSON.stringify(flag)}
      {messageListContainer.messageList.length}
      <div className={mStyle.chatContainer}>
        <div className={mStyle.chatScrollView} ref={scrollView}>
          {messageListContainer.messageList.map((messageItem, index) => {
            if (index < startShowIndex) {
              return null;
            }
            return (
              <div className={mStyle.chatItemRow}>{messageItem.content}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

type MessageConcatEventFun = (newMessages: Array<WebsocketMessageM>) => void;

export class MessageListContainer {
  constructor(messageList: Array<WebsocketMessageM>) {
    this.messageList = messageList;
    this.concatEvents = [];
  }
  messageList: Array<WebsocketMessageM>;
  concatEvents: Array<MessageConcatEventFun>;
  concat(newMessages: Array<WebsocketMessageM>) {
    this.messageList.splice(this.messageList.length, 0, ...newMessages);
    this.concatEvents.forEach((fun) => {
      fun(newMessages);
    });
  }
  addConcatEvent(fun: MessageConcatEventFun) {
    this.concatEvents.push(fun);
  }
  removeConcatEvent(fun: MessageConcatEventFun) {
    this.concatEvents = this.concatEvents.filter((concatFun) => {
      return concatFun !== fun;
    });
  }
}

export default ChatMainComponent;

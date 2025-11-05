import { ChartBar } from "lucide-react";
import ChatHeader from "./components/chat-header";
import MessageBar from "./components/message bar";
import MessageContainer from "./components/message-container";
import { useEffect } from "react";


const ChatContainer = () => {
    return (
        <section
            className="fixed top-0 h-[100vh] w-[100vw] bg-[#1c1d25] flex flex-col md:static md:flex-1"
            aria-label="Chat Conversation Area"
        >
            <ChatHeader />
            <MessageContainer />
            <MessageBar />
        </section>
    );
};

export default ChatContainer;
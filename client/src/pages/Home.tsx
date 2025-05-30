import Sidebar  from '../components/Sidebar';
import { useChatStore } from '../store/useChatStore';
import NoChatSelected from '../components/NoChatSelected';
import ChatContainer from '../components/ChatContainer';

const Home = () => {
  const { selectedUser } = useChatStore();
  return (
    <div className="h-screen dark:bg-blue-100 bg-[#101828]">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="rounded-lg w-full max-w-6xl h-[calc(100vh-5.3rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />

            {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

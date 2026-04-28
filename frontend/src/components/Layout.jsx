import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import CallOverlay from './CallOverlay';

const Layout = () => {
  return (
    <div className="flex bg-[#0B0B0F] min-h-screen">
      <CallOverlay />
      {/* Mesh Background */}
      <div className="fixed inset-0 bg-mesh pointer-events-none z-0" />
      
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <Outlet />
        </div>
        
        {/* Right Sidebar - Analytics & Stats */}
        <div className="hidden xl:block border-l border-white/5">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
};

export default Layout;

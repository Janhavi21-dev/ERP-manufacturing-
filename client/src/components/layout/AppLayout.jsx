import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ChatBot from '../../features/assistant/ChatBot';

export default function AppLayout() {
  const sidebarOpen = useSelector((s) => s.ui.sidebarOpen);
  const sidebarCollapsed = useSelector((s) => s.ui.sidebarCollapsed);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => {}}
        />
      )}

      {/* Main content */}
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* AI Assistant Chatbot */}
      <ChatBot />
    </div>
  );
}

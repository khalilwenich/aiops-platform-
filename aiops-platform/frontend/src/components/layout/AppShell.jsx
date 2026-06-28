import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { ForcePasswordChangeModal } from './ForcePasswordChangeModal.jsx';

export function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <ForcePasswordChangeModal />
      <Sidebar />
      <Topbar />
      <main className="ml-60 pt-16 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppShell;

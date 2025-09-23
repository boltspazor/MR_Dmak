import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Megaphone,
  Layout,
  UserCheck,
  ClipboardList,
  Shield,
  Wand2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface CollapsibleSidebarProps {
  activePage: string;
  onNavigate: (route: string) => void;
  onLogout: () => void;
  userName: string;
  userRole: string;
  children: React.ReactNode;
}

const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  activePage,
  onNavigate,
  onLogout,
  userName,
  userRole,
  children
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { canAccess } = useAuth();

  const navigationItems = [
    { name: 'Dashboard', route: '/dashboard', icon: Home },
    { name: 'Campaigns', route: '/campaigns', icon: Megaphone },
    { name: 'Campaign Wizard', route: '/campaign-wizard', icon: Wand2 },
    { name: 'Templates', route: '/templates', icon: Layout },
    { name: 'Medical Reps', route: '/mrs', icon: UserCheck },
    { name: 'Simple MR Tool', route: '/simple-mr-tool', icon: Users },
    { name: 'Consent Form', route: '/consent-form', icon: ClipboardList },
    { name: 'Super Admin', route: '/super-admin', icon: Shield },
  ];

  const filteredItems = navigationItems.filter(item => canAccess(item.route));

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative z-50 lg:z-auto
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition-all duration-300 ease-in-out
        bg-white border-r border-gray-200 h-full flex flex-col shadow-sm
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-lg font-bold text-gray-900">D-MAK</span>
            </div>
          )}
          
          {/* Collapse Toggle */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={toggleMobile}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.route;
            
            return (
              <button
                key={item.route}
                onClick={() => {
                  onNavigate(item.route);
                  setIsMobileOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                  ${isCollapsed ? 'justify-center' : 'justify-start'}
                `}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon size={isCollapsed ? 24 : 20} />
                {!isCollapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          {/* User Info */}
          <div className={`
            flex items-center gap-3 mb-3
            ${isCollapsed ? 'justify-center' : 'justify-start'}
          `}>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <User size={isCollapsed ? 20 : 16} className="text-gray-600" />
            </div>
            {!isCollapsed && (
              <div className="text-gray-900">
                <div className="text-sm font-medium">{userName}</div>
                <div className="text-xs text-gray-500 capitalize">{userRole}</div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg
              text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all
              ${isCollapsed ? 'justify-center' : 'justify-start'}
            `}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut size={isCollapsed ? 24 : 20} />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <button
            onClick={toggleMobile}
            className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">D-MAK</h1>
          <div className="w-8" /> {/* Spacer */}
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSidebar;
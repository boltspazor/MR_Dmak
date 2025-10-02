import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  LogOut, 
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
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
    { name: 'Campaign Wizard', route: '/campaign-wizard', icon: Wand2 },
    { name: 'Templates', route: '/templates', icon: Layout },
    { name: 'MR Management', route: '/mrs', icon: UserCheck },
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
        bg-gradient-to-b from-blue-500 to-white border-r border-gray-200 h-full flex flex-col shadow-sm
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-lg font-bold text-white">D-MAK</span>
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
                    ? 'bg-white/20 backdrop-blur text-white font-semibold' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
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
        <div className="p-4 border-t border-white/20">
          {/* DVK Logo */}
          <div className={`
            flex justify-center mb-4
            ${isCollapsed ? 'px-2' : 'px-4'}
          `}>
            <img 
              src="/dvk.svg" 
              alt="DVK Logo" 
              className={`
                ${isCollapsed ? 'w-8 h-8' : 'w-12 h-12'}
                object-contain
              `}
            />
          </div>

          {/* User Info */}
          <div className={`
            flex items-center gap-3 mb-3
            ${isCollapsed ? 'justify-center' : 'justify-start'}
          `}>
            <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <User size={isCollapsed ? 20 : 16} className="text-white" />
            </div>
            {!isCollapsed && (
              <div className="text-white">
                <div className="text-sm font-medium">{userName}</div>
                <div className="text-xs text-white/70 capitalize">{userRole}</div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg
              text-white/80 hover:bg-white/10 hover:text-white transition-all
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
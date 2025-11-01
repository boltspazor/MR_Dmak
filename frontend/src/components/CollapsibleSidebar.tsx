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
  Wand2,
  UserPlus
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
  const { canAccess, isMarketingManager, isSuperAdmin } = useAuth();

  // Display "Marketing Manager" role if user is a marketing manager (but not super admin)
  const displayRole = (isMarketingManager && isMarketingManager() && !isSuperAdmin()) ? 'Marketing Manager' : userRole;

  const navigationItems = [
    { name: 'Dashboard', route: '/dashboard', icon: Home },
    { name: 'Campaign Wizard', route: '/campaign-wizard', icon: Wand2 },
    { name: 'Templates', route: '/templates', icon: Layout },
    { name: 'MR Management', route: '/mrs', icon: UserCheck },
    { name: 'Simple MR Tool', route: '/simple-mr-tool', icon: Users },
    { name: 'Consent Form', route: '/consent-form', icon: ClipboardList },
    { name: 'Manage Managers', route: '/manage-managers', icon: UserPlus },
    { name: 'Super Admin', route: '/super-admin', icon: Shield },
  ];

  // If the current user is a marketing manager (and NOT super admin), explicitly allow only dashboard and campaign-wizard
  const MARKETING_MANAGER_ALLOWED_ROUTES = ['/dashboard', '/campaign-wizard'];

  const filteredItems = navigationItems.filter(item => {
    // Super admin gets full access - check this first!
    if (isSuperAdmin && isSuperAdmin()) {
      return canAccess(item.route);
    }

    // Check if user is a marketing manager (but not super admin)
    const isMM = isMarketingManager ? isMarketingManager() : false;
    
    if (isMM) {
      // Marketing managers can ONLY see Dashboard and Campaign Wizard
      return MARKETING_MANAGER_ALLOWED_ROUTES.includes(item.route);
    }

    // For regular users, use normal canAccess check
    return canAccess(item.route);
  });

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
        fixed lg:relative z-50 lg:z-auto bg-white
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition-all duration-300 ease-in-out
         h-full flex flex-col shadow-sm
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-2 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div>
                <img 
                  src="/DVK_updated_logo.png" 
                  alt="D-MAK Logo" 
                  className="h-16 object-contain"
                />
              </div>
            </div>
          )}
          
          {/* Collapse Toggle */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors border border-gray-400"
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
        <nav className="flex-1 p-4 space-y-2 bg-gradient-to-b from-blue-500 to-white border-r border-gray-200">
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
                    : item.route === '/super-admin' 
                      ? 'text-black hover:bg-white/10 hover:text-gray-800'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center' : 'justify-start'}
                `}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon size={isCollapsed ? 24 : 20} />
                {!isCollapsed && (
                  <span className={`font-medium ${
                    item.name === 'Super Admin' ? 'text-black' : 'text-white'
                  }`}>{item.name}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/20">

          {/* User Info */}
          <div className={`
            flex items-center gap-3 mb-3
            ${isCollapsed ? 'justify-center' : 'justify-start'}
          `}>
            <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border border-gray-400">
              <User size={isCollapsed ? 20 : 16} className="" />
            </div>
            {!isCollapsed && (
              <div className="text-black">
                <div className="text-sm font-medium">{userName}</div>
                <div className="text-xs text-black/70 capitalize">{displayRole}</div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg
              text-black hover:bg-white/10 hover:text-gray-800 transition-all
              ${isCollapsed ? 'justify-center' : 'justify-start'}
            `}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut size={isCollapsed ? 24 : 20} />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
          
          {/* DVK Logo - Moved to bottom with larger size */}
          <div className={`
            flex justify-center border-t border-white/20
            ${isCollapsed ? 'px-2' : 'px-2'}
          `}>
            <img 
              src="/dvk.svg" 
              alt="DVK Logo" 
              className={`
                ${isCollapsed ? 'w-10 h-10' : 'w-16 h-16'}
                object-contain
              `}
            />
          </div>
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
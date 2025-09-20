import React from 'react';
import { 
  MessageSquare, 
  FileText, 
  BarChart3, 
  LogOut, 
  Shield,
  Users,
  FolderOpen
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  route: string;
  clickable?: boolean;
}

interface SidebarProps {
  activePage: string;
  onNavigate: (route: string) => void;
  onLogout: () => void;
  userName?: string;
  userRole?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activePage, 
  onNavigate, 
  onLogout, 
  userName = "User Name",
  userRole = "Super Admin"
}) => {
  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Campaigns Dashboard', icon: BarChart3, route: '/dashboard' },
    { id: 'dmak', label: 'MR Management', icon: Users, route: '/dmak' },
    { id: 'templates', label: 'Templates Management', icon: FolderOpen, route: '/templates' },
    { id: 'campaigns', label: 'Konnect', icon: MessageSquare, route: '/campaigns' },
    { id: 'super-admin', label: 'Super Admin', icon: Shield, route: '/super-admin', clickable: false },
  ];

  return (
    <div 
      className="fixed left-0 top-0 w-23 h-screen" 
      style={{ 
        width: '92px',
        background: 'linear-gradient(180deg, #3B82F6 0%, #ffffff 100%)'
      }}
    >
      <div className="flex flex-col h-full">
        {/* Top Section */}
        <div className="flex flex-col items-center py-4 space-y-2">
          {/* User Name and Role */}
          <div className="text-white text-xs font-semibold mb-4 text-center px-2">
            <div className="text-xs font-medium">{userName}</div>
            <div className="text-xs text-blue-200 mt-1">({userRole})</div>
          </div>

          {/* Menu Items */}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const isClickable = item.clickable !== false;
            
            if (!isClickable) {
              // Render non-clickable Super Admin icon
              return (
                <div
                  key={item.id}
                  className="flex flex-col items-center p-2 rounded-lg w-16 h-16 opacity-75"
                >
                  <Icon className="h-7 w-7 text-white mb-1" />
                  <span className="text-xs text-white text-center">{item.label}</span>
                </div>
              );
            }
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.route)}
                className={`flex flex-col items-center p-2 rounded-lg w-16 h-16 transition-colors cursor-pointer ${
                  isActive 
                    ? 'border border-gray-200 bg-white bg-opacity-10' 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <Icon className="h-7 w-7 text-white mb-1" />
                <span className="text-xs text-white text-center">{item.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Bottom Section */}
        <div className="mt-auto flex flex-col items-center space-y-2 pb-4">
          {/* Logout */}
          <button 
            onClick={onLogout}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <LogOut className="h-7 w-7 text-gray-800 mb-1 font-bold stroke-2" />
            <span className="text-xs text-gray-800 text-center font-bold">Logout</span>
          </button>
          
          {/* Bottom Logo */}
          <div className="mt-2">
            <img 
              src="/dvk.svg" 
              alt="Logo" 
              className="w-12 h-10 drop-shadow-lg object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

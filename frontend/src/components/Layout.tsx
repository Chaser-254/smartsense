import { ReactNode } from 'react';
import { Camera, BookOpen, Home, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  currentPage: 'dashboard' | 'scan' | 'education' | 'profile';
  onNavigate: (page: 'dashboard' | 'scan' | 'education' | 'profile') => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    { id: 'dashboard' as const, icon: Home, label: 'Home' },
    { id: 'scan' as const, icon: Camera, label: 'Scan' },
    { id: 'education' as const, icon: BookOpen, label: 'Learn' },
    { id: 'profile' as const, icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-green-500 p-2 rounded-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">SmartSense</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      <nav className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex flex-col items-center gap-1 py-3 px-6 transition ${
                    isActive
                      ? 'text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toggleSidebar } from '../../app/uiSlice';
import { useLogoutMutation } from '../../redux/api/authApiSlice';
import { selectCurrentUser, logout } from '../../redux/authSlice';
import { Menu, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { getInitials } from '../../lib/utils';

export default function Topbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [logoutApi] = useLogoutMutation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      dispatch(logout());
    } finally {
      navigate('/login');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-gray-800">{user?.company?.name || 'Manufacturing ERP'}</h1>
          <p className="text-[11px] text-gray-400">Enterprise Resource Planning</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        {/*<Link
          to="/notifications"
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-600 rounded-full" />
        </Link>*/}

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-gray-50 transition"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs">
              {getInitials(user?.name || user?.email || 'Admin')}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-gray-700 leading-tight">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-gray-400 capitalize">
                {user?.role?.name || user?.role || 'Super Admin'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {profileMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 animate-scale-up"
              onMouseLeave={() => setProfileMenuOpen(false)}
            >
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-800">{user?.name || 'User'}</p>
                <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
              </div>

              <Link
                to="/profile"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
              >
                <User className="w-4 h-4 text-gray-400" />
                <span>My Profile</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition text-left"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

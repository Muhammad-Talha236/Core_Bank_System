import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export default function CustomerLayout() {
  const { customer, logout } = useCustomerAuth();
  const [activeMenu, setActiveMenu] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col font-sans text-slate-800">
      
      {/* SINGLE CLEAN CORPORATE NAVBAR */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-18 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => navigate('/customer/portal')}>
            <div className="flex items-center text-xl tracking-tight text-[#005a43]">
              <span className="text-[#84bd00] text-2xl font-black mr-1 leading-none">»</span>
              <span className="font-extrabold tracking-tight text-[#004d38]">MERIDIAN</span>
            </div>
          </div>

          {/* Primary Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 font-semibold text-xs uppercase tracking-wider text-gray-600 h-full">
            <NavLink 
              to="/customer/portal" 
              end
              className={({ isActive }) => `hover:text-[#005a43] transition h-full flex items-center border-b-2 ${isActive ? 'border-[#005a43] text-[#005a43]' : 'border-transparent'}`}
            >
              Dashboard
            </NavLink>

            {/* Accounts Dropdown Module */}
            <div 
              className="relative h-full flex items-center cursor-pointer"
              onMouseEnter={() => setActiveMenu('accounts')}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <span className="hover:text-[#005a43] h-full flex items-center gap-1 transition">Accounts <span className="text-[9px] text-gray-400">▼</span></span>
              {activeMenu === 'accounts' && (
                <div className="absolute top-full left-0 w-60 bg-white border border-gray-200 shadow-xl py-2 rounded-xs">
                  <NavLink to="/customer/portal" className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-[#005a43]">My Savings & Current Accounts</NavLink>
                  <NavLink to="/customer/portal" className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-[#005a43]">Passbook Ledger Statement</NavLink>
                </div>
              )}
            </div>

            <NavLink 
              to="/customer/portal/transfer" 
              className={({ isActive }) => `hover:text-[#005a43] transition h-full flex items-center border-b-2 ${isActive ? 'border-[#005a43] text-[#005a43]' : 'border-transparent'}`}
            >
              Send Money
            </NavLink>

            <NavLink 
              to="/customer/portal/bills" 
              className={({ isActive }) => `hover:text-[#005a43] transition h-full flex items-center border-b-2 ${isActive ? 'border-[#005a43] text-[#005a43]' : 'border-transparent'}`}
            >
              Bill Payments
            </NavLink>

            <NavLink 
              to="/customer/portal/security" 
              className={({ isActive }) => `hover:text-[#005a43] transition h-full flex items-center border-b-2 ${isActive ? 'border-[#005a43] text-[#005a43]' : 'border-transparent'}`}
            >
              Security
            </NavLink>
          </nav>

          {/* User Profile & Sign Out */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-gray-900">{customer?.name}</p>
              <p className="text-[10px] font-mono text-[#005a43] uppercase tracking-wider font-semibold">Online Client</p>
            </div>

            <button 
              onClick={logout}
              className="text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 transition px-3.5 py-2 rounded border border-red-200 bg-white"
            >
              Sign Out
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-8 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
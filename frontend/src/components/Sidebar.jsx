import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, BrainCircuit } from 'lucide-react';

export default function Sidebar() {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Create Plan', path: '/plan', icon: PlusCircle },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded-lg">
          <BrainCircuit className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">Study Agent</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-indigo-600 rounded-2xl p-4 text-white">
          <p className="text-xs font-medium opacity-80 mb-1">Upgrade to Pro</p>
          <p className="text-sm font-bold mb-3">Unlimited AI Planning</p>
          <button className="w-full bg-white text-indigo-600 text-xs font-bold py-2 rounded-lg hover:bg-indigo-50 transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </aside>
  );
}


import React from 'react';
import { Sidebar } from './Sidebar';
import { Page, User } from '../types';
import { Icons } from './Icons';

interface LayoutProps {
  activePage: Page;
  setPage: (page: Page) => void;
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ activePage, setPage, children, user, onLogout }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activePage={activePage} setPage={setPage} user={user} />
      
      <main className="flex-1 md:ml-64 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 bg-white border-b border-gray-200 items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center w-96">
            <div className="relative w-full">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索 SKU / 货位号 / 产品名称 / 订单号..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setPage(Page.SCAN_INBOUND)}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm shadow-primary-200"
            >
              <Icons.Scan className="w-4 h-4" />
              快速扫码入库
            </button>
            <div className="h-6 w-px bg-gray-200"></div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setPage(Page.NOTIFICATIONS)}
                className="relative text-gray-500 hover:text-primary-600 transition-colors"
              >
                <Icons.Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] text-white font-bold">5</span>
              </button>
              
              <div className="group relative">
                  <div 
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-blue-400 text-white flex items-center justify-center font-bold text-xs shadow-md ring-2 ring-transparent group-hover:ring-primary-100 transition-all overflow-hidden">
                        {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user?.name?.substring(0, 1)}
                    </div>
                    <span className="text-sm font-bold text-gray-700">{user?.name}</span>
                    <Icons.ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600"/>
                  </div>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all transform origin-top-right z-50">
                      <div className="px-3 py-2 border-b border-gray-50 mb-1">
                          <p className="text-xs text-gray-400">当前角色</p>
                          <p className="text-sm font-bold text-primary-600">{user?.roleName}</p>
                      </div>
                      <button onClick={() => setPage(Page.USER_DETAIL)} className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-primary-600 rounded-lg transition-colors flex items-center gap-2">
                          <Icons.User className="w-4 h-4"/> 个人资料
                      </button>
                      <button onClick={() => setPage(Page.SETTINGS)} className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-primary-600 rounded-lg transition-colors flex items-center gap-2">
                          <Icons.Settings className="w-4 h-4"/> 系统设置
                      </button>
                      <button onClick={onLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 mt-1 border-t border-gray-50">
                          <Icons.LogOut className="w-4 h-4"/> 退出登录
                      </button>
                  </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

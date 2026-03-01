// 行业类型管理：列表、新增、编辑（与租户商品分类/示例数据联动）
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api';
import { Icons } from '../../components/Icons';

interface IndustryRow {
  id: number;
  name: string;
}

export default function IndustriesPage() {
  const [list, setList] = useState<IndustryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<IndustryRow | null>(null);
  const [editName, setEditName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/industries');
      setList(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const startEdit = (row: IndustryRow) => {
    setEditing(row);
    setEditName(row.name);
  };

  const saveEdit = async () => {
    if (!editing || !editName.trim()) return;
    setSaving(true);
    try {
      await apiClient.put(`/admin/industries/${editing.id}`, { name: editName.trim() });
      setEditing(null);
      fetchList();
    } catch (e: any) {
      alert(e?.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const addIndustry = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await apiClient.post('/admin/industries', { name: newName.trim() });
      setShowAdd(false);
      setNewName('');
      fetchList();
    } catch (e: any) {
      alert(e?.response?.data?.message || '新增失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="bg-gray-900 text-white px-8 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <Link to="/saasadmin" className="p-2 hover:bg-gray-800 rounded-full">
            <Icons.ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold tracking-tight">行业类型管理</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">行业列表</h2>
              <p className="text-sm text-gray-500 mt-1">新建租户时可选择行业，用于联动默认商品分类与示例数据</p>
            </div>
            <button
              type="button"
              onClick={() => { setShowAdd(true); setNewName(''); }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2"
            >
              <Icons.Plus className="w-4 h-4" /> 新增行业
            </button>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-gray-500">加载中...</div>
            ) : list.length === 0 ? (
              <div className="p-12 text-center text-gray-500">暂无行业，请点击「新增行业」</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">名称</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {list.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-500">{row.id}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{row.name}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => startEdit(row)} className="font-medium text-primary-600 hover:text-primary-800">编辑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">编辑行业</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                取消
              </button>
              <button type="button" onClick={saveEdit} disabled={saving || !editName.trim()} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">新增行业</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例如：五金机电"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                取消
              </button>
              <button type="button" onClick={addIndustry} disabled={saving || !newName.trim()} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold disabled:opacity-50">
                {saving ? '提交中...' : '新增'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

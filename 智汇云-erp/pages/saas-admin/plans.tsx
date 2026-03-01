// 订阅方案管理：查看与编辑方案及用量限额
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api';
import { Icons } from '../../components/Icons';

interface PlanRow {
  id: number;
  code: string;
  name: string;
  description: string | null;
  max_users: number | null;
  max_storage_gb: number | null;
  ai_calls_per_day: number | null;
}

export default function PlansPage() {
  const [list, setList] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PlanRow | null>(null);
  const [form, setForm] = useState<Partial<PlanRow>>({});
  const [saving, setSaving] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/plans');
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

  const startEdit = (row: PlanRow) => {
    setEditing(row);
    setForm({
      name: row.name,
      description: row.description ?? '',
      max_users: row.max_users ?? undefined,
      max_storage_gb: row.max_storage_gb ?? undefined,
      ai_calls_per_day: row.ai_calls_per_day ?? undefined,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await apiClient.put(`/admin/plans/${editing.id}`, form);
      setEditing(null);
      fetchList();
    } catch (e: any) {
      alert(e?.response?.data?.message || '保存失败');
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
          <h1 className="text-lg font-bold tracking-tight">订阅方案管理</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold text-gray-900">方案列表</h2>
            <p className="text-sm text-gray-500 mt-1">编辑方案名称、描述及用量限额（用户数、存储、AI 调用）</p>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-gray-500">加载中...</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">代码</th>
                    <th className="px-6 py-3">名称</th>
                    <th className="px-6 py-3">描述</th>
                    <th className="px-6 py-3">最大用户数</th>
                    <th className="px-6 py-3">存储(GB)</th>
                    <th className="px-6 py-3">AI调用/日</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {list.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-gray-700">{row.code}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{row.name}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{row.description || '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{row.max_users ?? '不限'}</td>
                      <td className="px-6 py-4 text-gray-600">{row.max_storage_gb ?? '不限'}</td>
                      <td className="px-6 py-4 text-gray-600">{row.ai_calls_per_day ?? '不限'}</td>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">编辑方案 · {editing.code}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
              <input
                value={form.name ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm min-h-[60px]"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最大用户数</label>
                <input
                  type="number"
                  min={0}
                  value={form.max_users ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, max_users: e.target.value === '' ? undefined : parseInt(e.target.value, 10) }))}
                  placeholder="空=不限"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">存储(GB)</label>
                <input
                  type="number"
                  min={0}
                  value={form.max_storage_gb ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, max_storage_gb: e.target.value === '' ? undefined : parseInt(e.target.value, 10) }))}
                  placeholder="空=不限"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AI调用/日</label>
                <input
                  type="number"
                  min={0}
                  value={form.ai_calls_per_day ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, ai_calls_per_day: e.target.value === '' ? undefined : parseInt(e.target.value, 10) }))}
                  placeholder="空=不限"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                取消
              </button>
              <button type="button" onClick={saveEdit} disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

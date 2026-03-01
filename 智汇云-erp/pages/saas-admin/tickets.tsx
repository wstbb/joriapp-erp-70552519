// 工单中心：后台管理员查看、回复、更新状态
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api';
import { Icons } from '../../components/Icons';

interface TicketRow {
  id: number;
  tenant_id: number;
  tenant_name?: string;
  subject: string;
  type: string;
  priority: string;
  status: string;
  created_at: string;
}
interface TicketDetail extends TicketRow {
  contact_email: string;
  body: string;
  updated_at?: string;
  replies?: { id: number; author_type: string; content: string; created_at: string }[];
}

const statusLabel: Record<string, string> = { open: '待处理', answered: '已回复', closed: '已关闭' };
const priorityLabel: Record<string, string> = { low: '低', medium: '中', high: '高' };

export default function TicketsPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/tickets');
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

  const openDetail = async (id: number) => {
    try {
      const res = await apiClient.get(`/api/tickets/${id}`);
      setDetail(res.data);
      setReplyText('');
    } catch (e) {
      console.error(e);
      setDetail(null);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    fetchList();
  };

  const handleReply = async () => {
    if (!detail || !replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/api/tickets/${detail.id}/reply`, { content: replyText.trim() });
      const res = await apiClient.get(`/api/tickets/${detail.id}`);
      setDetail(res.data);
      setReplyText('');
    } catch (e: any) {
      alert(e?.response?.data?.message || '回复失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (status: string) => {
    if (!detail || submitting) return;
    setSubmitting(true);
    try {
      await apiClient.put(`/api/tickets/${detail.id}`, { status });
      const res = await apiClient.get(`/api/tickets/${detail.id}`);
      setDetail(res.data);
      fetchList();
    } catch (e: any) {
      alert(e?.response?.data?.message || '更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (detail) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <header className="bg-gray-900 text-white px-8 py-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-4">
            <Link to="/saasadmin/tickets" onClick={closeDetail} className="p-2 hover:bg-gray-800 rounded-full">
              <Icons.ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold">工单详情</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto p-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-700">{statusLabel[detail.status] || detail.status}</span>
              <span className="px-2 py-1 rounded text-xs font-bold bg-blue-50 text-blue-700">{priorityLabel[detail.priority] || detail.priority}</span>
              <span className="text-sm text-gray-500">租户: {detail.tenant_name || detail.tenant_id}</span>
              <span className="text-sm text-gray-500">联系: {detail.contact_email}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{detail.subject}</h2>
            <p className="text-sm text-gray-500">创建于 {detail.created_at}</p>
            <div className="border-t pt-4 whitespace-pre-wrap text-gray-700">{detail.body || '—'}</div>
            {detail.replies && detail.replies.length > 0 && (
              <div className="border-t pt-4 space-y-3">
                <h3 className="font-bold text-gray-900">回复</h3>
                {detail.replies.map((r) => (
                  <div key={r.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                    <span className="text-gray-500">{r.author_type === 'staff' ? '客服' : '租户'} · {r.created_at}</span>
                    <p className="mt-1 text-gray-800">{r.content}</p>
                  </div>
                ))}
              </div>
            )}
            {detail.status !== 'closed' && (
              <>
                <div className="border-t pt-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="输入回复内容..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm min-h-[80px]"
                    rows={3}
                  />
                  <button
                    type="button"
                    onClick={handleReply}
                    disabled={submitting || !replyText.trim()}
                    className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                  >
                    {submitting ? '提交中...' : '发送回复'}
                  </button>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleStatus('closed')}
                    disabled={submitting}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    关闭工单
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="bg-gray-900 text-white px-8 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <Link to="/saasadmin" className="p-2 hover:bg-gray-800 rounded-full">
            <Icons.ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold tracking-tight">工单中心</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold text-gray-900">全部工单</h2>
            <p className="text-sm text-gray-500 mt-1">查看并回复租户提交的技术支持工单</p>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-gray-500">加载中...</div>
            ) : list.length === 0 ? (
              <div className="p-12 text-center text-gray-500">暂无工单</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">租户</th>
                    <th className="px-6 py-3">主题</th>
                    <th className="px-6 py-3">类型</th>
                    <th className="px-6 py-3">优先级</th>
                    <th className="px-6 py-3">状态</th>
                    <th className="px-6 py-3">创建时间</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {list.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-600">{t.tenant_name || t.tenant_id}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{t.subject}</td>
                      <td className="px-6 py-4 text-gray-600">{t.type}</td>
                      <td className="px-6 py-4 text-gray-600">{priorityLabel[t.priority] || t.priority}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'closed' ? 'bg-gray-100 text-gray-600' : t.status === 'answered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {statusLabel[t.status] || t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{t.created_at ? t.created_at.replace('T', ' ').slice(0, 19) : '—'}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => openDetail(t.id)} className="font-medium text-primary-600 hover:text-primary-800">查看</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiGrid, FiUsers, FiMessageSquare, FiUser, FiSettings, 
  FiChevronLeft, FiMenu,
  FiLogOut, FiHelpCircle, FiDatabase, FiUpload,
  FiActivity, FiMail, FiLock,
  FiLayers
} from 'react-icons/fi';
import axiosInstance from '@/lib/axiosInstance'
import useAuthStore from '@/store/useAuthStore'

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showTemplateApprovals, setShowTemplateApprovals] = useState(false);
  const [showCatalogApprovals, setShowCatalogApprovals] = useState(false);
  const [pendingTemplates, setPendingTemplates] = useState<any[]>([]);
  const [pendingCatalog, setPendingCatalog] = useState<any[]>([]);
  const [pendingCounts, setPendingCounts] = useState<{ templates: number; catalog: number }>({ templates: 0, catalog: 0 });
  const [approvingTemplateId, setApprovingTemplateId] = useState<string | null>(null);
  const [approvingCatalogId, setApprovingCatalogId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [previewTemplateCreator, setPreviewTemplateCreator] = useState<{ name?: string; email?: string } | null>(null);
  const [previewCatalog, setPreviewCatalog] = useState<any | null>(null);
  const [previewCatalogCreator, setPreviewCatalogCreator] = useState<{ name?: string; email?: string } | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null)
  const [admin, setAdmin] = useState<{ name?: string; email?: string; role?: string; lastLogin?: string } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Helpers (must come after state declarations)
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast(null), 2000)
  }

  const fetchCounts = async () => {
    try {
      const [tplRes, catRes] = await Promise.all([
        axiosInstance.get('http://localhost:5000/api/followups/templates/pending'),
        axiosInstance.get('http://localhost:5000/api/catalog/items/pending'),
      ])
      const templates = Array.isArray(tplRes.data?.data) ? tplRes.data.data : []
      const catalog = Array.isArray(catRes.data?.data) ? catRes.data.data : []
      setPendingCounts({ templates: templates.length, catalog: catalog.length })
    } catch {}
  }
  const { logout } = useAuthStore()

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await axiosInstance.get('/profile')
        setAdmin({
          name: data?.name,
          email: data?.email,
          role: data?.role,
          lastLogin: data?.lastLogin,
        })
      } catch (e) {
        // ignore; user may be unauthenticated here
      }
    }
    loadProfile()
  }, [])

  // Pending approvals: counts and lists
  useEffect(() => {
    let mounted = true
    const run = async () => { if (mounted) await fetchCounts() }
    run()
    const id = setInterval(run, 30000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  const loadPendingTemplates = async () => {
    try {
      const { data } = await axiosInstance.get('http://localhost:5000/api/followups/templates/pending')
      setPendingTemplates(Array.isArray(data?.data) ? data.data : [])
    } catch {}
  }

  const loadPendingCatalog = async () => {
    try {
      const { data } = await axiosInstance.get('http://localhost:5000/api/catalog/items/pending')
      setPendingCatalog(Array.isArray(data?.data) ? data.data : [])
    } catch {}
  }

  const openTemplatePanel = async () => {
    await loadPendingTemplates()
    setShowTemplateApprovals(true)
  }

  const openCatalogPanel = async () => {
    await loadPendingCatalog()
    setShowCatalogApprovals(true)
  }

  const openTemplatePreview = async (tpl: any) => {
    setPreviewTemplate(tpl)
    // If backend provided createdByUser, prefer it and skip fetch
    if (tpl?.createdByUser?.name || tpl?.createdByUser?.email) {
      setPreviewTemplateCreator({ name: tpl.createdByUser.name, email: tpl.createdByUser.email })
      return
    }
    setPreviewTemplateCreator(null)
    try {
      const creatorId = tpl.createdBy || tpl.userId
      if (creatorId) {
        const { data } = await axiosInstance.get(`/users/get/${creatorId}`)
        if (data?.user) {
          setPreviewTemplateCreator({ name: data.user.name, email: data.user.email })
        }
      }
    } catch {}
  }

  const openCatalogPreview = async (it: any) => {
    setPreviewCatalog(it)
    // If backend provided createdByUser, prefer it and skip fetch
    if (it?.createdByUser?.name || it?.createdByUser?.email) {
      setPreviewCatalogCreator({ name: it.createdByUser.name, email: it.createdByUser.email })
      return
    }
    setPreviewCatalogCreator(null)
    try {
      const creatorId = it.createdBy || it.userId
      if (creatorId) {
        const { data } = await axiosInstance.get(`/users/get/${creatorId}`)
        if (data?.user) {
          setPreviewCatalogCreator({ name: data.user.name, email: data.user.email })
        }
      }
    } catch {}
  }

  const approveTemplate = async (templateId: string) => {
    if (approvingTemplateId) return
    setApprovingTemplateId(templateId)
    try {
      await axiosInstance.patch(`http://localhost:5000/api/followups/templates/${templateId}/approve`)
      setPendingTemplates((prev) => prev.filter((t) => String(t._id) !== String(templateId)))
      setPendingCounts((c) => ({ ...c, templates: Math.max(0, c.templates - 1) }))
      showToast('Template approved', 'success')
      fetchCounts()
    } catch {}
    finally { setApprovingTemplateId(null) }
  }

  const approveCatalog = async (itemId: string) => {
    if (approvingCatalogId) return
    setApprovingCatalogId(itemId)
    try {
      await axiosInstance.patch(`http://localhost:5000/api/catalog/items/${itemId}/approve`)
      setPendingCatalog((prev) => prev.filter((t) => String(t._id) !== String(itemId)))
      setPendingCounts((c) => ({ ...c, catalog: Math.max(0, c.catalog - 1) }))
      showToast('Catalog item approved', 'success')
      fetchCounts()
    } catch {}
    finally { setApprovingCatalogId(null) }
  }

  const initials = (full?: string) => {
    if (!full) return 'AU'
    const parts = full.trim().split(/\s+/)
    const first = parts[0]?.[0] || ''
    const second = parts[1]?.[0] || ''
    return (first + second || first).toUpperCase()
  }

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/logout')
    } catch {}
    // Clear storages and cookies
    try {
      localStorage.clear();
      sessionStorage.clear();
      if (typeof document !== 'undefined') {
        document.cookie.split(';').forEach((c) => {
          const name = c.split('=')[0]?.trim();
          if (name) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
      }
    } catch {}
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const navLinks = [
    { name: 'Dashboard', icon: <FiGrid size={20} />, path: '/admin' },
    { name: 'User Management', icon: <FiUsers size={20} />, path: '/admin/User-Management' },
    { name: 'Customer Profiles', icon: <FiUser size={20} />, path: '/admin/Customer-Profile-Management' },
    { name: 'Customer Enquiry', icon: <FiMessageSquare size={20} />, path: '/admin/Customer-Enquiry-Mangement' },


    // { name: 'Template Upload', icon: <FiUpload size={20} />, path: '/admin/template-Upload' },
    { name: 'Access Control', icon: <FiLock size={20} />, path: '/admin/access-Control' },
    { name: 'Reports', icon: <FiActivity size={20} />, path: '/admin/reporting' },
    { name: 'Email', icon: <FiMail size={20} />, path: '/admin/gmaillayout' },
    { name: 'Follow-ups', icon: <FiMessageSquare size={20} />, path: '/admin/follow-ups' },
    // { name: 'Content', icon: <FiLayers size={20} />, path: '/admin/content' },
    // { name: 'Database', icon: <FiDatabase size={20} />, path: '/admin/database' },
    { name: 'Settings', icon: <FiSettings size={20} />, path: '/admin/settings' },
  ];

  const getPageTitle = () => {
    const currentLink = navLinks.find(link => link.path === location.pathname);
    return currentLink ? currentLink.name : 'Dashboard';
  };

  return (
    <>
      <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleMobileSidebar}
        ></div>
      )}

      {/* Toast */}
      {toast?.show && (
        <div className={`fixed bottom-4 right-4 z-50 rounded-md px-4 py-2 text-sm shadow-md ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.message}
        </div>
      )}

      {/* Template Approvals Panel */}
      {showTemplateApprovals && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowTemplateApprovals(false); fetchCounts() }}></div>
          <div className="relative ml-auto h-full w-full max-w-xl bg-white shadow-xl border-l border-gray-200 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-base font-semibold">Pending Templates</h3>
              <button onClick={() => { setShowTemplateApprovals(false); fetchCounts() }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {pendingTemplates.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-8">No pending templates</div>
              ) : (
                pendingTemplates.map((tpl: any) => (
                  <div key={tpl._id} className="rounded-lg border border-gray-200 p-3 flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">{tpl.name || tpl.subject || 'Untitled Template'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Created {new Date(tpl.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openTemplatePreview(tpl)} className="px-3 py-1.5 rounded-md border text-xs text-gray-700 hover:bg-gray-50">Preview</button>
                      <button onClick={() => approveTemplate(tpl._id)} disabled={approvingTemplateId === tpl._id} className={`px-3 py-1.5 rounded-md text-white text-xs ${approvingTemplateId === tpl._id ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{approvingTemplateId === tpl._id ? 'Approving…' : 'Approve'}</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Catalog Approvals Panel */}
      {showCatalogApprovals && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowCatalogApprovals(false); fetchCounts() }}></div>
          <div className="relative ml-auto h-full w-full max-w-xl bg-white shadow-xl border-l border-gray-200 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-base font-semibold">Pending Catalog Items</h3>
              <button onClick={() => { setShowCatalogApprovals(false); fetchCounts() }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {pendingCatalog.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-8">No pending catalog items</div>
              ) : (
                pendingCatalog.map((it: any) => (
                  <div key={it._id} className="rounded-lg border border-gray-200 p-3 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                        {it.images?.[0]?.url ? (
                          <img src={it.images[0].url} alt="thumb" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-gray-400 text-sm">📦</span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">{it.title || it.name || 'Untitled'}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Created {new Date(it.createdAt).toLocaleString()}</div>
                        {it.createdBy && (
                          <div className="text-[11px] text-gray-400">By: {String(it.createdBy).slice(-6)}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openCatalogPreview(it)} className="px-3 py-1.5 rounded-md border text-xs text-gray-700 hover:bg-gray-50">Preview</button>
                      <button onClick={() => approveCatalog(it._id)} disabled={approvingCatalogId === it._id} className={`px-3 py-1.5 rounded-md text-white text-xs ${approvingCatalogId === it._id ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>{approvingCatalogId === it._id ? 'Approving…' : 'Approve'}</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPreviewTemplate(null)}></div>
          <div className="relative z-10 w-full max-w-3xl rounded-lg bg-white shadow-xl border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Template Preview</h3>
              <button onClick={() => setPreviewTemplate(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-5 space-y-5 max-h-[72vh] overflow-y-auto text-sm">
              {/* Meta */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-gray-500">Name</div>
                <div className="col-span-2 text-gray-900 break-words">{previewTemplate.name || '—'}</div>
                <div className="text-gray-500">Subject</div>
                <div className="col-span-2 text-gray-900 break-words">{previewTemplate.subject || '—'}</div>
                <div className="text-gray-500">Type</div>
                <div className="col-span-2 text-gray-900">{previewTemplate.type || '—'}</div>
                <div className="text-gray-500">Created</div>
                <div className="col-span-2 text-gray-900">{previewTemplate.createdAt ? new Date(previewTemplate.createdAt).toLocaleString() : '—'}</div>
                <div className="text-gray-500">Updated</div>
                <div className="col-span-2 text-gray-900">{previewTemplate.updatedAt ? new Date(previewTemplate.updatedAt).toLocaleString() : '—'}</div>
                <div className="text-gray-500">Created By</div>
                <div className="col-span-2 text-gray-900">{previewTemplateCreator?.name || previewTemplate?.createdByUser?.name || '—'}{(previewTemplateCreator?.email || previewTemplate?.createdByUser?.email) ? ` (${previewTemplateCreator?.email || previewTemplate?.createdByUser?.email})` : ''}</div>
              </div>

              {/* Variables */}
              {Array.isArray(previewTemplate.variables) && previewTemplate.variables.length > 0 && (
                <div>
                  <div className="text-gray-500 mb-2">Variables</div>
                  <div className="flex flex-wrap gap-2">
                    {previewTemplate.variables.map((v: any, idx: number) => (
                      <span key={idx} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs border">{String(v)}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Catalog Linkage */}
              {(Array.isArray(previewTemplate.selectedCatalogItemIds) || previewTemplate.catalogLayout || typeof previewTemplate.showPrices === 'boolean') && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-gray-500">Selected Items</div>
                  <div className="col-span-2 text-gray-900">{Array.isArray(previewTemplate.selectedCatalogItemIds) ? previewTemplate.selectedCatalogItemIds.length : 0}</div>
                  <div className="text-gray-500">Layout</div>
                  <div className="col-span-2 text-gray-900">{previewTemplate.catalogLayout || '—'}</div>
                  <div className="text-gray-500">Show Prices</div>
                  <div className="col-span-2 text-gray-900">{typeof previewTemplate.showPrices === 'boolean' ? (previewTemplate.showPrices ? 'Yes' : 'No') : '—'}</div>
                </div>
              )}

              {/* Content */}
              {(previewTemplate.textContent || previewTemplate.htmlContent) && (
                <div className="space-y-4">
                  {previewTemplate.textContent && (
                    <div>
                      <div className="text-gray-500 mb-1">Text Content</div>
                      <div className="whitespace-pre-wrap text-gray-900 border rounded-md p-3 bg-gray-50">{previewTemplate.textContent}</div>
                    </div>
                  )}
                  {previewTemplate.htmlContent && (
                    <div>
                      <div className="text-gray-500 mb-1">HTML Content</div>
                      <div className="border rounded-md p-3 bg-white">
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: String(previewTemplate.htmlContent) }} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setPreviewTemplate(null)} className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm">Close</button>
              <button onClick={() => { approveTemplate(previewTemplate._id); }} disabled={approvingTemplateId === previewTemplate._id} className={`px-4 py-2 rounded-md text-white text-sm ${approvingTemplateId === previewTemplate._id ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{approvingTemplateId === previewTemplate._id ? 'Approving…' : 'Approve'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Preview Modal */}
      {previewCatalog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPreviewCatalog(null)}></div>
          <div className="relative z-10 w-full max-w-3xl rounded-lg bg-white shadow-xl border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Catalog Item Preview</h3>
              <button onClick={() => setPreviewCatalog(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-5 space-y-5 max-h-[72vh] overflow-y-auto text-sm">
              <div className="flex gap-4">
                <div className="w-28 h-28 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                  {previewCatalog.images?.[0]?.url ? (
                    <img src={previewCatalog.images[0].url} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400">📦</span>
                  )}
                </div>
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div className="text-gray-500">Title</div>
                  <div className="col-span-2 text-gray-900 break-words">{previewCatalog.title || previewCatalog.name || '—'}</div>
                  <div className="text-gray-500">Created</div>
                  <div className="col-span-2 text-gray-900">{previewCatalog.createdAt ? new Date(previewCatalog.createdAt).toLocaleString() : '—'}</div>
                  <div className="text-gray-500">Updated</div>
                  <div className="col-span-2 text-gray-900">{previewCatalog.updatedAt ? new Date(previewCatalog.updatedAt).toLocaleString() : '—'}</div>
                  <div className="text-gray-500">Created By</div>
                  <div className="col-span-2 text-gray-900">{previewCatalogCreator?.name || previewCatalog?.createdByUser?.name || '—'}{(previewCatalogCreator?.email || previewCatalog?.createdByUser?.email) ? ` (${previewCatalogCreator?.email || previewCatalog?.createdByUser?.email})` : ''}</div>
                  <div className="text-gray-500">Status</div>
                  <div className="col-span-2"><span className={`px-2 py-0.5 rounded-full text-xs border ${previewCatalog.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{previewCatalog.status || '—'}</span></div>
                  {previewCatalog.price && (
                    <>
                      <div className="text-gray-500">Price</div>
                      <div className="col-span-2 text-gray-900">{String(previewCatalog.price)}</div>
                    </>
                  )}
                </div>
              </div>
              {Array.isArray(previewCatalog.tags) && previewCatalog.tags.length > 0 && (
                <div>
                  <div className="text-gray-500 mb-1">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {previewCatalog.tags.map((t: any, idx: number) => (
                      <span key={idx} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs border">{String(t)}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setPreviewCatalog(null)} className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm">Close</button>
              <button onClick={() => { approveCatalog(previewCatalog._id); }} disabled={approvingCatalogId === previewCatalog._id} className={`px-4 py-2 rounded-md text-white text-sm ${approvingCatalogId === previewCatalog._id ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>{approvingCatalogId === previewCatalog._id ? 'Approving…' : 'Approve'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-30 h-screen bg-white shadow-lg transition-all duration-300 ease-in-out lg:relative ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${mobileSidebarOpen ? 'left-0' : '-left-full lg:left-0'}`}
      >
        <div className="flex h-full flex-col border-r border-gray-200">
          {/* Sidebar header */}
          <div className="flex h-16 items-center justify-between px-4">
            {sidebarOpen ? (
              <h1 className="text-xl font-bold text-indigo-600">AdminPro</h1>
            ) : (
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">AP</div>
            )}
            <button
              onClick={toggleSidebar}
              className="hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:block"
              aria-label="Toggle sidebar"
            >
              <FiChevronLeft size={20} className={`transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto">
            <nav className="px-2 py-4">
              <ul className="space-y-1">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className={`group flex items-center rounded-lg p-3 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
                        location.pathname === link.path ? 'bg-indigo-50 text-indigo-600' : ''
                      }`}
                    >
                      <span className="flex items-center justify-center">
                        {link.icon}
                      </span>
                      {sidebarOpen && (
                        <span className="ml-3 font-medium">{link.name}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Sidebar footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">{initials(admin?.name)}</div>
              {sidebarOpen && (
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium text-gray-700 truncate">{admin?.name || '—'}</p>
                  <p className="text-xs text-gray-500 truncate">{admin?.email || '—'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4">
          <div className="flex items-center">
            <button
              onClick={toggleMobileSidebar}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
              aria-label="Open menu"
            >
              <FiMenu size={20} />
            </button>
            <h2 className="ml-4 text-lg font-semibold text-gray-800">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            {/* Pending badges */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={openTemplatePanel}
                className="relative rounded-full px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              >
                Templates
                {pendingCounts.templates > 0 && (
                  <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-600 px-1 text-white">
                    {pendingCounts.templates}
                  </span>
                )}
              </button>
              <button
                onClick={openCatalogPanel}
                className="relative rounded-full px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              >
                Catalog
                {pendingCounts.catalog > 0 && (
                  <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1 text-white">
                    {pendingCounts.catalog}
                  </span>
                )}
              </button>
            </div>
            <div className="relative">
              <button 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">{initials(admin?.name)}</div>
                <span className="hidden text-sm font-medium text-gray-700 md:block">
                  {admin?.name || '—'}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <button
                    onClick={() => { setProfileOpen(true); setUserDropdownOpen(false) }}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <FiUser className="mr-2" size={16} />
                      Profile
                    </div>
                  </button>
                  {/* Settings option removed per requirement */}
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <FiLogOut className="mr-2" size={16} />
                      Sign out
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>

      {/* Profile Modal */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={()=> setProfileOpen(false)}></div>
          <div className="relative z-10 w-96 rounded-lg bg-white shadow-xl border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Profile</h3>
              <button onClick={()=> setProfileOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">{initials(admin?.name)}</div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{admin?.name || '—'}</div>
                  <div className="text-sm text-gray-500">{admin?.email || '—'}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="col-span-1 text-gray-500">Role</div>
                <div className="col-span-2 text-gray-800">{admin?.role || 'admin'}</div>
                <div className="col-span-1 text-gray-500">Last Login</div>
                <div className="col-span-2 text-gray-800">{admin?.lastLogin ? new Date(admin.lastLogin).toLocaleString() : '—'}</div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button onClick={()=> setProfileOpen(false)} className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminLayout;
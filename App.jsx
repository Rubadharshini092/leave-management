import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users, Search, Bell, Plus,
  CheckCircle2, Clock3, XCircle, ArrowUpRight, ChevronDown, Filter,
  Menu, X, CalendarCheck, BriefcaseBusiness, TrendingUp, Trash2, RefreshCw
} from 'lucide-react';

const API = 'http://localhost:5000/api';
const blankForm = {
  employeeName: '', employeeId: '', department: '', leaveType: 'Casual Leave',
  startDate: '', endDate: '', reason: ''
};

function dateLabel(value) {
  if (!value) return '—';
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'NA';
}
function StatusPill({ status }) {
  return <span className={`status status-${status.toLowerCase()}`}><span />{status}</span>;
}

export default function App() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [busy, setBusy] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');

  async function loadLeaves() {
    setLoading(true);
    try {
      const response = await fetch(`${API}/leaves`);
      if (!response.ok) throw new Error('Unable to load requests');
      setLeaves(await response.json());
    } catch {
      setNotice('Cannot connect to the backend. Start the project with npm run dev from the main folder.');
    } finally { setLoading(false); }
  }
  useEffect(() => { loadLeaves(); }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const stats = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter(x => x.status === 'Pending').length,
    approved: leaves.filter(x => x.status === 'Approved').length,
    rejected: leaves.filter(x => x.status === 'Rejected').length
  }), [leaves]);

  const visibleLeaves = useMemo(() => leaves.filter(leave => {
    const matchesFilter = filter === 'All' || leave.status === filter;
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || [leave.employeeName, leave.employeeId, leave.department, leave.leaveType, leave.status]
      .some(value => String(value || '').toLowerCase().includes(needle));
    return matchesFilter && matchesQuery;
  }), [leaves, filter, query]);

  async function submitLeave(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch(`${API}/leaves`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not submit leave.');
      setLeaves(current => [data, ...current]);
      setForm(blankForm);
      setShowForm(false);
      setNotice('Leave request submitted successfully.');
    } catch (error) { setNotice(error.message || 'Something went wrong.'); }
    finally { setBusy(false); }
  }

  async function changeStatus(leave, status) {
    try {
      const response = await fetch(`${API}/leaves/${leave._id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not update request.');
      setLeaves(current => current.map(item => item._id === leave._id ? data : item));
      setNotice(`Request ${status.toLowerCase()}.`);
    } catch (error) { setNotice(error.message); }
  }

  async function deleteLeave(leave) {
    if (!window.confirm(`Delete the leave request from ${leave.employeeName}?`)) return;
    try {
      const response = await fetch(`${API}/leaves/${leave._id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not delete request.');
      setLeaves(current => current.filter(item => item._id !== leave._id));
      setNotice('Leave request deleted.');
    } catch (error) { setNotice(error.message); }
  }

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Leave Requests', icon: ClipboardList },
    { label: 'Employees', icon: Users }
  ];

  function selectNav(label) {
    setActiveNav(label);
    setMobileMenu(false);
    if (label === 'Leave Requests') document.getElementById('requests')?.scrollIntoView({ behavior: 'smooth' });
    if (label === 'Dashboard') window.scrollTo({ top: 0, behavior: 'smooth' });
    if (label === 'Employees') setNotice('Employee details are shown in the leave request table.');
  }

  return (
    <div className="app-shell">
      {mobileMenu && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)} />}
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><CalendarCheck size={23} strokeWidth={2.4} /></div>
          <div><strong>LeaveFlow</strong><span>WORKPLACE PORTAL</span></div>
          <button className="close-menu" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={20}/></button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activeNav === label ? 'nav-active' : ''}`} onClick={() => selectNav(label)}>
              <Icon size={19} /><span>{label}</span>{label === 'Leave Requests' && stats.pending > 0 && <span className="nav-count">{stats.pending}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><BriefcaseBusiness size={18}/></div>
            <strong>Need a hand?</strong>
            <p>Keep your team organized, one day at a time.</p>
            <span className="help-link">LeaveFlow workspace <ArrowUpRight size={14}/></span>
          </div>
          <div className="profile">
            <div className="profile-avatar">AD</div>
            <div className="profile-info"><strong>Admin User</strong><span>Administrator</span></div>
            <ChevronDown size={17} className="profile-chevron"/>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="menu-toggle" aria-label="Open menu" onClick={() => setMobileMenu(true)}><Menu size={22}/></button>
          <div className="breadcrumb">Workspace <span>/</span> <strong>{activeNav}</strong></div>
          <div className="top-actions">
            <span className="today-label"><CalendarDays size={16}/>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            <button className="icon-button notification" aria-label="Notifications" onClick={() => setNotice(`${stats.pending} leave request(s) are waiting for review.`)}><Bell size={19}/>{stats.pending > 0 && <i/>}</button>
            <div className="top-avatar">AD</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot"/> OVERVIEW</div>
              <h1>Good day, Admin <span className="wave">✦</span></h1>
              <p className="subtitle">Here’s what’s happening with your team today.</p>
            </div>
            <button className="primary-button" onClick={() => setShowForm(true)}><Plus size={18}/> Apply for leave</button>
          </section>

          {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={16}/></button></div>}

          <section className="stats-grid" aria-label="Leave summary">
            <StatCard title="Total Requests" value={stats.total} note="All leave applications" icon={ClipboardList} tone="violet" />
            <StatCard title="Pending Review" value={stats.pending} note="Awaiting your decision" icon={Clock3} tone="amber" />
            <StatCard title="Approved Leaves" value={stats.approved} note="Ready to take leave" icon={CheckCircle2} tone="green" />
            <StatCard title="Declined Requests" value={stats.rejected} note="Not approved" icon={XCircle} tone="rose" />
          </section>

          <section className="insight-banner">
            <div className="insight-icon"><TrendingUp size={21}/></div>
            <div className="insight-copy"><strong>Your team at a glance</strong><span>{stats.pending ? `${stats.pending} request${stats.pending === 1 ? '' : 's'} need${stats.pending === 1 ? 's' : ''} your attention.` : 'You’re all caught up — no pending requests to review.'}</span></div>
            <div className="banner-mini-stats"><div><span>Approval rate</span><strong>{(stats.approved + stats.rejected) ? Math.round(stats.approved / (stats.approved + stats.rejected) * 100) : 0}%</strong></div><div className="banner-divider"/><div><span>Pending</span><strong>{stats.pending.toString().padStart(2, '0')}</strong></div></div>
          </section>

          <section className="requests-panel" id="requests">
            <div className="panel-heading">
              <div><h2>Leave requests</h2><p>Manage and review your team's leave applications.</p></div>
              <button className="refresh-button" onClick={loadLeaves} title="Refresh requests"><RefreshCw size={16}/><span>Refresh</span></button>
            </div>
            <div className="table-toolbar">
              <label className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search employee, ID or department..." /></label>
              <label className="filter-box"><Filter size={16}/><select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter by status"><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option></select><ChevronDown size={15}/></label>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>EMPLOYEE</th><th>LEAVE TYPE</th><th>DURATION</th><th>REASON</th><th>STATUS</th><th className="action-heading">ACTIONS</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan="6" className="empty-state">Loading leave requests…</td></tr> :
                  visibleLeaves.length === 0 ? <tr><td colSpan="6" className="empty-state"><div className="empty-icon"><ClipboardList size={22}/></div><strong>No leave requests found</strong><span>Try changing your search or add a new request.</span></td></tr> :
                  visibleLeaves.map(leave => (
                    <tr key={leave._id}>
                      <td><div className="employee-cell"><div className={`employee-avatar avatar-${(leave.employeeName?.charCodeAt(0) || 65) % 5}`}>{initials(leave.employeeName)}</div><div className="employee-meta"><strong>{leave.employeeName}</strong><span>{leave.employeeId} · {leave.department}</span></div></div></td>
                      <td><span className="leave-type">{leave.leaveType}</span></td>
                      <td><div className="date-range"><strong>{dateLabel(leave.startDate)}</strong><span>to {dateLabel(leave.endDate)}</span></div></td>
                      <td><span className="reason-text" title={leave.reason}>{leave.reason}</span></td>
                      <td><StatusPill status={leave.status}/></td>
                      <td><div className="row-actions">
                        {leave.status === 'Pending' ? <>
                          <button className="action-approve" title="Approve" aria-label={`Approve ${leave.employeeName}`} onClick={() => changeStatus(leave, 'Approved')}><CheckCircle2 size={17}/></button>
                          <button className="action-reject" title="Reject" aria-label={`Reject ${leave.employeeName}`} onClick={() => changeStatus(leave, 'Rejected')}><XCircle size={17}/></button>
                        </> : <span className="reviewed-label">Reviewed</span>}
                        <button className="action-delete" title="Delete request" aria-label={`Delete ${leave.employeeName}`} onClick={() => deleteLeave(leave)}><Trash2 size={16}/></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>Showing <strong>{visibleLeaves.length}</strong> of <strong>{leaves.length}</strong> requests</span><span className="live-indicator"><i/> Live workspace</span></div>
          </section>
          <footer className="page-footer"><span>© {new Date().getFullYear()} LeaveFlow</span><span>Simple leave management for better teams.</span></footer>
        </div>
      </main>

      {showForm && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-header"><div><span className="modal-kicker">NEW APPLICATION</span><h2 id="modal-title">Apply for leave</h2><p>Fill in the details to submit a leave request.</p></div><button className="modal-close" onClick={() => setShowForm(false)} aria-label="Close"><X size={20}/></button></div>
          <form onSubmit={submitLeave}>
            <div className="form-grid">
              <label>Employee name<input required maxLength="100" value={form.employeeName} onChange={e => setForm({...form, employeeName: e.target.value})} placeholder="e.g. Rubadharshini S"/></label>
              <label>Employee ID<input required maxLength="30" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} placeholder="e.g. EMP003"/></label>
              <label>Department<input required maxLength="100" value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. Information Technology"/></label>
              <label>Leave type<select value={form.leaveType} onChange={e => setForm({...form, leaveType: e.target.value})}><option>Casual Leave</option><option>Sick Leave</option><option>Earned Leave</option><option>Other</option></select></label>
              <label>Start date<input required type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})}/></label>
              <label>End date<input required type="date" min={form.startDate || undefined} value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})}/></label>
              <label className="full-width">Reason for leave<textarea required maxLength="1000" rows="3" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="Briefly explain your reason…"/></label>
            </div>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="primary-button" disabled={busy}>{busy ? 'Submitting…' : <><Plus size={17}/> Submit request</>}</button></div>
          </form>
        </section>
      </div>}
    </div>
  );
}

function StatCard({ title, value, note, icon: Icon, tone }) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={20}/></div><span className="stat-title">{title}</span><div className="stat-value-row"><strong>{value.toString().padStart(2, '0')}</strong><span className={`stat-trend ${tone}`}><ArrowUpRight size={14}/></span></div><span className="stat-note">{note}</span></article>;
}

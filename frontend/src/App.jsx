import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users, Settings, Search,
  Bell, Plus, Clock3, CheckCircle2, XCircle, CalendarCheck, ArrowUpRight,
  ChevronDown, Menu, X, Filter, Trash2, BriefcaseBusiness, HeartPulse, Sun
} from 'lucide-react';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/leaves`;
const seedLeaves = [
  { _id: 'demo-1', employeeName: 'Ananya Sharma', employeeId: 'EMP-1024', department: 'Design', leaveType: 'Casual Leave', startDate: '2026-10-29', endDate: '2026-10-30', days: 2, reason: 'Family function', status: 'Pending', createdAt: '2026-10-26' },
  { _id: 'demo-2', employeeName: 'Rahul Verma', employeeId: 'EMP-1018', department: 'Engineering', leaveType: 'Sick Leave', startDate: '2026-10-24', endDate: '2026-10-24', days: 1, reason: 'Not feeling well', status: 'Approved', createdAt: '2026-10-23' },
  { _id: 'demo-3', employeeName: 'Priya Nair', employeeId: 'EMP-1031', department: 'Marketing', leaveType: 'Earned Leave', startDate: '2026-11-02', endDate: '2026-11-04', days: 3, reason: 'Personal travel', status: 'Pending', createdAt: '2026-10-25' },
  { _id: 'demo-4', employeeName: 'Arjun Patel', employeeId: 'EMP-1009', department: 'Engineering', leaveType: 'Casual Leave', startDate: '2026-10-20', endDate: '2026-10-20', days: 1, reason: 'Personal work', status: 'Rejected', createdAt: '2026-10-18' },
  { _id: 'demo-5', employeeName: 'Meera Iyer', employeeId: 'EMP-1027', department: 'Human Resources', leaveType: 'Sick Leave', startDate: '2026-10-30', endDate: '2026-10-31', days: 2, reason: 'Medical rest', status: 'Approved', createdAt: '2026-10-27' }
];
const emptyForm = { employeeName: '', employeeId: '', department: 'Engineering', leaveType: 'Casual Leave', startDate: '', endDate: '', reason: '' };
const dateFmt = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function Status({ value }) {
  return <span className={`status status-${value.toLowerCase()}`}><i />{value}</span>;
}
function App() {
  const [leaves, setLeaves] = useState([]);
  const [connected, setConnected] = useState(false);
  const [active, setActive] = useState('Dashboard');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All requests');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadLeaves = async () => {
    try {
      const { data } = await axios.get(API, { timeout: 2500 });
      setLeaves(data);
      setConnected(true);
    } catch {
      setConnected(false);
      setLeaves((current) => current.length ? current : seedLeaves);
    }
  };
  useEffect(() => { loadLeaves(); }, []);

  const filtered = useMemo(() => leaves.filter((leave) => {
    const matchesSearch = [leave.employeeName, leave.employeeId, leave.department, leave.leaveType].join(' ').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All requests' || leave.status === statusFilter;
    const matchesPage = active !== 'My Requests' || leave.employeeId === 'EMP-1024';
    return matchesSearch && matchesStatus && matchesPage;
  }), [leaves, search, statusFilter, active]);

  const stats = [
    { label: 'Total requests', value: leaves.length, note: 'All leave applications', icon: ClipboardList, tone: 'violet' },
    { label: 'Pending review', value: leaves.filter(x => x.status === 'Pending').length, note: 'Awaiting a decision', icon: Clock3, tone: 'amber' },
    { label: 'Approved', value: leaves.filter(x => x.status === 'Approved').length, note: 'Ready to take leave', icon: CheckCircle2, tone: 'green' },
    { label: 'Rejected', value: leaves.filter(x => x.status === 'Rejected').length, note: 'Requests not approved', icon: XCircle, tone: 'rose' }
  ];

  const submitLeave = async (event) => {
    event.preventDefault();
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setNotice('End date must be on or after the start date.');
      return;
    }
    const start = new Date(`${form.startDate}T00:00:00`);
    const end = new Date(`${form.endDate}T00:00:00`);
    const days = Math.round((end - start) / 86400000) + 1;
    const localItem = { ...form, _id: `local-${Date.now()}`, days, status: 'Pending', createdAt: new Date().toISOString() };
    try {
      const { data } = await axios.post(API, form, { timeout: 3000 });
      setLeaves((old) => [data, ...old.filter(x => !String(x._id).startsWith('demo-'))]);
      setConnected(true);
      setNotice('Leave request submitted successfully.');
    } catch {
      setLeaves((old) => [localItem, ...old]);
      setNotice('Saved in this page only. Start the backend and MongoDB to save permanently.');
    }
    setForm(emptyForm);
    setShowForm(false);
  };

  const updateStatus = async (leave, status) => {
    if (String(leave._id).startsWith('demo-') || String(leave._id).startsWith('local-')) {
      setLeaves(old => old.map(x => x._id === leave._id ? { ...x, status } : x));
      setNotice('Demo request updated in this page only.');
      return;
    }
    try {
      const { data } = await axios.patch(`${API}/${leave._id}/status`, { status });
      setLeaves(old => old.map(x => x._id === data._id ? data : x));
      setNotice(`Request ${status.toLowerCase()}.`);
    } catch { setNotice('Could not update request. Check the backend connection.'); }
  };

  const deleteLeave = async (leave) => {
    if (!window.confirm(`Delete ${leave.employeeName}'s leave request?`)) return;
    if (!String(leave._id).startsWith('demo-') && !String(leave._id).startsWith('local-')) {
      try { await axios.delete(`${API}/${leave._id}`); }
      catch { setNotice('Could not delete request. Check the backend connection.'); return; }
    }
    setLeaves(old => old.filter(x => x._id !== leave._id));
    setNotice('Leave request removed.');
  };

  const nav = [
    { title: 'WORKSPACE', items: [{ name: 'Dashboard', icon: LayoutDashboard }, { name: 'Leave Requests', icon: ClipboardList }, { name: 'My Requests', icon: CalendarDays }] },
    { title: 'MANAGEMENT', items: [{ name: 'Employees', icon: Users }, { name: 'Leave Calendar', icon: CalendarCheck }] }
  ];

  return <div className="app-shell">
    {sidebarOpen && <button className="mobile-shade" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><CalendarCheck size={22} /></div><div><strong>leaveflow</strong><span>PEOPLE OPERATIONS</span></div><button className="mobile-close" onClick={() => setSidebarOpen(false)}><X size={18}/></button></div>
      <div className="workspace-switch"><div className="workspace-avatar">AC</div><div><strong>Acme Corporation</strong><span>Workspace</span></div><ChevronDown size={16}/></div>
      {nav.map(group => <div className="nav-group" key={group.title}><p>{group.title}</p>{group.items.map(item => <button key={item.name} className={`nav-item ${active === item.name ? 'active' : ''}`} onClick={() => {setActive(item.name); setSidebarOpen(false);}}><item.icon size={18}/><span>{item.name}</span>{item.name === 'Leave Requests' && <b>{leaves.filter(x => x.status === 'Pending').length}</b>}</button>)}</div>)}
      <div className="sidebar-bottom"><button className="nav-item" onClick={() => setNotice('Settings are not included in this starter project.')}><Settings size={18}/><span>Settings</span></button><div className="help-card"><div className="help-icon">✦</div><strong>Need a hand?</strong><p>Visit the help center for tips and answers.</p><button onClick={() => setNotice('Help center: contact your HR administrator.')}>Visit help center <ArrowUpRight size={14}/></button></div><div className="profile"><div className="profile-avatar">SJ</div><div><strong>Sarah Johnson</strong><span>HR Administrator</span></div><ChevronDown size={16}/></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><button className="menu-toggle" onClick={() => setSidebarOpen(true)}><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{active}</strong></div><div className="top-actions"><div className={`connection ${connected ? 'is-connected' : ''}`}><span />{connected ? 'Database connected' : 'Demo mode'}</div><button className="icon-button notification" aria-label="Notifications" onClick={() => setNotice('You are all caught up!')}><Bell size={19}/><i/></button><div className="top-divider"/><div className="top-user"><div className="profile-avatar">SJ</div><ChevronDown size={15}/></div></div></header>
      <div className="page-content">
        <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> PEOPLE OPERATIONS OVERVIEW</div><h1>{active === 'Dashboard' ? 'Good morning, Sarah' : active}</h1><p>{active === 'Dashboard' ? 'Here’s what’s happening with your team today.' : 'Manage and review your team leave information.'}</p></div><button className="primary-button" onClick={() => setShowForm(true)}><Plus size={18}/> Apply for leave</button></section>
        {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice('')}><X size={16}/></button></div>}
        <section className="stats-grid">{stats.map((stat) => <div className="stat-card" key={stat.label}><div className="stat-top"><span>{stat.label}</span><div className={`stat-icon ${stat.tone}`}><stat.icon size={19}/></div></div><div className="stat-number">{stat.value.toString().padStart(2,'0')}</div><div className="stat-note"><span className={`mini-dot ${stat.tone}`}/>{stat.note}</div></div>)}</section>
        <section className="content-grid">
          <div className="panel requests-panel"><div className="panel-heading"><div><h2>{active === 'My Requests' ? 'My leave requests' : 'Recent leave requests'}</h2><p>Keep track of requests and approvals.</p></div><button className="text-button" onClick={() => {setActive('Leave Requests'); setStatusFilter('All requests');}}>View all <ArrowUpRight size={15}/></button></div>
            <div className="table-toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee or department..."/></div><div className="filter-box"><Filter size={15}/><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All requests</option><option>Pending</option><option>Approved</option><option>Rejected</option></select></div></div>
            <div className="table-wrap"><table><thead><tr><th>EMPLOYEE</th><th>LEAVE TYPE</th><th>DATES</th><th>DAYS</th><th>STATUS</th><th></th></tr></thead><tbody>{filtered.slice(0, 7).map(leave => <tr key={leave._id}><td><div className="employee-cell"><div className={`employee-avatar avatar-${leave.employeeName.charCodeAt(0)%5}`}>{leave.employeeName.split(' ').map(x => x[0]).slice(0,2).join('')}</div><div><strong>{leave.employeeName}</strong><span>{leave.employeeId} · {leave.department}</span></div></div></td><td><span className="leave-type">{leave.leaveType === 'Sick Leave' ? <HeartPulse size={15}/> : leave.leaveType === 'Earned Leave' ? <BriefcaseBusiness size={15}/> : <Sun size={15}/>} {leave.leaveType}</span></td><td><div className="date-cell">{dateFmt(leave.startDate)}<span>to {dateFmt(leave.endDate)}</span></div></td><td><strong className="days-number">{leave.days}</strong><span className="days-label"> {leave.days === 1 ? 'day' : 'days'}</span></td><td><Status value={leave.status}/></td><td><div className="row-actions">{leave.status === 'Pending' && <><button title="Approve" className="action-approve" onClick={() => updateStatus(leave,'Approved')}><CheckCircle2 size={16}/></button><button title="Reject" className="action-reject" onClick={() => updateStatus(leave,'Rejected')}><XCircle size={16}/></button></>}<button title="Delete" className="action-delete" onClick={() => deleteLeave(leave)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty-state"><ClipboardList size={28}/><strong>No requests found</strong><span>Try changing the search or filter.</span></div>}</div>
            <div className="table-footer"><span>Showing <strong>{Math.min(filtered.length, 7)}</strong> of <strong>{filtered.length}</strong> requests</span><div><button disabled>Previous</button><button disabled>Next</button></div></div>
          </div>
          <div className="right-column">
            <div className="panel quick-panel"><div className="panel-heading"><div><h2>Quick actions</h2><p>Shortcuts to common tasks.</p></div><div className="dots">•••</div></div><button className="quick-action" onClick={() => setShowForm(true)}><div className="quick-icon purple"><Plus size={19}/></div><div><strong>Apply for leave</strong><span>Submit a new leave request</span></div><ArrowUpRight size={16}/></button><button className="quick-action" onClick={() => {setActive('Leave Requests'); setStatusFilter('Pending');}}><div className="quick-icon orange"><Clock3 size={19}/></div><div><strong>Review pending</strong><span>{leaves.filter(x=>x.status==='Pending').length} requests need attention</span></div><ArrowUpRight size={16}/></button><button className="quick-action" onClick={() => {setActive('Leave Calendar'); setNotice('Calendar view is planned for a future version.');}}><div className="quick-icon blue"><CalendarDays size={19}/></div><div><strong>Leave calendar</strong><span>See upcoming time off</span></div><ArrowUpRight size={16}/></button></div>
            <div className="panel balance-panel"><div className="balance-header"><div><span className="balance-label">YOUR LEAVE BALANCE</span><h2>Time to recharge</h2></div><div className="balance-symbol"><Sun size={20}/></div></div><div className="balance-total"><strong>18</strong><span>days available</span></div><div className="balance-bar"><span/></div><div className="balance-legend"><span><i className="legend-used"/> 7 days used</span><span><i className="legend-left"/> 18 days left</span></div><div className="balance-divider"/><div className="balance-bottom"><div className="calendar-mini"><CalendarDays size={18}/></div><div><strong>Plan your next break</strong><span>You deserve a little time off.</span></div><button onClick={() => setShowForm(true)} aria-label="Apply"><ArrowUpRight size={17}/></button></div></div>
          </div>
        </section>
        <footer className="page-footer"><span>© 2026 LeaveFlow. Built for better work-life balance.</span><span>Made with care <span className="heart">♥</span></span></footer>
      </div>
    </main>

    {showForm && <div className="modal-backdrop" onClick={() => setShowForm(false)}><section className="modal" onClick={e => e.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">NEW APPLICATION</span><h2>Apply for leave</h2><p>Fill in the details below to submit your request.</p></div><button className="icon-button" onClick={() => setShowForm(false)}><X size={20}/></button></div><form onSubmit={submitLeave} className="leave-form"><div className="form-row"><label>Employee name *<input required value={form.employeeName} onChange={e=>setForm({...form,employeeName:e.target.value})} placeholder="e.g. Sarah Johnson"/></label><label>Employee ID *<input required value={form.employeeId} onChange={e=>setForm({...form,employeeId:e.target.value})} placeholder="e.g. EMP-1001"/></label></div><div className="form-row"><label>Department *<select value={form.department} onChange={e=>setForm({...form,department:e.target.value})}><option>Engineering</option><option>Design</option><option>Marketing</option><option>Human Resources</option><option>Finance</option><option>Operations</option></select></label><label>Leave type *<select value={form.leaveType} onChange={e=>setForm({...form,leaveType:e.target.value})}><option>Casual Leave</option><option>Sick Leave</option><option>Earned Leave</option><option>Other</option></select></label></div><div className="form-row"><label>Start date *<input type="date" required value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></label><label>End date *<input type="date" required min={form.startDate || undefined} value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/></label></div><label>Reason for leave *<textarea required rows="3" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} placeholder="Briefly explain the reason for your leave..."/></label><div className="form-hint">Your request will be marked as Pending until reviewed.</div><div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setShowForm(false)}>Cancel</button><button type="submit" className="primary-button"><Plus size={17}/> Submit request</button></div></form></section></div>}
  </div>;
}

export default App;
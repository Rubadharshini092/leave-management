import Leave from '../models/Leave.js';
export async function getLeaves(_req, res) {
  try { res.json(await Leave.find().sort({ createdAt: -1 })); }
  catch { res.status(500).json({ message: 'Could not fetch leave requests.' }); }
}
export async function createLeave(req, res) {
  try {
    const { employeeName, employeeId, department, leaveType, startDate, endDate, reason } = req.body;
    if (!employeeName || !employeeId || !department || !leaveType || !startDate || !endDate || !reason) return res.status(400).json({ message: 'Please complete all required fields.' });
    const start = new Date(startDate), end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return res.status(400).json({ message: 'End date must be on or after the start date.' });
    const days = Math.floor((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000) + 1;
    res.status(201).json(await Leave.create({ employeeName, employeeId, department, leaveType, startDate: start, endDate: end, days, reason }));
  } catch { res.status(500).json({ message: 'Could not create leave request.' }); }
}
export async function updateLeaveStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected', 'Pending'].includes(status)) return res.status(400).json({ message: 'Status must be Approved, Rejected, or Pending.' });
    const leave = await Leave.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!leave) return res.status(404).json({ message: 'Leave request not found.' });
    res.json(leave);
  } catch { res.status(400).json({ message: 'Invalid leave request ID.' }); }
}
export async function deleteLeave(req, res) {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave request not found.' });
    res.json({ message: 'Leave request deleted.' });
  } catch { res.status(400).json({ message: 'Invalid leave request ID.' }); }
}

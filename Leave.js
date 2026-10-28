import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  employeeName: { type: String, required: true, trim: true, maxlength: 100 },
  employeeId: { type: String, required: true, trim: true, maxlength: 30 },
  department: { type: String, required: true, trim: true, maxlength: 100 },
  leaveType: { type: String, enum: ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Other'], required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  reason: { type: String, required: true, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

export default mongoose.model('Leave', leaveSchema);

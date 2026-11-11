import mongoose from 'mongoose';
const leaveSchema = new mongoose.Schema({
  employeeName: { type: String, required: true, trim: true },
  employeeId: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  leaveType: { type: String, enum: ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Other'], required: true },
  startDate: { type: Date, required: true }, endDate: { type: Date, required: true },
  days: { type: Number, required: true, min: 1 }, reason: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { timestamps: true });
export default mongoose.models.Leave || mongoose.model('Leave', leaveSchema);

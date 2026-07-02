import mongoose from 'mongoose';

const onCallSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  note: { type: String, default: '' },
}, { timestamps: true });

onCallSchema.index({ startsAt: 1, endsAt: 1 });

onCallSchema.statics.getCurrentOnCall = async function () {
  const now = new Date();
  return this.findOne({ startsAt: { $lte: now }, endsAt: { $gte: now } })
    .populate('userId', 'name email role')
    .lean();
};

export const OnCall = mongoose.model('OnCall', onCallSchema);

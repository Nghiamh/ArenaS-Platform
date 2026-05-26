import cron from 'node-cron';
import { CourtSlotModel } from '../models/courtSlotModel.js';

export function startSlotLockTimeoutCron() {
  // Chạy mỗi phút 1 lần
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      // Tính thời điểm 10 phút trước
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

      // Tìm tất cả CourtSlot có slot đang khóa và đã quá hạn 10 phút
      const courtSlots = await CourtSlotModel.find({
        'slots.status': 'locked',
        'slots.locked_at': { $lte: tenMinutesAgo }
      });

      if (courtSlots.length === 0) return;

      for (const cs of courtSlots) {
        let changed = false;
        for (const slot of cs.slots) {
          if (slot.status === 'locked' && slot.locked_at && slot.locked_at <= tenMinutesAgo) {
            slot.status = 'available';
            slot.locked_by = undefined;
            slot.locked_at = undefined;
            changed = true;
          }
        }
        if (changed) {
          await cs.save();
        }
      }
      
      console.log(`[Cron] Đã tự động mở khóa các slot quá hạn (10 phút) của ${courtSlots.length} sân`);
    } catch (error) {
      console.error('[Cron] Lỗi khi chạy cron mở khóa slot:', error);
    }
  });
}

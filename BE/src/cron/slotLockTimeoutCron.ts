import cron from 'node-cron';
import { CourtSlotModel } from '../models/courtSlotModel.js';

export function startSlotLockTimeoutCron() {
  // Chạy mỗi 3 phút để giảm tải MongoDB (không cần chạy mỗi phút)
  cron.schedule('*/3 * * * *', async () => {
    try {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

      // Dùng $elemMatch để chỉ match document có ít nhất 1 slot thỏa điều kiện
      // (tránh match toàn bộ collection)
      const courtSlots = await CourtSlotModel.find({
        slots: {
          $elemMatch: {
            status: 'locked',
            locked_at: { $lte: tenMinutesAgo },
          },
        },
      }).select('slots'); // Chỉ lấy field slots, không cần các field khác

      if (courtSlots.length === 0) return;

      let totalUnlocked = 0;
      const savePromises: Promise<any>[] = [];

      for (const cs of courtSlots) {
        let changed = false;
        for (const slot of cs.slots) {
          if (slot.status === 'locked' && slot.locked_at && slot.locked_at <= tenMinutesAgo) {
            slot.status = 'available';
            slot.locked_by = undefined;
            slot.locked_at = undefined;
            changed = true;
            totalUnlocked++;
          }
        }
        if (changed) {
          // Batch saves in parallel instead of awaiting each one
          savePromises.push(cs.save());
        }
      }

      if (savePromises.length > 0) {
        await Promise.all(savePromises);
        console.log(`[SlotLock] Đã mở khóa ${totalUnlocked} slot quá hạn trên ${savePromises.length} sân.`);
      }
    } catch (error) {
      console.error('[Cron] Lỗi khi chạy cron mở khóa slot:', error);
    }
  });

  console.log('[Cron] Slot lock timeout cron started (every 3 minutes).');
}

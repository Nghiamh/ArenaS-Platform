import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type SlotStatus = 'available' | 'booked' | 'locked' | 'maintenance';

export interface TimeSlot {
  startHour: number;
  endHour: number;
  startLabel: string;
  endLabel: string;
  status: SlotStatus;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  startHour: number;
  endHour: number;
  onChange: (startHour: number, endHour: number) => void;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ slots, startHour, endHour, onChange }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3000);
  };

  const checkRangeValidity = (sHour: number, eHour: number): boolean => {
    return slots.every(slot => {
      // Check if slot overlaps with the requested range
      // A slot overlaps if its start is strictly less than eHour AND its end is strictly greater than sHour
      if (slot.startHour < eHour && slot.endHour > sHour) {
        return slot.status === 'available';
      }
      return true;
    });
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.status !== 'available') return;

    // If no selection or invalid selection, just select this single slot
    if (startHour === 0 || endHour === 0) {
      onChange(slot.startHour, slot.endHour);
      return;
    }

    const isSingleSlot = (endHour - startHour) === 0.5;
    const isAdjacentStart = slot.endHour === startHour;
    const isAdjacentEnd = slot.startHour === endHour;

    // If clicking exactly inside the current selection to toggle it off (only for single slot)
    if (isSingleSlot && slot.startHour === startHour && slot.endHour === endHour) {
      onChange(0, 0);
      return;
    }

    // UX: If adjacent OR we only have a single slot selected, expand the range to include this slot
    if (isAdjacentStart || isAdjacentEnd || isSingleSlot) {
      const newStart = Math.min(startHour, slot.startHour);
      const newEnd = Math.max(endHour, slot.endHour);

      if (checkRangeValidity(newStart, newEnd)) {
        onChange(newStart, newEnd);
      } else {
        showError('Khoảng thời gian này có chứa khung giờ đã được đặt!');
        // Fallback: just start a new selection from the clicked slot
        onChange(slot.startHour, slot.endHour);
      }
    } else {
      // If we already have a multi-slot range and clicked a disjoint slot, start a new selection
      onChange(slot.startHour, slot.endHour);
    }
  };

  return (
    <div className="w-full mt-2 rounded-xl bg-[#0b1426] p-4 border border-white/[0.05] shadow-inner relative">
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-2 left-0 right-0 z-50 flex justify-center pointer-events-none"
          >
            <div className="rounded-lg bg-rose-500/90 backdrop-blur-sm px-4 py-2 text-xs font-bold text-white shadow-lg border border-rose-400/50">
              {errorMsg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-white">Chọn khung giờ</h3>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] bg-[#162032] ring-1 ring-white/10"></span>
            <span className="text-[11px] font-semibold text-slate-400">Trống</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] bg-cyan-500 ring-1 ring-cyan-400"></span>
            <span className="text-[11px] font-semibold text-slate-300">Đang chọn</span>
          </div>
          <div className="flex items-center gap-1.5 relative">
            <span className="h-3 w-3 rounded-[3px] bg-slate-800/80 ring-1 ring-white/5 overflow-hidden">
              <span className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.05)_2px,rgba(255,255,255,0.05)_4px)]"></span>
            </span>
            <span className="text-[11px] font-semibold text-slate-400">Đã đặt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] bg-slate-700/50 ring-1 ring-slate-600/50 flex items-center justify-center"></span>
            <span className="text-[11px] font-semibold text-slate-500">Bảo trì</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
        {slots.map((slot) => {
          // A slot is selected if its time range is completely within the selected startHour -> endHour
          const isSelected = slot.startHour >= startHour && slot.endHour <= endHour;
          const isBooked = slot.status !== 'available';

          return (
            <motion.button
              key={`${slot.startHour}-${slot.endHour}`}
              type="button"
              whileHover={!isBooked ? { scale: 1.05 } : {}}
              whileTap={!isBooked ? { scale: 0.95 } : {}}
              onClick={() => handleSlotClick(slot)}
              disabled={isBooked}
              className={`
                relative flex flex-col items-center justify-center rounded-xl p-2 transition-all overflow-hidden border
                ${slot.status === 'maintenance'
                  ? 'cursor-not-allowed border-slate-700/50 bg-slate-800/50 text-slate-600'
                  : isBooked
                    ? 'cursor-not-allowed border-transparent bg-white/[0.015] text-slate-600 opacity-60'
                    : isSelected
                      ? 'border-cyan-400/50 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 text-cyan-300 shadow-[0_4px_12px_rgba(34,211,238,0.15)] ring-1 ring-cyan-400/30 z-10'
                      : 'cursor-pointer border-white/5 bg-[#162032] text-slate-400 hover:bg-[#1e2b42] hover:border-white/15 hover:text-slate-200'
                }
              `}
            >
              {slot.status === 'maintenance' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                  <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              )}
              {isBooked && slot.status !== 'maintenance' && (
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.02)_4px,rgba(255,255,255,0.02)_8px)] pointer-events-none"></div>
              )}
              <span className={`text-[13px] font-black tracking-tight ${isSelected ? 'text-white' : ''}`}>
                {slot.startLabel}
              </span>
              <span className={`text-[10px] font-bold opacity-60 ${isSelected ? 'text-cyan-100' : ''}`}>
                {slot.endLabel}
              </span>
            </motion.button>
          );
        })}
      </div>

      {startHour > 0 && endHour > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex flex-wrap items-center justify-between rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-transparent px-4 py-3"
        >
          <div className="text-sm">
            <span className="text-cyan-200/70 font-medium">Đã chọn: </span>
            <span className="font-black text-cyan-300 text-[15px] ml-1">
              {Math.floor(startHour).toString().padStart(2, '0')}:{startHour % 1 === 0.5 ? '30' : '00'} - {Math.floor(endHour).toString().padStart(2, '0')}:{endHour % 1 === 0.5 ? '30' : '00'}
            </span>
          </div>
          <div className="text-xs font-bold text-cyan-400 bg-cyan-950/50 border border-cyan-500/20 px-2.5 py-1.5 rounded-lg">
            {(endHour - startHour) * 60} phút
          </div>
        </motion.div>
      )}
    </div>
  );
};


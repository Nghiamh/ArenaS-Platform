import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export type SlotStatus = 'available' | 'booked' | 'locked';

export interface TimeSlot {
  start: string; // '06:00'
  end: string;   // '06:30'
  status: SlotStatus;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  onChange: (range: { start_time: string; end_time: string } | null) => void;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ slots, onChange }) => {
  // Save indexes of the selected range [startIndex, endIndex]
  const [selection, setSelection] = useState<[number, number] | null>(null);

  // When slots change (e.g., changing date or court), reset selection
  useEffect(() => {
    setSelection(null);
    onChange(null);
  }, [slots]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkRangeValidity = (startIdx: number, endIdx: number): boolean => {
    const min = Math.min(startIdx, endIdx);
    const max = Math.max(startIdx, endIdx);
    for (let i = min; i <= max; i++) {
      if (slots[i].status !== 'available') {
        return false;
      }
    }
    return true;
  };

  const handleSlotClick = (index: number) => {
    if (slots[index].status !== 'available') return; // Cannot click booked/locked

    if (!selection) {
      // First click: select single slot
      setSelection([index, index]);
      onChange({ start_time: slots[index].start, end_time: slots[index].end });
    } else {
      const [start, end] = selection;
      
      // If user clicks the same single slot again, deselect
      if (start === end && index === start) {
        setSelection(null);
        onChange(null);
        return;
      }

      // If user already has a range, a new click resets to a single slot selection
      if (start !== end) {
        setSelection([index, index]);
        onChange({ start_time: slots[index].start, end_time: slots[index].end });
        return;
      }

      // If user has a single slot and clicks another, form a range
      const isValid = checkRangeValidity(start, index);
      
      if (!isValid) {
        alert('Không thể chọn khoảng thời gian chứa giờ đã có người đặt!');
        // Reset selection to the newly clicked valid slot
        setSelection([index, index]);
        onChange({ start_time: slots[index].start, end_time: slots[index].end });
      } else {
        const newStart = Math.min(start, index);
        const newEnd = Math.max(start, index);
        setSelection([newStart, newEnd]);
        onChange({ start_time: slots[newStart].start, end_time: slots[newEnd].end });
      }
    }
  };

  const isSelected = (index: number) => {
    if (!selection) return false;
    const [start, end] = selection;
    return index >= Math.min(start, end) && index <= Math.max(start, end);
  };

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between text-sm">
        <h3 className="font-semibold text-white">Chọn khung giờ</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-white/10 ring-1 ring-white/20"></span>
            <span className="text-xs text-slate-400">Trống</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-cyan-500/80 ring-1 ring-cyan-400"></span>
            <span className="text-xs text-slate-400">Đang chọn</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-slate-700/50 relative overflow-hidden">
                <span className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.1)_2px,rgba(255,255,255,0.1)_4px)]"></span>
            </span>
            <span className="text-xs text-slate-400">Đã đặt</span>
          </div>
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400 italic bg-white/5 rounded-xl border border-white/10">
          Không có khung giờ nào được tìm thấy.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {slots.map((slot, idx) => {
            const selected = isSelected(idx);
            const booked = slot.status !== 'available';

            return (
              <motion.button
                key={`${slot.start}-${slot.end}`}
                whileHover={!booked ? { scale: 1.05 } : {}}
                whileTap={!booked ? { scale: 0.95 } : {}}
                onClick={() => handleSlotClick(idx)}
                disabled={booked}
                className={`
                  relative flex flex-col items-center justify-center rounded-xl border p-2 transition-colors overflow-hidden
                  ${booked 
                    ? 'cursor-not-allowed border-white/5 bg-slate-800/40 text-slate-500' 
                    : selected 
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                      : 'cursor-pointer border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20'
                  }
                `}
              >
                {booked && (
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.03)_4px,rgba(255,255,255,0.03)_8px)] pointer-events-none"></div>
                )}
                <span className="text-xs font-bold">{slot.start}</span>
                <span className="text-[10px] opacity-60">đến</span>
                <span className="text-xs font-bold">{slot.end}</span>
              </motion.button>
            );
          })}
        </div>
      )}

      {selection && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-center"
        >
          <p className="text-sm text-cyan-200">
            Khung giờ bạn chọn: <span className="font-bold text-cyan-400">{slots[Math.min(selection[0], selection[1])].start} - {slots[Math.max(selection[0], selection[1])].end}</span>
          </p>
          <p className="text-xs text-cyan-200/60 mt-1">
            Tổng thời gian: {(Math.abs(selection[1] - selection[0]) + 1) * 30} phút
          </p>
        </motion.div>
      )}
    </div>
  );
};

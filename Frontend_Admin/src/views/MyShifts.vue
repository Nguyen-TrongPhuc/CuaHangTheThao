<template>
  <div class="page-container">
    <div class="header">
      <h1>Lịch làm việc của tôi</h1>
    </div>

    <div class="calendar-card card">
      <!-- Điều hướng tuần -->
      <div class="calendar-controls">
        <button class="btn-nav" @click="changeWeek(-1)">
          <i class="fa-solid fa-chevron-left"></i> Tuần trước
        </button>
        <h3 class="week-title">
          <i class="fa-regular fa-calendar-days"></i> {{ weekDateRangeText }}
        </h3>
        <button class="btn-nav" @click="changeWeek(1)">
          Tuần sau <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      <!-- Lưới lịch 7 ngày -->
      <div class="week-grid">
        <div v-for="day in weekDays" :key="day.dateStr" class="day-col" :class="{ 'is-today': day.isToday }">
          <div class="day-header">
            <span class="day-name">{{ day.dayName }}</span>
            <span class="day-date">{{ day.dateFormatted }}</span>
          </div>
          
          <div class="day-content">
            <div v-if="day.shift" class="shift-card" :class="day.shift.shift_type">
              <div class="shift-name">{{ getShiftName(day.shift.shift_type) }}</div>
              <div class="shift-time">{{ getShiftTime(day.shift.shift_type) }}</div>
              
              <div class="shift-status" :class="day.shift.status">
                {{ getStatusName(day.shift.status) }}
              </div>
              
              <div v-if="day.shift.note" class="shift-note">
                <i class="fa-solid fa-note-sticky"></i> {{ day.shift.note }}
              </div>
            </div>
            <div v-else class="no-shift">
              Nghỉ
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ShiftsService from "@/services/shifts.service";

export default {
  data() {
    return {
      currentStartDate: this.getMonday(new Date()),
      shifts: [],
    };
  },
  computed: {
    weekDays() {
      const days = [];
      const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
      const todayStr = this.formatDateStr(new Date());

      for (let i = 0; i < 7; i++) {
        const d = new Date(this.currentStartDate);
        d.setDate(d.getDate() + i);
        const dateStr = this.formatDateStr(d);
        
        days.push({
          dateStr: dateStr,
          dayName: dayNames[i],
          dateFormatted: `${d.getDate()}/${d.getMonth() + 1}`,
          isToday: dateStr === todayStr,
          shift: this.shifts.find(s => s.date === dateStr)
        });
      }
      return days;
    },
    weekDateRangeText() {
      if (this.weekDays.length === 0) return '';
      const start = this.weekDays[0].dateFormatted;
      const end = this.weekDays[6].dateFormatted;
      return `${start} đến ${end}`;
    }
  },
  methods: {
    // Tìm ngày Thứ 2 của tuần hiện tại
    getMonday(d) {
      d = new Date(d);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Điều chỉnh nếu hôm nay là Chủ Nhật
      return new Date(d.setDate(diff));
    },
    formatDateStr(d) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    changeWeek(direction) {
      const newDate = new Date(this.currentStartDate);
      newDate.setDate(newDate.getDate() + (direction * 7));
      this.currentStartDate = newDate;
      this.fetchMyShifts();
    },
    getShiftName(type) {
      const map = { 'morning': 'Ca Sáng', 'afternoon': 'Ca Chiều', 'evening': 'Ca Đêm' };
      return map[type] || type;
    },
    getShiftTime(type) {
      const map = { 'morning': '06:00 - 14:00', 'afternoon': '14:00 - 22:00', 'evening': '22:00 - 06:00' };
      return map[type] || '';
    },
    getStatusName(status) {
      const map = { 'scheduled': 'Đã xếp lịch', 'attended': 'Có mặt', 'absent': 'Vắng mặt' };
      return map[status] || status;
    },
    async fetchMyShifts() {
      try {
        const startDate = this.weekDays[0].dateStr;
        const endDate = this.weekDays[6].dateStr;
        
        // Gọi API với startDate và endDate (backend đã tự cấu hình lấy đúng ID đăng nhập)
        this.shifts = await ShiftsService.getAll({ startDate, endDate });
      } catch (error) {
        console.error("Lỗi tải ca trực:", error);
      }
    }
  },
  mounted() {
    this.fetchMyShifts();
  }
};
</script>

<style scoped>
.page-container { padding: 20px; }
.header h1 { margin-bottom: 20px; color: #2c3e50; }
.card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
.calendar-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.btn-nav { background: #f0f2f5; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; color: #555; transition: 0.2s; }
.btn-nav:hover { background: #e4e6e9; color: #1877f2; }
.week-title { margin: 0; color: #2c3e50; font-size: 1.2rem; }
.week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; }
.day-col { border: 1px solid #eee; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; min-height: 150px; }
.day-col.is-today { border-color: #3498db; box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2); }
.day-header { background: #f8f9fa; padding: 10px; text-align: center; border-bottom: 1px solid #eee; }
.day-col.is-today .day-header { background: #3498db; color: white; }
.day-name { display: block; font-weight: bold; font-size: 0.9rem; }
.day-date { font-size: 0.8rem; opacity: 0.8; }
.day-content { padding: 10px; flex: 1; display: flex; flex-direction: column; background: #fafafa; }
.no-shift { text-align: center; color: #bdc3c7; font-size: 0.9rem; margin-top: 20px; font-style: italic; }
.shift-card { padding: 10px; border-radius: 6px; border-left: 4px solid #ccc; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
.shift-card.morning { border-left-color: #f1c40f; }
.shift-card.afternoon { border-left-color: #3498db; }
.shift-card.evening { border-left-color: #9b59b6; }
.shift-name { font-weight: bold; font-size: 0.95rem; color: #333; margin-bottom: 2px; }
.shift-time { font-size: 0.8rem; color: #777; margin-bottom: 8px; }
.shift-status { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
.shift-status.scheduled { background: #f0f2f5; color: #666; }
.shift-status.attended { background: #d4edda; color: #155724; }
.shift-status.absent { background: #f8d7da; color: #721c24; }
.shift-note { margin-top: 8px; font-size: 0.8rem; color: #e67e22; background: #fff9f0; padding: 5px; border-radius: 4px; }
@media (max-width: 992px) { .week-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 576px) { .week-grid { grid-template-columns: 1fr; } }
</style>
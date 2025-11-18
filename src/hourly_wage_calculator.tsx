import { useState } from "react";

interface WorkTime {
  startTime: string;
  endTime: string;
  hours: string;
}

interface CalculationResult {
  totalHours: string;
  totalDays: number;
  basicPay: number;
  weeklyHolidayPay: number;
  totalPay: number;
  eligibleWeeks: number;
  totalWeeks: number;
}

export default function WageCalculator() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hourlyWage, setHourlyWage] = useState<string>("10300");
  const [workSchedule, setWorkSchedule] = useState<Record<string, WorkTime>>(
    {}
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDay };
  };

  const formatDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;

  const calculateHours = (start: string, end: string): number => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let startMin = sh * 60 + sm;
    let endMin = eh * 60 + em;
    if (endMin < startMin) endMin += 24 * 60;
    return (endMin - startMin) / 60;
  };

  const addWorkTime = () => {
    if (!selectedDate || !startTime || !endTime) {
      alert("날짜와 시간을 모두 입력해주세요!");
      return;
    }
    const dateKey = formatDate(selectedDate);
    const hours = calculateHours(startTime, endTime);
    setWorkSchedule({
      ...workSchedule,
      [dateKey]: { startTime, endTime, hours: hours.toFixed(2) },
    });
    setStartTime("");
    setEndTime("");
  };

  const deleteWorkTime = (dateKey: string) => {
    const newSched = { ...workSchedule };
    delete newSched[dateKey];
    setWorkSchedule(newSched);
  };

  const calculateTotal = (): CalculationResult => {
    const wage = parseFloat(hourlyWage) || 0;

    // 1. 총 근무시간, 총 근무일
    const totalHours = Object.values(workSchedule).reduce(
      (sum, w) => sum + parseFloat(w.hours),
      0
    );
    const totalDays = Object.keys(workSchedule).length;
    const basicPay = totalHours * wage;

    // 2. 주별 근무시간, 근무일수 계산
    const weeklyData: Record<
      string,
      { hours: number; days: number; dates: Set<string> }
    > = {};

    Object.entries(workSchedule).forEach(([dateStr, w]) => {
      const date = new Date(dateStr);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // 일요일 기준 주 시작
      const weekKey = formatDate(weekStart);

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { hours: 0, days: 0, dates: new Set() };
      }
      weeklyData[weekKey].hours += parseFloat(w.hours);
      if (!weeklyData[weekKey].dates.has(dateStr)) {
        weeklyData[weekKey].days += 1;
        weeklyData[weekKey].dates.add(dateStr);
      }
    });

    // 3. 주휴수당 계산
    let weeklyHolidayPay = 0;
    let eligibleWeeks = 0;
    Object.values(weeklyData).forEach((week) => {
      if (week.hours >= 15 && week.days > 0) {
        eligibleWeeks++;
        const dailyAvg = week.hours / week.days; // 하루 평균 근무시간
        weeklyHolidayPay += dailyAvg * wage; // 1일분 주휴수당
      }
    });

    return {
      totalHours: totalHours.toFixed(2),
      totalDays,
      basicPay: Math.round(basicPay),
      weeklyHolidayPay: Math.round(weeklyHolidayPay),
      totalPay: Math.round(basicPay + weeklyHolidayPay),
      eligibleWeeks,
      totalWeeks: Object.keys(weeklyData).length,
    };
  };

  const prevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  const nextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );

  const { daysInMonth, firstDay } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });
  const result = hourlyWage ? calculateTotal() : null;

  return (
    <div
      className="container"
      style={{ padding: "1rem", fontFamily: "sans-serif" }}
    >
      <div
        className="card-header"
        style={{ fontSize: "2rem", fontWeight: "bold" }}
      >
        시급 계산기
      </div>

      <label>시급</label>
      <input
        className="input"
        type="number"
        value={hourlyWage}
        onChange={(e) => setHourlyWage(e.target.value)}
        style={{ width: "100px", marginLeft: "0.5rem", marginRight: "0.5rem" }}
      />

      <div
        className="card"
        style={{
          marginBottom: "1rem",
          padding: "1rem",
          border: "1px solid #ccc",
          borderRadius: "0.75rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <button className="button" onClick={prevMonth}>
            ◀
          </button>
          <span style={{ fontWeight: "bold" }}>{monthName}</span>
          <button className="button" onClick={nextMonth}>
            ▶
          </button>
        </div>

        <div
          className="calendar-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "0.5rem",
          }}
        >
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontWeight: "bold" }}>
              {d}
            </div>
          ))}
          {Array.from({ length: firstDay }).map((_, idx) => (
            <div key={`empty-${idx}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(
              currentMonth.getFullYear(),
              currentMonth.getMonth(),
              day
            );
            const dateKey = formatDate(date);
            const hasWork = workSchedule[dateKey];
            const isSelected =
              selectedDate && formatDate(selectedDate) === dateKey;
            return (
              <div
                key={day}
                style={{
                  textAlign: "center",
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  background: isSelected
                    ? "#3b82f6"
                    : hasWork
                    ? "#d1fae5"
                    : "#f0f0f0",
                  color: isSelected ? "white" : "black",
                }}
                onClick={() => setSelectedDate(date)}
              >
                {day}
              </div>
            );
          })}
        </div>

        {selectedDate && (
          <div style={{ marginTop: "1rem" }}>
            <h4>
              {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
              근무시간
            </h4>
            <div
              style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}
            >
              <input
                className="input"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <input
                className="input"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
              <button className="button" onClick={addWorkTime}>
                추가
              </button>
            </div>
          </div>
        )}
      </div>

      {Object.keys(workSchedule).length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "0.75rem",
          }}
        >
          <h4 style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
            등록된 근무 기록
          </h4>
          <ul>
            {Object.entries(workSchedule)
              .sort(
                (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
              )
              .map(([date, w]) => (
                <li
                  key={date}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.3rem 0",
                  }}
                >
                  <span>
                    {date}: {w.startTime} ~ {w.endTime} ({w.hours}시간)
                  </span>
                  <button
                    className="button"
                    onClick={() => deleteWorkTime(date)}
                  >
                    삭제
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}

      {result && (
        <div
          className="card results"
          style={{
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "0.75rem",
          }}
        >
          <div>총 근무일수: {result.totalDays}일</div>
          <div>총 근무시간: {result.totalHours}시간</div>
          <div>기본 급여: {result.basicPay.toLocaleString()}원</div>
          <div>주휴수당: {result.weeklyHolidayPay.toLocaleString()}원</div>
          <div style={{ fontWeight: "bold", marginTop: "0.5rem" }}>
            총 지급액: {result.totalPay.toLocaleString()}원
          </div>
        </div>
      )}
    </div>
  );
}

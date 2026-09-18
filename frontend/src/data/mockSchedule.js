export function localDate(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}
export function firstBookingDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return localDate(date);
}
export function getSlots(flow, date, providerId = "", doctorId = "") {
  if (!date) return [];
  const hours = flow === "afterHours"
    ? ["17:30", "18:00", "18:30", "19:00", "19:30", "20:00"]
    : flow === "video" ? ["08:30", "09:30", "11:00", "14:30", "16:00", "19:00"]
      : ["07:30", "08:30", "09:30", "10:30", "13:30", "14:30", "15:30", "16:30"];
  const seed = Array.from(date + providerId + doctorId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return hours.map((time, index) => ({ time, available: index !== seed % hours.length }));
}

import { useState } from "react";
import PatientBookingPage from "./pages/BookingPage/PatientBookingPage";
import ReceptionPage from "./pages/ReceptionPage/ReceptionPage";
import SchedulePage from "./pages/SchedulePage/SchedulePage";

function App() {
  const [currentPage, setCurrentPage] = useState("reception"); // Mặc định mở trang Tiếp đón

  return (
    <div>
      <nav
        style={{
          display: "flex",
          gap: "12px",
          padding: "12px 24px",
          background: "#ffffff",
          boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
        }}
      >
        <button
          onClick={() => setCurrentPage("reception")}
          style={{
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
            background: currentPage === "reception" ? "#1976d2" : "#f1f5f9",
            color: currentPage === "reception" ? "#ffffff" : "#475569",
          }}
        >
          📋 Tiếp Đón & Hàng Đợi (Lễ Tân)
        </button>

        <button
          onClick={() => setCurrentPage("booking")}
          style={{
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
            background: currentPage === "booking" ? "#1976d2" : "#f1f5f9",
            color: currentPage === "booking" ? "#ffffff" : "#475569",
          }}
        >
          🏥 Đặt Lịch Khám (Bệnh Nhân)
        </button>

        <button
          onClick={() => setCurrentPage("schedule")}
          style={{
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
            background: currentPage === "schedule" ? "#1976d2" : "#f1f5f9",
            color: currentPage === "schedule" ? "#ffffff" : "#475569",
          }}
        >
          👨‍⚕️ Quản Lý Lịch Trực (Bác Sĩ / Admin)
        </button>
      </nav>

      {/* Render Component */}
      {currentPage === "reception" && <ReceptionPage />}
      {currentPage === "booking" && <PatientBookingPage />}
      {currentPage === "schedule" && <SchedulePage />}
    </div>
  );
}

export default App;

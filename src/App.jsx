import { useState } from "react";
import SchedulePage from "./pages/SchedulePage/SchedulePage";

function App() {
  const [currentPage, setCurrentPage] = useState("schedule");

  return (
    <div>
      {/* Thanh điều hướng nhanh giữa các module */}
      <nav
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          padding: "10px 40px",
          display: "flex",
          gap: "15px",
        }}
      >
        <button
          onClick={() => setCurrentPage("schedule")}
          style={{
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
            backgroundColor: currentPage === "schedule" ? "#1976d2" : "#f1f5f9",
            color: currentPage === "schedule" ? "#ffffff" : "#475569",
          }}
        >
          Lịch Trực Bác Sĩ
        </button>

        <button
          onClick={() => setCurrentPage("medical-record")}
          style={{
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
            backgroundColor:
              currentPage === "medical-record" ? "#1976d2" : "#f1f5f9",
            color: currentPage === "medical-record" ? "#ffffff" : "#475569",
          }}
        >
          Hồ Sơ Bệnh Án
        </button>

        <button
          onClick={() => setCurrentPage("prescription")}
          style={{
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
            backgroundColor:
              currentPage === "prescription" ? "#1976d2" : "#f1f5f9",
            color: currentPage === "prescription" ? "#ffffff" : "#475569",
          }}
        >
          Kê Đơn Thuốc
        </button>

        <button
          onClick={() => setCurrentPage("service-assignment")}
          style={{
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
            backgroundColor:
              currentPage === "service-assignment" ? "#1976d2" : "#f1f5f9",
            color: currentPage === "service-assignment" ? "#ffffff" : "#475569",
          }}
        >
          Chỉ Định Dịch Vụ
        </button>
      </nav>

      {/* Render trang tương ứng */}
      {currentPage === "schedule" && <SchedulePage />}
      {currentPage === "medical-record" && (
        <div style={{ padding: 40 }}>Trang Bệnh Án đang phát triển...</div>
      )}
      {currentPage === "prescription" && (
        <div style={{ padding: 40 }}>Trang Kê Đơn Thuốc đang phát triển...</div>
      )}
      {currentPage === "service-assignment" && (
        <div style={{ padding: 40 }}>
          Trang Chỉ Định Dịch Vụ đang phát triển...
        </div>
      )}
    </div>
  );
}

export default App;

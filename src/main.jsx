import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// CSS cơ sở
import "./index.css";

// CSS từng phân hệ
import "./styles/reception.css";
import "./styles/schedule.css";
// Khi làm tiếp các trang sau chỉ cần bỏ comment:
// import './styles/medical-record.css'
// import './styles/prescription.css'

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

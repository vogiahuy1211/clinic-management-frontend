import axios from "axios";
import { useEffect, useState } from "react";
import "../../styles/booking.css";
import "../../styles/schedule.css"; // Dùng lại các form-control đã viết

const SPECIALTY_API = "http://localhost:8080/api/specialties";
const DOCTOR_API = "http://localhost:8080/api/doctors";
const SCHEDULE_API = "http://localhost:8080/api/doctor-schedules";
const APPOINTMENT_API = "http://localhost:8080/api/appointments";

function PatientBookingPage() {
  const [step, setStep] = useState(1);

  // Danh mục dữ liệu
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [availableSchedules, setAvailableSchedules] = useState([]);

  // Dữ liệu đặt lịch bệnh nhân lựa chọn
  const today = new Date().toISOString().split("T")[0];
  const [bookingData, setBookingData] = useState({
    specialtyId: "",
    doctorId: "",
    examinationDate: today,
    selectedSchedule: null,
    // Thông tin cá nhân
    patientId: "BN001", // Nếu đã đăng nhập có thể truyền sẵn, hoặc nhập tay
    patientName: "",
    phoneNumber: "",
    reason: "",
  });

  const [bookingSuccessResult, setBookingSuccessResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Tải danh mục khoa & bác sĩ ban đầu
  useEffect(() => {
    axios
      .get(SPECIALTY_API)
      .then((res) => setSpecialties(res.data))
      .catch((err) => console.error("Lỗi tải chuyên khoa:", err));

    axios
      .get(DOCTOR_API)
      .then((res) => setDoctors(res.data))
      .catch((err) => console.error("Lỗi tải bác sĩ:", err));
  }, []);

  // Lọc bác sĩ theo chuyên khoa
  const handleSpecialtyChange = (e) => {
    const specId = e.target.value;
    setBookingData((prev) => ({
      ...prev,
      specialtyId: specId,
      doctorId: "",
      selectedSchedule: null,
    }));

    if (specId) {
      const filtered = doctors.filter(
        (d) => d.departmentId === specId || d.specialtyId === specId,
      );
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors([]);
    }
  };

  // Tìm kiếm ca trực khả dụng của bác sĩ trong ngày chọn
  const fetchAvailableSchedules = (doctorId, date) => {
    if (!doctorId || !date) return;
    setLoading(true);
    axios
      .get(`${SCHEDULE_API}/doctor/${doctorId}/date?date=${date}`)
      .then((res) => {
        // Chỉ lấy những ca còn nhận và đang mở đăng ký
        const valid = res.data.filter(
          (s) => s.status === "MoDangKy" || s.status === "AVAILABLE",
        );
        setAvailableSchedules(valid);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi nạp lịch trực:", err);
        setAvailableSchedules([]);
        setLoading(false);
      });
  };

  const handleDoctorChange = (e) => {
    const docId = e.target.value;
    setBookingData((prev) => ({
      ...prev,
      doctorId: docId,
      selectedSchedule: null,
    }));
    fetchAvailableSchedules(docId, bookingData.examinationDate);
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setBookingData((prev) => ({
      ...prev,
      examinationDate: newDate,
      selectedSchedule: null,
    }));
    fetchAvailableSchedules(bookingData.doctorId, newDate);
  };

  // Xác nhận đặt lịch và gọi API lưu vào CSDL
  const handleConfirmBooking = () => {
    if (!bookingData.patientName.trim())
      return alert("Vui lòng nhập họ và tên!");
    if (!bookingData.phoneNumber.trim())
      return alert("Vui lòng nhập số điện thoại!");

    const { selectedSchedule, patientId, doctorId, examinationDate, reason } =
      bookingData;

    // Giờ hẹn mặc định lấy theo giờ bắt đầu ca trực
    const appointmentPayload = {
      patientId: patientId || "BN001",
      doctorId: doctorId,
      scheduleId: selectedSchedule.id,
      appointmentDate: examinationDate,
      appointmentTime: selectedSchedule.startTime,
      reason: reason || "Khám bệnh theo yêu cầu",
      status: "DaDat",
    };

    setLoading(true);
    axios
      .post(APPOINTMENT_API, appointmentPayload)
      .then((res) => {
        setBookingSuccessResult(res.data);
        setStep(4); // Sang bước hoàn tất
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.message || "Lỗi khi đặt lịch khám!");
        setLoading(false);
      });
  };

  return (
    <div className="booking-wrapper">
      <div className="booking-card">
        {/* Header */}
        <div className="booking-header">
          <h1>ĐĂNG KÝ KHÁM BỆNH TRỰC TUYẾN</h1>
          <p>Hệ thống Đặt lịch & Tiếp nhận khám bệnh thông minh</p>
        </div>

        {/* Thanh tiến trình 4 bước */}
        <div className="steps-nav">
          <div
            className={`step-item ${step === 1 ? "active" : step > 1 ? "done" : ""}`}
          >
            <div className="step-number">{step > 1 ? "✓" : "1"}</div>
            <span className="step-label">Chọn Bác Sĩ</span>
          </div>
          <div
            className={`step-item ${step === 2 ? "active" : step > 2 ? "done" : ""}`}
          >
            <div className="step-number">{step > 2 ? "✓" : "2"}</div>
            <span className="step-label">Chọn Ca Trực</span>
          </div>
          <div
            className={`step-item ${step === 3 ? "active" : step > 3 ? "done" : ""}`}
          >
            <div className="step-number">{step > 3 ? "✓" : "3"}</div>
            <span className="step-label">Thông Tin BN</span>
          </div>
          <div className={`step-item ${step === 4 ? "active done" : ""}`}>
            <div className="step-number">4</div>
            <span className="step-label">Phiếu Hẹn</span>
          </div>
        </div>

        {/* ==============================================================
            BƯỚC 1: CHỌN CHUYÊN KHOA VÀ BÁC SĨ
            ============================================================== */}
        {step === 1 && (
          <div>
            <div className="form-group">
              <div>
                <label className="input-label">Chuyên Khoa Khám *</label>
                <select
                  className="form-control"
                  value={bookingData.specialtyId}
                  onChange={handleSpecialtyChange}
                >
                  <option value="">-- Chọn chuyên khoa --</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.specialtyName || s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Bác Sĩ Điều Trị *</label>
                <select
                  className="form-control"
                  value={bookingData.doctorId}
                  onChange={handleDoctorChange}
                  disabled={!bookingData.specialtyId}
                >
                  <option value="">
                    {!bookingData.specialtyId
                      ? "-- Vui lòng chọn chuyên khoa trước --"
                      : filteredDoctors.length === 0
                        ? "-- Không có bác sĩ trực thuộc khoa này --"
                        : "-- Chọn bác sĩ --"}
                  </option>
                  {filteredDoctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.fullName ||
                        doc.name ||
                        (doc.user && doc.user.fullName) ||
                        "Bác sĩ"}{" "}
                      ({doc.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="button-row" style={{ justifyContent: "flex-end" }}>
              <button
                className="btn-primary"
                disabled={!bookingData.doctorId}
                onClick={() => {
                  fetchAvailableSchedules(
                    bookingData.doctorId,
                    bookingData.examinationDate,
                  );
                  setStep(2);
                }}
              >
                Tiếp tục: Chọn ngày & ca trực ➔
              </button>
            </div>
          </div>
        )}

        {/* ==============================================================
            BƯỚC 2: CHỌN NGÀY VÀ CA TRỰC
            ============================================================== */}
        {step === 2 && (
          <div>
            <div className="form-group">
              <div>
                <label className="input-label">Ngày Khám Dự Kiến *</label>
                <input
                  type="date"
                  className="form-control"
                  min={today}
                  value={bookingData.examinationDate}
                  onChange={handleDateChange}
                />
              </div>

              <div>
                <label className="input-label">
                  Các Ca Khám Còn Nhận Khách:
                </label>
                {loading ? (
                  <p style={{ color: "#64748b" }}>Đang nạp các ca trực...</p>
                ) : availableSchedules.length === 0 ? (
                  <div
                    style={{
                      padding: "16px",
                      background: "#fff3cd",
                      borderRadius: "8px",
                      color: "#856404",
                    }}
                  >
                    Không có ca trực nào còn mở đăng ký trong ngày này. Vui lòng
                    chọn ngày khác!
                  </div>
                ) : (
                  <div className="schedules-grid">
                    {availableSchedules.map((item) => {
                      const isSelected =
                        bookingData.selectedSchedule?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`schedule-card ${isSelected ? "selected" : ""}`}
                          onClick={() =>
                            setBookingData((prev) => ({
                              ...prev,
                              selectedSchedule: item,
                            }))
                          }
                        >
                          <h4>
                            Ca: {item.startTime} - {item.endTime}
                          </h4>
                          <p>
                            Mã ca: <b>{item.id}</b>
                          </p>
                          <p>
                            Phòng:{" "}
                            <span className="badge-room">{item.roomId}</span>
                          </p>
                          <p>Chỉ tiêu: {item.maxPatients} BN</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="button-row">
              <button className="btn-secondary" onClick={() => setStep(1)}>
                ⬅ Quay lại
              </button>
              <button
                className="btn-primary"
                disabled={!bookingData.selectedSchedule}
                onClick={() => setStep(3)}
              >
                Tiếp tục: Điền thông tin BN ➔
              </button>
            </div>
          </div>
        )}

        {/* ==============================================================
            BƯỚC 3: ĐIỀN THÔNG TIN BỆNH NHÂN
            ============================================================== */}
        {step === 3 && (
          <div>
            <div className="form-group">
              <div>
                <label className="input-label">Họ và Tên Bệnh Nhân *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={bookingData.patientName}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      patientName: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-row">
                <div>
                  <label className="input-label">Số Điện Thoại Liên Hệ *</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Ví dụ: 0912345678"
                    value={bookingData.phoneNumber}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        phoneNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="input-label">Mã Bệnh Nhân (Nếu có)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={bookingData.patientId}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        patientId: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Triệu Chứng / Lý Do Khám</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Mô tả tóm tắt tình trạng khó chịu hoặc bệnh lý hiện tại..."
                  value={bookingData.reason}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, reason: e.target.value })
                  }
                ></textarea>
              </div>
            </div>

            <div className="button-row">
              <button className="btn-secondary" onClick={() => setStep(2)}>
                ⬅ Quay lại
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirmBooking}
                disabled={loading}
              >
                {loading ? "Đang gửi đăng ký..." : "Xác Nhận Đặt Lịch ➔"}
              </button>
            </div>
          </div>
        )}

        {/* ==============================================================
            BƯỚC 4: HOÀN TẤT & PHIẾU HẸN ĐIỆN TỬ
            ============================================================== */}
        {step === 4 && bookingSuccessResult && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "48px",
                color: "#2e7d32",
                marginBottom: "8px",
              }}
            >
              ✓
            </div>
            <h2 style={{ color: "#2e7d32", margin: "0 0 8px 0" }}>
              ĐẶT LỊCH KHÁM THÀNH CÔNG!
            </h2>
            <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
              Vui lòng chụp lại màn hình hoặc lưu lại thông tin phiếu hẹn dưới
              đây:
            </p>

            <div className="ticket-container">
              <div className="ticket-header">
                <span style={{ fontWeight: 600, color: "#64748b" }}>
                  MÃ LỊCH HẸN
                </span>
                <span className="ticket-id">{bookingSuccessResult.id}</span>
              </div>

              <div className="ticket-row">
                <span className="ticket-label">Bệnh nhân:</span>
                <span className="ticket-value">
                  {bookingData.patientName} ({bookingSuccessResult.patientId})
                </span>
              </div>

              <div className="ticket-row">
                <span className="ticket-label">Bác sĩ phụ trách:</span>
                <span className="ticket-value">
                  {bookingSuccessResult.doctorId}
                </span>
              </div>

              <div className="ticket-row">
                <span className="ticket-label">Phòng khám chỉ định:</span>
                <span className="ticket-value">
                  {bookingData.selectedSchedule?.roomId}
                </span>
              </div>

              <div className="ticket-row">
                <span className="ticket-label">Ngày khám:</span>
                <span className="ticket-value">
                  {bookingSuccessResult.appointmentDate}
                </span>
              </div>

              <div className="ticket-row">
                <span className="ticket-label">Giờ hẹn dự kiến:</span>
                <span className="ticket-value">
                  {bookingSuccessResult.appointmentTime}
                </span>
              </div>

              <div className="ticket-row">
                <span className="ticket-label">Trạng thái:</span>
                <span className="badge-status badge-available">
                  {bookingSuccessResult.status}
                </span>
              </div>
            </div>

            <div className="button-row" style={{ justifyContent: "center" }}>
              <button
                className="btn-primary"
                onClick={() => {
                  setStep(1);
                  setBookingData({
                    specialtyId: "",
                    doctorId: "",
                    examinationDate: today,
                    selectedSchedule: null,
                    patientId: "BN001",
                    patientName: "",
                    phoneNumber: "",
                    reason: "",
                  });
                  setBookingSuccessResult(null);
                }}
              >
                Đặt Thêm Lịch Mới
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientBookingPage;

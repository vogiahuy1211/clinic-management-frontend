import axios from "axios";
import { useEffect, useState } from "react";
import "../../styles/reception.css";
import "../../styles/schedule.css";

const RECEPTION_API = "http://localhost:8080/api/receptions";
const APPOINTMENT_API = "http://localhost:8080/api/appointments";
const ROOM_API = "http://localhost:8080/api/rooms";
const DOCTOR_API = "http://localhost:8080/api/doctors";
const PATIENT_API = "http://localhost:8080/api/patients";
const SCHEDULE_API = "http://localhost:8080/api/doctor-schedules";

function ReceptionPage() {
  const today = new Date().toISOString().split("T")[0];

  const [rooms, setRooms] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [queueList, setQueueList] = useState([]);

  const [lookupAppointmentId, setLookupAppointmentId] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [filterRoomId, setFilterRoomId] = useState("");

  const [formData, setFormData] = useState({
    patientId: "",
    employeeId: "NV001",
    roomId: "",
    doctorId: "",
    appointmentId: "",
    receptionDate: today,
    receptionType: "",
    initialSymptoms: "",
    patientName: "",
    patientPhone: "",
    patientGender: "Nam",
    patientDob: "",
    patientAddress: "",
    pulse: "",
    temperature: "",
    bloodPressure: "",
    weight: "",
    height: "",
  });

  const [createdSlip, setCreatedSlip] = useState(null);

  // 1. Tải danh sách hàng đợi trong ngày
  const fetchTodayQueue = () => {
    axios
      .get(`${RECEPTION_API}/by-date?date=${today}`)
      .then((res) => setQueueList(res.data))
      .catch(console.error);
  };

  // 2. Lấy mã BN tự tăng mới nhất cho khách trực tiếp
  const fetchNextPatientId = () => {
    axios
      .get(`${PATIENT_API}/next-id`)
      .then((res) => {
        if (res.data?.nextId) {
          setFormData((prev) => ({ ...prev, patientId: res.data.nextId }));
        }
      })
      .catch(() => {
        // Fallback nếu API next-id chưa có
        setFormData((prev) => ({ ...prev, patientId: "Tự động tạo mới" }));
      });
  };

  // 3. Khởi tạo danh mục
  useEffect(() => {
    axios
      .get(ROOM_API)
      .then((res) => setRooms(res.data))
      .catch(console.error);
    axios
      .get(DOCTOR_API)
      .then((res) => setDoctors(res.data))
      .catch(console.error);
    fetchTodayQueue();
  }, []);

  // 4. Xử lý khi thay đổi Bác Sĩ -> Nhảy phòng khám theo chuyên khoa của bác sĩ
  const handleDoctorChange = (selectedDoctorId) => {
    const doc = doctors.find((d) => String(d.id) === String(selectedDoctorId));
    let matchedRoomId = "";

    if (doc) {
      const docDepartmentId = doc.departmentId || doc.specialtyId;
      console.log(`Bác sĩ ${doc.id} thuộc Chuyên khoa:`, docDepartmentId);

      if (docDepartmentId) {
        const foundRoom = rooms.find((r) => {
          const roomDept = r.departmentId || r.specialtyId || r.machuyenkhoa;
          return roomDept && String(roomDept) === String(docDepartmentId);
        });

        if (foundRoom) {
          console.log(`=> Đã tìm thấy phòng khớp:`, foundRoom.id);
          matchedRoomId = foundRoom.id;
        } else {
          console.warn(
            `Chưa tìm thấy phòng nào có mã chuyên khoa: ${docDepartmentId}`,
          );
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      doctorId: selectedDoctorId,
      roomId: matchedRoomId || prev.roomId,
    }));
  };

  // 5. Tra cứu lịch hẹn LHxxx
  const handleLookupAppointment = () => {
    if (!lookupAppointmentId.trim()) {
      alert("Vui lòng nhập Mã lịch hẹn!");
      return;
    }

    setLookupLoading(true);
    axios
      .get(`${APPOINTMENT_API}/${lookupAppointmentId.trim()}`)
      .then(async (res) => {
        const app = res.data;
        if (!app) {
          alert("Không tìm thấy thông tin lịch hẹn này!");
          return;
        }

        let assignedRoomId = "";

        if (app.scheduleId) {
          try {
            const schedRes = await axios.get(
              `${SCHEDULE_API}/${app.scheduleId}`,
            );
            if (schedRes.data && schedRes.data.roomId) {
              assignedRoomId = schedRes.data.roomId;
            }
          } catch (e) {
            console.error("Không tìm thấy phòng từ ca trực:", e);
          }
        }

        if (!assignedRoomId && app.doctorId) {
          const doc = doctors.find((d) => d.id === app.doctorId);
          const docSpecId = doc?.specialtyId || doc?.specialty?.id;
          const matched = rooms.find(
            (r) => (r.specialtyId || r.specialty?.id) === docSpecId,
          );
          if (matched) assignedRoomId = matched.id;
        }

        setFormData((prev) => ({
          ...prev,
          patientId: app.patientId,
          doctorId: app.doctorId || "",
          roomId: assignedRoomId || prev.roomId,
          appointmentId: app.id,
          receptionType: "HenTruoc",
          initialSymptoms: app.reason || "Khám theo lịch hẹn",
        }));

        alert(`Đã tìm thấy lịch hẹn ${app.id} (Bệnh nhân: ${app.patientId})`);
      })
      .catch((err) => {
        console.error(err);
        alert("Lỗi tra cứu: Không tìm thấy mã lịch hẹn " + lookupAppointmentId);
      })
      .finally(() => setLookupLoading(false));
  };

  // 6. Xử lý chuyển đổi loại tiếp đón
  const handleTypeChange = (selectedType) => {
    if (selectedType === "TrucTiep") {
      fetchNextPatientId();
      setFormData((prev) => ({
        ...prev,
        receptionType: selectedType,
        appointmentId: "",
        initialSymptoms: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        patientId: "",
        receptionType: selectedType,
        appointmentId: "",
        initialSymptoms: "",
      }));
    }
  };

  // 7. Gửi tiếp đón
  const handleSubmitReception = (e) => {
    e.preventDefault();

    if (!formData.receptionType) return alert("Vui lòng chọn Loại tiếp đón!");
    if (!formData.patientId) return alert("Chưa có mã bệnh nhân!");
    if (formData.receptionType === "TrucTiep" && !formData.patientName.trim()) {
      return alert("Vui lòng nhập Họ tên bệnh nhân mới!");
    }
    if (!formData.roomId) return alert("Vui lòng chọn Phòng khám!");
    if (!formData.doctorId) return alert("Vui lòng chọn Bác sĩ khám!");

    const payload = {
      ...formData,
      appointmentId:
        formData.receptionType === "HenTruoc" ? formData.appointmentId : null,
      pulse: formData.pulse ? parseInt(formData.pulse) : null,
      temperature: formData.temperature
        ? parseFloat(formData.temperature)
        : null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      height: formData.height ? parseFloat(formData.height) : null,
    };

    axios
      .post(RECEPTION_API, payload)
      .then((res) => {
        setCreatedSlip(res.data);
        fetchTodayQueue();
        alert(
          `Tiếp nhận thành công bệnh nhân: ${formData.patientName || formData.patientId}! STT: ${res.data.queueNumber}`,
        );
        // Reset form
        setFormData({
          patientId: "",
          employeeId: "NV001",
          roomId: "",
          doctorId: "",
          appointmentId: "",
          receptionDate: today,
          receptionType: "",
          initialSymptoms: "",
          patientName: "",
          patientPhone: "",
          patientGender: "Nam",
          patientDob: "",
          patientAddress: "",
          pulse: "",
          temperature: "",
          bloodPressure: "",
          weight: "",
          height: "",
        });
      })
      .catch((err) => {
        alert(err.response?.data?.message || "Lỗi khi tạo lượt tiếp đón!");
      });
  };

  return (
    <div className="reception-container">
      {/* CỘT TRÁI: FORM TIẾP NHẬN */}
      <div className="reception-left">
        <h2 className="panel-title">📋 TIẾP NHẬN BỆNH NHÂN TẠI QUẦY</h2>

        {/* Khung tra cứu mã hẹn LHxxx */}
        <div className="lookup-box">
          <label
            style={{ fontSize: "13px", fontWeight: "700", color: "#1e40af" }}
          >
            🔍 Tra Cứu Lịch Hẹn Đặt Trước:
          </label>
          <div className="lookup-input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Nhập mã lịch hẹn (Ví dụ: LH002)"
              value={lookupAppointmentId}
              onChange={(e) => setLookupAppointmentId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookupAppointment()}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleLookupAppointment}
              disabled={lookupLoading}
            >
              {lookupLoading ? "Đang tìm..." : "Tìm kiếm"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmitReception}>
          {/* DÒNG 1: MÃ BỆNH NHÂN & LOẠI TIẾP ĐÓN */}
          <div className="form-row">
            <div>
              <label className="input-label">Mã Bệnh Nhân (Hệ thống cấp)</label>
              <input
                type="text"
                className="form-control"
                value={formData.patientId}
                placeholder={
                  formData.receptionType === "HenTruoc"
                    ? "Mã BN theo phiếu hẹn"
                    : formData.receptionType === "TrucTiep"
                      ? "Đang cấp mã tự tăng..."
                      : "Vui lòng chọn loại tiếp đón hoặc tra mã hẹn"
                }
                readOnly
                style={{
                  backgroundColor: "#f1f5f9",
                  cursor: "not-allowed",
                  fontWeight: "bold",
                  color: formData.patientId ? "#1e3a8a" : "#94a3b8",
                }}
              />
            </div>

            <div>
              <label className="input-label">Loại Tiếp Đón *</label>
              <select
                className="form-control"
                value={formData.receptionType}
                onChange={(e) => handleTypeChange(e.target.value)}
                required
              >
                <option value="" disabled>
                  -- Chọn loại tiếp đón --
                </option>
                <option value="TrucTiep">Trực Tiếp</option>
                <option
                  value="HenTruoc"
                  disabled={formData.receptionType !== "HenTruoc"}
                >
                  Hẹn Trước
                </option>
                <option value="CapCuu">Cấp Cứu</option>
              </select>
            </div>
          </div>

          {/* DÒNG TIẾP THEO: HIỆN LIỀN MẠCH KHI CHỌN "TRỰC TIẾP" */}
          {formData.receptionType === "TrucTiep" && (
            <>
              <div className="form-row">
                <div>
                  <label className="input-label">Họ và Tên Bệnh Nhân *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={formData.patientName}
                    onChange={(e) =>
                      setFormData({ ...formData, patientName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Số Điện Thoại</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Ví dụ: 0912345678"
                    value={formData.patientPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, patientPhone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label className="input-label">Giới Tính</label>
                  <select
                    className="form-control"
                    value={formData.patientGender}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        patientGender: e.target.value,
                      })
                    }
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Ngày Sinh</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.patientDob}
                    onChange={(e) =>
                      setFormData({ ...formData, patientDob: e.target.value })
                    }
                  />
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label className="input-label">Địa Chỉ</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Số nhà, đường, phường/xã..."
                  value={formData.patientAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, patientAddress: e.target.value })
                  }
                />
              </div>
            </>
          )}

          {/* DÒNG: BÁC SĨ & PHÒNG KHÁM */}
          <div className="form-row">
            <div>
              <label className="input-label">Bác Sĩ Phụ Trách *</label>
              <select
                className="form-control"
                value={formData.doctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                required
              >
                <option value="">-- Chọn bác sĩ --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user?.fullName || d.fullName || d.name || "Bác sĩ"} (
                    {d.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label">Phòng Khám Chỉ Định *</label>
              <select
                className="form-control"
                value={formData.roomId}
                onChange={(e) =>
                  setFormData({ ...formData, roomId: e.target.value })
                }
                required
              >
                <option value="">-- Chọn phòng khám --</option>
                {rooms
                  .filter((r) => {
                    if (!formData.doctorId) return true;
                    const currentDoc = doctors.find(
                      (d) => String(d.id) === String(formData.doctorId),
                    );
                    const docDept =
                      currentDoc?.departmentId || currentDoc?.specialtyId;
                    const roomDept =
                      r.departmentId || r.specialtyId || r.machuyenkhoa;
                    return !docDept || String(roomDept) === String(docDept);
                  })
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roomName || r.name} ({r.id})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="input-label">Triệu Chứng / Lý Do Đến Khám</label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="Ghi nhận triệu chứng sơ bộ..."
              value={formData.initialSymptoms}
              onChange={(e) =>
                setFormData({ ...formData, initialSymptoms: e.target.value })
              }
            ></textarea>
          </div>

          {/* Vitals Grid */}
          <div style={{ marginTop: "14px" }}>
            <label className="input-label" style={{ color: "#0369a1" }}>
              🩺 Đo Chỉ Số Sinh Hiệu (Sinh Tồn):
            </label>
            <div className="vitals-grid">
              <div className="vital-item">
                <label>Mạch (lần/phút)</label>
                <input
                  type="number"
                  placeholder="80"
                  value={formData.pulse}
                  onChange={(e) =>
                    setFormData({ ...formData, pulse: e.target.value })
                  }
                />
              </div>
              <div className="vital-item">
                <label>Nhiệt Độ (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="37.0"
                  value={formData.temperature}
                  onChange={(e) =>
                    setFormData({ ...formData, temperature: e.target.value })
                  }
                />
              </div>
              <div className="vital-item">
                <label>Huyết Áp (mmHg)</label>
                <input
                  type="text"
                  placeholder="120/80"
                  value={formData.bloodPressure}
                  onChange={(e) =>
                    setFormData({ ...formData, bloodPressure: e.target.value })
                  }
                />
              </div>
              <div className="vital-item">
                <label>Cân Nặng (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="65.5"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: e.target.value })
                  }
                />
              </div>
              <div className="vital-item">
                <label>Chiều Cao (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="170"
                  value={formData.height}
                  onChange={(e) =>
                    setFormData({ ...formData, height: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: "20px" }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "12px" }}
            >
              ➕ Tiếp Nhận & Cấp Số Thứ Tự
            </button>
          </div>
        </form>
      </div>

      {/* CỘT PHẢI: HÀNG ĐỢI */}
      <div className="reception-right">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 className="panel-title" style={{ margin: 0, border: "none" }}>
            👥 HÀNG ĐỢI KHÁM HÔM NAY ({queueList.length})
          </h2>
          <button
            className="btn btn-secondary"
            onClick={fetchTodayQueue}
            style={{ padding: "6px 12px" }}
          >
            🔄 Làm Mới
          </button>
        </div>

        <div className="queue-filter-bar" style={{ marginTop: "12px" }}>
          <select
            className="form-control"
            value={filterRoomId}
            onChange={(e) => setFilterRoomId(e.target.value)}
          >
            <option value="">-- Tất Cả Các Phòng Khám --</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.roomName || r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="queue-table-wrapper">
          <table className="queue-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã Tiếp Đón</th>
                <th>Bệnh Nhân</th>
                <th>Phòng</th>
                <th>Bác Sĩ</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {queueList
                .filter((item) => !filterRoomId || item.roomId === filterRoomId)
                .map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="stt-badge">{item.queueNumber}</span>
                    </td>
                    <td>
                      <b>{item.id}</b>
                    </td>
                    <td>{item.patientId}</td>
                    <td>{item.roomId}</td>
                    <td>{item.doctorId}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          item.queueStatus === "ChoKham"
                            ? "status-chokham"
                            : item.queueStatus === "DangKham"
                              ? "status-dangkham"
                              : "status-dakham"
                        }`}
                      >
                        {item.queueStatus}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL XEM & IN PHIẾU KHÁM BỆNH */}
      {createdSlip && (
        <div className="modal-overlay">
          <div className="slip-card">
            <h3 style={{ margin: "0 0 4px 0", color: "#1e3a8a" }}>
              PHIẾU KHÁM BỆNH
            </h3>
            <p
              style={{
                margin: "0 0 10px 0",
                fontSize: "12px",
                color: "#64748b",
              }}
            >
              Phòng Khám Đa Khoa
            </p>
            <hr style={{ border: "none", borderTop: "1px dashed #cbd5e1" }} />

            <div
              style={{ fontSize: "13px", color: "#475569", marginTop: "10px" }}
            >
              SỐ THỨ TỰ CỦA BẠN
            </div>
            <div className="slip-number">{createdSlip.queueNumber}</div>

            <div
              style={{ textAlign: "left", fontSize: "13px", lineHeight: "1.8" }}
            >
              <div>
                <b>Mã Tiếp Đón:</b> {createdSlip.id}
              </div>
              <div>
                <b>Bệnh Nhân:</b> {createdSlip.patientId}
              </div>
              <div>
                <b>Phòng Khám:</b> {createdSlip.roomId}
              </div>
              <div>
                <b>Bác Sĩ Trực:</b> {createdSlip.doctorId}
              </div>
              <div>
                <b>Ngày Khám:</b> {createdSlip.receptionDate}
              </div>
            </div>

            <div
              style={{
                marginTop: "18px",
                display: "flex",
                gap: "8px",
                justifyContent: "center",
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setCreatedSlip(null)}
              >
                Đóng
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  window.print();
                  setCreatedSlip(null);
                }}
              >
                🖨️ In Phiếu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReceptionPage;

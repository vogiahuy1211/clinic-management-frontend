import axios from "axios";
import { useEffect, useState } from "react";

const SCHEDULE_API = "http://localhost:8080/api/doctor-schedules";
const DOCTOR_API = "http://localhost:8080/api/doctors";
const ROOM_API = "http://localhost:8080/api/rooms";

function SchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const initialFormData = {
    doctorId: "",
    roomId: "",
    examinationDate: today,
    startTime: "07:30",
    endTime: "11:30",
    maxPatients: 30,
    status: "MoDangKy",
  };

  // State cho form Thêm mới bên trái
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  // State quản lý Modal Sửa
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(initialFormData);
  const [editErrors, setEditErrors] = useState({});
  const [editAvailableRooms, setEditAvailableRooms] = useState([]);
  const [editLoadingRooms, setEditLoadingRooms] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  const fetchSchedules = () => {
    axios
      .get(SCHEDULE_API)
      .then((res) => {
        setSchedules(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSchedules();

    axios
      .get(DOCTOR_API)
      .then((res) => setDoctors(res.data))
      .catch((err) => console.error("Lỗi nạp bác sĩ:", err));
  }, []);

  // Nút Làm mới: xóa trắng form thêm và tải lại danh sách
  const handleFullRefresh = () => {
    setLoading(true);
    fetchSchedules();
    setFormData(initialFormData);
    setAvailableRooms([]);
    setErrors({});
  };

  // Helper lọc phòng theo bác sĩ
  const fetchRoomsForDoctor = async (doctorId) => {
    if (!doctorId) return [];
    const doc = doctors.find((d) => d.id === doctorId);
    const specialtyId = doc?.departmentId || doc?.specialtyId;
    if (specialtyId) {
      try {
        const res = await axios.get(`${ROOM_API}/by-specialty/${specialtyId}`);
        return res.data;
      } catch (err) {
        console.error("Lỗi tải phòng:", err);
        return [];
      }
    }
    return [];
  };

  // Xử lý đổi bác sĩ trên Form Thêm Mới
  const handleDoctorChange = async (e) => {
    const selectedDoctorId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      doctorId: selectedDoctorId,
      roomId: "",
    }));
    if (errors.doctorId) setErrors((prev) => ({ ...prev, doctorId: "" }));

    setLoadingRooms(true);
    const rooms = await fetchRoomsForDoctor(selectedDoctorId);
    setAvailableRooms(rooms);
    setLoadingRooms(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Validation chung
  const validate = (data) => {
    const errs = {};
    if (!data.doctorId) errs.doctorId = "Vui lòng chọn bác sĩ";
    if (!data.roomId) errs.roomId = "Vui lòng chọn phòng khám";
    if (!data.examinationDate) errs.examinationDate = "Vui lòng chọn ngày khám";
    if (!data.startTime) errs.startTime = "Vui lòng chọn giờ bắt đầu";
    if (!data.endTime) errs.endTime = "Vui lòng chọn giờ kết thúc";
    if (data.startTime && data.endTime && data.startTime >= data.endTime) {
      errs.endTime = "Giờ kết thúc phải sau giờ bắt đầu";
    }
    const patients = Number(data.maxPatients);
    if (!data.maxPatients || isNaN(patients) || patients <= 0) {
      errs.maxPatients = "Số BN tối đa phải lớn hơn 0";
    }
    return errs;
  };

  const formatTimePayload = (t) => (t && t.length === 5 ? `${t}:00` : t);

  // Thêm lịch trực mới
  const handleCreateSchedule = (e) => {
    e.preventDefault();
    const valErrors = validate(formData);
    if (Object.keys(valErrors).length > 0) {
      setErrors(valErrors);
      return;
    }

    const payload = {
      doctor: { id: formData.doctorId },
      roomId: formData.roomId,
      examinationDate: formData.examinationDate,
      startTime: formatTimePayload(formData.startTime),
      endTime: formatTimePayload(formData.endTime),
      maxPatients: Number(formData.maxPatients),
      status: formData.status,
      deleted: false,
    };

    axios
      .post(SCHEDULE_API, payload)
      .then(() => {
        alert("Thêm lịch trực thành công!");
        setFormData(initialFormData);
        setAvailableRooms([]);
        setErrors({});
        fetchSchedules();
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.message || "Lỗi thêm lịch trực!");
      });
  };

  // Mở Modal Sửa khi click nút Sửa ở từng dòng
  const handleOpenEditModal = async (item) => {
    setEditingScheduleId(item.id);
    const docId = item.doctor?.id || "";

    setEditLoadingRooms(true);
    const rooms = await fetchRoomsForDoctor(docId);
    setEditAvailableRooms(rooms);
    setEditLoadingRooms(false);

    const cleanTime = (t) => (t && t.length >= 5 ? t.substring(0, 5) : t || "");

    setEditFormData({
      doctorId: docId,
      roomId: item.roomId || "",
      examinationDate: item.examinationDate || today,
      startTime: cleanTime(item.startTime),
      endTime: cleanTime(item.endTime),
      maxPatients: item.maxPatients || 30,
      status: item.status || "MoDangKy",
    });
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  // Đổi bác sĩ trong Modal Sửa
  const handleEditDoctorChange = async (e) => {
    const selectedDoctorId = e.target.value;
    setEditFormData((prev) => ({
      ...prev,
      doctorId: selectedDoctorId,
      roomId: "",
    }));
    if (editErrors.doctorId)
      setEditErrors((prev) => ({ ...prev, doctorId: "" }));

    setEditLoadingRooms(true);
    const rooms = await fetchRoomsForDoctor(selectedDoctorId);
    setEditAvailableRooms(rooms);
    setEditLoadingRooms(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    if (editErrors[name]) setEditErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Lưu cập nhật từ Modal
  const handleSaveEdit = (e) => {
    e.preventDefault();
    const valErrors = validate(editFormData);
    if (Object.keys(valErrors).length > 0) {
      setEditErrors(valErrors);
      return;
    }

    const payload = {
      id: editingScheduleId,
      doctor: { id: editFormData.doctorId },
      roomId: editFormData.roomId,
      examinationDate: editFormData.examinationDate,
      startTime: formatTimePayload(editFormData.startTime),
      endTime: formatTimePayload(editFormData.endTime),
      maxPatients: Number(editFormData.maxPatients),
      status: editFormData.status,
      deleted: false,
    };

    axios
      .put(`${SCHEDULE_API}/${editingScheduleId}`, payload)
      .then(() => {
        alert(`Cập nhật lịch ${editingScheduleId} thành công!`);
        setIsEditModalOpen(false);
        fetchSchedules();
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.message || "Lỗi cập nhật lịch trực!");
      });
  };

  const handleDeleteSchedule = (id) => {
    if (window.confirm(`Xác nhận xóa lịch trực ${id}?`)) {
      axios
        .delete(`${SCHEDULE_API}/${id}`)
        .then(() => {
          alert("Xóa thành công!");
          fetchSchedules();
        })
        .catch(() => alert("Lỗi xóa lịch trực!"));
    }
  };

  const filteredSchedules = schedules.filter((item) => {
    const query = searchTerm.toLowerCase();
    const scheduleId = item.id ? String(item.id).toLowerCase() : "";
    const roomId = item.roomId ? item.roomId.toLowerCase() : "";
    const doctorId =
      item.doctor && item.doctor.id ? item.doctor.id.toLowerCase() : "";
    return (
      scheduleId.includes(query) ||
      roomId.includes(query) ||
      doctorId.includes(query)
    );
  });

  return (
    <div className="schedule-container">
      {/* Header */}
      <div className="schedule-header">
        <div>
          <h1>PHÒNG KHÁM ĐA KHOA</h1>
          <p>Quản lý lịch trực khám bệnh</p>
        </div>
        <button className="btn-refresh" onClick={handleFullRefresh}>
          🔄 Làm mới
        </button>
      </div>

      <div className="schedule-content">
        {/* Box Form Thêm mới */}
        <div className="card-box" style={{ height: "fit-content" }}>
          <h2 className="card-title">Tạo Lịch Trực Mới</h2>
          <form
            className="form-group"
            onSubmit={handleCreateSchedule}
            noValidate
          >
            <div>
              <label className="input-label">Bác Sĩ *</label>
              <select
                className={`form-control ${errors.doctorId ? "input-error" : ""}`}
                name="doctorId"
                value={formData.doctorId}
                onChange={handleDoctorChange}
              >
                <option value="">-- Chọn bác sĩ --</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.id} -{" "}
                    {doc.fullName ||
                      doc.name ||
                      (doc.user && doc.user.fullName) ||
                      "Bác sĩ"}
                  </option>
                ))}
              </select>
              {errors.doctorId && (
                <span className="error-text">{errors.doctorId}</span>
              )}
            </div>

            <div>
              <label className="input-label">Phòng Khám *</label>
              <select
                className={`form-control ${errors.roomId ? "input-error" : ""}`}
                name="roomId"
                value={formData.roomId}
                onChange={handleChange}
                disabled={!formData.doctorId || loadingRooms}
              >
                <option value="">
                  {loadingRooms
                    ? "-- Đang tải phòng... --"
                    : !formData.doctorId
                      ? "-- Vui lòng chọn Bác sĩ trước --"
                      : availableRooms.length === 0
                        ? "-- Không có phòng cùng chuyên khoa --"
                        : "-- Chọn phòng khám --"}
                </option>
                {availableRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} - {r.roomName}
                  </option>
                ))}
              </select>
              {errors.roomId && (
                <span className="error-text">{errors.roomId}</span>
              )}
            </div>

            <div>
              <label className="input-label">Ngày Khám *</label>
              <input
                className={`form-control ${errors.examinationDate ? "input-error" : ""}`}
                type="date"
                name="examinationDate"
                value={formData.examinationDate}
                onChange={handleChange}
              />
              {errors.examinationDate && (
                <span className="error-text">{errors.examinationDate}</span>
              )}
            </div>

            <div className="form-row">
              <div>
                <label className="input-label">Giờ Bắt Đầu *</label>
                <input
                  className={`form-control ${errors.startTime ? "input-error" : ""}`}
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                />
                {errors.startTime && (
                  <span className="error-text">{errors.startTime}</span>
                )}
              </div>
              <div>
                <label className="input-label">Giờ Kết Thúc *</label>
                <input
                  className={`form-control ${errors.endTime ? "input-error" : ""}`}
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                />
                {errors.endTime && (
                  <span className="error-text">{errors.endTime}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div>
                <label className="input-label">BN Tối Đa *</label>
                <input
                  className={`form-control ${errors.maxPatients ? "input-error" : ""}`}
                  type="number"
                  name="maxPatients"
                  min="1"
                  max="100"
                  value={formData.maxPatients}
                  onChange={handleChange}
                />
                {errors.maxPatients && (
                  <span className="error-text">{errors.maxPatients}</span>
                )}
              </div>
              <div>
                <label className="input-label">Trạng Thái</label>
                <select
                  className="form-control"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="MoDangKy">MoDangKy</option>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="DaDay">DaDay</option>
                  <option value="Huy">Huy</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-submit">
              + Thêm Lịch Trực
            </button>
          </form>
        </div>

        {/* Khối danh sách */}
        <div className="card-box-table">
          <div className="table-header-bar">
            <h2
              style={{
                fontSize: "18px",
                margin: 0,
                color: "#0d47a1",
                fontWeight: 600,
              }}
            >
              Danh Sách Lịch Trực
            </h2>
            <input
              type="text"
              className="search-input"
              placeholder="Tìm theo mã lịch, phòng, bác sĩ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="table-scroll-wrapper">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Mã Lịch</th>
                  <th>Phòng</th>
                  <th>Bác Sĩ</th>
                  <th>Ngày Khám</th>
                  <th>Khung Giờ</th>
                  <th>Tối Đa</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="8"
                      style={{
                        textAlign: "center",
                        padding: "24px",
                        color: "#64748b",
                      }}
                    >
                      Đang nạp dữ liệu...
                    </td>
                  </tr>
                ) : filteredSchedules.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      style={{
                        textAlign: "center",
                        padding: "24px",
                        color: "#64748b",
                      }}
                    >
                      Không tìm thấy lịch trực phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>
                        <span className="badge-room">{item.roomId}</span>
                      </td>
                      <td>{item.doctor ? item.doctor.id : "N/A"}</td>
                      <td>{item.examinationDate}</td>
                      <td style={{ color: "#546e7a" }}>
                        {item.startTime} - {item.endTime}
                      </td>
                      <td>{item.maxPatients} BN</td>
                      <td>
                        <span
                          className={`badge-status ${
                            item.status === "MoDangKy" ||
                            item.status === "AVAILABLE"
                              ? "badge-available"
                              : "badge-other"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            justifyContent: "center",
                          }}
                        >
                          <button
                            className="btn-edit-action"
                            onClick={() => handleOpenEditModal(item)}
                          >
                            Sửa
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteSchedule(item.id)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==============================================================
          MODAL POP-UP SỬA LỊCH TRỰC
          ============================================================== */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Chỉnh Sửa Lịch Trực ({editingScheduleId})</h3>
              <button
                className="btn-close-modal"
                onClick={() => setIsEditModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form className="form-group" onSubmit={handleSaveEdit} noValidate>
              <div>
                <label className="input-label">Bác Sĩ *</label>
                <select
                  className={`form-control ${editErrors.doctorId ? "input-error" : ""}`}
                  name="doctorId"
                  value={editFormData.doctorId}
                  onChange={handleEditDoctorChange}
                >
                  <option value="">-- Chọn bác sĩ --</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.id} -{" "}
                      {doc.fullName ||
                        doc.name ||
                        (doc.user && doc.user.fullName) ||
                        "Bác sĩ"}
                    </option>
                  ))}
                </select>
                {editErrors.doctorId && (
                  <span className="error-text">{editErrors.doctorId}</span>
                )}
              </div>

              <div>
                <label className="input-label">Phòng Khám *</label>
                <select
                  className={`form-control ${editErrors.roomId ? "input-error" : ""}`}
                  name="roomId"
                  value={editFormData.roomId}
                  onChange={handleEditChange}
                  disabled={!editFormData.doctorId || editLoadingRooms}
                >
                  <option value="">
                    {editLoadingRooms
                      ? "-- Đang tải phòng... --"
                      : !editFormData.doctorId
                        ? "-- Vui lòng chọn Bác sĩ trước --"
                        : editAvailableRooms.length === 0
                          ? "-- Không có phòng cùng chuyên khoa --"
                          : "-- Chọn phòng khám --"}
                  </option>
                  {editAvailableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id} - {r.roomName}
                    </option>
                  ))}
                </select>
                {editErrors.roomId && (
                  <span className="error-text">{editErrors.roomId}</span>
                )}
              </div>

              <div>
                <label className="input-label">Ngày Khám *</label>
                <input
                  className={`form-control ${editErrors.examinationDate ? "input-error" : ""}`}
                  type="date"
                  name="examinationDate"
                  value={editFormData.examinationDate}
                  onChange={handleEditChange}
                />
                {editErrors.examinationDate && (
                  <span className="error-text">
                    {editErrors.examinationDate}
                  </span>
                )}
              </div>

              <div className="form-row">
                <div>
                  <label className="input-label">Giờ Bắt Đầu *</label>
                  <input
                    className={`form-control ${editErrors.startTime ? "input-error" : ""}`}
                    type="time"
                    name="startTime"
                    value={editFormData.startTime}
                    onChange={handleEditChange}
                  />
                  {editErrors.startTime && (
                    <span className="error-text">{editErrors.startTime}</span>
                  )}
                </div>
                <div>
                  <label className="input-label">Giờ Kết Thúc *</label>
                  <input
                    className={`form-control ${editErrors.endTime ? "input-error" : ""}`}
                    type="time"
                    name="endTime"
                    value={editFormData.endTime}
                    onChange={handleEditChange}
                  />
                  {editErrors.endTime && (
                    <span className="error-text">{editErrors.endTime}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label className="input-label">BN Tối Đa *</label>
                  <input
                    className={`form-control ${editErrors.maxPatients ? "input-error" : ""}`}
                    type="number"
                    name="maxPatients"
                    min="1"
                    max="100"
                    value={editFormData.maxPatients}
                    onChange={handleEditChange}
                  />
                  {editErrors.maxPatients && (
                    <span className="error-text">{editErrors.maxPatients}</span>
                  )}
                </div>
                <div>
                  <label className="input-label">Trạng Thái</label>
                  <select
                    className="form-control"
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditChange}
                  >
                    <option value="MoDangKy">MoDangKy</option>
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="DaDay">DaDay</option>
                    <option value="Huy">Huy</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-save">
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchedulePage;

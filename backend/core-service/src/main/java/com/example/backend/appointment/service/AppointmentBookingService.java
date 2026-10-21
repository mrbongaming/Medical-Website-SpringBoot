package com.example.backend.appointment.service;

import com.example.backend.appointment.dto.CreateAppointmentRequest;
import com.example.backend.schedule.DoctorAvailabilityService;
import com.example.backend.user.ProfileController;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AppointmentBookingService {
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private final JdbcTemplate jdbc;
    private final DoctorAvailabilityService availability;
    private final ProfileController profiles;

    public AppointmentBookingService(JdbcTemplate jdbc, DoctorAvailabilityService availability,
            ProfileController profiles) {
        this.jdbc = jdbc;
        this.availability = availability;
        this.profiles = profiles;
    }

    @Transactional
    public String book(CreateAppointmentRequest request, Jwt jwt) {
        if (!"PATIENT".equals(jwt.getClaimAsString("role"))) bad("Chỉ tài khoản bệnh nhân được đặt lịch.");
        var today = LocalDate.now(ZONE);
        if (!request.date().isAfter(today) || request.date().isAfter(today.plusDays(119)))
            bad("Ngày khám phải nằm trong 119 ngày tới.");
        if (!request.phone().matches("0[0-9]{9}")) bad("Số điện thoại không hợp lệ.");
        if (request.patientName().isBlank()) bad("Cần nhập tên người khám.");
        var relative = "relative".equals(request.recipientType());
        if (!relative && !"self".equals(request.recipientType())) bad("Người khám không hợp lệ.");
        if (relative && (request.relationship() == null || request.relationship().isBlank()
                || request.patientBirthDate() == null || request.patientAddress() == null
                || request.patientAddress().isBlank())) bad("Thiếu thông tin người thân.");
        if (request.patientBirthDate() != null && request.patientBirthDate().isAfter(today))
            bad("Ngày sinh không hợp lệ.");

        var branch = jdbc.query("select id from branches where id = ? and active = true",
                (rs, i) -> rs.getString(1), request.branchId());
        if (branch.isEmpty()) bad("Cơ sở không còn hoạt động.");
        var department = jdbc.query("select id from departments where branch_id = ? and specialty_id = ? and active = true limit 1",
                (rs, i) -> rs.getString(1), request.branchId(), request.specialtyId());
        if (department.isEmpty()) bad("Chuyên khoa không có tại cơ sở này.");

        String mode;
        BigDecimal price;
        String serviceName;
        String doctorId = request.doctorId() == null || request.doctorId().isBlank() ? null : request.doctorId();
        String packageId = request.packageId() == null || request.packageId().isBlank() ? null : request.packageId();
        if (packageId != null) {
            var packages = jdbc.query("select p.name, p.price from exam_packages p join package_branches pb on pb.package_id = p.id "
                    + "where p.id = ? and p.specialty_id = ? and pb.branch_id = ? and p.active = true",
                    (rs, i) -> new Offer(rs.getString(1), rs.getBigDecimal(2)),
                    packageId, request.specialtyId(), request.branchId());
            if (packages.isEmpty()) bad("Gói khám không có tại cơ sở này.");
            serviceName = packages.getFirst().name();
            price = packages.getFirst().price();
        } else {
            var specialties = jdbc.query("select name from specialties where id = ? and active = true",
                    (rs, i) -> rs.getString(1), request.specialtyId());
            if (specialties.isEmpty()) bad("Chuyên khoa không còn hoạt động.");
            serviceName = specialties.getFirst();
            price = null;
        }
        if (doctorId != null) {
            // Lock the doctor row so concurrent requests for the same slot are serialized.
            var doctors = jdbc.query("select price from doctors where id = ? and branch_id = ? "
                    + "and specialty_id = ? and active = true for update",
                    (rs, i) -> rs.getBigDecimal(1), doctorId, request.branchId(), request.specialtyId());
            if (doctors.isEmpty()) bad("Bác sĩ không có tại cơ sở này.");
            if (request.time() == null) bad("Cần chọn giờ khám.");
            // An expired hold must release the unique slot before checking availability.
            jdbc.update("update appointments set status = 'cancelled', payment_status = 'expired' "
                    + "where doctor_id = ? and appointment_date = ? and appointment_time = ? "
                    + "and status = 'awaiting_payment' and payment_status = 'pending' "
                    + "and slot_hold_expires_at < current_timestamp(6)",
                    doctorId, request.date(), request.time());
            var available = availability.preview().stream().anyMatch(day ->
                    day.doctorId().equals(doctorId) && day.date().equals(request.date())
                            && day.times().contains(request.time()));
            if (!available) bad("Khung giờ đã được đặt hoặc không còn khả dụng.");
            mode = "doctor";
            if (price == null) price = doctors.getFirst();
        } else {
            if (packageId == null) bad("Vui lòng chọn bác sĩ hoặc gói khám.");
            mode = "facility";
        }
        if (price == null || price.signum() <= 0) bad("Giá dịch vụ không hợp lệ.");
        profiles.ensureAccount(jwt);
        if (!relative) jdbc.update("update user_accounts set phone = coalesce(phone, ?), "
                + "birth_date = coalesce(birth_date, ?), address = coalesce(address, ?) where id = ?",
                request.phone(), request.patientBirthDate(), request.patientAddress(), jwt.getSubject());
        var id = "AT-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        try {
            jdbc.update("insert into appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, "
                    + "specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, "
                    + "service_name, quoted_price, payment_status, prepayment_amount, slot_hold_expires_at, "
                    + "duration_minutes, notes, created_at, version) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "
                    + "'awaiting_payment', ?, ?, 'pending', ?, date_add(current_timestamp(6), interval 15 minute), "
                    + "30, ?, current_timestamp(6), 0)", id, jwt.getSubject(), request.branchId(), doctorId,
                    department.getFirst(), request.specialtyId(), packageId, mode, request.date(), request.time(),
                    serviceName, price, price, request.notes());
        } catch (DataIntegrityViolationException conflict) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Khung giờ vừa được đặt. Vui lòng chọn giờ khác.");
        }
        jdbc.update("insert into appointment_recipients (appointment_id, recipient_type, relationship, "
                + "full_name, phone, birth_date, address) values (?, ?, ?, ?, ?, ?, ?)", id,
                request.recipientType(), request.relationship(), request.patientName(), request.phone(),
                request.patientBirthDate(), request.patientAddress());
        return id;
    }

    private static void bad(String message) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private record Offer(String name, BigDecimal price) {}
}

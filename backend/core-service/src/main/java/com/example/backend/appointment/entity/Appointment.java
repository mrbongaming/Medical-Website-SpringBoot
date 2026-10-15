package com.example.backend.appointment.entity;

import com.example.backend.exampackage.entity.ExamPackage;
import com.example.backend.branch.entity.Branch;
import com.example.backend.department.entity.Department;
import com.example.backend.doctor.entity.Doctor;
import com.example.backend.specialty.entity.Specialty;
import com.example.backend.user.entity.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {
    @Id private String id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "booked_by_user_id") private UserAccount bookedBy;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "branch_id") private Branch branch;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "doctor_id") private Doctor doctor;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "department_id") private Department department;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "specialty_id") private Specialty specialty;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "package_id") private ExamPackage examPackage;
    @Column(name = "booking_mode") private String bookingMode;
    @Column(name = "appointment_date") private LocalDate appointmentDate;
    @Column(name = "appointment_time") private LocalTime appointmentTime;
    private String status;
    @Column(name = "service_name") private String serviceName;
    @Column(name = "quoted_price") private BigDecimal quotedPrice;
    @Column(name = "duration_minutes") private int durationMinutes;
    @Column(columnDefinition = "text") private String reason;
    @Column(columnDefinition = "text") private String notes;
    private Integer rating;
    @Column(name = "created_at") private OffsetDateTime createdAt;
    @Column(name = "reviewed_at") private OffsetDateTime reviewedAt;
    @Column(name = "reviewed_by") private String reviewedBy;
    @Version private long version;

    protected Appointment() {}

    public String getId() { return id; }
    public UserAccount getBookedBy() { return bookedBy; }
    public Branch getBranch() { return branch; }
    public Doctor getDoctor() { return doctor; }
    public Department getDepartment() { return department; }
    public Specialty getSpecialty() { return specialty; }
    public ExamPackage getExamPackage() { return examPackage; }
    public String getBookingMode() { return bookingMode; }
    public LocalDate getAppointmentDate() { return appointmentDate; }
    public LocalTime getAppointmentTime() { return appointmentTime; }
    public String getStatus() { return status; }
    public String getServiceName() { return serviceName; }
    public BigDecimal getQuotedPrice() { return quotedPrice; }
    public int getDurationMinutes() { return durationMinutes; }
    public String getReason() { return reason; }
    public String getNotes() { return notes; }
    public Integer getRating() { return rating; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}

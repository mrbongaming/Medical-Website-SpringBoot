package com.example.backend.schedule.entity;

import com.example.backend.branch.entity.Branch;
import com.example.backend.doctor.entity.Doctor;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "doctor_schedule_exceptions")
public class DoctorScheduleException {
    @Id private String id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "branch_id") private Branch branch;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "doctor_id") private Doctor doctor;
    @Column(name = "exception_date") private LocalDate exceptionDate;
    private String kind;
    @Column(name = "start_time") private LocalTime startTime;
    @Column(name = "end_time") private LocalTime endTime;
    @Column(name = "slot_minutes") private Integer slotMinutes;
    @Column(columnDefinition = "text") private String reason;

    protected DoctorScheduleException() {}

    public String getId() { return id; }
    public Branch getBranch() { return branch; }
    public Doctor getDoctor() { return doctor; }
    public LocalDate getExceptionDate() { return exceptionDate; }
    public String getKind() { return kind; }
    public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; }
    public Integer getSlotMinutes() { return slotMinutes; }
    public String getReason() { return reason; }
}

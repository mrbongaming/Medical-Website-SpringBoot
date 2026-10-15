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

@Entity
@Table(name = "doctor_schedules")
public class DoctorSchedule {
    @Id private String id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "branch_id") private Branch branch;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "doctor_id") private Doctor doctor;
    @Column(name = "schedule_date") private LocalDate scheduleDate;

    protected DoctorSchedule() {}

    public String getId() { return id; }
    public Branch getBranch() { return branch; }
    public Doctor getDoctor() { return doctor; }
    public LocalDate getScheduleDate() { return scheduleDate; }
}

package com.example.backend.appointment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "appointment_recipients")
public class AppointmentRecipient {
    @Id @Column(name = "appointment_id") private String appointmentId;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", insertable = false, updatable = false)
    private Appointment appointment;
    @Column(name = "recipient_type") private String recipientType;
    private String relationship;
    @Column(name = "full_name") private String fullName;
    private String phone;
    @Column(name = "birth_date") private LocalDate birthDate;
    private String address;

    protected AppointmentRecipient() {}

    public String getAppointmentId() { return appointmentId; }
    public String getRecipientType() { return recipientType; }
    public String getRelationship() { return relationship; }
    public String getFullName() { return fullName; }
    public String getPhone() { return phone; }
    public LocalDate getBirthDate() { return birthDate; }
    public String getAddress() { return address; }
}

package com.example.backend.user.entity;

import com.example.backend.branch.entity.Branch;
import com.example.backend.doctor.entity.Doctor;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.LocalDate;

@Entity
@Table(name = "user_accounts")
public class UserAccount {
    @Id private String id;
    private String name;
    private String role;
    private String phone;
    @Column(name = "password_hash") private String passwordHash;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "branch_id") private Branch branch;
    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name = "doctor_id") private Doctor doctor;
    private String address;
    @Column(name = "birth_date") private LocalDate birthDate;
    private boolean active;
    @Version private long version;

    protected UserAccount() {}

    public String getId() { return id; }
    public String getName() { return name; }
    public String getRole() { return role; }
    public String getPhone() { return phone; }
    public String getPasswordHash() { return passwordHash; }
    public Branch getBranch() { return branch; }
    public Doctor getDoctor() { return doctor; }
    public String getAddress() { return address; }
    public LocalDate getBirthDate() { return birthDate; }
    public boolean isActive() { return active; }
}

package com.example.backend.department.entity;

import com.example.backend.branch.entity.Branch;
import com.example.backend.specialty.entity.Specialty;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "departments")
public class Department {
    @Id private String id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "branch_id") private Branch branch;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "specialty_id") private Specialty specialty;
    private String name;
    private boolean active;

    protected Department() {}

    public String getId() { return id; }
    public Branch getBranch() { return branch; }
    public Specialty getSpecialty() { return specialty; }
    public String getName() { return name; }
    public boolean isActive() { return active; }
}

package com.example.backend.doctor.entity;

import com.example.backend.branch.entity.Branch;
import com.example.backend.department.entity.Department;
import com.example.backend.specialty.entity.Specialty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "doctors")
public class Doctor {
    @Id private String id;
    private String slug;
    private String name;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "branch_id") private Branch branch;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "department_id") private Department department;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "specialty_id") private Specialty specialty;
    private int experience;
    private String qualification;
    @Column(name = "contact_phone") private String contactPhone;
    private String image;
    @Column(columnDefinition = "text") private String bio;
    private BigDecimal price;
    private boolean active;
    @Version private long version;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "json") private String details;

    protected Doctor() {}

    public String getId() { return id; }
    public String getSlug() { return slug; }
    public String getName() { return name; }
    public Branch getBranch() { return branch; }
    public Department getDepartment() { return department; }
    public Specialty getSpecialty() { return specialty; }
    public int getExperience() { return experience; }
    public String getQualification() { return qualification; }
    public String getContactPhone() { return contactPhone; }
    public String getImage() { return image; }
    public String getBio() { return bio; }
    public BigDecimal getPrice() { return price; }
    public boolean isActive() { return active; }
}

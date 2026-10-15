package com.example.backend.branch.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "branches")
public class Branch {
    @Id private String id;
    private String slug;
    private String name;
    private String address;
    private String phone;
    private String image;
    private String hours;
    @Column(columnDefinition = "text") private String description;
    @Column(name = "service_open") private LocalTime serviceOpen;
    @Column(name = "service_close") private LocalTime serviceClose;
    @Column(name = "insurance_contract") private boolean insuranceContract;
    private boolean active;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "json") private String details;

    protected Branch() {}

    public String getId() { return id; }
    public String getSlug() { return slug; }
    public String getName() { return name; }
    public String getAddress() { return address; }
    public String getPhone() { return phone; }
    public String getImage() { return image; }
    public String getHours() { return hours; }
    public String getDescription() { return description; }
    public LocalTime getServiceOpen() { return serviceOpen; }
    public LocalTime getServiceClose() { return serviceClose; }
    public boolean isInsuranceContract() { return insuranceContract; }
    public boolean isActive() { return active; }
}

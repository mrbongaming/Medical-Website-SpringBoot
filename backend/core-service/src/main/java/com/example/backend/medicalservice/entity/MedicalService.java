package com.example.backend.medicalservice.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "medical_services")
public class MedicalService {
    @Id private String id;
    private String name;
    private BigDecimal price;
    private boolean discountable;
    private boolean active;

    protected MedicalService() {}

    public String getId() { return id; }
    public String getName() { return name; }
    public BigDecimal getPrice() { return price; }
    public boolean isDiscountable() { return discountable; }
    public boolean isActive() { return active; }
}

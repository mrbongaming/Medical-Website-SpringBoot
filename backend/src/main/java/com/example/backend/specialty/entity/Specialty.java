package com.example.backend.specialty.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "specialties")
public class Specialty {
    @Id private String id;
    private String name;
    private boolean active;

    protected Specialty() {}

    public String getId() { return id; }
    public String getName() { return name; }
    public boolean isActive() { return active; }
}

package com.example.backend.exampackage.entity;

import com.example.backend.specialty.entity.Specialty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "exam_packages")
public class ExamPackage {
    @Id private String id;
    private String slug;
    private String name;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "specialty_id") private Specialty specialty;
    private BigDecimal price;
    @Column(columnDefinition = "text") private String contents;
    private boolean active;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "json") private String details;

    protected ExamPackage() {}

    public String getId() { return id; }
    public String getSlug() { return slug; }
    public String getName() { return name; }
    public Specialty getSpecialty() { return specialty; }
    public BigDecimal getPrice() { return price; }
    public String getContents() { return contents; }
    public boolean isActive() { return active; }
}

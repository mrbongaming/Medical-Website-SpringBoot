package com.example.backend.medicine.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "medicines")
public class Medicine {
    @Id private String id;
    private String code;
    private String name;
    @Column(name = "active_ingredient") private String activeIngredient;
    @Column(name = "medicine_group") private String group;
    @Column(name = "dosage_form") private String form;
    private String unit;
    @Column(name = "sale_price") private BigDecimal salePrice;
    private boolean active;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "json") private String insurance;

    protected Medicine() {}

    public String getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getActiveIngredient() { return activeIngredient; }
    public String getGroup() { return group; }
    public String getForm() { return form; }
    public String getUnit() { return unit; }
    public BigDecimal getSalePrice() { return salePrice; }
    public boolean isActive() { return active; }
}

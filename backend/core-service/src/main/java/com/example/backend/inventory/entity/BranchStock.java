package com.example.backend.inventory.entity;

import com.example.backend.branch.entity.Branch;
import com.example.backend.medicine.entity.Medicine;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "branch_stocks")
public class BranchStock {
    @Id private String id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "branch_id") private Branch branch;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "medicine_id") private Medicine medicine;
    private int quantity;
    private int reserved;
    @Version private long version;

    protected BranchStock() {}

    public String getId() { return id; }
    public Branch getBranch() { return branch; }
    public Medicine getMedicine() { return medicine; }
    public int getQuantity() { return quantity; }
    public int getReserved() { return reserved; }
    public int getAvailable() { return quantity - reserved; }
}

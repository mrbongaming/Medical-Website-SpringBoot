package com.example.backend.branch.repository;

import com.example.backend.branch.entity.Branch;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BranchRepository extends JpaRepository<Branch, String> {
    List<Branch> findAllByActiveTrueOrderByName();
}

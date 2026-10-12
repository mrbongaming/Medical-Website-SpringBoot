package com.example.backend.branch.service;

import com.example.backend.branch.dto.BranchResponse;
import com.example.backend.branch.repository.BranchRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class BranchService {
    private final BranchRepository branches;

    public BranchService(BranchRepository branches) {
        this.branches = branches;
    }

    public List<BranchResponse> findAllActive() {
        return branches.findAllByActiveTrueOrderByName().stream()
                .map(BranchResponse::from)
                .toList();
    }
}

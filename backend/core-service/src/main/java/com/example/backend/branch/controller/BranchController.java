package com.example.backend.branch.controller;

import com.example.backend.branch.dto.BranchResponse;
import com.example.backend.branch.service.BranchService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/branches")
public class BranchController {
    private final BranchService service;

    public BranchController(BranchService service) {
        this.service = service;
    }

    @GetMapping
    public List<BranchResponse> findAllActive() {
        return service.findAllActive();
    }
}

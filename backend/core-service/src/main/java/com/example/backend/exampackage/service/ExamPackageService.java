package com.example.backend.exampackage.service;

import com.example.backend.exampackage.dto.ExamPackageResponse;
import com.example.backend.exampackage.repository.ExamPackageRepository;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ExamPackageService {
    private final ExamPackageRepository packages;
    private final JdbcTemplate jdbc;

    public ExamPackageService(ExamPackageRepository packages, JdbcTemplate jdbc) {
        this.packages = packages;
        this.jdbc = jdbc;
    }

    public List<ExamPackageResponse> findAllActive() {
        return packages.findAllByActiveTrueOrderByName().stream()
                .map(row -> ExamPackageResponse.from(row,
                        jdbc.query("select branch_id from package_branches where package_id = ?",
                                (rs, i) -> rs.getString(1), row.getId())))
                .toList();
    }
}

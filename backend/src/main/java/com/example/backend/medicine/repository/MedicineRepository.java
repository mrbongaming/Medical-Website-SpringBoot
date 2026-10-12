package com.example.backend.medicine.repository;

import com.example.backend.medicine.entity.Medicine;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicineRepository extends JpaRepository<Medicine, String> {
    List<Medicine> findAllByActiveTrueOrderByName();
}

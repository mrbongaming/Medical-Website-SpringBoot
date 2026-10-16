package com.example.backend;

import com.example.backend.appointment.repository.AppointmentRepository;
import com.example.backend.branch.repository.BranchRepository;
import com.example.backend.doctor.repository.DoctorRepository;
import com.example.backend.exampackage.repository.ExamPackageRepository;
import com.example.backend.medicine.repository.MedicineRepository;
import com.example.backend.payment.PaymentAttemptRepository;
import com.example.backend.schedule.DoctorAvailabilityRuleRepository;
import com.example.backend.schedule.DoctorScheduleExceptionRepository;
import com.example.backend.specialty.repository.SpecialtyRepository;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
            "spring.data.jpa.repositories.enabled=false",
            "spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration,org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration"
        })
class BackendApplicationTests {
    @LocalServerPort private int port;

    @MockitoBean BranchRepository branchRepository;
    @MockitoBean SpecialtyRepository specialtyRepository;
    @MockitoBean DoctorRepository doctorRepository;
    @MockitoBean ExamPackageRepository examPackageRepository;
    @MockitoBean AppointmentRepository appointmentRepository;
    @MockitoBean MedicineRepository medicineRepository;
    @MockitoBean PaymentAttemptRepository paymentAttemptRepository;
    @MockitoBean DoctorAvailabilityRuleRepository doctorAvailabilityRuleRepository;
    @MockitoBean DoctorScheduleExceptionRepository doctorScheduleExceptionRepository;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Test
    void publicBranchEndpointIsAvailable() throws Exception {
        var response = get("/api/public/branches");

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).isEqualTo("[]");
    }

    @Test
    void publicScheduleEndpointComputesAnEmptyPreviewWithoutRules() throws Exception {
        var response = get("/api/public/schedules");

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).isEqualTo("[]");
    }

    @Test
    void appointmentEndpointRequiresAuthentication() throws Exception {
        var response = get("/api/appointments");

        assertThat(response.statusCode()).isEqualTo(401);
    }

    private HttpResponse<String> get(String path) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .GET()
                .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

}

package com.example.backend.schedule;

import com.example.backend.appointment.entity.Appointment;
import com.example.backend.appointment.repository.AppointmentRepository;
import com.example.backend.schedule.entity.DoctorAvailabilityRule;
import com.example.backend.schedule.entity.DoctorScheduleException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DoctorAvailabilityService {
    private static final ZoneId HOSPITAL_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final int PREVIEW_DAYS = 120;

    private final DoctorAvailabilityRuleRepository rules;
    private final DoctorScheduleExceptionRepository exceptions;
    private final AppointmentRepository appointments;

    public DoctorAvailabilityService(
            DoctorAvailabilityRuleRepository rules,
            DoctorScheduleExceptionRepository exceptions,
            AppointmentRepository appointments) {
        this.rules = rules;
        this.exceptions = exceptions;
        this.appointments = appointments;
    }

    @Transactional(readOnly = true)
    public List<DoctorScheduleResponse> preview() {
        var from = LocalDate.now(HOSPITAL_ZONE);
        var to = from.plusDays(PREVIEW_DAYS - 1L);
        var activeRules = rules.findAllByActiveTrue().stream()
                .filter(rule -> rule.getDoctor().isActive())
                .toList();
        var exceptionRows = exceptions.findAllByExceptionDateBetween(from, to);
        var occupied = occupiedSlots(appointments.findAllByAppointmentDateBetweenAndDoctorIsNotNull(from, to));
        var byDoctor = new HashMap<String, List<DoctorAvailabilityRule>>();
        for (var rule : activeRules)
            byDoctor.computeIfAbsent(rule.getDoctor().getId(), ignored -> new ArrayList<>()).add(rule);
        var byDoctorAndDate = new HashMap<String, List<DoctorScheduleException>>();
        for (var exception : exceptionRows)
            byDoctorAndDate
                    .computeIfAbsent(key(exception.getDoctor().getId(), exception.getExceptionDate()), ignored -> new ArrayList<>())
                    .add(exception);

        var result = new ArrayList<DoctorScheduleResponse>();
        for (Map.Entry<String, List<DoctorAvailabilityRule>> entry : byDoctor.entrySet()) {
            var doctorRules = entry.getValue();
            var doctor = doctorRules.getFirst().getDoctor();
            for (var date = from; !date.isAfter(to); date = date.plusDays(1)) {
                var currentDate = date;
                var dateExceptions = byDoctorAndDate.getOrDefault(key(doctor.getId(), currentDate), List.of());
                var intervals = intervalsFor(doctorRules, dateExceptions, currentDate);
                var times = intervals.stream()
                        .flatMap(interval -> interval.times().stream())
                        .filter(time -> !occupied.contains(slotKey(doctor.getId(), currentDate, time)))
                        .distinct()
                        .sorted()
                        .toList();
                if (!times.isEmpty())
                    result.add(new DoctorScheduleResponse(
                            "preview-" + doctor.getId() + "-" + currentDate,
                            doctor.getBranch().getId(),
                            doctor.getId(),
                            currentDate,
                            times));
            }
        }
        result.sort(Comparator.comparing(DoctorScheduleResponse::date)
                .thenComparing(DoctorScheduleResponse::doctorId));
        return result;
    }

    private List<Interval> intervalsFor(
            List<DoctorAvailabilityRule> doctorRules,
            List<DoctorScheduleException> dateExceptions,
            LocalDate date) {
        if (dateExceptions.stream().anyMatch(row -> "unavailable".equals(row.getKind())))
            return List.of();
        var custom = dateExceptions.stream()
                .filter(row -> "custom".equals(row.getKind()))
                .map(row -> new Interval(
                        row.getStartTime(), row.getEndTime(), row.getSlotMinutes() == null ? 30 : row.getSlotMinutes()))
                .toList();
        if (!custom.isEmpty()) return custom;
        return doctorRules.stream()
                .filter(rule -> rule.getDayOfWeek() == date.getDayOfWeek().getValue())
                .filter(rule -> rule.getEffectiveFrom() == null || !date.isBefore(rule.getEffectiveFrom()))
                .filter(rule -> rule.getEffectiveTo() == null || !date.isAfter(rule.getEffectiveTo()))
                .map(rule -> new Interval(rule.getStartTime(), rule.getEndTime(), rule.getSlotMinutes()))
                .toList();
    }

    private Set<String> occupiedSlots(List<Appointment> rows) {
        var now = OffsetDateTime.now(HOSPITAL_ZONE);
        var result = new HashSet<String>();
        for (var appointment : rows) {
            if (appointment.getDoctor() == null || appointment.getAppointmentTime() == null) continue;
            var status = appointment.getStatus();
            var occupies = List.of("pending", "confirmed", "completed").contains(status)
                    || ("awaiting_payment".equals(status)
                            && (appointment.getSlotHoldExpiresAt() == null
                                    || appointment.getSlotHoldExpiresAt().isAfter(now)));
            if (occupies)
                result.add(slotKey(
                        appointment.getDoctor().getId(),
                        appointment.getAppointmentDate(),
                        appointment.getAppointmentTime()));
        }
        return result;
    }

    private String key(String doctorId, LocalDate date) {
        return doctorId + "|" + date;
    }

    private String slotKey(String doctorId, LocalDate date, LocalTime time) {
        return key(doctorId, date) + "|" + time;
    }

    private record Interval(LocalTime start, LocalTime end, int minutes) {
        List<LocalTime> times() {
            var result = new ArrayList<LocalTime>();
            for (var cursor = start; !cursor.plusMinutes(minutes).isAfter(end); cursor = cursor.plusMinutes(minutes))
                result.add(cursor);
            return result;
        }
    }
}

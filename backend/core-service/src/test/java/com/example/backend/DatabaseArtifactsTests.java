package com.example.backend;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DatabaseArtifactsTests {
    @Test
    void bootstrapContainsAllServiceSchemasAndMockRows() throws Exception {
        var bootstrap = Files.readString(
                Path.of("../database/antam_mysql.sql"),
                StandardCharsets.UTF_8);

        assertThat(bootstrap).contains(
                "CREATE DATABASE IF NOT EXISTS antam_core",
                "CREATE DATABASE IF NOT EXISTS antam_auth",
                "CREATE DATABASE IF NOT EXISTS antam_notification",
                "create table doctor_availability_rules",
                "create table doctor_schedule_exceptions",
                "insert into doctor_availability_rules",
                "create table payment_attempts",
                "CREATE TABLE auth_users",
                "CREATE TABLE email_deliveries");
        assertThat(bootstrap).doesNotContain(
                "doctor_schedules",
                "schedule_slots");
    }
}

package com.example.backend;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DatabaseArtifactsTests {
    @Test
    void bootstrapContainsTheVersionedSchemaAndMockRows() throws Exception {
        var migration = Files.readString(
                Path.of("src/main/resources/db/migration/V1__create_antam_schema.sql"),
                StandardCharsets.UTF_8);
        var bootstrap = Files.readString(
                Path.of("database/antam_mysql.sql"),
                StandardCharsets.UTF_8);

        assertThat(bootstrap).contains(migration);
        assertThat(bootstrap.lines().filter(line -> line.startsWith("INSERT INTO ")).count())
                .isEqualTo(9_830);
        assertThat(bootstrap).contains("CREATE DATABASE IF NOT EXISTS antam");
    }
}

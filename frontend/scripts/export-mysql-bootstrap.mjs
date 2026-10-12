import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createSeed } from '../src/data/mockData.js';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '../..');
const migrationPath = resolve(
  repositoryRoot,
  'backend/src/main/resources/db/migration/V1__create_antam_schema.sql',
);
const outputPath = resolve(repositoryRoot, 'backend/database/antam_mysql.sql');
const data = createSeed();
const stableTimestamp = `${data.seededAt}T00:00:00+07:00`;
for (const request of data.stockRequests) request.createdAt = stableTimestamp;
data.stockSchedule.updatedAt = stableTimestamp;
const inserts = [];

const blankToNull = (value) =>
  value === undefined || value === null || value === '' ? null : value;
const bool = (value, fallback = false) => ((value ?? fallback) ? 1 : 0);
const json = (value) => JSON.stringify(value ?? {});
const timestamp = (value) => {
  const normalized = blankToNull(value);
  if (normalized === null) return null;
  return String(normalized).slice(0, 19).replace('T', ' ');
};
const sqlLiteral = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  const escaped = String(value).replaceAll('\\', '\\\\').replaceAll("'", "''");
  return `'${escaped}'`;
};
const add = (table, columns, values) => {
  inserts.push(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.map(sqlLiteral).join(', ')});`,
  );
};

for (const row of data.branches) {
  add(
    'branches',
    [
      'id',
      'slug',
      'name',
      'address',
      'phone',
      'image',
      'hours',
      'description',
      'service_open',
      'service_close',
      'insurance_contract',
      'active',
      'details',
    ],
    [
      row.id,
      row.slug,
      row.name,
      row.address,
      row.phone,
      blankToNull(row.image),
      blankToNull(row.hours),
      blankToNull(row.description),
      row.serviceHours?.open ?? '07:30',
      row.serviceHours?.close ?? '17:00',
      bool(row.insuranceContract),
      bool(row.active, true),
      json(row),
    ],
  );
}
for (const row of data.specialties) {
  add('specialties', ['id', 'name', 'active'], [row.id, row.name, bool(row.active, true)]);
}
for (const row of data.departments) {
  add(
    'departments',
    ['id', 'branch_id', 'specialty_id', 'name', 'active'],
    [row.id, row.branchId, row.specialtyId, row.name, bool(row.active, true)],
  );
}
for (const row of data.doctors) {
  add(
    'doctors',
    [
      'id',
      'slug',
      'name',
      'branch_id',
      'department_id',
      'specialty_id',
      'experience',
      'qualification',
      'contact_phone',
      'image',
      'bio',
      'price',
      'active',
      'details',
    ],
    [
      row.id,
      row.slug,
      row.name,
      row.branchId,
      row.departmentId,
      row.specialtyId,
      row.experience ?? 0,
      blankToNull(row.qualification),
      blankToNull(row.contactPhone),
      blankToNull(row.image),
      blankToNull(row.bio),
      row.price ?? 0,
      bool(row.active, true),
      json(row),
    ],
  );
}
for (const row of data.users) {
  add(
    'user_accounts',
    [
      'id',
      'name',
      'role',
      'phone',
      'password_hash',
      'branch_id',
      'doctor_id',
      'address',
      'birth_date',
      'active',
    ],
    [
      row.id,
      row.name,
      row.role,
      row.phone,
      null,
      blankToNull(row.branchId),
      blankToNull(row.doctorId),
      blankToNull(row.address),
      blankToNull(row.birthDate),
      bool(row.active, true),
    ],
  );
}
for (const row of data.serviceCatalog) {
  add(
    'medical_services',
    ['id', 'name', 'price', 'discountable', 'active'],
    [row.id, row.name, row.price ?? 0, bool(row.discountable, true), bool(row.active, true)],
  );
}
for (const row of data.packages) {
  add(
    'exam_packages',
    ['id', 'slug', 'name', 'specialty_id', 'price', 'contents', 'active', 'details'],
    [
      row.id,
      row.slug,
      row.name,
      row.specialtyId,
      row.price ?? 0,
      blankToNull(row.contents),
      bool(row.active, true),
      json(row),
    ],
  );
  for (const branchId of row.branchIds ?? []) {
    add('package_branches', ['package_id', 'branch_id'], [row.id, branchId]);
  }
  for (const item of row.components ?? []) {
    add(
      'package_items',
      [
        'package_id',
        'service_id',
        'package_service_id',
        'name',
        'unit_price',
        'quantity',
        'discountable',
      ],
      [
        row.id,
        item.serviceId,
        blankToNull(item.packageServiceId),
        item.name,
        item.unitPrice ?? 0,
        item.quantity ?? 1,
        bool(item.discountable, true),
      ],
    );
  }
}
for (const row of data.medicines) {
  add(
    'medicines',
    [
      'id',
      'code',
      'name',
      'active_ingredient',
      'medicine_group',
      'dosage_form',
      'unit',
      'sale_price',
      'active',
      'insurance',
    ],
    [
      row.id,
      row.code,
      row.name,
      blankToNull(row.activeIngredient),
      blankToNull(row.group),
      blankToNull(row.form),
      row.unit,
      row.salePrice ?? 0,
      bool(row.active, true),
      json(row.insurance),
    ],
  );
}
for (const row of data.promotions) {
  add(
    'promotions',
    [
      'id',
      'name',
      'mode',
      'code',
      'kind',
      'value',
      'max_discount',
      'minimum_amount',
      'starts_on',
      'ends_on',
      'audience',
      'discount_scope',
      'total_limit',
      'per_patient_limit',
      'active',
      'branch_ids',
      'service_ids',
    ],
    [
      row.id,
      row.name,
      row.mode,
      blankToNull(row.code),
      row.kind,
      row.value ?? 0,
      row.maxDiscount ?? 0,
      row.minimum ?? 0,
      row.startsOn,
      row.endsOn,
      row.audience,
      row.discountScope,
      row.totalLimit ?? 0,
      row.perPatientLimit ?? 0,
      bool(row.active, true),
      json(row.branchIds),
      json(row.serviceIds),
    ],
  );
}
for (const row of data.insuranceRules) {
  add(
    'insurance_rules',
    [
      'id',
      'effective_from',
      'effective_to',
      'low_cost_threshold',
      'annual_copay_threshold',
      'source',
    ],
    [
      row.id,
      row.effectiveFrom,
      row.effectiveTo,
      row.lowCostThreshold ?? 0,
      row.annualCopayThreshold ?? 0,
      row.source,
    ],
  );
}
for (const row of data.insurancePolicies) {
  add(
    'insurance_policies',
    ['id', 'branch_id', 'policy_version', 'enabled', 'effective_from', 'effective_to', 'note'],
    [
      row.id,
      row.branchId,
      row.version ?? 1,
      bool(row.enabled, true),
      row.effectiveFrom,
      row.effectiveTo,
      blankToNull(row.note),
    ],
  );
  for (const service of row.services ?? []) {
    add(
      'insurance_tariffs',
      ['policy_id', 'service_id', 'tariff'],
      [row.id, service.serviceId, service.tariff ?? 0],
    );
  }
}
for (const row of data.schedules) {
  add(
    'doctor_schedules',
    ['id', 'branch_id', 'doctor_id', 'schedule_date'],
    [row.id, row.branchId, row.doctorId, row.date],
  );
  for (const slot of row.times ?? [])
    add('schedule_slots', ['schedule_id', 'slot_time'], [row.id, slot]);
}
for (const row of data.appointments) {
  const bookingMode = row.bookingMode ?? (row.doctorId ? 'doctor' : 'facility');
  add(
    'appointments',
    [
      'id',
      'booked_by_user_id',
      'branch_id',
      'doctor_id',
      'department_id',
      'specialty_id',
      'package_id',
      'booking_mode',
      'appointment_date',
      'appointment_time',
      'status',
      'service_name',
      'quoted_price',
      'duration_minutes',
      'reason',
      'notes',
      'rating',
      'created_at',
      'reviewed_at',
      'reviewed_by',
    ],
    [
      row.id,
      row.patientId,
      row.branchId,
      blankToNull(row.doctorId),
      row.departmentId,
      row.specialtyId,
      blankToNull(row.packageId),
      bookingMode,
      row.date,
      blankToNull(row.time),
      row.status,
      row.serviceName,
      row.price ?? 0,
      row.duration ?? 30,
      blankToNull(row.reason),
      blankToNull(row.notes),
      row.rating ?? null,
      timestamp(row.createdAt),
      timestamp(row.reviewedAt),
      blankToNull(row.reviewedBy),
    ],
  );
  add(
    'appointment_recipients',
    [
      'appointment_id',
      'recipient_type',
      'relationship',
      'full_name',
      'phone',
      'birth_date',
      'address',
    ],
    [
      row.id,
      row.recipientType ?? 'self',
      blankToNull(row.relationship),
      row.patientName,
      row.phone,
      blankToNull(row.patientBirthDate),
      blankToNull(row.patientAddress),
    ],
  );
  if (row.billing) {
    add(
      'bills',
      [
        'appointment_id',
        'insurance_status',
        'insurance_snapshot',
        'promotion_snapshot',
        'estimate_snapshot',
        'finalized_snapshot',
        'received_at',
        'received_by',
        'settled_at',
        'settlement_id',
        'legacy',
      ],
      [
        row.id,
        row.billing.insurance?.status ?? 'none',
        json(row.billing.insurance),
        row.billing.promotion == null ? null : json(row.billing.promotion),
        json(row.billing.estimate),
        row.billing.finalized == null ? null : json(row.billing.finalized),
        timestamp(row.billing.receivedAt),
        blankToNull(row.billing.receivedBy),
        timestamp(row.billing.settledAt),
        blankToNull(row.billing.settlementId),
        bool(row.billing.legacy),
      ],
    );
    for (const item of row.billing.items ?? []) {
      add(
        'bill_items',
        [
          'appointment_id',
          'service_id',
          'package_service_id',
          'name',
          'unit_price',
          'quantity',
          'discountable',
          'snapshot',
        ],
        [
          row.id,
          item.serviceId,
          blankToNull(item.packageServiceId),
          item.name,
          item.unitPrice ?? 0,
          item.quantity ?? 1,
          bool(item.discountable, true),
          json(item),
        ],
      );
    }
  }
}
for (const row of data.records) {
  add(
    'medical_records',
    [
      'id',
      'appointment_id',
      'patient_user_id',
      'branch_id',
      'doctor_id',
      'record_date',
      'symptoms',
      'diagnosis',
      'notes',
      'follow_up_date',
      'finalized',
      'dispense_status',
      'dispensed_by',
      'dispensed_at',
      'dispense_reason',
    ],
    [
      row.id,
      row.appointmentId,
      row.patientId,
      row.branchId,
      row.doctorId,
      row.date,
      blankToNull(row.symptoms),
      blankToNull(row.diagnosis),
      blankToNull(row.notes),
      blankToNull(row.followUp),
      bool(row.finalized),
      row.dispenseStatus ?? 'none',
      blankToNull(row.dispensedBy),
      timestamp(row.dispensedAt),
      blankToNull(row.dispenseReason),
    ],
  );
  if (row.prescription?.length) {
    const prescriptionId = `prescription-${row.id}`;
    add('prescriptions', ['id', 'medical_record_id'], [prescriptionId, row.id]);
    for (const item of row.prescription) {
      add(
        'prescription_items',
        ['prescription_id', 'medicine_id', 'quantity', 'unit_price', 'instructions'],
        [
          prescriptionId,
          item.medicineId,
          item.quantity ?? 1,
          item.unitPrice ?? item.price ?? 0,
          blankToNull(item.instructions),
        ],
      );
    }
  }
}
for (const row of data.payments) {
  add(
    'payments',
    [
      'id',
      'appointment_id',
      'branch_id',
      'amount',
      'payment_date',
      'method',
      'reference',
      'created_by',
      'created_at',
    ],
    [
      row.id,
      row.appointmentId,
      row.branchId,
      row.amount ?? 0,
      row.date,
      blankToNull(row.method),
      blankToNull(row.reference),
      blankToNull(row.createdBy),
      timestamp(row.at ?? row.createdAt),
    ],
  );
}
for (const row of data.promotionUses) {
  add(
    'promotion_uses',
    ['id', 'promotion_id', 'appointment_id', 'patient_user_id', 'branch_id', 'status', 'used_at'],
    [
      row.id,
      row.promotionId,
      row.appointmentId,
      row.patientId,
      row.branchId,
      row.status,
      timestamp(row.at),
    ],
  );
}
for (const row of data.adjustments) {
  add(
    'billing_adjustments',
    [
      'id',
      'appointment_id',
      'branch_id',
      'receipt_id',
      'reference',
      'kind',
      'amount',
      'method',
      'reason',
      'created_by',
      'adjustment_date',
      'created_at',
    ],
    [
      row.id,
      row.appointmentId,
      row.branchId,
      blankToNull(row.receiptId),
      row.reference,
      row.kind,
      row.amount,
      row.method,
      row.reason,
      blankToNull(row.createdBy),
      row.date,
      timestamp(row.at),
    ],
  );
}
for (const row of data.insuranceSettlements) {
  add(
    'insurance_settlements',
    [
      'id',
      'appointment_id',
      'branch_id',
      'amount',
      'settlement_date',
      'created_at',
      'created_by',
      'reason',
    ],
    [
      row.id,
      row.appointmentId,
      row.branchId,
      row.amount,
      row.date,
      timestamp(row.at),
      blankToNull(row.createdBy),
      row.reason,
    ],
  );
}
for (const row of data.inventorySettings) {
  add(
    'inventory_settings',
    ['id', 'branch_id', 'medicine_id', 'min_quantity', 'max_quantity'],
    [row.id, row.branchId, row.medicineId, row.min ?? 0, row.max ?? 0],
  );
}
for (const row of data.inventory) {
  add(
    'branch_stocks',
    ['id', 'branch_id', 'medicine_id', 'quantity', 'reserved'],
    [row.id, row.branchId, row.medicineId, row.quantity ?? 0, row.reserved ?? 0],
  );
}
for (const row of data.stockRequests) {
  add(
    'stock_requests',
    [
      'id',
      'branch_id',
      'kind',
      'status',
      'reason',
      'created_by',
      'created_at',
      'reviewed_by',
      'reviewed_at',
      'review_reason',
    ],
    [
      row.id,
      row.branchId,
      row.kind,
      row.status,
      row.reason,
      row.createdBy,
      timestamp(row.createdAt),
      blankToNull(row.reviewedBy),
      timestamp(row.reviewedAt),
      blankToNull(row.reviewReason),
    ],
  );
  for (const item of row.items ?? []) {
    add(
      'stock_request_items',
      ['stock_request_id', 'medicine_id', 'quantity', 'purchase_price'],
      [row.id, item.medicineId, item.quantity ?? 1, item.purchasePrice ?? 0],
    );
  }
}
for (const row of data.inventoryTransactions) {
  add(
    'stock_movements',
    [
      'id',
      'branch_id',
      'medicine_id',
      'movement_type',
      'quantity',
      'appointment_id',
      'stock_request_id',
      'actor_id',
      'reason',
      'created_at',
      'snapshot',
    ],
    [
      row.id,
      row.branchId,
      row.medicineId,
      row.type,
      row.quantity ?? 1,
      blankToNull(row.appointmentId),
      blankToNull(row.requestId),
      blankToNull(row.createdBy),
      blankToNull(row.reason),
      timestamp(row.at ?? row.createdAt),
      json(row),
    ],
  );
}
add(
  'stock_schedule',
  ['id', 'weekdays', 'timezone', 'updated_by', 'updated_at'],
  [
    1,
    json(data.stockSchedule.weekdays),
    data.stockSchedule.timezone,
    blankToNull(data.stockSchedule.updatedBy),
    timestamp(data.stockSchedule.updatedAt),
  ],
);
for (const row of data.campaigns) {
  add(
    'campaigns',
    [
      'id',
      'title',
      'summary',
      'image',
      'starts_at',
      'ends_at',
      'status',
      'disclaimer',
      'branch_ids',
      'package_ids',
    ],
    [
      row.id,
      row.title,
      row.summary,
      blankToNull(row.image),
      row.startsAt,
      row.endsAt,
      row.status,
      blankToNull(row.disclaimer),
      json(row.branchIds),
      json(row.packageIds),
    ],
  );
}
for (const row of data.healthFacts) {
  add(
    'health_facts',
    ['id', 'topic', 'title', 'content', 'source', 'reviewed_at', 'status'],
    [row.id, row.topic, row.title, row.content, row.source, row.reviewedAt, row.status],
  );
}
for (const row of data.auditLogs) {
  add(
    'audit_logs',
    [
      'id',
      'actor_id',
      'actor_name',
      'actor_role',
      'action',
      'module',
      'subject_type',
      'subject_id',
      'appointment_id',
      'branch_id',
      'reason',
      'result',
      'severity',
      'details',
      'occurred_at',
    ],
    [
      row.id,
      blankToNull(row.actorId),
      blankToNull(row.actorName),
      blankToNull(row.actorRole),
      row.action,
      blankToNull(row.module),
      blankToNull(row.subjectType),
      blankToNull(row.subjectId),
      blankToNull(row.appointmentId),
      blankToNull(row.branchId),
      blankToNull(row.reason),
      blankToNull(row.result),
      blankToNull(row.severity),
      json(row.details),
      timestamp(row.at),
    ],
  );
}

const migration = await readFile(migrationPath, 'utf8');
const output = `-- An Tam MySQL/XAMPP one-time bootstrap\n-- Generated from frontend/src/data/mockData.js schema v${data.version}.\n-- Import into an empty MySQL/MariaDB server. This file is not executed by Spring Boot.\n\nSET NAMES utf8mb4;\nSET time_zone = '+07:00';\nCREATE DATABASE IF NOT EXISTS antam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\nUSE antam;\n\n${migration.trim()}\n\nSTART TRANSACTION;\n${inserts.join('\n')}\nCOMMIT;\n`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, output, 'utf8');
console.log(`Created ${outputPath}`);
console.log(`Included ${inserts.length} INSERT statements from mock schema v${data.version}.`);

-- An Tam MySQL/XAMPP one-time bootstrap for all backend services.
-- Creates antam_core, antam_auth and antam_notification with the current schema and demo data.
-- Import this single file into an empty MySQL/MariaDB server before starting the services.

SET NAMES utf8mb4;
SET time_zone = '+07:00';
CREATE DATABASE IF NOT EXISTS antam_core CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE antam_core;

create table branches (
    id varchar(64) primary key,
    slug varchar(120) not null unique,
    name varchar(200) not null,
    address varchar(500) not null,
    phone varchar(20) not null,
    image varchar(500),
    hours varchar(200),
    description text,
    service_open time not null default '07:30',
    service_close time not null default '17:00',
    insurance_contract boolean not null default false,
    active boolean not null default true,
    details json not null
);

create table specialties (
    id varchar(64) primary key,
    name varchar(200) not null unique,
    active boolean not null default true
);

create table departments (
    id varchar(64) primary key,
    branch_id varchar(64) not null,
    specialty_id varchar(64) not null,
    name varchar(200) not null,
    active boolean not null default true,
    unique (branch_id, specialty_id)
);

create table doctors (
    id varchar(64) primary key,
    slug varchar(120) not null unique,
    name varchar(200) not null,
    branch_id varchar(64) not null,
    department_id varchar(64) not null,
    specialty_id varchar(64) not null,
    experience integer not null default 0 check (experience >= 0),
    qualification varchar(300),
    contact_phone varchar(20),
    image varchar(500),
    bio text,
    price numeric(15,0) not null check (price >= 0),
    active boolean not null default true,
    version bigint not null default 0,
    details json not null
);

create table user_accounts (
    id varchar(64) primary key,
    name varchar(200) not null,
    role varchar(32) not null check (role in ('patient', 'doctor', 'staff', 'branchAdmin', 'superAdmin')),
    phone varchar(20) not null unique,
    password_hash varchar(100),
    branch_id varchar(64),
    doctor_id varchar(64) unique,
    address varchar(500),
    birth_date date,
    active boolean not null default true,
    version bigint not null default 0
);

create table medical_services (
    id varchar(64) primary key,
    name varchar(200) not null,
    price numeric(15,0) not null check (price >= 0),
    discountable boolean not null default true,
    active boolean not null default true
);

create table exam_packages (
    id varchar(64) primary key,
    slug varchar(120) not null unique,
    name varchar(200) not null,
    specialty_id varchar(64) not null,
    price numeric(15,0) not null check (price >= 0),
    contents text,
    active boolean not null default true,
    details json not null
);

create table package_branches (
    package_id varchar(64) not null,
    branch_id varchar(64) not null,
    primary key (package_id, branch_id)
);

create table package_items (
    id bigint auto_increment primary key,
    package_id varchar(64) not null,
    service_id varchar(120) not null,
    package_service_id varchar(120),
    name varchar(200) not null,
    unit_price numeric(15,0) not null check (unit_price >= 0),
    quantity integer not null check (quantity > 0),
    discountable boolean not null,
    unique (package_id, service_id)
);

create table doctor_availability_rules (
    id varchar(120) primary key,
    branch_id varchar(64) not null,
    doctor_id varchar(64) not null,
    day_of_week tinyint not null check (day_of_week between 1 and 7),
    start_time time not null,
    end_time time not null,
    slot_minutes integer not null default 30 check (slot_minutes in (15, 20, 30, 45, 60)),
    effective_from date,
    effective_to date,
    active boolean not null default true,
    check (end_time > start_time),
    check (effective_to is null or effective_from is null or effective_to >= effective_from),
    unique (doctor_id, day_of_week, start_time, effective_from)
);

create table doctor_schedule_exceptions (
    id varchar(120) primary key,
    branch_id varchar(64) not null,
    doctor_id varchar(64) not null,
    exception_date date not null,
    kind varchar(20) not null check (kind in ('unavailable', 'custom')),
    start_time time,
    end_time time,
    slot_minutes integer check (slot_minutes in (15, 20, 30, 45, 60)),
    reason text,
    check (
        (kind = 'unavailable' and start_time is null and end_time is null)
        or (kind = 'custom' and start_time is not null and end_time > start_time)
    ),
    unique (doctor_id, exception_date, kind, start_time)
);

create index idx_availability_rule_lookup
    on doctor_availability_rules (doctor_id, active, day_of_week, effective_from, effective_to);
create index idx_schedule_exception_date
    on doctor_schedule_exceptions (exception_date, doctor_id);

create table appointments (
    id varchar(120) primary key,
    booked_by_user_id varchar(64) not null,
    branch_id varchar(64) not null,
    doctor_id varchar(64),
    department_id varchar(64) not null,
    specialty_id varchar(64) not null,
    package_id varchar(64),
    booking_mode varchar(16) not null check (booking_mode in ('doctor', 'facility')),
    appointment_date date not null,
    appointment_time time,
    status varchar(20) not null check (status in ('awaiting_payment', 'pending', 'confirmed', 'completed', 'rejected', 'cancelled', 'absent', 'draft')),
    service_name varchar(200) not null,
    quoted_price numeric(15,0) not null check (quoted_price >= 0),
    duration_minutes integer not null check (duration_minutes > 0),
    reason text,
    notes text,
    rating integer check (rating between 1 and 5),
    created_at datetime(6) not null,
    reviewed_at datetime(6),
    reviewed_by varchar(64),
    version bigint not null default 0,
    check ((booking_mode = 'doctor' and doctor_id is not null and appointment_time is not null) or booking_mode = 'facility')
);

create index idx_appointments_schedule_lookup
    on appointments (appointment_date, doctor_id, status);

create table appointment_recipients (
    appointment_id varchar(120) primary key,
    recipient_type varchar(16) not null check (recipient_type in ('self', 'relative')),
    relationship varchar(100),
    full_name varchar(200) not null,
    phone varchar(20) not null,
    birth_date date,
    address varchar(500),
    check (recipient_type = 'self' or (relationship is not null and birth_date is not null and address is not null))
);

create table medical_records (
    id varchar(160) primary key,
    appointment_id varchar(120) not null unique,
    patient_user_id varchar(64) not null,
    branch_id varchar(64) not null,
    doctor_id varchar(64) not null,
    record_date date not null,
    symptoms text,
    diagnosis text,
    notes text,
    follow_up_date date,
    finalized boolean not null default false,
    dispense_status varchar(20) not null default 'none',
    dispensed_by varchar(64),
    dispensed_at datetime(6),
    dispense_reason text,
    version bigint not null default 0
);

create table prescriptions (
    id varchar(180) primary key,
    medical_record_id varchar(160) not null unique
);

create table prescription_items (
    id bigint auto_increment primary key,
    prescription_id varchar(180) not null,
    medicine_id varchar(64) not null,
    quantity integer not null check (quantity > 0),
    unit_price numeric(15,0) not null check (unit_price >= 0),
    instructions text,
    unique (prescription_id, medicine_id)
);

create table bills (
    appointment_id varchar(120) primary key,
    insurance_status varchar(20) not null default 'none',
    insurance_snapshot json not null,
    promotion_snapshot json,
    estimate_snapshot json not null,
    finalized_snapshot json,
    received_at datetime(6),
    received_by varchar(64),
    settled_at datetime(6),
    settlement_id varchar(160),
    legacy boolean not null default false,
    version bigint not null default 0
);

create table bill_items (
    id bigint auto_increment primary key,
    appointment_id varchar(120) not null,
    service_id varchar(120) not null,
    package_service_id varchar(120),
    name varchar(200) not null,
    unit_price numeric(15,0) not null check (unit_price >= 0),
    quantity integer not null check (quantity > 0),
    discountable boolean not null,
    snapshot json not null
);

create table payments (
    id varchar(160) primary key,
    appointment_id varchar(120) not null,
    branch_id varchar(64) not null,
    amount numeric(15,0) not null check (amount >= 0),
    payment_date date not null,
    method varchar(20),
    reference varchar(160),
    created_by varchar(64),
    created_at datetime(6),
    unique (appointment_id, reference)
);

create table billing_adjustments (
    id varchar(160) primary key,
    appointment_id varchar(120) not null,
    branch_id varchar(64) not null,
    receipt_id varchar(160),
    reference varchar(160) not null,
    kind varchar(20) not null check (kind in ('refund', 'additional')),
    amount numeric(15,0) not null check (amount > 0),
    method varchar(20) not null,
    reason text not null,
    created_by varchar(64),
    adjustment_date date not null,
    created_at datetime(6) not null,
    unique (appointment_id, reference)
);

create table insurance_rules (
    id varchar(120) primary key,
    effective_from date not null,
    effective_to date not null,
    low_cost_threshold numeric(15,0) not null,
    annual_copay_threshold numeric(15,0) not null,
    source text not null,
    check (effective_to >= effective_from)
);

create table insurance_policies (
    id varchar(120) primary key,
    branch_id varchar(64) not null,
    policy_version integer not null,
    enabled boolean not null,
    effective_from date not null,
    effective_to date not null,
    note text,
    unique (branch_id, policy_version)
);

create table insurance_tariffs (
    id bigint auto_increment primary key,
    policy_id varchar(120) not null,
    service_id varchar(120) not null,
    tariff numeric(15,0) not null check (tariff >= 0),
    unique (policy_id, service_id)
);

create table promotions (
    id varchar(120) primary key,
    name varchar(200) not null,
    mode varchar(20) not null,
    code varchar(80),
    kind varchar(20) not null,
    value numeric(15,0) not null,
    max_discount numeric(15,0) not null,
    minimum_amount numeric(15,0) not null,
    starts_on date not null,
    ends_on date not null,
    audience varchar(40) not null,
    discount_scope varchar(40) not null,
    total_limit integer not null,
    per_patient_limit integer not null,
    active boolean not null,
    branch_ids json not null,
    service_ids json not null
);

create unique index uq_active_promotion_code on promotions(code);

create table promotion_uses (
    id varchar(160) primary key,
    promotion_id varchar(120) not null,
    appointment_id varchar(120) not null,
    patient_user_id varchar(64) not null,
    branch_id varchar(64) not null,
    status varchar(20) not null,
    used_at datetime(6) not null
);

create table medicines (
    id varchar(64) primary key,
    code varchar(40) not null unique,
    name varchar(200) not null,
    active_ingredient varchar(200),
    medicine_group varchar(120),
    dosage_form varchar(120),
    unit varchar(40) not null,
    sale_price numeric(15,0) not null check (sale_price >= 0),
    active boolean not null default true,
    insurance json not null
);

alter table prescription_items add constraint fk_prescription_item_medicine foreign key (medicine_id) references medicines(id);

create table branch_stocks (
    id varchar(160) primary key,
    branch_id varchar(64) not null,
    medicine_id varchar(64) not null,
    quantity integer not null check (quantity >= 0),
    reserved integer not null check (reserved >= 0 and reserved <= quantity),
    version bigint not null default 0,
    unique (branch_id, medicine_id)
);

create table inventory_settings (
    id varchar(180) primary key,
    branch_id varchar(64) not null,
    medicine_id varchar(64) not null,
    min_quantity integer not null check (min_quantity >= 0),
    max_quantity integer not null check (max_quantity >= min_quantity),
    unique (branch_id, medicine_id)
);

create table stock_requests (
    id varchar(180) primary key,
    branch_id varchar(64) not null,
    kind varchar(20) not null check (kind in ('normal', 'urgent')),
    status varchar(20) not null,
    reason text not null,
    created_by varchar(64) not null,
    created_at datetime(6) not null,
    reviewed_by varchar(64),
    reviewed_at datetime(6),
    review_reason text,
    version bigint not null default 0
);

create table stock_request_items (
    id bigint auto_increment primary key,
    stock_request_id varchar(180) not null,
    medicine_id varchar(64) not null,
    quantity integer not null check (quantity > 0),
    purchase_price numeric(15,0) not null check (purchase_price >= 0),
    unique (stock_request_id, medicine_id)
);

create table stock_movements (
    id varchar(180) primary key,
    branch_id varchar(64) not null,
    medicine_id varchar(64) not null,
    movement_type varchar(30) not null,
    quantity integer not null check (quantity > 0),
    appointment_id varchar(120),
    stock_request_id varchar(180),
    actor_id varchar(64),
    reason text,
    created_at datetime(6) not null,
    snapshot json not null
);

create table stock_schedule (
    id smallint primary key default 1 check (id = 1),
    weekdays json not null,
    timezone varchar(80) not null,
    updated_by varchar(64),
    updated_at datetime(6) not null
);

create table insurance_settlements (
    id varchar(160) primary key,
    appointment_id varchar(120) not null unique,
    branch_id varchar(64) not null,
    amount numeric(15,0) not null check (amount > 0),
    settlement_date date not null,
    created_at datetime(6) not null,
    created_by varchar(64),
    reason text not null
);

create table campaigns (
    id varchar(160) primary key,
    title varchar(300) not null,
    summary text not null,
    image varchar(500),
    starts_at date not null,
    ends_at date not null,
    status varchar(30) not null,
    disclaimer text,
    branch_ids json not null,
    package_ids json not null
);

create table health_facts (
    id varchar(160) primary key,
    topic varchar(120) not null,
    title varchar(300) not null,
    content text not null,
    source text not null,
    reviewed_at date not null,
    status varchar(30) not null
);

create table audit_logs (
    id varchar(180) primary key,
    actor_id varchar(64),
    actor_name varchar(200),
    actor_role varchar(40),
    action varchar(100) not null,
    module varchar(80),
    subject_type varchar(80),
    subject_id varchar(180),
    appointment_id varchar(120),
    branch_id varchar(64),
    reason text,
    result varchar(30),
    severity varchar(30),
    details json not null,
    occurred_at datetime(6) not null
);

create table idempotency_records (
    id bigint auto_increment primary key,
    operation varchar(80) not null,
    idempotency_key varchar(160) not null,
    request_hash varchar(64) not null,
    response_status integer,
    response_body json,
    created_at datetime(6) not null default current_timestamp(6),
    unique (operation, idempotency_key)
);


-- Explicit foreign keys work consistently across MySQL and MariaDB versions shipped with XAMPP.
alter table departments add constraint fk_departments_branch_id foreign key (branch_id) references branches(id);
alter table departments add constraint fk_departments_specialty_id foreign key (specialty_id) references specialties(id);
alter table doctors add constraint fk_doctors_branch_id foreign key (branch_id) references branches(id);
alter table doctors add constraint fk_doctors_department_id foreign key (department_id) references departments(id);
alter table doctors add constraint fk_doctors_specialty_id foreign key (specialty_id) references specialties(id);
alter table user_accounts add constraint fk_user_accounts_branch_id foreign key (branch_id) references branches(id);
alter table user_accounts add constraint fk_user_accounts_doctor_id foreign key (doctor_id) references doctors(id);
alter table exam_packages add constraint fk_exam_packages_specialty_id foreign key (specialty_id) references specialties(id);
alter table package_branches add constraint fk_package_branches_package_id foreign key (package_id) references exam_packages(id);
alter table package_branches add constraint fk_package_branches_branch_id foreign key (branch_id) references branches(id);
alter table package_items add constraint fk_package_items_package_id foreign key (package_id) references exam_packages(id);
alter table doctor_availability_rules add constraint fk_availability_rules_branch_id foreign key (branch_id) references branches(id);
alter table doctor_availability_rules add constraint fk_availability_rules_doctor_id foreign key (doctor_id) references doctors(id);
alter table doctor_schedule_exceptions add constraint fk_schedule_exceptions_branch_id foreign key (branch_id) references branches(id);
alter table doctor_schedule_exceptions add constraint fk_schedule_exceptions_doctor_id foreign key (doctor_id) references doctors(id);
alter table appointments add constraint fk_appointments_booked_by_user_id foreign key (booked_by_user_id) references user_accounts(id);
alter table appointments add constraint fk_appointments_branch_id foreign key (branch_id) references branches(id);
alter table appointments add constraint fk_appointments_doctor_id foreign key (doctor_id) references doctors(id);
alter table appointments add constraint fk_appointments_department_id foreign key (department_id) references departments(id);
alter table appointments add constraint fk_appointments_specialty_id foreign key (specialty_id) references specialties(id);
alter table appointments add constraint fk_appointments_package_id foreign key (package_id) references exam_packages(id);
alter table appointment_recipients add constraint fk_appointment_recipients_appointment_id foreign key (appointment_id) references appointments(id) on delete cascade;
alter table medical_records add constraint fk_medical_records_appointment_id foreign key (appointment_id) references appointments(id);
alter table medical_records add constraint fk_medical_records_patient_user_id foreign key (patient_user_id) references user_accounts(id);
alter table medical_records add constraint fk_medical_records_branch_id foreign key (branch_id) references branches(id);
alter table medical_records add constraint fk_medical_records_doctor_id foreign key (doctor_id) references doctors(id);
alter table prescriptions add constraint fk_prescriptions_medical_record_id foreign key (medical_record_id) references medical_records(id) on delete cascade;
alter table prescription_items add constraint fk_prescription_items_prescription_id foreign key (prescription_id) references prescriptions(id) on delete cascade;
alter table bills add constraint fk_bills_appointment_id foreign key (appointment_id) references appointments(id) on delete cascade;
alter table bill_items add constraint fk_bill_items_appointment_id foreign key (appointment_id) references bills(appointment_id) on delete cascade;
alter table payments add constraint fk_payments_appointment_id foreign key (appointment_id) references appointments(id);
alter table payments add constraint fk_payments_branch_id foreign key (branch_id) references branches(id);
alter table billing_adjustments add constraint fk_billing_adjustments_appointment_id foreign key (appointment_id) references appointments(id);
alter table billing_adjustments add constraint fk_billing_adjustments_branch_id foreign key (branch_id) references branches(id);
alter table insurance_policies add constraint fk_insurance_policies_branch_id foreign key (branch_id) references branches(id);
alter table insurance_tariffs add constraint fk_insurance_tariffs_policy_id foreign key (policy_id) references insurance_policies(id) on delete cascade;
alter table promotion_uses add constraint fk_promotion_uses_promotion_id foreign key (promotion_id) references promotions(id);
alter table promotion_uses add constraint fk_promotion_uses_appointment_id foreign key (appointment_id) references appointments(id);
alter table promotion_uses add constraint fk_promotion_uses_patient_user_id foreign key (patient_user_id) references user_accounts(id);
alter table promotion_uses add constraint fk_promotion_uses_branch_id foreign key (branch_id) references branches(id);
alter table branch_stocks add constraint fk_branch_stocks_branch_id foreign key (branch_id) references branches(id);
alter table branch_stocks add constraint fk_branch_stocks_medicine_id foreign key (medicine_id) references medicines(id);
alter table inventory_settings add constraint fk_inventory_settings_branch_id foreign key (branch_id) references branches(id);
alter table inventory_settings add constraint fk_inventory_settings_medicine_id foreign key (medicine_id) references medicines(id);
alter table stock_requests add constraint fk_stock_requests_branch_id foreign key (branch_id) references branches(id);
alter table stock_request_items add constraint fk_stock_request_items_stock_request_id foreign key (stock_request_id) references stock_requests(id) on delete cascade;
alter table stock_request_items add constraint fk_stock_request_items_medicine_id foreign key (medicine_id) references medicines(id);
alter table stock_movements add constraint fk_stock_movements_branch_id foreign key (branch_id) references branches(id);
alter table stock_movements add constraint fk_stock_movements_medicine_id foreign key (medicine_id) references medicines(id);
alter table stock_movements add constraint fk_stock_movements_appointment_id foreign key (appointment_id) references appointments(id);
alter table stock_movements add constraint fk_stock_movements_stock_request_id foreign key (stock_request_id) references stock_requests(id);
alter table insurance_settlements add constraint fk_insurance_settlements_appointment_id foreign key (appointment_id) references appointments(id);
alter table insurance_settlements add constraint fk_insurance_settlements_branch_id foreign key (branch_id) references branches(id);

START TRANSACTION;
INSERT INTO branches (id, slug, name, address, phone, image, hours, description, service_open, service_close, insurance_contract, active, details) VALUES ('b1', 'trung-tam', 'An Tâm · Trung tâm', '20 Đường An Tâm, Trung tâm, TP.HCM (địa chỉ mẫu)', '02812345670', '/images/hospital.jpg', 'Thứ 2 – Chủ nhật · 07:30 – 17:00', 'Cơ sở chính, kết nối chuyên môn cho toàn hệ thống.', '07:30', '17:00', 1, 1, '{"facilityType":"Bệnh viện đa khoa","establishedYear":2012,"email":"coso1@antam.example","website":"https://antam.example","detailedIntroduction":"Cơ sở thuộc hệ thống An Tâm, phối hợp nhiều chuyên khoa và hỗ trợ người bệnh xuyên suốt từ đặt lịch đến theo dõi sau khám.","transportGuide":"Có khu vực gửi xe tại cơ sở. Người bệnh nên đến trước giờ hẹn 15 phút để được hướng dẫn.","accessibility":"Có lối đi, thang máy và khu vực ưu tiên cho người cao tuổi, xe lăn.","amenities":["Khu tiếp nhận","Phòng chờ","Quầy thuốc"],"visitGuide":"Đến trước giờ hẹn 15 phút, mang theo giấy tờ tùy thân và hồ sơ khám hoặc đơn thuốc gần nhất nếu có.","mapQuery":"20 Đường An Tâm, Trung tâm, TP.HCM (địa chỉ mẫu)","serviceHours":{"open":"07:30","close":"17:00"},"careLevel":"basic","legacyLevel":"district","insuranceContract":true,"about":"Cơ sở chính, kết nối chuyên môn cho toàn hệ thống.","services":[],"id":"b1","slug":"trung-tam","name":"An Tâm · Trung tâm","address":"20 Đường An Tâm, Trung tâm, TP.HCM (địa chỉ mẫu)","phone":"02812345670","image":"/images/hospital.jpg","hours":"Thứ 2 – Chủ nhật · 07:30 – 17:00","description":"Cơ sở chính, kết nối chuyên môn cho toàn hệ thống.","active":true,"equipment":["Phòng khám chuyên khoa","Khu xét nghiệm","Hệ thống chẩn đoán hình ảnh"]}');
INSERT INTO branches (id, slug, name, address, phone, image, hours, description, service_open, service_close, insurance_contract, active, details) VALUES ('b2', 'thu-duc', 'An Tâm · Thủ Đức', '32 Đường An Tâm, Thủ Đức, TP.HCM (địa chỉ mẫu)', '02812345671', '/images/hospital.jpg', 'Thứ 2 – Chủ nhật · 07:30 – 17:00', 'Chăm sóc sức khỏe gần nhà, cùng tiêu chuẩn của Bệnh viện An Tâm.', '07:30', '17:00', 1, 1, '{"facilityType":"Phòng khám đa khoa","establishedYear":2014,"email":"coso2@antam.example","website":"https://antam.example","detailedIntroduction":"Cơ sở thuộc hệ thống An Tâm, phối hợp nhiều chuyên khoa và hỗ trợ người bệnh xuyên suốt từ đặt lịch đến theo dõi sau khám.","transportGuide":"Có khu vực gửi xe tại cơ sở. Người bệnh nên đến trước giờ hẹn 15 phút để được hướng dẫn.","accessibility":"Có lối đi, thang máy và khu vực ưu tiên cho người cao tuổi, xe lăn.","amenities":["Khu tiếp nhận","Phòng chờ","Quầy thuốc"],"visitGuide":"Đến trước giờ hẹn 15 phút, mang theo giấy tờ tùy thân và hồ sơ khám hoặc đơn thuốc gần nhất nếu có.","mapQuery":"32 Đường An Tâm, Thủ Đức, TP.HCM (địa chỉ mẫu)","serviceHours":{"open":"07:30","close":"17:00"},"careLevel":"basic","legacyLevel":"district","insuranceContract":true,"about":"Chăm sóc sức khỏe gần nhà, cùng tiêu chuẩn của Bệnh viện An Tâm.","services":[],"id":"b2","slug":"thu-duc","name":"An Tâm · Thủ Đức","address":"32 Đường An Tâm, Thủ Đức, TP.HCM (địa chỉ mẫu)","phone":"02812345671","image":"/images/hospital.jpg","hours":"Thứ 2 – Chủ nhật · 07:30 – 17:00","description":"Chăm sóc sức khỏe gần nhà, cùng tiêu chuẩn của Bệnh viện An Tâm.","active":true,"equipment":["Phòng khám chuyên khoa","Khu xét nghiệm","Hệ thống chẩn đoán hình ảnh"]}');
INSERT INTO branches (id, slug, name, address, phone, image, hours, description, service_open, service_close, insurance_contract, active, details) VALUES ('b3', 'binh-thanh', 'An Tâm · Bình Thạnh', '44 Đường An Tâm, Bình Thạnh, TP.HCM (địa chỉ mẫu)', '02812345672', '/images/hospital.jpg', 'Thứ 2 – Chủ nhật · 07:30 – 17:00', 'Chăm sóc sức khỏe gần nhà, cùng tiêu chuẩn của Bệnh viện An Tâm.', '07:30', '17:00', 1, 1, '{"facilityType":"Phòng khám đa khoa","establishedYear":2016,"email":"coso3@antam.example","website":"https://antam.example","detailedIntroduction":"Cơ sở thuộc hệ thống An Tâm, phối hợp nhiều chuyên khoa và hỗ trợ người bệnh xuyên suốt từ đặt lịch đến theo dõi sau khám.","transportGuide":"Có khu vực gửi xe tại cơ sở. Người bệnh nên đến trước giờ hẹn 15 phút để được hướng dẫn.","accessibility":"Có lối đi, thang máy và khu vực ưu tiên cho người cao tuổi, xe lăn.","amenities":["Khu tiếp nhận","Phòng chờ","Quầy thuốc"],"visitGuide":"Đến trước giờ hẹn 15 phút, mang theo giấy tờ tùy thân và hồ sơ khám hoặc đơn thuốc gần nhất nếu có.","mapQuery":"44 Đường An Tâm, Bình Thạnh, TP.HCM (địa chỉ mẫu)","serviceHours":{"open":"07:30","close":"17:00"},"careLevel":"basic","legacyLevel":"district","insuranceContract":true,"about":"Chăm sóc sức khỏe gần nhà, cùng tiêu chuẩn của Bệnh viện An Tâm.","services":[],"id":"b3","slug":"binh-thanh","name":"An Tâm · Bình Thạnh","address":"44 Đường An Tâm, Bình Thạnh, TP.HCM (địa chỉ mẫu)","phone":"02812345672","image":"/images/hospital.jpg","hours":"Thứ 2 – Chủ nhật · 07:30 – 17:00","description":"Chăm sóc sức khỏe gần nhà, cùng tiêu chuẩn của Bệnh viện An Tâm.","active":true,"equipment":["Phòng khám chuyên khoa","Khu xét nghiệm","Hệ thống chẩn đoán hình ảnh"]}');
INSERT INTO branches (id, slug, name, address, phone, image, hours, description, service_open, service_close, insurance_contract, active, details) VALUES ('b4', 'tan-binh', 'An Tâm · Tân Bình', '56 Đường An Tâm, Tân Bình, TP.HCM (địa chỉ mẫu)', '02812345673', '/images/hospital.jpg', 'Thứ 2 – Chủ nhật · 07:30 – 17:00', 'Chăm sóc sức khỏe gần nhà, cùng tiêu chuẩn của Bệnh viện An Tâm.', '07:30', '17:00', 1, 1, '{"facilityType":"Phòng khám đa khoa","establishedYear":2018,"email":"coso4@antam.example","website":"https://antam.example","detailedIntroduction":"Cơ sở thuộc hệ thống An Tâm, phối hợp nhiều chuyên khoa và hỗ trợ người bệnh xuyên suốt từ đặt lịch đến theo dõi sau khám.","transportGuide":"Có khu vực gửi xe tại cơ sở. Người bệnh nên đến trước giờ hẹn 15 phút để được hướng dẫn.","accessibility":"Có lối đi, thang máy và khu vực ưu tiên cho người cao tuổi, xe lăn.","amenities":["Khu tiếp nhận","Phòng chờ","Quầy thuốc"],"visitGuide":"Đến trước giờ hẹn 15 phút, mang theo giấy tờ tùy thân và hồ sơ khám hoặc đơn thuốc gần nhất nếu có.","mapQuery":"56 Đường An Tâm, Tân Bình, TP.HCM (địa chỉ mẫu)","serviceHours":{"open":"07:30","close":"17:00"},"careLevel":"basic","legacyLevel":"district","insuranceContract":true,"about":"Chăm sóc sức khỏe gần nhà, cùng tiêu chuẩn của Bệnh viện An Tâm.","services":[],"id":"b4","slug":"tan-binh","name":"An Tâm · Tân Bình","address":"56 Đường An Tâm, Tân Bình, TP.HCM (địa chỉ mẫu)","phone":"02812345673","image":"/images/hospital.jpg","hours":"Thứ 2 – Chủ nhật · 07:30 – 17:00","description":"Chăm sóc sức khỏe gần nhà, cùng tiêu chuẩn của Bệnh viện An Tâm.","active":true,"equipment":["Phòng khám chuyên khoa","Khu xét nghiệm","Hệ thống chẩn đoán hình ảnh"]}');
INSERT INTO specialties (id, name, active) VALUES ('sp1', 'Nội tổng quát', 1);
INSERT INTO specialties (id, name, active) VALUES ('sp2', 'Tim mạch', 1);
INSERT INTO specialties (id, name, active) VALUES ('sp3', 'Nhi khoa', 1);
INSERT INTO specialties (id, name, active) VALUES ('sp4', 'Da liễu', 1);
INSERT INTO specialties (id, name, active) VALUES ('sp5', 'Tai Mũi Họng', 1);
INSERT INTO specialties (id, name, active) VALUES ('sp6', 'Cơ xương khớp', 1);
INSERT INTO departments (id, branch_id, specialty_id, name, active) VALUES ('dep1', 'b1', 'sp1', 'Khoa Nội tổng quát', 1);
INSERT INTO departments (id, branch_id, specialty_id, name, active) VALUES ('dep2', 'b1', 'sp2', 'Khoa Tim mạch', 1);
INSERT INTO departments (id, branch_id, specialty_id, name, active) VALUES ('dep3', 'b1', 'sp3', 'Khoa Nhi khoa', 1);
INSERT INTO departments (id, branch_id, specialty_id, name, active) VALUES ('dep4', 'b2', 'sp4', 'Khoa Da liễu', 1);
INSERT INTO departments (id, branch_id, specialty_id, name, active) VALUES ('dep5', 'b2', 'sp5', 'Khoa Tai Mũi Họng', 1);
INSERT INTO departments (id, branch_id, specialty_id, name, active) VALUES ('dep6', 'b2', 'sp6', 'Khoa Cơ xương khớp', 1);
INSERT INTO departments (id, branch_id, specialty_id, name, active) VALUES ('dep7', 'b3', 'sp1', 'Khoa Nội tổng quát', 1);
INSERT INTO departments (id, branch_id, specialty_id, name, active) VALUES ('dep8', 'b3', 'sp2', 'Khoa Tim mạch', 1);
INSERT INTO departments (id, branch_id, specialty_id, name, active) VALUES ('dep9', 'b3', 'sp3', 'Khoa Nhi khoa', 1);
INSERT INTO departments (id, branch_id, specialty_id, name, active) VALUES ('dep10', 'b4', 'sp4', 'Khoa Da liễu', 1);
INSERT INTO departments (id, branch_id, specialty_id, name, active) VALUES ('dep11', 'b4', 'sp5', 'Khoa Tai Mũi Họng', 1);
INSERT INTO departments (id, branch_id, specialty_id, name, active) VALUES ('dep12', 'b4', 'sp6', 'Khoa Cơ xương khớp', 1);
INSERT INTO doctors (id, slug, name, branch_id, department_id, specialty_id, experience, qualification, contact_phone, image, bio, price, active, details) VALUES ('dr1', 'bac-si-1', 'BS. Nguyễn Minh Anh', 'b1', 'dep1', 'sp1', 8, 'Thạc sĩ · Bác sĩ chuyên khoa II', '02812345670', '/images/doctor-female.jpg', 'Nguyễn Minh Anh có 8 năm kinh nghiệm trong lĩnh vực nội tổng quát. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.', 200000, 1, '{"currentPosition":"Trưởng khoa","education":"Thạc sĩ · Bác sĩ chuyên khoa II","career":"8 năm thăm khám tại các cơ sở y tế (thông tin minh họa).","achievements":"Thông tin thành tựu đang được cập nhật.","id":"dr1","slug":"bac-si-1","name":"BS. Nguyễn Minh Anh","branchId":"b1","departmentId":"dep1","specialtyId":"sp1","experience":8,"qualification":"Thạc sĩ · Bác sĩ chuyên khoa II","expertise":"Khám nội tổng quát, theo dõi sức khỏe định kỳ","contactPhone":"02812345670","image":"/images/doctor-female.jpg","bio":"Nguyễn Minh Anh có 8 năm kinh nghiệm trong lĩnh vực nội tổng quát. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.","price":200000,"active":true,"consultationLanguages":["Tiếng Việt","Tiếng Anh"],"patientGroups":["Người trưởng thành","Người cao tuổi"],"focusAreas":["Khám nội tổng quát","theo dõi sức khỏe định kỳ"],"certifications":["Chứng chỉ hành nghề khám bệnh, chữa bệnh"],"memberships":["Hội chuyên ngành phù hợp với lĩnh vực công tác"]}');
INSERT INTO doctors (id, slug, name, branch_id, department_id, specialty_id, experience, qualification, contact_phone, image, bio, price, active, details) VALUES ('dr2', 'bac-si-2', 'BS. Trần Quốc Bảo', 'b1', 'dep2', 'sp2', 9, 'Bác sĩ chuyên khoa I', '02812345670', '/images/doctor-male.jpg', 'Trần Quốc Bảo có 9 năm kinh nghiệm trong lĩnh vực tim mạch. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.', 250000, 1, '{"currentPosition":"Bác sĩ điều trị","education":"Bác sĩ chuyên khoa I","career":"9 năm thăm khám tại các cơ sở y tế (thông tin minh họa).","achievements":"Thông tin thành tựu đang được cập nhật.","id":"dr2","slug":"bac-si-2","name":"BS. Trần Quốc Bảo","branchId":"b1","departmentId":"dep2","specialtyId":"sp2","experience":9,"qualification":"Bác sĩ chuyên khoa I","expertise":"Thăm khám tim mạch, theo dõi huyết áp","contactPhone":"02812345670","image":"/images/doctor-male.jpg","bio":"Trần Quốc Bảo có 9 năm kinh nghiệm trong lĩnh vực tim mạch. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.","price":250000,"active":true,"consultationLanguages":["Tiếng Việt"],"patientGroups":["Người trưởng thành","Người cao tuổi"],"focusAreas":["Thăm khám tim mạch","theo dõi huyết áp"],"certifications":["Chứng chỉ hành nghề khám bệnh, chữa bệnh"],"memberships":["Hội chuyên ngành phù hợp với lĩnh vực công tác"]}');
INSERT INTO doctors (id, slug, name, branch_id, department_id, specialty_id, experience, qualification, contact_phone, image, bio, price, active, details) VALUES ('dr3', 'bac-si-3', 'BS. Lê Thu Hà', 'b1', 'dep3', 'sp3', 10, 'Bác sĩ chuyên khoa I', '02812345670', '/images/doctor-female.jpg', 'Lê Thu Hà có 10 năm kinh nghiệm trong lĩnh vực nhi khoa. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.', 300000, 1, '{"currentPosition":"Bác sĩ điều trị","education":"Bác sĩ chuyên khoa I","career":"10 năm thăm khám tại các cơ sở y tế (thông tin minh họa).","achievements":"Thông tin thành tựu đang được cập nhật.","id":"dr3","slug":"bac-si-3","name":"BS. Lê Thu Hà","branchId":"b1","departmentId":"dep3","specialtyId":"sp3","experience":10,"qualification":"Bác sĩ chuyên khoa I","expertise":"Khám và tư vấn sức khỏe trẻ em","contactPhone":"02812345670","image":"/images/doctor-female.jpg","bio":"Lê Thu Hà có 10 năm kinh nghiệm trong lĩnh vực nhi khoa. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.","price":300000,"active":true,"consultationLanguages":["Tiếng Việt"],"patientGroups":["Trẻ em"],"focusAreas":["Khám và tư vấn sức khỏe trẻ em"],"certifications":["Chứng chỉ hành nghề khám bệnh, chữa bệnh"],"memberships":["Hội chuyên ngành phù hợp với lĩnh vực công tác"]}');
INSERT INTO doctors (id, slug, name, branch_id, department_id, specialty_id, experience, qualification, contact_phone, image, bio, price, active, details) VALUES ('dr4', 'bac-si-4', 'BS. Phạm Hoàng Nam', 'b2', 'dep4', 'sp4', 11, 'Thạc sĩ · Bác sĩ chuyên khoa II', '02812345671', '/images/doctor-male.jpg', 'Phạm Hoàng Nam có 11 năm kinh nghiệm trong lĩnh vực da liễu. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.', 200000, 1, '{"currentPosition":"Bác sĩ điều trị","education":"Thạc sĩ · Bác sĩ chuyên khoa II","career":"11 năm thăm khám tại các cơ sở y tế (thông tin minh họa).","achievements":"Thông tin thành tựu đang được cập nhật.","id":"dr4","slug":"bac-si-4","name":"BS. Phạm Hoàng Nam","branchId":"b2","departmentId":"dep4","specialtyId":"sp4","experience":11,"qualification":"Thạc sĩ · Bác sĩ chuyên khoa II","expertise":"Thăm khám da liễu và chăm sóc da","contactPhone":"02812345671","image":"/images/doctor-male.jpg","bio":"Phạm Hoàng Nam có 11 năm kinh nghiệm trong lĩnh vực da liễu. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.","price":200000,"active":true,"consultationLanguages":["Tiếng Việt","Tiếng Anh"],"patientGroups":["Người trưởng thành","Người cao tuổi"],"focusAreas":["Thăm khám da liễu và chăm sóc da"],"certifications":["Chứng chỉ hành nghề khám bệnh, chữa bệnh"],"memberships":["Hội chuyên ngành phù hợp với lĩnh vực công tác"]}');
INSERT INTO doctors (id, slug, name, branch_id, department_id, specialty_id, experience, qualification, contact_phone, image, bio, price, active, details) VALUES ('dr5', 'bac-si-5', 'BS. Võ Ngọc Mai', 'b2', 'dep5', 'sp5', 12, 'Bác sĩ chuyên khoa I', '02812345671', '/images/doctor-female.jpg', 'Võ Ngọc Mai có 12 năm kinh nghiệm trong lĩnh vực tai mũi họng. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.', 250000, 1, '{"currentPosition":"Trưởng khoa","education":"Bác sĩ chuyên khoa I","career":"12 năm thăm khám tại các cơ sở y tế (thông tin minh họa).","achievements":"Thông tin thành tựu đang được cập nhật.","id":"dr5","slug":"bac-si-5","name":"BS. Võ Ngọc Mai","branchId":"b2","departmentId":"dep5","specialtyId":"sp5","experience":12,"qualification":"Bác sĩ chuyên khoa I","expertise":"Khám tai, mũi, họng và tư vấn phòng bệnh","contactPhone":"02812345671","image":"/images/doctor-female.jpg","bio":"Võ Ngọc Mai có 12 năm kinh nghiệm trong lĩnh vực tai mũi họng. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.","price":250000,"active":true,"consultationLanguages":["Tiếng Việt"],"patientGroups":["Người trưởng thành","Người cao tuổi"],"focusAreas":["Khám tai","mũi","họng và tư vấn phòng bệnh"],"certifications":["Chứng chỉ hành nghề khám bệnh, chữa bệnh"],"memberships":["Hội chuyên ngành phù hợp với lĩnh vực công tác"]}');
INSERT INTO doctors (id, slug, name, branch_id, department_id, specialty_id, experience, qualification, contact_phone, image, bio, price, active, details) VALUES ('dr6', 'bac-si-6', 'BS. Đặng Minh Khang', 'b2', 'dep6', 'sp6', 13, 'Bác sĩ chuyên khoa I', '02812345671', '/images/doctor-male.jpg', 'Đặng Minh Khang có 13 năm kinh nghiệm trong lĩnh vực cơ xương khớp. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.', 300000, 1, '{"currentPosition":"Bác sĩ điều trị","education":"Bác sĩ chuyên khoa I","career":"13 năm thăm khám tại các cơ sở y tế (thông tin minh họa).","achievements":"Thông tin thành tựu đang được cập nhật.","id":"dr6","slug":"bac-si-6","name":"BS. Đặng Minh Khang","branchId":"b2","departmentId":"dep6","specialtyId":"sp6","experience":13,"qualification":"Bác sĩ chuyên khoa I","expertise":"Khám vận động và cơ xương khớp","contactPhone":"02812345671","image":"/images/doctor-male.jpg","bio":"Đặng Minh Khang có 13 năm kinh nghiệm trong lĩnh vực cơ xương khớp. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.","price":300000,"active":true,"consultationLanguages":["Tiếng Việt"],"patientGroups":["Người trưởng thành","Người cao tuổi"],"focusAreas":["Khám vận động và cơ xương khớp"],"certifications":["Chứng chỉ hành nghề khám bệnh, chữa bệnh"],"memberships":["Hội chuyên ngành phù hợp với lĩnh vực công tác"]}');
INSERT INTO doctors (id, slug, name, branch_id, department_id, specialty_id, experience, qualification, contact_phone, image, bio, price, active, details) VALUES ('dr7', 'bac-si-7', 'BS. Bùi Thanh Tâm', 'b3', 'dep7', 'sp1', 14, 'Thạc sĩ · Bác sĩ chuyên khoa II', '02812345672', '/images/doctor-male.jpg', 'Bùi Thanh Tâm có 14 năm kinh nghiệm trong lĩnh vực nội tổng quát. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.', 200000, 1, '{"currentPosition":"Bác sĩ điều trị","education":"Thạc sĩ · Bác sĩ chuyên khoa II","career":"14 năm thăm khám tại các cơ sở y tế (thông tin minh họa).","achievements":"Thông tin thành tựu đang được cập nhật.","id":"dr7","slug":"bac-si-7","name":"BS. Bùi Thanh Tâm","branchId":"b3","departmentId":"dep7","specialtyId":"sp1","experience":14,"qualification":"Thạc sĩ · Bác sĩ chuyên khoa II","expertise":"Khám nội tổng quát, theo dõi sức khỏe định kỳ","contactPhone":"02812345672","image":"/images/doctor-male.jpg","bio":"Bùi Thanh Tâm có 14 năm kinh nghiệm trong lĩnh vực nội tổng quát. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.","price":200000,"active":true,"consultationLanguages":["Tiếng Việt","Tiếng Anh"],"patientGroups":["Người trưởng thành","Người cao tuổi"],"focusAreas":["Khám nội tổng quát","theo dõi sức khỏe định kỳ"],"certifications":["Chứng chỉ hành nghề khám bệnh, chữa bệnh"],"memberships":["Hội chuyên ngành phù hợp với lĩnh vực công tác"]}');
INSERT INTO doctors (id, slug, name, branch_id, department_id, specialty_id, experience, qualification, contact_phone, image, bio, price, active, details) VALUES ('dr8', 'bac-si-8', 'BS. Nguyễn Hải Yến', 'b3', 'dep8', 'sp2', 15, 'Bác sĩ chuyên khoa I', '02812345672', '/images/doctor-female.jpg', 'Nguyễn Hải Yến có 15 năm kinh nghiệm trong lĩnh vực tim mạch. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.', 250000, 1, '{"currentPosition":"Bác sĩ điều trị","education":"Bác sĩ chuyên khoa I","career":"15 năm thăm khám tại các cơ sở y tế (thông tin minh họa).","achievements":"Thông tin thành tựu đang được cập nhật.","id":"dr8","slug":"bac-si-8","name":"BS. Nguyễn Hải Yến","branchId":"b3","departmentId":"dep8","specialtyId":"sp2","experience":15,"qualification":"Bác sĩ chuyên khoa I","expertise":"Thăm khám tim mạch, theo dõi huyết áp","contactPhone":"02812345672","image":"/images/doctor-female.jpg","bio":"Nguyễn Hải Yến có 15 năm kinh nghiệm trong lĩnh vực tim mạch. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.","price":250000,"active":true,"consultationLanguages":["Tiếng Việt"],"patientGroups":["Người trưởng thành","Người cao tuổi"],"focusAreas":["Thăm khám tim mạch","theo dõi huyết áp"],"certifications":["Chứng chỉ hành nghề khám bệnh, chữa bệnh"],"memberships":["Hội chuyên ngành phù hợp với lĩnh vực công tác"]}');
INSERT INTO doctors (id, slug, name, branch_id, department_id, specialty_id, experience, qualification, contact_phone, image, bio, price, active, details) VALUES ('dr9', 'bac-si-9', 'BS. Trần Đức Huy', 'b3', 'dep9', 'sp3', 16, 'Bác sĩ chuyên khoa I', '02812345672', '/images/doctor-male.jpg', 'Trần Đức Huy có 16 năm kinh nghiệm trong lĩnh vực nhi khoa. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.', 300000, 1, '{"currentPosition":"Trưởng khoa","education":"Bác sĩ chuyên khoa I","career":"16 năm thăm khám tại các cơ sở y tế (thông tin minh họa).","achievements":"Thông tin thành tựu đang được cập nhật.","id":"dr9","slug":"bac-si-9","name":"BS. Trần Đức Huy","branchId":"b3","departmentId":"dep9","specialtyId":"sp3","experience":16,"qualification":"Bác sĩ chuyên khoa I","expertise":"Khám và tư vấn sức khỏe trẻ em","contactPhone":"02812345672","image":"/images/doctor-male.jpg","bio":"Trần Đức Huy có 16 năm kinh nghiệm trong lĩnh vực nhi khoa. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.","price":300000,"active":true,"consultationLanguages":["Tiếng Việt"],"patientGroups":["Trẻ em"],"focusAreas":["Khám và tư vấn sức khỏe trẻ em"],"certifications":["Chứng chỉ hành nghề khám bệnh, chữa bệnh"],"memberships":["Hội chuyên ngành phù hợp với lĩnh vực công tác"]}');
INSERT INTO doctors (id, slug, name, branch_id, department_id, specialty_id, experience, qualification, contact_phone, image, bio, price, active, details) VALUES ('dr10', 'bac-si-10', 'BS. Lê Bảo Châu', 'b4', 'dep10', 'sp4', 17, 'Thạc sĩ · Bác sĩ chuyên khoa II', '02812345673', '/images/doctor-female.jpg', 'Lê Bảo Châu có 17 năm kinh nghiệm trong lĩnh vực da liễu. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.', 200000, 1, '{"currentPosition":"Bác sĩ điều trị","education":"Thạc sĩ · Bác sĩ chuyên khoa II","career":"17 năm thăm khám tại các cơ sở y tế (thông tin minh họa).","achievements":"Thông tin thành tựu đang được cập nhật.","id":"dr10","slug":"bac-si-10","name":"BS. Lê Bảo Châu","branchId":"b4","departmentId":"dep10","specialtyId":"sp4","experience":17,"qualification":"Thạc sĩ · Bác sĩ chuyên khoa II","expertise":"Thăm khám da liễu và chăm sóc da","contactPhone":"02812345673","image":"/images/doctor-female.jpg","bio":"Lê Bảo Châu có 17 năm kinh nghiệm trong lĩnh vực da liễu. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.","price":200000,"active":true,"consultationLanguages":["Tiếng Việt","Tiếng Anh"],"patientGroups":["Người trưởng thành","Người cao tuổi"],"focusAreas":["Thăm khám da liễu và chăm sóc da"],"certifications":["Chứng chỉ hành nghề khám bệnh, chữa bệnh"],"memberships":["Hội chuyên ngành phù hợp với lĩnh vực công tác"]}');
INSERT INTO doctors (id, slug, name, branch_id, department_id, specialty_id, experience, qualification, contact_phone, image, bio, price, active, details) VALUES ('dr11', 'bac-si-11', 'BS. Phạm Anh Tú', 'b4', 'dep11', 'sp5', 18, 'Bác sĩ chuyên khoa I', '02812345673', '/images/doctor-male.jpg', 'Phạm Anh Tú có 18 năm kinh nghiệm trong lĩnh vực tai mũi họng. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.', 250000, 1, '{"currentPosition":"Bác sĩ điều trị","education":"Bác sĩ chuyên khoa I","career":"18 năm thăm khám tại các cơ sở y tế (thông tin minh họa).","achievements":"Thông tin thành tựu đang được cập nhật.","id":"dr11","slug":"bac-si-11","name":"BS. Phạm Anh Tú","branchId":"b4","departmentId":"dep11","specialtyId":"sp5","experience":18,"qualification":"Bác sĩ chuyên khoa I","expertise":"Khám tai, mũi, họng và tư vấn phòng bệnh","contactPhone":"02812345673","image":"/images/doctor-male.jpg","bio":"Phạm Anh Tú có 18 năm kinh nghiệm trong lĩnh vực tai mũi họng. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.","price":250000,"active":true,"consultationLanguages":["Tiếng Việt"],"patientGroups":["Người trưởng thành","Người cao tuổi"],"focusAreas":["Khám tai","mũi","họng và tư vấn phòng bệnh"],"certifications":["Chứng chỉ hành nghề khám bệnh, chữa bệnh"],"memberships":["Hội chuyên ngành phù hợp với lĩnh vực công tác"]}');
INSERT INTO doctors (id, slug, name, branch_id, department_id, specialty_id, experience, qualification, contact_phone, image, bio, price, active, details) VALUES ('dr12', 'bac-si-12', 'BS. Võ Thùy Linh', 'b4', 'dep12', 'sp6', 19, 'Bác sĩ chuyên khoa I', '02812345673', '/images/doctor-female.jpg', 'Võ Thùy Linh có 19 năm kinh nghiệm trong lĩnh vực cơ xương khớp. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.', 300000, 1, '{"currentPosition":"Bác sĩ điều trị","education":"Bác sĩ chuyên khoa I","career":"19 năm thăm khám tại các cơ sở y tế (thông tin minh họa).","achievements":"Thông tin thành tựu đang được cập nhật.","id":"dr12","slug":"bac-si-12","name":"BS. Võ Thùy Linh","branchId":"b4","departmentId":"dep12","specialtyId":"sp6","experience":19,"qualification":"Bác sĩ chuyên khoa I","expertise":"Khám vận động và cơ xương khớp","contactPhone":"02812345673","image":"/images/doctor-female.jpg","bio":"Võ Thùy Linh có 19 năm kinh nghiệm trong lĩnh vực cơ xương khớp. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.","price":300000,"active":true,"consultationLanguages":["Tiếng Việt"],"patientGroups":["Người trưởng thành","Người cao tuổi"],"focusAreas":["Khám vận động và cơ xương khớp"],"certifications":["Chứng chỉ hành nghề khám bệnh, chữa bệnh"],"memberships":["Hội chuyên ngành phù hợp với lĩnh vực công tác"]}');
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('root', 'Quản trị hệ thống', 'superAdmin', '0900000000', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('admin1', 'Quản trị An Tâm · Trung tâm', 'branchAdmin', '0900000010', NULL, 'b1', NULL, NULL, NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('admin2', 'Quản trị An Tâm · Thủ Đức', 'branchAdmin', '0900000011', NULL, 'b2', NULL, NULL, NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('admin3', 'Quản trị An Tâm · Bình Thạnh', 'branchAdmin', '0900000012', NULL, 'b3', NULL, NULL, NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('admin4', 'Quản trị An Tâm · Tân Bình', 'branchAdmin', '0900000013', NULL, 'b4', NULL, NULL, NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('u-dr1', 'BS. Nguyễn Minh Anh', 'doctor', '0910000000', NULL, 'b1', 'dr1', 'TP.HCM', NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('u-dr2', 'BS. Trần Quốc Bảo', 'doctor', '0910000001', NULL, 'b1', 'dr2', 'TP.HCM', NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('u-dr3', 'BS. Lê Thu Hà', 'doctor', '0910000002', NULL, 'b1', 'dr3', 'TP.HCM', NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('u-dr4', 'BS. Phạm Hoàng Nam', 'doctor', '0910000003', NULL, 'b2', 'dr4', 'TP.HCM', NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('u-dr5', 'BS. Võ Ngọc Mai', 'doctor', '0910000004', NULL, 'b2', 'dr5', 'TP.HCM', NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('u-dr6', 'BS. Đặng Minh Khang', 'doctor', '0910000005', NULL, 'b2', 'dr6', 'TP.HCM', NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('u-dr7', 'BS. Bùi Thanh Tâm', 'doctor', '0910000006', NULL, 'b3', 'dr7', 'TP.HCM', NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('u-dr8', 'BS. Nguyễn Hải Yến', 'doctor', '0910000007', NULL, 'b3', 'dr8', 'TP.HCM', NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('u-dr9', 'BS. Trần Đức Huy', 'doctor', '0910000008', NULL, 'b3', 'dr9', 'TP.HCM', NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('u-dr10', 'BS. Lê Bảo Châu', 'doctor', '0910000009', NULL, 'b4', 'dr10', 'TP.HCM', NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('u-dr11', 'BS. Phạm Anh Tú', 'doctor', '0910000010', NULL, 'b4', 'dr11', 'TP.HCM', NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('u-dr12', 'BS. Võ Thùy Linh', 'doctor', '0910000011', NULL, 'b4', 'dr12', 'TP.HCM', NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('p1', 'Nguyễn Hoàng An', 'patient', '0920000000', NULL, NULL, NULL, 'TP.HCM', '1995-05-20', 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('p2', 'Trần Thanh Lan', 'patient', '0920000001', NULL, NULL, NULL, 'TP.HCM', '1982-05-20', 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('p3', 'Lê Gia Hân', 'patient', '0920000002', NULL, NULL, NULL, 'TP.HCM', '2018-05-20', 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('p4', 'Phạm Đức Minh', 'patient', '0920000003', NULL, NULL, NULL, 'TP.HCM', '1976-05-20', 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('p5', 'Võ Ngọc Ánh', 'patient', '0920000004', NULL, NULL, NULL, 'TP.HCM', '1990-05-20', 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('p6', 'Đỗ Quang Huy', 'patient', '0920000005', NULL, NULL, NULL, 'TP.HCM', '1968-05-20', 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('p7', 'Bùi Kim Ngân', 'patient', '0920000006', NULL, NULL, NULL, 'TP.HCM', '1988-05-20', 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('p8', 'Ngô Tuấn Kiệt', 'patient', '0920000007', NULL, NULL, NULL, 'TP.HCM', '2015-05-20', 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('p9', 'Phan Hải Đăng', 'patient', '0920000008', NULL, NULL, NULL, 'TP.HCM', '1993-05-20', 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('p10', 'Đặng Thảo Vy', 'patient', '0920000009', NULL, NULL, NULL, 'TP.HCM', '1985-05-20', 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('p11', 'Trịnh Minh Châu', 'patient', '0920000010', NULL, NULL, NULL, 'TP.HCM', '2000-05-20', 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('p12', 'Lý Thanh Bình', 'patient', '0920000011', NULL, NULL, NULL, 'TP.HCM', '1972-05-20', 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('p13', 'Hoàng Bảo Ngọc', 'patient', '0920000012', NULL, NULL, NULL, 'TP.HCM', '1997-05-20', 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('p14', 'Hồ Anh Khoa', 'patient', '0920000013', NULL, NULL, NULL, 'TP.HCM', '2016-05-20', 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('p15', 'Vũ Thu Trang', 'patient', '0920000014', NULL, NULL, NULL, 'TP.HCM', '1980-05-20', 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('p16', 'Mai Đức Phúc', 'patient', '0920000015', NULL, NULL, NULL, 'TP.HCM', '1965-05-20', 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('staff-b1', 'Nhân viên tiếp nhận An Tâm · Trung tâm', 'staff', '0930000001', NULL, 'b1', NULL, NULL, NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('staff-b2', 'Nhân viên tiếp nhận An Tâm · Thủ Đức', 'staff', '0930000002', NULL, 'b2', NULL, NULL, NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('staff-b3', 'Nhân viên tiếp nhận An Tâm · Bình Thạnh', 'staff', '0930000003', NULL, 'b3', NULL, NULL, NULL, 1);
INSERT INTO user_accounts (id, name, role, phone, password_hash, branch_id, doctor_id, address, birth_date, active) VALUES ('staff-b4', 'Nhân viên tiếp nhận An Tâm · Tân Bình', 'staff', '0930000004', NULL, 'b4', NULL, NULL, NULL, 1);
INSERT INTO medical_services (id, name, price, discountable, active) VALUES ('consultation', 'Khám chuyên khoa', 200000, 1, 1);
INSERT INTO medical_services (id, name, price, discountable, active) VALUES ('blood-test', 'Xét nghiệm công thức máu', 120000, 1, 1);
INSERT INTO medical_services (id, name, price, discountable, active) VALUES ('ecg', 'Điện tâm đồ', 150000, 1, 1);
INSERT INTO medical_services (id, name, price, discountable, active) VALUES ('ultrasound', 'Siêu âm bụng', 250000, 1, 1);
INSERT INTO exam_packages (id, slug, name, specialty_id, price, contents, active, details) VALUES ('pkg1', 'goi-kham-1', 'Khám tổng quát', 'sp1', 600000, 'Khám chuyên khoa, đánh giá sức khỏe và tư vấn kết quả.', 1, '{"suitableFor":"Người muốn chủ động đánh giá sức khỏe theo chuyên khoa và nhận tư vấn phù hợp.","preparation":"Mang theo giấy tờ tùy thân, hồ sơ khám gần nhất và danh sách thuốc đang sử dụng.","process":["Tiếp nhận và xác nhận thông tin","Khám và thực hiện hạng mục","Tư vấn kết quả"],"estimatedDuration":"60–120 phút tùy hạng mục và tình hình tại cơ sở","id":"pkg1","slug":"goi-kham-1","name":"Khám tổng quát","specialtyId":"sp1","branchIds":["b1","b3"],"price":600000,"contents":"Khám chuyên khoa, đánh giá sức khỏe và tư vấn kết quả.","active":true,"components":[{"serviceId":"consultation","packageServiceId":"package:pkg1","name":"Khám chuyên khoa","unitPrice":200000,"quantity":1,"discountable":true},{"serviceId":"blood-test","packageServiceId":"package:pkg1","name":"Xét nghiệm công thức máu","unitPrice":120000,"quantity":1,"discountable":true},{"serviceId":"ultrasound","packageServiceId":"package:pkg1","name":"Siêu âm bụng","unitPrice":280000,"quantity":1,"discountable":true}]}');
INSERT INTO package_branches (package_id, branch_id) VALUES ('pkg1', 'b1');
INSERT INTO package_branches (package_id, branch_id) VALUES ('pkg1', 'b3');
INSERT INTO package_items (package_id, service_id, package_service_id, name, unit_price, quantity, discountable) VALUES ('pkg1', 'consultation', 'package:pkg1', 'Khám chuyên khoa', 200000, 1, 1);
INSERT INTO package_items (package_id, service_id, package_service_id, name, unit_price, quantity, discountable) VALUES ('pkg1', 'blood-test', 'package:pkg1', 'Xét nghiệm công thức máu', 120000, 1, 1);
INSERT INTO package_items (package_id, service_id, package_service_id, name, unit_price, quantity, discountable) VALUES ('pkg1', 'ultrasound', 'package:pkg1', 'Siêu âm bụng', 280000, 1, 1);
INSERT INTO exam_packages (id, slug, name, specialty_id, price, contents, active, details) VALUES ('pkg2', 'goi-kham-2', 'Tầm soát tim mạch', 'sp2', 800000, 'Khám chuyên khoa, đánh giá sức khỏe và tư vấn kết quả.', 1, '{"suitableFor":"Người muốn chủ động đánh giá sức khỏe theo chuyên khoa và nhận tư vấn phù hợp.","preparation":"Mang theo giấy tờ tùy thân, hồ sơ khám gần nhất và danh sách thuốc đang sử dụng.","process":["Tiếp nhận và xác nhận thông tin","Khám và thực hiện hạng mục","Tư vấn kết quả"],"estimatedDuration":"60–120 phút tùy hạng mục và tình hình tại cơ sở","id":"pkg2","slug":"goi-kham-2","name":"Tầm soát tim mạch","specialtyId":"sp2","branchIds":["b1","b3"],"price":800000,"contents":"Khám chuyên khoa, đánh giá sức khỏe và tư vấn kết quả.","active":true,"components":[{"serviceId":"consultation","packageServiceId":"package:pkg2","name":"Khám chuyên khoa","unitPrice":200000,"quantity":1,"discountable":true},{"serviceId":"blood-test","packageServiceId":"package:pkg2","name":"Xét nghiệm công thức máu","unitPrice":600000,"quantity":1,"discountable":true}]}');
INSERT INTO package_branches (package_id, branch_id) VALUES ('pkg2', 'b1');
INSERT INTO package_branches (package_id, branch_id) VALUES ('pkg2', 'b3');
INSERT INTO package_items (package_id, service_id, package_service_id, name, unit_price, quantity, discountable) VALUES ('pkg2', 'consultation', 'package:pkg2', 'Khám chuyên khoa', 200000, 1, 1);
INSERT INTO package_items (package_id, service_id, package_service_id, name, unit_price, quantity, discountable) VALUES ('pkg2', 'blood-test', 'package:pkg2', 'Xét nghiệm công thức máu', 600000, 1, 1);
INSERT INTO exam_packages (id, slug, name, specialty_id, price, contents, active, details) VALUES ('pkg3', 'goi-kham-3', 'Chăm sóc sức khỏe trẻ em', 'sp3', 1000000, 'Khám chuyên khoa, đánh giá sức khỏe và tư vấn kết quả.', 1, '{"suitableFor":"Người muốn chủ động đánh giá sức khỏe theo chuyên khoa và nhận tư vấn phù hợp.","preparation":"Mang theo giấy tờ tùy thân, hồ sơ khám gần nhất và danh sách thuốc đang sử dụng.","process":["Tiếp nhận và xác nhận thông tin","Khám và thực hiện hạng mục","Tư vấn kết quả"],"estimatedDuration":"60–120 phút tùy hạng mục và tình hình tại cơ sở","id":"pkg3","slug":"goi-kham-3","name":"Chăm sóc sức khỏe trẻ em","specialtyId":"sp3","branchIds":["b1","b3"],"price":1000000,"contents":"Khám chuyên khoa, đánh giá sức khỏe và tư vấn kết quả.","active":true,"components":[{"serviceId":"consultation","packageServiceId":"package:pkg3","name":"Khám chuyên khoa","unitPrice":200000,"quantity":1,"discountable":true},{"serviceId":"blood-test","packageServiceId":"package:pkg3","name":"Xét nghiệm công thức máu","unitPrice":800000,"quantity":1,"discountable":true}]}');
INSERT INTO package_branches (package_id, branch_id) VALUES ('pkg3', 'b1');
INSERT INTO package_branches (package_id, branch_id) VALUES ('pkg3', 'b3');
INSERT INTO package_items (package_id, service_id, package_service_id, name, unit_price, quantity, discountable) VALUES ('pkg3', 'consultation', 'package:pkg3', 'Khám chuyên khoa', 200000, 1, 1);
INSERT INTO package_items (package_id, service_id, package_service_id, name, unit_price, quantity, discountable) VALUES ('pkg3', 'blood-test', 'package:pkg3', 'Xét nghiệm công thức máu', 800000, 1, 1);
INSERT INTO exam_packages (id, slug, name, specialty_id, price, contents, active, details) VALUES ('pkg4', 'goi-kham-4', 'Khám da chuyên sâu', 'sp4', 1200000, 'Khám chuyên khoa, đánh giá sức khỏe và tư vấn kết quả.', 1, '{"suitableFor":"Người muốn chủ động đánh giá sức khỏe theo chuyên khoa và nhận tư vấn phù hợp.","preparation":"Mang theo giấy tờ tùy thân, hồ sơ khám gần nhất và danh sách thuốc đang sử dụng.","process":["Tiếp nhận và xác nhận thông tin","Khám và thực hiện hạng mục","Tư vấn kết quả"],"estimatedDuration":"60–120 phút tùy hạng mục và tình hình tại cơ sở","id":"pkg4","slug":"goi-kham-4","name":"Khám da chuyên sâu","specialtyId":"sp4","branchIds":["b2","b4"],"price":1200000,"contents":"Khám chuyên khoa, đánh giá sức khỏe và tư vấn kết quả.","active":true,"components":[{"serviceId":"consultation","packageServiceId":"package:pkg4","name":"Khám chuyên khoa","unitPrice":200000,"quantity":1,"discountable":true},{"serviceId":"blood-test","packageServiceId":"package:pkg4","name":"Xét nghiệm công thức máu","unitPrice":1000000,"quantity":1,"discountable":true}]}');
INSERT INTO package_branches (package_id, branch_id) VALUES ('pkg4', 'b2');
INSERT INTO package_branches (package_id, branch_id) VALUES ('pkg4', 'b4');
INSERT INTO package_items (package_id, service_id, package_service_id, name, unit_price, quantity, discountable) VALUES ('pkg4', 'consultation', 'package:pkg4', 'Khám chuyên khoa', 200000, 1, 1);
INSERT INTO package_items (package_id, service_id, package_service_id, name, unit_price, quantity, discountable) VALUES ('pkg4', 'blood-test', 'package:pkg4', 'Xét nghiệm công thức máu', 1000000, 1, 1);
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med001', 'MED001', 'Paracetamol 500 mg', 'Paracetamol', 'Giảm đau - hạ sốt', 'Viên nén', 'viên', 1200, 1, '{"covered":true,"paymentRate":100,"tariff":1200,"condition":"","source":"Thông tư 20/2022/TT-BYT","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med002', 'MED002', 'Ibuprofen 400 mg', 'Ibuprofen', 'Giảm đau - kháng viêm', 'Viên nén', 'viên', 1800, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med003', 'MED003', 'Aspirin 81 mg', 'Acetylsalicylic acid', 'Tim mạch', 'Viên nén', 'viên', 900, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med004', 'MED004', 'Amoxicillin 500 mg', 'Amoxicillin', 'Kháng sinh', 'Viên nang', 'viên', 2400, 1, '{"covered":true,"paymentRate":100,"tariff":2400,"condition":"","source":"Thông tư 20/2022/TT-BYT","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med005', 'MED005', 'Azithromycin 500 mg', 'Azithromycin', 'Kháng sinh', 'Viên nén', 'viên', 9500, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med006', 'MED006', 'Cefuroxime 500 mg', 'Cefuroxime', 'Kháng sinh', 'Viên nén', 'viên', 12500, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med007', 'MED007', 'Metronidazole 250 mg', 'Metronidazole', 'Kháng sinh', 'Viên nén', 'viên', 1100, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med008', 'MED008', 'Doxycycline 100 mg', 'Doxycycline', 'Kháng sinh', 'Viên nang', 'viên', 1700, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med009', 'MED009', 'Cetirizine 10 mg', 'Cetirizine', 'Dị ứng', 'Viên nén', 'viên', 1300, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med010', 'MED010', 'Loratadine 10 mg', 'Loratadine', 'Dị ứng', 'Viên nén', 'viên', 1600, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med011', 'MED011', 'Chlorpheniramine 4 mg', 'Chlorpheniramine', 'Dị ứng', 'Viên nén', 'viên', 500, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med012', 'MED012', 'Salbutamol 2 mg', 'Salbutamol', 'Hô hấp', 'Viên nén', 'viên', 800, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med013', 'MED013', 'Salbutamol 100 mcg', 'Salbutamol', 'Hô hấp', 'Bình xịt', 'bình', 78000, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med014', 'MED014', 'Budesonide 0,5 mg/2 ml', 'Budesonide', 'Hô hấp', 'Ống khí dung', 'ống', 13500, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med015', 'MED015', 'Acetylcysteine 200 mg', 'Acetylcysteine', 'Hô hấp', 'Gói bột', 'gói', 2200, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med016', 'MED016', 'Dextromethorphan 15 mg', 'Dextromethorphan', 'Hô hấp', 'Viên nén', 'viên', 900, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med017', 'MED017', 'Omeprazole 20 mg', 'Omeprazole', 'Tiêu hóa', 'Viên nang', 'viên', 1400, 1, '{"covered":true,"paymentRate":100,"tariff":1400,"condition":"","source":"Thông tư 20/2022/TT-BYT","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med018', 'MED018', 'Esomeprazole 40 mg', 'Esomeprazole', 'Tiêu hóa', 'Viên nén', 'viên', 5200, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med019', 'MED019', 'Domperidone 10 mg', 'Domperidone', 'Tiêu hóa', 'Viên nén', 'viên', 1000, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med020', 'MED020', 'Smectite 3 g', 'Diosmectite', 'Tiêu hóa', 'Gói bột', 'gói', 4200, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med021', 'MED021', 'Loperamide 2 mg', 'Loperamide', 'Tiêu hóa', 'Viên nang', 'viên', 900, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med022', 'MED022', 'Lactulose 10 g/15 ml', 'Lactulose', 'Tiêu hóa', 'Gói dung dịch', 'gói', 6500, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med023', 'MED023', 'Amlodipine 5 mg', 'Amlodipine', 'Tim mạch', 'Viên nén', 'viên', 1200, 1, '{"covered":true,"paymentRate":100,"tariff":1200,"condition":"","source":"Thông tư 20/2022/TT-BYT","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med024', 'MED024', 'Losartan 50 mg', 'Losartan', 'Tim mạch', 'Viên nén', 'viên', 2100, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med025', 'MED025', 'Bisoprolol 2,5 mg', 'Bisoprolol', 'Tim mạch', 'Viên nén', 'viên', 2500, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med026', 'MED026', 'Atorvastatin 20 mg', 'Atorvastatin', 'Tim mạch', 'Viên nén', 'viên', 2600, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med027', 'MED027', 'Clopidogrel 75 mg', 'Clopidogrel', 'Tim mạch', 'Viên nén', 'viên', 4200, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med028', 'MED028', 'Furosemide 40 mg', 'Furosemide', 'Tim mạch', 'Viên nén', 'viên', 700, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med029', 'MED029', 'Metformin 500 mg', 'Metformin', 'Nội tiết', 'Viên nén', 'viên', 900, 1, '{"covered":true,"paymentRate":100,"tariff":900,"condition":"","source":"Thông tư 20/2022/TT-BYT","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med030', 'MED030', 'Gliclazide MR 30 mg', 'Gliclazide', 'Nội tiết', 'Viên nén', 'viên', 2800, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med031', 'MED031', 'Levothyroxine 50 mcg', 'Levothyroxine', 'Nội tiết', 'Viên nén', 'viên', 1800, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med032', 'MED032', 'Vitamin D3 1000 IU', 'Cholecalciferol', 'Vitamin - khoáng chất', 'Viên nang', 'viên', 1300, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med033', 'MED033', 'Calcium 500 mg', 'Calcium carbonate', 'Vitamin - khoáng chất', 'Viên nén', 'viên', 1700, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med034', 'MED034', 'Vitamin C 500 mg', 'Ascorbic acid', 'Vitamin - khoáng chất', 'Viên sủi', 'viên', 3500, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med035', 'MED035', 'Kẽm 10 mg', 'Zinc gluconate', 'Vitamin - khoáng chất', 'Viên nén', 'viên', 1500, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med036', 'MED036', 'Sắt fumarate 200 mg', 'Ferrous fumarate', 'Vitamin - khoáng chất', 'Viên nang', 'viên', 2200, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med037', 'MED037', 'Diclofenac gel 1%', 'Diclofenac', 'Cơ xương khớp', 'Gel bôi', 'tuýp', 42000, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med038', 'MED038', 'Meloxicam 7,5 mg', 'Meloxicam', 'Cơ xương khớp', 'Viên nén', 'viên', 1800, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med039', 'MED039', 'Glucosamine 500 mg', 'Glucosamine', 'Cơ xương khớp', 'Viên nang', 'viên', 3200, 1, '{"covered":true,"paymentRate":100,"tariff":3200,"condition":"Chỉ thanh toán điều trị thoái hóa khớp gối mức độ nhẹ và trung bình.","source":"Thông tư 20/2022/TT-BYT","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med040', 'MED040', 'Eperisone 50 mg', 'Eperisone', 'Cơ xương khớp', 'Viên nén', 'viên', 2600, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med041', 'MED041', 'Hydrocortisone cream 1%', 'Hydrocortisone', 'Da liễu', 'Kem bôi', 'tuýp', 28000, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med042', 'MED042', 'Clotrimazole cream 1%', 'Clotrimazole', 'Da liễu', 'Kem bôi', 'tuýp', 32000, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med043', 'MED043', 'Mupirocin ointment 2%', 'Mupirocin', 'Da liễu', 'Thuốc mỡ', 'tuýp', 58000, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med044', 'MED044', 'Ketoconazole shampoo 2%', 'Ketoconazole', 'Da liễu', 'Dầu gội', 'chai', 95000, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med045', 'MED045', 'Nước muối NaCl 0,9% 500 ml', 'Sodium chloride', 'Dung dịch', 'Dung dịch', 'chai', 14000, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med046', 'MED046', 'Nước muối nhỏ mắt 0,9%', 'Sodium chloride', 'Mắt', 'Dung dịch nhỏ mắt', 'chai', 9000, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med047', 'MED047', 'Tobramycin 0,3%', 'Tobramycin', 'Mắt', 'Dung dịch nhỏ mắt', 'chai', 38000, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med048', 'MED048', 'Artificial tears 0,5%', 'Carboxymethylcellulose', 'Mắt', 'Dung dịch nhỏ mắt', 'chai', 48000, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med049', 'MED049', 'Ofloxacin 0,3%', 'Ofloxacin', 'Tai Mũi Họng', 'Dung dịch nhỏ tai', 'chai', 42000, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med050', 'MED050', 'Xylometazoline 0,05%', 'Xylometazoline', 'Tai Mũi Họng', 'Dung dịch nhỏ mũi', 'chai', 26000, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med051', 'MED051', 'Povidone iodine 10%', 'Povidone iodine', 'Sát khuẩn', 'Dung dịch', 'chai', 28000, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med052', 'MED052', 'Chlorhexidine 0,05%', 'Chlorhexidine', 'Sát khuẩn', 'Dung dịch', 'chai', 35000, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med053', 'MED053', 'ORS chuẩn WHO', 'Glucose + điện giải', 'Bù nước điện giải', 'Gói bột', 'gói', 3200, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med054', 'MED054', 'Probiotic 1 tỷ CFU', 'Bacillus clausii', 'Tiêu hóa', 'Ống uống', 'ống', 7500, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med055', 'MED055', 'Menthol lozenge', 'Menthol', 'Tai Mũi Họng', 'Viên ngậm', 'viên', 1800, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med056', 'MED056', 'Methylprednisolone 4 mg', 'Methylprednisolone', 'Kháng viêm', 'Viên nén', 'viên', 1600, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med057', 'MED057', 'Prednisolone 5 mg', 'Prednisolone', 'Kháng viêm', 'Viên nén', 'viên', 800, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med058', 'MED058', 'Gabapentin 300 mg', 'Gabapentin', 'Thần kinh', 'Viên nang', 'viên', 3500, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med059', 'MED059', 'Betahistine 16 mg', 'Betahistine', 'Thần kinh', 'Viên nén', 'viên', 2300, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med060', 'MED060', 'Magnesium B6', 'Magnesium + Vitamin B6', 'Vitamin - khoáng chất', 'Viên nén', 'viên', 1900, 1, '{"covered":false,"paymentRate":0,"tariff":0,"condition":"Chưa có mapping đủ căn cứ trong dữ liệu demo.","source":"Chưa xác minh","effectiveFrom":"2023-03-01"}');
INSERT INTO medicines (id, code, name, active_ingredient, medicine_group, dosage_form, unit, sale_price, active, insurance) VALUES ('med061', 'MED061', 'Cetuximab 100 mg/20 ml', 'Cetuximab', 'Điều trị ung thư', 'Dung dịch tiêm truyền', 'lọ', 4500000, 1, '{"covered":true,"paymentRate":50,"tariff":4500000,"condition":"Chỉ thanh toán theo chỉ định, bệnh và cơ sở đáp ứng điều kiện trong danh mục.","source":"Thông tư 20/2022/TT-BYT và văn bản sửa đổi, bổ sung hiện hành","effectiveFrom":"2023-03-01"}');
INSERT INTO promotions (id, name, mode, code, kind, value, max_discount, minimum_amount, starts_on, ends_on, audience, discount_scope, total_limit, per_patient_limit, active, branch_ids, service_ids) VALUES ('promo-welcome', 'Ưu đãi đặt khám An Tâm', 'code', 'ANTAM50', 'fixed', 50000, 50000, 150000, '2020-01-01', '2099-12-31', 'all', 'outside', 500, 1, 1, '[]', '[]');
INSERT INTO promotions (id, name, mode, code, kind, value, max_discount, minimum_amount, starts_on, ends_on, audience, discount_scope, total_limit, per_patient_limit, active, branch_ids, service_ids) VALUES ('promo-package', 'Ưu đãi gói khám 5%', 'auto', NULL, 'percent', 5, 100000, 500000, '2020-01-01', '2099-12-31', 'all', 'outside', 1000, 3, 1, '[]', '["package:pkg1","package:pkg2","package:pkg3","package:pkg4"]');
INSERT INTO insurance_rules (id, effective_from, effective_to, low_cost_threshold, annual_copay_threshold, source) VALUES ('bhyt-rules-2025', '2025-07-01', '2026-06-30', 351000, 14040000, 'Nghị định 188/2025/NĐ-CP');
INSERT INTO insurance_rules (id, effective_from, effective_to, low_cost_threshold, annual_copay_threshold, source) VALUES ('bhyt-rules-2026', '2026-07-01', '2099-12-31', 379500, 15180000, 'VBHN 40/VBHN-VPQH; Nghị định 188/2025/NĐ-CP; Nghị định 161/2026/NĐ-CP');
INSERT INTO insurance_policies (id, branch_id, policy_version, enabled, effective_from, effective_to, note) VALUES ('policy-b1-1', 'b1', 1, 1, '2020-01-01', '2099-12-31', 'Biểu giá giả lập phục vụ demo, không phải biểu giá BHYT pháp định.');
INSERT INTO insurance_tariffs (policy_id, service_id, tariff) VALUES ('policy-b1-1', 'consultation', 50000);
INSERT INTO insurance_tariffs (policy_id, service_id, tariff) VALUES ('policy-b1-1', 'blood-test', 80000);
INSERT INTO insurance_tariffs (policy_id, service_id, tariff) VALUES ('policy-b1-1', 'ecg', 90000);
INSERT INTO insurance_tariffs (policy_id, service_id, tariff) VALUES ('policy-b1-1', 'ultrasound', 160000);
INSERT INTO insurance_policies (id, branch_id, policy_version, enabled, effective_from, effective_to, note) VALUES ('policy-b2-1', 'b2', 1, 1, '2020-01-01', '2099-12-31', 'Biểu giá giả lập phục vụ demo, không phải biểu giá BHYT pháp định.');
INSERT INTO insurance_tariffs (policy_id, service_id, tariff) VALUES ('policy-b2-1', 'consultation', 50000);
INSERT INTO insurance_tariffs (policy_id, service_id, tariff) VALUES ('policy-b2-1', 'blood-test', 80000);
INSERT INTO insurance_tariffs (policy_id, service_id, tariff) VALUES ('policy-b2-1', 'ecg', 90000);
INSERT INTO insurance_tariffs (policy_id, service_id, tariff) VALUES ('policy-b2-1', 'ultrasound', 160000);
INSERT INTO insurance_policies (id, branch_id, policy_version, enabled, effective_from, effective_to, note) VALUES ('policy-b3-1', 'b3', 1, 1, '2020-01-01', '2099-12-31', 'Biểu giá giả lập phục vụ demo, không phải biểu giá BHYT pháp định.');
INSERT INTO insurance_tariffs (policy_id, service_id, tariff) VALUES ('policy-b3-1', 'consultation', 50000);
INSERT INTO insurance_tariffs (policy_id, service_id, tariff) VALUES ('policy-b3-1', 'blood-test', 80000);
INSERT INTO insurance_tariffs (policy_id, service_id, tariff) VALUES ('policy-b3-1', 'ecg', 90000);
INSERT INTO insurance_tariffs (policy_id, service_id, tariff) VALUES ('policy-b3-1', 'ultrasound', 160000);
INSERT INTO insurance_policies (id, branch_id, policy_version, enabled, effective_from, effective_to, note) VALUES ('policy-b4-1', 'b4', 1, 1, '2020-01-01', '2099-12-31', 'Biểu giá giả lập phục vụ demo, không phải biểu giá BHYT pháp định.');
INSERT INTO insurance_tariffs (policy_id, service_id, tariff) VALUES ('policy-b4-1', 'consultation', 50000);
INSERT INTO insurance_tariffs (policy_id, service_id, tariff) VALUES ('policy-b4-1', 'blood-test', 80000);
INSERT INTO insurance_tariffs (policy_id, service_id, tariff) VALUES ('policy-b4-1', 'ecg', 90000);
INSERT INTO insurance_tariffs (policy_id, service_id, tariff) VALUES ('policy-b4-1', 'ultrasound', 160000);
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1000', 'p1', 'b1', 'dr1', 'dep1', 'sp1', 'pkg1', 'doctor', '2026-07-29', '08:00', 'completed', 'Khám tổng quát', 600000, 30, NULL, NULL, 5, '2026-07-26 09:00:00', '2026-07-26 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1000', 'self', NULL, 'Nguyễn Hoàng An', '0920000000', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1000', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"package:pkg1","name":"Khám tổng quát","unitPrice":600000,"quantity":1,"discountable":true,"total":600000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":600000,"discount":0,"patientDue":600000}],"subtotal":600000,"insurer":0,"copay":0,"outside":600000,"discount":0,"patientDue":600000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"package:pkg1","name":"Khám tổng quát","unitPrice":600000,"quantity":1,"discountable":true,"total":600000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":600000,"discount":0,"patientDue":600000}],"subtotal":600000,"insurer":0,"copay":0,"outside":600000,"discount":0,"patientDue":600000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-07-26T09:00:00","by":"migration","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1000', 'package:pkg1', NULL, 'Khám tổng quát', 600000, 1, 1, '{"serviceId":"package:pkg1","name":"Khám tổng quát","unitPrice":600000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1001', 'p1', 'b1', 'dr1', 'dep1', 'sp1', NULL, 'doctor', '2026-08-23', '08:00', 'completed', 'Khám Nội tổng quát', 200000, 30, NULL, NULL, 4, '2026-08-20 09:00:00', '2026-08-20 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1001', 'self', NULL, 'Nguyễn Hoàng An', '0920000000', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1001', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-20T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-08-23', 'pay-AT-1001', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1001', 'consultation', NULL, 'Khám Nội tổng quát', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1002', 'p1', 'b1', 'dr1', 'dep1', 'sp1', NULL, 'doctor', '2026-09-17', '08:00', 'completed', 'Khám Nội tổng quát', 200000, 30, NULL, NULL, 5, '2026-09-14 09:00:00', '2026-09-14 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1002', 'self', NULL, 'Nguyễn Hoàng An', '0920000000', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1002', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-09-14T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-09-17', 'pay-AT-1002', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1002', 'consultation', NULL, 'Khám Nội tổng quát', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1003', 'p2', 'b1', 'dr2', 'dep2', 'sp2', NULL, 'doctor', '2026-07-30', '09:00', 'completed', 'Khám Tim mạch', 250000, 30, NULL, NULL, 4, '2026-07-27 09:00:00', '2026-07-27 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1003', 'self', NULL, 'Trần Thanh Lan', '0920000001', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1003', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-07-27T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-07-30', 'pay-AT-1003', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1003', 'consultation', NULL, 'Khám Tim mạch', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1004', 'p2', 'b1', 'dr2', 'dep2', 'sp2', NULL, 'doctor', '2026-08-24', '09:00', 'completed', 'Khám Tim mạch', 250000, 30, NULL, NULL, 5, '2026-08-21 09:00:00', '2026-08-21 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1004', 'self', NULL, 'Trần Thanh Lan', '0920000001', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1004', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-21T09:00:00","by":"migration","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1004', 'consultation', NULL, 'Khám Tim mạch', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1005', 'p2', 'b1', 'dr2', 'dep2', 'sp2', NULL, 'doctor', '2026-09-18', '09:00', 'completed', 'Khám Tim mạch', 250000, 30, NULL, NULL, 4, '2026-09-15 09:00:00', '2026-09-15 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1005', 'self', NULL, 'Trần Thanh Lan', '0920000001', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1005', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-09-15T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-09-18', 'pay-AT-1005', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1005', 'consultation', NULL, 'Khám Tim mạch', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-NEXT-1', 'p2', 'b1', 'dr2', 'dep2', 'sp2', NULL, 'doctor', '2026-10-16', '09:00', 'confirmed', 'Khám Tim mạch', 250000, 30, NULL, NULL, NULL, '2026-10-13 09:00:00', '2026-10-13 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-NEXT-1', 'self', NULL, 'Trần Thanh Lan', '0920000001', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-NEXT-1', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-NEXT-1', 'consultation', NULL, 'Khám Tim mạch', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1006', 'p3', 'b1', 'dr3', 'dep3', 'sp3', NULL, 'doctor', '2026-07-31', '10:00', 'completed', 'Khám Nhi khoa', 300000, 30, NULL, NULL, 5, '2026-07-28 09:00:00', '2026-07-28 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1006', 'self', NULL, 'Lê Gia Hân', '0920000002', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1006', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-07-28T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-07-31', 'pay-AT-1006', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1006', 'consultation', NULL, 'Khám Nhi khoa', 300000, 1, 1, '{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1007', 'p3', 'b1', 'dr3', 'dep3', 'sp3', NULL, 'doctor', '2026-08-25', '10:00', 'completed', 'Khám Nhi khoa', 300000, 30, NULL, NULL, 4, '2026-08-22 09:00:00', '2026-08-22 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1007', 'self', NULL, 'Lê Gia Hân', '0920000002', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1007', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-22T09:00:00","by":"migration","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1007', 'consultation', NULL, 'Khám Nhi khoa', 300000, 1, 1, '{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1008', 'p3', 'b1', 'dr3', 'dep3', 'sp3', NULL, 'doctor', '2026-09-19', '10:00', 'cancelled', 'Khám Nhi khoa', 300000, 30, 'Người bệnh thay đổi lịch cá nhân.', NULL, NULL, '2026-09-16 09:00:00', NULL, NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1008', 'self', NULL, 'Lê Gia Hân', '0920000002', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1008', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1008', 'consultation', NULL, 'Khám Nhi khoa', 300000, 1, 1, '{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-NEXT-2', 'p3', 'b1', 'dr3', 'dep3', 'sp3', NULL, 'doctor', '2026-10-17', '10:00', 'pending', 'Khám Nhi khoa', 300000, 30, NULL, NULL, NULL, '2026-10-14 09:00:00', NULL, NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-NEXT-2', 'self', NULL, 'Lê Gia Hân', '0920000002', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-NEXT-2', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-NEXT-2', 'consultation', NULL, 'Khám Nhi khoa', 300000, 1, 1, '{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1009', 'p4', 'b2', 'dr4', 'dep4', 'sp4', NULL, 'doctor', '2026-08-01', '13:30', 'completed', 'Khám Da liễu', 200000, 30, NULL, NULL, 4, '2026-07-29 09:00:00', '2026-07-29 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1009', 'self', NULL, 'Phạm Đức Minh', '0920000003', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1009', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-07-29T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-08-01', 'pay-AT-1009', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1009', 'consultation', NULL, 'Khám Da liễu', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1010', 'p4', 'b2', 'dr4', 'dep4', 'sp4', NULL, 'doctor', '2026-08-26', '13:30', 'completed', 'Khám Da liễu', 200000, 30, NULL, NULL, 3, '2026-08-23 09:00:00', '2026-08-23 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1010', 'self', NULL, 'Phạm Đức Minh', '0920000003', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1010', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-23T09:00:00","by":"migration","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1010', 'consultation', NULL, 'Khám Da liễu', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1011', 'p4', 'b2', 'dr4', 'dep4', 'sp4', NULL, 'doctor', '2026-09-20', '13:30', 'absent', 'Khám Da liễu', 200000, 30, NULL, NULL, NULL, '2026-09-17 09:00:00', NULL, NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1011', 'self', NULL, 'Phạm Đức Minh', '0920000003', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1011', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1011', 'consultation', NULL, 'Khám Da liễu', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-NEXT-3', 'p4', 'b2', 'dr4', 'dep4', 'sp4', NULL, 'doctor', '2026-10-18', '13:30', 'confirmed', 'Khám Da liễu', 200000, 30, NULL, NULL, NULL, '2026-10-15 09:00:00', '2026-10-15 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-NEXT-3', 'self', NULL, 'Phạm Đức Minh', '0920000003', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-NEXT-3', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-NEXT-3', 'consultation', NULL, 'Khám Da liễu', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1012', 'p5', 'b2', 'dr5', 'dep5', 'sp5', NULL, 'doctor', '2026-08-02', '14:30', 'completed', 'Khám Tai Mũi Họng', 250000, 30, NULL, NULL, 3, '2026-07-30 09:00:00', '2026-07-30 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1012', 'self', NULL, 'Võ Ngọc Ánh', '0920000004', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1012', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-07-30T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-08-02', 'pay-AT-1012', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1012', 'consultation', NULL, 'Khám Tai Mũi Họng', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1013', 'p5', 'b2', 'dr5', 'dep5', 'sp5', NULL, 'doctor', '2026-08-27', '14:30', 'completed', 'Khám Tai Mũi Họng', 250000, 30, NULL, NULL, 5, '2026-08-24 09:00:00', '2026-08-24 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1013', 'self', NULL, 'Võ Ngọc Ánh', '0920000004', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1013', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-24T09:00:00","by":"migration","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1013', 'consultation', NULL, 'Khám Tai Mũi Họng', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1014', 'p5', 'b2', 'dr5', 'dep5', 'sp5', NULL, 'doctor', '2026-09-21', '14:30', 'rejected', 'Khám Tai Mũi Họng', 250000, 30, 'Bác sĩ có lịch công tác, vui lòng chọn ngày khác.', NULL, NULL, '2026-09-18 09:00:00', NULL, NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1014', 'self', NULL, 'Võ Ngọc Ánh', '0920000004', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1014', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1014', 'consultation', NULL, 'Khám Tai Mũi Họng', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-NEXT-4', 'p5', 'b2', 'dr5', 'dep5', 'sp5', NULL, 'doctor', '2026-10-19', '14:30', 'pending', 'Khám Tai Mũi Họng', 250000, 30, NULL, NULL, NULL, '2026-10-16 09:00:00', NULL, NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-NEXT-4', 'self', NULL, 'Võ Ngọc Ánh', '0920000004', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-NEXT-4', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-NEXT-4', 'consultation', NULL, 'Khám Tai Mũi Họng', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1015', 'p6', 'b2', 'dr6', 'dep6', 'sp6', NULL, 'doctor', '2026-08-03', '15:30', 'completed', 'Khám Cơ xương khớp', 300000, 30, NULL, NULL, 5, '2026-07-31 09:00:00', '2026-07-31 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1015', 'self', NULL, 'Đỗ Quang Huy', '0920000005', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1015', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Cơ xương khớp","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Cơ xương khớp","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-07-31T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-08-03', 'pay-AT-1015', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1015', 'consultation', NULL, 'Khám Cơ xương khớp', 300000, 1, 1, '{"serviceId":"consultation","name":"Khám Cơ xương khớp","unitPrice":300000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1016', 'p6', 'b2', 'dr6', 'dep6', 'sp6', NULL, 'doctor', '2026-08-28', '15:30', 'completed', 'Khám Cơ xương khớp', 300000, 30, NULL, NULL, 4, '2026-08-25 09:00:00', '2026-08-25 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1016', 'self', NULL, 'Đỗ Quang Huy', '0920000005', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1016', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Cơ xương khớp","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Cơ xương khớp","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-25T09:00:00","by":"migration","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1016', 'consultation', NULL, 'Khám Cơ xương khớp', 300000, 1, 1, '{"serviceId":"consultation","name":"Khám Cơ xương khớp","unitPrice":300000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1017', 'p6', 'b2', 'dr6', 'dep6', 'sp6', NULL, 'doctor', '2026-09-22', '15:30', 'completed', 'Khám Cơ xương khớp', 300000, 30, NULL, NULL, 5, '2026-09-19 09:00:00', '2026-09-19 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1017', 'self', NULL, 'Đỗ Quang Huy', '0920000005', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1017', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Cơ xương khớp","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Cơ xương khớp","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-09-19T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-09-22', 'pay-AT-1017', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1017', 'consultation', NULL, 'Khám Cơ xương khớp', 300000, 1, 1, '{"serviceId":"consultation","name":"Khám Cơ xương khớp","unitPrice":300000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-NEXT-5', 'p6', 'b2', 'dr6', 'dep6', 'sp6', NULL, 'doctor', '2026-10-20', '15:30', 'confirmed', 'Khám Cơ xương khớp', 300000, 30, NULL, NULL, NULL, '2026-10-17 09:00:00', '2026-10-17 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-NEXT-5', 'self', NULL, 'Đỗ Quang Huy', '0920000005', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-NEXT-5', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Cơ xương khớp","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-NEXT-5', 'consultation', NULL, 'Khám Cơ xương khớp', 300000, 1, 1, '{"serviceId":"consultation","name":"Khám Cơ xương khớp","unitPrice":300000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1018', 'p7', 'b3', 'dr7', 'dep7', 'sp1', NULL, 'doctor', '2026-08-04', '08:00', 'completed', 'Khám Nội tổng quát', 200000, 30, NULL, NULL, 4, '2026-08-01 09:00:00', '2026-08-01 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1018', 'self', NULL, 'Bùi Kim Ngân', '0920000006', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1018', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-01T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-08-04', 'pay-AT-1018', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1018', 'consultation', NULL, 'Khám Nội tổng quát', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1019', 'p7', 'b3', 'dr7', 'dep7', 'sp1', NULL, 'doctor', '2026-08-29', '08:00', 'completed', 'Khám Nội tổng quát', 200000, 30, NULL, NULL, 5, '2026-08-26 09:00:00', '2026-08-26 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1019', 'self', NULL, 'Bùi Kim Ngân', '0920000006', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1019', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-26T09:00:00","by":"migration","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1019', 'consultation', NULL, 'Khám Nội tổng quát', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1020', 'p7', 'b3', 'dr7', 'dep7', 'sp1', NULL, 'doctor', '2026-09-23', '08:00', 'completed', 'Khám Nội tổng quát', 200000, 30, NULL, NULL, 4, '2026-09-20 09:00:00', '2026-09-20 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1020', 'self', NULL, 'Bùi Kim Ngân', '0920000006', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1020', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-09-20T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-09-23', 'pay-AT-1020', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1020', 'consultation', NULL, 'Khám Nội tổng quát', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-NEXT-6', 'p7', 'b3', 'dr7', 'dep7', 'sp1', NULL, 'doctor', '2026-10-21', '08:00', 'pending', 'Khám Nội tổng quát', 200000, 30, NULL, NULL, NULL, '2026-10-18 09:00:00', NULL, NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-NEXT-6', 'self', NULL, 'Bùi Kim Ngân', '0920000006', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-NEXT-6', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-NEXT-6', 'consultation', NULL, 'Khám Nội tổng quát', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1021', 'p8', 'b3', 'dr9', 'dep9', 'sp3', NULL, 'doctor', '2026-08-05', '09:00', 'completed', 'Khám Nhi khoa', 300000, 30, NULL, NULL, 5, '2026-08-02 09:00:00', '2026-08-02 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1021', 'self', NULL, 'Ngô Tuấn Kiệt', '0920000007', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1021', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-02T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-08-05', 'pay-AT-1021', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1021', 'consultation', NULL, 'Khám Nhi khoa', 300000, 1, 1, '{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1022', 'p8', 'b3', 'dr9', 'dep9', 'sp3', NULL, 'doctor', '2026-08-30', '09:00', 'completed', 'Khám Nhi khoa', 300000, 30, NULL, NULL, 4, '2026-08-27 09:00:00', '2026-08-27 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1022', 'self', NULL, 'Ngô Tuấn Kiệt', '0920000007', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1022', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-27T09:00:00","by":"migration","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1022', 'consultation', NULL, 'Khám Nhi khoa', 300000, 1, 1, '{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1023', 'p8', 'b3', 'dr9', 'dep9', 'sp3', NULL, 'doctor', '2026-09-24', '09:00', 'completed', 'Khám Nhi khoa', 300000, 30, NULL, NULL, 3, '2026-09-21 09:00:00', '2026-09-21 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1023', 'self', NULL, 'Ngô Tuấn Kiệt', '0920000007', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1023', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-09-21T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-09-24', 'pay-AT-1023', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1023', 'consultation', NULL, 'Khám Nhi khoa', 300000, 1, 1, '{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-NEXT-7', 'p8', 'b3', 'dr9', 'dep9', 'sp3', NULL, 'doctor', '2026-10-22', '09:00', 'confirmed', 'Khám Nhi khoa', 300000, 30, NULL, NULL, NULL, '2026-10-19 09:00:00', '2026-10-19 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-NEXT-7', 'self', NULL, 'Ngô Tuấn Kiệt', '0920000007', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-NEXT-7', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-NEXT-7', 'consultation', NULL, 'Khám Nhi khoa', 300000, 1, 1, '{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1024', 'p9', 'b4', 'dr10', 'dep10', 'sp4', NULL, 'doctor', '2026-08-06', '10:00', 'completed', 'Khám Da liễu', 200000, 30, NULL, NULL, 4, '2026-08-03 09:00:00', '2026-08-03 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1024', 'self', NULL, 'Phan Hải Đăng', '0920000008', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1024', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-03T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-08-06', 'pay-AT-1024', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1024', 'consultation', NULL, 'Khám Da liễu', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1025', 'p9', 'b4', 'dr10', 'dep10', 'sp4', NULL, 'doctor', '2026-08-31', '10:00', 'completed', 'Khám Da liễu', 200000, 30, NULL, NULL, 3, '2026-08-28 09:00:00', '2026-08-28 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1025', 'self', NULL, 'Phan Hải Đăng', '0920000008', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1025', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-28T09:00:00","by":"migration","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1025', 'consultation', NULL, 'Khám Da liễu', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1026', 'p9', 'b4', 'dr10', 'dep10', 'sp4', NULL, 'doctor', '2026-09-25', '10:00', 'cancelled', 'Khám Da liễu', 200000, 30, 'Người bệnh thay đổi lịch cá nhân.', NULL, NULL, '2026-09-22 09:00:00', NULL, NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1026', 'self', NULL, 'Phan Hải Đăng', '0920000008', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1026', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1026', 'consultation', NULL, 'Khám Da liễu', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-NEXT-8', 'p9', 'b4', 'dr10', 'dep10', 'sp4', NULL, 'doctor', '2026-10-23', '10:00', 'pending', 'Khám Da liễu', 200000, 30, NULL, NULL, NULL, '2026-10-20 09:00:00', NULL, NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-NEXT-8', 'self', NULL, 'Phan Hải Đăng', '0920000008', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-NEXT-8', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-NEXT-8', 'consultation', NULL, 'Khám Da liễu', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1027', 'p10', 'b4', 'dr11', 'dep11', 'sp5', NULL, 'doctor', '2026-08-07', '13:30', 'completed', 'Khám Tai Mũi Họng', 250000, 30, NULL, NULL, 3, '2026-08-04 09:00:00', '2026-08-04 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1027', 'self', NULL, 'Đặng Thảo Vy', '0920000009', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1027', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-04T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-08-07', 'pay-AT-1027', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1027', 'consultation', NULL, 'Khám Tai Mũi Họng', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1028', 'p10', 'b4', 'dr11', 'dep11', 'sp5', NULL, 'doctor', '2026-09-01', '13:30', 'completed', 'Khám Tai Mũi Họng', 250000, 30, NULL, NULL, 5, '2026-08-29 09:00:00', '2026-08-29 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1028', 'self', NULL, 'Đặng Thảo Vy', '0920000009', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1028', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-29T09:00:00","by":"migration","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1028', 'consultation', NULL, 'Khám Tai Mũi Họng', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1029', 'p10', 'b4', 'dr11', 'dep11', 'sp5', NULL, 'doctor', '2026-09-26', '13:30', 'absent', 'Khám Tai Mũi Họng', 250000, 30, NULL, NULL, NULL, '2026-09-23 09:00:00', NULL, NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1029', 'self', NULL, 'Đặng Thảo Vy', '0920000009', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1029', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1029', 'consultation', NULL, 'Khám Tai Mũi Họng', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-NEXT-9', 'p10', 'b4', 'dr11', 'dep11', 'sp5', NULL, 'doctor', '2026-10-24', '13:30', 'confirmed', 'Khám Tai Mũi Họng', 250000, 30, NULL, NULL, NULL, '2026-10-21 09:00:00', '2026-10-21 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-NEXT-9', 'self', NULL, 'Đặng Thảo Vy', '0920000009', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-NEXT-9', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-NEXT-9', 'consultation', NULL, 'Khám Tai Mũi Họng', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1030', 'p11', 'b1', 'dr1', 'dep1', 'sp1', NULL, 'doctor', '2026-08-08', '14:30', 'completed', 'Khám Nội tổng quát', 200000, 30, NULL, NULL, 5, '2026-08-05 09:00:00', '2026-08-05 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1030', 'self', NULL, 'Trịnh Minh Châu', '0920000010', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1030', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-05T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-08-08', 'pay-AT-1030', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1030', 'consultation', NULL, 'Khám Nội tổng quát', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1031', 'p11', 'b1', 'dr1', 'dep1', 'sp1', NULL, 'doctor', '2026-09-02', '14:30', 'completed', 'Khám Nội tổng quát', 200000, 30, NULL, NULL, 4, '2026-08-30 09:00:00', '2026-08-30 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1031', 'self', NULL, 'Trịnh Minh Châu', '0920000010', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1031', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-30T09:00:00","by":"migration","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1031', 'consultation', NULL, 'Khám Nội tổng quát', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1032', 'p11', 'b1', 'dr1', 'dep1', 'sp1', NULL, 'doctor', '2026-09-27', '14:30', 'rejected', 'Khám Nội tổng quát', 200000, 30, 'Bác sĩ có lịch công tác, vui lòng chọn ngày khác.', NULL, NULL, '2026-09-24 09:00:00', NULL, NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1032', 'self', NULL, 'Trịnh Minh Châu', '0920000010', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1032', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1032', 'consultation', NULL, 'Khám Nội tổng quát', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-NEXT-10', 'p11', 'b1', 'dr1', 'dep1', 'sp1', NULL, 'doctor', '2026-10-15', '14:30', 'pending', 'Khám Nội tổng quát', 200000, 30, NULL, NULL, NULL, '2026-10-12 09:00:00', NULL, NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-NEXT-10', 'self', NULL, 'Trịnh Minh Châu', '0920000010', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-NEXT-10', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-NEXT-10', 'consultation', NULL, 'Khám Nội tổng quát', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1033', 'p12', 'b1', 'dr2', 'dep2', 'sp2', NULL, 'doctor', '2026-08-09', '15:30', 'completed', 'Khám Tim mạch', 250000, 30, NULL, NULL, 4, '2026-08-06 09:00:00', '2026-08-06 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1033', 'self', NULL, 'Lý Thanh Bình', '0920000011', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1033', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-06T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-08-09', 'pay-AT-1033', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1033', 'consultation', NULL, 'Khám Tim mạch', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1034', 'p12', 'b1', 'dr2', 'dep2', 'sp2', NULL, 'doctor', '2026-09-03', '15:30', 'completed', 'Khám Tim mạch', 250000, 30, NULL, NULL, 5, '2026-08-31 09:00:00', '2026-08-31 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1034', 'self', NULL, 'Lý Thanh Bình', '0920000011', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1034', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-31T09:00:00","by":"migration","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1034', 'consultation', NULL, 'Khám Tim mạch', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1035', 'p12', 'b1', 'dr2', 'dep2', 'sp2', NULL, 'doctor', '2026-09-28', '15:30', 'completed', 'Khám Tim mạch', 250000, 30, NULL, NULL, 4, '2026-09-25 09:00:00', '2026-09-25 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1035', 'self', NULL, 'Lý Thanh Bình', '0920000011', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1035', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-09-25T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-09-28', 'pay-AT-1035', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1035', 'consultation', NULL, 'Khám Tim mạch', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-NEXT-11', 'p12', 'b1', 'dr2', 'dep2', 'sp2', NULL, 'doctor', '2026-10-16', '15:30', 'confirmed', 'Khám Tim mạch', 250000, 30, NULL, NULL, NULL, '2026-10-13 09:00:00', '2026-10-13 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-NEXT-11', 'self', NULL, 'Lý Thanh Bình', '0920000011', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-NEXT-11', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-NEXT-11', 'consultation', NULL, 'Khám Tim mạch', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tim mạch","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1036', 'p13', 'b2', 'dr4', 'dep4', 'sp4', NULL, 'doctor', '2026-08-10', '08:00', 'completed', 'Khám Da liễu', 200000, 30, NULL, NULL, 5, '2026-08-07 09:00:00', '2026-08-07 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1036', 'self', NULL, 'Hoàng Bảo Ngọc', '0920000012', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1036', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-07T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-08-10', 'pay-AT-1036', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1036', 'consultation', NULL, 'Khám Da liễu', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1037', 'p13', 'b2', 'dr4', 'dep4', 'sp4', NULL, 'doctor', '2026-09-04', '08:00', 'completed', 'Khám Da liễu', 200000, 30, NULL, NULL, 4, '2026-09-01 09:00:00', '2026-09-01 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1037', 'self', NULL, 'Hoàng Bảo Ngọc', '0920000012', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1037', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-09-01T09:00:00","by":"migration","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1037', 'consultation', NULL, 'Khám Da liễu', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1038', 'p13', 'b2', 'dr4', 'dep4', 'sp4', NULL, 'doctor', '2026-09-29', '08:00', 'completed', 'Khám Da liễu', 200000, 30, NULL, NULL, 3, '2026-09-26 09:00:00', '2026-09-26 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1038', 'self', NULL, 'Hoàng Bảo Ngọc', '0920000012', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1038', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-09-26T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-09-29', 'pay-AT-1038', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1038', 'consultation', NULL, 'Khám Da liễu', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-NEXT-12', 'p13', 'b2', 'dr4', 'dep4', 'sp4', NULL, 'doctor', '2026-10-17', '08:00', 'pending', 'Khám Da liễu', 200000, 30, NULL, NULL, NULL, '2026-10-14 09:00:00', NULL, NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-NEXT-12', 'self', NULL, 'Hoàng Bảo Ngọc', '0920000012', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-NEXT-12', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-NEXT-12', 'consultation', NULL, 'Khám Da liễu', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1039', 'p14', 'b3', 'dr9', 'dep9', 'sp3', NULL, 'doctor', '2026-08-11', '09:00', 'completed', 'Khám Nhi khoa', 300000, 30, NULL, NULL, 4, '2026-08-08 09:00:00', '2026-08-08 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1039', 'self', NULL, 'Hồ Anh Khoa', '0920000013', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1039', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-08T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-08-11', 'pay-AT-1039', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1039', 'consultation', NULL, 'Khám Nhi khoa', 300000, 1, 1, '{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1040', 'p14', 'b3', 'dr9', 'dep9', 'sp3', NULL, 'doctor', '2026-09-05', '09:00', 'completed', 'Khám Nhi khoa', 300000, 30, NULL, NULL, 3, '2026-09-02 09:00:00', '2026-09-02 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1040', 'self', NULL, 'Hồ Anh Khoa', '0920000013', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1040', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-09-02T09:00:00","by":"migration","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1040', 'consultation', NULL, 'Khám Nhi khoa', 300000, 1, 1, '{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1041', 'p14', 'b3', 'dr9', 'dep9', 'sp3', NULL, 'doctor', '2026-09-30', '09:00', 'completed', 'Khám Nhi khoa', 300000, 30, NULL, NULL, 5, '2026-09-27 09:00:00', '2026-09-27 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1041', 'self', NULL, 'Hồ Anh Khoa', '0920000013', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1041', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-09-27T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-09-30', 'pay-AT-1041', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1041', 'consultation', NULL, 'Khám Nhi khoa', 300000, 1, 1, '{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-NEXT-13', 'p14', 'b3', 'dr9', 'dep9', 'sp3', NULL, 'doctor', '2026-10-18', '09:00', 'confirmed', 'Khám Nhi khoa', 300000, 30, NULL, NULL, NULL, '2026-10-15 09:00:00', '2026-10-15 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-NEXT-13', 'self', NULL, 'Hồ Anh Khoa', '0920000013', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-NEXT-13', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true,"total":300000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000}],"subtotal":300000,"insurer":0,"copay":0,"outside":300000,"discount":0,"patientDue":300000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-NEXT-13', 'consultation', NULL, 'Khám Nhi khoa', 300000, 1, 1, '{"serviceId":"consultation","name":"Khám Nhi khoa","unitPrice":300000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1042', 'p15', 'b4', 'dr10', 'dep10', 'sp4', NULL, 'doctor', '2026-08-12', '10:00', 'completed', 'Khám Da liễu', 200000, 30, NULL, NULL, 3, '2026-08-09 09:00:00', '2026-08-09 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1042', 'self', NULL, 'Vũ Thu Trang', '0920000014', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1042', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-09T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-08-12', 'pay-AT-1042', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1042', 'consultation', NULL, 'Khám Da liễu', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1043', 'p15', 'b4', 'dr10', 'dep10', 'sp4', NULL, 'doctor', '2026-09-06', '10:00', 'completed', 'Khám Da liễu', 200000, 30, NULL, NULL, 5, '2026-09-03 09:00:00', '2026-09-03 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1043', 'self', NULL, 'Vũ Thu Trang', '0920000014', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1043', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-09-03T09:00:00","by":"migration","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1043', 'consultation', NULL, 'Khám Da liễu', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1044', 'p15', 'b4', 'dr10', 'dep10', 'sp4', NULL, 'doctor', '2026-10-01', '10:00', 'cancelled', 'Khám Da liễu', 200000, 30, 'Người bệnh thay đổi lịch cá nhân.', NULL, NULL, '2026-09-28 09:00:00', NULL, NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1044', 'self', NULL, 'Vũ Thu Trang', '0920000014', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1044', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1044', 'consultation', NULL, 'Khám Da liễu', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-NEXT-14', 'p15', 'b4', 'dr10', 'dep10', 'sp4', NULL, 'doctor', '2026-10-19', '10:00', 'pending', 'Khám Da liễu', 200000, 30, NULL, NULL, NULL, '2026-10-16 09:00:00', NULL, NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-NEXT-14', 'self', NULL, 'Vũ Thu Trang', '0920000014', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-NEXT-14', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-NEXT-14', 'consultation', NULL, 'Khám Da liễu', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Da liễu","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1045', 'p16', 'b4', 'dr11', 'dep11', 'sp5', NULL, 'doctor', '2026-08-13', '13:30', 'completed', 'Khám Tai Mũi Họng', 250000, 30, NULL, NULL, 5, '2026-08-10 09:00:00', '2026-08-10 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1045', 'self', NULL, 'Mai Đức Phúc', '0920000015', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1045', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-08-10T09:00:00","by":"root","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, '2026-08-13', 'pay-AT-1045', 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1045', 'consultation', NULL, 'Khám Tai Mũi Họng', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1046', 'p16', 'b4', 'dr11', 'dep11', 'sp5', NULL, 'doctor', '2026-09-07', '13:30', 'completed', 'Khám Tai Mũi Họng', 250000, 30, NULL, NULL, 4, '2026-09-04 09:00:00', '2026-09-04 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1046', 'self', NULL, 'Mai Đức Phúc', '0920000015', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1046', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', '{"price":{"items":[{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""},"at":"2026-09-04T09:00:00","by":"migration","reason":"Bảo toàn phí của lịch trước phiên bản 3."}', NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1046', 'consultation', NULL, 'Khám Tai Mũi Họng', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-1047', 'p16', 'b4', 'dr11', 'dep11', 'sp5', NULL, 'doctor', '2026-10-02', '13:30', 'absent', 'Khám Tai Mũi Họng', 250000, 30, NULL, NULL, NULL, '2026-09-29 09:00:00', NULL, NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-1047', 'self', NULL, 'Mai Đức Phúc', '0920000015', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-1047', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-1047', 'consultation', NULL, 'Khám Tai Mũi Họng', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-NEXT-15', 'p16', 'b4', 'dr11', 'dep11', 'sp5', NULL, 'doctor', '2026-10-20', '13:30', 'confirmed', 'Khám Tai Mũi Họng', 250000, 30, NULL, NULL, NULL, '2026-10-17 09:00:00', '2026-10-17 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-NEXT-15', 'self', NULL, 'Mai Đức Phúc', '0920000015', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-NEXT-15', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true,"total":250000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000}],"subtotal":250000,"insurer":0,"copay":0,"outside":250000,"discount":0,"patientDue":250000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-NEXT-15', 'consultation', NULL, 'Khám Tai Mũi Họng', 250000, 1, 1, '{"serviceId":"consultation","name":"Khám Tai Mũi Họng","unitPrice":250000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-DEMO-EXAM', 'p1', 'b1', 'dr1', 'dep1', 'sp1', NULL, 'doctor', '2026-10-11', '13:30', 'confirmed', 'Khám Nội tổng quát', 200000, 30, NULL, NULL, NULL, '2026-10-08 09:00:00', '2026-10-08 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-DEMO-EXAM', 'self', NULL, 'Nguyễn Hoàng An', '0920000000', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-DEMO-EXAM', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-DEMO-EXAM', 'consultation', NULL, 'Khám Nội tổng quát', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-DEMO-PENDING', 'p1', 'b1', 'dr1', 'dep1', 'sp1', NULL, 'doctor', '2026-10-13', '10:00', 'pending', 'Khám Nội tổng quát', 200000, 30, NULL, NULL, NULL, '2026-10-10 09:00:00', NULL, NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-DEMO-PENDING', 'self', NULL, 'Nguyễn Hoàng An', '0920000000', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-DEMO-PENDING', 'none', '{"status":"none"}', NULL, '{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000}],"subtotal":200000,"insurer":0,"copay":0,"outside":200000,"discount":0,"patientDue":200000,"unresolved":false,"promotionName":"","promotionId":""}', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-DEMO-PENDING', 'consultation', NULL, 'Khám Nội tổng quát', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO appointments (id, booked_by_user_id, branch_id, doctor_id, department_id, specialty_id, package_id, booking_mode, appointment_date, appointment_time, status, service_name, quoted_price, duration_minutes, reason, notes, rating, created_at, reviewed_at, reviewed_by) VALUES ('AT-TODAY', 'p11', 'b1', 'dr1', 'dep1', 'sp1', NULL, 'doctor', '2026-10-12', '08:00', 'confirmed', 'Khám Nội tổng quát', 200000, 30, NULL, NULL, NULL, '2026-10-09 09:00:00', '2026-10-09 09:00:00', NULL);
INSERT INTO appointment_recipients (appointment_id, recipient_type, relationship, full_name, phone, birth_date, address) VALUES ('AT-TODAY', 'self', NULL, 'Trịnh Minh Châu', '0920000010', NULL, NULL);
INSERT INTO bills (appointment_id, insurance_status, insurance_snapshot, promotion_snapshot, estimate_snapshot, finalized_snapshot, received_at, received_by, settled_at, settlement_id, legacy) VALUES ('AT-TODAY', 'pending', '{"status":"pending","cardNumber":"DEMO12345678901","validFrom":"2020-01-01","validTo":"2099-12-31","registeredFacility":"An Tâm · Trung tâm (mẫu)","referral":""}', '{"id":"promo-welcome","name":"Ưu đãi đặt khám An Tâm","mode":"code","code":"ANTAM50","kind":"fixed","value":50000,"maxDiscount":50000,"minimum":150000,"startsOn":"2020-01-01","endsOn":"2099-12-31","branchIds":[],"serviceIds":[],"audience":"all","totalLimit":500,"perPatientLimit":1,"active":true}', '{"items":[{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true,"total":200000,"tariff":0,"paymentRate":0,"covered":0,"insurer":0,"copay":0,"outside":200000,"discount":50000,"patientDue":150000}],"subtotal":200000,"insurer":null,"copay":null,"outside":null,"discount":50000,"patientDue":null,"unresolved":true,"promotionName":"Ưu đãi đặt khám An Tâm","promotionId":"promo-welcome"}', NULL, NULL, NULL, NULL, NULL, 0);
INSERT INTO bill_items (appointment_id, service_id, package_service_id, name, unit_price, quantity, discountable, snapshot) VALUES ('AT-TODAY', 'consultation', NULL, 'Khám Nội tổng quát', 200000, 1, 1, '{"serviceId":"consultation","name":"Khám Nội tổng quát","unitPrice":200000,"quantity":1,"discountable":true}');
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1000', 'AT-1000', 'p1', 'b1', 'dr1', '2026-07-29', 'Mệt mỏi sau thời gian làm việc kéo dài', 'Theo dõi sức khỏe tổng quát', 'Duy trì lịch sinh hoạt đều đặn. Mang theo kết quả khám trước khi tái khám.', '2026-08-23', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1001', 'AT-1001', 'p1', 'b1', 'dr1', '2026-08-23', 'Mệt mỏi sau thời gian làm việc kéo dài', 'Theo dõi sức khỏe tổng quát', 'Duy trì lịch sinh hoạt đều đặn. Mang theo kết quả khám trước khi tái khám.', '2026-09-17', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1002', 'AT-1002', 'p1', 'b1', 'dr1', '2026-09-17', 'Mệt mỏi sau thời gian làm việc kéo dài', 'Theo dõi sức khỏe tổng quát', 'Duy trì lịch sinh hoạt đều đặn. Mang theo kết quả khám trước khi tái khám.', '2026-10-11', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1003', 'AT-1003', 'p2', 'b1', 'dr2', '2026-07-30', 'Đánh trống ngực từng lúc', 'Theo dõi tình trạng tim mạch', 'Ghi nhận thời điểm xuất hiện triệu chứng để trao đổi trong lần tái khám.', '2026-08-24', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1004', 'AT-1004', 'p2', 'b1', 'dr2', '2026-08-24', 'Đánh trống ngực từng lúc', 'Theo dõi tình trạng tim mạch', 'Ghi nhận thời điểm xuất hiện triệu chứng để trao đổi trong lần tái khám.', '2026-09-18', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1005', 'AT-1005', 'p2', 'b1', 'dr2', '2026-09-18', 'Đánh trống ngực từng lúc', 'Theo dõi tình trạng tim mạch', 'Ghi nhận thời điểm xuất hiện triệu chứng để trao đổi trong lần tái khám.', '2026-10-16', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1006', 'AT-1006', 'p3', 'b1', 'dr3', '2026-07-31', 'Hắt hơi và sổ mũi', 'Theo dõi sức khỏe hô hấp của trẻ', 'Phụ huynh theo dõi diễn biến và liên hệ cơ sở nếu triệu chứng thay đổi.', '2026-08-25', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1007', 'AT-1007', 'p3', 'b1', 'dr3', '2026-08-25', 'Hắt hơi và sổ mũi', 'Theo dõi sức khỏe hô hấp của trẻ', 'Phụ huynh theo dõi diễn biến và liên hệ cơ sở nếu triệu chứng thay đổi.', '2026-09-19', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1009', 'AT-1009', 'p4', 'b2', 'dr4', '2026-08-01', 'Da khô, ngứa tái diễn', 'Theo dõi kích ứng da', 'Ghi lại sản phẩm tiếp xúc với da và diễn biến triệu chứng.', '2026-08-26', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1010', 'AT-1010', 'p4', 'b2', 'dr4', '2026-08-26', 'Da khô, ngứa tái diễn', 'Theo dõi kích ứng da', 'Ghi lại sản phẩm tiếp xúc với da và diễn biến triệu chứng.', '2026-09-20', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1012', 'AT-1012', 'p5', 'b2', 'dr5', '2026-08-02', 'Nghẹt mũi, khó chịu vùng họng', 'Theo dõi tai mũi họng', 'Tái khám để đánh giá lại triệu chứng theo lịch hẹn.', '2026-08-27', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1013', 'AT-1013', 'p5', 'b2', 'dr5', '2026-08-27', 'Nghẹt mũi, khó chịu vùng họng', 'Theo dõi tai mũi họng', 'Tái khám để đánh giá lại triệu chứng theo lịch hẹn.', '2026-09-21', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1015', 'AT-1015', 'p6', 'b2', 'dr6', '2026-08-03', 'Đau vai sau vận động', 'Theo dõi vận động khớp vai', 'Ghi nhận hoạt động gây khó chịu và trao đổi với bác sĩ khi tái khám.', '2026-08-28', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1016', 'AT-1016', 'p6', 'b2', 'dr6', '2026-08-28', 'Đau vai sau vận động', 'Theo dõi vận động khớp vai', 'Ghi nhận hoạt động gây khó chịu và trao đổi với bác sĩ khi tái khám.', '2026-09-22', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1017', 'AT-1017', 'p6', 'b2', 'dr6', '2026-09-22', 'Đau vai sau vận động', 'Theo dõi vận động khớp vai', 'Ghi nhận hoạt động gây khó chịu và trao đổi với bác sĩ khi tái khám.', '2026-10-20', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1018', 'AT-1018', 'p7', 'b3', 'dr7', '2026-08-04', 'Mệt mỏi sau thời gian làm việc kéo dài', 'Theo dõi sức khỏe tổng quát', 'Duy trì lịch sinh hoạt đều đặn. Mang theo kết quả khám trước khi tái khám.', '2026-08-29', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1019', 'AT-1019', 'p7', 'b3', 'dr7', '2026-08-29', 'Mệt mỏi sau thời gian làm việc kéo dài', 'Theo dõi sức khỏe tổng quát', 'Duy trì lịch sinh hoạt đều đặn. Mang theo kết quả khám trước khi tái khám.', '2026-09-23', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1020', 'AT-1020', 'p7', 'b3', 'dr7', '2026-09-23', 'Mệt mỏi sau thời gian làm việc kéo dài', 'Theo dõi sức khỏe tổng quát', 'Duy trì lịch sinh hoạt đều đặn. Mang theo kết quả khám trước khi tái khám.', '2026-10-21', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1021', 'AT-1021', 'p8', 'b3', 'dr9', '2026-08-05', 'Hắt hơi và sổ mũi', 'Theo dõi sức khỏe hô hấp của trẻ', 'Phụ huynh theo dõi diễn biến và liên hệ cơ sở nếu triệu chứng thay đổi.', '2026-08-30', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1022', 'AT-1022', 'p8', 'b3', 'dr9', '2026-08-30', 'Hắt hơi và sổ mũi', 'Theo dõi sức khỏe hô hấp của trẻ', 'Phụ huynh theo dõi diễn biến và liên hệ cơ sở nếu triệu chứng thay đổi.', '2026-09-24', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1023', 'AT-1023', 'p8', 'b3', 'dr9', '2026-09-24', 'Hắt hơi và sổ mũi', 'Theo dõi sức khỏe hô hấp của trẻ', 'Phụ huynh theo dõi diễn biến và liên hệ cơ sở nếu triệu chứng thay đổi.', '2026-10-22', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1024', 'AT-1024', 'p9', 'b4', 'dr10', '2026-08-06', 'Da khô, ngứa tái diễn', 'Theo dõi kích ứng da', 'Ghi lại sản phẩm tiếp xúc với da và diễn biến triệu chứng.', '2026-08-31', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1025', 'AT-1025', 'p9', 'b4', 'dr10', '2026-08-31', 'Da khô, ngứa tái diễn', 'Theo dõi kích ứng da', 'Ghi lại sản phẩm tiếp xúc với da và diễn biến triệu chứng.', '2026-09-25', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1027', 'AT-1027', 'p10', 'b4', 'dr11', '2026-08-07', 'Nghẹt mũi, khó chịu vùng họng', 'Theo dõi tai mũi họng', 'Tái khám để đánh giá lại triệu chứng theo lịch hẹn.', '2026-09-01', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1028', 'AT-1028', 'p10', 'b4', 'dr11', '2026-09-01', 'Nghẹt mũi, khó chịu vùng họng', 'Theo dõi tai mũi họng', 'Tái khám để đánh giá lại triệu chứng theo lịch hẹn.', '2026-09-26', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1030', 'AT-1030', 'p11', 'b1', 'dr1', '2026-08-08', 'Mệt mỏi sau thời gian làm việc kéo dài', 'Theo dõi sức khỏe tổng quát', 'Duy trì lịch sinh hoạt đều đặn. Mang theo kết quả khám trước khi tái khám.', '2026-09-02', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1031', 'AT-1031', 'p11', 'b1', 'dr1', '2026-09-02', 'Mệt mỏi sau thời gian làm việc kéo dài', 'Theo dõi sức khỏe tổng quát', 'Duy trì lịch sinh hoạt đều đặn. Mang theo kết quả khám trước khi tái khám.', '2026-09-27', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1033', 'AT-1033', 'p12', 'b1', 'dr2', '2026-08-09', 'Đánh trống ngực từng lúc', 'Theo dõi tình trạng tim mạch', 'Ghi nhận thời điểm xuất hiện triệu chứng để trao đổi trong lần tái khám.', '2026-09-03', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1034', 'AT-1034', 'p12', 'b1', 'dr2', '2026-09-03', 'Đánh trống ngực từng lúc', 'Theo dõi tình trạng tim mạch', 'Ghi nhận thời điểm xuất hiện triệu chứng để trao đổi trong lần tái khám.', '2026-09-28', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1035', 'AT-1035', 'p12', 'b1', 'dr2', '2026-09-28', 'Đánh trống ngực từng lúc', 'Theo dõi tình trạng tim mạch', 'Ghi nhận thời điểm xuất hiện triệu chứng để trao đổi trong lần tái khám.', '2026-10-16', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1036', 'AT-1036', 'p13', 'b2', 'dr4', '2026-08-10', 'Da khô, ngứa tái diễn', 'Theo dõi kích ứng da', 'Ghi lại sản phẩm tiếp xúc với da và diễn biến triệu chứng.', '2026-09-04', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1037', 'AT-1037', 'p13', 'b2', 'dr4', '2026-09-04', 'Da khô, ngứa tái diễn', 'Theo dõi kích ứng da', 'Ghi lại sản phẩm tiếp xúc với da và diễn biến triệu chứng.', '2026-09-29', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1038', 'AT-1038', 'p13', 'b2', 'dr4', '2026-09-29', 'Da khô, ngứa tái diễn', 'Theo dõi kích ứng da', 'Ghi lại sản phẩm tiếp xúc với da và diễn biến triệu chứng.', '2026-10-17', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1039', 'AT-1039', 'p14', 'b3', 'dr9', '2026-08-11', 'Hắt hơi và sổ mũi', 'Theo dõi sức khỏe hô hấp của trẻ', 'Phụ huynh theo dõi diễn biến và liên hệ cơ sở nếu triệu chứng thay đổi.', '2026-09-05', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1040', 'AT-1040', 'p14', 'b3', 'dr9', '2026-09-05', 'Hắt hơi và sổ mũi', 'Theo dõi sức khỏe hô hấp của trẻ', 'Phụ huynh theo dõi diễn biến và liên hệ cơ sở nếu triệu chứng thay đổi.', '2026-09-30', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1041', 'AT-1041', 'p14', 'b3', 'dr9', '2026-09-30', 'Hắt hơi và sổ mũi', 'Theo dõi sức khỏe hô hấp của trẻ', 'Phụ huynh theo dõi diễn biến và liên hệ cơ sở nếu triệu chứng thay đổi.', '2026-10-18', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1042', 'AT-1042', 'p15', 'b4', 'dr10', '2026-08-12', 'Da khô, ngứa tái diễn', 'Theo dõi kích ứng da', 'Ghi lại sản phẩm tiếp xúc với da và diễn biến triệu chứng.', '2026-09-06', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1043', 'AT-1043', 'p15', 'b4', 'dr10', '2026-09-06', 'Da khô, ngứa tái diễn', 'Theo dõi kích ứng da', 'Ghi lại sản phẩm tiếp xúc với da và diễn biến triệu chứng.', '2026-10-01', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1045', 'AT-1045', 'p16', 'b4', 'dr11', '2026-08-13', 'Nghẹt mũi, khó chịu vùng họng', 'Theo dõi tai mũi họng', 'Tái khám để đánh giá lại triệu chứng theo lịch hẹn.', '2026-09-07', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-AT-1046', 'AT-1046', 'p16', 'b4', 'dr11', '2026-09-07', 'Nghẹt mũi, khó chịu vùng họng', 'Theo dõi tai mũi họng', 'Tái khám để đánh giá lại triệu chứng theo lịch hẹn.', '2026-10-02', 1, 'none', NULL, NULL, NULL);
INSERT INTO medical_records (id, appointment_id, patient_user_id, branch_id, doctor_id, record_date, symptoms, diagnosis, notes, follow_up_date, finalized, dispense_status, dispensed_by, dispensed_at, dispense_reason) VALUES ('rec-demo-draft', 'AT-DEMO-EXAM', 'p1', 'b1', 'dr1', '2026-10-11', 'Tái khám sức khỏe tổng quát', NULL, NULL, NULL, 0, 'none', NULL, NULL, NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1001', 'AT-1001', 'b1', 200000, '2026-08-23', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1002', 'AT-1002', 'b1', 200000, '2026-09-17', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1003', 'AT-1003', 'b1', 250000, '2026-07-30', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1005', 'AT-1005', 'b1', 250000, '2026-09-18', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1006', 'AT-1006', 'b1', 300000, '2026-07-31', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1009', 'AT-1009', 'b2', 200000, '2026-08-01', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1012', 'AT-1012', 'b2', 250000, '2026-08-02', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1015', 'AT-1015', 'b2', 300000, '2026-08-03', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1017', 'AT-1017', 'b2', 300000, '2026-09-22', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1018', 'AT-1018', 'b3', 200000, '2026-08-04', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1020', 'AT-1020', 'b3', 200000, '2026-09-23', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1021', 'AT-1021', 'b3', 300000, '2026-08-05', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1023', 'AT-1023', 'b3', 300000, '2026-09-24', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1024', 'AT-1024', 'b4', 200000, '2026-08-06', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1027', 'AT-1027', 'b4', 250000, '2026-08-07', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1030', 'AT-1030', 'b1', 200000, '2026-08-08', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1033', 'AT-1033', 'b1', 250000, '2026-08-09', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1035', 'AT-1035', 'b1', 250000, '2026-09-28', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1036', 'AT-1036', 'b2', 200000, '2026-08-10', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1038', 'AT-1038', 'b2', 200000, '2026-09-29', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1039', 'AT-1039', 'b3', 300000, '2026-08-11', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1041', 'AT-1041', 'b3', 300000, '2026-09-30', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1042', 'AT-1042', 'b4', 200000, '2026-08-12', NULL, NULL, 'root', NULL);
INSERT INTO payments (id, appointment_id, branch_id, amount, payment_date, method, reference, created_by, created_at) VALUES ('pay-AT-1045', 'AT-1045', 'b4', 250000, '2026-08-13', NULL, NULL, 'root', NULL);
INSERT INTO promotion_uses (id, promotion_id, appointment_id, patient_user_id, branch_id, status, used_at) VALUES ('use-demo-today', 'promo-welcome', 'AT-TODAY', 'p11', 'b1', 'reserved', '2026-10-09 09:00:00');
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med001', 'b1', 'med001', 20, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med002', 'b1', 'med002', 30, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med003', 'b1', 'med003', 40, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med004', 'b1', 'med004', 50, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med005', 'b1', 'med005', 20, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med006', 'b1', 'med006', 30, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med007', 'b1', 'med007', 40, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med008', 'b1', 'med008', 50, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med009', 'b1', 'med009', 20, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med010', 'b1', 'med010', 30, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med011', 'b1', 'med011', 40, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med012', 'b1', 'med012', 50, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med013', 'b1', 'med013', 20, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med014', 'b1', 'med014', 30, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med015', 'b1', 'med015', 40, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med016', 'b1', 'med016', 50, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med017', 'b1', 'med017', 20, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med018', 'b1', 'med018', 30, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med019', 'b1', 'med019', 40, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med020', 'b1', 'med020', 50, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med021', 'b1', 'med021', 20, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med022', 'b1', 'med022', 30, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med023', 'b1', 'med023', 40, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med024', 'b1', 'med024', 50, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med025', 'b1', 'med025', 20, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med026', 'b1', 'med026', 30, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med027', 'b1', 'med027', 40, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med028', 'b1', 'med028', 50, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med029', 'b1', 'med029', 20, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med030', 'b1', 'med030', 30, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med031', 'b1', 'med031', 40, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med032', 'b1', 'med032', 50, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med033', 'b1', 'med033', 20, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med034', 'b1', 'med034', 30, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med035', 'b1', 'med035', 40, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med036', 'b1', 'med036', 50, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med037', 'b1', 'med037', 20, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med038', 'b1', 'med038', 30, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med039', 'b1', 'med039', 40, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med040', 'b1', 'med040', 50, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med041', 'b1', 'med041', 20, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med042', 'b1', 'med042', 30, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med043', 'b1', 'med043', 40, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med044', 'b1', 'med044', 50, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med045', 'b1', 'med045', 20, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med046', 'b1', 'med046', 30, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med047', 'b1', 'med047', 40, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med048', 'b1', 'med048', 50, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med049', 'b1', 'med049', 20, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med050', 'b1', 'med050', 30, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med051', 'b1', 'med051', 40, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med052', 'b1', 'med052', 50, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med053', 'b1', 'med053', 20, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med054', 'b1', 'med054', 30, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med055', 'b1', 'med055', 40, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med056', 'b1', 'med056', 50, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med057', 'b1', 'med057', 20, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med058', 'b1', 'med058', 30, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med059', 'b1', 'med059', 40, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med060', 'b1', 'med060', 50, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b1-med061', 'b1', 'med061', 20, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med001', 'b2', 'med001', 30, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med002', 'b2', 'med002', 40, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med003', 'b2', 'med003', 50, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med004', 'b2', 'med004', 20, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med005', 'b2', 'med005', 30, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med006', 'b2', 'med006', 40, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med007', 'b2', 'med007', 50, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med008', 'b2', 'med008', 20, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med009', 'b2', 'med009', 30, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med010', 'b2', 'med010', 40, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med011', 'b2', 'med011', 50, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med012', 'b2', 'med012', 20, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med013', 'b2', 'med013', 30, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med014', 'b2', 'med014', 40, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med015', 'b2', 'med015', 50, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med016', 'b2', 'med016', 20, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med017', 'b2', 'med017', 30, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med018', 'b2', 'med018', 40, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med019', 'b2', 'med019', 50, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med020', 'b2', 'med020', 20, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med021', 'b2', 'med021', 30, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med022', 'b2', 'med022', 40, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med023', 'b2', 'med023', 50, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med024', 'b2', 'med024', 20, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med025', 'b2', 'med025', 30, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med026', 'b2', 'med026', 40, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med027', 'b2', 'med027', 50, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med028', 'b2', 'med028', 20, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med029', 'b2', 'med029', 30, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med030', 'b2', 'med030', 40, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med031', 'b2', 'med031', 50, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med032', 'b2', 'med032', 20, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med033', 'b2', 'med033', 30, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med034', 'b2', 'med034', 40, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med035', 'b2', 'med035', 50, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med036', 'b2', 'med036', 20, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med037', 'b2', 'med037', 30, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med038', 'b2', 'med038', 40, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med039', 'b2', 'med039', 50, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med040', 'b2', 'med040', 20, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med041', 'b2', 'med041', 30, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med042', 'b2', 'med042', 40, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med043', 'b2', 'med043', 50, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med044', 'b2', 'med044', 20, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med045', 'b2', 'med045', 30, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med046', 'b2', 'med046', 40, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med047', 'b2', 'med047', 50, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med048', 'b2', 'med048', 20, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med049', 'b2', 'med049', 30, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med050', 'b2', 'med050', 40, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med051', 'b2', 'med051', 50, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med052', 'b2', 'med052', 20, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med053', 'b2', 'med053', 30, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med054', 'b2', 'med054', 40, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med055', 'b2', 'med055', 50, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med056', 'b2', 'med056', 20, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med057', 'b2', 'med057', 30, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med058', 'b2', 'med058', 40, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med059', 'b2', 'med059', 50, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med060', 'b2', 'med060', 20, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b2-med061', 'b2', 'med061', 30, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med001', 'b3', 'med001', 40, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med002', 'b3', 'med002', 50, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med003', 'b3', 'med003', 20, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med004', 'b3', 'med004', 30, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med005', 'b3', 'med005', 40, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med006', 'b3', 'med006', 50, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med007', 'b3', 'med007', 20, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med008', 'b3', 'med008', 30, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med009', 'b3', 'med009', 40, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med010', 'b3', 'med010', 50, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med011', 'b3', 'med011', 20, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med012', 'b3', 'med012', 30, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med013', 'b3', 'med013', 40, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med014', 'b3', 'med014', 50, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med015', 'b3', 'med015', 20, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med016', 'b3', 'med016', 30, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med017', 'b3', 'med017', 40, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med018', 'b3', 'med018', 50, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med019', 'b3', 'med019', 20, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med020', 'b3', 'med020', 30, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med021', 'b3', 'med021', 40, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med022', 'b3', 'med022', 50, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med023', 'b3', 'med023', 20, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med024', 'b3', 'med024', 30, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med025', 'b3', 'med025', 40, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med026', 'b3', 'med026', 50, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med027', 'b3', 'med027', 20, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med028', 'b3', 'med028', 30, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med029', 'b3', 'med029', 40, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med030', 'b3', 'med030', 50, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med031', 'b3', 'med031', 20, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med032', 'b3', 'med032', 30, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med033', 'b3', 'med033', 40, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med034', 'b3', 'med034', 50, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med035', 'b3', 'med035', 20, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med036', 'b3', 'med036', 30, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med037', 'b3', 'med037', 40, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med038', 'b3', 'med038', 50, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med039', 'b3', 'med039', 20, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med040', 'b3', 'med040', 30, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med041', 'b3', 'med041', 40, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med042', 'b3', 'med042', 50, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med043', 'b3', 'med043', 20, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med044', 'b3', 'med044', 30, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med045', 'b3', 'med045', 40, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med046', 'b3', 'med046', 50, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med047', 'b3', 'med047', 20, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med048', 'b3', 'med048', 30, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med049', 'b3', 'med049', 40, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med050', 'b3', 'med050', 50, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med051', 'b3', 'med051', 20, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med052', 'b3', 'med052', 30, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med053', 'b3', 'med053', 40, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med054', 'b3', 'med054', 50, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med055', 'b3', 'med055', 20, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med056', 'b3', 'med056', 30, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med057', 'b3', 'med057', 40, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med058', 'b3', 'med058', 50, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med059', 'b3', 'med059', 20, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med060', 'b3', 'med060', 30, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b3-med061', 'b3', 'med061', 40, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med001', 'b4', 'med001', 50, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med002', 'b4', 'med002', 20, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med003', 'b4', 'med003', 30, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med004', 'b4', 'med004', 40, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med005', 'b4', 'med005', 50, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med006', 'b4', 'med006', 20, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med007', 'b4', 'med007', 30, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med008', 'b4', 'med008', 40, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med009', 'b4', 'med009', 50, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med010', 'b4', 'med010', 20, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med011', 'b4', 'med011', 30, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med012', 'b4', 'med012', 40, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med013', 'b4', 'med013', 50, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med014', 'b4', 'med014', 20, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med015', 'b4', 'med015', 30, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med016', 'b4', 'med016', 40, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med017', 'b4', 'med017', 50, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med018', 'b4', 'med018', 20, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med019', 'b4', 'med019', 30, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med020', 'b4', 'med020', 40, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med021', 'b4', 'med021', 50, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med022', 'b4', 'med022', 20, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med023', 'b4', 'med023', 30, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med024', 'b4', 'med024', 40, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med025', 'b4', 'med025', 50, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med026', 'b4', 'med026', 20, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med027', 'b4', 'med027', 30, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med028', 'b4', 'med028', 40, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med029', 'b4', 'med029', 50, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med030', 'b4', 'med030', 20, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med031', 'b4', 'med031', 30, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med032', 'b4', 'med032', 40, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med033', 'b4', 'med033', 50, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med034', 'b4', 'med034', 20, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med035', 'b4', 'med035', 30, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med036', 'b4', 'med036', 40, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med037', 'b4', 'med037', 50, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med038', 'b4', 'med038', 20, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med039', 'b4', 'med039', 30, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med040', 'b4', 'med040', 40, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med041', 'b4', 'med041', 50, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med042', 'b4', 'med042', 20, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med043', 'b4', 'med043', 30, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med044', 'b4', 'med044', 40, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med045', 'b4', 'med045', 50, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med046', 'b4', 'med046', 20, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med047', 'b4', 'med047', 30, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med048', 'b4', 'med048', 40, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med049', 'b4', 'med049', 50, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med050', 'b4', 'med050', 20, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med051', 'b4', 'med051', 30, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med052', 'b4', 'med052', 40, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med053', 'b4', 'med053', 50, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med054', 'b4', 'med054', 20, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med055', 'b4', 'med055', 30, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med056', 'b4', 'med056', 40, 280);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med057', 'b4', 'med057', 50, 320);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med058', 'b4', 'med058', 20, 160);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med059', 'b4', 'med059', 30, 200);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med060', 'b4', 'med060', 40, 240);
INSERT INTO inventory_settings (id, branch_id, medicine_id, min_quantity, max_quantity) VALUES ('setting-b4-med061', 'b4', 'med061', 50, 280);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med001', 'b1', 'med001', 0, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med002', 'b1', 'med002', 25, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med003', 'b1', 'med003', 35, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med004', 'b1', 'med004', 88, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med005', 'b1', 'med005', 59, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med006', 'b1', 'med006', 70, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med007', 'b1', 'med007', 81, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med008', 'b1', 'med008', 92, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med009', 'b1', 'med009', 63, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med010', 'b1', 'med010', 74, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med011', 'b1', 'med011', 85, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med012', 'b1', 'med012', 96, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med013', 'b1', 'med013', 260, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med014', 'b1', 'med014', 0, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med015', 'b1', 'med015', 35, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med016', 'b1', 'med016', 45, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med017', 'b1', 'med017', 71, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med018', 'b1', 'med018', 82, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med019', 'b1', 'med019', 93, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med020', 'b1', 'med020', 104, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med021', 'b1', 'med021', 75, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med022', 'b1', 'med022', 86, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med023', 'b1', 'med023', 97, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med024', 'b1', 'med024', 108, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med025', 'b1', 'med025', 79, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med026', 'b1', 'med026', 180, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med027', 'b1', 'med027', 0, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med028', 'b1', 'med028', 45, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med029', 'b1', 'med029', 15, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med030', 'b1', 'med030', 94, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med031', 'b1', 'med031', 105, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med032', 'b1', 'med032', 116, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med033', 'b1', 'med033', 87, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med034', 'b1', 'med034', 98, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med035', 'b1', 'med035', 109, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med036', 'b1', 'med036', 120, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med037', 'b1', 'med037', 91, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med038', 'b1', 'med038', 102, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med039', 'b1', 'med039', 300, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med040', 'b1', 'med040', 0, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med041', 'b1', 'med041', 15, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med042', 'b1', 'med042', 25, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med043', 'b1', 'med043', 117, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med044', 'b1', 'med044', 128, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med045', 'b1', 'med045', 99, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med046', 'b1', 'med046', 110, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med047', 'b1', 'med047', 121, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med048', 'b1', 'med048', 132, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med049', 'b1', 'med049', 103, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med050', 'b1', 'med050', 114, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med051', 'b1', 'med051', 125, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med052', 'b1', 'med052', 220, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med053', 'b1', 'med053', 0, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med054', 'b1', 'med054', 25, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med055', 'b1', 'med055', 35, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med056', 'b1', 'med056', 140, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med057', 'b1', 'med057', 111, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med058', 'b1', 'med058', 122, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med059', 'b1', 'med059', 133, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med060', 'b1', 'med060', 144, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b1-med061', 'b1', 'med061', 115, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med001', 'b2', 'med001', 126, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med002', 'b2', 'med002', 137, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med003', 'b2', 'med003', 148, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med004', 'b2', 'med004', 340, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med005', 'b2', 'med005', 0, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med006', 'b2', 'med006', 35, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med007', 'b2', 'med007', 45, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med008', 'b2', 'med008', 123, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med009', 'b2', 'med009', 134, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med010', 'b2', 'med010', 75, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med011', 'b2', 'med011', 86, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med012', 'b2', 'med012', 57, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med013', 'b2', 'med013', 68, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med014', 'b2', 'med014', 79, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med015', 'b2', 'med015', 90, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med016', 'b2', 'med016', 61, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med017', 'b2', 'med017', 260, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med018', 'b2', 'med018', 0, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med019', 'b2', 'med019', 45, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med020', 'b2', 'med020', 15, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med021', 'b2', 'med021', 76, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med022', 'b2', 'med022', 87, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med023', 'b2', 'med023', 98, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med024', 'b2', 'med024', 69, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med025', 'b2', 'med025', 80, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med026', 'b2', 'med026', 91, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med027', 'b2', 'med027', 102, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med028', 'b2', 'med028', 73, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med029', 'b2', 'med029', 84, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med030', 'b2', 'med030', 180, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med031', 'b2', 'med031', 0, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med032', 'b2', 'med032', 15, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med033', 'b2', 'med033', 25, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med034', 'b2', 'med034', 99, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med035', 'b2', 'med035', 110, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med036', 'b2', 'med036', 81, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med037', 'b2', 'med037', 92, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med038', 'b2', 'med038', 103, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med039', 'b2', 'med039', 114, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med040', 'b2', 'med040', 85, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med041', 'b2', 'med041', 96, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med042', 'b2', 'med042', 107, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med043', 'b2', 'med043', 300, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med044', 'b2', 'med044', 0, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med045', 'b2', 'med045', 25, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med046', 'b2', 'med046', 35, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med047', 'b2', 'med047', 122, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med048', 'b2', 'med048', 93, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med049', 'b2', 'med049', 104, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med050', 'b2', 'med050', 115, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med051', 'b2', 'med051', 126, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med052', 'b2', 'med052', 97, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med053', 'b2', 'med053', 108, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med054', 'b2', 'med054', 119, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med055', 'b2', 'med055', 130, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med056', 'b2', 'med056', 220, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med057', 'b2', 'med057', 0, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med058', 'b2', 'med058', 35, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med059', 'b2', 'med059', 45, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med060', 'b2', 'med060', 105, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b2-med061', 'b2', 'med061', 116, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med001', 'b3', 'med001', 127, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med002', 'b3', 'med002', 138, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med003', 'b3', 'med003', 109, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med004', 'b3', 'med004', 120, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med005', 'b3', 'med005', 131, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med006', 'b3', 'med006', 142, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med007', 'b3', 'med007', 113, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med008', 'b3', 'med008', 340, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med009', 'b3', 'med009', 0, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med010', 'b3', 'med010', 45, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med011', 'b3', 'med011', 15, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med012', 'b3', 'med012', 128, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med013', 'b3', 'med013', 139, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med014', 'b3', 'med014', 150, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med015', 'b3', 'med015', 121, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med016', 'b3', 'med016', 132, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med017', 'b3', 'med017', 143, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med018', 'b3', 'med018', 154, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med019', 'b3', 'med019', 55, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med020', 'b3', 'med020', 66, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med021', 'b3', 'med021', 260, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med022', 'b3', 'med022', 0, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med023', 'b3', 'med023', 15, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med024', 'b3', 'med024', 25, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med025', 'b3', 'med025', 81, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med026', 'b3', 'med026', 92, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med027', 'b3', 'med027', 63, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med028', 'b3', 'med028', 74, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med029', 'b3', 'med029', 85, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med030', 'b3', 'med030', 96, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med031', 'b3', 'med031', 67, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med032', 'b3', 'med032', 78, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med033', 'b3', 'med033', 89, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med034', 'b3', 'med034', 180, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med035', 'b3', 'med035', 0, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med036', 'b3', 'med036', 25, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med037', 'b3', 'med037', 35, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med038', 'b3', 'med038', 104, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med039', 'b3', 'med039', 75, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med040', 'b3', 'med040', 86, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med041', 'b3', 'med041', 97, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med042', 'b3', 'med042', 108, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med043', 'b3', 'med043', 79, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med044', 'b3', 'med044', 90, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med045', 'b3', 'med045', 101, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med046', 'b3', 'med046', 112, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med047', 'b3', 'med047', 300, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med048', 'b3', 'med048', 0, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med049', 'b3', 'med049', 35, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med050', 'b3', 'med050', 45, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med051', 'b3', 'med051', 87, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med052', 'b3', 'med052', 98, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med053', 'b3', 'med053', 109, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med054', 'b3', 'med054', 120, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med055', 'b3', 'med055', 91, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med056', 'b3', 'med056', 102, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med057', 'b3', 'med057', 113, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med058', 'b3', 'med058', 124, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med059', 'b3', 'med059', 95, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med060', 'b3', 'med060', 220, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b3-med061', 'b3', 'med061', 0, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med001', 'b4', 'med001', 45, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med002', 'b4', 'med002', 15, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med003', 'b4', 'med003', 110, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med004', 'b4', 'med004', 121, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med005', 'b4', 'med005', 132, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med006', 'b4', 'med006', 103, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med007', 'b4', 'med007', 114, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med008', 'b4', 'med008', 125, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med009', 'b4', 'med009', 136, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med010', 'b4', 'med010', 107, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med011', 'b4', 'med011', 118, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med012', 'b4', 'med012', 340, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med013', 'b4', 'med013', 0, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med014', 'b4', 'med014', 15, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med015', 'b4', 'med015', 25, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med016', 'b4', 'med016', 133, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med017', 'b4', 'med017', 144, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med018', 'b4', 'med018', 115, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med019', 'b4', 'med019', 126, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med020', 'b4', 'med020', 137, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med021', 'b4', 'med021', 148, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med022', 'b4', 'med022', 119, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med023', 'b4', 'med023', 130, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med024', 'b4', 'med024', 141, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med025', 'b4', 'med025', 260, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med026', 'b4', 'med026', 0, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med027', 'b4', 'med027', 25, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med028', 'b4', 'med028', 35, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med029', 'b4', 'med029', 86, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med030', 'b4', 'med030', 57, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med031', 'b4', 'med031', 68, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med032', 'b4', 'med032', 79, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med033', 'b4', 'med033', 90, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med034', 'b4', 'med034', 61, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med035', 'b4', 'med035', 72, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med036', 'b4', 'med036', 83, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med037', 'b4', 'med037', 94, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med038', 'b4', 'med038', 180, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med039', 'b4', 'med039', 0, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med040', 'b4', 'med040', 35, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med041', 'b4', 'med041', 45, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med042', 'b4', 'med042', 69, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med043', 'b4', 'med043', 80, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med044', 'b4', 'med044', 91, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med045', 'b4', 'med045', 102, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med046', 'b4', 'med046', 73, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med047', 'b4', 'med047', 84, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med048', 'b4', 'med048', 95, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med049', 'b4', 'med049', 106, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med050', 'b4', 'med050', 77, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med051', 'b4', 'med051', 300, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med052', 'b4', 'med052', 0, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med053', 'b4', 'med053', 45, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med054', 'b4', 'med054', 15, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med055', 'b4', 'med055', 92, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med056', 'b4', 'med056', 103, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med057', 'b4', 'med057', 114, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med058', 'b4', 'med058', 85, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med059', 'b4', 'med059', 96, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med060', 'b4', 'med060', 107, 0);
INSERT INTO branch_stocks (id, branch_id, medicine_id, quantity, reserved) VALUES ('stock-b4-med061', 'b4', 'med061', 118, 0);
INSERT INTO stock_requests (id, branch_id, kind, status, reason, created_by, created_at, reviewed_by, reviewed_at, review_reason) VALUES ('restock-demo-1', 'b1', 'normal', 'pending', 'Bổ sung các thuốc đã xuống dưới ngưỡng tối thiểu.', 'admin1', '2026-10-12 00:00:00', NULL, NULL, NULL);
INSERT INTO stock_request_items (stock_request_id, medicine_id, quantity, purchase_price) VALUES ('restock-demo-1', 'med001', 100, 700);
INSERT INTO stock_request_items (stock_request_id, medicine_id, quantity, purchase_price) VALUES ('restock-demo-1', 'med014', 40, 9000);
INSERT INTO stock_schedule (id, weekdays, timezone, updated_by, updated_at) VALUES (1, '[1,4]', 'Asia/Ho_Chi_Minh', 'root', '2026-10-12 00:00:00');
INSERT INTO campaigns (id, title, summary, image, starts_at, ends_at, status, disclaimer, branch_ids, package_ids) VALUES ('campaign-heart-2026', 'Chủ động tầm soát tim mạch trong tháng này', 'Tham khảo gói kiểm tra tim mạch, chuẩn bị thông tin sức khỏe và chọn cơ sở phù hợp trước khi đặt lịch.', '/images/hospital.jpg', '2026-09-27', '2026-11-01', 'published', 'Nội dung giới thiệu trong dữ liệu demo; chi phí thực tế được xác nhận khi khám.', '["b1","b2","b3","b4"]', '["pkg2"]');
INSERT INTO health_facts (id, topic, title, content, source, reviewed_at, status) VALUES ('fact-sleep', 'Giấc ngủ', 'Giữ giờ ngủ đều đặn giúp hình thành thói quen nghỉ ngơi tốt hơn', 'Theo dõi giờ đi ngủ và thức dậy trong vài tuần giúp bạn nhận ra những thay đổi ảnh hưởng đến chất lượng nghỉ ngơi.', 'Thông tin giáo dục sức khỏe tổng quát — cần trao đổi bác sĩ khi triệu chứng kéo dài.', '2026-10-12', 'published');
INSERT INTO health_facts (id, topic, title, content, source, reviewed_at, status) VALUES ('fact-checkup', 'Khám định kỳ', 'Chuẩn bị danh sách thuốc đang dùng trước buổi khám', 'Ghi tên thuốc, liều dùng và thời điểm sử dụng giúp buổi trao đổi với nhân viên y tế đầy đủ và chính xác hơn.', 'Hướng dẫn chuẩn bị khám của Bệnh viện An Tâm — nội dung mô phỏng.', '2026-10-12', 'published');
INSERT INTO health_facts (id, topic, title, content, source, reviewed_at, status) VALUES ('fact-movement', 'Vận động', 'Tăng vận động từng bước thường dễ duy trì hơn thay đổi quá nhanh', 'Chọn hoạt động phù hợp thể trạng, tăng dần thời lượng và dừng lại nếu xuất hiện dấu hiệu bất thường.', 'Thông tin giáo dục sức khỏe tổng quát — không thay thế tư vấn cá nhân.', '2026-10-12', 'published');
INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, module, subject_type, subject_id, appointment_id, branch_id, reason, result, severity, details, occurred_at) VALUES ('audit-demo-1', 'admin1', 'Quản trị An Tâm · Trung tâm', 'branchAdmin', 'appointment', 'appointments', 'appointment', 'AT-DEMO-PENDING', 'AT-DEMO-PENDING', 'b1', 'Kiểm tra lịch chờ xác nhận tại cơ sở.', 'success', 'info', '{}', '2026-10-12 08:15:00');
INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, module, subject_type, subject_id, appointment_id, branch_id, reason, result, severity, details, occurred_at) VALUES ('audit-demo-2', 'root', 'Quản trị hệ thống', 'superAdmin', 'inventory-settings-save', 'inventory', 'inventory', 'med001', NULL, 'b1', 'Rà soát ngưỡng tồn thuốc tại cơ sở.', 'success', 'warning', '{}', '2026-10-11 16:40:00');
INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, module, subject_type, subject_id, appointment_id, branch_id, reason, result, severity, details, occurred_at) VALUES ('audit-demo-3', 'admin2', 'Quản trị An Tâm · Thủ Đức', 'branchAdmin', 'stock-request-create', 'inventory', 'inventory', 'restock-demo', NULL, 'b2', 'Tạo yêu cầu bổ sung thuốc theo ngưỡng tồn.', 'success', 'info', '{}', '2026-10-10 09:20:00');
COMMIT;

-- Core schema additions for booking prepayment and prescription scope.
create table pricing_settings (
    id varchar(64) primary key,
    doctor_selection_fee numeric(15,0) not null check (doctor_selection_fee > 0),
    doctor_overrides json not null,
    reason text not null,
    updated_by varchar(64) not null,
    updated_at datetime(6) not null
);

insert into pricing_settings (
    id, doctor_selection_fee, doctor_overrides, reason, updated_by, updated_at
) values (
    'booking', 100000, json_object(), 'Khởi tạo phụ phí chọn bác sĩ.', 'migration', current_timestamp(6)
);

alter table appointments
    add column payment_status varchar(24) not null default 'legacy_unpaid',
    add column prepayment_amount numeric(15,0) not null default 0,
    add column slot_hold_expires_at datetime(6),
    add constraint chk_appointment_payment_status
        check (payment_status in ('legacy_unpaid', 'pending', 'paid', 'failed', 'expired', 'refund_pending', 'refunded'));

alter table appointments add column reserved_slot_key varchar(320)
    generated always as (
        case when doctor_id is not null
                  and status in ('awaiting_payment', 'draft', 'pending', 'confirmed')
                  and payment_status in ('pending', 'paid')
             then concat(doctor_id, '|', appointment_date, '|', appointment_time)
             else null end
    ) stored;
create unique index uq_reserved_doctor_slot on appointments(reserved_slot_key);

create table appointment_price_snapshots (
    appointment_id varchar(120) primary key,
    snapshot json not null,
    total_amount numeric(15,0) not null check (total_amount >= 0),
    created_at datetime(6) not null,
    constraint fk_price_snapshot_appointment foreign key (appointment_id) references appointments(id)
);

create table payment_attempts (
    id varchar(160) primary key,
    appointment_id varchar(120) not null,
    provider varchar(32) not null,
    amount numeric(15,0) not null check (amount > 0),
    status varchar(24) not null check (status in ('pending', 'paid', 'failed', 'expired', 'cancelled')),
    provider_transaction_id varchar(160),
    request_id varchar(160) not null,
    payment_url text,
    expires_at datetime(6),
    created_at datetime(6) not null,
    updated_at datetime(6) not null,
    unique (provider, request_id),
    unique (provider, provider_transaction_id),
    constraint fk_payment_attempt_appointment foreign key (appointment_id) references appointments(id)
);

alter table payments add column purpose varchar(32) not null default 'final_settlement';
alter table medical_records add column purchase_choice varchar(16) not null default 'undecided';

update medical_records
set dispense_status = 'not_managed'
where dispense_status = 'reserved';

alter table prescription_items
    add column medicine_name varchar(200),
    add column medicine_unit varchar(40),
    add column dosage varchar(200),
    add column route varchar(100),
    add column frequency varchar(100),
    add column duration varchar(100);

-- Bổ sung bác sĩ và lịch trống cho dữ liệu vận hành/mẫu.
create temporary table seed_new_doctors (
    id varchar(64) primary key,
    slug varchar(120) not null,
    name varchar(200) not null,
    department_id varchar(64) not null,
    experience integer not null,
    qualification varchar(300) not null,
    expertise varchar(500) not null,
    price numeric(15,0) not null,
    image varchar(500) not null
);

insert into seed_new_doctors values
('dr13','bac-si-13','BS. Đỗ Minh Quân','dep1',6,'Thạc sĩ Y khoa','Khám nội tổng quát và quản lý bệnh mạn tính',200000,'/images/doctor-male.jpg'),
('dr14','bac-si-14','BS. Nguyễn Ngọc Hân','dep2',7,'Bác sĩ chuyên khoa I','Tư vấn tim mạch và kiểm soát yếu tố nguy cơ',250000,'/images/doctor-female.jpg'),
('dr15','bac-si-15','BS. Trần Gia Bảo','dep3',8,'Thạc sĩ Y khoa','Khám nhi và tư vấn dinh dưỡng trẻ em',300000,'/images/doctor-male.jpg'),
('dr16','bac-si-16','BS. Lê Phương Thảo','dep4',9,'Bác sĩ chuyên khoa I','Điều trị bệnh da thường gặp',200000,'/images/doctor-female.jpg'),
('dr17','bac-si-17','BS. Phạm Tuấn Kiệt','dep5',10,'Thạc sĩ Y khoa','Khám tai mũi họng cho người lớn và trẻ em',250000,'/images/doctor-male.jpg'),
('dr18','bac-si-18','BS. Võ Thanh Trúc','dep6',11,'Bác sĩ chuyên khoa I','Khám cơ xương khớp và phục hồi vận động',300000,'/images/doctor-female.jpg'),
('dr19','bac-si-19','BS. Bùi Hoàng Long','dep7',12,'Thạc sĩ Y khoa','Khám nội tổng quát và quản lý bệnh mạn tính',200000,'/images/doctor-male.jpg'),
('dr20','bac-si-20','BS. Đặng Mỹ Linh','dep8',13,'Bác sĩ chuyên khoa I','Tư vấn tim mạch và kiểm soát yếu tố nguy cơ',250000,'/images/doctor-female.jpg'),
('dr21','bac-si-21','BS. Ngô Đức Thành','dep9',14,'Thạc sĩ Y khoa','Khám nhi và tư vấn dinh dưỡng trẻ em',300000,'/images/doctor-male.jpg'),
('dr22','bac-si-22','BS. Phan Khánh Vy','dep10',6,'Bác sĩ chuyên khoa I','Điều trị bệnh da thường gặp',200000,'/images/doctor-female.jpg'),
('dr23','bac-si-23','BS. Hồ Nhật Minh','dep11',7,'Thạc sĩ Y khoa','Khám tai mũi họng cho người lớn và trẻ em',250000,'/images/doctor-male.jpg'),
('dr24','bac-si-24','BS. Vũ Thu Hương','dep12',8,'Bác sĩ chuyên khoa I','Khám cơ xương khớp và phục hồi vận động',300000,'/images/doctor-female.jpg');

insert ignore into doctors (
    id, slug, name, branch_id, department_id, specialty_id, experience, qualification,
    contact_phone, image, bio, price, active, version, details
)
select seed.id, seed.slug, seed.name, department.branch_id, department.id,
       department.specialty_id, seed.experience, seed.qualification, branch.phone,
       seed.image,
       concat(seed.name, ' có ', seed.experience, ' năm kinh nghiệm tại ', branch.name, '.'),
       seed.price, true, 0,
       json_object(
           'currentPosition', 'Bác sĩ điều trị',
           'education', seed.qualification,
           'career', concat(seed.experience, ' năm kinh nghiệm khám và điều trị.'),
           'expertise', seed.expertise,
           'consultationLanguages', json_array('Tiếng Việt'),
           'patientGroups', json_array('Người trưởng thành', 'Trẻ em và người cao tuổi')
       )
from seed_new_doctors seed
join departments department on department.id = seed.department_id
join branches branch on branch.id = department.branch_id;

drop temporary table seed_new_doctors;

create temporary table seed_weekdays (
    day_of_week tinyint primary key
);

insert into seed_weekdays (day_of_week) values
(1), (2), (3), (4), (5), (6), (7);

create temporary table seed_shifts (
    code varchar(16) primary key,
    start_time time not null,
    end_time time not null
);

insert into seed_shifts (code, start_time, end_time) values
('morning', '07:30:00', '11:30:00'),
('afternoon', '13:00:00', '17:00:00');

insert into doctor_availability_rules (
    id, branch_id, doctor_id, day_of_week, start_time, end_time,
    slot_minutes, effective_from, effective_to, active
)
select concat('rule-', doctor.id, '-', weekday.day_of_week, '-', shift.code),
       doctor.branch_id,
       doctor.id,
       weekday.day_of_week,
       shift.start_time,
       shift.end_time,
       30,
       '2020-01-01',
       null,
       true
from doctors doctor
cross join seed_weekdays weekday
cross join seed_shifts shift
where doctor.active = true;

drop temporary table seed_shifts;
drop temporary table seed_weekdays;

-- Authentication service schema.
CREATE DATABASE IF NOT EXISTS antam_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE antam_auth;

CREATE TABLE auth_users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(100),
    full_name VARCHAR(150) NOT NULL,
    avatar_url VARCHAR(500),
    provider VARCHAR(20) NOT NULL,
    provider_id VARCHAR(190),
    role VARCHAR(30) NOT NULL DEFAULT 'PATIENT',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE KEY uk_auth_provider (provider, provider_id)
);

-- Notification service schema.
CREATE DATABASE IF NOT EXISTS antam_notification CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE antam_notification;

-- A previous notification-service Flyway migration may already have created this table.
CREATE TABLE IF NOT EXISTS email_deliveries (
    id VARCHAR(36) PRIMARY KEY,
    recipient VARCHAR(190) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template VARCHAR(60) NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message VARCHAR(1000),
    created_at TIMESTAMP(6) NOT NULL,
    sent_at TIMESTAMP(6) NULL DEFAULT NULL,
    INDEX idx_email_deliveries_status_created (status, created_at)
);

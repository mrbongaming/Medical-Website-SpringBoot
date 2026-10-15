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

create table doctor_schedules (
    id varchar(120) primary key,
    branch_id varchar(64) not null,
    doctor_id varchar(64) not null,
    schedule_date date not null,
    unique (doctor_id, schedule_date)
);

create table schedule_slots (
    id bigint auto_increment primary key,
    schedule_id varchar(120) not null,
    slot_time time not null,
    unique (schedule_id, slot_time)
);

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
    status varchar(20) not null check (status in ('pending', 'confirmed', 'completed', 'rejected', 'cancelled', 'absent', 'draft')),
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

alter table appointments add column live_slot_key varchar(320)
    generated always as (
        case when doctor_id is not null and status in ('pending', 'confirmed')
             then concat(doctor_id, '|', appointment_date, '|', appointment_time)
             else null end
    ) stored;
create unique index uq_live_doctor_slot on appointments(live_slot_key);

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
alter table doctor_schedules add constraint fk_doctor_schedules_branch_id foreign key (branch_id) references branches(id);
alter table doctor_schedules add constraint fk_doctor_schedules_doctor_id foreign key (doctor_id) references doctors(id);
alter table schedule_slots add constraint fk_schedule_slots_schedule_id foreign key (schedule_id) references doctor_schedules(id) on delete cascade;
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

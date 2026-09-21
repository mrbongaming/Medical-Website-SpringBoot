import { calculatePrice } from '../helpers/PricingHelpers.js';

export function addBillingData(source, demo = false) {
  const db = structuredClone(source);
  db.version = 3;
  db.promotions = demo
    ? [
        {
          id: 'promo-welcome',
          name: 'Ưu đãi đặt khám An Tâm',
          mode: 'code',
          code: 'ANTAM50',
          kind: 'fixed',
          value: 50000,
          maxDiscount: 50000,
          minimum: 150000,
          startsOn: '2020-01-01',
          endsOn: '2099-12-31',
          branchIds: [],
          serviceIds: [],
          audience: 'all',
          totalLimit: 500,
          perPatientLimit: 1,
          active: true,
        },
        {
          id: 'promo-package',
          name: 'Ưu đãi gói khám 5%',
          mode: 'auto',
          code: '',
          kind: 'percent',
          value: 5,
          maxDiscount: 100000,
          minimum: 500000,
          startsOn: '2020-01-01',
          endsOn: '2099-12-31',
          branchIds: [],
          serviceIds: db.packages.map((p) => `package:${p.id}`),
          audience: 'all',
          totalLimit: 1000,
          perPatientLimit: 3,
          active: true,
        },
      ]
    : [];
  db.serviceCatalog = [
    {
      id: 'consultation',
      name: 'Khám chuyên khoa',
      price: 200000,
      discountable: true,
      active: true,
    },
    {
      id: 'blood-test',
      name: 'Xét nghiệm công thức máu',
      price: 120000,
      discountable: true,
      active: true,
    },
    { id: 'ecg', name: 'Điện tâm đồ', price: 150000, discountable: true, active: true },
    { id: 'ultrasound', name: 'Siêu âm bụng', price: 250000, discountable: true, active: true },
  ];
  db.insurancePolicies = db.branches.map((b) => ({
    id: `policy-${b.id}-1`,
    branchId: b.id,
    version: 1,
    enabled: demo,
    effectiveFrom: '2020-01-01',
    effectiveTo: '2099-12-31',
    note: 'Biểu giá giả lập phục vụ demo, không phải biểu giá BHYT pháp định.',
    services: [
      { serviceId: 'consultation', tariff: 50000 },
      { serviceId: 'blood-test', tariff: 80000 },
      { serviceId: 'ecg', tariff: 90000 },
      { serviceId: 'ultrasound', tariff: 160000 },
    ],
  }));
  db.promotionUses = [];
  db.adjustments = [];
  db.auditLogs = [];
  db.insuranceSettlements = [];
  for (const a of db.appointments) {
    const items = [
      {
        serviceId: a.packageId ? `package:${a.packageId}` : 'consultation',
        name: a.serviceName,
        unitPrice: a.price,
        quantity: 1,
        discountable: true,
      },
    ];
    const payment = db.payments.find((p) => p.appointmentId === a.id);
    a.billing = {
      items,
      insurance: { status: 'none' },
      promotion: null,
      estimate: calculatePrice(items),
      finalized:
        a.status === 'completed'
          ? {
              price: calculatePrice(items),
              at: a.createdAt || a.date,
              by: payment?.createdBy || 'migration',
              reason: 'Bảo toàn phí của lịch trước phiên bản 3.',
            }
          : null,
      settledAt: payment?.date || '',
      settlementId: payment?.id || '',
      legacy: true,
    };
  }
  if (demo) {
    const a = db.appointments.find((r) => r.id === 'AT-TODAY');
    if (a) {
      a.billing.legacy = false;
      a.billing.insurance = {
        status: 'pending',
        cardNumber: 'DEMO12345678901',
        validFrom: '2020-01-01',
        validTo: '2099-12-31',
        registeredFacility: 'An Tâm · Trung tâm (mẫu)',
        referral: '',
      };
      a.billing.promotion = structuredClone(db.promotions[0]);
      a.billing.estimate = calculatePrice(
        a.billing.items,
        a.billing.insurance,
        a.billing.promotion,
      );
      db.promotionUses.push({
        id: 'use-demo-today',
        promotionId: db.promotions[0].id,
        appointmentId: a.id,
        patientId: a.patientId,
        branchId: a.branchId,
        status: 'reserved',
        at: a.createdAt,
      });
    }
  }
  return db;
}

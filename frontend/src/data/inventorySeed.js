const medicineRows = [
  ['MED001', 'Paracetamol 500 mg', 'Paracetamol', 'Giảm đau - hạ sốt', 'Viên nén', 'viên', 1200],
  ['MED002', 'Ibuprofen 400 mg', 'Ibuprofen', 'Giảm đau - kháng viêm', 'Viên nén', 'viên', 1800],
  ['MED003', 'Aspirin 81 mg', 'Acetylsalicylic acid', 'Tim mạch', 'Viên nén', 'viên', 900],
  ['MED004', 'Amoxicillin 500 mg', 'Amoxicillin', 'Kháng sinh', 'Viên nang', 'viên', 2400],
  ['MED005', 'Azithromycin 500 mg', 'Azithromycin', 'Kháng sinh', 'Viên nén', 'viên', 9500],
  ['MED006', 'Cefuroxime 500 mg', 'Cefuroxime', 'Kháng sinh', 'Viên nén', 'viên', 12500],
  ['MED007', 'Metronidazole 250 mg', 'Metronidazole', 'Kháng sinh', 'Viên nén', 'viên', 1100],
  ['MED008', 'Doxycycline 100 mg', 'Doxycycline', 'Kháng sinh', 'Viên nang', 'viên', 1700],
  ['MED009', 'Cetirizine 10 mg', 'Cetirizine', 'Dị ứng', 'Viên nén', 'viên', 1300],
  ['MED010', 'Loratadine 10 mg', 'Loratadine', 'Dị ứng', 'Viên nén', 'viên', 1600],
  ['MED011', 'Chlorpheniramine 4 mg', 'Chlorpheniramine', 'Dị ứng', 'Viên nén', 'viên', 500],
  ['MED012', 'Salbutamol 2 mg', 'Salbutamol', 'Hô hấp', 'Viên nén', 'viên', 800],
  ['MED013', 'Salbutamol 100 mcg', 'Salbutamol', 'Hô hấp', 'Bình xịt', 'bình', 78000],
  ['MED014', 'Budesonide 0,5 mg/2 ml', 'Budesonide', 'Hô hấp', 'Ống khí dung', 'ống', 13500],
  ['MED015', 'Acetylcysteine 200 mg', 'Acetylcysteine', 'Hô hấp', 'Gói bột', 'gói', 2200],
  ['MED016', 'Dextromethorphan 15 mg', 'Dextromethorphan', 'Hô hấp', 'Viên nén', 'viên', 900],
  ['MED017', 'Omeprazole 20 mg', 'Omeprazole', 'Tiêu hóa', 'Viên nang', 'viên', 1400],
  ['MED018', 'Esomeprazole 40 mg', 'Esomeprazole', 'Tiêu hóa', 'Viên nén', 'viên', 5200],
  ['MED019', 'Domperidone 10 mg', 'Domperidone', 'Tiêu hóa', 'Viên nén', 'viên', 1000],
  ['MED020', 'Smectite 3 g', 'Diosmectite', 'Tiêu hóa', 'Gói bột', 'gói', 4200],
  ['MED021', 'Loperamide 2 mg', 'Loperamide', 'Tiêu hóa', 'Viên nang', 'viên', 900],
  ['MED022', 'Lactulose 10 g/15 ml', 'Lactulose', 'Tiêu hóa', 'Gói dung dịch', 'gói', 6500],
  ['MED023', 'Amlodipine 5 mg', 'Amlodipine', 'Tim mạch', 'Viên nén', 'viên', 1200],
  ['MED024', 'Losartan 50 mg', 'Losartan', 'Tim mạch', 'Viên nén', 'viên', 2100],
  ['MED025', 'Bisoprolol 2,5 mg', 'Bisoprolol', 'Tim mạch', 'Viên nén', 'viên', 2500],
  ['MED026', 'Atorvastatin 20 mg', 'Atorvastatin', 'Tim mạch', 'Viên nén', 'viên', 2600],
  ['MED027', 'Clopidogrel 75 mg', 'Clopidogrel', 'Tim mạch', 'Viên nén', 'viên', 4200],
  ['MED028', 'Furosemide 40 mg', 'Furosemide', 'Tim mạch', 'Viên nén', 'viên', 700],
  ['MED029', 'Metformin 500 mg', 'Metformin', 'Nội tiết', 'Viên nén', 'viên', 900],
  ['MED030', 'Gliclazide MR 30 mg', 'Gliclazide', 'Nội tiết', 'Viên nén', 'viên', 2800],
  ['MED031', 'Levothyroxine 50 mcg', 'Levothyroxine', 'Nội tiết', 'Viên nén', 'viên', 1800],
  [
    'MED032',
    'Vitamin D3 1000 IU',
    'Cholecalciferol',
    'Vitamin - khoáng chất',
    'Viên nang',
    'viên',
    1300,
  ],
  [
    'MED033',
    'Calcium 500 mg',
    'Calcium carbonate',
    'Vitamin - khoáng chất',
    'Viên nén',
    'viên',
    1700,
  ],
  [
    'MED034',
    'Vitamin C 500 mg',
    'Ascorbic acid',
    'Vitamin - khoáng chất',
    'Viên sủi',
    'viên',
    3500,
  ],
  ['MED035', 'Kẽm 10 mg', 'Zinc gluconate', 'Vitamin - khoáng chất', 'Viên nén', 'viên', 1500],
  [
    'MED036',
    'Sắt fumarate 200 mg',
    'Ferrous fumarate',
    'Vitamin - khoáng chất',
    'Viên nang',
    'viên',
    2200,
  ],
  ['MED037', 'Diclofenac gel 1%', 'Diclofenac', 'Cơ xương khớp', 'Gel bôi', 'tuýp', 42000],
  ['MED038', 'Meloxicam 7,5 mg', 'Meloxicam', 'Cơ xương khớp', 'Viên nén', 'viên', 1800],
  ['MED039', 'Glucosamine 500 mg', 'Glucosamine', 'Cơ xương khớp', 'Viên nang', 'viên', 3200],
  ['MED040', 'Eperisone 50 mg', 'Eperisone', 'Cơ xương khớp', 'Viên nén', 'viên', 2600],
  ['MED041', 'Hydrocortisone cream 1%', 'Hydrocortisone', 'Da liễu', 'Kem bôi', 'tuýp', 28000],
  ['MED042', 'Clotrimazole cream 1%', 'Clotrimazole', 'Da liễu', 'Kem bôi', 'tuýp', 32000],
  ['MED043', 'Mupirocin ointment 2%', 'Mupirocin', 'Da liễu', 'Thuốc mỡ', 'tuýp', 58000],
  ['MED044', 'Ketoconazole shampoo 2%', 'Ketoconazole', 'Da liễu', 'Dầu gội', 'chai', 95000],
  [
    'MED045',
    'Nước muối NaCl 0,9% 500 ml',
    'Sodium chloride',
    'Dung dịch',
    'Dung dịch',
    'chai',
    14000,
  ],
  ['MED046', 'Nước muối nhỏ mắt 0,9%', 'Sodium chloride', 'Mắt', 'Dung dịch nhỏ mắt', 'chai', 9000],
  ['MED047', 'Tobramycin 0,3%', 'Tobramycin', 'Mắt', 'Dung dịch nhỏ mắt', 'chai', 38000],
  [
    'MED048',
    'Artificial tears 0,5%',
    'Carboxymethylcellulose',
    'Mắt',
    'Dung dịch nhỏ mắt',
    'chai',
    48000,
  ],
  ['MED049', 'Ofloxacin 0,3%', 'Ofloxacin', 'Tai Mũi Họng', 'Dung dịch nhỏ tai', 'chai', 42000],
  [
    'MED050',
    'Xylometazoline 0,05%',
    'Xylometazoline',
    'Tai Mũi Họng',
    'Dung dịch nhỏ mũi',
    'chai',
    26000,
  ],
  ['MED051', 'Povidone iodine 10%', 'Povidone iodine', 'Sát khuẩn', 'Dung dịch', 'chai', 28000],
  ['MED052', 'Chlorhexidine 0,05%', 'Chlorhexidine', 'Sát khuẩn', 'Dung dịch', 'chai', 35000],
  ['MED053', 'ORS chuẩn WHO', 'Glucose + điện giải', 'Bù nước điện giải', 'Gói bột', 'gói', 3200],
  ['MED054', 'Probiotic 1 tỷ CFU', 'Bacillus clausii', 'Tiêu hóa', 'Ống uống', 'ống', 7500],
  ['MED055', 'Menthol lozenge', 'Menthol', 'Tai Mũi Họng', 'Viên ngậm', 'viên', 1800],
  [
    'MED056',
    'Methylprednisolone 4 mg',
    'Methylprednisolone',
    'Kháng viêm',
    'Viên nén',
    'viên',
    1600,
  ],
  ['MED057', 'Prednisolone 5 mg', 'Prednisolone', 'Kháng viêm', 'Viên nén', 'viên', 800],
  ['MED058', 'Gabapentin 300 mg', 'Gabapentin', 'Thần kinh', 'Viên nang', 'viên', 3500],
  ['MED059', 'Betahistine 16 mg', 'Betahistine', 'Thần kinh', 'Viên nén', 'viên', 2300],
  [
    'MED060',
    'Magnesium B6',
    'Magnesium + Vitamin B6',
    'Vitamin - khoáng chất',
    'Viên nén',
    'viên',
    1900,
  ],
  [
    'MED061',
    'Cetuximab 100 mg/20 ml',
    'Cetuximab',
    'Điều trị ung thư',
    'Dung dịch tiêm truyền',
    'lọ',
    4500000,
  ],
];

export function addInventoryData(source, demo = false) {
  const db = structuredClone(source);
  db.version = 4;
  db.medicines = medicineRows.map(
    ([code, name, activeIngredient, group, form, unit, salePrice]) => ({
      id: code.toLowerCase(),
      code,
      name,
      activeIngredient,
      group,
      form,
      unit,
      salePrice,
      active: true,
    }),
  );
  db.inventorySettings = db.branches.flatMap((branch, branchIndex) =>
    db.medicines.map((medicine, medicineIndex) => ({
      id: `setting-${branch.id}-${medicine.id}`,
      branchId: branch.id,
      medicineId: medicine.id,
      min: 20 + ((medicineIndex + branchIndex) % 4) * 10,
      max: 160 + ((medicineIndex + branchIndex) % 5) * 40,
    })),
  );
  db.inventory = db.inventorySettings.map((setting, index) => {
    const pattern = index % 13;
    const quantity =
      pattern === 0
        ? 0
        : pattern <= 2
          ? Math.max(1, setting.min - 5)
          : pattern === 12
            ? setting.max + 20
            : setting.min + 35 + (index % 70);
    return {
      id: `stock-${setting.branchId}-${setting.medicineId}`,
      branchId: setting.branchId,
      medicineId: setting.medicineId,
      quantity,
      reserved: 0,
    };
  });
  db.stockRequests = demo
    ? [
        {
          id: 'restock-demo-1',
          branchId: 'b1',
          kind: 'normal',
          status: 'pending',
          reason: 'Bổ sung các thuốc đã xuống dưới ngưỡng tối thiểu.',
          items: [
            { medicineId: 'med001', quantity: 100, purchasePrice: 700 },
            { medicineId: 'med014', quantity: 40, purchasePrice: 9000 },
          ],
          createdBy: 'admin1',
          createdAt: new Date().toISOString(),
          reviewedBy: '',
          reviewedAt: '',
          reviewReason: '',
        },
      ]
    : [];
  db.inventoryTransactions = [];
  db.stockSchedule = {
    weekdays: [1, 4],
    timezone: 'Asia/Ho_Chi_Minh',
    updatedBy: 'root',
    updatedAt: new Date().toISOString(),
  };
  for (const branch of db.branches) {
    if (!db.users.some((u) => u.id === `staff-${branch.id}`))
      db.users.push({
        id: `staff-${branch.id}`,
        name: `Nhân viên tiếp nhận ${branch.name}`,
        role: 'staff',
        branchId: branch.id,
        phone: `093000000${Number(branch.id.slice(1))}`,
        active: true,
      });
  }
  for (const record of db.records)
    if (!Array.isArray(record.prescription)) record.prescription = [];
  for (const appointment of db.appointments) {
    if (appointment.status === 'confirmed' || appointment.status === 'completed') {
      appointment.reviewedAt ||= appointment.createdAt;
      appointment.reviewedBy ||= '';
    }
  }
  return db;
}

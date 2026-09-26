const asList = (value, fallback = []) =>
  Array.isArray(value)
    ? value
    : typeof value === 'string' && value.trim()
      ? value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : fallback;

export function addV7Data(source) {
  const db = structuredClone(source);
  db.version = 7;
  db.branches = db.branches.map((branch, index) => {
    const defaultEquipment = [
      'Phòng khám chuyên khoa',
      'Khu xét nghiệm',
      'Hệ thống chẩn đoán hình ảnh',
    ];
    return {
      facilityType: index === 0 ? 'Bệnh viện đa khoa' : 'Phòng khám đa khoa',
      establishedYear: 2012 + index * 2,
      email: `coso${index + 1}@antam.example`,
      website: 'https://antam.example',
      detailedIntroduction:
        'Cơ sở thuộc hệ thống An Tâm, phối hợp nhiều chuyên khoa và hỗ trợ người bệnh xuyên suốt từ đặt lịch đến theo dõi sau khám.',
      transportGuide:
        'Có khu vực gửi xe tại cơ sở. Người bệnh nên đến trước giờ hẹn 15 phút để được hướng dẫn.',
      accessibility: 'Có lối đi, thang máy và khu vực ưu tiên cho người cao tuổi, xe lăn.',
      ...branch,
      equipment: asList(branch.equipment, defaultEquipment),
    };
  });
  db.doctors = db.doctors.map((doctor, index) => {
    const defaultLanguages = ['Tiếng Việt', ...(index % 3 === 0 ? ['Tiếng Anh'] : [])];
    const defaultPatientGroups =
      index % 6 === 2 ? ['Trẻ em'] : ['Người trưởng thành', 'Người cao tuổi'];
    return {
      currentPosition: index % 4 === 0 ? 'Trưởng khoa' : 'Bác sĩ điều trị',
      education: 'Đào tạo chuyên khoa tại cơ sở y khoa trong nước.',
      career: 'Có kinh nghiệm khám, điều trị và theo dõi người bệnh tại hệ thống An Tâm.',
      achievements: 'Thường xuyên tham gia cập nhật kiến thức và hoạt động chuyên môn.',
      ...doctor,
      consultationLanguages: asList(doctor.consultationLanguages, defaultLanguages),
      patientGroups: asList(doctor.patientGroups, defaultPatientGroups),
      focusAreas: asList(doctor.focusAreas, asList(doctor.expertise)),
      certifications: asList(doctor.certifications, ['Chứng chỉ hành nghề khám bệnh, chữa bệnh']),
      memberships: asList(doctor.memberships, ['Hội chuyên ngành phù hợp với lĩnh vực công tác']),
    };
  });
  return db;
}

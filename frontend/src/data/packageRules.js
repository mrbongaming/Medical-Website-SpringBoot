export const isFacilityAssignedPackage = (pack) =>
  pack?.id === 'pkg1' ||
  String(pack?.name || '')
    .trim()
    .toLocaleLowerCase('vi-VN') === 'khám tổng quát';

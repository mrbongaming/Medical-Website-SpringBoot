export const selectPublicBranches = (db) => (db.branches || []).filter((branch) => branch.active);

export const publicBranchCount = (db) => selectPublicBranches(db).length;

import prisma from '../config/database';

/**
 * Récupère récursivement tous les IDs d'unités descendantes d'une unité donnée
 */
async function getDescendantUnitIds(unitId: number): Promise<number[]> {
  const children = await prisma.organizationalUnit.findMany({
    where: {
      parentId: unitId,
      deletedAt: null,
    },
    select: { id: true },
  });

  const allIds = [unitId];
  for (const child of children) {
    const childIds = await getDescendantUnitIds(child.id);
    allIds.push(...childIds);
  }

  return allIds;
}

/**
 * Récupère tous les IDs d'unités gérées par un manager (directement et récursivement)
 */
export async function getManagedUnitIds(managerUserId: number): Promise<number[]> {
  const managedUnits = await prisma.organizationalUnit.findMany({
    where: {
      managerId: managerUserId,
      deletedAt: null,
    },
    select: { id: true },
  });

  const allUnitIds: number[] = [];
  for (const unit of managedUnits) {
    const unitIds = await getDescendantUnitIds(unit.id);
    allUnitIds.push(...unitIds);
  }

  return [...new Set(allUnitIds)]; // Supprimer les doublons
}

export const managerHasAccessToEmployee = async (managerUserId: number, employeeId: number): Promise<boolean> => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      organizationalUnitId: true,
    },
  });

  if (!employee || !employee.organizationalUnitId) {
    return false;
  }

  const managedUnitIds = await getManagedUnitIds(managerUserId);
  return managedUnitIds.includes(employee.organizationalUnitId);
};

export const managerHasAccessToUnit = async (managerUserId: number, unitId: number): Promise<boolean> => {
  const managedUnitIds = await getManagedUnitIds(managerUserId);
  return managedUnitIds.includes(unitId);
};


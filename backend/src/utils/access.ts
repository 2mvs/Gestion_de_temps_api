import prisma from '../config/database';

export const managerHasAccessToEmployee = async (managerUserId: number, employeeId: number): Promise<boolean> => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      organizationalUnit: {
        select: {
          managerId: true,
        },
      },
    },
  });

  if (!employee) {
    return false;
  }

  return employee.organizationalUnit?.managerId === managerUserId;
};

export const managerHasAccessToUnit = async (managerUserId: number, unitId: number): Promise<boolean> => {
  const unit = await prisma.organizationalUnit.findUnique({
    where: { id: unitId },
    select: { managerId: true },
  });

  if (!unit) {
    return false;
  }

  return unit.managerId === managerUserId;
};


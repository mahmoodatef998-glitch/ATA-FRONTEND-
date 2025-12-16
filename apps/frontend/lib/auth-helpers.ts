// Client-side auth helpers stub
export const requireAuth = async () => {
  return { user: { id: 0, role: "ADMIN", companyId: 0 } };
};

export const requireRole = async (role: string) => {
  return { user: { id: 0, role: "ADMIN", companyId: 0 } };
};

export const getServerSession = async () => {
  return { user: { id: 0, role: "ADMIN", companyId: 0 } };
};




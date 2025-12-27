import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClientApprovalList } from "@/components/dashboard/client-approval-list";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { getTranslation } from "@/lib/i18n/server";

async function getPendingClients() {
  try {
    const [clients, total] = await Promise.all([
      prisma.clients.findMany({
        where: {
          hasAccount: true,
          accountStatus: "PENDING",
        },
        include: {
          approvedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          orders: {
            select: {
              id: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.clients.count({
        where: {
          hasAccount: true,
          accountStatus: "PENDING",
        },
      }),
    ]);

    return {
      clients: clients.map(client => ({
        ...client,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
        approvedAt: client.approvedAt?.toISOString() || null,
      })),
      pagination: {
        page: 1,
        limit: 20,
        total,
        totalPages: Math.ceil(total / 20),
      },
    };
  } catch (error) {
    console.error("Error fetching pending clients:", error);
    return {
      clients: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  }
}

export default async function ClientsPage() {
  const session = await auth();
  
  if (!session || !session.user) {
    redirect("/login");
  }

  // Only ADMIN can access this page
  if (session.user.role !== UserRole.ADMIN) {
    const accessDenied = await getTranslation('clients.accessDenied');
    const onlyAdministrators = await getTranslation('clients.onlyAdministrators');
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-2">{accessDenied}</h2>
              <p className="text-muted-foreground">
                {onlyAdministrators}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = await getPendingClients();
  const clientAccounts = await getTranslation('clients.clientAccounts');
  const manageClientApprovals = await getTranslation('clients.manageClientApprovals');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {clientAccounts}
        </h1>
        <p className="text-muted-foreground">
          {manageClientApprovals}
        </p>
      </div>

      <ClientApprovalList initialClients={data.clients} pagination={data.pagination} />
    </div>
  );
}


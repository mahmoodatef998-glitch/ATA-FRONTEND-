"use client";

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AnalyticsChartsProps {
  revenueData: Array<{ month: string; revenue: number }>;
  ordersData: Array<{ status: string; count: number }>;
  topClients: Array<{ name: string; orders: number; revenue: number }>;
  conversionRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function AnalyticsCharts({ revenueData, ordersData, topClients, conversionRate }: AnalyticsChartsProps) {
  return (
    <div className="space-y-6">
      {/* Revenue Trend - Last 3 Months */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend (Last 3 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `AED ${value.toLocaleString()}`}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#0088FE" 
                strokeWidth={2}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by Status */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ordersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#00C49F" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Clients & Conversion Rate */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Clients */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Top Clients (Last 3 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topClients}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="orders"
              >
                {topClients.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Rate */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Conversion Rate</h3>
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <div className="text-6xl font-bold text-primary mb-2">
                {conversionRate.toFixed(1)}%
              </div>
              <p className="text-muted-foreground">
                Orders Completed / Total Orders
              </p>
              <div className="mt-6 w-64 mx-auto">
                <div className="h-4 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${conversionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Clients Table */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Top Clients Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Client Name</th>
                <th className="text-right p-2">Orders</th>
                <th className="text-right p-2">Revenue (AED)</th>
              </tr>
            </thead>
            <tbody>
              {topClients.map((client, index) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="p-2">{client.name}</td>
                  <td className="text-right p-2">{client.orders}</td>
                  <td className="text-right p-2">{client.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


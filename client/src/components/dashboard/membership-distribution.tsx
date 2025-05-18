import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pie } from "react-chartjs-2";
import { MEMBERSHIP_TIERS } from "@/lib/constants";

interface DistributionItem {
  tierId: string;
  count: number;
}

export const MembershipDistribution: React.FC = () => {
  const { data: distribution = [], isLoading } = useQuery<DistributionItem[]>({
    queryKey: ["/api/dashboard/membership-distribution"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Membership Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-48">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
          <div className="space-y-2 mt-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[50px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Map tier IDs to readable names
  const tierMap = MEMBERSHIP_TIERS.reduce((acc, tier) => {
    acc[tier.id] = tier.name;
    return acc;
  }, {} as Record<string, string>);

  const formattedData = distribution.map((item) => ({
    ...item,
    tierId: tierMap[item.tierId] || item.tierId,
  }));

  // Calculate total for percentage
  const total = formattedData.reduce((sum, item) => sum + parseInt(item.count.toString()), 0) || 0;

  // Chart data
  const chartData = {
    labels: formattedData.map((item) => item.tierId) || [],
    datasets: [
      {
        data: formattedData.map((item) => item.count) || [],
        backgroundColor: [
          'hsl(var(--chart-1))',
          'hsl(var(--chart-2))',
          'hsl(var(--chart-3))',
          'hsl(var(--chart-4))',
          'hsl(var(--chart-5))',
        ],
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        display: false,
      },
    },
    responsive: true,
    maintainAspectRatio: true,
    cutout: '65%',
  };

  // Get background color for the color indicators
  const getColorForIndex = (index: number) => {
    const colors = [
      'bg-[hsl(var(--chart-1))]',
      'bg-[hsl(var(--chart-2))]',
      'bg-[hsl(var(--chart-3))]',
      'bg-[hsl(var(--chart-4))]',
      'bg-[hsl(var(--chart-5))]',
    ];
    return colors[index % colors.length];
  };

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle className="text-lg font-medium text-foreground">Membership Distribution</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative pb-5">
          <div className="mx-auto w-48 h-48 rounded-full overflow-hidden relative">
            <Pie data={chartData} options={chartOptions} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 mt-4">
          {formattedData.map((item, index) => (
            <div key={item.tierId} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className={`w-3 h-3 rounded-full ${getColorForIndex(index)} block mr-2`}></span>
                <span className="text-sm text-foreground">{item.tierId}</span>
              </div>
              <div className="text-sm font-medium">
                <span className="text-foreground">{item.count}</span>
                <span className="text-muted-foreground ml-1">({Math.round((item.count / total) * 100)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MembershipDistribution;

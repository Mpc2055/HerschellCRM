import React from "react";
import { useQuery } from "@tanstack/react-query";
import StatisticsCard from "@/components/dashboard/stats-card";
import RenewalsDueWidget from "@/components/dashboard/renewals-widget";
import MembershipDistribution from "@/components/dashboard/membership-distribution";
import RecentActivity from "@/components/dashboard/recent-activity";
import NewsletterPreview from "@/components/dashboard/newsletter-preview";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define the type for the dashboard stats
interface DashboardStats {
  totalMembers: number;
  totalMembersChange: number;
  newMembers: number;
  newMembersChange: number;
  renewalsDue: number;
  renewalsDueChange: number;
  revenue: string;
  revenueChange: number;
}

const Dashboard: React.FC = () => {
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  // Helper function to format numbers
  const formatNumber = (value: number | string): string => {
    if (typeof value === 'string') {
      return value;
    }
    return value === 0 ? "0" : value.toString();
  };
  
  // Helper function to format currency
  const formatCurrency = (value: number | string): string => {
    if (typeof value === 'string') {
      return value.startsWith('$') ? value : `$${value}`;
    }
    return `$${value.toFixed(2)}`;
  };

  const hasNoMembers = !isLoadingStats && dashboardStats?.totalMembers === 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back! Here's what's happening with your memberships.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href="/members/export/csv">
                <i className="fas fa-download mr-2"></i>
                Export
              </Link>
            </Button>
            <Button
              size="sm"
              asChild
            >
              <Link href="/members/new">
                <i className="fas fa-plus mr-2"></i>
                Add Member
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatisticsCard
          icon="fas fa-users"
          title="Total Members"
          value={isLoadingStats ? "Loading..." : formatNumber(dashboardStats?.totalMembers || 0)}
          change={{ 
            value: isLoadingStats ? "0%" : `${dashboardStats?.totalMembersChange || 0}%`, 
            isPositive: isLoadingStats ? true : (dashboardStats?.totalMembersChange || 0) >= 0 
          }}
          color="primary"
        />
        <StatisticsCard
          icon="fas fa-user-plus"
          title="New Members (30d)"
          value={isLoadingStats ? "Loading..." : formatNumber(dashboardStats?.newMembers || 0)}
          change={{ 
            value: isLoadingStats ? "0%" : `${dashboardStats?.newMembersChange || 0}%`, 
            isPositive: isLoadingStats ? true : (dashboardStats?.newMembersChange || 0) >= 0 
          }}
          color="green"
        />
        <StatisticsCard
          icon="fas fa-calendar-day"
          title="Renewals Due (30d)"
          value={isLoadingStats ? "Loading..." : formatNumber(dashboardStats?.renewalsDue || 0)}
          change={{ 
            value: isLoadingStats ? "0%" : `${dashboardStats?.renewalsDueChange || 0}%`, 
            isPositive: isLoadingStats ? false : (dashboardStats?.renewalsDueChange || 0) < 0 
          }}
          color="yellow"
        />
        <StatisticsCard
          icon="fas fa-dollar-sign"
          title="Revenue (MTD)"
          value={isLoadingStats ? "Loading..." : formatCurrency(dashboardStats?.revenue || "0")}
          change={{ 
            value: isLoadingStats ? "0%" : `${dashboardStats?.revenueChange || 0}%`, 
            isPositive: isLoadingStats ? true : (dashboardStats?.revenueChange || 0) >= 0 
          }}
          color="blue"
        />
      </div>

      {hasNoMembers ? (
        <Card className="p-6 text-center">
          <CardContent className="pt-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <i className="fas fa-user-plus text-primary text-xl"></i>
            </div>
            <h3 className="text-lg font-medium mb-2">No Members Yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Your dashboard will show analytics and insights once you add members to your system.
            </p>
            <Button asChild>
              <Link href="/members/new">
                <i className="fas fa-plus mr-2"></i>
                Add Your First Member
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Renewals Due Widget (spans 2 columns on large screens) */}
            <div className="lg:col-span-2">
              <RenewalsDueWidget />
            </div>

            {/* Membership Distribution */}
            <div>
              <MembershipDistribution />
            </div>
          </div>

          {/* Recent Activity */}
          <RecentActivity />

          {/* Newsletter Preview */}
          <NewsletterPreview />
        </>
      )}
    </div>
  );
};

export default Dashboard;

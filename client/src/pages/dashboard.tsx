import React from "react";
import { useQuery } from "@tanstack/react-query";
import StatisticsCard from "@/components/dashboard/stats-card";
import RenewalsDueWidget from "@/components/dashboard/renewals-widget";
import MembershipDistribution from "@/components/dashboard/membership-distribution";
import RecentActivity from "@/components/dashboard/recent-activity";
import NewsletterPreview from "@/components/dashboard/newsletter-preview";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const Dashboard: React.FC = () => {
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

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
          value={isLoadingStats ? "Loading..." : dashboardStats?.totalMembers || "247"}
          change={{ value: "12%", isPositive: true }}
          color="primary"
        />
        <StatisticsCard
          icon="fas fa-user-plus"
          title="New Members (30d)"
          value={isLoadingStats ? "Loading..." : dashboardStats?.newMembers || "18"}
          change={{ value: "22%", isPositive: true }}
          color="green"
        />
        <StatisticsCard
          icon="fas fa-calendar-day"
          title="Renewals Due (30d)"
          value={isLoadingStats ? "Loading..." : dashboardStats?.renewalsDue || "32"}
          change={{ value: "5%", isPositive: false }}
          color="yellow"
        />
        <StatisticsCard
          icon="fas fa-dollar-sign"
          title="Revenue (MTD)"
          value={isLoadingStats ? "Loading..." : dashboardStats?.revenue || "$3,240"}
          change={{ value: "8%", isPositive: true }}
          color="blue"
        />
      </div>

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
    </div>
  );
};

export default Dashboard;

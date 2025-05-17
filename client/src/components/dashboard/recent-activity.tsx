import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const RecentActivity: React.FC = () => {
  const [activityType, setActivityType] = React.useState<string>("all");
  
  const { data: recentMembers } = useQuery({
    queryKey: ["/api/dashboard/recent-members", { limit: 5 }],
  });
  
  const { data: recentTransactions } = useQuery({
    queryKey: ["/api/dashboard/recent-transactions", { limit: 5 }],
  });
  
  const { data: recentCampaigns } = useQuery({
    queryKey: ["/api/dashboard/recent-campaigns", { limit: 5 }],
  });
  
  const isLoading = !recentMembers && !recentTransactions && !recentCampaigns;
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-[120px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Combine and format all activities
  const formatActivities = () => {
    const activities = [];
    
    // Add member activities
    if (recentMembers && (activityType === "all" || activityType === "members")) {
      recentMembers.forEach((member: any) => {
        activities.push({
          type: "member",
          icon: "user-plus",
          iconColor: "bg-primary",
          title: "New membership created",
          description: `${member.firstName} ${member.lastName} joined as a ${member.tierId.replace("_", " ")} Member`,
          date: new Date(member.createdAt),
        });
      });
    }
    
    // Add transaction activities
    if (recentTransactions && (activityType === "all" || activityType === "transactions")) {
      recentTransactions.forEach((transaction: any) => {
        let icon = "dollar-sign";
        let title = "Payment received";
        
        if (transaction.type === "renewal") {
          icon = "sync-alt";
          title = "Membership renewed";
        } else if (transaction.type === "new_membership") {
          icon = "user-plus";
          title = "New membership payment";
        } else if (transaction.type === "donation") {
          icon = "gift";
          title = "Donation received";
        }
        
        activities.push({
          type: "transaction",
          icon: icon,
          iconColor: "bg-blue-500",
          title: title,
          description: `Payment of $${transaction.amount} via ${transaction.paymentMethod.replace("_", " ")}`,
          date: new Date(transaction.date),
          memberId: transaction.memberId,
        });
      });
    }
    
    // Add campaign activities
    if (recentCampaigns && (activityType === "all" || activityType === "campaigns")) {
      recentCampaigns.forEach((campaign: any) => {
        let icon = "envelope";
        let title = "Newsletter created";
        
        if (campaign.status === "sent") {
          title = "Newsletter sent";
        } else if (campaign.status === "scheduled") {
          icon = "calendar-alt";
          title = "Newsletter scheduled";
        }
        
        activities.push({
          type: "campaign",
          icon: icon,
          iconColor: "bg-yellow-500",
          title: title,
          description: `"${campaign.title}" - ${campaign.status === "sent" ? "sent to members" : campaign.status === "scheduled" ? "scheduled for future delivery" : "draft created"}`,
          date: campaign.sentAt ? new Date(campaign.sentAt) : new Date(campaign.createdAt),
        });
      });
    }
    
    // Sort by date, newest first
    return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  };
  
  const activities = formatActivities();
  
  const getIconColorClass = (color: string) => {
    switch (color) {
      case "bg-primary":
        return "bg-primary text-white";
      case "bg-blue-500":
        return "bg-blue-500 text-white";
      case "bg-yellow-500":
        return "bg-yellow-500 text-white";
      case "bg-green-500":
        return "bg-green-500 text-white";
      default:
        return "bg-primary text-white";
    }
  };
  
  return (
    <Card>
      <CardHeader className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-gray-900">Recent Activity</CardTitle>
        <Select value={activityType} onValueChange={setActivityType}>
          <SelectTrigger className="h-8 w-[160px]">
            <SelectValue placeholder="All Activities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="members">New Members</SelectItem>
            <SelectItem value="transactions">Payments</SelectItem>
            <SelectItem value="campaigns">Newsletters</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-6 py-5">
        <div className="flow-root">
          <ul className="-mb-8">
            {activities.length > 0 ? activities.map((activity, index) => (
              <li key={`${activity.type}-${index}`}>
                <div className="relative pb-8">
                  {index < activities.length - 1 ? (
                    <span 
                      className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" 
                      aria-hidden="true"
                    ></span>
                  ) : null}
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      <div className={`h-10 w-10 rounded-full ${getIconColorClass(activity.iconColor)} flex items-center justify-center ring-8 ring-white`}>
                        <i className={`fas fa-${activity.icon}`}></i>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-sm">
                          <a href="#" className="font-medium text-gray-900">{activity.title}</a>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {format(activity.date, 'MMM d, yyyy \'at\' h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            )) : (
              <li className="text-center py-6 text-muted-foreground">
                No recent activities found.
              </li>
            )}
          </ul>
        </div>
        {activities.length > 0 && (
          <div className="mt-6 text-center">
            <Button variant="outline" size="sm">
              View All Activity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;

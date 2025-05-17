import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CAMPAIGN_STATUSES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ColumnDef } from "@tanstack/react-table";

interface Campaign {
  id: number;
  title: string;
  subject: string;
  status: string;
  sentAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
  opens: number;
  clicks: number;
  audience: string;
}

const CampaignList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Build the query parameters for filtering
  const getQueryParams = () => {
    const params = new URLSearchParams();
    
    if (searchQuery) {
      params.append("search", searchQuery);
    }
    
    if (statusFilter) {
      params.append("status", statusFilter);
    }
    
    return params.toString();
  };

  // Fetch campaigns with filters
  const { data: campaigns, isLoading, isError } = useQuery({
    queryKey: [`/api/newsletter/campaigns?${getQueryParams()}`],
  });
  
  // Handle campaign actions
  const handleDeleteCampaign = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/newsletter/campaigns/${id}`, {});
      toast({
        title: "Campaign deleted",
        description: "The newsletter campaign has been deleted successfully.",
      });
      
      // Refresh the campaigns list
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter/campaigns"] });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast({
        title: "Error",
        description: "Failed to delete the campaign.",
        variant: "destructive",
      });
    }
  };
  
  const handleDuplicateCampaign = async (campaign: Campaign) => {
    try {
      const newCampaign = {
        title: `Copy of ${campaign.title}`,
        subject: campaign.subject,
        content: campaign.content,
        audience: campaign.audience,
        status: "draft"
      };
      
      await apiRequest("POST", "/api/newsletter/campaigns", newCampaign);
      
      toast({
        title: "Campaign duplicated",
        description: "The newsletter campaign has been duplicated successfully.",
      });
      
      // Refresh the campaigns list
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter/campaigns"] });
    } catch (error) {
      console.error("Error duplicating campaign:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate the campaign.",
        variant: "destructive",
      });
    }
  };
  
  // Define column structure for the DataTable
  const columns: ColumnDef<Campaign>[] = [
    {
      accessorKey: "title",
      header: "Campaign",
      cell: ({ row }) => {
        const campaign = row.original;
        const audienceData = campaign.audience ? JSON.parse(campaign.audience) : {};
        return (
          <div>
            <div className="font-medium">{campaign.title}</div>
            <div className="text-xs text-muted-foreground">
              {audienceData.count 
                ? `${audienceData.count} recipients` 
                : "All active members"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => row.original.subject,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        
        let badgeClass;
        switch (status) {
          case "draft":
            badgeClass = "bg-gray-100 text-gray-800 hover:bg-gray-100";
            break;
          case "scheduled":
            badgeClass = "bg-blue-100 text-blue-800 hover:bg-blue-100";
            break;
          case "sent":
            badgeClass = "bg-green-100 text-green-800 hover:bg-green-100";
            break;
          case "cancelled":
            badgeClass = "bg-red-100 text-red-800 hover:bg-red-100";
            break;
          default:
            badgeClass = "bg-gray-100 text-gray-800 hover:bg-gray-100";
        }
        
        return (
          <Badge className={badgeClass}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const campaign = row.original;
        if (campaign.sentAt) {
          return (
            <div>
              <div>Sent</div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(campaign.sentAt), "MMM d, yyyy h:mm a")}
              </div>
            </div>
          );
        } else if (campaign.scheduledFor) {
          return (
            <div>
              <div>Scheduled</div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(campaign.scheduledFor), "MMM d, yyyy h:mm a")}
              </div>
            </div>
          );
        } else {
          return (
            <div>
              <div>Created</div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(campaign.createdAt), "MMM d, yyyy")}
              </div>
            </div>
          );
        }
      },
    },
    {
      accessorKey: "performance",
      header: "Performance",
      cell: ({ row }) => {
        const campaign = row.original;
        
        if (campaign.status !== "sent") {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        
        const audienceData = campaign.audience ? JSON.parse(campaign.audience) : {};
        const recipients = audienceData.count || 0;
        
        const openRate = recipients > 0 ? Math.round((campaign.opens / recipients) * 100) : 0;
        const clickRate = recipients > 0 ? Math.round((campaign.clicks / recipients) * 100) : 0;
        
        return (
          <div className="space-y-1">
            <div className="text-sm">
              <span className="font-medium">{openRate}%</span> opens
            </div>
            <div className="text-sm">
              <span className="font-medium">{clickRate}%</span> clicks
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const campaign = row.original;
        
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <i className="fas fa-ellipsis-h"></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Link href={`/newsletter/compose/${campaign.id}`}>
                    <span className="flex items-center w-full">
                      <i className="fas fa-edit mr-2"></i> Edit Campaign
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicateCampaign(campaign)}>
                  <span className="flex items-center w-full">
                    <i className="fas fa-clone mr-2"></i> Duplicate
                  </span>
                </DropdownMenuItem>
                {campaign.status === "sent" && (
                  <DropdownMenuItem>
                    <Link href={`/newsletter/campaigns/${campaign.id}`}>
                      <span className="flex items-center w-full">
                        <i className="fas fa-chart-line mr-2"></i> View Analytics
                      </span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                      <span className="flex items-center w-full">
                        <i className="fas fa-trash-alt mr-2"></i> Delete Campaign
                      </span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this campaign? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <Card>
      <CardHeader className="border-b border-gray-200">
        <div className="flex justify-between items-center">
          <CardTitle>Newsletter Campaigns</CardTitle>
          <Link href="/newsletter/compose">
            <Button>
              <i className="fas fa-plus mr-2"></i>
              Create Campaign
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6 flex flex-col md:flex-row gap-4 md:items-center">
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={handleSearch}
            className="max-w-xs"
          />
          <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || undefined)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {CAMPAIGN_STATUSES.map((status) => (
                <SelectItem key={status.id} value={status.id}>
                  {status.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <i className="fas fa-spinner fa-spin text-xl text-gray-400"></i>
            </div>
            <p className="text-muted-foreground">Loading campaigns...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <i className="fas fa-exclamation-triangle text-xl text-red-500"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading campaigns</h3>
            <p className="text-muted-foreground mb-4">
              There was a problem loading the campaign list. Please try again.
            </p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/newsletter/campaigns"] })}>
              Retry
            </Button>
          </div>
        ) : campaigns?.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <i className="fas fa-envelope text-xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter
                ? "No campaigns match your current filters. Try adjusting your search criteria."
                : "You haven't created any newsletter campaigns yet."}
            </p>
            <Link href="/newsletter/compose">
              <Button>
                <i className="fas fa-plus mr-2"></i>
                Create Campaign
              </Button>
            </Link>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={campaigns}
            searchColumn="title"
            pagination={true}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default CampaignList;

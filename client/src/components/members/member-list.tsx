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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MEMBERSHIP_TIERS, MEMBER_STATUSES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ColumnDef } from "@tanstack/react-table";

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tierId: string;
  joinDate: string;
  renewalDate: string;
  status: string;
  isArchived: boolean;
}

const MemberList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [tierFilter, setTierFilter] = useState<string | undefined>(undefined);
  const [showArchived, setShowArchived] = useState(false);
  
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
    
    if (tierFilter) {
      params.append("tierId", tierFilter);
    }
    
    if (showArchived !== undefined) {
      params.append("isArchived", String(showArchived));
    }
    
    return params.toString();
  };

  // Fetch members with filters
  const { data: members = [], isLoading, isError } = useQuery<Member[]>({
    queryKey: [`/api/members?${getQueryParams()}`],
  });
  
  // Handle archive/unarchive member
  const handleArchiveToggle = async (id: number, currentArchiveState: boolean) => {
    try {
      if (currentArchiveState) {
        // Unarchive (by updating isArchived to false)
        await apiRequest("PUT", `/api/members/${id}`, { isArchived: false });
        toast({
          title: "Member unarchived",
          description: "The member has been unarchived successfully.",
        });
      } else {
        // Archive
        await apiRequest("PATCH", `/api/members/${id}/archive`, {});
        toast({
          title: "Member archived",
          description: "The member has been archived successfully.",
        });
      }
      
      // Refresh the members list
      queryClient.invalidateQueries({ queryKey: [`/api/members`] });
    } catch (error) {
      console.error("Error toggling archive status:", error);
      toast({
        title: "Error",
        description: `Failed to ${currentArchiveState ? 'unarchive' : 'archive'} member.`,
        variant: "destructive",
      });
    }
  };
  
  // Define column structure for the DataTable
  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
              <span className="text-primary font-medium">
                {member.firstName.charAt(0)}
              </span>
            </div>
            <div>
              <div className="font-medium">
                {member.firstName} {member.lastName}
              </div>
              <div className="text-xs text-muted-foreground">{member.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "membership",
      header: "Membership",
      cell: ({ row }) => {
        const member = row.original;
        const tier = MEMBERSHIP_TIERS.find(t => t.id === member.tierId);
        return (
          <div>
            <div className="font-medium">
              {tier?.name || member.tierId.replace("_", " ")}
            </div>
            <div className="text-xs text-muted-foreground">
              ${tier?.price || "N/A"}/year
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "joinDate",
      header: "Join Date",
      cell: ({ row }) => format(new Date(row.original.joinDate), "MMM d, yyyy"),
    },
    {
      accessorKey: "renewalDate",
      header: "Renewal Date",
      cell: ({ row }) => {
        const renewalDate = new Date(row.original.renewalDate);
        const daysUntilRenewal = Math.ceil((renewalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <div>
            <div>{format(renewalDate, "MMM d, yyyy")}</div>
            {daysUntilRenewal <= 30 && daysUntilRenewal > 0 ? (
              <div className="text-xs text-red-500">
                {daysUntilRenewal} days left
              </div>
            ) : daysUntilRenewal <= 0 ? (
              <div className="text-xs text-red-500">
                Expired
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        
        let badgeClass;
        switch (status) {
          case "active":
            badgeClass = "bg-green-100 text-green-800 hover:bg-green-100";
            break;
          case "expired":
            badgeClass = "bg-red-100 text-red-800 hover:bg-red-100";
            break;
          case "pending":
            badgeClass = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
            break;
          case "archived":
            badgeClass = "bg-gray-100 text-gray-800 hover:bg-gray-100";
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
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const member = row.original;
        
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
                  <Link href={`/members/${member.id}`}>
                    <span className="flex items-center w-full">
                      <i className="fas fa-eye mr-2"></i> View Details
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={`/members/${member.id}?edit=true`}>
                    <span className="flex items-center w-full">
                      <i className="fas fa-edit mr-2"></i> Edit Member
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span className="flex items-center w-full">
                    <i className="fas fa-envelope mr-2"></i> Send Email
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      {member.isArchived ? (
                        <span className="flex items-center w-full text-green-600">
                          <i className="fas fa-undo mr-2"></i> Unarchive Member
                        </span>
                      ) : (
                        <span className="flex items-center w-full text-red-600">
                          <i className="fas fa-archive mr-2"></i> Archive Member
                        </span>
                      )}
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {member.isArchived ? "Unarchive Member" : "Archive Member"}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {member.isArchived 
                          ? "This will make the member visible in the default member list again. Are you sure you want to unarchive this member?"
                          : "This will hide the member from the default member list. The member data will still be preserved. Are you sure you want to archive this member?"}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleArchiveToggle(member.id, member.isArchived)}
                        className={member.isArchived ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                      >
                        {member.isArchived ? "Unarchive" : "Archive"}
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
          <CardTitle>Members</CardTitle>
          <Link href="/members/new">
            <Button>
              <i className="fas fa-plus mr-2"></i>
              Add Member
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={handleSearch}
              className="max-w-xs"
            />
            <div className="flex flex-wrap gap-4">
              <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? undefined : value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-statuses" value="all">All Statuses</SelectItem>
                  {MEMBER_STATUSES.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tierFilter || "all"} onValueChange={(value) => setTierFilter(value === "all" ? undefined : value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-tiers" value="all">All Tiers</SelectItem>
                  {MEMBERSHIP_TIERS.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showArchived"
              checked={showArchived}
              onCheckedChange={(checked) => setShowArchived(checked as boolean)}
            />
            <label
              htmlFor="showArchived"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show archived members
            </label>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <i className="fas fa-spinner fa-spin text-xl text-gray-400"></i>
            </div>
            <p className="text-muted-foreground">Loading members...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <i className="fas fa-exclamation-triangle text-xl text-red-500"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading members</h3>
            <p className="text-muted-foreground mb-4">
              There was a problem loading the member list. Please try again.
            </p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/members`] })}>
              Retry
            </Button>
          </div>
        ) : members?.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <i className="fas fa-user-slash text-xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter || tierFilter
                ? "No members match your current filters. Try adjusting your search criteria."
                : "There are no members in the system yet. Add your first member to get started."}
            </p>
            <Link href="/members/new">
              <Button>
                <i className="fas fa-plus mr-2"></i>
                Add Member
              </Button>
            </Link>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={members}
            searchColumn="name"
            pagination={true}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default MemberList;

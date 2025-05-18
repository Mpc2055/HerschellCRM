import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MEMBERSHIP_TIERS } from "@/lib/constants";
import MemberForm from "@/components/members/member-form";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

interface MemberDetailProps {
  id: string;
}

const MemberDetail: React.FC<MemberDetailProps> = ({ id }) => {
  const [location, navigate] = useLocation();
  const queryParams = new URLSearchParams(location.split("?")[1] || "");
  const isEditing = queryParams.get("edit") === "true";
  
  const [activeTab, setActiveTab] = useState("details");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: member, isLoading, isError } = useQuery({
    queryKey: [`/api/members/${id}`],
  });

  const { data: transactions } = useQuery({
    queryKey: [`/api/members/${id}/transactions`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !member) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <i className="fas fa-exclamation-triangle text-xl text-red-500"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Member Not Found</h3>
        <p className="text-muted-foreground mb-4">
          The member you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={() => navigate("/members")}>
          Back to Members
        </Button>
      </div>
    );
  }

  // If in edit mode, show the form
  if (isEditing) {
    return (
      <>
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">
                    <Home className="mr-1 h-4 w-4" />
                    Dashboard
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/members">Members</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/members/${id}`}>{member.firstName} {member.lastName}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#" isCurrentPage>
                  Edit
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-display font-bold text-primary mt-2">
            Edit Member
          </h1>
          <p className="text-sm text-muted-foreground">
            Update membership information for {member.firstName} {member.lastName}
          </p>
        </div>
        
        <MemberForm member={member} isEditing={true} />
      </>
    );
  }

  // Find tier information
  const tierInfo = MEMBERSHIP_TIERS.find(tier => tier.id === member.tierId);
  
  // Calculate days until renewal
  const renewalDate = new Date(member.renewalDate);
  const today = new Date();
  const daysUntilRenewal = Math.round((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Function to handle archiving
  const handleArchive = async () => {
    try {
      await apiRequest("PATCH", `/api/members/${id}/archive`, {});
      
      toast({
        title: "Member Archived",
        description: `${member.firstName} ${member.lastName} has been archived successfully.`,
      });
      
      // Refresh the member data
      queryClient.invalidateQueries({ queryKey: [`/api/members/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
    } catch (error) {
      console.error("Error archiving member:", error);
      toast({
        title: "Error",
        description: "Failed to archive member. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Function to handle unarchiving
  const handleUnarchive = async () => {
    try {
      await apiRequest("PUT", `/api/members/${id}`, { isArchived: false });
      
      toast({
        title: "Member Unarchived",
        description: `${member.firstName} ${member.lastName} has been unarchived successfully.`,
      });
      
      // Refresh the member data
      queryClient.invalidateQueries({ queryKey: [`/api/members/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
    } catch (error) {
      console.error("Error unarchiving member:", error);
      toast({
        title: "Error",
        description: "Failed to unarchive member. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Transaction column definitions
  const transactionColumns: ColumnDef<any>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => format(new Date(row.original.date), "MMM d, yyyy"),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge className={row.original.type === "new_membership" ? "bg-blue-100 text-blue-800" : row.original.type === "renewal" ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800"}>
          {row.original.type === "new_membership" 
            ? "New Membership" 
            : row.original.type === "renewal" 
              ? "Renewal" 
              : "Donation"}
        </Badge>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `$${parseFloat(row.original.amount).toFixed(2)}`,
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment Method",
      cell: ({ row }) => row.original.paymentMethod.replace("_", " ").charAt(0).toUpperCase() + row.original.paymentMethod.replace("_", " ").slice(1),
    },
    {
      accessorKey: "receiptNumber",
      header: "Receipt Number",
      cell: ({ row }) => row.original.receiptNumber || "-",
    },
  ];

  return (
    <>
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">
                  <Home className="mr-1 h-4 w-4" />
                  Dashboard
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/members">Members</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#" isCurrentPage>
                {member.firstName} {member.lastName}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-2">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mr-3">
              <span className="text-primary font-medium text-xl">
                {member.firstName.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-primary">
                {member.firstName} {member.lastName}
              </h1>
              <div className="flex items-center">
                <p className="text-sm text-muted-foreground">
                  {tierInfo?.name || member.tierId} Member
                </p>
                {member.isArchived && (
                  <Badge variant="outline" className="ml-2 bg-gray-100">
                    Archived
                  </Badge>
                )}
                <Badge
                  className={`ml-2 ${
                    member.status === "active"
                      ? "bg-green-100 text-green-800"
                      : member.status === "expired"
                      ? "bg-red-100 text-red-800"
                      : member.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center"
              asChild
            >
              <Link href={`/members/${id}?edit=true`}>
                <i className="fas fa-edit mr-2"></i>
                Edit
              </Link>
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                {member.isArchived ? (
                  <Button variant="outline" size="sm" className="flex items-center">
                    <i className="fas fa-undo mr-2"></i>
                    Unarchive
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="flex items-center">
                    <i className="fas fa-archive mr-2"></i>
                    Archive
                  </Button>
                )}
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
                    onClick={member.isArchived ? handleUnarchive : handleArchive}
                    className={member.isArchived ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                  >
                    {member.isArchived ? "Unarchive" : "Archive"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button size="sm" className="flex items-center">
              <i className="fas fa-envelope mr-2"></i>
              Send Email
            </Button>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Membership Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Membership Type</dt>
                    <dd className="text-sm">{tierInfo?.name || member.tierId}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Annual Fee</dt>
                    <dd className="text-sm">${tierInfo?.price || "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Join Date</dt>
                    <dd className="text-sm">{format(new Date(member.joinDate), "MMMM d, yyyy")}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Renewal Date</dt>
                    <dd className="flex items-center">
                      <span className="text-sm">{format(new Date(member.renewalDate), "MMMM d, yyyy")}</span>
                      {daysUntilRenewal <= 30 && daysUntilRenewal > 0 ? (
                        <Badge className="ml-2 bg-red-100 text-red-800">
                          {daysUntilRenewal} days left
                        </Badge>
                      ) : daysUntilRenewal <= 0 ? (
                        <Badge className="ml-2 bg-red-100 text-red-800">
                          Expired
                        </Badge>
                      ) : null}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                    <dd className="text-sm">{member.status.charAt(0).toUpperCase() + member.status.slice(1)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                    <dd className="text-sm truncate">
                      <a href={`mailto:${member.email}`} className="text-primary hover:underline">
                        {member.email}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                    <dd className="text-sm">
                      {member.phone ? (
                        <a href={`tel:${member.phone}`} className="text-primary hover:underline">
                          {member.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Not provided</span>
                      )}
                    </dd>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                    <dd className="text-sm">
                      {member.address ? (
                        <div className="space-y-1">
                          <p>{member.address}</p>
                          <p>
                            {member.city && `${member.city}, `}
                            {member.state && `${member.state} `}
                            {member.zipCode}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not provided</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Membership Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 list-disc list-inside text-sm">
                  {tierInfo ? (
                    tierInfo.benefits ? 
                      JSON.parse(String(tierInfo.benefits)).map((benefit: string, index: number) => (
                        <li key={index}>{benefit}</li>
                      ))
                    : <li className="text-muted-foreground">No specific benefits listed for this tier</li>
                  ) : (
                    <li className="text-muted-foreground">Benefits information not available</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transaction History</CardTitle>
              <Button size="sm">
                <i className="fas fa-plus mr-2"></i>
                Add Transaction
              </Button>
            </CardHeader>
            <CardContent>
              {transactions && transactions.length > 0 ? (
                <DataTable
                  columns={transactionColumns}
                  data={transactions}
                  pagination={true}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <i className="fas fa-receipt text-xl text-gray-400"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions</h3>
                  <p className="text-muted-foreground mb-4">
                    This member doesn't have any recorded transactions yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notes" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Notes</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/members/${id}?edit=true`)}
              >
                <i className="fas fa-edit mr-2"></i>
                Edit Notes
              </Button>
            </CardHeader>
            <CardContent>
              {member.notes ? (
                <div className="prose max-w-none">
                  <p>{member.notes}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <i className="fas fa-sticky-note text-xl text-gray-400"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Notes</h3>
                  <p className="text-muted-foreground mb-4">
                    No notes have been added for this member yet.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/members/${id}?edit=true`)}
                  >
                    Add Notes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default MemberDetail;

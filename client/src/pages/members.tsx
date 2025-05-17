import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import MemberList from "@/components/members/member-list";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { AlertTriangle, Home } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

const Members: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleImportCSV = async (file: File) => {
    try {
      // Create form data to send file
      const formData = new FormData();
      formData.append("file", file);

      // Use fetch directly for form data
      const response = await fetch("/api/members/import/csv", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to import members");
      }

      const result = await response.json();
      
      toast({
        title: "Import Successful",
        description: `${result.created.length} members imported with ${result.errors.length} errors.`,
      });
      
      // Refresh member list
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
    } catch (error) {
      console.error("Error importing members:", error);
      toast({
        title: "Import Failed",
        description: "Could not import members from CSV. Please check the file format and try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await apiRequest("GET", "/api/members/export/csv");
      
      // Create a blob from the CSV data
      const blob = await response.blob();
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `herschell_members_${new Date().toISOString().split("T")[0]}.csv`;
      
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Members exported to CSV successfully.",
      });
    } catch (error) {
      console.error("Error exporting members:", error);
      toast({
        title: "Export Failed",
        description: "Could not export members to CSV. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <Breadcrumb className="mb-2">
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
                <BreadcrumbLink href="#" isCurrentPage>
                  Members
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-display font-bold text-primary">Members</h1>
          <p className="text-sm text-muted-foreground">
            Manage your museum membership records
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <i className="fas fa-file-upload mr-2"></i>
                Import CSV
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Import Members from CSV</AlertDialogTitle>
                <AlertDialogDescription>
                  Upload a CSV file to bulk import members. The file should have headers matching the member fields 
                  (First Name, Last Name, Email, etc.).
                  
                  <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        This will import all members in the CSV. Duplicates will be created if emails match 
                        existing members. Please review your data before importing.
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <input
                      type="file"
                      accept=".csv"
                      className="w-full"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImportCSV(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <i className="fas fa-file-download mr-2"></i>
            Export CSV
          </Button>
          
          <Link href="/members/new">
            <Button size="sm">
              <i className="fas fa-plus mr-2"></i>
              Add Member
            </Button>
          </Link>
        </div>
      </div>
      
      <MemberList />
    </>
  );
};

export default Members;

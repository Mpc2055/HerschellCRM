import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Define the tier interface
interface MembershipTier {
  id: string;
  name: string;
  description?: string;
  price: number;
  benefits: string;
}

// Define the form schema using zod
const tierFormSchema = z.object({
  id: z.string().min(1, { message: "ID is required" }),
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Price must be a valid number",
  }),
  benefits: z.string().min(1, { message: "At least one benefit is required" }),
});

type TierFormValues = z.infer<typeof tierFormSchema>;

const MembershipTiers: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<MembershipTier | null>(null);

  const { data: tiers = [], isLoading, error } = useQuery<MembershipTier[]>({
    queryKey: ["/api/membership-tiers"],
  });

  // Add debugging
  React.useEffect(() => {
    console.log("Tiers data:", tiers);
    console.log("Is loading:", isLoading);
    console.log("Error:", error);
  }, [tiers, isLoading, error]);

  const isManager = user?.role === "manager";

  // Add debugging for auth
  React.useEffect(() => {
    console.log("Auth user:", user);
    console.log("Is manager:", isManager);
  }, [user, isManager]);

  // Initialize form with react-hook-form
  const form = useForm<TierFormValues>({
    resolver: zodResolver(tierFormSchema),
    defaultValues: {
      id: "",
      name: "",
      description: "",
      price: "",
      benefits: "",
    },
  });

  // Reset the form when the dialog opens/closes
  React.useEffect(() => {
    if (isDialogOpen) {
      if (editingTier) {
        try {
          // Parse the benefits JSON string into a newline-separated string for editing
          const benefitsArray = JSON.parse(editingTier.benefits);
          const benefitsString = benefitsArray.join("\n");
          
          form.reset({
            id: editingTier.id,
            name: editingTier.name,
            description: editingTier.description || "",
            price: editingTier.price.toString(),
            benefits: benefitsString,
          });
        } catch (error) {
          // If benefits is not a valid JSON, use as is
          form.reset({
            id: editingTier.id,
            name: editingTier.name,
            description: editingTier.description || "",
            price: editingTier.price.toString(),
            benefits: editingTier.benefits,
          });
        }
      } else {
        form.reset({
          id: "",
          name: "",
          description: "",
          price: "",
          benefits: "",
        });
      }
    }
  }, [isDialogOpen, editingTier, form]);

  const handleCreateTier = async (data: TierFormValues) => {
    try {
      // Convert the benefits string to an array (split by newlines)
      const benefitsArray = data.benefits.split("\n").filter(benefit => benefit.trim() !== "");
      const formattedData = {
        ...data,
        benefits: JSON.stringify(benefitsArray),
      };

      console.log("Creating tier with data:", formattedData);
      await apiRequest("POST", "/api/membership-tiers", formattedData);
      
      toast({
        title: "Tier Created",
        description: "The membership tier has been created successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/membership-tiers"] });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error creating tier:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: `Failed to create membership tier: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleUpdateTier = async (data: TierFormValues) => {
    try {
      // Convert the benefits string to an array (split by newlines)
      const benefitsArray = data.benefits.split("\n").filter(benefit => benefit.trim() !== "");
      const formattedData = {
        ...data,
        benefits: JSON.stringify(benefitsArray),
      };

      console.log("Updating tier with data:", formattedData);
      await apiRequest("PUT", `/api/membership-tiers/${data.id}`, formattedData);
      
      toast({
        title: "Tier Updated",
        description: "The membership tier has been updated successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/membership-tiers"] });
      setIsDialogOpen(false);
      setEditingTier(null);
    } catch (error) {
      console.error("Error updating tier:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: `Failed to update membership tier: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTier = async (tierId: string) => {
    try {
      await apiRequest("DELETE", `/api/membership-tiers/${tierId}`, {});
      
      toast({
        title: "Tier Deleted",
        description: "The membership tier has been deleted successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/membership-tiers"] });
    } catch (error) {
      console.error("Error deleting tier:", error);
      toast({
        title: "Error",
        description: "Failed to delete membership tier. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: TierFormValues) => {
    if (editingTier) {
      handleUpdateTier(data);
    } else {
      handleCreateTier(data);
    }
  };

  const formatText = (text: any) => {
    // Make sure text is a string
    if (typeof text !== 'string') {
      return '';
    }
    // Ensure text ends with a period if it doesn't already have appropriate punctuation
    if (text && !text.endsWith('.') && !text.endsWith('!') && !text.endsWith('?')) {
      return text + '.';
    }
    return text;
  };

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
              <BreadcrumbLink className="cursor-default" aria-current="page">
                Membership Tiers
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-2">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Membership Tiers</h1>
            <p className="text-sm text-muted-foreground">
              Manage membership levels, pricing, and benefits.
            </p>
          </div>
          
          {isManager && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch("/api/membership-tiers");
                    const data = await response.json();
                    console.log("Direct API check:", data);
                    toast({
                      title: "API Check",
                      description: `Found ${data.length} tiers directly from API.`,
                    });
                  } catch (error) {
                    console.error("Direct API check failed:", error);
                    toast({
                      title: "API Check Failed",
                      description: error instanceof Error ? error.message : "Unknown error",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Check API
              </Button>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4 md:mt-0">
                    <i className="fas fa-plus mr-2"></i>
                    Add Tier
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>{editingTier ? "Edit Membership Tier" : "Create Membership Tier"}</DialogTitle>
                    <DialogDescription>
                      {editingTier
                        ? "Update the details for this membership tier."
                        : "Add a new membership tier with its benefits."}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g. family, senior, adult" 
                                {...field} 
                                disabled={!!editingTier}
                              />
                            </FormControl>
                            <FormDescription>
                              Unique identifier, use lowercase with no spaces (e.g. family, senior).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Family Membership" {...field} />
                            </FormControl>
                            <FormDescription>
                              Display name for the membership tier.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Short description of this membership tier" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Annual Price *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 60" {...field} />
                            </FormControl>
                            <FormDescription>
                              Enter the annual price in dollars (without the $ sign).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="benefits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Benefits *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List benefits, one per line. For example:&#10;Free admission for two adults.&#10;Two ride tokens per visit.&#10;10% gift-shop discount.&#10;Early event access.&#10;Quarterly newsletter." 
                                className="min-h-[120px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              List each benefit on a separate line. Add periods for proper punctuation.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingTier ? "Update Tier" : "Create Tier"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            // Parse the benefits from JSON
            let benefits: string[] = [];
            try {
              // First, ensure tier.benefits is not null or undefined
              if (tier.benefits) {
                benefits = JSON.parse(tier.benefits);
                // Ensure benefits is an array - if not, create an array
                if (!Array.isArray(benefits)) {
                  benefits = [String(benefits)];
                }
                // Ensure all items are strings and add punctuation
                benefits = benefits.map((benefit: any) => formatText(String(benefit)));
              } else {
                benefits = []; // Set default empty array if benefits is null/undefined
              }
            } catch (error) {
              // If parsing fails, assume it's a plain string and convert to array
              benefits = tier.benefits ? [formatText(String(tier.benefits))] : [];
            }
            
            return (
              <Card key={tier.id} className="overflow-hidden border">
                <CardHeader className="bg-primary/5">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{tier.name || 'Unnamed Tier'}</CardTitle>
                      <CardDescription>{formatText(tier.description || '')}</CardDescription>
                    </div>
                    <Badge className="bg-primary text-white">
                      ${parseFloat((tier.price || 0).toString()).toFixed(2)}/year
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <h4 className="text-sm font-semibold mb-2 text-foreground">Benefits:</h4>
                  {benefits.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                      {benefits.map((benefit: string, index: number) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No benefits specified.</p>
                  )}
                </CardContent>
                {isManager && (
                  <CardFooter className="border-t bg-muted/50 gap-2 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setEditingTier(tier);
                        setIsDialogOpen(true);
                      }}
                    >
                      <i className="fas fa-edit mr-2"></i>
                      Edit
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <i className="fas fa-trash-alt mr-2"></i>
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Membership Tier</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the {tier.name} tier? This action cannot be undone.
                            Any members with this tier will need to be reassigned.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteTier(tier.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
};

export default MembershipTiers;

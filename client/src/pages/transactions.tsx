import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TRANSACTION_TYPES, PAYMENT_METHODS } from "@/lib/constants";

// Define schema for the transaction form
const transactionFormSchema = z.object({
  memberId: z.string().min(1, { message: "Member is required" }),
  amount: z.string().min(1, { message: "Amount is required" }).refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: "Amount must be a positive number" }
  ),
  type: z.string().min(1, { message: "Transaction type is required" }),
  paymentMethod: z.string().min(1, { message: "Payment method is required" }),
  date: z.string().min(1, { message: "Date is required" }),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

const Transactions: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });
  
  const { data: members } = useQuery({
    queryKey: ["/api/members"],
  });

  // Form setup
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      memberId: "",
      amount: "",
      type: "",
      paymentMethod: "",
      date: new Date().toISOString().split("T")[0],
      receiptNumber: "",
      notes: "",
    },
  });

  // Define columns for the transactions table
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => format(new Date(row.original.date), "MMM d, yyyy"),
    },
    {
      accessorKey: "member",
      header: "Member",
      cell: ({ row }) => {
        // Find the member
        const member = members?.find((m: any) => m.id === row.original.memberId);
        
        return member ? (
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
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
        ) : (
          <span className="text-muted-foreground">Unknown Member</span>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge className={
          row.original.type === "new_membership" 
            ? "bg-blue-100 text-blue-800" 
            : row.original.type === "renewal" 
              ? "bg-green-100 text-green-800" 
              : "bg-purple-100 text-purple-800"
        }>
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
      header: "Receipt #",
      cell: ({ row }) => row.original.receiptNumber || "-",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/members/${row.original.memberId}`}>
              View Member
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  const handleCreateTransaction = async (data: TransactionFormValues) => {
    try {
      const transactionData = {
        ...data,
        memberId: parseInt(data.memberId),
        amount: data.amount,
      };

      await apiRequest("POST", "/api/transactions", transactionData);
      
      toast({
        title: "Transaction Created",
        description: "The transaction has been recorded successfully.",
      });
      
      // Refresh the transactions list
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast({
        title: "Error",
        description: "Failed to create transaction. Please try again.",
        variant: "destructive",
      });
    }
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
              <BreadcrumbLink href="#" isCurrentPage>
                Transactions
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-2">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Transactions</h1>
            <p className="text-sm text-muted-foreground">
              Manage membership payments and donations
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0">
                <i className="fas fa-plus mr-2"></i>
                Record Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Record Transaction</DialogTitle>
                <DialogDescription>
                  Enter the details of the transaction below
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateTransaction)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="memberId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Member *</FormLabel>
                        <Select
                          value={field.value.toString()}
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedMember(members?.find((m: any) => m.id.toString() === value) || null);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a member" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {members?.map((member: any) => (
                              <SelectItem key={member.id} value={member.id.toString()}>
                                {member.firstName} {member.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {selectedMember && (
                    <div className="p-3 bg-muted rounded-md">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                          <span className="text-primary font-medium">
                            {selectedMember.firstName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">
                            {selectedMember.firstName} {selectedMember.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {selectedMember.email} | {selectedMember.tierId.replace("_", " ").charAt(0).toUpperCase() + selectedMember.tierId.replace("_", " ").slice(1)} Member
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transaction Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TRANSACTION_TYPES.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount *</FormLabel>
                          <FormControl>
                            <Input placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PAYMENT_METHODS.map((method) => (
                                <SelectItem key={method.id} value={method.id}>
                                  {method.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="receiptNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receipt Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional receipt number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Additional notes about this transaction" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Create Transaction
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card>
        <CardHeader className="border-b border-gray-200">
          <div className="flex justify-between items-center">
            <CardTitle>Transaction History</CardTitle>
            <div className="w-64">
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : transactions?.length > 0 ? (
            <DataTable
              columns={columns}
              data={transactions}
              searchColumn="amount"
              pagination={true}
            />
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <i className="fas fa-receipt text-xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground mb-4">
                There are no transactions recorded in the system yet.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                Record First Transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default Transactions;

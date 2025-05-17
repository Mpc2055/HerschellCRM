import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays } from "date-fns";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface RenewalsDueWidgetProps {
  limit?: number;
}

export const RenewalsDueWidget: React.FC<RenewalsDueWidgetProps> = ({ limit = 5 }) => {
  const [dayRange, setDayRange] = React.useState<string>("30");

  const { data: renewals, isLoading } = useQuery({
    queryKey: [`/api/members/renewals/due?days=${dayRange}`],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Membership Renewals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedRenewals = renewals?.slice(0, limit).map((renewal: any) => {
    const daysLeft = differenceInDays(new Date(renewal.renewalDate), new Date());
    return {
      ...renewal,
      daysLeft,
    };
  });

  const getStatusBadge = (daysLeft: number) => {
    if (daysLeft <= 7) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>;
    } else if (daysLeft <= 14) {
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Urgent</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Due Soon</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">Upcoming Membership Renewals</CardTitle>
          <div>
            <Select value={dayRange} onValueChange={setDayRange}>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Next 30 Days</SelectItem>
                <SelectItem value="60">Next 60 Days</SelectItem>
                <SelectItem value="90">Next 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 py-3">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Member</TableHead>
                <TableHead className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Membership</TableHead>
                <TableHead className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Expiry Date</TableHead>
                <TableHead className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formattedRenewals?.length ? (
                formattedRenewals.map((renewal: any) => (
                  <TableRow key={renewal.id} className="hover:bg-gray-50">
                    <TableCell className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-medium">
                              {renewal.firstName[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{renewal.firstName} {renewal.lastName}</div>
                          <div className="text-xs text-muted-foreground">{renewal.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{renewal.tierId.replace("_", " ").charAt(0).toUpperCase() + renewal.tierId.replace("_", " ").slice(1)}</div>
                    </TableCell>
                    <TableCell className="px-3 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{format(new Date(renewal.renewalDate), 'MMM dd, yyyy')}</div>
                      <div className="text-xs text-red-500">{renewal.daysLeft} days left</div>
                    </TableCell>
                    <TableCell className="px-3 py-3 whitespace-nowrap">
                      {getStatusBadge(renewal.daysLeft)}
                    </TableCell>
                    <TableCell className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/members/${renewal.id}`} className="text-primary hover:text-primary/80">
                        Send Renewal
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No upcoming renewals found in the next {dayRange} days.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {formattedRenewals?.length > 0 && (
        <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{formattedRenewals.length}</span> of <span className="font-medium">{renewals?.length || 0}</span> renewals
            </div>
            <Link href="/members?renewalDue=true">
              <Button variant="link" className="text-sm font-medium text-primary hover:text-primary/80">
                View all renewals <i className="fas fa-arrow-right ml-1"></i>
              </Button>
            </Link>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default RenewalsDueWidget;

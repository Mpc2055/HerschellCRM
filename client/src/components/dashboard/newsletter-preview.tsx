import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Campaign {
  id: number;
  title: string;
  subject: string;
  status: string;
  audience: string;
  sentAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  opens: number;
  clicks: number;
}

export const NewsletterPreview: React.FC = () => {
  const { data: recentCampaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/dashboard/recent-campaigns", { limit: 1 }],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest Newsletter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-start space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="lg:w-1/2">
              <Skeleton className="w-full h-40 rounded-lg" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex space-x-4 mt-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <Skeleton className="w-full h-40 rounded-lg" />
              <div className="mt-4 space-y-3">
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if we have a latest newsletter
  const latestNewsletter = recentCampaigns.length > 0 ? recentCampaigns[0] : null;

  if (!latestNewsletter) {
    return (
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-foreground">Latest Newsletter</CardTitle>
            <Link href="/newsletter/compose">
              <Button size="sm" variant="outline">Create New</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <i className="fas fa-envelope-open-text text-xl text-muted-foreground"></i>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No newsletters yet</h3>
            <p className="text-muted-foreground mb-4">Create your first newsletter to engage with your members</p>
            <Link href="/newsletter/compose">
              <Button>Create Newsletter</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate metrics percentages
  const openRate = latestNewsletter.opens > 0 
    ? Math.round((latestNewsletter.opens / (JSON.parse(latestNewsletter.audience as string).count || 1)) * 100) 
    : 0;
  
  const clickRate = latestNewsletter.clicks > 0 
    ? Math.round((latestNewsletter.clicks / (JSON.parse(latestNewsletter.audience as string).count || 1)) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-foreground">Latest Newsletter</CardTitle>
          <Link href="/newsletter/compose">
            <Button size="sm" variant="outline">Create New</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row items-start space-y-4 lg:space-y-0 lg:space-x-6">
          <div className="lg:w-1/2">
            <div className="rounded-lg overflow-hidden bg-muted h-40 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" className="w-16 h-16 text-muted-foreground">
                <path fill="currentColor" d="M544 160v192c0 17.67-14.33 32-32 32h-32v64h-64v-64H224v64h-64v-64h-32c-17.67 0-32-14.33-32-32V160c0-17.67 14.33-32 32-32h384c17.67 0 32 14.33 32 32zm-152 0h-48c-8.84 0-16 7.16-16 16v80c0 8.84 7.16 16 16 16h48c8.84 0 16-7.16 16-16v-80c0-8.84-7.16-16-16-16zM96 224c-17.67 0-32 14.33-32 32s14.33 32 32 32 32-14.33 32-32-14.33-32-32-32zm-96 32c0 53.02 42.98 96 96 96s96-42.98 96-96-42.98-96-96-96-96 42.98-96 96zm544-128v192c0 17.67-14.33 32-32 32H416c0 44.18-35.82 80-80 80s-80-35.82-80-80H32c-17.67 0-32-14.33-32-32V128c0-17.67 14.33-32 32-32h192c0-44.18 35.82-80 80-80s80 35.82 80 80h128c17.67 0 32 14.33 32 32z"/>
              </svg>
            </div>
            <div className="mt-4">
              <h4 className="font-display text-xl text-primary">{latestNewsletter.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {latestNewsletter.sentAt 
                  ? `Sent on ${format(new Date(latestNewsletter.sentAt), 'MMMM d, yyyy')}`
                  : latestNewsletter.scheduledFor 
                    ? `Scheduled for ${format(new Date(latestNewsletter.scheduledFor), 'MMMM d, yyyy')}`
                    : `Created on ${format(new Date(latestNewsletter.createdAt), 'MMMM d, yyyy')}`
                }
              </p>
              <div className="mt-2 flex items-center space-x-4">
                <div className="flex items-center">
                  <i className="fas fa-envelope-open text-muted-foreground mr-1"></i>
                  <span className="text-sm text-muted-foreground">{openRate}% opens</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-mouse-pointer text-muted-foreground mr-1"></i>
                  <span className="text-sm text-muted-foreground">{clickRate}% clicks</span>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2">
            <div className="bg-muted rounded-lg p-4 border border-border">
              <h5 className="font-medium text-foreground">Newsletter Summary</h5>
              <p className="text-sm text-muted-foreground mt-2">
                {latestNewsletter.subject}
              </p>
              
              {/* Audience information */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <span className="text-xs font-medium text-foreground">
                    {latestNewsletter.status.charAt(0).toUpperCase() + latestNewsletter.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Recipients</span>
                  <span className="text-xs font-medium text-foreground">
                    {(JSON.parse(latestNewsletter.audience as string).count || 'N/A')}
                  </span>
                </div>
                {latestNewsletter.sentAt && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Opened</span>
                      <span className="text-xs font-medium text-foreground">
                        {latestNewsletter.opens} ({openRate}%)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Clicked</span>
                      <span className="text-xs font-medium text-foreground">
                        {latestNewsletter.clicks} ({clickRate}%)
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <Link href={`/newsletter/compose/${latestNewsletter.id}`}>
                <Button variant="outline" size="sm">
                  <i className="fas fa-eye mr-2"></i>
                  View
                </Button>
              </Link>
              <Link href={`/newsletter/compose/${latestNewsletter.id}`}>
                <Button variant="outline" size="sm">
                  <i className="fas fa-clone mr-2"></i>
                  Duplicate
                </Button>
              </Link>
              <Link href={`/newsletter/campaigns/${latestNewsletter.id}`}>
                <Button variant="outline" size="sm">
                  <i className="fas fa-chart-bar mr-2"></i>
                  Analytics
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewsletterPreview;

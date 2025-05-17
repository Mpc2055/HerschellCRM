import React from "react";
import { Link } from "wouter";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const Newsletter: React.FC = () => {
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
                Newsletter
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-2">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Newsletter</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage email campaigns for your members
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center">
              <i className="fas fa-pen-fancy text-primary mr-2"></i>
              Create Newsletter
            </CardTitle>
            <CardDescription>
              Compose a new newsletter to share with your members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center py-4">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <i className="fas fa-envelope-open-text text-3xl text-primary"></i>
              </div>
            </div>
            <p className="text-sm text-center">
              Design personalized newsletters with rich content, merge tags, and beautiful layouts.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link href="/newsletter/compose">
                Start Composing
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center">
              <i className="fas fa-chart-line text-primary mr-2"></i>
              Campaign Reports
            </CardTitle>
            <CardDescription>
              View performance metrics for your campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center py-4">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <i className="fas fa-chart-pie text-3xl text-primary"></i>
              </div>
            </div>
            <p className="text-sm text-center">
              Track open rates, clicks, and engagement to optimize your communication strategy.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/newsletter/campaigns">
                View Campaigns
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center">
              <i className="fas fa-users text-primary mr-2"></i>
              Audience Management
            </CardTitle>
            <CardDescription>
              Segment and target specific member groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center py-4">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <i className="fas fa-user-tag text-3xl text-primary"></i>
              </div>
            </div>
            <p className="text-sm text-center">
              Create targeted communications by segmenting your audience by membership tier, join date, or tags.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/newsletter/compose">
                Create Segment
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Newsletter Best Practices</CardTitle>
            <CardDescription>
              Tips to maximize engagement with your museum members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-medium flex items-center">
                  <i className="fas fa-clock text-primary mr-2"></i>
                  Timing Matters
                </h3>
                <p className="text-sm text-muted-foreground">
                  Send newsletters on Tuesday, Wednesday, or Thursday mornings for optimal open rates. Avoid weekends and holidays when engagement is typically lower.
                </p>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-medium flex items-center">
                  <i className="fas fa-heading text-primary mr-2"></i>
                  Compelling Subject Lines
                </h3>
                <p className="text-sm text-muted-foreground">
                  Keep subject lines under 50 characters and create a sense of urgency or curiosity. Personalize with member's name when possible.
                </p>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-medium flex items-center">
                  <i className="fas fa-image text-primary mr-2"></i>
                  Visual Content
                </h3>
                <p className="text-sm text-muted-foreground">
                  Include high-quality images of your exhibits and carrousels. Use consistent branding and colors that match your museum's aesthetic.
                </p>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-medium flex items-center">
                  <i className="fas fa-mobile-alt text-primary mr-2"></i>
                  Mobile Optimization
                </h3>
                <p className="text-sm text-muted-foreground">
                  Over 60% of emails are opened on mobile devices. Test your newsletters on different screen sizes before sending.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Newsletter;

import React from "react";
import { Link } from "wouter";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import CampaignList from "@/components/newsletter/campaign-list";

const NewsletterCampaigns: React.FC = () => {
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
                <Link href="/newsletter">Newsletter</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#" isCurrentPage>
                Campaigns
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-2">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Newsletter Campaigns</h1>
            <p className="text-sm text-muted-foreground">
              Manage, track, and analyze your email newsletters
            </p>
          </div>
          
          <Button className="mt-4 md:mt-0" asChild>
            <Link href="/newsletter/compose">
              <i className="fas fa-plus mr-2"></i>
              Create Campaign
            </Link>
          </Button>
        </div>
      </div>
      
      <CampaignList />
    </>
  );
};

export default NewsletterCampaigns;

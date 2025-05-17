import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import NewsletterForm from "@/components/newsletter/newsletter-form";

interface NewsletterComposeProps {
  id?: string;
}

const NewsletterCompose: React.FC<NewsletterComposeProps> = ({ id }) => {
  const [, navigate] = useLocation();
  const isEditing = !!id;
  
  // Fetch campaign data if editing existing campaign
  const { data: campaign, isLoading, isError } = useQuery({
    queryKey: [`/api/newsletter/campaigns/${id}`],
    enabled: isEditing,
  });

  // Redirect to campaigns page if campaign not found
  useEffect(() => {
    if (isEditing && !isLoading && (isError || !campaign)) {
      navigate("/newsletter/campaigns");
    }
  }, [isEditing, isLoading, isError, campaign, navigate]);

  if (isEditing && isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
                {isEditing ? `Edit Campaign: ${campaign?.title}` : "Create Campaign"}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <h1 className="text-2xl font-display font-bold text-primary mt-2">
          {isEditing ? `Edit Newsletter Campaign` : "Create Newsletter Campaign"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEditing 
            ? "Make changes to your newsletter content and settings"
            : "Design and send a beautiful newsletter to your members"}
        </p>
      </div>
      
      <NewsletterForm 
        campaign={campaign} 
        isEditing={isEditing} 
      />
    </>
  );
};

export default NewsletterCompose;

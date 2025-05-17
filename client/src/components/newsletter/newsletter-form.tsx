import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { NEWSLETTER_MERGE_TAGS, NEWSLETTER_TEMPLATE } from "@/lib/constants";
import AudienceSegmentation from "./audience-segmentation";
import EmailTemplate from "./email-template";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";

// Define the form schema using zod
const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  subject: z.string().min(1, { message: "Subject line is required" }),
  content: z.string().min(1, { message: "Email content is required" }),
  audience: z.any(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewsletterFormProps {
  campaign?: any;
  isEditing?: boolean;
}

const NewsletterForm: React.FC<NewsletterFormProps> = ({ campaign, isEditing = false }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState("content");
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  
  // Default values for the form
  const defaultValues: Partial<FormValues> = {
    title: campaign?.title || "",
    subject: campaign?.subject || "",
    content: campaign?.content || NEWSLETTER_TEMPLATE,
    audience: campaign?.audience ? JSON.parse(campaign.audience) : { tiers: [], tags: [], joinDateRange: null },
  };

  // Initialize form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const watchedContent = form.watch("content");

  // Handlers for saving, scheduling, and sending
  const handleSaveDraft = async (data: FormValues) => {
    try {
      const payload = {
        ...data,
        status: "draft",
        audience: JSON.stringify(data.audience),
        senderId: user?.id
      };

      if (isEditing && campaign) {
        // Update existing campaign
        await apiRequest("PUT", `/api/newsletter/campaigns/${campaign.id}`, payload);
        queryClient.invalidateQueries({ queryKey: [`/api/newsletter/campaigns/${campaign.id}`] });
        toast({
          title: "Draft saved",
          description: "Your newsletter draft has been updated successfully.",
        });
      } else {
        // Create new campaign
        const response = await apiRequest("POST", "/api/newsletter/campaigns", payload);
        const newCampaign = await response.json();
        toast({
          title: "Draft created",
          description: "Your newsletter draft has been saved successfully.",
        });
        navigate(`/newsletter/compose/${newCampaign.id}`);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter/campaigns"] });
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Error",
        description: "Failed to save the newsletter draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSchedule = async (data: FormValues) => {
    try {
      if (!scheduledDate || !scheduledTime) {
        toast({
          title: "Missing information",
          description: "Please select both a date and time for scheduling.",
          variant: "destructive",
        });
        return;
      }

      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (scheduledDateTime <= new Date()) {
        toast({
          title: "Invalid date",
          description: "Scheduled time must be in the future.",
          variant: "destructive",
        });
        return;
      }

      // First save the campaign if it's new
      let campaignId = campaign?.id;
      if (!isEditing || !campaignId) {
        const payload = {
          ...data,
          status: "draft",
          audience: JSON.stringify(data.audience),
          senderId: user?.id
        };
        const response = await apiRequest("POST", "/api/newsletter/campaigns", payload);
        const newCampaign = await response.json();
        campaignId = newCampaign.id;
      }

      // Then schedule it
      await apiRequest("POST", "/api/newsletter/schedule", {
        campaignId,
        scheduledTime: scheduledDateTime.toISOString()
      });

      toast({
        title: "Newsletter scheduled",
        description: `Your newsletter has been scheduled for ${scheduledDateTime.toLocaleString()}.`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/newsletter/campaigns"] });
      queryClient.invalidateQueries({ queryKey: [`/api/newsletter/campaigns/${campaignId}`] });
      setShowScheduleDialog(false);
      navigate("/newsletter/campaigns");
    } catch (error) {
      console.error("Error scheduling newsletter:", error);
      toast({
        title: "Error",
        description: "Failed to schedule the newsletter. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendNow = async (data: FormValues) => {
    try {
      // First save/update the campaign
      let campaignId = campaign?.id;
      if (!isEditing || !campaignId) {
        const payload = {
          ...data,
          status: "draft",
          audience: JSON.stringify(data.audience),
          senderId: user?.id
        };
        const response = await apiRequest("POST", "/api/newsletter/campaigns", payload);
        const newCampaign = await response.json();
        campaignId = newCampaign.id;
      } else {
        const payload = {
          ...data,
          audience: JSON.stringify(data.audience),
        };
        await apiRequest("PUT", `/api/newsletter/campaigns/${campaignId}`, payload);
      }

      // Then send it
      await apiRequest("POST", "/api/newsletter/send", {
        campaignId
      });

      toast({
        title: "Newsletter sent",
        description: "Your newsletter has been sent to the selected audience.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/newsletter/campaigns"] });
      navigate("/newsletter/campaigns");
    } catch (error) {
      console.error("Error sending newsletter:", error);
      toast({
        title: "Error",
        description: "Failed to send the newsletter. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendTest = async () => {
    try {
      if (!campaign?.id) {
        toast({
          title: "Save required",
          description: "You need to save the draft first before sending a test.",
          variant: "destructive",
        });
        return;
      }

      await apiRequest("POST", "/api/newsletter/send-test", {
        campaignId: campaign.id
      });

      toast({
        title: "Test email sent",
        description: `A test email has been sent to ${user?.email}.`,
      });
    } catch (error) {
      console.error("Error sending test email:", error);
      toast({
        title: "Error",
        description: "Failed to send the test email. Please try again.",
        variant: "destructive",
      });
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSaveDraft)} className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    placeholder="Newsletter title (internal only)"
                    className="text-lg font-medium"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex space-x-2">
            <Button variant="outline" type="button" disabled={form.formState.isSubmitting} onClick={handleSendTest}>
              Send Test
            </Button>
            <Button variant="outline" type="submit" disabled={form.formState.isSubmitting}>
              Save Draft
            </Button>
            <AlertDialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" type="button" disabled={form.formState.isSubmitting}>
                  Schedule
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Schedule Newsletter</AlertDialogTitle>
                  <AlertDialogDescription>
                    Choose when you want this newsletter to be sent.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="scheduleDate" className="text-sm font-medium">
                        Date
                      </label>
                      <Input
                        id="scheduleDate"
                        type="date"
                        min={today}
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="scheduleTime" className="text-sm font-medium">
                        Time
                      </label>
                      <Input
                        id="scheduleTime"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      form.getValues();
                      handleSchedule(form.getValues());
                    }}
                  >
                    Schedule
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button 
              type="button" 
              disabled={form.formState.isSubmitting}
              onClick={() => {
                form.getValues();
                handleSendNow(form.getValues());
              }}
            >
              Send Now
            </Button>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Email Subject Line</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter a compelling subject line" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Content</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          content={field.value}
                          onChange={field.onChange}
                          mergeTags={NEWSLETTER_MERGE_TAGS}
                          placeholder="Compose your newsletter here..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="audience" className="mt-4">
            <FormField
              control={form.control}
              name="audience"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <AudienceSegmentation 
                      value={field.value} 
                      onChange={field.onChange} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="preview" className="mt-4">
            <EmailTemplate 
              subject={form.watch("subject")} 
              content={watchedContent} 
            />
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
};

export default NewsletterForm;

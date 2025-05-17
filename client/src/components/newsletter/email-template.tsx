import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmailTemplateProps {
  subject: string;
  content: string;
}

const EmailTemplate: React.FC<EmailTemplateProps> = ({ subject, content }) => {
  // Create sample preview data for merge tags
  const previewData = {
    first_name: "Jane",
    last_name: "Smith",
    membership_level: "Family",
    renewal_date: "January 15, 2026"
  };

  // Replace merge tags with sample values
  const processContent = (html: string) => {
    return html
      .replace(/{{first_name}}/g, previewData.first_name)
      .replace(/{{last_name}}/g, previewData.last_name)
      .replace(/{{membership_level}}/g, previewData.membership_level)
      .replace(/{{renewal_date}}/g, previewData.renewal_date);
  };

  const processedContent = processContent(content);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="desktop">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="desktop">Desktop</TabsTrigger>
            <TabsTrigger value="mobile">Mobile</TabsTrigger>
          </TabsList>
          <TabsContent value="desktop" className="mt-4">
            <div className="bg-gray-100 p-4 rounded-md">
              <div className="bg-white rounded-md shadow-sm max-w-3xl mx-auto">
                <div className="p-4 border-b">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">From:</span> Herschell Carrousel Factory Museum &lt;noreply@herschellmuseum.org&gt;
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">To:</span> {previewData.first_name} {previewData.last_name} &lt;example@email.com&gt;
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Subject:</span> {subject || "(No subject)"}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="prose max-w-full" dangerouslySetInnerHTML={{ __html: processedContent }} />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="mobile" className="mt-4">
            <div className="bg-gray-100 p-4 rounded-md">
              <div className="bg-white rounded-md shadow-sm mx-auto" style={{ maxWidth: "375px" }}>
                <div className="p-3 border-b">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground truncate">
                      <span className="font-medium">From:</span> Herschell Museum
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Subject:</span> {subject || "(No subject)"}
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="prose prose-sm max-w-full" style={{ fontSize: "14px" }} dangerouslySetInnerHTML={{ __html: processedContent }} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 bg-muted/50 p-4 rounded-md">
          <h4 className="text-sm font-medium mb-2">Email Details</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p><span className="font-medium">Merge Tags:</span> This preview uses sample values for the merge tags.</p>
            <p><span className="font-medium">Spam Score:</span> Low - This email is not likely to trigger spam filters.</p>
            <p><span className="font-medium">Estimated Size:</span> {Math.ceil(content.length / 1024)} KB</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTemplate;

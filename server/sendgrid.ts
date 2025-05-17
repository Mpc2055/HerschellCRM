import { MailService } from '@sendgrid/mail';
import { Member } from '@shared/schema';
import { storage } from './storage';

// Validate if the SendGrid API key is properly set
if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable is not set");
} else if (!process.env.SENDGRID_API_KEY.startsWith('SG.')) {
  console.warn("API key does not start with \"SG.\".");
}

const mailService = new MailService();
// Initialize with the environment API key (if available)
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string | string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

/**
 * Sends an email using SendGrid
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("SendGrid API key not configured. Please set the SENDGRID_API_KEY environment variable.");
    }
    
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
      templateId: params.templateId,
      dynamicTemplateData: params.dynamicTemplateData
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

/**
 * Process template with merge tags
 * Replaces merge tags like {{first_name}} with actual member data
 */
export function processTemplate(template: string, member: Member): string {
  return template
    .replace(/{{first_name}}/g, member.firstName || '')
    .replace(/{{last_name}}/g, member.lastName || '')
    .replace(/{{full_name}}/g, `${member.firstName || ''} ${member.lastName || ''}`.trim())
    .replace(/{{email}}/g, member.email || '')
    .replace(/{{membership_level}}/g, member.tierId || '')
    .replace(/{{renewal_date}}/g, member.renewalDate ? new Date(member.renewalDate).toLocaleDateString() : '')
    .replace(/{{join_date}}/g, member.joinDate ? new Date(member.joinDate).toLocaleDateString() : '');
}

/**
 * Sends a newsletter campaign to multiple recipients
 */
export async function sendNewsletterCampaign(
  campaignId: number,
  senderEmail: string,
  senderName: string,
  subject: string,
  content: string,
  testMode: boolean = false
): Promise<{success: boolean, sent: number, failed: number}> {
  try {
    // Get the campaign to determine audience
    const campaign = await storage.getNewsletterCampaign(campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    
    // Parse audience JSON
    let audienceFilters = {};
    try {
      audienceFilters = campaign.audience ? JSON.parse(campaign.audience) : {};
    } catch (e) {
      console.error("Error parsing audience JSON:", e);
    }
    
    // Get members based on audience filters
    const members = await storage.getMembers(audienceFilters);
    
    if (members.length === 0) {
      return { success: false, sent: 0, failed: 0 };
    }
    
    // If in test mode, only send to the first member
    const recipients = testMode ? members.slice(0, 1) : members;
    let sentCount = 0;
    let failedCount = 0;
    
    // Send to each recipient with personalized content
    for (const member of recipients) {
      const personalizedContent = processTemplate(content, member);
      const personalizedSubject = processTemplate(subject, member);
      
      const success = await sendEmail({
        to: member.email,
        from: {
          email: senderEmail,
          name: senderName
        },
        subject: personalizedSubject,
        html: personalizedContent
      });
      
      if (success) {
        sentCount++;
      } else {
        failedCount++;
      }
    }
    
    // Update campaign metrics in the database
    if (!testMode) {
      await storage.updateNewsletterCampaign(campaignId, {
        status: 'sent',
        sentAt: new Date()
      });
    }
    
    return {
      success: sentCount > 0,
      sent: sentCount,
      failed: failedCount
    };
  } catch (error) {
    console.error("Error sending newsletter campaign:", error);
    return { success: false, sent: 0, failed: 0 };
  }
}

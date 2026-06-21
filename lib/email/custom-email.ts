/**
 * Custom Email Manager
 * Manages custom email sending with custom FROM addresses and templates
 */

export interface EmailTemplate {
  templateId: string;
  name: string;
  subject: string;
  htmlContent: string;
  plainTextContent: string;
  variables: string[]; // e.g., {{userName}}, {{activationLink}}
  category: 'newsletter' | 'notification' | 'alert' | 'marketing' | 'transactional';
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomEmailSender {
  senderId: string;
  email: string;
  displayName: string;
  status: 'pending' | 'verified' | 'failed';
  verificationToken?: string;
  verificationDate?: Date;
  createdAt: Date;
}

export interface ScheduledEmail {
  scheduleId: string;
  templateId: string;
  senderId: string;
  recipientEmail: string;
  subject: string;
  variables: Record<string, string>;
  scheduledFor: Date;
  status: 'scheduled' | 'sent' | 'failed';
  sentDate?: Date;
  failureReason?: string;
  createdAt: Date;
}

export class CustomEmailManager {
  private emailTemplates: Map<string, EmailTemplate> = new Map();
  private customSenders: Map<string, CustomEmailSender> = new Map();
  private scheduledEmails: Map<string, ScheduledEmail> = new Map();

  /**
   * Create email template
   */
  createEmailTemplate(
    name: string,
    subject: string,
    htmlContent: string,
    plainTextContent: string,
    category: 'newsletter' | 'notification' | 'alert' | 'marketing' | 'transactional' = 'transactional'
  ): EmailTemplate {
    const templateId = `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Extract variables from template
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(htmlContent)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    const template: EmailTemplate = {
      templateId,
      name,
      subject,
      htmlContent,
      plainTextContent,
      variables,
      category,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.emailTemplates.set(templateId, template);
    return template;
  }

  /**
   * Get email template
   */
  getEmailTemplate(templateId: string): EmailTemplate | null {
    return this.emailTemplates.get(templateId) || null;
  }

  /**
   * Get all templates
   */
  getAllTemplates(): EmailTemplate[] {
    return Array.from(this.emailTemplates.values());
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): EmailTemplate[] {
    return Array.from(this.emailTemplates.values()).filter((t) => t.category === category);
  }

  /**
   * Update email template
   */
  updateEmailTemplate(
    templateId: string,
    updates: Partial<EmailTemplate>
  ): EmailTemplate {
    const template = this.getEmailTemplate(templateId);
    if (!template) throw new Error('Template not found');

    const updated = { ...template, ...updates, updatedAt: new Date() };
    this.emailTemplates.set(templateId, updated);
    return updated;
  }

  /**
   * Delete email template
   */
  deleteEmailTemplate(templateId: string): void {
    this.emailTemplates.delete(templateId);
  }

  /**
   * Register custom sender email
   */
  registerCustomSender(email: string, displayName: string): CustomEmailSender {
    const senderId = `sender-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const verificationToken = this.generateVerificationToken();

    const sender: CustomEmailSender = {
      senderId,
      email,
      displayName,
      status: 'pending',
      verificationToken,
      createdAt: new Date(),
    };

    this.customSenders.set(senderId, sender);
    return sender;
  }

  /**
   * Get custom sender
   */
  getCustomSender(senderId: string): CustomEmailSender | null {
    return this.customSenders.get(senderId) || null;
  }

  /**
   * Get all custom senders
   */
  getAllCustomSenders(): CustomEmailSender[] {
    return Array.from(this.customSenders.values());
  }

  /**
   * Get verified custom senders
   */
  getVerifiedCustomSenders(): CustomEmailSender[] {
    return Array.from(this.customSenders.values()).filter((s) => s.status === 'verified');
  }

  /**
   * Verify custom sender
   */
  verifyCustomSender(senderId: string): CustomEmailSender {
    const sender = this.getCustomSender(senderId);
    if (!sender) throw new Error('Sender not found');

    sender.status = 'verified';
    sender.verificationDate = new Date();
    delete sender.verificationToken;

    this.customSenders.set(senderId, sender);
    return sender;
  }

  /**
   * Remove custom sender
   */
  removeCustomSender(senderId: string): void {
    this.customSenders.delete(senderId);
  }

  /**
   * Render template with variables
   */
  renderTemplate(templateId: string, variables: Record<string, string>): {
    subject: string;
    html: string;
    plainText: string;
  } {
    const template = this.getEmailTemplate(templateId);
    if (!template) throw new Error('Template not found');

    let subject = template.subject;
    let html = template.htmlContent;
    let plainText = template.plainTextContent;

    // Replace all variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      subject = subject.replace(regex, value);
      html = html.replace(regex, value);
      plainText = plainText.replace(regex, value);
    }

    return { subject, html, plainText };
  }

  /**
   * Schedule email
   */
  scheduleEmail(
    templateId: string,
    senderId: string,
    recipientEmail: string,
    variables: Record<string, string>,
    scheduledFor: Date
  ): ScheduledEmail {
    const template = this.getEmailTemplate(templateId);
    if (!template) throw new Error('Template not found');

    const sender = this.getCustomSender(senderId);
    if (!sender || sender.status !== 'verified') {
      throw new Error('Sender not verified');
    }

    const scheduleId = `sched-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const rendered = this.renderTemplate(templateId, variables);

    const scheduled: ScheduledEmail = {
      scheduleId,
      templateId,
      senderId,
      recipientEmail,
      subject: rendered.subject,
      variables,
      scheduledFor,
      status: 'scheduled',
      createdAt: new Date(),
    };

    this.scheduledEmails.set(scheduleId, scheduled);
    return scheduled;
  }

  /**
   * Get scheduled email
   */
  getScheduledEmail(scheduleId: string): ScheduledEmail | null {
    return this.scheduledEmails.get(scheduleId) || null;
  }

  /**
   * Get pending scheduled emails
   */
  getPendingScheduledEmails(): ScheduledEmail[] {
    const now = new Date();
    return Array.from(this.scheduledEmails.values()).filter(
      (s) => s.status === 'scheduled' && s.scheduledFor <= now
    );
  }

  /**
   * Mark email as sent
   */
  markEmailAsSent(scheduleId: string): ScheduledEmail {
    const email = this.getScheduledEmail(scheduleId);
    if (!email) throw new Error('Scheduled email not found');

    email.status = 'sent';
    email.sentDate = new Date();

    this.scheduledEmails.set(scheduleId, email);
    return email;
  }

  /**
   * Mark email as failed
   */
  markEmailAsFailed(scheduleId: string, failureReason: string): ScheduledEmail {
    const email = this.getScheduledEmail(scheduleId);
    if (!email) throw new Error('Scheduled email not found');

    email.status = 'failed';
    email.failureReason = failureReason;

    this.scheduledEmails.set(scheduleId, email);
    return email;
  }

  /**
   * Get email statistics
   */
  getEmailStatistics(): {
    totalSent: number;
    totalFailed: number;
    totalScheduled: number;
    successRate: number;
    averageDeliveryTime: number;
  } {
    const emails = Array.from(this.scheduledEmails.values());

    const sent = emails.filter((e) => e.status === 'sent').length;
    const failed = emails.filter((e) => e.status === 'failed').length;
    const scheduled = emails.filter((e) => e.status === 'scheduled').length;

    const total = sent + failed;
    const successRate = total > 0 ? (sent / total) * 100 : 0;

    // Calculate average delivery time
    let totalDeliveryTime = 0;
    let deliveryCount = 0;

    emails.forEach((e) => {
      if (e.status === 'sent' && e.sentDate) {
        const deliveryTime = e.sentDate.getTime() - e.createdAt.getTime();
        totalDeliveryTime += deliveryTime;
        deliveryCount++;
      }
    });

    const averageDeliveryTime = deliveryCount > 0 ? totalDeliveryTime / deliveryCount : 0;

    return {
      totalSent: sent,
      totalFailed: failed,
      totalScheduled: scheduled,
      successRate: parseFloat(successRate.toFixed(2)),
      averageDeliveryTime: Math.floor(averageDeliveryTime / 1000), // Convert to seconds
    };
  }

  /**
   * Generate verification token
   */
  private generateVerificationToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Create default email templates
   */
  initializeDefaultTemplates(): void {
    // Welcome email
    this.createEmailTemplate(
      'Welcome Email',
      'Welcome to {{companyName}}!',
      `<h1>Welcome {{userName}}!</h1>
       <p>Thank you for joining {{companyName}}.</p>
       <p><a href="{{activationLink}}">Activate your account</a></p>`,
      'Welcome {{userName}}!\n\nThank you for joining {{companyName}}.\n\n{{activationLink}}',
      'transactional'
    );

    // Newsletter
    this.createEmailTemplate(
      'Newsletter',
      'BlockStop Weekly News - {{date}}',
      `<h2>This Week's Highlights</h2>
       <p>{{newsContent}}</p>
       <p><a href="{{unsubscribeLink}}">Unsubscribe</a></p>`,
      'This Week\'s Highlights\n\n{{newsContent}}\n\nUnsubscribe: {{unsubscribeLink}}',
      'newsletter'
    );

    // Alert notification
    this.createEmailTemplate(
      'Alert Notification',
      'Alert: {{alertType}} detected',
      `<h1>{{alertType}} Alert</h1>
       <p>Severity: {{severity}}</p>
       <p>{{alertDescription}}</p>
       <p><a href="{{dashboardLink}}">View Details</a></p>`,
      'Alert: {{alertType}}\n\nSeverity: {{severity}}\n\n{{alertDescription}}\n\nView: {{dashboardLink}}',
      'alert'
    );

    // Password reset
    this.createEmailTemplate(
      'Password Reset',
      'Reset your {{companyName}} password',
      `<p>Hello {{userName}},</p>
       <p>Click the link below to reset your password:</p>
       <p><a href="{{resetLink}}">Reset Password</a></p>
       <p>This link expires in 24 hours.</p>`,
      'Click the link to reset your password:\n\n{{resetLink}}\n\nExpires in 24 hours.',
      'transactional'
    );
  }
}

export const customEmailManager = new CustomEmailManager();

// Initialize default templates on import
customEmailManager.initializeDefaultTemplates();

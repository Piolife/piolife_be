/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as handlebars from 'handlebars';
import * as fs from 'fs-extra';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly fromAddress: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY') ?? '';
    this.resend = new Resend(apiKey);

    // Use a verified domain sender or fall back to Resend's onboarding address
    this.fromAddress =
      this.configService.get<string>('EMAIL_FROM') ??
      'Piolife <onboarding@resend.dev>';
  }

  private async loadTemplate(
    templateName: string,
    variables: Record<string, any>,
  ): Promise<string> {
    const templatePath = path.resolve(
      __dirname,
      '../../../../',
      'templates',
      'email',
      `${templateName}.hbs`,
    );
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(templateContent);
    return compiledTemplate(variables);
  }

  // Send email with a template
  async sendEmailTemplate(
    to: string,
    subject: string,
    templateName: string,
    variables: Record<string, any>,
  ): Promise<void> {
    const html = await this.loadTemplate(templateName, variables);

    const { error } = await this.resend.emails.send({
      from: this.fromAddress,
      to,
      subject,
      html,
    });

    if (error) {
      this.logger.error(`Resend error sending "${subject}" to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendConfirmationEmail(
    email: string,
    firstName: string,
    otp: string,
    otpLink: string,
  ): Promise<void> {
    const variables = { firstName, otp, otpLink };
    await this.sendEmailTemplate(
      email,
      'Verify your email address',
      'confirmation',
      variables,
    );
  }

  async SendResetPassword(
    email: string,
    otp: string,
    otpLink: string,
  ): Promise<void> {
    const variables = { otp, otpLink };
    await this.sendEmailTemplate(
      email,
      'Reset your Forgot Password',
      'resetPassword',
      variables,
    );
  }
}

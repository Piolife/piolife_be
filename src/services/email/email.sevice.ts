/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs-extra';
import * as path from 'path';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const emailAccount = this.configService.get<string>('EMAIL_USER');
    const emailPassword = this.configService.get<string>('EMAIL_PASSWORD');

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_TRANSPORTER_HOST'),
      port: 465,
      secure: true,
      auth: {
        user: emailAccount,
        pass: emailPassword,
      },
    });
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
  ) {
    const html = await this.loadTemplate(templateName, variables);

    const mailOptions = {
      from: '" Piolife " <' + this.configService.get<string>('EMAIL_USER') + '>',
      to,
      subject,
      html,
    };

    await this.transporter.sendMail(mailOptions);
  }


  async sendConfirmationEmail(
    email: string,
    firstName: string,
    otp: string,
    otpLink: string,
  ): Promise<void> {
    const variables = {firstName, otp, otpLink };
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
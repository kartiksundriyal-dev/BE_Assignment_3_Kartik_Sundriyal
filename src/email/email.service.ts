import { ConsoleLogger, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';

@Injectable()
export class EmailService {
  private logger: ConsoleLogger;
  private templatePath = 'src/email/templates/verify-email.html';

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.logger = new ConsoleLogger(EmailService.name);
  }

  private async loadHtmlTemplate(token: string): Promise<string> {
    const html = await readFile(this.templatePath, 'utf-8');

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const verificationUrl = `${frontendUrl}/auth/verify-email?token=${token}`;

    return html.replace(/{{\s*verificationUrl\s*}}/g, verificationUrl);
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    try {
      const htmlContent = await this.loadHtmlTemplate(token);

      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify Your Email Address',
        html: htmlContent,
      });
    } catch (error) {
      this.logger.error('Failed to send verification email:', error);
    }
  }
}

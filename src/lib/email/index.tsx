/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import "server-only";

import type { ComponentProps } from "react";
import { env } from "~/env";

import { logger } from "../logger";
import { render } from "@react-email/render";
import { EmailVerificationTemplate } from "./templates/email-verification";
import { ResetPasswordTemplate } from "./templates/reset-password";
import { EMAIL_SENDER } from "../constants";
import { createTransport, type TransportOptions } from "nodemailer";

type EmailContent = {
  subject: string;
  body: any;
};

export enum EmailTemplate {
  EmailVerification = "EmailVerification",
  PasswordReset = "PasswordReset",
}

export type PropsMap = {
  [EmailTemplate.EmailVerification]: ComponentProps<
    typeof EmailVerificationTemplate
  >;
  [EmailTemplate.PasswordReset]: ComponentProps<typeof ResetPasswordTemplate>;
};

const getEmailTemplate = <T extends EmailTemplate>(
  template: T,
  props: PropsMap[NoInfer<T>],
): EmailContent => {
  switch (template) {
    case EmailTemplate.EmailVerification:
      return {
        subject: "Verify your email address",
        body: render(
          <EmailVerificationTemplate
            {...(props as PropsMap[EmailTemplate.EmailVerification])}
          />,
        ),
      };
    case EmailTemplate.PasswordReset:
      return {
        subject: "Reset your password",
        body: render(
          <ResetPasswordTemplate
            {...(props as PropsMap[EmailTemplate.PasswordReset])}
          />,
        ),
      };
    default:
      throw new Error(`Unsupported email template: ${template}`);
  }
};

const smtpConfig = {
  host: env.EMAIL_SERVER_HOST,
  port: Number(env.EMAIL_SERVER_PORT),
  auth: {
    user: env.EMAIL_SERVER_USER,
    pass: env.EMAIL_SERVER_PASSWORD,
  },
} as const;

const transporter = createTransport(smtpConfig as TransportOptions);

export const sendMail = async <T extends EmailTemplate>(
  to: string,
  template: T,
  props: PropsMap[NoInfer<T>],
) => {
  if (env.MOCK_SEND_EMAIL) {
    logger.info(
      "📨 Email sent to:",
      to,
      "with template:",
      template,
      "and props:",
      props,
    );
    return;
  }

  const { subject, body } = getEmailTemplate(template, props);

  try {
    const result = await transporter.sendMail({
      from: EMAIL_SENDER,
      to,
      subject,
      html: body,
    });
    return result;
  } catch (error) {
    logger.error("Failed to send email:", error);
    throw error;
  }
};

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, text) => {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    to,
    subject,
    text,
  });

  if (error) {
    console.error("RESEND ERROR:", JSON.stringify(error));
    throw new Error(error.message || "Email send failed");
  }

  console.log("RESEND SUCCESS:", data?.id);
};

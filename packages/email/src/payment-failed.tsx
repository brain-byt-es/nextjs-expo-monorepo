import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Heading,
  Link,
  Preview,
  Section,
} from "@react-email/components";

interface PaymentFailedEmailProps {
  appUrl?: string;
}

export function PaymentFailedEmail({ appUrl = "http://localhost:3000" }: PaymentFailedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your payment failed — please update your payment method</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Payment Failed</Heading>
          <Text style={text}>Hi,</Text>
          <Text style={text}>
            We tried to process your subscription payment but it failed.
            Please update your payment method to keep your subscription active.
          </Text>
          <Section style={buttonContainer}>
            <Link style={button} href={`${appUrl}/dashboard/billing`}>
              Update Payment Method
            </Link>
          </Section>
          <Text style={footer}>
            If you believe this is a mistake, please contact our support team.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PaymentFailedEmail;

const main = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = { margin: "0 auto", padding: "40px 20px", maxWidth: "560px" };
const h1 = { color: "#333", fontSize: "24px", fontWeight: "bold" as const, margin: "0 0 16px" };
const text = { color: "#555", fontSize: "16px", lineHeight: "24px", margin: "0 0 12px" };
const buttonContainer = { textAlign: "center" as const, margin: "32px 0" };
const button = {
  backgroundColor: "#dc2626",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold" as const,
  textDecoration: "none",
  padding: "12px 24px",
  display: "inline-block",
};
const footer = { color: "#999", fontSize: "12px", margin: "32px 0 0" };

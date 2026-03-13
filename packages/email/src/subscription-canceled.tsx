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

interface SubscriptionCanceledEmailProps {
  appUrl?: string;
}

export function SubscriptionCanceledEmail({
  appUrl = "http://localhost:3000",
}: SubscriptionCanceledEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your subscription has been canceled</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Subscription Canceled</Heading>
          <Text style={text}>Hi,</Text>
          <Text style={text}>
            Your subscription has been canceled and will end at the next billing cycle.
            You&apos;ll continue to have access until then.
          </Text>
          <Text style={text}>
            If you change your mind, you can resubscribe at any time.
          </Text>
          <Section style={buttonContainer}>
            <Link style={button} href={`${appUrl}/pricing`}>
              View Plans
            </Link>
          </Section>
          <Text style={footer}>
            If you have any questions, please reach out to our support team.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default SubscriptionCanceledEmail;

const main = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = { margin: "0 auto", padding: "40px 20px", maxWidth: "560px" };
const h1 = { color: "#333", fontSize: "24px", fontWeight: "bold" as const, margin: "0 0 16px" };
const text = { color: "#555", fontSize: "16px", lineHeight: "24px", margin: "0 0 12px" };
const buttonContainer = { textAlign: "center" as const, margin: "32px 0" };
const button = {
  backgroundColor: "#000",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold" as const,
  textDecoration: "none",
  padding: "12px 24px",
  display: "inline-block",
};
const footer = { color: "#999", fontSize: "12px", margin: "32px 0 0" };

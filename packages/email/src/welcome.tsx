import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Link,
  Preview,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
  appUrl?: string;
}

export function WelcomeEmail({ name, appUrl = "http://localhost:3000" }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to our platform, {name}!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to our platform!</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            Thanks for signing up. We&apos;re excited to have you on board.
          </Text>
          <Section style={buttonContainer}>
            <Link style={button} href={`${appUrl}/dashboard`}>
              Go to Dashboard
            </Link>
          </Section>
          <Text style={footer}>
            If you didn&apos;t create this account, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;

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

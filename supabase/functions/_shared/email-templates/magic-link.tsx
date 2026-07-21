/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="hr" dir="ltr">
    <Head />
    <Preview>Vaša prijava u {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Vaša prijava</Heading>
        <Text style={text}>
          Kliknite gumb ispod za prijavu u {siteName}. Ovaj link uskoro istječe.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Prijavi se
        </Button>
        <Text style={footer}>
          Ako niste zatražili prijavu, možete zanemariti ovu poruku.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = {
  backgroundColor: '#f5f2ea',
  fontFamily: "'Karla', Arial, sans-serif",
}
const container = { padding: '20px 25px' }
const h1 = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: '24px',
  fontWeight: 600,
  color: '#2a2f22',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#5a6b52',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const button = {
  backgroundColor: '#6b8e5a',
  color: '#fbf9f4',
  fontSize: '14px',
  fontWeight: 600,
  borderRadius: '20px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#8a9a7c', margin: '30px 0 0' }

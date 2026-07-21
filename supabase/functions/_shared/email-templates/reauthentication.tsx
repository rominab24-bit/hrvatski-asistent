/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="hr" dir="ltr">
    <Head />
    <Preview>Vaš kontrolni kod</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Potvrdite identitet</Heading>
        <Text style={text}>Upotrijebite kod ispod da potvrdite svoj identitet:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Ovaj kod uskoro istječe. Ako niste zatražili ovu potvrdu, možete
          zanemariti ovu poruku.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  fontSize: '24px',
  fontWeight: 700,
  color: '#2a2f22',
  margin: '0 0 30px',
  letterSpacing: '0.08em',
}
const footer = { fontSize: '12px', color: '#8a9a7c', margin: '30px 0 0' }

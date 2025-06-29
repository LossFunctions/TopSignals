import { twilioClient, TWILIO_FROM } from '../lib/twilioClient';

export async function sendAlert(to: string, body: string) {
  return twilioClient.messages.create({
    body,
    from: TWILIO_FROM,
    to,            // always E.164 e.g. +15551234567
  });
}
import twilio from 'twilio';

const isSandbox = process.env.NODE_ENV !== 'production'
                  || process.env.FORCE_TWILIO_SANDBOX === 'true';

const accountSid = isSandbox
  ? process.env.TWILIO_TEST_ACCOUNT_SID
  : process.env.TWILIO_ACCOUNT_SID;

const authToken = isSandbox
  ? process.env.TWILIO_TEST_AUTH_TOKEN
  : process.env.TWILIO_AUTH_TOKEN;

export const twilioClient = twilio(accountSid!, authToken!);

export const TWILIO_FROM = isSandbox
  ? process.env.TWILIO_TEST_FROM
  : process.env.TWILIO_LIVE_FROM;
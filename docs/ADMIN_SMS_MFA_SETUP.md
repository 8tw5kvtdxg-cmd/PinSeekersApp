# Administrator text-message MFA

> PAUSED — not implemented in the active application. These are future setup notes. The earlier code is preserved in `paused-work/sms-mfa-2026-09-18.json`; it must be reviewed and ported before these activation instructions apply. Current administrator MFA uses email.

SMS applies to authorized administrator logins, not ordinary player logins.
Each administrator receives the code at the phone on their own account.
US ten-digit numbers are normalized to +1; international numbers require +country-code format.

## Activation

1. Create a Twilio account and a Verify service named Pin2Win. Enable SMS and set code length to six digits. Keep code validity at ten minutes. Configure supported destination countries and spend/usage alerts.
2. For a trial account, verify the destination mobile numbers in Twilio before testing. Review Twilio's trial limits before relying on it for production.
3. Confirm every authorized administrator has their own account and a correct, SMS-capable mobile number. Obtain their agreement to receive authentication texts before enabling SMS.
4. In Vercel production environment variables, securely set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_VERIFY_SERVICE_SID`. Never put credentials in chat or source control.
5. Deploy the migration and application, then set `PIN2WIN_ADMIN_MFA_CHANNEL=sms` and redeploy. Until that switch, email MFA remains active.
6. Test one real administrator login: password, received text, accepted code, redirect to admin, and rejection of code reuse. Test a wrong code and confirm ordinary player logins are unchanged.

SMS does not silently fall back to email when delivery fails. An unconfigured provider or invalid account phone blocks new admin login with an unavailable message; existing sessions are unaffected.

## Phone changes and recovery

While SMS is enabled, ordinary profile edits cannot change an authorized administrator's phone number (equivalent formatting is allowed). An operator must independently verify the administrator's identity before changing the account phone through trusted database administration. Revoke their admin sessions and outstanding login challenges at the same time. Do not use knowledge of the account password alone to authorize a number change.

For a provider outage, a trusted hosting operator can explicitly switch `PIN2WIN_ADMIN_MFA_CHANNEL=email` and redeploy. This is an operational recovery action, not an option exposed to unauthenticated login requests.

Twilio documentation: https://www.twilio.com/docs/verify/api/verification and https://www.twilio.com/docs/verify/api/verification-check

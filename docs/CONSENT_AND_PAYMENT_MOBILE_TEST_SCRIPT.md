# Consent and Payment Mobile Test Script

Use this script after a production deployment to validate the QR, account-consent, and Square payment flow on a real mobile device. Keep the corresponding compliance checklist item open until both the new-account and signed-in flows pass.

## Before Testing

- Confirm that the QR code belongs to the intended active challenge, location, and simulator bay.
- Confirm whether Square is in production or sandbox mode. A production checkout creates a real charge.
- Use an email address and phone number that can receive verification and confirmation messages.
- Record the device model, operating-system version, browser, test time, and time zone.
- Never include a password, full card number, security code, or other payment credentials in an issue report.

## New-Account Flow

1. Sign out of Pin2Win and scan the challenge QR code.
2. Confirm that the authentication page opens on the **Login** tab by default.
3. Select **Create an account**.
4. Open each linked legal document and confirm that it is readable on mobile.
5. Try to continue without accepting the required consent statements. Account creation should be prevented with a clear message.
6. Complete the required fields, accept the consent statements, and create the account.
7. Complete email verification if prompted.
8. Confirm that the saved QR destination is preserved and the user proceeds to the Square checkout without being asked for consent again.
9. Complete the Square payment.
10. Confirm that the return page reports a successful entry and does not create a second checkout or entry when refreshed.
11. Confirm that the entry confirmation email arrives and contains the expected challenge and support information.

## Already-Signed-In Flow

1. While still signed in, scan the same valid QR code again.
2. Confirm that Pin2Win proceeds directly to Square checkout.
3. Confirm that the user does not see the login page, consent form, or **Back to Play Now** page first.
4. Do not complete a second live payment unless a second paid entry is intentionally part of the test.

## Retry and Failure Checks

- If a payment-confirmation screen says that Square is still being confirmed, wait briefly and use **Try again** once. Do not immediately submit another payment.
- Confirm in Square and the Pin2Win administration tools whether a charge, checkout, or entry already exists before retrying a failed-looking payment.
- Verify that one completed payment produces one entry and that refreshing the return page does not duplicate it.
- Separately verify that an inactive signed-in session requires login after one hour.

## Reporting an Issue

Include:

- Test date, time, and time zone
- Device, operating system, and browser
- QR challenge, location, and bay used
- Account email address (never the password)
- The numbered step that failed
- Exact error text and a screenshot
- Whether Square shows a charge
- Square receipt or payment identifier, if available
- Pin2Win entry identifier, if one was created

If a live test charge should be reversed, use the documented administrative refund workflow rather than deleting the entry.

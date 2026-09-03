const defaultNotificationEmail = "pin2wingolf@outlook.com";

export function getPin2WinNotificationEmails() {
  const configuredEmails =
    process.env.PIN2WIN_PAYMENT_NOTIFICATION_EMAIL?.split(",")
      .map((email) => email.trim())
      .filter(Boolean) ?? [];

  const uniqueEmails = Array.from(new Set(configuredEmails));

  return uniqueEmails.length > 0 ? uniqueEmails : [defaultNotificationEmail];
}

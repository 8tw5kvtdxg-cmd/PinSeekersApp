type ZapierPayload = Record<string, unknown>;

export async function sendZapierWebhook(
  webhookUrl: string | undefined,
  payload: ZapierPayload,
) {
  if (!webhookUrl) {
    return { skipped: true };
  }

  try {
    const response = await fetch(webhookUrl, {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      const text = await response.text();

      console.error(
        `Zapier webhook failed with HTTP ${response.status}: ${text}`,
      );

      return { ok: false, status: response.status };
    }

    return { ok: true, status: response.status };
  } catch (error) {
    console.error("Zapier webhook could not be sent.", error);

    return { ok: false };
  }
}

import Link from "next/link";

export type AccountConsent = {
  legalDocumentsAccepted: boolean;
  age18Accepted: boolean;
  texasResidencyAccepted: boolean;
};

type AccountConsentFieldsProps = {
  consent: AccountConsent;
  onChange: (consent: AccountConsent) => void;
};

export const emptyAccountConsent: AccountConsent = {
  legalDocumentsAccepted: false,
  age18Accepted: false,
  texasResidencyAccepted: false,
};

export function AccountConsentFields({
  consent,
  onChange,
}: AccountConsentFieldsProps) {
  function setConsent<Key extends keyof AccountConsent>(
    key: Key,
    value: AccountConsent[Key],
  ) {
    onChange({ ...consent, [key]: value });
  }

  return (
    <fieldset className="grid gap-3 rounded-md border border-[#ded6c8] p-4">
      <legend className="px-1 text-sm font-black text-[#18211f]">
        Required agreements
      </legend>
      <label className="flex items-start gap-3 text-sm font-bold leading-6 text-[#53605a]">
        <input
          checked={consent.legalDocumentsAccepted}
          className="mt-1 size-4 shrink-0 accent-[#2f6b3f]"
          type="checkbox"
          onChange={(event) =>
            setConsent("legalDocumentsAccepted", event.target.checked)
          }
        />
        <span>
          I agree to the{" "}
          <Link
            className="text-[#2f6b3f] underline"
            href="/terms"
            target="_blank"
            rel="noreferrer"
          >
            Terms of Use
          </Link>
          ,{" "}
          <Link
            className="text-[#2f6b3f] underline"
            href="/official-rules"
            target="_blank"
            rel="noreferrer"
          >
            Official Rules
          </Link>
          ,{" "}
          <Link
            className="text-[#2f6b3f] underline"
            href="/refund-policy"
            target="_blank"
            rel="noreferrer"
          >
            Refund Policy
          </Link>
          , and{" "}
          <Link
            className="text-[#2f6b3f] underline"
            href="/privacy"
            target="_blank"
            rel="noreferrer"
          >
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm font-bold leading-6 text-[#53605a]">
        <input
          checked={consent.age18Accepted}
          className="mt-1 size-4 shrink-0 accent-[#2f6b3f]"
          type="checkbox"
          onChange={(event) => setConsent("age18Accepted", event.target.checked)}
        />
        <span>I certify that I am at least 18 years old.</span>
      </label>
      <label className="flex items-start gap-3 text-sm font-bold leading-6 text-[#53605a]">
        <input
          checked={consent.texasResidencyAccepted}
          className="mt-1 size-4 shrink-0 accent-[#2f6b3f]"
          type="checkbox"
          onChange={(event) =>
            setConsent("texasResidencyAccepted", event.target.checked)
          }
        />
        <span>I certify that I am a Texas resident.</span>
      </label>
    </fieldset>
  );
}

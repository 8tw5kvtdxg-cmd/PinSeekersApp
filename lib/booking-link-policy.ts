export function approvedBookingUrl(value: string | null | undefined) {
    try {
        const url = new URL(value || '');
        if (url.protocol !== 'https:' || url.username || url.password || !url.hostname.includes('.'))
            return null;
        return url.toString();
    }
    catch {
        return null;
    }
}
export function isAutomatedVisit(userAgent: string) { return /bot|crawler|spider|preview|headless/i.test(userAgent); }
export function referrerOrigin(value: string | null) {
    try {
        const url = new URL(value || '');
        return ['http:', 'https:'].includes(url.protocol) ? url.origin : null;
    }
    catch {
        return null;
    }
}

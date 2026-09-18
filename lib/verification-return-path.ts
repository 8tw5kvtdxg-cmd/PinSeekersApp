export function verificationReturnPath(value: unknown) {
    if (typeof value !== "string" || value.length > 2048 || !value.startsWith("/play/") || /[\\\x00-\x20]/.test(value))
        return "/account";
    try {
        const url = new URL(value, "https://pin2win.invalid");
        if (url.origin !== "https://pin2win.invalid" || !/^\/play\/[a-z0-9-]+$/.test(url.pathname))
            return "/account";
        const query = new URLSearchParams();
        for (const key of ["location", "bay", "autoCheckout"]) {
            const item = url.searchParams.get(key);
            if (item)
                query.set(key, item);
        }
        return url.pathname + (query.size ? "?" + query.toString() : "");
    }
    catch {
        return "/account";
    }
}

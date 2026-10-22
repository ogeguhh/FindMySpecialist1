function verifiedBookingLink(value, isVerified) {
    if (!isVerified || typeof value !== "string") {
        return null;
    }

    try {
        const parsedUrl = new URL(value);
        if (parsedUrl.protocol !== "https:" ||
            parsedUrl.username ||
            parsedUrl.password) {
            return null;
        }
        return parsedUrl.href;
    } catch {
        return null;
    }
}

module.exports = verifiedBookingLink;
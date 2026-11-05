const net = require('net');

class BookingLinkService {
  isValid(url) {
    if (typeof url !== 'string') return false;
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      return parsed.protocol === 'https:'
        && Boolean(hostname)
        && !parsed.username
        && !parsed.password
        && hostname !== 'localhost'
        && !hostname.endsWith('.localhost')
        && net.isIP(hostname.replace(/^\[|\]$/g, '')) === 0;
    } catch {
      return false;
    }
  }

  getBookingUrl(url) {
    return this.isValid(url) ? url : null;
  }
}

module.exports = BookingLinkService;

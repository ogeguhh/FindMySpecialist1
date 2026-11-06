const regions = {
  '550': 'Twin Cities',
  '551': 'Twin Cities',
  '553': 'Twin Cities',
  '554': 'Twin Cities',
  '555': 'Twin Cities',
  '556': 'Northeast Minnesota',
  '557': 'Northeast Minnesota',
  '558': 'Northeast Minnesota',
  '559': 'Southeast Minnesota',
  '560': 'South Central Minnesota',
  '561': 'South Central Minnesota',
  '562': 'South Central Minnesota',
  '563': 'Central Minnesota',
  '564': 'Central Minnesota',
  '565': 'Northwest Minnesota',
  '566': 'Northwest Minnesota',
  '567': 'Northwest Minnesota'
};

class MinnesotaZipService {
  regionFor(zip) {
    const value = String(zip || '').trim();
    if (!/^\d{5}$/.test(value)) return null;
    const number = Number(value);
    if (number < 55001 || number > 56763) return null;
    return regions[value.slice(0, 3)] || null;
  }

  isMinnesotaZip(zip) {
    return this.regionFor(zip) !== null;
  }
}

module.exports = MinnesotaZipService;

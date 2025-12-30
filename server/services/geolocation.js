// Mock Geolocation Service
const vpnFilter = (req, res, next) => {
  // TODO: Implement VPN/Proxy detection
  next();
};

module.exports = {
  vpnFilter
};

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`📥 ${req.method} ${req.url} - ${req.ip} - ${new Date().toISOString()}`);
  
  // Log Arabic/RTL specific headers
  if (req.headers['accept-language']?.includes('ar') || req.headers['x-rtl-support']) {
    console.log(`🌐 RTL Request - Language: ${req.headers['accept-language']}`);
  }

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    console.log(`📤 ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    
    return originalJson.call(this, data);
  };

  next();
};
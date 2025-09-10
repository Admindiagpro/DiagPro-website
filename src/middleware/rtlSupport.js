export const rtlSupport = (req, res, next) => {
  // Detect Arabic language from various sources
  const acceptLanguage = req.headers['accept-language'] || '';
  const rtlHeader = req.headers['x-rtl-support'];
  const langQuery = req.query.lang;
  
  const isArabic = acceptLanguage.includes('ar') || 
                   langQuery === 'ar' || 
                   rtlHeader === 'true';

  // Add RTL support information to request
  req.rtl = {
    isRTL: isArabic,
    language: isArabic ? 'ar' : 'en',
    direction: isArabic ? 'rtl' : 'ltr'
  };

  // Set response headers for RTL support
  res.set({
    'X-RTL-Support': isArabic ? 'true' : 'false',
    'Content-Language': isArabic ? 'ar' : 'en',
    'X-Content-Direction': isArabic ? 'rtl' : 'ltr'
  });

  // Helper function for localized responses
  res.localized = (data) => {
    if (typeof data === 'object' && data !== null) {
      return {
        ...data,
        rtl: req.rtl,
        locale: req.rtl.language
      };
    }
    return data;
  };

  next();
};
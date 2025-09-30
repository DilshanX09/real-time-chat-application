const getBrowserInfo = async (userId = 'unknown') => {
     let ipAddress = 'Unknown';
     let city = 'Unknown';
     let country = 'Unknown';
     let region = 'Unknown';

     async function getTextLocation() {
          try {
               const res = await fetch('https://ipinfo.io/json'); // Add token if required
               const data = await res.json();

               country = data.country || 'Unknown';
               city = data.city || 'Unknown';
               region = data.region || 'Unknown';
               ipAddress = data.ip || 'Unknown';

          } catch (error) {
               console.error('Location fetch failed:', error);
          }
     }

     await getTextLocation();

     const ua = navigator.userAgent;
     let browserName = 'Unknown';
     let browserVersion = 'Unknown';

     if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) {
          browserName = 'Chrome';
          browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1];
     } else if (ua.includes('Firefox')) {
          browserName = 'Firefox';
          browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1];
     } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
          browserName = 'Safari';
          browserVersion = ua.match(/Version\/([\d.]+)/)?.[1];
     } else if (ua.includes('Edg')) {
          browserName = 'Edge';
          browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1];
     } else if (ua.includes('OPR') || ua.includes('Opera')) {
          browserName = 'Opera';
          browserVersion = ua.match(/(OPR|Opera)\/([\d.]+)/)?.[2];
     }

     return {
          userId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          browserName,
          browserVersion,
          platform: navigator.platform,
          language: navigator.language,
          online: navigator.onLine,
          location: `${country}, ${city}, ${region}`,
          ipAddress,
     };
}

export default getBrowserInfo;

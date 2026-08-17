const crypto = require('crypto');
const https = require('https');

function base64url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function getGoogleJwt(clientEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsigned);
  sign.end();
  const signature = sign.sign(privateKey);
  return `${unsigned}.${base64url(signature)}`;
}

function getGoogleAccessToken(clientEmail, privateKey) {
  return new Promise((resolve, reject) => {
    try {
      const jwt = getGoogleJwt(clientEmail, privateKey);
      const postData = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;

      const req = https.request('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            if (json.access_token) {
              resolve(json.access_token);
            } else {
              reject(new Error(json.error_description || json.error || body));
            }
          } catch (e) {
            reject(new Error('Invalid token response: ' + body));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

function publishToGoogle(token, url, type = 'URL_UPDATED') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      url: url,
      type: type
    });

    const req = https.request('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: json
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function publishToIndexNow(host, key, urlList) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      host: host,
      key: key,
      keyLocation: `https://${host}/${key}.txt`,
      urlList: Array.isArray(urlList) ? urlList : [urlList]
    });

    const req = https.request('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          message: res.statusCode === 200 || res.statusCode === 202 ? 'Submitted to IndexNow (Bing/Yandex)' : body
        });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

module.exports = async (req, res) => {
  // Enable CORS for frontend Admin requests
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = req.body || {};
    const { url, urls, serviceAccount, type = 'URL_UPDATED', engine = 'both', indexNowKey = 'e0f7a934bd824d5598ba9622d715ac90' } = body;

    const targetUrls = urls && Array.isArray(urls) && urls.length > 0 ? urls : (url ? [url] : []);
    if (targetUrls.length === 0) {
      return res.status(400).json({ error: 'Missing target URL or URLs array in request body.' });
    }

    let sa = serviceAccount;
    if (typeof sa === 'string') {
      try {
        sa = JSON.parse(sa);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid serviceAccount JSON string.' });
      }
    }

    const results = {
      timestamp: new Date().toISOString(),
      urls: targetUrls,
      google: [],
      indexNow: null
    };

    // 1. Google Indexing API
    if (engine === 'google' || engine === 'both') {
      if (!sa || !sa.client_email || !sa.private_key) {
        results.google = targetUrls.map(u => ({
          url: u,
          status: 400,
          error: 'Google Service Account credentials missing or incomplete in request.'
        }));
      } else {
        try {
          const accessToken = await getGoogleAccessToken(sa.client_email, sa.private_key);
          for (const u of targetUrls) {
            try {
              const gRes = await publishToGoogle(accessToken, u, type);
              results.google.push({
                url: u,
                status: gRes.status,
                response: gRes.data
              });
            } catch (uErr) {
              results.google.push({
                url: u,
                status: 500,
                error: uErr.message
              });
            }
          }
        } catch (authErr) {
          results.google = targetUrls.map(u => ({
            url: u,
            status: 401,
            error: 'Google OAuth Authentication failed: ' + authErr.message
          }));
        }
      }
    }

    // 2. IndexNow Protocol (Bing, Yandex, Seznam)
    if (engine === 'indexnow' || engine === 'both') {
      try {
        const host = 'hivecloud.in';
        const inRes = await publishToIndexNow(host, indexNowKey, targetUrls);
        results.indexNow = inRes;
      } catch (inErr) {
        results.indexNow = { status: 500, error: inErr.message };
      }
    }

    return res.status(200).json({
      success: true,
      results: results
    });

  } catch (globalErr) {
    return res.status(500).json({
      success: false,
      error: globalErr.message
    });
  }
};

export default async function handler(req) {
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      }
    });
  }

  // 兼容 GET 和 POST 两种方式获取目标 URL
  var targetUrl;
  if (req.method === 'GET') {
    targetUrl = new URL(req.url).searchParams.get('url');
  } else {
    try {
      var body = await req.json();
      targetUrl = body.url;
    } catch (_) {
      targetUrl = new URL(req.url).searchParams.get('url');
    }
  }

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'URL is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    // 转发请求头（去掉可能导致问题的头）
    var headers = new Headers();
    req.headers.forEach(function (value, key) {
      var lower = key.toLowerCase();
      if (lower !== 'host' && lower !== 'origin' && lower !== 'referer') {
        headers.set(key, value);
      }
    });

    var response = await fetch(targetUrl, {
      method: 'GET',
      headers: headers
    });

    var newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', '*');

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export const config = {
  runtime: 'edge',
};

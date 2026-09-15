export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get('url');
    if (!target) {
      return new Response('Missing url parameter', { status: 400 });
    }

    try {
      const response = await fetch(target);
      const newResponse = new Response(response.body, response);

      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      newResponse.headers.set('Pragma', 'no-cache');
      newResponse.headers.set('Expires', '0');
      newResponse.headers.set('CDN-Cache-Control', 'no-store');
      newResponse.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');

      return newResponse;
    } catch (err) {
      return new Response('Proxy error: ' + err.message, { status: 500 });
    }
  }
};

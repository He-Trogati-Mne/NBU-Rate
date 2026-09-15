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

      // Дозволяємо запити з будь-якого домену
      newResponse.headers.set('Access-Control-Allow-Origin', '*');

      // ВИМИКАЄМО КЕШУВАННЯ Cloudflare
      newResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      newResponse.headers.set('Pragma', 'no-cache');
      newResponse.headers.set('Expires', '0');

      return newResponse;
    } catch (err) {
      return new Response('Proxy error: ' + err.message, { status: 500 });
    }
  }
};

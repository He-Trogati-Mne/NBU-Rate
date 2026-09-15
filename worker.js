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
      // Дозволяємо запити з будь-якого домену (включно з GitHub Pages)
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      return newResponse;
    } catch (err) {
      return new Response('Proxy error: ' + err.message, { status: 500 });
    }
  }
};

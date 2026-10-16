export function json(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store', ...headers },
  });
}

export function redirect(url, headers = {}) {
  return new Response(null, {
    status: 302,
    headers: { location: url, 'cache-control': 'no-store', ...headers },
  });
}

export function withCookies(response, cookies) {
  const headers = new Headers(response.headers);
  for (const cookie of cookies) headers.append('set-cookie', cookie);
  return new Response(response.body, { status: response.status, headers });
}

import {RemixServer} from '@remix-run/react';
import isbot from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';


export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  remixContext,
) {



// const { nonce, header, NonceProvider } = createContentSecurityPolicy()

  const { nonce, header, NonceProvider } = createContentSecurityPolicy({
    defaultSrc: [
        "'self'",
        'https://cdn.shopify.com',
        'https://shopify.com'
    ],
    frameSrc: [
        "'self'",
        'https://www.google.com',
        'https://www.youtube.com',
        'https://www.googletagmanager.com',
        'https://tagmanager.google.com',
        'https://analytics.google.com/'

    ],

});


  const body = await renderToReadableStream(
    <NonceProvider>
      <RemixServer context={remixContext} url={request.url} />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        // eslint-disable-next-line no-console
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);
  

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

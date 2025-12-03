import { createServer, IncomingMessage, ServerResponse } from 'http';
import { ZidApiService } from './zidService';

const PORT = process.env.PORT || 3000;

const sendJson = (res: ServerResponse, statusCode: number, payload: unknown) => {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
};

const handleRedirect = (res: ServerResponse) => {
    const queries = new URLSearchParams({
        client_id: process.env.ZID_CLIENT_ID || '',
        redirect_uri: `${process.env.MY_BACKEND_URL}/zid/auth/callback`,
        response_type: 'code',
    });

    if (!process.env.ZID_AUTH_URL) {
        sendJson(res, 500, { error: 'Missing ZID_AUTH_URL environment variable' });
        return;
    }

    res.statusCode = 302;
    res.setHeader('Location', `${process.env.ZID_AUTH_URL}/oauth/authorize?${queries.toString()}`);
    res.end();
};

const handleCallback = async (req: IncomingMessage, res: ServerResponse, url: URL) => {
    const zidCode = url.searchParams.get('code');

    if (!zidCode) {
        sendJson(res, 400, { error: 'Missing OAuth code in callback' });
        return;
    }

    const merchantTokens = await ZidApiService.getTokensByCode(zidCode);

    if (!merchantTokens) {
        sendJson(res, 502, { error: 'Could not retrieve tokens from Zid' });
        return;
    }

    const managerToken = merchantTokens.access_token;
    const authToken = merchantTokens.authorization;
    const refreshToken = merchantTokens.refresh_token;

    const zidMerchantDetails = await ZidApiService.getMerchantProfile(managerToken, authToken);

    sendJson(res, 200, {
        message: 'OAuth flow completed. Replace this with your own dashboard redirect.',
        tokens: {
            managerToken,
            authToken,
            refreshToken,
        },
        zidMerchantDetails,
    });
};

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || !req.headers.host) {
        sendJson(res, 400, { error: 'Bad request' });
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/zid/auth/redirect') {
        handleRedirect(res);
        return;
    }

    if (req.method === 'GET' && url.pathname === '/zid/auth/callback') {
        await handleCallback(req, res, url);
        return;
    }

    sendJson(res, 404, { error: 'Route not found' });
});

server.listen(PORT, () => {
    console.log(`Simple Node server running on port ${PORT}`);
});

export default server;

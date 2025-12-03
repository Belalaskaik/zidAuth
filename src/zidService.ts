import { request } from 'https';

interface TokenResponse {
    access_token: string;
    authorization: string;
    refresh_token: string;
}

const CALLBACK_PATH = process.env.ZID_CALLBACK_PATH || '/zid/auth/callback';

export class ZidApiService {
    private static postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const data = JSON.stringify(body);

            const req = request(
                {
                    method: 'POST',
                    hostname: parsedUrl.hostname,
                    path: `${parsedUrl.pathname}${parsedUrl.search}`,
                    protocol: parsedUrl.protocol,
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(data),
                    },
                },
                (res) => {
                    const chunks: Buffer[] = [];
                    res.on('data', (chunk) => chunks.push(chunk));
                    res.on('end', () => {
                        try {
                            const bodyText = Buffer.concat(chunks).toString('utf-8');
                            resolve(JSON.parse(bodyText));
                        } catch (error) {
                            reject(error);
                        }
                    });
                }
            );

            req.on('error', reject);
            req.write(data);
            req.end();
        });
    }

    private static getJson<T>(url: string, headers: Record<string, string>): Promise<T> {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);

            const req = request(
                {
                    method: 'GET',
                    hostname: parsedUrl.hostname,
                    path: `${parsedUrl.pathname}${parsedUrl.search}`,
                    protocol: parsedUrl.protocol,
                    headers,
                },
                (res) => {
                    const chunks: Buffer[] = [];
                    res.on('data', (chunk) => chunks.push(chunk));
                    res.on('end', () => {
                        try {
                            const bodyText = Buffer.concat(chunks).toString('utf-8');
                            resolve(JSON.parse(bodyText));
                        } catch (error) {
                            reject(error);
                        }
                    });
                }
            );

            req.on('error', reject);
            req.end();
        });
    }

    public static async getTokensByCode(code: string): Promise<TokenResponse | undefined> {
        if (!process.env.ZID_AUTH_URL) {
            console.error('Missing ZID_AUTH_URL environment variable');
            return undefined;
        }

        const url = `${process.env.ZID_AUTH_URL}/oauth/token`;
        const requestBody = {
            grant_type: 'authorization_code',
            client_id: process.env.ZID_CLIENT_ID,
            client_secret: process.env.ZID_CLIENT_SECRET,
            redirect_uri: `${process.env.MY_BACKEND_URL}${CALLBACK_PATH}`,
            code,
        };

        try {
            return await this.postJson<TokenResponse>(url, requestBody);
        } catch (error) {
            console.error('Failed to exchange code for tokens:', error);
            return undefined;
        }
    }

    public static async getMerchantProfile(managerToken: string, authToken: string): Promise<unknown> {
        if (!process.env.ZID_BASE_API_URL) {
            console.error('Missing ZID_BASE_API_URL environment variable');
            return undefined;
        }

        const url = `${process.env.ZID_BASE_API_URL}/managers/account/profile`;
        const requestHeaders = {
            Authorization: `Bearer ${authToken}`,
            'X-Manager-Token': managerToken,
            Accept: 'application/json',
        };

        try {
            return await this.getJson(url, requestHeaders);
        } catch (error) {
            console.error('Failed to retrieve merchant profile:', error);
            return undefined;
        }
    }
}

/**
 * Integration tests for secured admin endpoints
 */
import { createMocks } from 'node-mocks-http';
import clearCacheHandler from '../../pages/api/clear-cache';
import deleteModuleHandler from '../../pages/api/delete-module';
import resetSystemHandler from '../../pages/api/reset-system';
import AuthLocal from '../../lib/auth-local';

// Mock AuthLocal para controlar los roles y la validez del token
jest.mock('../../lib/auth-local', () => ({
    verifyToken: jest.fn(),
}));

describe('Admin Endpoints Security', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const endpoints = [
        { name: 'clear-cache', handler: clearCacheHandler, method: 'POST' },
        { name: 'delete-module', handler: deleteModuleHandler, method: 'DELETE' },
        { name: 'reset-system', handler: resetSystemHandler, method: 'POST' },
    ];

    endpoints.forEach(({ name, handler, method }) => {
        describe(`Endpoint: /api/${name}`, () => {

            it('should return 401 when no token is provided', async () => {
                const { req, res } = createMocks({
                    method,
                    cookies: {},
                });

                await handler(req, res);

                expect(res._getStatusCode()).toBe(401);
                const data = JSON.parse(res._getData());
                expect(data.error).toMatch(/No autorizado/i);
            });

            it('should return 401 when an invalid token is provided', async () => {
                const { req, res } = createMocks({
                    method,
                    cookies: { token: 'invalid-token' },
                });

                AuthLocal.verifyToken.mockReturnValue({ isValid: false });

                await handler(req, res);

                expect(res._getStatusCode()).toBe(401);
                const data = JSON.parse(res._getData());
                expect(data.error).toMatch(/No autorizado/i);
            });

            it('should return 403 when a non-admin user tries to access', async () => {
                const { req, res } = createMocks({
                    method,
                    cookies: { token: 'valid-user-token' },
                });

                AuthLocal.verifyToken.mockReturnValue({
                    isValid: true,
                    role: 'authenticated',
                    email: 'user@example.com'
                });

                await handler(req, res);

                expect(res._getStatusCode()).toBe(403);
                const data = JSON.parse(res._getData());
                expect(data.error).toMatch(/Prohibido/i);
            });

        });
    });
});

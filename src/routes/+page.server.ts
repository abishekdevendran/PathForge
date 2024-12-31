import type { fetchType } from './api/+server.js';

export const load = async ({fetch}) => {
    const resp = await fetch('/api');
    const respJson = await resp.json() as fetchType;
    return respJson;
};
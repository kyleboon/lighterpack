import { auth } from '../../utils/auth.js';

export default defineEventHandler((event) => {
    return auth.handler(toWebRequest(event));
});

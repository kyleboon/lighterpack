import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const formidable = _require('formidable');
const axios = _require('axios');
const FormData = _require('form-data');
const fs = _require('fs');
const config = _require('config');

export default defineEventHandler(async (event) => {
    const form = new formidable.IncomingForm();
    const { files } = await new Promise<any>((resolve, reject) => {
        form.parse(event.node.req, (err: any, _fields: any, parsedFiles: any) => {
            if (err) reject(err);
            else resolve({ files: parsedFiles });
        });
    });

    if (!files?.image) {
        setResponseStatus(event, 500);
        return { message: 'An error occurred' };
    }

    const filePath = files.image[0].filepath;
    const formData = new FormData();
    formData.append('image', fs.createReadStream(filePath));
    formData.append('type', 'file');

    const { data, status } = await axios.post('https://api.imgur.com/3/image', formData, {
        headers: {
            Authorization: `Client-ID ${config.get('imgurClientID')}`,
            ...formData.getHeaders(),
        },
    });

    if (status !== 200 || data.error) {
        setResponseStatus(event, 500);
        return { message: 'An error occurred.' };
    }

    return data;
});

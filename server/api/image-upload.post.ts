import { createRequire } from 'module';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import config from 'config';
import { and, count, eq } from 'drizzle-orm';
import { getDb } from '../db.js';
import * as schema from '../schema.js';

const MAX_IMAGES_PER_ENTITY = 4;

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']);
const MAX_SIZE_BYTES = (config.get('maxImageSizeMb') as number) * 1024 * 1024;

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Please log in.' });
    }

    const _require = createRequire(process.argv[1]);
    const formidable = _require('formidable');
    const sharp = _require('sharp');

    const uploadsBase = resolve(process.cwd(), config.get('uploadsPath') as string);
    const userDir = join(uploadsBase, user.id);
    mkdirSync(userDir, { recursive: true });

    const form = new formidable.IncomingForm({ maxFileSize: MAX_SIZE_BYTES });

    let fields: any;
    let files: any;
    try {
        const parsed = await new Promise<any>((resolve, reject) => {
            form.parse(event.node.req, (err: any, parsedFields: any, parsedFiles: any) => {
                if (err) reject(err);
                else resolve({ fields: parsedFields, files: parsedFiles });
            });
        });
        fields = parsed.fields;
        files = parsed.files;
    } catch (err) {
        throw createError({ statusCode: 400, message: 'Failed to parse upload.' });
    }

    if (!files?.image?.[0]) {
        throw createError({ statusCode: 400, message: 'No image file provided.' });
    }

    const file = files.image[0];

    if (!ALLOWED_TYPES.has(file.mimetype)) {
        throw createError({ statusCode: 400, message: 'File must be an image (PNG, JPG, GIF, or WebP).' });
    }

    const entityType = fields?.entityType?.[0];
    const entityId = parseInt(fields?.entityId?.[0], 10);
    const sortOrder = parseInt(fields?.sortOrder?.[0] ?? '0', 10);

    if (!entityType || !['item', 'category', 'list'].includes(entityType) || isNaN(entityId)) {
        throw createError({ statusCode: 400, message: 'Invalid entityType or entityId.' });
    }

    const db = getDb();

    let total: number;
    try {
        const [result] = await db
            .select({ total: count() })
            .from(schema.images)
            .where(
                and(
                    eq(schema.images.entity_type, entityType),
                    eq(schema.images.entity_id, entityId),
                    eq(schema.images.user_id, user.id),
                ),
            );
        total = result.total;
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to check image count.' });
    }

    if (total >= MAX_IMAGES_PER_ENTITY) {
        throw createError({ statusCode: 400, message: `Maximum of ${MAX_IMAGES_PER_ENTITY} images per item.` });
    }

    const maxWidth = config.get('imageMaxWidthPx') as number;
    const filename = `${user.id}/${randomUUID()}.webp`;
    const outputPath = join(uploadsBase, filename);

    try {
        await sharp(file.filepath)
            .resize({ width: maxWidth, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toFile(outputPath);
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Image processing failed.' });
    }

    let inserted: any;
    try {
        [inserted] = await db
            .insert(schema.images)
            .values({
                user_id: user.id,
                entity_type: entityType,
                entity_id: entityId,
                filename,
                is_local: true,
                sort_order: sortOrder,
                created_at: Math.floor(Date.now() / 1000),
            })
            .returning();
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to save image record.' });
    }

    return {
        id: inserted.id,
        url: `/uploads/${filename}`,
    };
});

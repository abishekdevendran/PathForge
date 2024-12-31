import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { goalTable, relationshipTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const bodySchema = z.object({
    type: z.enum(['quantitative']),
    name: z.string().min(1),
    description: z.string(),
    value: z.number().optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    unit: z.string().optional(),
    deadline: z.string().datetime().optional(),
    isRoot: z.boolean().default(false)
}).or(z.object({
    type: z.enum(['qualitative']),
    name: z.string().min(1),
    description: z.string(),
    deadline: z.string().datetime().optional(),
    isRoot: z.boolean().default(false)
}));

export const POST = async ({ request, locals }) => {
    // if (!locals.user) {
    //     throw error(401, 'Unauthorized');
    // }

    const body = await request.json();
    const parsedBody = bodySchema.safeParse(body);

    if (!parsedBody.success) {
        throw error(400, parsedBody.error.errors[0].message);
    }

    const node = parsedBody.data;

    try {
        const [createdNode] = await db.insert(goalTable)
            .values({
                userId: 1,
                name: node.name,
                description: node.description,
                goalType: node.type,
                deadline: node.deadline ? new Date(node.deadline).toISOString() : null,
                isRoot: node.isRoot,
                ...(node.type === 'quantitative' ? {
                    value: node.value,
                    minValue: node.minValue,
                    maxValue: node.maxValue,
                    unit: node.unit
                } : {})
            })
            .returning();

        return json({ node: createdNode });
    } catch (err) {
        console.error('Error creating node:', err);
        throw error(500, 'Failed to create node');
    }
};
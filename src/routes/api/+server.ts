import { db } from '$lib/server/db/index.js';
import { goalTable } from '$lib/server/db/schema';
import { error, json } from '@sveltejs/kit';
import { z } from 'zod';

const userNodesQuery = db.query.goalTable.findMany({
    where: (goal, { eq }) => eq(goal.userId, 1)
}).prepare('userNodesQuery');

const relationshipsQuery = db.query.relationshipTable.findMany({
    where: (relationship, { eq }) => eq(relationship.userId, 1),
    with: {
        relationshipType: true
    }
}).prepare('relationshipsQuery');

// const transformNode = (node: NonNullable<Awaited<ReturnType<typeof userNodesQuery.execute>>>[number]) => {
//     if (node.qualitativeGoal) {
//         const { qualitativeGoal, quantitativeGoal, ...rest } = node;
//         return {
//             type: 'qualitative' as const,
//             ...rest.goal,
//         };
//     }
//     if (node.quantitativeGoal) {
//         const { qualitativeGoal, quantitativeGoal, ...rest } = node;
//         return {
//             type: 'quantitative' as const,
//             ...node.quantitativeGoal,
//             ...rest.goal,
//         };
//     }
// };

export const GET = async () => {
    const promises = [userNodesQuery.execute(), relationshipsQuery.execute()] as const;
    const [nodes, relationships] = await Promise.all(promises);
    return json({
        nodes,
        relationships
    });
};

export type fetchType = {
    // nodes: NonNullable<ReturnType<typeof transformNode>>[],
    nodes: Awaited<ReturnType<typeof userNodesQuery.execute>>,
    relationships: Awaited<ReturnType<typeof relationshipsQuery.execute>>
}

const bodySchema = z.object({
    node: z.object({
        type: z.union([z.literal('qualitative'), z.literal('quantitative')]),
        name: z.string(),
        description: z.string(),
        value: z.number(),
        deadline: z.string(),
    }),
    relationships: z.array(z.object({
        fromId: z.number(),
        toId: z.number(),
        relationshipType: z.object({
            name: z.string(),
            id: z.number(),
        }),
    }))
});

export const POST = async ({ request }) => {
    const body = request.json()
    const parsedBody = bodySchema.safeParse(body);
    if (!parsedBody.success) {
        console.error(parsedBody.error);
        return error(400, parsedBody.error.errors.toString());
    }
    // insert into goalTable
    // const goal = await db.insert(goalTable).values({
    //     name: parsedBody.data.node.name,
    //     description: parsedBody.data.node.description,
    //     deadline: new Date(parsedBody.data.node.deadline),
    //     userId: 1,
    // }).execute();
}
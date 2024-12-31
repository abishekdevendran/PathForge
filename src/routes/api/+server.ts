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


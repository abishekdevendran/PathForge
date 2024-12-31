import { relations } from 'drizzle-orm';
import { pgTable, serial, text, integer, pgEnum, date, boolean, unique, foreignKey, uniqueIndex } from 'drizzle-orm/pg-core';

export const goalTypesEnum = pgEnum('goal_type', ['qualitative', 'quantitative']);
// export const resourceTypesEnum = pgEnum('resource_type', ['time', 'money', 'cognitive']);

export const userTable = pgTable('user', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull(),
	password: text('password').notNull(),
})

// export const goalTypeTable = pgTable('goal_type', {
// 	id: serial('id').primaryKey(),
// 	name: text('name').notNull()
// });

export const goalTable = pgTable('goal', {
	id: serial('id').primaryKey(),
	userId: integer('user_id').references(() => userTable.id).notNull(),
	name: text('name').notNull(),
	description: text('description').notNull(),
	goalType: goalTypesEnum('goal_type').notNull(),
	deadline: date('deadline'),
	isRoot: boolean('is_root').notNull().default(false),
	unit: text('unit'),
	value: integer('value'),
	minValue: integer('min_value'),
	maxValue: integer('max_value'),
}, (t) => ({
    uniqueIdUser: uniqueIndex().on(t.id, t.userId), // Add a unique constraint
}));

export const relationShipTypeTable = pgTable('relationship_type', {
	id: serial('id').primaryKey(),
	name: text('name').notNull()
});

export const relationshipTable = pgTable('relationship', {
	id: serial('id').primaryKey(),
	relationshipType: integer('relationship_type').references(() => relationShipTypeTable.id).notNull(),
	userId: integer('user_id').references(() => userTable.id).notNull(),
	fromGoalId: integer('from_goal_id').references(() => goalTable.id),
	toGoalId: integer('to_goal_id').references(() => goalTable.id),
	weight: integer('weight').notNull()
}, (t) => ({
	fkFromComposite: foreignKey({
		columns: [t.fromGoalId, t.userId],
		foreignColumns: [goalTable.id, goalTable.userId],
	}),
	fkToComposite: foreignKey({
		columns: [t.toGoalId, t.userId],
		foreignColumns: [goalTable.id, goalTable.userId],
	}),
}));

// ------------------------------------------------------------

export const userRelationships = relations(userTable, ({ many }) => ({
	goals: many(goalTable),
}))

export const goalRelationships = relations(goalTable, ({ one }) => ({
	user: one(userTable, {
		fields: [goalTable.userId],
		references: [userTable.id],
	}),
}))

export const relationShipTypeRelationships = relations(relationShipTypeTable, ({ many }) => ({
	relationships: many(relationshipTable),
}))

export const relationshipRelationships = relations(relationshipTable, ({ one }) => ({
	relationshipType: one(relationShipTypeTable, {
		fields: [relationshipTable.relationshipType],
		references: [relationShipTypeTable.id],
	}),
	fromGoal: one(goalTable, {
		fields: [relationshipTable.fromGoalId],
		references: [goalTable.id],
	}),
	toGoal: one(goalTable, {
		fields: [relationshipTable.toGoalId],
		references: [goalTable.id],
	}),
}))
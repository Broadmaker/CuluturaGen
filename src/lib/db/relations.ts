// Drizzle relations for typed relational queries (db.query.* with `with`).
import { relations } from "drizzle-orm";
import {
  aiContexts,
  aiJobs,
  auditLogs,
  bodyProfiles,
  clients,
  costEstimates,
  costItems,
  culturalElementReferences,
  culturalElementRelationships,
  culturalElements,
  culturalReferences,
  culturalRestrictions,
  cultures,
  communities,
  designBriefs,
  designCulturalElements,
  designFeedback,
  designMaterials,
  designRequirements,
  designVersions,
  designs,
  evaluations,
  evaluationFindings,
  explanations,
  fileAssets,
  humanReviews,
  materialPrices,
  materials,
  projectCulturalElements,
  projects,
  reports,
  roles,
  userRoles,
  users,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  createdProjects: many(projects, { relationName: "createdProjects" }),
  assignedProjects: many(projects, { relationName: "assignedProjects" }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
    relationName: "createdProjects",
  }),
  designer: one(users, {
    fields: [projects.assignedDesigner],
    references: [users.id],
    relationName: "assignedProjects",
  }),
  clients: many(clients),
  bodyProfiles: many(bodyProfiles),
  briefs: many(designBriefs),
  designs: many(designs),
  aiJobs: many(aiJobs),
  fileAssets: many(fileAssets),
  reports: many(reports),
  basket: many(projectCulturalElements),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  project: one(projects, { fields: [clients.projectId], references: [projects.id] }),
  bodyProfiles: many(bodyProfiles),
}));

export const bodyProfilesRelations = relations(bodyProfiles, ({ one }) => ({
  project: one(projects, { fields: [bodyProfiles.projectId], references: [projects.id] }),
  client: one(clients, { fields: [bodyProfiles.clientId], references: [clients.id] }),
}));

export const designBriefsRelations = relations(designBriefs, ({ one, many }) => ({
  project: one(projects, { fields: [designBriefs.projectId], references: [projects.id] }),
  requirements: many(designRequirements),
}));

export const designRequirementsRelations = relations(designRequirements, ({ one }) => ({
  brief: one(designBriefs, {
    fields: [designRequirements.designBriefId],
    references: [designBriefs.id],
  }),
}));

export const culturesRelations = relations(cultures, ({ many }) => ({
  communities: many(communities),
  restrictions: many(culturalRestrictions),
}));

export const communitiesRelations = relations(communities, ({ one, many }) => ({
  culture: one(cultures, { fields: [communities.cultureId], references: [cultures.id] }),
  restrictions: many(culturalRestrictions),
}));

export const culturalElementsRelations = relations(culturalElements, ({ many }) => ({
  references: many(culturalElementReferences),
  restrictions: many(culturalRestrictions),
  designs: many(designCulturalElements),
  findings: many(evaluationFindings),
  outgoingLinks: many(culturalElementRelationships, { relationName: "outgoingLinks" }),
  incomingLinks: many(culturalElementRelationships, { relationName: "incomingLinks" }),
  basketEntries: many(projectCulturalElements),
}));

export const culturalReferencesRelations = relations(culturalReferences, ({ many }) => ({
  elements: many(culturalElementReferences),
}));

export const culturalElementReferencesRelations = relations(
  culturalElementReferences,
  ({ one }) => ({
    element: one(culturalElements, {
      fields: [culturalElementReferences.culturalElementId],
      references: [culturalElements.id],
    }),
    reference: one(culturalReferences, {
      fields: [culturalElementReferences.referenceId],
      references: [culturalReferences.id],
    }),
  }),
);

export const culturalRestrictionsRelations = relations(culturalRestrictions, ({ one }) => ({
  element: one(culturalElements, {
    fields: [culturalRestrictions.culturalElementId],
    references: [culturalElements.id],
  }),
  culture: one(cultures, {
    fields: [culturalRestrictions.cultureId],
    references: [cultures.id],
  }),
  community: one(communities, {
    fields: [culturalRestrictions.communityId],
    references: [communities.id],
  }),
}));

export const culturalElementRelationshipsRelations = relations(
  culturalElementRelationships,
  ({ one }) => ({
    source: one(culturalElements, {
      fields: [culturalElementRelationships.sourceElementId],
      references: [culturalElements.id],
      relationName: "outgoingLinks",
    }),
    target: one(culturalElements, {
      fields: [culturalElementRelationships.targetElementId],
      references: [culturalElements.id],
      relationName: "incomingLinks",
    }),
    culture: one(cultures, {
      fields: [culturalElementRelationships.cultureId],
      references: [cultures.id],
    }),
    community: one(communities, {
      fields: [culturalElementRelationships.communityId],
      references: [communities.id],
    }),
  }),
);

export const projectCulturalElementsRelations = relations(
  projectCulturalElements,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectCulturalElements.projectId],
      references: [projects.id],
    }),
    element: one(culturalElements, {
      fields: [projectCulturalElements.culturalElementId],
      references: [culturalElements.id],
    }),
  }),
);

export const materialsRelations = relations(materials, ({ many }) => ({
  prices: many(materialPrices),
  designMaterials: many(designMaterials),
  costItems: many(costItems),
}));

export const materialPricesRelations = relations(materialPrices, ({ one }) => ({
  material: one(materials, { fields: [materialPrices.materialId], references: [materials.id] }),
}));

export const designsRelations = relations(designs, ({ one, many }) => ({
  project: one(projects, { fields: [designs.projectId], references: [projects.id] }),
  versions: many(designVersions),
  aiJobs: many(aiJobs),
}));

export const designVersionsRelations = relations(designVersions, ({ one, many }) => ({
  design: one(designs, { fields: [designVersions.designId], references: [designs.id] }),
  parent: one(designVersions, {
    fields: [designVersions.parentVersionId],
    references: [designVersions.id],
    relationName: "versionLineage",
  }),
  children: many(designVersions, { relationName: "versionLineage" }),
  culturalElements: many(designCulturalElements),
  materials: many(designMaterials),
  aiContexts: many(aiContexts),
  aiJobs: many(aiJobs),
  costEstimates: many(costEstimates),
  evaluations: many(evaluations),
  explanations: many(explanations),
  humanReviews: many(humanReviews),
  feedback: many(designFeedback),
  fileAssets: many(fileAssets),
  reports: many(reports),
}));

export const designCulturalElementsRelations = relations(
  designCulturalElements,
  ({ one }) => ({
    version: one(designVersions, {
      fields: [designCulturalElements.designVersionId],
      references: [designVersions.id],
    }),
    element: one(culturalElements, {
      fields: [designCulturalElements.culturalElementId],
      references: [culturalElements.id],
    }),
  }),
);

export const designMaterialsRelations = relations(designMaterials, ({ one }) => ({
  version: one(designVersions, {
    fields: [designMaterials.designVersionId],
    references: [designVersions.id],
  }),
  material: one(materials, {
    fields: [designMaterials.materialId],
    references: [materials.id],
  }),
}));

export const aiContextsRelations = relations(aiContexts, ({ one }) => ({
  version: one(designVersions, {
    fields: [aiContexts.designVersionId],
    references: [designVersions.id],
  }),
}));

export const aiJobsRelations = relations(aiJobs, ({ one }) => ({
  project: one(projects, { fields: [aiJobs.projectId], references: [projects.id] }),
  design: one(designs, { fields: [aiJobs.designId], references: [designs.id] }),
  version: one(designVersions, {
    fields: [aiJobs.designVersionId],
    references: [designVersions.id],
  }),
}));

export const costEstimatesRelations = relations(costEstimates, ({ one, many }) => ({
  version: one(designVersions, {
    fields: [costEstimates.designVersionId],
    references: [designVersions.id],
  }),
  items: many(costItems),
}));

export const costItemsRelations = relations(costItems, ({ one }) => ({
  estimate: one(costEstimates, {
    fields: [costItems.costEstimateId],
    references: [costEstimates.id],
  }),
  material: one(materials, {
    fields: [costItems.materialId],
    references: [materials.id],
  }),
}));

export const evaluationsRelations = relations(evaluations, ({ one, many }) => ({
  version: one(designVersions, {
    fields: [evaluations.designVersionId],
    references: [designVersions.id],
  }),
  findings: many(evaluationFindings),
}));

export const evaluationFindingsRelations = relations(evaluationFindings, ({ one }) => ({
  evaluation: one(evaluations, {
    fields: [evaluationFindings.evaluationId],
    references: [evaluations.id],
  }),
  element: one(culturalElements, {
    fields: [evaluationFindings.relatedCulturalElement],
    references: [culturalElements.id],
  }),
}));

export const explanationsRelations = relations(explanations, ({ one }) => ({
  version: one(designVersions, {
    fields: [explanations.designVersionId],
    references: [designVersions.id],
  }),
}));

export const humanReviewsRelations = relations(humanReviews, ({ one }) => ({
  version: one(designVersions, {
    fields: [humanReviews.designVersionId],
    references: [designVersions.id],
  }),
}));

export const designFeedbackRelations = relations(designFeedback, ({ one }) => ({
  version: one(designVersions, {
    fields: [designFeedback.designVersionId],
    references: [designVersions.id],
  }),
}));

export const fileAssetsRelations = relations(fileAssets, ({ one }) => ({
  project: one(projects, { fields: [fileAssets.projectId], references: [projects.id] }),
  version: one(designVersions, {
    fields: [fileAssets.designVersionId],
    references: [designVersions.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  project: one(projects, { fields: [reports.projectId], references: [projects.id] }),
  version: one(designVersions, {
    fields: [reports.designVersionId],
    references: [designVersions.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

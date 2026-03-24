import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2),
    workspaceName: z.string().min(2).default("Default Workspace"),
    role: z.enum(["student", "teacher"]).optional().default("student"),
    schoolCode: z.string().optional().default(""),
    instructor: z.string().optional().default(""),
    period: z.string().optional().default(""),
    groupCode: z.string().optional().default(""),
    studentCode: z.string().optional().default(""),
    joinWorkspaceId: z.string().uuid().optional(),
    joinCode: z.string().min(4).optional(),
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

export const createJoinCodeSchema = z.object({
  body: z.object({
    code: z.string().min(4).max(32),
    schoolCode: z.string().optional().default(""),
    instructor: z.string().optional().default(""),
    active: z.boolean().optional().default(true),
  }),
  params: z.object({
    workspaceId: z.string().uuid(),
  }),
  query: z.object({}).passthrough(),
});

export const toggleJoinCodeSchema = z.object({
  body: z.object({
    active: z.boolean(),
  }),
  params: z.object({
    workspaceId: z.string().uuid(),
    codeId: z.string().uuid(),
  }),
  query: z.object({}).passthrough(),
});

export const resetStudentPasswordSchema = z.object({
  body: z.object({
    newPassword: z.string().min(8),
  }),
  params: z.object({
    workspaceId: z.string().uuid(),
    userId: z.string().uuid(),
  }),
  query: z.object({}).passthrough(),
});

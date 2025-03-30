import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (keeping the base schema from the template)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Documents schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  filesize: integer("filesize").notNull(),
  filetype: text("filetype").notNull(),
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  content: text("content"), // Extracted text content for search
  path: text("path").notNull(), // Local file path
  selected: boolean("selected").default(false), // Whether doc is selected for chat
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadDate: true,
});

// Chat messages schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  documentIds: text("document_ids").array(), // IDs of documents referenced
  modelUsed: text("model_used"), // Model used for assistant messages
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

// Settings schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  selectedModel: text("selected_model").default("mistral"),
  temperature: text("temperature").default("0.7"),
  temperatureProfile: text("temperature_profile").default("default"),
  contextLength: integer("context_length").default(4096),
  chunkSize: integer("chunk_size").default(512),
  topP: text("top_p").default("0.9"),
  ecoMode: boolean("eco_mode").default(true),
  gpuAcceleration: boolean("gpu_acceleration").default(true),
  ttsEnabled: boolean("tts_enabled").default(true),
  ttsVoice: text("tts_voice").default("alloy"),
  ttsSpeechRate: text("tts_speech_rate").default("1.0"),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

// Ollama models schema
export const ollamaModels = pgTable("ollama_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  size: text("size"),
  modified: timestamp("modified"),
  details: jsonb("details"),
});

export const insertOllamaModelSchema = createInsertSchema(ollamaModels).omit({
  id: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

export type OllamaModel = typeof ollamaModels.$inferSelect;
export type InsertOllamaModel = z.infer<typeof insertOllamaModelSchema>;

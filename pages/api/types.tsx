import { Pool } from "pg";

export type TMenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
};

export type DbClient = {
  query: <T>(sql: string, values?: unknown[]) => Promise<{ rows: T[] }>;
};

export type TMutationResponse = {
  success: boolean;
  message?: string;
  menuItem?: TMenuItem;
};

export type GraphQLContext = {
  db: Pool & DbClient;
};

import { Pool } from "pg";

export type TMenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
};

export type DbClient = {
  query: <T>(sql: string, values?: any[]) => Promise<{ rows: T[] }>;
};

export type GraphQLContext = {
  db: Pool & DbClient;
};

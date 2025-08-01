import "dotenv/config";
import { ApolloServer, gql } from "apollo-server-micro";
import { MicroRequest } from "apollo-server-micro/dist/types";
import { ServerResponse } from "http";
import { Pool } from "pg";

import { TMenuItem, GraphQLContext } from "./types";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool
  .connect()
  .then((client) => {
    console.log("Successfully connected to PostgreSQL!");
    client.release();
  })
  .catch((err) => {
    console.error("Error connecting to PostgreSQL:", err.message);
    console.error("DATABASE_URL:", process.env.DATABASE_URL);
  });

const typeDefs = gql`
  type TMenuItem {
    id: ID!
    name: String
    description: String
    price: Float
    image: String
  }
  type Query {
    menuItems: [TMenuItem]
  }
  type Mutation {
    addMenuItem(
      name: String!
      description: String!
      price: Float!
      image: String!
    ): TMenuItem
  }
`;

const resolvers = {
  Query: {
    menuItems: async (
      _: undefined,
      __: undefined,
      context: GraphQLContext
    ): Promise<TMenuItem[]> => {
      const { rows } = await context.db.query<TMenuItem>(
        "SELECT * FROM menu_items"
      );
      return rows;
    },
  },
  Mutation: {
    addMenuItem: async (
      _: undefined,
      { name, description, price, image }: Omit<TMenuItem, "id">,
      context: GraphQLContext
    ): Promise<TMenuItem> => {
      const { db } = context;
      const query = `
        INSERT INTO menu_items (name, description, price, image)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const values = [name, description, price, image];
      const { rows } = await db.query<TMenuItem>(query, values);
      return rows[0];
    },
  },
};

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: async (): Promise<GraphQLContext> => ({ db: pool }),
});

const startServer = apolloServer.start();

export default async function handler(req: MicroRequest, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://studio.apollographql.com"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  if (req.method === "OPTIONS") {
    res.end();
    return false;
  }
  await startServer;
  await apolloServer.createHandler({
    path: "/api/graphql",
  })(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

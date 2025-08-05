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
    id: Int
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

const triggerWebhook = async (item: TMenuItem) => {
  const WEBHOOK_URL = process.env.WEBHOOK_URL;
  if (!WEBHOOK_URL) {
    console.error("WEBHOOK_URL is not defined in the environment variables.");
    return;
  }

  const payload = {
    event: "new_menu_item_created",
    timestamp: new Date().toISOString(),
    item: {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
    },
  };

  console.log("Triggering webhook with payload:", payload);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log("Webhook successfully triggered!");
    } else {
      console.error(
        "Failed to trigger webhook:",
        response.status,
        response.statusText
      );
    }
  } catch (error) {
    console.error("Error triggering webhook:", error);
  }
};

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
      const newItem = rows[0];

      triggerWebhook(newItem);

      return newItem;
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

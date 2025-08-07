import "dotenv/config";
import { ApolloServer, gql } from "apollo-server-micro";
import { MicroRequest } from "apollo-server-micro/dist/types";
import { ServerResponse } from "http";
import { Pool } from "pg";

import { TMenuItem, GraphQLContext, TMutationResponse } from "./types";

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

const simulateDelayedTask = (itemId: number) => {
  const DELAY_MS = 10000;

  console.log(
    `[Background Task] Scheduling delayed task for item ID: ${itemId}. Will complete in ${
      DELAY_MS / 1000
    } seconds.`
  );

  setTimeout(() => {
    console.log(
      `[Background Task] Sync complete for item ID: ${itemId} at ${new Date().toISOString()}`
    );
  }, DELAY_MS);
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
    menuItem: async (
      _: undefined,
      { id }: { id: number },
      context: GraphQLContext
    ): Promise<TMenuItem | null> => {
      const { rows } = await context.db.query<TMenuItem>(
        "SELECT * FROM menu_items WHERE id = $1",
        [id]
      );
      return rows[0] || null;
    },
  },
  Mutation: {
    addMenuItem: async (
      _: undefined,
      { name, description, price, image }: Omit<TMenuItem, "id">,
      context: GraphQLContext
    ): Promise<TMutationResponse> => {
      const { db } = context;

      // Валидация данных
      if (!name || !description || price <= 0 || !image) {
        return {
          success: false,
          message:
            "Invalid input data. All fields are required and price must be a positive number.",
        };
      }

      try {
        const query = `
          INSERT INTO menu_items (name, description, price, image)
          VALUES ($1, $2, $3, $4)
          RETURNING *;
        `;
        const values = [name, description, price, image];
        const { rows } = await db.query<TMenuItem>(query, values);
        const newItem = rows[0];

        triggerWebhook(newItem);
        simulateDelayedTask(newItem.id);

        return {
          success: true,
          message: "Menu item successfully created!",
          menuItem: newItem,
        };
      } catch (error) {
        console.error("Error creating menu item:", error);
        return { success: false, message: "Error creating menu item." };
      }
    },

    updateMenuItem: async (
      _: undefined,
      { id, name, description, price, image }: Partial<TMenuItem>,
      context: GraphQLContext
    ): Promise<TMutationResponse> => {
      const { db } = context;

      // Валидация id и хотя бы одного поля
      if (!id) {
        return { success: false, message: "ID is required to update an item." };
      }
      if (!name && !description && !price && !image) {
        return {
          success: false,
          message:
            "At least one field (name, description, price, or image) must be provided for update.",
        };
      }
      if (price !== undefined && price <= 0) {
        return { success: false, message: "Price must be a positive number." };
      }

      try {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (name) {
          fields.push(`name = $${paramIndex++}`);
          values.push(name);
        }
        if (description) {
          fields.push(`description = $${paramIndex++}`);
          values.push(description);
        }
        if (price) {
          fields.push(`price = $${paramIndex++}`);
          values.push(price);
        }
        if (image) {
          fields.push(`image = $${paramIndex++}`);
          values.push(image);
        }

        values.push(id);

        const query = `
          UPDATE menu_items
          SET ${fields.join(", ")}
          WHERE id = $${paramIndex}
          RETURNING *;
        `;

        const { rows } = await db.query<TMenuItem>(query, values);

        if (rows.length === 0) {
          return {
            success: false,
            message: `Menu item with ID ${id} not found.`,
          };
        }

        return {
          success: true,
          message: "Menu item successfully updated!",
          menuItem: rows[0],
        };
      } catch (error) {
        console.error("Error updating menu item:", error);
        return { success: false, message: "Error updating menu item." };
      }
    },

    deleteMenuItem: async (
      _: undefined,
      { id }: { id: number },
      context: GraphQLContext
    ): Promise<TMutationResponse> => {
      const { db } = context;

      // Валидация id
      if (!id) {
        return { success: false, message: "ID is required to delete an item." };
      }

      try {
        const query = `
          DELETE FROM menu_items
          WHERE id = $1
          RETURNING id;
        `;
        const { rows } = await db.query(query, [id]);

        if (rows.length > 0) {
          return { success: true, message: "Menu item successfully deleted!" };
        } else {
          return {
            success: false,
            message: `Menu item with ID ${id} not found.`,
          };
        }
      } catch (error) {
        console.error("Error deleting menu item:", error);
        return { success: false, message: "Error deleting menu item." };
      }
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

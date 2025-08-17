import "dotenv/config";
import { ApolloServer, gql } from "apollo-server-micro";
import { MicroRequest } from "apollo-server-micro/dist/types";
import { ServerResponse } from "http";
import { PrismaClient } from "@prisma/client";

import { TMenuItem, GraphQLContext, TMutationResponse } from "./types";

const prisma = new PrismaClient();

const typeDefs = gql`
  type TMenuItem {
    id: Int
    name: String
    description: String
    price: Float
    image: String
  }
  type TMutationResponse {
    success: Boolean!
    message: String
    menuItem: TMenuItem
  }
  type Query {
    menuItems: [TMenuItem]
    menuItem(id: Int!): TMenuItem
  }
  type Mutation {
    addMenuItem(
      name: String!
      description: String!
      price: Float!
      image: String!
    ): TMutationResponse
    updateMenuItem(
      id: Int!
      name: String
      description: String
      price: Float
      image: String
    ): TMutationResponse
    deleteMenuItem(id: Int!): TMutationResponse
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
      const { prisma } = context;
      return prisma.tMenuItem.findMany();
    },
    menuItem: async (
      _: undefined,
      { id }: { id: number },
      context: GraphQLContext
    ): Promise<TMenuItem | null> => {
      const { prisma } = context;
      return prisma.tMenuItem.findUnique({
        where: {
          id,
        },
      });
    },
  },
  Mutation: {
    addMenuItem: async (
      _: undefined,
      { name, description, price, image }: Omit<TMenuItem, "id">,
      context: GraphQLContext
    ): Promise<TMutationResponse> => {
      const { prisma } = context;

      if (!name || !description || price <= 0 || !image) {
        return {
          success: false,
          message:
            "Invalid input data. All fields are required and price must be a positive number.",
        };
      }

      try {
        const newItem = await prisma.tMenuItem.create({
          data: {
            name,
            description,
            price,
            image,
          },
        });

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
      const { prisma } = context;

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
        const updatedItem = await prisma.tMenuItem.update({
          where: { id },
          data: { name, description, price, image },
        });

        if (!updatedItem) {
          return {
            success: false,
            message: `Menu item with ID ${id} not found.`,
          };
        }

        return {
          success: true,
          message: "Menu item successfully updated!",
          menuItem: updatedItem,
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
      const { prisma } = context;

      if (!id) {
        return { success: false, message: "ID is required to delete an item." };
      }

      try {
        const deletedItem = await prisma.tMenuItem.delete({
          where: { id },
        });

        if (deletedItem) {
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
  context: async (): Promise<GraphQLContext> => ({ prisma }),
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

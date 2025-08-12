import { PrismaClient } from "@prisma/client";

export type TMenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
};

export type TMutationResponse = {
  success: boolean;
  message?: string;
  menuItem?: TMenuItem;
};

export type GraphQLContext = {
  prisma: PrismaClient;
};

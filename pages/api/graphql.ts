import { ApolloServer, gql } from "apollo-server-micro";
import { MicroRequest } from "apollo-server-micro/dist/types";
import { ServerResponse } from "http";

let menuItems = [
  {
    id: "1",
    name: "Classic Burger",
    description: "Beef cutlet, cheese, salad, sauce",
    price: 350,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
  },
  {
    id: "2",
    name: "Caesar salad",
    description: "Chicken, lettuce, croutons, sauce",
    price: 280,
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1",
  },
  {
    id: "3",
    name: "Tiramisu",
    description: "Classic Italian dessert",
    price: 220,
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb",
  },
];

const typeDefs = gql`
  type MenuItem {
    id: ID!
    name: String
    description: String
    price: Float
    image: String
  }

  type Query {
    menuItems: [MenuItem]
  }

  type Mutation {
    addMenuItem(
      name: String!
      description: String!
      price: Float!
      image: String!
    ): MenuItem
  }
`;

const resolvers = {
  Query: {
    menuItems: () => menuItems,
  },
  Mutation: {
    addMenuItem: (_: any, { name, description, price, image }: any) => {
      const newItem = {
        id: crypto.randomUUID(),
        name,
        description,
        price,
        image,
      };
      menuItems.push(newItem);
      return newItem;
    },
  },
};

const apolloServer = new ApolloServer({ typeDefs, resolvers });

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

import { useState } from "react";
import MenuCard from "../packages/components/menu-card";
import MenuForm from "../packages/components/menu-form";
import Modal from "../packages/components/modal";
import SearchBar from "../packages/components/search-bar";
import {
  ApolloProvider,
  ApolloClient,
  InMemoryCache,
  gql,
  useQuery,
  useMutation,
} from "@apollo/client";

const client = new ApolloClient({
  uri: "/api/graphql",
  cache: new InMemoryCache(),
});

const GET_MENU_ITEMS = gql`
  query GetMenuItems {
    menuItems {
      id
      name
      description
      price
      image
    }
  }
`;

const ADD_MENU_ITEM = gql`
  mutation AddMenuItem(
    $name: String!
    $description: String!
    $price: Float!
    $image: String!
  ) {
    addMenuItem(
      name: $name
      description: $description
      price: $price
      image: $image
    ) {
      id
      name
      description
      price
      image
    }
  }
`;

function MenuPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, loading, error } = useQuery(GET_MENU_ITEMS);

  const [addItemMutation] = useMutation(ADD_MENU_ITEM, {
    refetchQueries: [{ query: GET_MENU_ITEMS }],
  });

  const addItem = (item: {
    name: string;
    description: string;
    price: number;
    image: string;
  }) => {
    addItemMutation({ variables: item });
    setIsModalOpen(false);
  };

  const filteredItems =
    data?.menuItems.filter((item: any) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="">
      <h1 className="">Menu</h1>
      <SearchBar query={searchQuery} onSearchChange={handleSearchChange} />
      <button
        onClick={() => setIsModalOpen(true)}
        className="p-2 mb-4 text-white bg-green-500 rounded"
      >
        Add New Item
      </button>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <MenuForm onAddItem={addItem} />
      </Modal>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ">
        {filteredItems.map((item: any) => (
          <MenuCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ApolloProvider client={client}>
      <MenuPage />
    </ApolloProvider>
  );
}

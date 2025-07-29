import { useEffect, useState } from "react";
import MenuCard from "../packages/components/menu-card";
import MenuForm from "../packages/components/menu-form";
import Modal from "../packages/components/modal";
import SearchBar from "../packages/components/search-bar";

const starterItems = [
  {
    id: 1,
    name: "Classic Burger",
    description: "Beef cutlet, cheese, salad, sauce",
    price: 350,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
  },
  {
    id: 2,
    name: "Caesar salad",
    description: "Chicken, lettuce, croutons, sauce",
    price: 280,
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1",
  },
  {
    id: 3,
    name: "Tiramisu",
    description: "Classic Italian dessert",
    price: 220,
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb",
  },
];

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (menuItems.length === 0) {
      setMenuItems(starterItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addItem = (item: {
    name: string;
    description: string;
    price: number;
    image: string;
  }) => {
    setMenuItems((prevItems) => [
      ...prevItems,
      { ...item, id: crypto.randomUUID() },
    ]);
  };

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

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
        {filteredItems.map((item) => (
          <MenuCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

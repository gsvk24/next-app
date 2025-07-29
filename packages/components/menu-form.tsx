import { useState } from "react";

type TMenuFormProps = {
  onAddItem: (item: {
    name: string;
    description: string;
    price: number;
    image: string;
  }) => void;
};

const MenuForm: React.FC<TMenuFormProps> = ({ onAddItem }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [image, setImage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddItem({ name, description, price, image });
    setName("");
    setDescription("");
    setPrice(0);
    setImage("");
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full p-2 mb-2 border"
      />
      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        className="w-full p-2 mb-2 border"
      />
      <input
        type="number"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        required
        className="w-full p-2 mb-2 border"
      />
      <input
        type="text"
        placeholder="Image URL"
        value={image}
        onChange={(e) => setImage(e.target.value)}
        required
        className="w-full p-2 mb-2 border"
      />
      <button type="submit" className="p-2 text-white bg-blue-500 rounded">
        Add Item
      </button>
    </form>
  );
};

export default MenuForm;

"use client";

import { useParams } from "next/navigation";

const Category = () => {
  const params = useParams();
  const category = params.category;
  console.log(category);
  return <div>{category}</div>;
};

export default Category;

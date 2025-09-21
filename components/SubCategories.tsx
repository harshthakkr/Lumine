export const SubCategories = ({
  subcategories,
}: {
  subcategories: string[];
}) => {
  return (
    <ul className="flex flex-col items-center gap-3">
      {subcategories.map((subcategory, i) => (
        <li
          key={i}
          className="bg-secondary border border-primary/20 px-4 py-2 rounded-full"
        >
          {subcategory}
        </li>
      ))}
    </ul>
  );
};

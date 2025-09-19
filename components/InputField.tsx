import { formDataProps } from "./Form";

export const InputField = ({
  label,
  type,
  placeholder,
  data,
  setData,
  value,
  isDisabled,
  fieldName,
  error,
}: {
  label: string;
  type: string;
  placeholder?: string;
  data: formDataProps;
  setData: (prev: formDataProps) => void;
  value: string;
  isDisabled?: boolean;
  fieldName: keyof formDataProps;
  error?: string;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [fieldName]: e.target.value,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-accent uppercase">{label}</label>
      <input
        onChange={handleChange}
        type={type}
        placeholder={placeholder || ""}
        value={value}
        className={`border-b outline-none pb-1 text-neutral-dark transition-colors duration-300 ${
          error ? "border-red-500" : "border-neutral-dark"
        }`}
        disabled={isDisabled}
      />
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          error ? "max-h-6 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <span className="text-red-500 text-xs block transform transition-transform duration-300">
          {error || ""}
        </span>
      </div>
    </div>
  );
};

"use client";

import z from "zod";
import { InputField } from "./InputField";
import { useState } from "react";
import { Confirmation } from "./Confirmation";

const formSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: "Name must be atleast 2 characters long" }),
  email: z.string().email({ message: "Invalid email address" }),
  selectedCategory: z.string().min(1, { message: "Please select a category" }),
  artist: z.string().min(1, { message: "Please select an artist" }),
  dateAndTime: z.string().min(1, { message: "Please select date and time" }),
});

export interface formDataProps {
  fullName: string;
  email: string;
  selectedCategory: string;
  artist: string;
  dateAndTime: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  selectedCategory?: string;
  artist?: string;
  dateAndTime?: string;
}

export const Form = () => {
  const [formData, setFormData] = useState<formDataProps>({
    fullName: "",
    email: "",
    selectedCategory: localStorage?.getItem("category") || "",
    artist: localStorage.getItem("artist") || "",
    dateAndTime: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const validateForm = () => {
    try {
      formSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof FormErrors] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (validateForm()) {
      try {
        setIsConfirmed(true);
      } catch (error) {
        console.error("Submission error:", error);
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen font-inter bg-secondary/50 flex justify-center items-center drop-shadow-2xl">
      {!isConfirmed ? (
        <form
          onSubmit={handleSubmit}
          className="min-w-100 bg-neutral-light flex flex-col gap-8 p-12 text-sm"
        >
          <InputField
            label="Full Name"
            type="text"
            placeholder="Your name here"
            data={formData}
            setData={setFormData}
            value={formData.fullName}
            fieldName="fullName"
            error={errors.fullName}
          />
          <InputField
            label="Email"
            type="email"
            placeholder="Eg. yourname@gmail.com"
            data={formData}
            setData={setFormData}
            value={formData.email}
            fieldName="email"
            error={errors.email}
          />
          <InputField
            label="Selected Category"
            type="text"
            data={formData}
            setData={setFormData}
            value={formData.selectedCategory}
            fieldName="selectedCategory"
            error={errors.selectedCategory}
            isDisabled
          />
          <InputField
            label="Artist"
            type="text"
            data={formData}
            setData={setFormData}
            value={formData.artist}
            fieldName="artist"
            error={errors.artist}
            isDisabled
          />
          <InputField
            label="Date and Time"
            type="datetime-local"
            data={formData}
            setData={setFormData}
            value={formData.dateAndTime}
            fieldName="dateAndTime"
            error={errors.dateAndTime}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className={`py-2 text-neutral-light cursor-pointer duration-200 ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary hover:bg-primary-hover"
            }`}
          >
            {isSubmitting ? "Booking..." : "Book"}
          </button>
        </form>
      ) : (
        <Confirmation
          bookingDateTime={formData.dateAndTime}
          artist={formData.artist}
          category={formData.selectedCategory}
        />
      )}
    </div>
  );
};

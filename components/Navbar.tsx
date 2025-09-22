"use client";

import Link from "next/link";
import { CTA } from "./CTA";
import { useState } from "react";
import { CloseIcon } from "./icons/CloseIcon";
import { HamburgerIcon } from "./icons/HamburgerIcon";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleClick = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div
      id="top"
      className="relative flex justify-between items-center uppercase text-neutral-dark px-4 py-2 sm:px-8 md:py-4 lg:px-20"
    >
      <span className="font-playfair-display text-xl tracking-widest cursor-pointer">
        Luminé
      </span>
      <button className="md:hidden cursor-pointer" onClick={handleClick}>
        {isOpen ? <CloseIcon /> : <HamburgerIcon />}
      </button>
      <ul
        className={`absolute md:static ${
          !isOpen && "hidden md:flex"
        } bg-neutral-light z-50 w-full md:relative md:w-auto text-center top-11 py-8 md:py-0 -mx-4 sm:-mx-8 md:mx-0 flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-10 font-inter text-sm font-light tracking-wide lg:tracking-wider`}
      >
        <li>
          <Link href="#categories" className="hover:text-accent duration-200">
            Categories
          </Link>
        </li>
        <li>
          <Link href="#" className="hover:text-accent duration-200">
            Browse Artists
          </Link>
        </li>
        <li>
          <Link href="#" className="hover:text-accent duration-200">
            About
          </Link>
        </li>
        <li>
          <Link href="#" className="hover:text-accent duration-200">
            Contact
          </Link>
        </li>
        {isOpen && (
          <div className="block md:hidden">
            <CTA id="#categories" />
          </div>
        )}
      </ul>
      <div className="hidden md:block">
        <CTA id="#categories" />
      </div>
    </div>
  );
};

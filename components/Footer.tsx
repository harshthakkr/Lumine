import { FooterLink } from "./FooterLink";
import { FooterHeading } from "./FooterHeading";

export const Footer = () => {
  return (
    <div className="bg-secondary flex justify-center items-center">
      <div className="bg-neutral-light text-neutral-dark w-full m-4 sm:m-5 p-8 sm:p-12 rounded-lg drop-shadow-2xl/25">
        <div className="grid grid-cols-3 mb-8 sm:mb-12 gap-3 border-b border-primary/40 pb-8 sm:pb-12">
          <div>
            <FooterHeading title="Company" />
            <ul className="flex flex-col gap-4 font-inter">
              <FooterLink text="Home" />
              <FooterLink text="Categories" id="#categories" />
              <FooterLink text="About" />
              <FooterLink text="Contact" />
            </ul>
          </div>
          <div>
            <FooterHeading title="Legal" />
            <ul className="flex flex-col gap-4 font-inter">
              <FooterLink text="Legal Terms" />
              <FooterLink text="Privacy Policy" />
              <FooterLink text="Cookie Management" />
            </ul>
          </div>
          <div>
            <FooterHeading title="Follow Us" />
            <ul className="flex flex-col gap-4 font-inter">
              <FooterLink text="Instagram" />
              <FooterLink text="Facebook" />
              <FooterLink text="X / Twitter" />
            </ul>
          </div>
        </div>
        <div className="w-full text-center cursor-pointer font-playfair-display text-neutral-dark uppercase tracking-widest text-4xl">
          Luminé
        </div>
      </div>
    </div>
  );
};

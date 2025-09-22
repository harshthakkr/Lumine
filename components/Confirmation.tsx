import { SuccessIcon } from "./icons/SuccessIcon";

export const Confirmation = ({
  email,
  bookingDateTime,
  price,
  artist,
  category,
}: {
  email: string;
  bookingDateTime: Date;
  price: string;
  artist: string;
  category: string;
}) => {
  return (
    <div className="bg-neutral-light text-neutral-dark px-4 py-4 xs:px-12 xs:py-8">
      <div className="flex justify-center items-center">
        <SuccessIcon />
      </div>
      <h3 className="font-inter font-semibold text-green-700 mb-2 uppercase text-center">
        Booking Confirmed!
      </h3>
      <p className="text-center mx-auto max-w-100 text-sm text-neutral-dark/90">
        Thank you, your booking has been confirmed! A confirmation email has
        been sent to{" "}
        <span className="font-semibold text-neutral-dark">{email}</span>.
      </p>
      <h4 className="uppercase text-sm text-center font-medium pb-1 underline m-4">
        Order Details
      </h4>
      <div className="max-w-fit mx-auto grid grid-cols-2 gap-4">
        <div className="uppercase grid text-xs col-span-1 space-y-1">
          <p>Booking Id</p>
          <p>Booking Date</p>
          <p>Price</p>
          <p>Artist</p>
          <p>Category</p>
        </div>
        <div className="text-xs col-span-1 text-neutral-dark/70 space-y-1">
          <p>{Math.ceil(Math.random() * 1000)}</p>
          <p>
            {bookingDateTime.toLocaleDateString("en-IN", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
          <p>${price}</p>
          <p>{artist}</p>
          <p>{category}</p>
        </div>
      </div>
    </div>
  );
};

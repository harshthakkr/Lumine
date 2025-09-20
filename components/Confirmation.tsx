export const Confirmation = () => {
  return (
    <div className="bg-neutral-light text-neutral-dark p-12">
      <div className="flex justify-center items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="green"
          className="size-8"
        >
          <path
            fillRule="evenodd"
            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <h3 className="font-inter font-semibold text-green-700 mb-2 uppercase text-center">
        Booking Confirmed!
      </h3>
      <p className="text-center mx-auto max-w-100 text-sm text-neutral-dark/90">
        Thank you, your booking has been confirmed! A confirmation email has
        been sent to{" "}
        <span className="font-semibold text-neutral-dark">(email)</span>.
      </p>
      <h4 className="uppercase text-center font-medium underline m-4">
        Order Details
      </h4>
      <div className="grid grid-cols-2">
        <div></div>
        <div></div>
      </div>
    </div>
  );
};

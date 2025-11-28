export type TermsSection = {
  title: string;
  body: string;
};

export const rideTermsSections: TermsSection[] = [
  {
    title: "General Conduct",
    body: "Passengers must behave respectfully towards the driver and other passengers at all times. Any form of harassment, discrimination, or disruptive behavior will result in immediate removal from the platform. Please maintain a friendly and professional demeanor throughout the ride.",
  },
  {
    title: "Safety & Responsibility",
    body: "Seatbelts must be worn where available. The platform acts solely as a connection service and is not liable for any accidents, injuries, or damages that may occur during the ride. Drivers are responsible for vehicle maintenance and insurance. Passengers are responsible for their own safety and personal belongings.",
  },
  {
    title: "Payments & Cancellations",
    body: "Passengers agree to pay the agreed fare at the end of the trip as displayed in the ride details. Cancellations must be made at least 2 hours before the scheduled departure time to avoid penalties. Late cancellations may result in a partial fare charge and affect your reliability score.",
  },
  {
    title: "Environmental Commitment",
    body: "By using our green mobility platform, you agree to our mission of reducing carbon emissions through shared transportation. We encourage respectful use of resources and appreciate your contribution to sustainable travel. Points and rewards are calculated based on CO₂ savings achieved through carpooling.",
  },
  {
    title: "Data & Tracking Consent",
    body: "You consent to the collection and use of ride data including GPS location during active rides, for the purposes of ride tracking, safety features, CO₂ calculation, and service improvement. Your personal information will be handled in accordance with our Privacy Policy. Location tracking is only active during ongoing rides.",
  },
  {
    title: "Verification & Trust",
    body: "All users must complete KYC verification to access ride booking features. OTP verification is required before each ride begins to ensure passenger identity. Drivers have the right to reject passenger requests at their discretion. False information or fraudulent activity will result in permanent account suspension.",
  },
];


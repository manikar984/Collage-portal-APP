/**
 * Expo / React Navigation map for the phone app.
 * The web portal implements the same information architecture.
 * Bottom tabs: Home, Academics, Fees, Profile.
 * Nested stacks hold the vault screens so a tab never loses its place.
 */
export const campusNavigation = {
  tabs: [
    {
      name: "Home",
      stack: ["Dashboard", "DigitalId", "HallTicket", "Circulars", "QuestionPapers", "PaperReader"],
    },
    {
      name: "Academics",
      stack: ["Progress", "Attendance", "Scholarships"],
    },
    {
      name: "Fees",
      stack: ["Invoices", "Checkout", "ReceiptPdf"],
    },
    {
      name: "Profile",
      stack: ["Identity", "GatePass", "GateScan", "Settings"],
    },
  ],
} as const;

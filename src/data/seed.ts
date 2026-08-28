import type { DB } from "./types";

const now = new Date();
const day = (offset: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + offset);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
};

export const MODULES: DB["modules"] = [
  { id: "tailoring", name: "Tailoring", description: "Stitching orders, measurements, delivery tracking", icon: "✂️", enabled: true, core: true },
  { id: "sales", name: "Material Sales", description: "Sell fabric & materials over the counter", icon: "🧵", enabled: true, core: false },
  { id: "payments", name: "Payments", description: "Advances, balances & transaction history", icon: "₹", enabled: true, core: true },
  { id: "reports", name: "Reports", description: "Revenue, workload & outstanding balances", icon: "▤", enabled: true, core: false },
  { id: "course", name: "Course Management", description: "Run tailoring classes & track students", icon: "🎓", enabled: false, core: false },
  { id: "courier", name: "Dispatch & Courier", description: "Outside orders, tracking & handover", icon: "📦", enabled: false, core: false },
];

export function seed(): DB {
  return {
    shop: { name: "Silai Studio", owner: "Aryansh", batch: "24BCE", phone: "+91 90000 00000" },
    modules: MODULES,
    users: [
      { id: "USR-owner", phone: "+91 90000 00000", name: "Aryansh", role: "owner", createdAt: day(-320), lastLogin: day(-1) },
      { id: "USR-01", phone: "+91 98110 20304", name: "Anjali Sharma", role: "member", familyId: "FAM-01", createdAt: day(-318), lastLogin: day(-4) },
      { id: "USR-02", phone: "+91 90045 88123", name: "Meera Iyer", role: "member", familyId: "FAM-02", createdAt: day(-205), lastLogin: day(-12) },
      { id: "USR-03", phone: "+91 99206 44510", name: "Sana Khan", role: "member", familyId: "FAM-03", createdAt: day(-138), lastLogin: day(-2) },
    ],
    activity: [
      { id: "A1", at: day(-30), type: "order_placed", summary: "Placed order for Kurta Set (S-46)", familyId: "FAM-04", customerId: "CUS-0005", orderId: "ORD-0046" },
      { id: "A2", at: day(-25), type: "order_placed", summary: "Placed order for Anarkali Suit (S-44)", familyId: "FAM-03", customerId: "CUS-0004", orderId: "ORD-0044" },
      { id: "A3", at: day(-18), type: "order_placed", summary: "Placed wedding order, Bridal Lehenga (S-42)", familyId: "FAM-01", customerId: "CUS-0001", orderId: "ORD-0042" },
      { id: "A4", at: day(-18), type: "payment", summary: "Advance received, Bridal Lehenga", familyId: "FAM-01", customerId: "CUS-0001", orderId: "ORD-0042", amount: 10000 },
      { id: "A5", at: day(-9), type: "payment", summary: "Balance settled, Kurta Set", familyId: "FAM-04", customerId: "CUS-0005", orderId: "ORD-0046", amount: 2100 },
      { id: "A6", at: day(-8), type: "measurement", summary: "New measurement recorded, Silk Saree Blouse", familyId: "FAM-02", customerId: "CUS-0003" },
      { id: "A7", at: day(-3), type: "payment", summary: "Balance settled, Anarkali Suit", familyId: "FAM-03", customerId: "CUS-0004", orderId: "ORD-0044", amount: 3200 },
      { id: "A8", at: day(-1), type: "stage", summary: "Anarkali Suit marked Ready for dispatch", familyId: "FAM-03", customerId: "CUS-0004", orderId: "ORD-0044" },
    ],
    families: [
      { id: "FAM-01", name: "Sharma Household", phone: "+91 98110 20304", createdAt: day(-320), note: "Regulars, bridal & festive" },
      { id: "FAM-02", name: "Iyer Household", phone: "+91 90045 88123", createdAt: day(-210) },
      { id: "FAM-03", name: "Khan Household", phone: "+91 99206 44510", createdAt: day(-140), note: "Outside materials" },
      { id: "FAM-04", name: "Mehta Household", phone: "+91 98999 11223", createdAt: day(-72) },
    ],
    customers: [
      {
        id: "CUS-0001", familyId: "FAM-01", name: "Anjali Sharma", gender: "F", phone: "+91 98110 20304", createdAt: day(-318),
        measurements: [{
          id: "M1", takenAt: day(-20), garment: "Bridal Blouse",
          values: [{ label: "Chest", value: "36\"" }, { label: "Waist", value: "30\"" }, { label: "Shoulder", value: "14\"" }, { label: "Sleeve", value: "9\"" }],
          note: "Deep back, piping edge",
        }],
      },
      {
        id: "CUS-0002", familyId: "FAM-01", name: "Ravi Sharma", gender: "M", createdAt: day(-300),
        measurements: [{
          id: "M2", takenAt: day(-95), garment: "Sherwani",
          values: [{ label: "Chest", value: "42\"" }, { label: "Length", value: "44\"" }, { label: "Shoulder", value: "18\"" }],
        }],
      },
      {
        id: "CUS-0003", familyId: "FAM-02", name: "Meera Iyer", gender: "F", phone: "+91 90045 88123", createdAt: day(-205),
        measurements: [{
          id: "M3", takenAt: day(-8), garment: "Silk Saree Blouse",
          values: [{ label: "Chest", value: "34\"" }, { label: "Waist", value: "28\"" }, { label: "Sleeve", value: "6\"" }],
        }],
      },
      {
        id: "CUS-0004", familyId: "FAM-03", name: "Sana Khan", gender: "F", phone: "+91 99206 44510", createdAt: day(-138),
        measurements: [{
          id: "M4", takenAt: day(-40), garment: "Anarkali",
          values: [{ label: "Chest", value: "38\"" }, { label: "Waist", value: "32\"" }, { label: "Length", value: "52\"" }],
        }],
      },
      {
        id: "CUS-0005", familyId: "FAM-04", name: "Priya Mehta", gender: "F", createdAt: day(-70),
        measurements: [{
          id: "M5", takenAt: day(-64), garment: "Lehenga",
          values: [{ label: "Chest", value: "35\"" }, { label: "Waist", value: "29\"" }, { label: "Length", value: "40\"" }],
        }],
      },
    ],
    orders: [
      {
        id: "ORD-0042", code: "S-42", customerId: "CUS-0001", kind: "wedding", garment: "Bridal Lehenga",
        materialSource: "shop", fulfilment: "local", design: "Zardozi bodice, flared skirt", material: "Raw silk, maroon",
        samplePhoto: "🪡", qty: 1, stage: "stitching", deadline: true, placedAt: day(-18), deliveryDate: day(3),
        price: 24000, remarks: "Bride wants trial before final fitting.",
        payments: [{ id: "P1", at: day(-18), kind: "advance", amount: 10000, method: "upi" }],
      },
      {
        id: "ORD-0043", code: "S-43", customerId: "CUS-0003", kind: "stitching", garment: "Silk Saree Blouse",
        materialSource: "outside", fulfilment: "local", design: "Boat neck, princess cut", material: "Customer's Kanjivaram",
        qty: 2, stage: "cutting", deadline: false, placedAt: day(-6), deliveryDate: day(6),
        price: 2400, remarks: "Match fall colour to saree.",
        payments: [{ id: "P2", at: day(-6), kind: "advance", amount: 800, method: "cash" }],
      },
      {
        id: "ORD-0044", code: "S-44", customerId: "CUS-0004", kind: "stitching", garment: "Anarkali Suit",
        materialSource: "shop", fulfilment: "outside", design: "Full flare, churidar", material: "Georgette, teal",
        samplePhoto: "📸", qty: 1, stage: "ready", deadline: false, placedAt: day(-25), deliveryDate: day(-1),
        price: 5200, remarks: "Courier to Pune, awaiting pickup.",
        payments: [
          { id: "P3", at: day(-25), kind: "advance", amount: 2000, method: "upi" },
          { id: "P4", at: day(-3), kind: "balance", amount: 3200, method: "upi" },
        ],
      },
      {
        id: "ORD-0045", code: "S-45", customerId: "CUS-0002", kind: "wedding", garment: "Sherwani + Stole",
        materialSource: "shop", fulfilment: "local", design: "Cream brocade, self-work", material: "Brocade, cream",
        qty: 1, stage: "new", deadline: true, placedAt: day(-2), deliveryDate: day(1),
        price: 16500, remarks: "Groom's engagement, rush.",
        payments: [{ id: "P5", at: day(-2), kind: "advance", amount: 6000, method: "card" }],
      },
      {
        id: "ORD-0046", code: "S-46", customerId: "CUS-0005", kind: "stitching", garment: "Kurta Set",
        materialSource: "outside", fulfilment: "local", design: "Straight cut, mandarin collar", material: "Cotton, indigo",
        qty: 3, stage: "delivered", deadline: false, placedAt: day(-30), deliveryDate: day(-9),
        price: 3600, remarks: "Delivered & settled.",
        payments: [
          { id: "P6", at: day(-30), kind: "advance", amount: 1500, method: "cash" },
          { id: "P7", at: day(-9), kind: "balance", amount: 2100, method: "cash" },
        ],
      },
    ],
  };
}

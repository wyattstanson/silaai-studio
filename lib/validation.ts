import { z } from "zod";

export const OrderKind = z.enum(["STITCHING", "SALE", "WEDDING"]);
export const OrderStage = z.enum(["NEW", "MATERIAL", "CUTTING", "STITCHING", "QC", "READY", "DELIVERED", "CLOSED"]);
export const OrderPriority = z.enum(["NORMAL", "URGENT", "EXPRESS"]);
export const MaterialSource = z.enum(["SHOP", "OUTSIDE"]);
export const Fulfilment = z.enum(["LOCAL", "OUTSIDE"]);
export const PaymentKind = z.enum(["ADVANCE", "BALANCE", "REFUND"]);
export const PaymentMethod = z.enum(["CASH", "UPI", "CARD"]);

const phone = z.string().trim().min(6, "Enter a valid phone number").max(20);
const money = z.number().int().nonnegative();

export const signupInput = z.object({ name: z.string().trim().min(1).max(80), phone });
export const loginInput = z.object({ phone });

export const familyInput = z.object({
  name: z.string().trim().min(1).max(120),
  phone,
  note: z.string().trim().max(300).optional(),
});

export const customerInput = z.object({
  familyId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  phone: phone.optional(),
  gender: z.enum(["F", "M", "—"]).optional(),
});
export const customerPatch = customerInput.partial().omit({ familyId: true });

export const measurementInput = z.object({
  garment: z.string().trim().min(1).max(80),
  values: z.array(z.object({ label: z.string().max(40), value: z.string().max(40) })).max(40),
  note: z.string().max(300).optional(),
  takenAt: z.string().datetime().optional(),
});

export const orderInput = z.object({
  customerId: z.string().min(1),
  kind: OrderKind,
  garment: z.string().trim().min(1).max(120),
  materialSource: MaterialSource,
  fulfilment: Fulfilment,
  design: z.string().max(200).optional(),
  material: z.string().max(200).optional(),
  samplePhoto: z.string().max(300).optional(),
  qty: z.number().int().positive().max(9999).default(1),
  priority: OrderPriority.default("NORMAL"),
  deadline: z.boolean().default(false),
  measurementSnapshot: z.object({
    garment: z.string().max(120),
    version: z.number().int().optional(),
    values: z.array(z.object({ label: z.string().max(40), value: z.string().max(40) })).max(40),
  }).optional(),
  deliveryDate: z.string().datetime(),
  price: money,
  remarks: z.string().max(500).optional(),
});
export const orderPatch = orderInput.partial().omit({ customerId: true });

export const RequestType = z.enum(["STITCHING", "ALTERATION", "PICKUP", "DELIVERY", "FITTING", "CONSULTATION", "REORDER", "EXPRESS", "MEASUREMENT", "REMAKE"]);
export const RequestStatus = z.enum(["SUBMITTED", "ACKNOWLEDGED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "DECLINED", "CANCELLED"]);

export const requestInput = z.object({
  customerId: z.string().min(1),
  familyId: z.string().optional(),
  type: RequestType,
  garment: z.string().max(120).optional(),
  orderId: z.string().optional(),
  preferredDate: z.string().datetime().optional(),
  timeSlot: z.string().max(40).optional(),
  address: z.string().max(300).optional(),
  express: z.boolean().optional(),
  reference: z.string().max(300).optional(),
  notes: z.string().max(500).optional(),
});
export const requestUpdate = z.object({
  id: z.string().min(1),
  status: RequestStatus,
  note: z.string().max(200).optional(),
});

export const stageInput = z.object({ stage: OrderStage });
export const paymentInput = z.object({
  kind: PaymentKind,
  amount: money.refine(n => n > 0, "Amount must be greater than zero"),
  method: PaymentMethod.default("UPI"),
  note: z.string().max(200).optional(),
});

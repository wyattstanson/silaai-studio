import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const day = (o: number) => new Date(Date.now() + o * 86_400_000);

async function main() {
  // Fresh slate (children cascade, but delete parents explicitly for a clean reseed)
  await prisma.$transaction([
    prisma.activity.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.order.deleteMany(),
    prisma.measurement.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.user.deleteMany(),
    prisma.family.deleteMany(),
    prisma.counter.deleteMany(),
  ]);

  const sharma = await prisma.family.create({ data: { name: "Sharma Household", phone: "+919811020304", note: "Regulars, bridal & festive", createdAt: day(-320) } });
  const iyer = await prisma.family.create({ data: { name: "Iyer Household", phone: "+919004588123", createdAt: day(-210) } });
  const khan = await prisma.family.create({ data: { name: "Khan Household", phone: "+919920644510", note: "Outside materials", createdAt: day(-140) } });
  const mehta = await prisma.family.create({ data: { name: "Mehta Household", phone: "+919899911223", createdAt: day(-72) } });

  const anjali = await prisma.customer.create({ data: { code: "CUS-0001", familyId: sharma.id, name: "Anjali Sharma", gender: "F", phone: "+919811020304", createdAt: day(-318), measurements: { create: [{ garment: "Bridal Blouse", takenAt: day(-20), note: "Deep back, piping edge", values: [{ label: "Chest", value: '36"' }, { label: "Waist", value: '30"' }, { label: "Shoulder", value: '14"' }, { label: "Sleeve", value: '9"' }] }] } } });
  const ravi = await prisma.customer.create({ data: { code: "CUS-0002", familyId: sharma.id, name: "Ravi Sharma", gender: "M", createdAt: day(-300), measurements: { create: [{ garment: "Sherwani", takenAt: day(-95), values: [{ label: "Chest", value: '42"' }, { label: "Length", value: '44"' }, { label: "Shoulder", value: '18"' }] }] } } });
  const meera = await prisma.customer.create({ data: { code: "CUS-0003", familyId: iyer.id, name: "Meera Iyer", gender: "F", phone: "+919004588123", createdAt: day(-205), measurements: { create: [{ garment: "Silk Saree Blouse", takenAt: day(-8), values: [{ label: "Chest", value: '34"' }, { label: "Waist", value: '28"' }, { label: "Sleeve", value: '6"' }] }] } } });
  const sana = await prisma.customer.create({ data: { code: "CUS-0004", familyId: khan.id, name: "Sana Khan", gender: "F", phone: "+919920644510", createdAt: day(-138), measurements: { create: [{ garment: "Anarkali", takenAt: day(-40), values: [{ label: "Chest", value: '38"' }, { label: "Waist", value: '32"' }, { label: "Length", value: '52"' }] }] } } });
  const priya = await prisma.customer.create({ data: { code: "CUS-0005", familyId: mehta.id, name: "Priya Mehta", gender: "F", createdAt: day(-70), measurements: { create: [{ garment: "Lehenga", takenAt: day(-64), values: [{ label: "Chest", value: '35"' }, { label: "Waist", value: '29"' }, { label: "Length", value: '40"' }] }] } } });

  await prisma.order.create({ data: { code: "S-42", customerId: anjali.id, kind: "WEDDING", garment: "Bridal Lehenga", materialSource: "SHOP", fulfilment: "LOCAL", design: "Zardozi bodice, flared skirt", material: "Raw silk, maroon", samplePhoto: "photo", qty: 1, priority: "EXPRESS", stage: "STITCHING", deadline: true, placedAt: day(-18), deliveryDate: day(3), price: 24000, remarks: "Bride wants trial before final fitting.", payments: { create: [{ kind: "ADVANCE", amount: 10000, method: "UPI", at: day(-18) }] } } });
  await prisma.order.create({ data: { code: "S-43", customerId: meera.id, kind: "STITCHING", garment: "Silk Saree Blouse", materialSource: "OUTSIDE", fulfilment: "LOCAL", design: "Boat neck, princess cut", material: "Customer's Kanjivaram", qty: 2, stage: "CUTTING", deadline: false, placedAt: day(-6), deliveryDate: day(6), price: 2400, remarks: "Match fall colour to saree.", payments: { create: [{ kind: "ADVANCE", amount: 800, method: "CASH", at: day(-6) }] } } });
  await prisma.order.create({ data: { code: "S-44", customerId: sana.id, kind: "STITCHING", garment: "Anarkali Suit", materialSource: "SHOP", fulfilment: "OUTSIDE", design: "Full flare, churidar", material: "Georgette, teal", samplePhoto: "photo", qty: 1, stage: "READY", deadline: false, placedAt: day(-25), deliveryDate: day(-1), price: 5200, remarks: "Courier to Pune, awaiting pickup.", payments: { create: [{ kind: "ADVANCE", amount: 2000, method: "UPI", at: day(-25) }, { kind: "BALANCE", amount: 3200, method: "UPI", at: day(-3) }] } } });
  await prisma.order.create({ data: { code: "S-45", customerId: ravi.id, kind: "WEDDING", garment: "Sherwani + Stole", materialSource: "SHOP", fulfilment: "LOCAL", design: "Cream brocade, self-work", material: "Brocade, cream", qty: 1, priority: "URGENT", stage: "NEW", deadline: true, placedAt: day(-2), deliveryDate: day(1), price: 16500, remarks: "Groom's engagement, rush.", payments: { create: [{ kind: "ADVANCE", amount: 6000, method: "CARD", at: day(-2) }] } } });
  await prisma.order.create({ data: { code: "S-46", customerId: priya.id, kind: "STITCHING", garment: "Kurta Set", materialSource: "OUTSIDE", fulfilment: "LOCAL", design: "Straight cut, mandarin collar", material: "Cotton, indigo", qty: 3, stage: "CLOSED", deadline: false, placedAt: day(-30), deliveryDate: day(-9), price: 3600, remarks: "Delivered & settled.", payments: { create: [{ kind: "ADVANCE", amount: 1500, method: "CASH", at: day(-30) }, { kind: "BALANCE", amount: 2100, method: "CASH", at: day(-9) }] } } });

  await prisma.user.createMany({ data: [
    { phone: "+919000000000", name: "Aryansh", role: "OWNER", createdAt: day(-320), lastLogin: day(-1) },
    { phone: "+919811020304", name: "Anjali Sharma", role: "MEMBER", familyId: sharma.id, createdAt: day(-318), lastLogin: day(-4) },
    { phone: "+919004588123", name: "Meera Iyer", role: "MEMBER", familyId: iyer.id, createdAt: day(-205), lastLogin: day(-12) },
    { phone: "+919920644510", name: "Sana Khan", role: "MEMBER", familyId: khan.id, createdAt: day(-138), lastLogin: day(-2) },
  ] });

  await prisma.activity.createMany({ data: [
    { type: "ORDER_PLACED", summary: "Placed order for Kurta Set (S-46)", familyId: mehta.id, customerId: priya.id, at: day(-30) },
    { type: "ORDER_PLACED", summary: "Placed wedding order, Bridal Lehenga (S-42)", familyId: sharma.id, customerId: anjali.id, at: day(-18) },
    { type: "PAYMENT", summary: "Advance received, Bridal Lehenga", familyId: sharma.id, customerId: anjali.id, amount: 10000, at: day(-18) },
    { type: "PAYMENT", summary: "Balance settled, Anarkali Suit", familyId: khan.id, customerId: sana.id, amount: 3200, at: day(-3) },
    { type: "STAGE", summary: "Anarkali Suit marked ready for dispatch", familyId: khan.id, customerId: sana.id, at: day(-1) },
  ] });

  await prisma.request.createMany({ data: [
    { code: "REQ-0001", customerId: anjali.id, familyId: sharma.id, type: "PICKUP", status: "SCHEDULED", preferredDate: day(2), timeSlot: "11am – 1pm", address: "14, Rose Villa, Katpadi", notes: "Two saree blouses to stitch.", history: [{ at: day(-3), status: "SUBMITTED" }, { at: day(-2), status: "ACKNOWLEDGED" }, { at: day(-1), status: "SCHEDULED", note: "Pickup confirmed" }], createdAt: day(-3), updatedAt: day(-1) },
    { code: "REQ-0002", customerId: meera.id, familyId: iyer.id, type: "ALTERATION", status: "SUBMITTED", garment: "Silk Saree Blouse", notes: "Sleeves a touch tight.", history: [{ at: day(-1), status: "SUBMITTED" }], createdAt: day(-1), updatedAt: day(-1) },
    { code: "REQ-0003", customerId: sana.id, familyId: khan.id, type: "FITTING", status: "ACKNOWLEDGED", preferredDate: day(4), timeSlot: "4pm – 6pm", notes: "Trial for the Anarkali before dispatch.", history: [{ at: day(-2), status: "SUBMITTED" }, { at: day(-1), status: "ACKNOWLEDGED" }], createdAt: day(-2), updatedAt: day(-1) },
  ] });

  await prisma.counter.createMany({ data: [{ name: "customer", value: 5 }, { name: "order", value: 46 }, { name: "request", value: 3 }] });

  console.log("Seeded: 4 families, 5 customers, 5 orders, 4 users.");
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });

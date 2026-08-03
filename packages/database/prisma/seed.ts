import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function hashPassword(password: string) {
  return argon2.hash(password);
}

async function main() {
  console.log("Seeding database...");

  await prisma.ticketPurchase.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.event.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.bookingConfig.deleteMany();
  await prisma.businessBranch.deleteMany();
  await prisma.businessProfile.deleteMany();
  await prisma.userPreferences.deleteMany();
  await prisma.rideSearchLog.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: "admin@urbanexplore.com",
      passwordHash: await hashPassword("admin123"),
      role: "SYSTEM_ADMIN",
      language: "en",
      country: "ET",
    },
  });

  const restaurantAdmin = await prisma.user.create({
    data: {
      email: "restaurant@urbanexplore.com",
      passwordHash: await hashPassword("restaurant123"),
      role: "RESTAURANT_ADMIN",
      language: "en",
      country: "ET",
    },
  });

  const eventOrganizer = await prisma.user.create({
    data: {
      email: "organizer@urbanexplore.com",
      passwordHash: await hashPassword("organizer123"),
      role: "EVENT_ORGANIZER",
      language: "en",
      country: "ET",
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "user@urbanexplore.com",
      passwordHash: await hashPassword("user123"),
      role: "CUSTOMER",
      language: "en",
      country: "ET",
    },
  });

  await prisma.userPreferences.create({
    data: {
      userId: customer.id,
      dietaryRestrictions: ["Vegan", "Halal"],
      allergies: ["Peanuts", "Dairy"],
      defaultLocation: "Addis Ababa",
    },
  });

  const business1 = await prisma.businessProfile.create({
    data: {
      name: "Juniper Table",
      category: "Restaurant",
      logoUrl: "/images/juniper-logo.png",
      coverUrl: "/images/juniper-cover.jpg",
      isVerified: true,
      openingHours: {
        monday: [{ open: "08:00", close: "23:00" }],
        tuesday: [{ open: "08:00", close: "23:00" }],
        wednesday: [{ open: "08:00", close: "23:00" }],
        thursday: [{ open: "08:00", close: "23:00" }],
        friday: [{ open: "08:00", close: "00:00" }],
        saturday: [{ open: "09:00", close: "00:00" }],
        sunday: [{ open: "09:00", close: "22:00" }],
      },
    },
  });

  const business2 = await prisma.businessProfile.create({
    data: {
      name: "Sora Noodle House",
      category: "Restaurant",
      isVerified: true,
      openingHours: {
        monday: [{ open: "11:00", close: "22:30" }],
        tuesday: [{ open: "11:00", close: "22:30" }],
        wednesday: [{ open: "11:00", close: "22:30" }],
        thursday: [{ open: "11:00", close: "22:30" }],
        friday: [{ open: "11:00", close: "23:00" }],
        saturday: [{ open: "11:00", close: "23:00" }],
        sunday: [{ open: "12:00", close: "21:00" }],
      },
    },
  });

  const business3 = await prisma.businessProfile.create({
    data: {
      name: "Olive & Grain",
      category: "Restaurant",
      isVerified: true,
      openingHours: {
        monday: [{ open: "07:00", close: "22:00" }],
        tuesday: [{ open: "07:00", close: "22:00" }],
        wednesday: [{ open: "07:00", close: "22:00" }],
        thursday: [{ open: "07:00", close: "22:00" }],
        friday: [{ open: "07:00", close: "23:00" }],
        saturday: [{ open: "08:00", close: "23:00" }],
        sunday: [{ open: "08:00", close: "21:00" }],
      },
    },
  });

  const branch1 = await prisma.businessBranch.create({
    data: {
      businessId: business1.id,
      branchName: "Juniper Table - West End",
      address: "123 West End Avenue, Addis Ababa",
      latitude: 9.0192,
      longitude: 38.7525,
      phone: "+251911223344",
    },
  });

  const branch2 = await prisma.businessBranch.create({
    data: {
      businessId: business2.id,
      branchName: "Sora Noodle House - Central Market",
      address: "45 Central Market Road, Addis Ababa",
      latitude: 9.0349,
      longitude: 38.7469,
      phone: "+251922334455",
    },
  });

  const branch3 = await prisma.businessBranch.create({
    data: {
      businessId: business3.id,
      branchName: "Olive & Grain - Riverside",
      address: "78 Riverside Drive, Addis Ababa",
      latitude: 9.0059,
      longitude: 38.7636,
      phone: "+251933445566",
    },
  });

  await prisma.bookingConfig.createMany({
    data: [
      {
        branchId: branch1.id,
        bookingMode: "TIME_SLOT",
        timeSlotDurationMinutes: 60,
        totalTables: 14,
        maxGuestPerTable: 8,
        requirePrepayment: true,
        prepaymentType: "FIXED_DEPOSIT",
        prepaymentValue: 250,
        cancellationPolicyText: "Cancellations are free up to 4 hours before the reservation.",
      },
      {
        branchId: branch2.id,
        bookingMode: "TIME_SLOT",
        timeSlotDurationMinutes: 45,
        totalTables: 12,
        maxGuestPerTable: 6,
        requirePrepayment: false,
        prepaymentType: "NONE",
        prepaymentValue: null,
        cancellationPolicyText: "Please cancel at least 2 hours before your booking.",
      },
      {
        branchId: branch3.id,
        bookingMode: "REQUEST_BASED",
        timeSlotDurationMinutes: 60,
        totalTables: 10,
        maxGuestPerTable: 6,
        requirePrepayment: true,
        prepaymentType: "PERCENTAGE",
        prepaymentValue: 20,
        cancellationPolicyText: "Request-based bookings are confirmed manually and deposits are non-refundable after confirmation.",
      },
    ],
  });

  await prisma.menuItem.createMany({
    data: [
      { branchId: branch1.id, name: "Injera with Doro Wot", price: 450, category: "Main Course" },
      { branchId: branch1.id, name: "Kitfo", price: 380, category: "Main Course" },
      { branchId: branch1.id, name: "Shiro", price: 280, category: "Main Course" },
      { branchId: branch1.id, name: "Tibs", price: 520, category: "Main Course" },
      { branchId: branch1.id, name: "Ethiopian Coffee", price: 80, category: "Drinks" },
      { branchId: branch1.id, name: "Honey Wine", price: 140, category: "Drinks" },
      { branchId: branch2.id, name: "Tonkotsu Ramen", price: 650, category: "Noodles" },
      { branchId: branch2.id, name: "Gyoza (6 pcs)", price: 280, category: "Appetizers" },
      { branchId: branch2.id, name: "Matcha Latte", price: 180, category: "Drinks" },
      { branchId: branch2.id, name: "Chicken Udon", price: 610, category: "Noodles" },
      { branchId: branch3.id, name: "Mediterranean Platter", price: 580, category: "Main Course" },
      { branchId: branch3.id, name: "Hummus with Pita", price: 220, category: "Appetizers" },
      { branchId: branch3.id, name: "Greek Salad", price: 320, category: "Salads" },
      { branchId: branch3.id, name: "Lemon Herb Chicken", price: 540, category: "Main Course" },
    ],
  });

  await prisma.reservation.createMany({
    data: [
      {
        userId: customer.id,
        branchId: branch1.id,
        reservationDate: new Date("2026-08-10T18:00:00Z"),
        timeSlot: "18:00 - 19:00",
        guestCount: 4,
        status: "CONFIRMED",
        specialRequests: "Window seat if available.",
        reservationCode: "FR-JP8A3Q1L",
      },
      {
        userId: customer.id,
        branchId: branch1.id,
        reservationDate: new Date("2026-08-12T20:00:00Z"),
        timeSlot: "20:00 - 21:00",
        guestCount: 2,
        status: "PENDING",
        specialRequests: "Anniversary dinner.",
        reservationCode: "FR-AN9V4M2S",
      },
      {
        userId: customer.id,
        branchId: branch2.id,
        reservationDate: new Date("2026-08-11T19:00:00Z"),
        timeSlot: "19:00 - 19:45",
        guestCount: 2,
        status: "CONFIRMED",
        reservationCode: "FR-RM7T2D8X",
      },
      {
        userId: customer.id,
        branchId: branch3.id,
        reservationDate: new Date("2026-08-13T17:30:00Z"),
        guestCount: 5,
        status: "PENDING",
        specialRequests: "Quiet corner for family dinner.",
        reservationCode: "FR-RQ5H7P6N",
      },
      {
        userId: customer.id,
        branchId: branch3.id,
        reservationDate: new Date("2026-07-29T09:00:00Z"),
        guestCount: 3,
        status: "COMPLETED",
        reservationCode: "FR-OL3D9K4C",
      },
      {
        userId: customer.id,
        branchId: branch2.id,
        reservationDate: new Date("2026-08-09T21:00:00Z"),
        timeSlot: "21:00 - 21:45",
        guestCount: 7,
        status: "REJECTED",
        specialRequests: "Large family table.",
        reservationCode: "FR-RE2J8L5Z",
      },
    ],
  });

  const event1 = await prisma.event.create({
    data: {
      organizerId: eventOrganizer.id,
      businessId: business3.id,
      title: "Night Market Sessions",
      description: "A vibrant food and music night market featuring local chefs and musicians.",
      category: "Food and Music",
      venueName: "Harbour Hall",
      latitude: 9.0129,
      longitude: 38.7579,
      startDateTime: new Date("2026-08-15T19:00:00Z"),
      endDateTime: new Date("2026-08-15T23:00:00Z"),
      status: "PUBLISHED",
    },
  });

  const event2 = await prisma.event.create({
    data: {
      organizerId: eventOrganizer.id,
      businessId: business3.id,
      title: "Jazz Nights at Olive & Grain",
      description: "Live jazz performances every Friday evening with craft cocktails.",
      category: "Music",
      venueName: "Olive & Grain",
      latitude: 9.0059,
      longitude: 38.7636,
      startDateTime: new Date("2026-08-22T19:30:00Z"),
      endDateTime: new Date("2026-08-22T22:30:00Z"),
      status: "PUBLISHED",
    },
  });

  const event3 = await prisma.event.create({
    data: {
      organizerId: eventOrganizer.id,
      title: "UrbanExplore Creator Meet-up",
      description: "A networking event for restaurants, organizers, and community creators to share ideas.",
      category: "Business & Networking",
      venueName: "City Loft Hub",
      latitude: 9.021,
      longitude: 38.7488,
      startDateTime: new Date("2026-08-28T16:00:00Z"),
      endDateTime: new Date("2026-08-28T19:00:00Z"),
      status: "DRAFT",
    },
  });

  await prisma.ticketType.createMany({
    data: [
      { eventId: event1.id, name: "General Admission", tier: "GENERAL", price: 12, totalQuantity: 200, remainingQuantity: 180, salesStart: new Date("2026-08-01T00:00:00Z"), salesEnd: new Date("2026-08-15T18:00:00Z") },
      { eventId: event1.id, name: "VIP Experience", tier: "VIP", price: 45, totalQuantity: 50, remainingQuantity: 45, salesStart: new Date("2026-08-01T00:00:00Z"), salesEnd: new Date("2026-08-15T18:00:00Z") },
      { eventId: event1.id, name: "Early Bird", tier: "EARLY_BIRD", price: 8, totalQuantity: 100, remainingQuantity: 0, salesStart: new Date("2026-07-15T00:00:00Z"), salesEnd: new Date("2026-08-01T00:00:00Z") },
      { eventId: event2.id, name: "General Admission", tier: "GENERAL", price: 18, totalQuantity: 150, remainingQuantity: 140, salesStart: new Date("2026-08-01T00:00:00Z"), salesEnd: new Date("2026-08-22T18:00:00Z") },
      { eventId: event2.id, name: "VIP Table", tier: "VIP", price: 65, totalQuantity: 20, remainingQuantity: 18, salesStart: new Date("2026-08-01T00:00:00Z"), salesEnd: new Date("2026-08-22T18:00:00Z") },
      { eventId: event3.id, name: "Creator Pass", tier: "GENERAL", price: 0, totalQuantity: 80, remainingQuantity: 80, salesStart: new Date("2026-08-10T00:00:00Z"), salesEnd: new Date("2026-08-28T12:00:00Z") },
    ],
  });

  const ticketTypes = await prisma.ticketType.findMany({ orderBy: { createdAt: "asc" } });

  await prisma.ticketPurchase.createMany({
    data: [
      {
        userId: customer.id,
        eventId: event1.id,
        ticketTypeId: ticketTypes[0].id,
        quantity: 2,
        totalPaid: 24,
        status: "COMPLETED",
        qrCodeHash: "qr_event1_completed_001",
        holdToken: "hold_event1_completed_001",
      },
      {
        userId: customer.id,
        eventId: event2.id,
        ticketTypeId: ticketTypes[3].id,
        quantity: 1,
        totalPaid: 18,
        status: "COMPLETED",
        qrCodeHash: "qr_event2_completed_001",
        holdToken: "hold_event2_completed_001",
      },
      {
        userId: customer.id,
        eventId: event3.id,
        ticketTypeId: ticketTypes[5].id,
        quantity: 3,
        totalPaid: 0,
        status: "PENDING",
        qrCodeHash: "qr_event3_pending_001",
        holdToken: "hold_event3_pending_001",
      },
    ],
  });

  await prisma.rideSearchLog.createMany({
    data: [
      {
        userId: customer.id,
        pickupLat: 9.021,
        pickupLng: 38.751,
        dropoffLat: 9.0129,
        dropoffLng: 38.7579,
        estimates: [
          { providerName: "Uber", price: 180, etaMinutes: 6 },
          { providerName: "Bolt", price: 155, etaMinutes: 8 },
        ],
        selectedPartner: "Bolt",
      },
      {
        userId: customer.id,
        pickupLat: 9.0192,
        pickupLng: 38.7525,
        dropoffLat: 9.0059,
        dropoffLng: 38.7636,
        estimates: [
          { providerName: "Uber", price: 210, etaMinutes: 7 },
          { providerName: "Yango", price: 190, etaMinutes: 9 },
        ],
        selectedPartner: "Uber",
      },
    ],
  });

  console.log("Seed complete:");
  console.log("  Users:", { admin: admin.id, restaurantAdmin: restaurantAdmin.id, eventOrganizer: eventOrganizer.id, customer: customer.id });
  console.log("  Businesses:", 3);
  console.log("  Branches:", 3);
  console.log("  Reservations:", 6);
  console.log("  Events:", 3);
  console.log("  Ticket purchases:", 3);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

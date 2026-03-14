import {
  pgTable,
  uuid,
  text,
  timestamp,
  bigint,
  boolean,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ─── Users ──────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  name: text("name"),
  image: text("image"),
  role: text("role").default("user").notNull(), // user, admin
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Better-Auth: Sessions ──────────────────────────────────────────
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Better-Auth: Accounts ──────────────────────────────────────────
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Better-Auth: Verifications ─────────────────────────────────────
export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── User Subscriptions (Stripe) ────────────────────────────────────
export const userSubscriptions = pgTable(
  "user_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id").notNull().unique(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    email: text("email"),
    status: text("status").default("inactive").notNull(),
    planId: text("plan_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    canceledAt: timestamp("canceled_at"),
  },
  (table) => [
    index("idx_user_subscriptions_status").on(table.status),
    index("idx_user_subscriptions_user_id").on(table.userId),
  ]
);

// ─── Payments (Stripe) ─────────────────────────────────────────────
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    stripeInvoiceId: text("stripe_invoice_id").notNull().unique(),
    stripeSubscriptionId: text("stripe_subscription_id").references(
      () => userSubscriptions.stripeSubscriptionId
    ),
    amount: bigint("amount", { mode: "number" }),
    currency: text("currency").default("usd"),
    status: text("status").default("pending").notNull(),
    paidAt: timestamp("paid_at"),
    failedAt: timestamp("failed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_payments_subscription").on(table.stripeSubscriptionId),
    index("idx_payments_status").on(table.status),
    index("idx_payments_user_id").on(table.userId),
  ]
);

// ─── Mobile Subscriptions (RevenueCat) ──────────────────────────────
export const mobileSubscriptions = pgTable(
  "mobile_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    revenuecatUserId: text("revenuecat_user_id").notNull().unique(),
    productId: text("product_id").notNull(),
    store: text("store").default("apple"), // apple, google, stripe
    status: text("status").default("active").notNull(),
    autoResumeDate: timestamp("auto_resume_date"),
    expirationDate: timestamp("expiration_date"),
    purchaseDate: timestamp("purchase_date"),
    canceledAt: timestamp("canceled_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_mobile_subscriptions_status").on(table.status),
    index("idx_mobile_subscriptions_store").on(table.store),
  ]
);

// ─── Mobile Payments (RevenueCat) ───────────────────────────────────
export const mobilePayments = pgTable(
  "mobile_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    revenuecatUserId: text("revenuecat_user_id")
      .notNull()
      .references(() => mobileSubscriptions.revenuecatUserId),
    transactionId: text("transaction_id").unique(),
    productId: text("product_id").notNull(),
    amount: bigint("amount", { mode: "number" }),
    currency: text("currency").default("usd"),
    store: text("store"),
    status: text("status").default("completed").notNull(),
    receiptData: jsonb("receipt_data"),
    purchasedAt: timestamp("purchased_at"),
    failedAt: timestamp("failed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_mobile_payments_subscription").on(table.revenuecatUserId),
    index("idx_mobile_payments_status").on(table.status),
  ]
);

// ─── Type Exports ───────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type NewUserSubscription = typeof userSubscriptions.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type MobileSubscription = typeof mobileSubscriptions.$inferSelect;
export type NewMobileSubscription = typeof mobileSubscriptions.$inferInsert;
export type MobilePayment = typeof mobilePayments.$inferSelect;
export type NewMobilePayment = typeof mobilePayments.$inferInsert;

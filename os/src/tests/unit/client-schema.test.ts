import { describe, expect, it } from "vitest";
import { createClientSchema } from "@/lib/validation/client";
import { signUpSchema } from "@/lib/validation/auth";

describe("createClientSchema", () => {
  it("accepts a valid client payload", () => {
    const result = createClientSchema.safeParse({
      name: "Amboseli Fresh Foods Ltd",
      country: "Kenya",
      currency: "kes",
      serviceBucket: "MONTHLY_CFO",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // currency is normalised to uppercase
      expect(result.data.currency).toBe("KES");
    }
  });

  it("rejects an unknown service bucket", () => {
    const result = createClientSchema.safeParse({
      name: "Test Co",
      country: "Kenya",
      currency: "KES",
      serviceBucket: "NOT_A_REAL_BUCKET",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a currency code that isn't 3 letters", () => {
    const result = createClientSchema.safeParse({
      name: "Test Co",
      country: "Kenya",
      currency: "KSH1",
      serviceBucket: "MONTHLY_CFO",
    });
    expect(result.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("rejects a password without a number", () => {
    const result = signUpSchema.safeParse({
      fullName: "Mary Wanjiku",
      email: "mary@cfolead.solutions",
      password: "NoNumbersHere",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a strong password", () => {
    const result = signUpSchema.safeParse({
      fullName: "Mary Wanjiku",
      email: "mary@cfolead.solutions",
      password: "Str0ngPassword",
    });
    expect(result.success).toBe(true);
  });
});

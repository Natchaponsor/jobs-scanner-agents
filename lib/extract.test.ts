import { describe, expect, it } from "vitest";
import { extractFunction, extractWorkAuthorization, FUNCTION_LABELS } from "./extract";

describe("extractWorkAuthorization", () => {
  it("is always n/a outside the US, regardless of what the text says", () => {
    expect(extractWorkAuthorization("Must be a U.S. citizen to apply.", "Thailand")).toBe("n/a");
    expect(extractWorkAuthorization("We offer visa sponsorship.", "Singapore")).toBe("n/a");
    expect(extractWorkAuthorization("Must be a U.S. citizen to apply.", "not-specified")).toBe("n/a");
  });

  it("defaults to n/a for US postings that don't mention citizenship or sponsorship", () => {
    expect(extractWorkAuthorization("Great benefits and a fun team culture.", "United States")).toBe("n/a");
    expect(extractWorkAuthorization("", "United States")).toBe("n/a");
  });

  it("detects explicit US-citizenship-required language", () => {
    expect(extractWorkAuthorization("Must be a U.S. citizen to apply.", "United States")).toBe(
      "Citizenship Required"
    );
    expect(extractWorkAuthorization("U.S. citizenship is required for this role.", "United States")).toBe(
      "Citizenship Required"
    );
  });

  // Citizenship Required and No Sponsorship are deliberately distinct buckets: a posting that
  // merely can't sponsor a new visa is satisfiable by a green card holder, not just a citizen.
  it("detects negated sponsorship language as its own 'No Sponsorship' bucket, not citizenship-required", () => {
    expect(
      extractWorkAuthorization(
        "Candidates must be authorized to work in the US. We are unable to sponsor visas at this time.",
        "United States"
      )
    ).toBe("No Sponsorship");
    expect(extractWorkAuthorization("We do not sponsor employment visas.", "United States")).toBe(
      "No Sponsorship"
    );
  });

  // Bug fix #1: the original pattern required the literal phrase "security clearance required"
  // and missed the far more common "requires ... security clearance" word order.
  it("[bug fix] catches 'requires a security clearance' phrasing, not just 'security clearance required'", () => {
    expect(extractWorkAuthorization("This role requires an active security clearance.", "United States")).toBe(
      "Citizenship Required"
    );
    expect(
      extractWorkAuthorization("This position requires the ability to obtain a security clearance.", "United States")
    ).toBe("Citizenship Required");
  });

  // Bug fix #2: the original pattern only matched "sponsor" immediately followed by "visa(s)" or
  // "work authorization" and missed "sponsor work visas" / "offer visa sponsorship" phrasing.
  it("[bug fix] catches 'sponsor work visas' and 'offer ... sponsorship' phrasing", () => {
    expect(extractWorkAuthorization("We are happy to sponsor work visas for the right candidate.", "United States")).toBe(
      "Sponsorship Available"
    );
    expect(extractWorkAuthorization("We offer visa sponsorship for this role.", "United States")).toBe(
      "Sponsorship Available"
    );
    expect(extractWorkAuthorization("H-1B sponsorship available for qualified candidates.", "United States")).toBe(
      "Sponsorship Available"
    );
  });

  // Bug fix #2 regression guard: a negated sponsorship mention must still win over the broader
  // "sponsorship" keyword match, even when phrased as "not able to offer" rather than "unable to".
  it("[bug fix] negated sponsorship still wins over the broader sponsorship-available match", () => {
    expect(
      extractWorkAuthorization("Sorry, we are not able to offer visa sponsorship for this position.", "United States")
    ).toBe("No Sponsorship");
  });
});

describe("extractFunction — new labels added this round", () => {
  const newLabels = [
    "Program Manager",
    "Business Operations Manager",
    "Engineering Management",
    "Business Development",
    "Consulting",
    "Customer Success",
    "Strategy",
    "Supply Chain / Logistics",
  ];

  it("registers every new label in FUNCTION_LABELS (so it's selectable in the filter dropdown)", () => {
    for (const label of newLabels) {
      expect(FUNCTION_LABELS).toContain(label);
    }
  });

  it("classifies Program Manager and Project Manager titles", () => {
    expect(extractFunction("Senior Program Manager", "Other")).toBe("Program Manager");
    expect(extractFunction("Technical Project Manager", "Other")).toBe("Program Manager");
  });

  it("classifies Business Operations Manager titles, including revops/salesops variants", () => {
    expect(extractFunction("Business Operations Manager", "Other")).toBe("Business Operations Manager");
    expect(extractFunction("Revenue Operations Lead", "Other")).toBe("Business Operations Manager");
    expect(extractFunction("Sales Operations Manager", "Other")).toBe("Business Operations Manager");
  });

  it("classifies Engineering Management titles", () => {
    expect(extractFunction("Engineering Manager", "Other")).toBe("Engineering Management");
  });

  it("classifies Business Development, Consulting, Customer Success, Strategy, and Supply Chain titles", () => {
    expect(extractFunction("Business Development Representative", "Other")).toBe("Business Development");
    expect(extractFunction("Management Consultant", "Other")).toBe("Consulting");
    expect(extractFunction("Customer Success Manager", "Other")).toBe("Customer Success");
    expect(extractFunction("Director of Strategy", "Other")).toBe("Strategy");
    expect(extractFunction("Supply Chain Analyst", "Other")).toBe("Supply Chain / Logistics");
  });

  // Regression guard: FUNCTION_KEYWORDS is order-sensitive (first match wins), so adding
  // Engineering Management ahead of Software Engineer must not break titles that genuinely are
  // Software Engineer roles, and must correctly redirect titles that would otherwise be
  // misclassified by the broader "backend/frontend" substring match.
  it("[bug guard] 'Engineering Manager, Backend' resolves to Engineering Management, not Software Engineer", () => {
    expect(extractFunction("Engineering Manager, Backend", "Other")).toBe("Engineering Management");
  });

  it("does not regress existing labels after the reordering", () => {
    expect(extractFunction("Senior Backend Software Engineer", "Other")).toBe("Software Engineer");
    expect(extractFunction("Product Manager, Growth", "Other")).toBe("Product Manager");
    expect(extractFunction("Data Scientist", "Other")).toBe("Data Scientist");
    expect(extractFunction("General Operations Coordinator", "Other")).toBe("Operations");
  });
});

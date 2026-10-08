/**
 * EMI Calculator Utility
 * Calculates EMI (Equated Monthly Installment) independently
 * Formula: EMI = (P * R * (1 + R)^N) / ((1 + R)^N - 1)
 * Where:
 *   P = Principal (Loan Amount)
 *   R = Monthly Interest Rate (Annual Rate / 12 / 100)
 *   N = Number of Months (Tenure in Years * 12)
 */

export class EMICalculator {
  /**
   * Calculate EMI
   * @param principal - Loan amount in rupees
   * @param annualInterestRate - Annual interest rate (percentage)
   * @param tenureYears - Tenure in years
   * @returns EMI amount (rounded to 2 decimal places)
   */
  static calculateEMI(
    principal: number,
    annualInterestRate: number,
    tenureYears: number
  ): number {
    const monthlyRate = annualInterestRate / 12 / 100;
    const numberOfMonths = tenureYears * 12;

    if (monthlyRate === 0) {
      return principal / numberOfMonths;
    }

    const emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths)) /
      (Math.pow(1 + monthlyRate, numberOfMonths) - 1);

    return Math.round(emi * 100) / 100;
  }

  /**
   * Calculate total amount to be paid
   */
  static calculateTotalAmount(
    principal: number,
    annualInterestRate: number,
    tenureYears: number
  ): number {
    const emi = this.calculateEMI(principal, annualInterestRate, tenureYears);
    const numberOfMonths = tenureYears * 12;
    return Math.round(emi * numberOfMonths * 100) / 100;
  }

  /**
   * Calculate total interest amount
   */
  static calculateTotalInterest(
    principal: number,
    annualInterestRate: number,
    tenureYears: number
  ): number {
    const totalAmount = this.calculateTotalAmount(principal, annualInterestRate, tenureYears);
    return Math.round((totalAmount - principal) * 100) / 100;
  }

  /**
   * Parse amount string to rupees.
   * Supports shorthand units ("25L" -> 2500000, "1.5CR" -> 15000000, "500K" -> 500000)
   * and formatted values as displayed by the calculator ("₹25,00,000" -> 2500000).
   */
  static parseAmount(amountStr: string): number {
    const cleanStr = amountStr.toUpperCase().replace(/[₹,\s]/g, '');
    const match = cleanStr.match(/^(\d+(?:\.\d+)?)(CR|L|K)?$/);

    if (!match) {
      throw new Error(`Unable to parse amount: "${amountStr}"`);
    }

    const multipliers: Record<string, number> = { CR: 10000000, L: 100000, K: 1000 };
    const multiplier = match[2] ? multipliers[match[2]] : 1;

    return Math.round(parseFloat(match[1]) * multiplier);
  }
}

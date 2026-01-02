import { useState } from "react";
import { CreditCard, Lock, Check, ArrowLeft } from "lucide-react";
import { paymentService } from "../src/services/payment.service";
import { toast } from "sonner";

// Mock payment method ID for testing/demo mode
const MOCK_PAYMENT_METHOD_ID = "pm_card_visa";

interface PaymentPageProps {
  selectedPlan: {
    id: string;
    name: string;
    price: string;
  };
  onPaymentSuccess: () => void;
  onBack: () => void;
}

export function PaymentPage({ selectedPlan, onPaymentSuccess, onBack }: PaymentPageProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const matches = cleaned.match(/.{1,4}/g);
    return matches ? matches.join(" ") : cleaned;
  };

  // Format expiry date MM/YY
  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Card number validation
    const cleanedCardNumber = cardNumber.replace(/\s/g, "");
    if (!cleanedCardNumber) {
      newErrors.cardNumber = "Card number is required";
    } else if (cleanedCardNumber.length !== 16) {
      newErrors.cardNumber = "Card number must be 16 digits";
    } else if (!/^\d+$/.test(cleanedCardNumber)) {
      newErrors.cardNumber = "Card number must contain only digits";
    }

    // Expiry date validation
    if (!expiryDate) {
      newErrors.expiryDate = "Expiry date is required";
    } else {
      const [month, year] = expiryDate.split("/");
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      
      if (!month || !year) {
        newErrors.expiryDate = "Invalid format. Use MM/YY";
      } else if (parseInt(month) < 1 || parseInt(month) > 12) {
        newErrors.expiryDate = "Invalid month";
      } else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        newErrors.expiryDate = "Card has expired";
      }
    }

    // CVV validation
    if (!cvv) {
      newErrors.cvv = "CVV is required";
    } else if (cvv.length !== 3 && cvv.length !== 4) {
      newErrors.cvv = "CVV must be 3 or 4 digits";
    } else if (!/^\d+$/.test(cvv)) {
      newErrors.cvv = "CVV must contain only digits";
    }

    // Cardholder name validation
    if (!cardName.trim()) {
      newErrors.cardName = "Cardholder name is required";
    } else if (cardName.trim().length < 3) {
      newErrors.cardName = "Name must be at least 3 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    
    try {
      // Step 1: Create payment intent
      const intentResponse = await paymentService.createPaymentIntent(selectedPlan.id);
      
      // Check if backend is in placeholder/test mode
      // Backend returns a message field directly when running in placeholder mode
      if (intentResponse.message) {
        // In placeholder mode, treat as successful for testing
        toast.success("Payment successful! (Test mode)");
        onPaymentSuccess();
        return;
      }
      
      if (!intentResponse.success || !intentResponse.data) {
        toast.error("Failed to initialize payment");
        setIsProcessing(false);
        return;
      }
      
      const { paymentIntentId } = intentResponse.data;
      
      // Step 2: For demo/test mode, simulate payment method creation
      // In production, this would use Stripe Elements
      
      // Step 3: Confirm payment with backend
      const confirmResponse = await paymentService.confirmPayment(
        paymentIntentId,
        MOCK_PAYMENT_METHOD_ID
      );
      
      if (confirmResponse.success && confirmResponse.data?.success) {
        toast.success("Payment successful!");
        onPaymentSuccess();
      } else {
        toast.error(confirmResponse.error || "Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment processing error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Plans
        </button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Payment Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-slate-900">Payment Details</h2>
                <p className="text-slate-600 text-sm">Complete your purchase securely</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Card Number */}
              <div>
                <label className="block text-slate-700 mb-2 text-sm">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, "");
                      if (value.length <= 16 && /^\d*$/.test(value)) {
                        setCardNumber(formatCardNumber(value));
                      }
                    }}
                    placeholder="1234 5678 9012 3456"
                    className={`w-full px-4 py-3 bg-slate-50 border ${
                      errors.cardNumber ? "border-red-500" : "border-slate-200"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                {errors.cardNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
                )}
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-slate-700 mb-2 text-sm">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="John Doe"
                  className={`w-full px-4 py-3 bg-slate-50 border ${
                    errors.cardName ? "border-red-500" : "border-slate-200"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.cardName && (
                  <p className="text-red-500 text-sm mt-1">{errors.cardName}</p>
                )}
              </div>

              {/* Expiry & CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-2 text-sm">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 4) {
                        setExpiryDate(formatExpiryDate(value));
                      }
                    }}
                    placeholder="MM/YY"
                    className={`w-full px-4 py-3 bg-slate-50 border ${
                      errors.expiryDate ? "border-red-500" : "border-slate-200"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {errors.expiryDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-slate-700 mb-2 text-sm">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 4 && /^\d*$/.test(value)) {
                        setCvv(value);
                      }
                    }}
                    placeholder="123"
                    className={`w-full px-4 py-3 bg-slate-50 border ${
                      errors.cvv ? "border-red-500" : "border-slate-200"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {errors.cvv && (
                    <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Pay {selectedPlan.price}
                  </>
                )}
              </button>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                <Lock className="w-4 h-4" />
                <span>Secured by Stripe • 256-bit SSL encryption</span>
              </div>
            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-8">
              <h3 className="text-slate-900 mb-6">Order Summary</h3>

              <div className="space-y-4 mb-6 pb-6 border-b border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-600">{selectedPlan.name} Plan</span>
                  <span className="text-slate-900">{selectedPlan.price}/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Processing Fee</span>
                  <span className="text-slate-900">$0.00</span>
                </div>
              </div>

              <div className="flex justify-between mb-6">
                <span className="text-slate-900">Total due today</span>
                <span className="text-2xl text-slate-900">{selectedPlan.price}</span>
              </div>

              {/* Plan Features */}
              <div className="bg-blue-50 rounded-xl p-6 mb-6">
                <p className="text-slate-700 text-sm mb-3">
                  What's included in your {selectedPlan.name} plan:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-slate-700 text-sm">
                    <Check className="w-4 h-4 text-blue-600" />
                    Full access to all features
                  </li>
                  <li className="flex items-center gap-2 text-slate-700 text-sm">
                    <Check className="w-4 h-4 text-blue-600" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2 text-slate-700 text-sm">
                    <Check className="w-4 h-4 text-blue-600" />
                    Cancel anytime
                  </li>
                </ul>
              </div>

              {/* Money-back Guarantee */}
              <div className="text-center">
                <p className="text-slate-600 text-sm">
                  🛡️ 30-day money-back guarantee
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

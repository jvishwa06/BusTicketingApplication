import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true
    },
    value: {
      type: Number, 
      required: true,
      min: [1, 'Discount value must be at least 1']
    },
    maxDiscountAmount: {
      type: Number,
      default: null
    },
    minBookingAmount: {
      type: Number,
      default: 0
    },
    validFrom: {
      type: Date,
      default: Date.now
    },
    validUntil: {
      type: Date,
      required: true
    },
    usageLimit: {
      type: Number,
      default: null
    },
    usageCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    applicableBusTypes: {
      type: [String],
      enum: ['AC', 'Non-AC', 'Sleeper', 'Seater'],
      default: null
    }
  },
  { timestamps: true }
);

discountSchema.index({ isActive: 1 });
discountSchema.index({ validUntil: 1 });

discountSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    (this.usageLimit === null || this.usageCount < this.usageLimit)
  );
};

discountSchema.methods.calculateDiscount = function(bookingAmount) {
  if (bookingAmount < this.minBookingAmount) {
    return 0;
  }

  let discountAmount = 0;
  if (this.discountType === 'percentage') {
    discountAmount = (bookingAmount * this.value) / 100;
    if (this.maxDiscountAmount !== null && discountAmount > this.maxDiscountAmount) {
      discountAmount = this.maxDiscountAmount;
    }
  } else { 
    discountAmount = this.value;
  }

  return Math.min(discountAmount, bookingAmount); 
};

export default mongoose.model('Discount', discountSchema);

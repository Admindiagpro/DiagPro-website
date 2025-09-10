import axios from 'axios';

class MoyasarService {
  constructor() {
    this.apiKey = process.env.MOYASAR_API_KEY;
    this.baseURL = process.env.MOYASAR_BASE_URL || 'https://api.moyasar.com/v1';
    this.isTestMode = process.env.NODE_ENV !== 'production';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`
      }
    });
  }

  async createPayment(paymentData) {
    try {
      console.log('Creating Moyasar payment:', JSON.stringify(paymentData, null, 2));
      
      const response = await this.client.post('/payments', paymentData);
      
      return {
        success: true,
        payment: response.data
      };
    } catch (error) {
      console.error('Moyasar payment creation error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || 'Payment creation failed',
        details: error.response?.data
      };
    }
  }

  async getPayment(paymentId) {
    try {
      const response = await this.client.get(`/payments/${paymentId}`);
      
      return {
        success: true,
        payment: response.data
      };
    } catch (error) {
      console.error('Moyasar get payment error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to retrieve payment',
        details: error.response?.data
      };
    }
  }

  async refundPayment(paymentId, amount, reason = 'Customer request') {
    try {
      const refundData = {
        amount,
        description: reason
      };
      
      const response = await this.client.post(`/payments/${paymentId}/refund`, refundData);
      
      return {
        success: true,
        refund: response.data
      };
    } catch (error) {
      console.error('Moyasar refund error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || 'Refund processing failed',
        details: error.response?.data
      };
    }
  }

  async listPayments(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.created_gte) queryParams.append('created[gte]', filters.created_gte);
      if (filters.created_lte) queryParams.append('created[lte]', filters.created_lte);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.source_type) queryParams.append('source.type', filters.source_type);
      
      const response = await this.client.get(`/payments?${queryParams.toString()}`);
      
      return {
        success: true,
        payments: response.data.payments,
        pagination: {
          has_more: response.data.has_more,
          total_count: response.data.total_count
        }
      };
    } catch (error) {
      console.error('Moyasar list payments error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to list payments',
        details: error.response?.data
      };
    }
  }

  async createInvoice(invoiceData) {
    try {
      const response = await this.client.post('/invoices', invoiceData);
      
      return {
        success: true,
        invoice: response.data
      };
    } catch (error) {
      console.error('Moyasar invoice creation error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || 'Invoice creation failed',
        details: error.response?.data
      };
    }
  }

  async validateWebhookSignature(payload, signature) {
    try {
      const crypto = await import('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.MOYASAR_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Webhook signature validation error:', error.message);
      return false;
    }
  }

  // Helper method to format amount for Moyasar (convert SAR to halalas)
  formatAmount(amount) {
    return Math.round(amount * 100);
  }

  // Helper method to format amount from Moyasar (convert halalas to SAR)
  parseAmount(amount) {
    return amount / 100;
  }

  // Get supported payment methods
  getSupportedPaymentMethods() {
    return [
      {
        type: 'creditcard',
        name: 'Credit Card',
        name_ar: 'بطاقة ائتمانية',
        description: 'Visa, Mastercard, Mada',
        description_ar: 'فيزا، ماستركارد، مدى',
        fees: {
          percentage: 2.9,
          fixed: 0
        }
      },
      {
        type: 'applepay',
        name: 'Apple Pay',
        name_ar: 'أبل باي',
        description: 'Pay with Touch ID or Face ID',
        description_ar: 'ادفع باستخدام بصمة الإصبع أو الوجه',
        fees: {
          percentage: 2.9,
          fixed: 0
        }
      },
      {
        type: 'stcpay',
        name: 'STC Pay',
        name_ar: 'إس تي سي باي',
        description: 'Digital wallet by STC',
        description_ar: 'المحفظة الرقمية من إس تي سي',
        fees: {
          percentage: 2.5,
          fixed: 0
        }
      }
    ];
  }

  // Calculate fees for a payment
  calculateFees(amount, paymentMethod = 'creditcard') {
    const methods = this.getSupportedPaymentMethods();
    const method = methods.find(m => m.type === paymentMethod);
    
    if (!method) {
      throw new Error(`Unsupported payment method: ${paymentMethod}`);
    }

    const percentageFee = (amount * method.fees.percentage) / 100;
    const fixedFee = method.fees.fixed;
    const totalFees = percentageFee + fixedFee;

    return {
      amount,
      percentageFee,
      fixedFee,
      totalFees,
      totalAmount: amount + totalFees
    };
  }
}

// Export as singleton
const moyasarServiceInstance = new MoyasarService();
export { moyasarServiceInstance as MoyasarService };
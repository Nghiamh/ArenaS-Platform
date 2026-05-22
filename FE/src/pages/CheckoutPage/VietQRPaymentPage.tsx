import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Copy, Check, Loader2, QrCode, AlertCircle } from 'lucide-react';
import { getSubscriptionCheckoutStatus, sendFakeSubscriptionPayment } from '../../Axios/Axios';

interface OrderResponse {
  success: boolean;
  orderId: string;
  paymentCode: string;
  qrUrl: string;
  totalAmount: number;
}

export const VietQRPaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const planInfo = location.state || { planName: 'Gói Chuyên Nghiệp', price: '6.948.000', totalAmount: 6948000 };
  
  const [loading, setLoading] = useState<boolean>(true);
  const error = null;
  
  // Initialize orderData from location state details passed from CheckoutPage
  const [orderData, setOrderData] = useState<OrderResponse | null>(() => {
    if (planInfo.paymentCode && planInfo.qrUrl) {
      return {
        success: true,
        orderId: planInfo.paymentCode,
        paymentCode: planInfo.paymentCode,
        qrUrl: planInfo.qrUrl,
        totalAmount: planInfo.totalAmount
      };
    }
    return null;
  });

  const [copiedField, setCopiedField] = useState<'amount' | 'code' | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [fakeLoading, setFakeLoading] = useState(false);

  useEffect(() => {
    if (orderData) {
      setLoading(false);
      return;
    }

    // Fallback if accessed /payment-qr directly without state
    const mockData: OrderResponse = {
      success: true,
      orderId: "PAYDEFAULT",
      paymentCode: "PAYDEFAULT",
      qrUrl: `https://img.vietqr.io/image/MB-0342347435-compact2.jpg?amount=${planInfo.totalAmount || 1500000}&addInfo=PAYDEFAULT&accountName=ARENAS`,
      totalAmount: planInfo.totalAmount || 1500000
    };
    setOrderData(mockData);
    setLoading(false);
  }, [planInfo, orderData]);

  useEffect(() => {
    if (!orderData?.paymentCode || orderData.paymentCode === 'PAYDEFAULT') return;

    const checkStatus = async () => {
      try {
        const response = await getSubscriptionCheckoutStatus(orderData.paymentCode);
        
        if (response.success && response.status === 'completed') {
          // Notify app to clear user profile cache or reload profile
          try {
            localStorage.setItem('subscription_activated', '1');
            window.dispatchEvent(new Event('currentUserUpdated'));
          } catch (e) {
            console.error(e);
          }

          navigate('/payment-success', {
            state: {
              planName: planInfo.planName,
              price: planInfo.price,
              paymentMethod: 'banking',
              transactionId: orderData.paymentCode,
              date: new Date().toLocaleDateString('vi-VN', {
                hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
              })
            }
          });
        }
      } catch (err) {
        console.error('Lỗi khi kiểm tra trạng thái thanh toán:', err);
      }
    };

    const intervalId = setInterval(checkStatus, 3000); // Check every 3 seconds

    return () => clearInterval(intervalId);
  }, [orderData, navigate, planInfo]);

  const handleManualCheck = async () => {
    if (!orderData?.paymentCode || orderData.paymentCode === 'PAYDEFAULT') {
      setPaymentError("Mã thanh toán không hợp lệ.");
      return;
    }
    
    setCheckingStatus(true);
    setPaymentError(null);
    try {
      const response = await getSubscriptionCheckoutStatus(orderData.paymentCode);
      
      if (response.success && response.status === 'completed') {
        try {
          localStorage.setItem('subscription_activated', '1');
          window.dispatchEvent(new Event('currentUserUpdated'));
        } catch (e) {}

        navigate('/payment-success', {
          state: {
            planName: planInfo.planName,
            price: planInfo.price,
            paymentMethod: 'banking',
            transactionId: orderData.paymentCode,
            date: new Date().toLocaleDateString('vi-VN', {
              hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
            })
          }
        });
      } else {
        setPaymentError("Giao dịch chưa hoàn tất. Vui lòng chuyển khoản chính xác thông tin và đợi vài giây.");
      }
    } catch (err) {
      setPaymentError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleFakePayment = async () => {
    if (!orderData?.paymentCode || orderData.paymentCode === 'PAYDEFAULT') {
      setPaymentError("Mã thanh toán không hợp lệ.");
      return;
    }
    
    setFakeLoading(true);
    setPaymentError(null);
    try {
      const res = await sendFakeSubscriptionPayment(orderData.paymentCode);
      if (res.success) {
        try {
          localStorage.setItem('subscription_activated', '1');
          window.dispatchEvent(new Event('currentUserUpdated'));
        } catch (e) {}

        navigate('/payment-success', {
          state: {
            planName: planInfo.planName,
            price: planInfo.price,
            paymentMethod: 'banking',
            transactionId: orderData.paymentCode,
            date: new Date().toLocaleDateString('vi-VN', {
              hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
            })
          }
        });
      } else {
        setPaymentError(res.message || "Giả lập thanh toán thất bại.");
      }
    } catch (err: any) {
      setPaymentError(err.message || "Lỗi kết nối giả lập thanh toán.");
    } finally {
      setFakeLoading(false);
    }
  };

  const handleCopy = async (text: string, field: 'amount' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Lỗi khi sao chép:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#071024] text-white font-sans selection:bg-blue-500/30 flex flex-col relative overflow-hidden">
      {/* Background gradients */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(37,99,235,0.08),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.08),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(14,165,233,0.05),transparent_32%)]" />

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md bg-slate-900/60 rounded-[2.5rem] border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.4)] backdrop-blur-2xl overflow-hidden transition-all duration-300">
          
          {/* Header Section */}
          <div className="px-8 pt-10 pb-6 text-center border-b border-white/10 relative">
            <button 
              onClick={() => navigate('/checkout')}
              className="absolute left-6 top-8 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-800/50 border border-white/5 rounded-2xl mb-4 shadow-inner">
              <QrCode className="w-7 h-7 text-blue-400" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Thanh toán đơn hàng</h1>
            <p className="mt-2 text-[15px] text-slate-400">Quét mã QR qua ứng dụng ngân hàng</p>
          </div>

          {/* Content Section */}
          <div className="p-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" strokeWidth={2} />
                <p className="text-[15px] text-slate-400 font-medium animate-pulse">Đang khởi tạo mã bảo mật...</p>
              </div>
            ) : error && !orderData ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
                <AlertCircle className="w-12 h-12 text-red-400" strokeWidth={1.5} />
                <p className="text-[15px] font-medium text-slate-200">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-2 px-6 py-2.5 text-[15px] font-medium text-white bg-blue-600 rounded-full hover:bg-blue-500 transition-colors active:scale-95 shadow-[0_4px_12px_rgba(37,99,235,0.3)]"
                >
                  Thử lại
                </button>
              </div>
            ) : orderData ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                
                {/* QR Code Area */}
                <div className="flex flex-col items-center">
                  <div className="relative p-4 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform hover:scale-[1.02] duration-300 w-full max-w-[270px]">
                    <img 
                      src={orderData.qrUrl} 
                      alt="VietQR Payment Code" 
                      className="w-full h-auto object-contain rounded-2xl"
                      draggable={false}
                    />
                  </div>
                  
                  {/* Micro-loading spinner cho trạng thái "Đang chờ thanh toán" */}
                  <div className="mt-6 flex items-center space-x-2.5 text-[14px] text-slate-300 font-medium bg-slate-800/40 px-4 py-2 rounded-full border border-white/5 shadow-inner">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Đang chờ thanh toán...</span>
                  </div>
                </div>

                {/* Payment Information Details */}
                <div className="space-y-1 bg-slate-800/30 rounded-[1.5rem] p-3 border border-white/5">
                  
                  {/* Amount Row */}
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition-colors group">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-slate-400 tracking-wide mb-1">Số tiền</span>
                      <span className="text-[19px] font-semibold text-white tracking-tight">
                        {formatCurrency(orderData.totalAmount)}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleCopy(orderData.totalAmount.toString(), 'amount')}
                      className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-all active:scale-90"
                      title="Sao chép số tiền"
                    >
                      {copiedField === 'amount' ? (
                        <Check className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Copy className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  </div>

                  <div className="h-[1px] mx-3 bg-white/5"></div>

                  {/* Transfer Content Row */}
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition-colors group">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-slate-400 tracking-wide mb-1">Nội dung chuyển khoản</span>
                      <span className="text-[19px] font-semibold text-blue-400 tracking-tight">
                        {orderData.paymentCode}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleCopy(orderData.paymentCode, 'code')}
                      className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-all active:scale-90"
                      title="Sao chép nội dung"
                    >
                      {copiedField === 'code' ? (
                        <Check className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Copy className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  </div>

                </div>

                {/* Bottom Note */}
                <p className="text-[13px] text-center text-slate-400 leading-relaxed px-2">
                  Nhập chính xác số tiền và nội dung chuyển khoản để hệ thống xác nhận tự động.
                </p>

                {paymentError && (
                  <div className="flex items-center gap-2.5 text-sm text-red-400 bg-red-950/30 border border-red-500/20 p-3.5 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}
                
                <button 
                  onClick={handleManualCheck}
                  disabled={checkingStatus || fakeLoading}
                  className="w-full mt-2 py-4 flex justify-center items-center gap-2 text-[15px] font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-70 disabled:cursor-not-allowed rounded-[1rem] shadow-[0_4px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_4px_24px_rgba(37,99,235,0.3)] transition-all duration-300"
                >
                  {checkingStatus ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang kiểm tra...
                    </>
                  ) : (
                    'Tôi đã thanh toán'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleFakePayment}
                  disabled={checkingStatus || fakeLoading}
                  className="w-full mt-2 py-3.5 flex justify-center items-center gap-2 text-[14px] font-semibold text-amber-400 bg-amber-950/20 border border-amber-500/20 hover:bg-amber-950/40 disabled:opacity-70 disabled:cursor-not-allowed rounded-[1.25rem] transition-all active:scale-[0.98]"
                >
                  {fakeLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      Đang giả lập...
                    </>
                  ) : (
                    '🧪 Giả lập thanh toán (Dev)'
                  )}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VietQRPaymentPage;

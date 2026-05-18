import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Copy, Check, Loader2, QrCode, AlertCircle } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<OrderResponse | null>(null);
  const [copiedField, setCopiedField] = useState<'amount' | 'code' | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetching to the backend API (this will fail if backend is not setup for this exact route yet)
        const response = await fetch('http://localhost:5000/api/payment/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ totalAmount: planInfo.totalAmount || 1500000 }), 
        });

        if (!response.ok) {
          // Mock data in case API fails during development
          const mockData: OrderResponse = {
            success: true,
            orderId: "65db123456789",
            paymentCode: "DH4A5E21",
            qrUrl: `https://img.vietqr.io/image/vietcombank-1234567890-qr_only.png?amount=${planInfo.totalAmount || 1500000}&addInfo=DH4A5E21`,
            totalAmount: planInfo.totalAmount || 1500000
          };
          setOrderData(mockData);
          setLoading(false);
          return;
          // throw new Error('Không thể kết nối đến máy chủ thanh toán.');
        }

        const data: OrderResponse = await response.json();
        
        if (data.success) {
          setOrderData(data);
        } else {
          throw new Error('Tạo đơn hàng thất bại.');
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Đã có lỗi không xác định xảy ra');
        
        // Mock fallback for development if needed
        const mockData: OrderResponse = {
          success: true,
          orderId: "65db123456789",
          paymentCode: "DH4A5E21",
          qrUrl: `https://img.vietqr.io/image/vietcombank-1234567890-qr_only.png?amount=${planInfo.totalAmount || 1500000}&addInfo=DH4A5E21`,
          totalAmount: planInfo.totalAmount || 1500000
        };
        setOrderData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [planInfo.totalAmount]);

  useEffect(() => {
    if (!orderData?.paymentCode) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/payment/order/${orderData.paymentCode}`);
        const data = await response.json();
        
        if (data.transaction && data.transaction.status === 'completed') {
          navigate('/payment-success', {
            state: {
              planName: planInfo.planName,
              price: planInfo.price,
              paymentMethod: 'banking',
              transactionId: orderData.orderId,
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
    if (!orderData?.paymentCode) return;
    
    setCheckingStatus(true);
    setPaymentError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/payment/order/${orderData.paymentCode}`);
      const data = await response.json();
      
      if (data.transaction && data.transaction.status === 'completed') {
        navigate('/payment-success', {
          state: {
            planName: planInfo.planName,
            price: planInfo.price,
            paymentMethod: 'banking',
            transactionId: orderData.orderId,
            date: new Date().toLocaleDateString('vi-VN', {
              hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
            })
          }
        });
      } else {
        setPaymentError("Giao dịch chưa hoàn tất. Vui lòng kiểm tra lại sau giây lát.");
      }
    } catch (err) {
      setPaymentError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setCheckingStatus(false);
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
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col font-sans antialiased">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300">
          
          {/* Header Section */}
          <div className="px-8 pt-10 pb-6 text-center border-b border-gray-100/60 relative">
            <button 
              onClick={() => navigate('/checkout')}
              className="absolute left-6 top-8 text-gray-400 hover:text-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-50 rounded-2xl mb-5 shadow-sm">
              <QrCode className="w-7 h-7 text-slate-800" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Thanh toán đơn hàng</h1>
            <p className="mt-2 text-[15px] text-gray-500">Quét mã QR qua ứng dụng ngân hàng</p>
          </div>

          {/* Content Section */}
          <div className="p-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" strokeWidth={2} />
                <p className="text-[15px] text-gray-500 font-medium">Đang khởi tạo mã bảo mật...</p>
              </div>
            ) : error && !orderData ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
                <AlertCircle className="w-12 h-12 text-red-400" strokeWidth={1.5} />
                <p className="text-[15px] font-medium text-gray-800">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-2 px-6 py-2.5 text-[15px] font-medium text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-colors active:scale-95"
                >
                  Thử lại
                </button>
              </div>
            ) : orderData ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                
                {/* QR Code Area */}
                <div className="flex flex-col items-center">
                  <div className="relative p-5 bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-transform hover:scale-[1.02] duration-300">
                    <img 
                      src={orderData.qrUrl} 
                      alt="VietQR Payment Code" 
                      className="w-[200px] h-[200px] object-contain"
                      draggable={false}
                    />
                  </div>
                  
                  {/* Micro-loading spinner cho trạng thái "Đang chờ thanh toán" */}
                  <div className="mt-6 flex items-center space-x-2.5 text-[14px] text-gray-500 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    <span>Đang chờ thanh toán...</span>
                  </div>
                </div>

                {/* Payment Information Details */}
                <div className="space-y-1 bg-[#F9F9FB] rounded-[1.5rem] p-3 border border-gray-100/50">
                  
                  {/* Amount Row */}
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white transition-colors group">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-gray-400 tracking-wide mb-1">Số tiền</span>
                      <span className="text-[19px] font-semibold text-gray-900 tracking-tight">
                        {formatCurrency(orderData.totalAmount)}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleCopy(orderData.totalAmount.toString(), 'amount')}
                      className="p-2.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all active:scale-90"
                      title="Sao chép số tiền"
                    >
                      {copiedField === 'amount' ? (
                        <Check className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Copy className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  </div>

                  <div className="h-[1px] mx-3 bg-gray-200/50"></div>

                  {/* Transfer Content Row */}
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white transition-colors group">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-gray-400 tracking-wide mb-1">Nội dung chuyển khoản</span>
                      <span className="text-[19px] font-semibold text-blue-600 tracking-tight">
                        {orderData.paymentCode}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleCopy(orderData.paymentCode, 'code')}
                      className="p-2.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all active:scale-90"
                      title="Sao chép nội dung"
                    >
                      {copiedField === 'code' ? (
                        <Check className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Copy className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  </div>

                </div>

                {/* Bottom Note */}
                <p className="text-[13px] text-center text-gray-400 leading-relaxed px-2">
                  Nhập chính xác số tiền và nội dung chuyển khoản để hệ thống xác nhận tự động.
                </p>

                {paymentError && (
                  <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}
                
                <button 
                  onClick={handleManualCheck}
                  disabled={checkingStatus}
                  className="w-full mt-2 py-4 flex justify-center items-center gap-2 text-[15px] font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed rounded-[1rem] transition-all"
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
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VietQRPaymentPage;

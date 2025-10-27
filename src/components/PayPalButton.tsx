import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalButtonProps {
  bookingData: {
    serviceId: string;
    serviceName: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    bookingDate?: string;
    persons?: number;
    adultsCount?: number;
    childrenCount?: number;
    startDate?: string;
    endDate?: string;
    transferFrom?: string;
    transferTo?: string;
    flightNumber?: string;
    message?: string;
    pricePerPerson?: number;
    totalPrice: number;
  };
  disabled?: boolean;
}

const PAYPAL_CLIENT_ID = 'AVknsgi0WR6HoEXcQ020CAGWZCluHSxLdTA1IwrfpS57L4OpjErP7XjzR2GXcd77K_URwbC3bZLFarXz';

const PayPalButton = ({ bookingData, disabled }: PayPalButtonProps) => {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const existingScript = document.querySelector('script[data-paypal-sdk]');

    if (existingScript) {
      setScriptLoaded(true);
      setIsLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=EUR`;
    script.setAttribute('data-paypal-sdk', 'true');
    script.async = true;

    script.onload = () => {
      setScriptLoaded(true);
      setIsLoading(false);
    };

    script.onerror = () => {
      setIsLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to load PayPal. Please refresh the page.',
        variant: 'destructive',
      });
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [toast]);

  useEffect(() => {
    if (!scriptLoaded || !window.paypal || !paypalRef.current || disabled) {
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    window.paypal
      .Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
          height: 45,
        },

        createOrder: async () => {
          try {
            const response = await fetch(
              `${supabaseUrl}/functions/v1/paypal-create-order`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingData),
              }
            );

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || 'Failed to create order');
            }

            return data.orderID;
          } catch (error) {
            console.error('Create order error:', error);
            toast({
              title: 'Error',
              description: 'Failed to create PayPal order. Please try again.',
              variant: 'destructive',
            });
            throw error;
          }
        },

        onApprove: async (data: { orderID: string }) => {
          try {
            const response = await fetch(
              `${supabaseUrl}/functions/v1/paypal-capture-order`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderID: data.orderID }),
              }
            );

            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.error || 'Payment capture failed');
            }

            toast({
              title: 'Payment Successful!',
              description: 'Your booking has been confirmed. Redirecting...',
            });

            setTimeout(() => {
              navigate('/thank-you');
            }, 1500);
          } catch (error) {
            console.error('Capture order error:', error);
            toast({
              title: 'Payment Error',
              description: 'Payment was approved but could not be completed. Please contact us.',
              variant: 'destructive',
            });
          }
        },

        onError: (err: any) => {
          console.error('PayPal error:', err);
          toast({
            title: 'Payment Error',
            description: 'An error occurred during payment. Please try again.',
            variant: 'destructive',
          });
        },

        onCancel: () => {
          toast({
            title: 'Payment Cancelled',
            description: 'You cancelled the payment. Your booking was not completed.',
          });
        },
      })
      .render(paypalRef.current);
  }, [scriptLoaded, disabled, bookingData, navigate, toast]);

  if (isLoading) {
    return (
      <div className="w-full py-4 text-center text-muted-foreground">
        Loading payment options...
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={paypalRef} className={disabled ? 'opacity-50 pointer-events-none' : ''} />
      {disabled && (
        <p className="text-sm text-destructive mt-2 text-center">
          Please fill in all required fields above
        </p>
      )}
    </div>
  );
};

export default PayPalButton;

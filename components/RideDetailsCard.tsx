import React from 'react';
import { RideDetails, PaymentMethod } from '../types';
import { UserIcon, CarIcon, LicenseIcon, PriceIcon, CreditCardIcon, CashIcon, GooglePayIcon, PhonePeIcon, ClockIcon } from './icons/Icons';
import LoadingSpinner from './LoadingSpinner';

interface RideDetailsCardProps {
    details: RideDetails;
    paymentMethods: PaymentMethod[];
    onPay: (method: PaymentMethod) => void;
    payingMethodId: string | null;
    onCancelRequest: () => void;
    dynamicEta?: number | null;
}

const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: string | React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-center space-x-4">
        <div className="bg-blue-100 p-2 rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="font-semibold text-gray-800">{value}</p>
        </div>
    </div>
);


const RideDetailsCard: React.FC<RideDetailsCardProps> = ({ details, paymentMethods, onPay, payingMethodId, onCancelRequest, dynamicEta }) => {
    
    const getPaymentIcon = (method: PaymentMethod) => {
        switch (method.type) {
            case 'CASH': return <CashIcon className="w-6 h-6" />;
            case 'CARD': return <CreditCardIcon className="w-6 h-6" />;
            case 'GOOGLE_PAY': return <GooglePayIcon className="w-6 h-6" />;
            case 'PHONE_PE': return <PhonePeIcon className="w-6 h-6" />;
            default: return null;
        }
    };
    
    const getPaymentLabel = (method: PaymentMethod) => {
        switch (method.type) {
            case 'CASH': return 'Pay with Cash';
            case 'CARD': return `${method.brand} **** ${method.last4}`;
            case 'GOOGLE_PAY': return 'Google Pay';
            case 'PHONE_PE': return 'PhonePe';
            default: return 'Pay';
        }
    };
    
    const PaymentMethodButton: React.FC<{ method: PaymentMethod, onPay: (method: PaymentMethod) => void, isPaying: boolean }> = ({ method, onPay, isPaying }) => (
        <button
            onClick={() => onPay(method)}
            disabled={isPaying}
            className="w-full p-3 border rounded-lg flex items-center justify-between text-left transition-colors hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed"
        >
            <div className="flex items-center">
                <div className="mr-4 text-gray-600">{getPaymentIcon(method)}</div>
                <span className="font-semibold text-gray-800">{getPaymentLabel(method)}</span>
            </div>
            {isPaying ? <LoadingSpinner size="sm" /> : <span className="text-lg font-bold text-gray-800">{'>'}</span>}
        </button>
    );
    
    return (
        <div className="p-4 bg-white rounded-lg animate-fade-in-up">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Ride Confirmed!</h2>
            <p className="text-center text-gray-600 mb-6">Your driver is on the way. Please be ready to pay ₹{details.fare}.</p>
            
            <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    {details.driverPhotoUrl ? (
                         <img src={details.driverPhotoUrl} alt={details.driverName} className="w-16 h-16 rounded-full object-cover shadow-md" />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="w-8 h-8 text-gray-400"/>
                        </div>
                    )}
                    <div>
                        <p className="font-bold text-lg text-gray-800">{details.driverName}</p>
                        <p className="text-sm text-gray-600">{details.driverBio}</p>
                    </div>
                </div>
                {dynamicEta !== null && dynamicEta !== undefined && (
                    <DetailRow 
                        icon={<ClockIcon className="w-5 h-5 text-blue-600" />} 
                        label="Arrival Time" 
                        value={dynamicEta > 0 ? `${dynamicEta} min` : <span className="text-green-600 font-bold">Arriving now</span>} 
                    />
                )}
                <DetailRow icon={<CarIcon className="w-5 h-5 text-blue-600" />} label="Vehicle" value={details.vehicleModel} />
                <DetailRow icon={<LicenseIcon className="w-5 h-5 text-blue-600" />} label="License Plate" value={details.licensePlate} />
                <DetailRow icon={<PriceIcon className="w-5 h-5 text-blue-600" />} label="Estimated Fare" value={`₹${details.fare}`} />
            </div>

            <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">Choose Payment Method</h3>
            <div className="space-y-3">
                {paymentMethods.map(method => (
                    <PaymentMethodButton 
                        key={method.id} 
                        method={method} 
                        onPay={onPay} 
                        isPaying={payingMethodId === method.id}
                    />
                ))}
            </div>

            <div className="mt-6 text-center">
                <button
                    onClick={onCancelRequest}
                    className="w-full bg-transparent border-2 border-red-500 text-red-500 font-bold py-2 px-4 rounded-lg hover:bg-red-50 transition-colors"
                >
                    Cancel Ride
                </button>
            </div>
        </div>
    );
};

export default RideDetailsCard;
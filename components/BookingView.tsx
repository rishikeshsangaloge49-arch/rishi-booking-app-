import React, { useState, useCallback, useEffect } from 'react';
import { RideStatus, RideDetails, PaymentMethod, CompletedRide, FareEstimate } from '../types';
import { generateRideDetails, estimateFareAndSuggestVehicle } from '../services/geminiService';
import { BikeIcon, AutoIcon, CarIcon, ErrorIcon, CheckCircleIcon, HistoryIcon, UserIcon, LicenseIcon, PriceIcon, CalendarIcon, MapPinIcon, MapViewIcon, ListIcon, ClockIcon } from './icons/Icons';
import MapView from './MapView';
import RideDetailsCard from './RideDetailsCard';
import LoadingSpinner from './LoadingSpinner';

interface BookingViewProps {
    pickup: string;
    setPickup: (value: string) => void;
    destination: string;
    setDestination: (value: string) => void;
    vehicle: 'BIKE' | 'AUTO' | 'CAR';
    setVehicle: (value: 'BIKE' | 'AUTO' | 'CAR') => void;
    paymentMethods: PaymentMethod[];
    rideHistory: CompletedRide[];
    onRideComplete: (ride: { pickup: string; destination: string; } & RideDetails) => void;
    showToast: (message: string) => void;
}

const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="flex items-start space-x-4">
        <div className="bg-blue-100 p-2 rounded-full mt-1">{icon}</div>
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="font-semibold text-gray-800">{value}</p>
        </div>
    </div>
);

const RideInfoSkeleton: React.FC = () => (
    <div className="p-4 bg-white/80 backdrop-blur-sm rounded-lg w-full">
        <div className="space-y-4 animate-shimmer">
            <div className="h-6 w-3/4 rounded bg-gray-200"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
            <div className="space-y-3 pt-4">
                <div className="h-8 w-full rounded-lg bg-gray-200"></div>
                <div className="h-8 w-full rounded-lg bg-gray-300"></div>
                <div className="h-8 w-full rounded-lg bg-gray-200"></div>
            </div>
        </div>
    </div>
);


const BookingView: React.FC<BookingViewProps> = ({ pickup, setPickup, destination, setDestination, vehicle, setVehicle, paymentMethods, rideHistory, onRideComplete, showToast }) => {
    const [rideStatus, setRideStatus] = useState<RideStatus>(RideStatus.IDLE);
    const [rideDetails, setRideDetails] = useState<RideDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [payingMethodId, setPayingMethodId] = useState<string | null>(null);
    const [isShowingHistory, setIsShowingHistory] = useState(false);
    const [selectedRide, setSelectedRide] = useState<CompletedRide | null>(null);
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [driverPosition, setDriverPosition] = useState({ top: '40%', left: '60%' });
    const [cancellationStep, setCancellationStep] = useState<'idle' | 'confirm' | 'reason'>('idle');
    const [cancellationReason, setCancellationReason] = useState('');
    const [fareEstimate, setFareEstimate] = useState<FareEstimate | null>(null);
    const [isEstimating, setIsEstimating] = useState(false);
    const [dynamicEta, setDynamicEta] = useState<number | null>(null);
    
    const CANCELLATION_REASONS = [
        "Driver is too far",
        "Changed my mind",
        "Booked by mistake",
        "Longer wait time than expected",
        "Found another ride",
    ];

    useEffect(() => {
        // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
        let timeoutId: ReturnType<typeof setTimeout>;
        const debouncedEstimate = (p: string, d: string) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                if (p.length > 2 && d.length > 2) {
                    setIsEstimating(true);
                    setFareEstimate(null); 
                    try {
                        const estimate = await estimateFareAndSuggestVehicle(p, d);
                        setFareEstimate(estimate);
                        if(estimate.suggestedVehicle) {
                            setVehicle(estimate.suggestedVehicle);
                        }
                    } catch (e) {
                        console.error("Fare estimation error:", e);
                    } finally {
                        setIsEstimating(false);
                    }
                } else {
                    setFareEstimate(null);
                }
            }, 800);
        };
        debouncedEstimate(pickup, destination);
        return () => clearTimeout(timeoutId);
    }, [pickup, destination, setVehicle]);

    useEffect(() => {
        // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
        let moveInterval: ReturnType<typeof setTimeout> | null = null;
        // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
        let etaInterval: ReturnType<typeof setTimeout> | null = null;

        if (rideStatus === RideStatus.CONFIRMED && rideDetails) {
            // Initialize ETA
            const initialEta = parseInt(rideDetails.eta.split(' ')[0], 10);
            if (!isNaN(initialEta)) {
                setDynamicEta(initialEta);
            }

            // Simulate driver movement
            moveInterval = setInterval(() => {
                setDriverPosition(prev => {
                    const newTop = parseFloat(prev.top) + (Math.random() - 0.5) * 4;
                    const newLeft = parseFloat(prev.left) + (Math.random() - 0.5) * 4;
                    return {
                        top: `${Math.max(10, Math.min(80, newTop))}%`,
                        left: `${Math.max(10, Math.min(90, newLeft))}%`,
                    };
                });
            }, 2000);

            // Simulate ETA countdown
            etaInterval = setInterval(() => {
                setDynamicEta(prevEta => {
                    if (prevEta !== null && prevEta > 0) {
                        const newEta = prevEta - 1;
                        if (newEta === 2) {
                             showToast("Your driver is 2 minutes away!");
                        }
                        return newEta;
                    }
                    return 0;
                });
            }, 60 * 1000); // Decrement every minute

        }

        return () => {
            if (moveInterval) clearInterval(moveInterval);
            if (etaInterval) clearInterval(etaInterval);
        };
    }, [rideStatus, rideDetails, showToast]);

    const handleFindRide = useCallback(async () => {
        if (!pickup || !destination) {
            setError("Please enter both pickup and destination.");
            return;
        }
        setError(null);
        setRideStatus(RideStatus.SEARCHING);
        try {
            const details = await generateRideDetails(pickup, destination, vehicle);
            setRideDetails(details);
            setRideStatus(RideStatus.CONFIRMED);
            
            // Admin notification
            const adminEmail = "rishikeshsangolge19@gmail.com";
            const adminPhone = "+918762042431";
            console.log(`[ADMIN NOTIFICATION] Ride booked: ${pickup} to ${destination}. Simulating notification to ${adminEmail} and ${adminPhone}.`);

        } catch (e) {
            console.error(e);
            setError("Could not find a ride. Please try again later.");
            setRideStatus(RideStatus.ERROR);
        }
    }, [pickup, destination, vehicle]);

    const handlePayment = useCallback((method: PaymentMethod) => {
        const completeRide = () => {
            if (rideDetails) {
                onRideComplete({
                    pickup,
                    destination,
                    ...rideDetails,
                });
            }
            setPayingMethodId(null);
            setRideStatus(RideStatus.PAID);
            setIsMapVisible(false);
            setDynamicEta(null);
        };
        
        if (method.type === 'CASH') {
            completeRide();
            return;
        }
        
        setPayingMethodId(method.id);
        setTimeout(completeRide, 2000);
    }, [pickup, destination, rideDetails, onRideComplete]);

    const handleNewRide = () => {
        setRideStatus(RideStatus.IDLE);
        setRideDetails(null);
        setPickup('');
        setDestination('');
        setError(null);
        setPayingMethodId(null);
        setIsMapVisible(false);
        setFareEstimate(null);
        setCancellationStep('idle');
        setDynamicEta(null);
    };

    const handleCancelRequest = () => {
        setCancellationStep('confirm');
    };

    const handleConfirmCancel = () => {
        handleNewRide();
        setCancellationStep('idle');
        setCancellationReason('');
    };
    
    const handleDismissCancel = () => {
        setCancellationStep('idle');
        setCancellationReason('');
    };

    const VehicleSelector: React.FC = () => (
        <div className="grid grid-cols-3 gap-4 my-4">
            <VehicleOption type="BIKE" icon={<BikeIcon />} label="Bike" isSuggested={fareEstimate?.suggestedVehicle === 'BIKE'} />
            <VehicleOption type="AUTO" icon={<AutoIcon />} label="Auto" isSuggested={fareEstimate?.suggestedVehicle === 'AUTO'} />
            <VehicleOption type="CAR" icon={<CarIcon />} label="Car" isSuggested={fareEstimate?.suggestedVehicle === 'CAR'} />
        </div>
    );

    const VehicleOption: React.FC<{ type: 'BIKE' | 'AUTO' | 'CAR', icon: React.ReactNode, label: string, isSuggested: boolean }> = ({ type, icon, label, isSuggested }) => (
        <button
            onClick={() => setVehicle(type)}
            className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center transition-all duration-300 relative ${vehicle === type ? 'bg-blue-100 border-blue-600 scale-105' : 'bg-white border-gray-200 hover:border-blue-400'}`}
        >
            {isSuggested && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
                    Best
                </span>
            )}
            {icon}
            <span className={`mt-2 font-semibold ${vehicle === type ? 'text-blue-700' : 'text-gray-700'}`}>{label}</span>
        </button>
    );

    const renderHistory = () => (
         <div className="p-4 bg-white rounded-lg animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Ride History</h2>
                <button onClick={() => setIsShowingHistory(false)} className="text-sm font-semibold text-blue-600 hover:underline">Done</button>
            </div>
            {rideHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Your ride history will appear here.</p>
            ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {rideHistory.map(ride => (
                        <button key={ride.id} onClick={() => setSelectedRide(ride)} className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <p className="font-semibold truncate">{ride.pickup} to {ride.destination}</p>
                            <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
                                <span>{ride.date}</span>
                                <span className="font-bold">₹{ride.fare}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
    
    const renderRideDetails = () => (
        <div className="p-4 bg-white rounded-lg animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Ride Details</h2>
                <button onClick={() => setSelectedRide(null)} className="text-sm font-semibold text-blue-600 hover:underline">Back to History</button>
            </div>
            {selectedRide && (
                <div className="space-y-4">
                    <div className="flex items-center space-x-4 pb-4 border-b">
                        {selectedRide.driverPhotoUrl ? (
                            <img src={selectedRide.driverPhotoUrl} alt={selectedRide.driverName} className="w-16 h-16 rounded-full object-cover shadow-md" />
                        ) : (
                             <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserIcon className="w-8 h-8 text-gray-400"/>
                            </div>
                        )}
                        <div>
                            <p className="font-bold text-lg text-gray-800">{selectedRide.driverName}</p>
                            <p className="text-sm text-gray-600">{selectedRide.driverBio}</p>
                        </div>
                    </div>
                    <DetailRow icon={<MapPinIcon className="w-5 h-5 text-green-600" />} label="From" value={selectedRide.pickup} />
                    <DetailRow icon={<MapPinIcon className="w-5 h-5 text-red-600" />} label="To" value={selectedRide.destination} />
                    <DetailRow icon={<CalendarIcon className="w-5 h-5 text-blue-600" />} label="Date" value={selectedRide.date} />
                    <DetailRow icon={<CarIcon className="w-5 h-5 text-blue-600" />} label="Vehicle" value={selectedRide.vehicleModel} />
                    <DetailRow icon={<LicenseIcon className="w-5 h-5 text-blue-600" />} label="License Plate" value={selectedRide.licensePlate} />
                    <DetailRow icon={<PriceIcon className="w-5 h-5 text-blue-600" />} label="Fare" value={`₹${selectedRide.fare}`} />
                </div>
            )}
        </div>
    );

    const renderContent = () => {
        const key = isShowingHistory ? (selectedRide ? 'details' : 'history') : rideStatus;
        return (
            <div key={key} className="animate-fade-in-up">
                {(() => {
                    if (isShowingHistory) {
                        return selectedRide ? renderRideDetails() : renderHistory();
                    }

                    switch (rideStatus) {
                        case RideStatus.SEARCHING:
                            return (
                                <div className="flex flex-col items-center justify-center text-center p-8">
                                    <RideInfoSkeleton />
                                    <p className="mt-4 text-lg font-semibold text-gray-700">Finding your ride...</p>
                                </div>
                            );
                        case RideStatus.CONFIRMED:
                            return rideDetails && <RideDetailsCard details={rideDetails} paymentMethods={paymentMethods} onPay={handlePayment} payingMethodId={payingMethodId} onCancelRequest={handleCancelRequest} dynamicEta={dynamicEta} />;
                        case RideStatus.PAID:
                            return (
                                <div className="flex flex-col items-center justify-center text-center p-8">
                                    <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
                                    <h2 className="text-2xl font-bold text-gray-800">Payment Successful!</h2>
                                    <p className="text-gray-600 mt-2">Thank you for riding with us.</p>
                                    <button onClick={handleNewRide} className="mt-6 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                                        Book Another Ride
                                    </button>
                                </div>
                            );
                        case RideStatus.ERROR:
                            return (
                                <div className="flex flex-col items-center justify-center text-center p-8 bg-red-50 rounded-lg">
                                    <ErrorIcon className="w-12 h-12 text-red-400 mb-4" />
                                    <p className="text-red-700 font-semibold">{error}</p>
                                    <button onClick={handleNewRide} className="mt-6 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                                        Try Again
                                    </button>
                                </div>
                            );
                        case RideStatus.IDLE:
                        default:
                            return (
                                <>
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            value={pickup}
                                            onChange={(e) => setPickup(e.target.value)}
                                            placeholder="Enter Pickup Location"
                                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <input
                                            type="text"
                                            value={destination}
                                            onChange={(e) => setDestination(e.target.value)}
                                            placeholder="Enter Destination"
                                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <VehicleSelector />
                                    {error && <p className="text-red-500 text-sm text-center my-2">{error}</p>}
                                    <div className="flex items-center space-x-2">
                                         <button 
                                            onClick={handleFindRide} 
                                            disabled={!pickup || !destination || isEstimating}
                                            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:bg-blue-400 flex items-center justify-center"
                                        >
                                             {isEstimating ? (
                                                <LoadingSpinner size="sm" />
                                            ) : fareEstimate ? (
                                                `Find Ride (Est. ₹${fareEstimate.estimatedFare})`
                                            ) : (
                                                'Find Ride'
                                            )}
                                        </button>
                                        <button 
                                            onClick={() => setIsShowingHistory(true)} 
                                            className="p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                            aria-label="View ride history"
                                        >
                                            <HistoryIcon className="w-6 h-6"/>
                                        </button>
                                    </div>
                                </>
                            );
                    }
                })()}
            </div>
        )
    };
    
    const renderCancellationDialog = () => {
        if (cancellationStep === 'idle') return null;

        const renderContent = () => {
            if (cancellationStep === 'confirm') {
                return (
                     <>
                        <h3 className="text-xl font-bold text-gray-800">Cancel Ride?</h3>
                        <p className="text-gray-600 my-4">Are you sure you want to cancel this ride? This action cannot be undone.</p>
                        <div className="flex justify-center space-x-4">
                            <button 
                                onClick={handleDismissCancel}
                                className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors"
                            >
                                Keep Ride
                            </button>
                            <button 
                                onClick={() => setCancellationStep('reason')}
                                className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                            >
                                Yes, Cancel
                            </button>
                        </div>
                    </>
                );
            }

            if (cancellationStep === 'reason') {
                return (
                     <>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Why are you cancelling?</h3>
                        <div className="space-y-2 text-left">
                            {CANCELLATION_REASONS.map(reason => (
                                <button
                                    key={reason}
                                    onClick={() => setCancellationReason(reason)}
                                    className={`w-full p-3 border rounded-lg text-left transition-colors ${cancellationReason === reason ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-50'}`}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-center space-x-4 mt-6">
                            <button 
                                onClick={() => setCancellationStep('confirm')}
                                className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors"
                            >
                                Back
                            </button>
                            <button 
                                onClick={handleConfirmCancel}
                                disabled={!cancellationReason}
                                className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:bg-red-300"
                            >
                                Confirm Cancellation
                            </button>
                        </div>
                    </>
                );
            }
        };

        return (
             <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className={`bg-white rounded-lg shadow-xl p-6 text-center max-w-sm w-full transition-all duration-300`}>
                     <div key={cancellationStep} className="animate-fade-in">
                        {renderContent()}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full w-full relative flex flex-col overflow-hidden">
            <MapView />
            
            {rideStatus === RideStatus.CONFIRMED && (
                <>
                    <div
                        className="absolute transition-all duration-1000 ease-linear transform -translate-x-1/2 -translate-y-1/2"
                        style={{ top: driverPosition.top, left: driverPosition.left }}
                    >
                        {rideDetails?.driverPhotoUrl ? (
                            <img src={rideDetails.driverPhotoUrl} alt="Driver" className="w-12 h-12 rounded-full object-cover shadow-lg ring-4 ring-white/50" />
                        ) : (
                             <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center shadow-lg ring-4 ring-white/50">
                                <UserIcon className="w-7 h-7 text-gray-500" />
                            </div>
                        )}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex flex-col items-center space-y-1">
                            <div className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
                                {rideDetails?.driverName}
                            </div>
                             <div className="bg-white text-gray-800 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap shadow-lg flex items-center space-x-1">
                                <ClockIcon className="w-3 h-3 text-gray-600" />
                                 <span>{dynamicEta !== null && dynamicEta > 0 ? `${dynamicEta} min` : 'Arriving'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-28 right-4 z-10">
                        <button
                            onClick={() => setIsMapVisible(!isMapVisible)}
                            className="w-14 h-14 bg-white text-gray-800 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-transform transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
                            aria-label={isMapVisible ? 'Show ride details' : 'Show live map'}
                        >
                            {isMapVisible ? <ListIcon className="w-7 h-7" /> : <MapViewIcon className="w-7 h-7" />}
                        </button>
                    </div>
                </>
            )}

            <div className={`absolute bottom-0 left-0 right-0 p-4 bg-white/70 backdrop-blur-md rounded-t-2xl shadow-up-strong transition-transform duration-500 ease-in-out ${isMapVisible ? 'translate-y-full' : 'translate-y-0'}`}>
                {renderContent()}
            </div>

            {renderCancellationDialog()}
        </div>
    );
};

export default BookingView;
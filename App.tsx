
import React, { useState, useCallback, useEffect } from 'react';
import { AppView, PaymentMethod, CompletedRide, RideDetails } from './types';
import BookingView from './components/BookingView';
import ChatBotView from './components/ChatBotView';
import ExploreView from './components/ExploreView';
import PaymentView from './components/PaymentView';
import VoiceAssistant from './components/VoiceAssistant';
import ToastNotification from './components/ToastNotification';
import AuthView from './components/AuthView';
import { RideIcon, ChatIcon, ExploreIcon, WalletIcon, LogoIcon, MicIcon } from './components/icons/Icons';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentView, setCurrentView] = useState<AppView>(AppView.BOOKING);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
        { id: 'CASH', type: 'CASH' },
        { id: '1', type: 'CARD', brand: 'Visa', last4: '4242' }
    ]);
    const [rideHistory, setRideHistory] = useState<CompletedRide[]>([]);
    const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [userProfilePhoto, setUserProfilePhoto] = useState<string | null>(null);


    // State for booking form
    const [pickup, setPickup] = useState('');
    const [destination, setDestination] = useState('');
    const [vehicle, setVehicle] = useState<'BIKE' | 'AUTO' | 'CAR'>('CAR');

    useEffect(() => {
        const checkMobile = () => {
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            setIsMobile(isMobileDevice);
        };
        checkMobile();
    }, []);

    const handleAuthSuccess = () => {
        setIsAuthenticated(true);
    };

    const handleRideComplete = useCallback((ride: { pickup: string; destination: string; } & RideDetails) => {
        const newCompletedRide: CompletedRide = {
            ...ride,
            id: new Date().toISOString(),
            date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        };
        setRideHistory(prev => [newCompletedRide, ...prev]);
    }, []);

    const showToast = (message: string) => {
        setToastMessage(message);
    };

    if (!isAuthenticated) {
        return <AuthView onAuthSuccess={handleAuthSuccess} />;
    }

    const renderView = () => {
        switch (currentView) {
            case AppView.BOOKING:
                return <BookingView 
                    pickup={pickup}
                    setPickup={setPickup}
                    destination={destination}
                    setDestination={setDestination}
                    vehicle={vehicle}
                    setVehicle={setVehicle}
                    paymentMethods={paymentMethods}
                    rideHistory={rideHistory}
                    onRideComplete={handleRideComplete}
                    showToast={showToast}
                />;
            case AppView.CHAT:
                return <ChatBotView />;
            case AppView.EXPLORE:
                return <ExploreView />;
            case AppView.PAYMENT:
                return <PaymentView 
                            paymentMethods={paymentMethods} 
                            setPaymentMethods={setPaymentMethods} 
                            userProfilePhoto={userProfilePhoto}
                            setUserProfilePhoto={setUserProfilePhoto}
                        />;
            default:
                return <BookingView 
                    pickup={pickup}
                    setPickup={setPickup}
                    destination={destination}
                    setDestination={setDestination}
                    vehicle={vehicle}
                    setVehicle={setVehicle}
                    paymentMethods={paymentMethods}
                    rideHistory={rideHistory}
                    onRideComplete={handleRideComplete}
                    showToast={showToast}
                />;
        }
    };

    const NavItem: React.FC<{ view: AppView; label: string; icon: React.ReactNode }> = ({ view, label, icon }) => (
        <button
            onClick={() => setCurrentView(view)}
            className={`flex flex-col items-center justify-center w-full transition-colors duration-200 ${currentView === view ? 'text-blue-600' : 'text-gray-500'}`}
        >
            {icon}
            <span className="text-xs font-medium mt-1">{label}</span>
        </button>
    );

    return (
        <div className="h-screen w-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-2xl relative">
            {toastMessage && <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />}
            <header className="bg-white p-4 shadow-md z-10 flex items-center justify-center space-x-3">
                <LogoIcon className="w-8 h-8 text-gray-800"/>
                <h1 className="text-2xl font-bold text-gray-800">Rishi Booking App</h1>
            </header>
            
            <main className="flex-grow overflow-y-auto relative">
                <div key={currentView} className="animate-fade-in">
                    {renderView()}
                </div>
            </main>

            {isMobile && currentView === AppView.BOOKING && (
                 <button
                    onClick={() => setIsVoiceAssistantOpen(true)}
                    className="absolute bottom-24 right-5 z-30 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110 active:scale-95"
                    aria-label="Start Voice Assistant"
                >
                    <MicIcon className="w-7 h-7"/>
                </button>
            )}

            {isVoiceAssistantOpen && (
                <VoiceAssistant
                    setPickup={setPickup}
                    setDestination={setDestination}
                    setVehicle={setVehicle}
                    setCurrentView={setCurrentView}
                    onClose={() => setIsVoiceAssistantOpen(false)}
                />
            )}

            <footer className="bg-white w-full border-t border-gray-200 p-2 grid grid-cols-4 gap-2 shadow-up z-20">
                <NavItem view={AppView.BOOKING} label="Ride" icon={<RideIcon className="w-6 h-6"/>} />
                <NavItem view={AppView.EXPLORE} label="Explore" icon={<ExploreIcon className="w-6 h-6"/>} />
                <NavItem view={AppView.PAYMENT} label="Payment" icon={<WalletIcon className="w-6 h-6"/>} />
                <NavItem view={AppView.CHAT} label="Support" icon={<ChatIcon className="w-6 h-6"/>} />
            </footer>
        </div>
    );
};

export default App;
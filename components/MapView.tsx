
import React from 'react';

const MapView: React.FC = () => {
    return (
        <div className="absolute inset-0 w-full h-full">
            <img 
                src="https://picsum.photos/seed/basavakalyan/800/1200" 
                alt="Map of Basavakalyan" 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20"></div>
        </div>
    );
};

export default MapView;

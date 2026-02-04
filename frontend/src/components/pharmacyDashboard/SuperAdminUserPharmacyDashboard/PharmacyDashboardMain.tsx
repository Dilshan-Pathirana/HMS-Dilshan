import React, { useState } from 'react';
import PharmacySelector from './PharmacySelector';
import PharmacyInventoryManager from './PharmacyInventoryManager';

const PharmacyDashboardMain: React.FC = () => {
    const [selectedPharmacyId, setSelectedPharmacyId] = useState<number | null>(null);
    const [selectedPharmacyName, setSelectedPharmacyName] = useState<string>('');

    const handleSelectPharmacy = (pharmacyId: number | null, pharmacyName: string) => {
        setSelectedPharmacyId(pharmacyId);
        setSelectedPharmacyName(pharmacyName);
    };

    const handleBack = () => {
        setSelectedPharmacyId(null);
        setSelectedPharmacyName('');
    };

    if (selectedPharmacyId) {
        return (
            <PharmacyInventoryManager
                pharmacyId={selectedPharmacyId}
                pharmacyName={selectedPharmacyName}
                onBack={handleBack}
            />
        );
    }

    return (
        <PharmacySelector
            onSelectPharmacy={handleSelectPharmacy}
            selectedPharmacyId={selectedPharmacyId}
        />
    );
};

export default PharmacyDashboardMain;

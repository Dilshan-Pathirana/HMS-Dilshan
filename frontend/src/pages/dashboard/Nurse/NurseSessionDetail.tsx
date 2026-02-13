import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SessionDetailsPanel from '../../../components/dashboard/Sessions/SessionDetailsPanel';

const NurseSessionDetail: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();

    if (!sessionId) return <div>Invalid Session ID</div>;

    return (
        <div className="p-6">
            <SessionDetailsPanel
                sessionId={sessionId}
                onBack={() => navigate('/nurse-dashboard/sessions')}
                viewType="nurse"
            />
        </div>
    );
};

export default NurseSessionDetail;

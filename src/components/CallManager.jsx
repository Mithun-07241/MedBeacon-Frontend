import React from 'react';
import { useCallContext } from '@/context/CallContext';
import IncomingCallModal from './IncomingCallModal';
import { useLocation } from 'wouter';

export default function CallManager() {
    const { incomingCall, activeCall, callStatus } = useCallContext();
    const [, navigate] = useLocation();

    // Redirect to active call screen when call is accepted
    React.useEffect(() => {
        if (activeCall && callStatus === 'connecting') {
            navigate(`/call/${activeCall.callId}`);
        }
    }, [activeCall, callStatus, navigate]);

    return (
        <>
            {/* Incoming Call Modal */}
            {incomingCall && <IncomingCallModal />}
        </>
    );
}

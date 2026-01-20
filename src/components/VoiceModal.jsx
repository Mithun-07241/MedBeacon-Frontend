import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function VoiceModal({ isOpen, onClose }) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const { toast } = useToast();

    const startRecording = () => {
        setIsRecording(true);
        toast({
            title: "Voice Recording",
            description: "Listening... Speak clearly into your microphone",
        });

        // TODO: Implement actual voice recording with Web Audio API
        // TODO: Connect to ElevenLabs STT API
        // Simulate recording for now
        setTimeout(() => {
            setTranscript("I've been having headaches for the past two days...");
        }, 2000);
    };

    const stopRecording = () => {
        setIsRecording(false);
        // TODO: Process recorded audio and send to backend
        toast({
            title: "Processing",
            description: "Analyzing your message...",
        });

        // Simulate AI response
        setTimeout(() => {
            toast({
                title: "Response Ready",
                description: "Your health assistant has provided a response.",
            });
            onClose();
        }, 2000);
    };

    const sendMessage = () => {
        if (!transcript.trim()) return;

        // TODO: Send transcript to voice chat API
        toast({
            title: "Message Sent",
            description: "Your message has been processed.",
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="glass-card rounded-2xl max-w-md w-full text-center shadow-glass">
                <CardContent className="p-8">
                    <div className="mb-6">
                        <div className={`w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 ${isRecording ? 'voice-indicator' : ''
                            }`}>
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2zm0 18c4.42 0 8-3.58 8-8v-1h-2v1c0 3.31-2.69 6-6 6s-6-2.69-6-6v-1H4v1c0 4.42 3.58 8 8 8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            {isRecording ? 'Voice Assistant Active' : 'Voice Assistant'}
                        </h3>
                        <p className="text-gray-600">
                            {isRecording
                                ? 'Listening... Speak clearly into your microphone'
                                : 'Click to start voice conversation'
                            }
                        </p>
                    </div>

                    <div className="space-y-4">
                        {transcript && (
                            <div className="bg-gray-50 rounded-xl p-4 text-left">
                                <p className="text-sm text-gray-700">"{transcript}"</p>
                            </div>
                        )}

                        <div className="flex space-x-3">
                            {!isRecording ? (
                                <>
                                    <Button
                                        onClick={startRecording}
                                        className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
                                    >
                                        Start Recording
                                    </Button>
                                    <Button
                                        onClick={onClose}
                                        variant="outline"
                                        className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        onClick={stopRecording}
                                        variant="outline"
                                        className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        Stop Recording
                                    </Button>
                                    {transcript && (
                                        <Button
                                            onClick={sendMessage}
                                            className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                            </svg>
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

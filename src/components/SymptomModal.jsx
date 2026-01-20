import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';

export function SymptomModal({ isOpen, onClose }) {
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState('moderate');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const createSymptomMutation = useMutation({
        mutationFn: async (symptomData) => {
            await apiRequest('POST', '/api/symptoms', symptomData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/symptoms'] });
            toast({
                title: "Symptom Reported",
                description: "Your symptom has been recorded successfully.",
            });
            setDescription('');
            setSeverity('moderate');
            onClose();
        },
        onError: (error) => {
            if (isUnauthorizedError(error)) {
                toast({
                    title: "Unauthorized",
                    description: "You are logged out. Logging in again...",
                    variant: "destructive",
                });
                setTimeout(() => {
                    window.location.href = "/api/login";
                }, 500);
                return;
            }
            toast({
                title: "Error",
                description: "Failed to report symptom. Please try again.",
                variant: "destructive",
            });
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!description.trim()) {
            toast({
                title: "Missing Information",
                description: "Please describe your symptoms.",
                variant: "destructive",
            });
            return;
        }
        createSymptomMutation.mutate({ description: description.trim(), severity });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="glass-card rounded-2xl max-w-md w-full shadow-glass">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-800">Report Symptoms</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                Symptom Description
                            </Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                rows={3}
                                placeholder="Describe your symptoms..."
                            />
                        </div>

                        <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                Severity Level
                            </Label>
                            <div className="grid grid-cols-3 gap-2">
                                <label
                                    className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-colors ${severity === 'mild'
                                            ? 'border-accent bg-green-50'
                                            : 'border-gray-200 hover:border-accent'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="severity"
                                        value="mild"
                                        checked={severity === 'mild'}
                                        onChange={(e) => setSeverity(e.target.value)}
                                        className="sr-only"
                                    />
                                    <div className="text-center">
                                        <div className="w-4 h-4 bg-accent rounded-full mx-auto mb-1"></div>
                                        <span className="text-sm font-medium">Mild</span>
                                    </div>
                                </label>
                                <label
                                    className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-colors ${severity === 'moderate'
                                            ? 'border-warning bg-orange-50'
                                            : 'border-gray-200 hover:border-warning'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="severity"
                                        value="moderate"
                                        checked={severity === 'moderate'}
                                        onChange={(e) => setSeverity(e.target.value)}
                                        className="sr-only"
                                    />
                                    <div className="text-center">
                                        <div className="w-4 h-4 bg-warning rounded-full mx-auto mb-1"></div>
                                        <span className="text-sm font-medium text-warning">Moderate</span>
                                    </div>
                                </label>
                                <label
                                    className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-colors ${severity === 'severe'
                                            ? 'border-critical bg-red-50'
                                            : 'border-gray-200 hover:border-critical'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="severity"
                                        value="severe"
                                        checked={severity === 'severe'}
                                        onChange={(e) => setSeverity(e.target.value)}
                                        className="sr-only"
                                    />
                                    <div className="text-center">
                                        <div className="w-4 h-4 bg-critical rounded-full mx-auto mb-1"></div>
                                        <span className="text-sm font-medium">Severe</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="flex space-x-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createSymptomMutation.isPending}
                                className="flex-1 bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                            >
                                {createSymptomMutation.isPending ? 'Submitting...' : 'Submit'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

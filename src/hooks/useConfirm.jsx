
import { createContext, useContext, useState } from "react";
import { useSelector } from "react-redux";

const ConfirmContext = createContext();

export function ConfirmProvider({ children }) {
    const [options, setOptions] = useState(null);
    const validation = useSelector((state) => state.auth.validation);
    
    const confirm = (message, title = "Confirm Action", type = "Confirm", includeCancel = true, buttonText='Confirm') => {
        return new Promise((resolve) => {
            if (validation === false) {
                resolve(false);
                return;
            }
            setOptions({
                message,
                title,
                type,
                includeCancel,
                buttonText,
                resolve,
            });
        });
    };

    const handleClose = () => {
        options?.resolve(false);
        setOptions(null);
    };

    const handleConfirm = () => {
        options?.resolve(true);
        setOptions(null);
    };
    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {/* MODAL */}
            {options && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-[var(--background)] p-6 rounded shadow-lg w-80">
                        <h2 className="text-lg font-semibold mb-4">
                            {options.title}
                        </h2>

                        <p className="mb-6">{options.message}</p>

                        <div className="flex justify-end space-x-3">
                            {
                                options.includeCancel && (
                                    <button
                                        className="px-4 py-2 border border-[var(--color-border)] bg-[var(--button-bg)] rounded"
                                        onClick={handleClose}
                                    >
                                        Cancel
                                    </button>
                                )
                            }

                            <button
                                aria-label={options.buttonText}
                                className={`px-4 py-2 ${options.type === 'Error' ? 'bg-red-600' : 'bg-blue-600'} text-white rounded`}
                                onClick={handleConfirm}
                            >
                                {options.buttonText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    return useContext(ConfirmContext);
}

import React from 'react'

export default function BiometricUI({
    message,
    registring,
    startRegistration,
    cancelRegistration,
    deleteRegistration,
    biometricTemplate,
    saveRegistration,
    app
}) {
  return (
    <div className='flex flex-col h-full items-center justify-center'>
       {
            biometricTemplate && (
                <div className="ml-4 p-2 rounded">
                        <img
                            src={`data:image/png;base64,${biometricTemplate.base64Image}`}
                            alt="Biometric Template"
                            className="w-40 h-40 object-contain"
                        />
                        <div className="mt-2 font-bold flex gap-2 items-center justify-center text-center">
                            Score: 
                            <span className={`${biometricTemplate?.Quality>80?'text-green-500':'text-red-500'}`}>{biometricTemplate.Quality}%</span>
                        </div>
                </div>
            )
        }
       {
                registring ?
                <button onClick={cancelRegistration} className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
                    Stop Registration
                </button>:
                <button onClick={startRegistration} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                        Start Registration
                </button>
       }
       {
            <div className='flex gap-4 my-5'>
                {biometricTemplate &&
                    <button onClick={saveRegistration} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
                            Save Biometric Data
                    </button>
                }
            </div>
       }
       {
            message &&
            <p className="mt-4 text-sm text-gray-500">{message}</p>
       }
    </div>
  )
}

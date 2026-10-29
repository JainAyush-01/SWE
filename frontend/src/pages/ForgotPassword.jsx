import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100">
        <div className="text-center">
          <img 
            src="https://lnmiit.ac.in/wp-content/uploads/2023/07/cropped-LNMIIT-Logo-Transperant-Background-e1699342125845.png" 
            alt="LNMIIT Logo" 
            className="h-16 mx-auto mb-6 object-contain" 
          />
          <h2 className="text-3xl font-black text-[#e35205] uppercase tracking-tighter">Password Help</h2>
          <p className="mt-2 text-xs font-bold text-gray-400">Password recovery is handled by the LNMIIT Computer Centre.</p>
        </div>

        <div className="mt-8 space-y-5">
          <div className="bg-orange-50 border border-orange-100 text-orange-900 p-5 rounded-2xl text-sm leading-relaxed">
            Please contact the Computer Centre at <a className="font-black underline" href="mailto:cc@lnmiit.ac.in">cc@lnmiit.ac.in</a> with your institutional identity for password reset assistance.
          </div>
          <Link to="/" className="w-full inline-block text-center bg-gray-100 text-gray-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

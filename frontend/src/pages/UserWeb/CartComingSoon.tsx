import React from 'react';
import { ShoppingCart, Clock, Bell, ArrowLeft, Sparkles, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';

const CartComingSoon: React.FC = () => {
    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">
            <NavBar />
            
            <div className="flex-grow flex items-center justify-center px-4 py-16">
                <div className="max-w-2xl mx-auto text-center">
                    {/* Animated Icon Container */}
                    <div className="relative mb-8">
                        {/* Background glow effect */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-40 h-40 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
                        </div>
                        
                        {/* Main icon with animation */}
                        <div className="relative flex items-center justify-center">
                            <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-bounce">
                                <ShoppingCart className="w-16 h-16 text-white" />
                            </div>
                            
                            {/* Floating sparkles */}
                            <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-pulse" />
                            <Sparkles className="absolute -bottom-1 -left-4 w-6 h-6 text-emerald-400 animate-pulse delay-150" />
                        </div>
                    </div>
                    
                    {/* Main Content */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full text-emerald-700 font-medium text-sm">
                            <Clock className="w-4 h-4" />
                            <span>Under Development</span>
                        </div>
                        
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                            Online Shopping
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                                Coming Soon!
                            </span>
                        </h1>
                        
                        <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
                            We're working hard to bring you an amazing online shopping experience for 
                            <span className="font-semibold text-emerald-600"> Ayurvedic medicines</span> and 
                            <span className="font-semibold text-emerald-600"> health products</span>.
                        </p>
                        
                        {/* Feature highlights */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                    <Heart className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">Quality Products</h3>
                                <p className="text-sm text-gray-500">Authentic Ayurvedic medicines</p>
                            </div>
                            
                            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                    <ShoppingCart className="w-5 h-5 text-teal-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">Easy Ordering</h3>
                                <p className="text-sm text-gray-500">Simple checkout process</p>
                            </div>
                            
                            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                    <Bell className="w-5 h-5 text-cyan-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">Get Notified</h3>
                                <p className="text-sm text-gray-500">Be first to know when we launch</p>
                            </div>
                        </div>
                        
                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                            <Link 
                                to="/"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back to Home
                            </Link>
                            
                            <Link 
                                to="/doctor-schedule"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-emerald-600 font-semibold rounded-xl border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200"
                            >
                                Book Appointment
                            </Link>
                        </div>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="mt-16 pt-8 border-t border-gray-200">
                        <p className="text-gray-500 text-sm">
                            In the meantime, visit our centers or call us for your medicine needs.
                        </p>
                        <p className="text-emerald-600 font-semibold mt-2">
                            📞 Hotline: +94-740055513
                        </p>
                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default CartComingSoon;


import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';

const LocationPage: React.FC = () => {
  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-center mb-12 font-serif">Visit Us</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Map and Address */}
          <div>
            <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-lg mb-6">
              {/* Replace with a real Google Maps embed */}
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.250000000000!2d-122.419415!3d37.774929!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085808c5c5d0c7b%3A0x899f4f7d3d5f9f8c!2sSan%20Francisco%2C%20CA%2C%20USA!5e0!3m2!1sen!2s!4v1620000000000!5m2!1sen!2s"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                title="Shop Location"
              ></iframe>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-gold mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Address</h3>
                  <p className="text-gray-600">123 Coffee Bean Lane<br />San Francisco, CA 94102</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 text-gold mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Phone</h3>
                  <p className="text-gray-600">(123) 456-7890</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 text-gold mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Email</h3>
                  <p className="text-gray-600">hello@coffeecollective.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hours and Contact Form */}
          <div>
            <div className="bg-gray-50 p-8 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">Hours of Operation</h2>
              <div className="space-y-2 text-gray-700">
                <div className="flex justify-between"><span>Monday - Friday</span><span>7:00 AM - 6:00 PM</span></div>
                <div className="flex justify-between"><span>Saturday</span><span>8:00 AM - 5:00 PM</span></div>
                <div className="flex justify-between"><span>Sunday</span><span>8:00 AM - 3:00 PM</span></div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                  <input type="text" id="name" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gold focus:border-gold" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" id="email" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gold focus:border-gold" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea id="message" rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gold focus:border-gold"></textarea>
                </div>
                <button type="submit" className="w-full bg-navy text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPage;

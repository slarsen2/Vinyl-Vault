import { Disc3 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-charcoal py-6 text-cream/70 text-sm border-t border-amber/10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="relative w-8 h-8 vinyl-after mr-2">
              <div className="absolute inset-0 bg-burgundy rounded-full record-grooves"></div>
            </div>
            <span className="font-heading font-bold text-amber">VinylVault</span>
          </div>
          
          <div className="flex space-x-6">
            <a href="#" className="hover:text-amber transition-colors">About</a>
            <a href="#" className="hover:text-amber transition-colors">Privacy</a>
            <a href="#" className="hover:text-amber transition-colors">Terms</a>
            <a href="#" className="hover:text-amber transition-colors">Contact</a>
          </div>
          
          <div className="mt-4 md:mt-0">
            &copy; {new Date().getFullYear()} VinylVault. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

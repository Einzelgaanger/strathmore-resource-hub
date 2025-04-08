
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, FileText, Award, BarChart2, Share2, 
  BookOpenCheck, Users, TrendingUp, Clock 
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="py-16 bg-strathmore-blue">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center max-w-3xl leading-tight mb-6">
            Share, Learn, and Excel With Your Fellow Strathmore Students
          </h1>
          <p className="text-xl text-white/90 text-center max-w-2xl mb-8">
            A collaborative platform to share notes, assignments, and past papers while tracking your progress and earning points.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/login')}
            className="bg-strathmore-gold text-strathmore-dark hover:bg-strathmore-gold/90 px-8"
          >
            Get Started
          </Button>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Use myStrath?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<BookOpen className="h-12 w-12 text-strathmore-blue" />}
              title="Access Resources"
              description="Get class notes, assignments, and past papers all in one place."
            />
            
            <FeatureCard 
              icon={<Share2 className="h-12 w-12 text-strathmore-blue" />}
              title="Share Knowledge"
              description="Upload your study materials to help your classmates succeed."
            />
            
            <FeatureCard 
              icon={<Award className="h-12 w-12 text-strathmore-blue" />}
              title="Earn Points"
              description="Get rewarded for your contributions and climb the ranks."
            />
            
            <FeatureCard 
              icon={<Users className="h-12 w-12 text-strathmore-blue" />}
              title="Connect with Classmates"
              description="Discuss resources and assignments with your peers."
            />
            
            <FeatureCard 
              icon={<BarChart2 className="h-12 w-12 text-strathmore-blue" />}
              title="Track Progress"
              description="Monitor your performance across different units."
            />
            
            <FeatureCard 
              icon={<TrendingUp className="h-12 w-12 text-strathmore-blue" />}
              title="Improve Performance"
              description="Stay organized and never miss a deadline again."
            />
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <StepCard 
              number="1"
              title="Sign Up"
              description="Use your Strathmore admission number and default password to join."
            />
            
            <StepCard 
              number="2"
              title="Access Units"
              description="Browse your course units and available resources."
            />
            
            <StepCard 
              number="3"
              title="Share & Engage"
              description="Upload resources, comment, and mark assignments as complete."
            />
            
            <StepCard 
              number="4"
              title="Earn & Advance"
              description="Gain points for your contributions and climb the ranks."
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-strathmore-blue">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join your classmates today and start sharing resources, earning points, and improving your academic performance.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/login')}
            className="bg-strathmore-gold text-strathmore-dark hover:bg-strathmore-gold/90 px-8"
          >
            Get Started Now
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 bg-strathmore-dark text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">© {new Date().getFullYear()} myStrath - Strathmore University Resource Hub</p>
          <p className="text-sm text-white/70">Built by and for Strathmore University students.</p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

interface StepCardProps {
  number: string;
  title: string;
  description: string;
}

function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-center">
      <div className="w-12 h-12 bg-strathmore-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

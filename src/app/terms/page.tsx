"use client"

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function TermsOfServicePage() {
  return (
    <div className="container px-4 py-8 mx-auto max-w-3xl">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Link>

      <h1 className="text-3xl font-bold mb-6 text-foreground">Terms of Service</h1>

      <div className="prose dark:prose-invert text-muted-foreground space-y-4">
        <p>
          Welcome to AInformed! These Terms of Service ("Terms") govern your access to and use of the AInformed website, applications, and services (collectively, the "Service"). Please read these Terms carefully before using our Service.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-foreground">1. Acceptance of Terms</h2>
        <p>
          By accessing or using the Service, you agree to be bound by these Terms and by our Privacy Policy. If you do not agree to these Terms, you may not use the Service.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-foreground">2. Changes to Terms</h2>
        <p>
          We may modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-foreground">3. Use of Service</h2>
        <p>
          AInformed provides news and information related to Artificial Intelligence and technology. You agree to use the Service only for lawful purposes and in accordance with these Terms. You are responsible for all your activities in connection with the Service.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-foreground">4. Intellectual Property</h2>
        <p>
          All content and materials available on AInformed, including but not limited to text, graphics, website name, code, images, and logos are the intellectual property of AInformed and are protected by applicable copyright and trademark law. Any inappropriate use, including but not limited to the reproduction, distribution, display, or transmission of any content on this site is strictly prohibited, unless specifically authorized by AInformed.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-foreground">5. Disclaimers</h2>
        <p>
          The Service is provided on an "as is" and "as available" basis. AInformed makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties, including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights. Further, AInformed does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-foreground">6. Limitation of Liability</h2>
        <p>
          In no event shall AInformed or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on AInformed's website, even if AInformed or a AInformed authorized representative has been notified orally or in writing of the possibility of such damage.
        </p>

        {/* <h2 className="text-xl font-semibold mt-6 mb-2 text-foreground">7. Governing Law</h2>
        <p>
          These Terms are governed by and construed in accordance with the laws of [Your Jurisdiction] and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
        </p> */}
      </div>
    </div>
  );
} 